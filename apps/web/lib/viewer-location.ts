"use client";

import { useCallback, useEffect, useState } from "react";
import { cityCoords, findZone } from "@tiptop/domain";
import { api } from "./api";
import { ZONE_COORDS } from "./time";

export type LocationMode = "CURRENT" | "FIXED";
export type ViewerCoords = { latitude: number; longitude: number };
export type GeoStatus = "idle" | "live" | "denied" | "unsupported";

export type FixedPlace = {
  city: string;
  zone: string | null;
  latitude: number;
  longitude: number;
  label: string;
};

export type LocationState = {
  mode: LocationMode;
  fixed: FixedPlace | null;
};

const STORAGE_KEY = "tiptop.location.v1";

export function placeCoords(city?: string | null, zone?: string | null): ViewerCoords | null {
  const catalog = findZone(city, zone);
  if (catalog) return { latitude: catalog.latitude, longitude: catalog.longitude };
  if (zone && ZONE_COORDS[zone]) {
    return { latitude: ZONE_COORDS[zone].lat, longitude: ZONE_COORDS[zone].lng };
  }
  const cityPoint = cityCoords(city);
  if (cityPoint) return { latitude: cityPoint.lat, longitude: cityPoint.lng };
  return null;
}

export function parseLocationState(raw: string | null): LocationState {
  if (!raw) return { mode: "CURRENT", fixed: null };
  try {
    const parsed = JSON.parse(raw) as Partial<LocationState>;
    const mode = parsed.mode === "FIXED" ? "FIXED" : "CURRENT";
    const fixed =
      parsed.fixed &&
      Number.isFinite(parsed.fixed.latitude) &&
      Number.isFinite(parsed.fixed.longitude)
        ? parsed.fixed
        : null;
    return { mode: mode === "FIXED" && fixed ? "FIXED" : "CURRENT", fixed };
  } catch {
    return { mode: "CURRENT", fixed: null };
  }
}

export function serializeLocationState(state: LocationState): string {
  return JSON.stringify(state);
}

function readStored(): LocationState {
  if (typeof sessionStorage === "undefined") return { mode: "CURRENT", fixed: null };
  try {
    return parseLocationState(localStorage.getItem(STORAGE_KEY));
  } catch {
    return { mode: "CURRENT", fixed: null };
  }
}

function writeStored(state: LocationState) {
  try {
    localStorage.setItem(STORAGE_KEY, serializeLocationState(state));
  } catch {
    /* ignore quota */
  }
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("tiptop-location", { detail: state }));
  }
}

/**
 * Source unique : GPS réel (CURRENT) ou endroit figé (FIXED).
 * Pas de watchPosition — une lecture au besoin, pour la batterie.
 */
export function useViewerLocation(profile?: { city?: string | null; zone?: string | null }) {
  const [state, setState] = useState<LocationState>(() => readStored());
  const [gps, setGps] = useState<ViewerCoords | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");

  const requestGps = useCallback((persistProfile: boolean) => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setGps(next);
        setStatus("live");
        if (persistProfile) {
          void api("/users/me", {
            method: "PATCH",
            body: JSON.stringify(next),
          }).catch(() => undefined);
        }
      },
      () => setStatus((cur) => (cur === "live" ? cur : "denied")),
      { enableHighAccuracy: true, maximumAge: 60_000, timeout: 8_000 },
    );
  }, []);

  useEffect(() => {
    function onChange(event: Event) {
      const detail = (event as CustomEvent<LocationState>).detail;
      if (detail?.mode) setState(detail);
    }
    window.addEventListener("tiptop-location", onChange);
    return () => window.removeEventListener("tiptop-location", onChange);
  }, []);

  useEffect(() => {
    if (state.mode === "CURRENT") requestGps(true);
  }, [requestGps, state.mode]);

  useEffect(() => {
    function onVisible() {
      if (document.visibilityState === "visible" && state.mode === "CURRENT") {
        requestGps(true);
      }
    }
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [requestGps, state.mode]);

  const setFixed = useCallback((place: FixedPlace) => {
    const next = { mode: "FIXED" as const, fixed: place };
    setState(next);
    writeStored(next);
  }, []);

  const useCurrent = useCallback(() => {
    const next = { mode: "CURRENT" as const, fixed: state.fixed };
    setState(next);
    writeStored(next);
    requestGps(true);
  }, [requestGps, state.fixed]);

  const fallback = placeCoords(profile?.city, profile?.zone);
  const origin: ViewerCoords | null =
    state.mode === "FIXED" && state.fixed
      ? { latitude: state.fixed.latitude, longitude: state.fixed.longitude }
      : gps ?? fallback;

  const label =
    state.mode === "FIXED" && state.fixed
      ? state.fixed.label
      : status === "live"
        ? null
        : [profile?.city, profile?.zone].filter(Boolean).join(" - ") || null;

  return {
    mode: state.mode,
    origin,
    gps,
    status,
    label,
    fixed: state.fixed,
    setFixed,
    useCurrent,
    retry: () => requestGps(state.mode === "CURRENT"),
  };
}
