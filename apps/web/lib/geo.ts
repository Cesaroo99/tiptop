"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "./api";

export type ViewerCoords = { latitude: number; longitude: number };
export type GeoStatus = "idle" | "live" | "denied" | "unsupported";

/** GPS du visiteur pour calculer la distance « par rapport à moi ». */
export function useViewerGeo() {
  const [coords, setCoords] = useState<ViewerCoords | null>(null);
  const [status, setStatus] = useState<GeoStatus>("idle");

  const request = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setStatus("unsupported");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
        setCoords(next);
        setStatus("live");
        void api("/users/me", {
          method: "PATCH",
          body: JSON.stringify(next),
        }).catch(() => undefined);
      },
      () => setStatus("denied"),
      { enableHighAccuracy: true, maximumAge: 30_000, timeout: 8_000 },
    );
  }, []);

  useEffect(() => {
    request();
  }, [request]);

  return { coords, status, retry: request };
}
