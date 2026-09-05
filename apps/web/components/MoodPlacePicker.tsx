"use client";

import { useEffect, useState } from "react";
import { LocateIcon, PinIcon } from "./Icons";
import { TextInput } from "./ui";
import { useI18n } from "@/lib/i18n";

export type PickedPlace = {
  placeName: string;
  address: string;
  city: string;
  zone: string;
  latitude: number | null;
  longitude: number | null;
};

type GeocodeHit = {
  placeName: string;
  address: string;
  city: string | null;
  zone: string | null;
  latitude: number;
  longitude: number;
};

function emptyPlace(): PickedPlace {
  return { placeName: "", address: "", city: "", zone: "", latitude: null, longitude: null };
}

function fromHit(hit: GeocodeHit): PickedPlace {
  return {
    placeName: hit.placeName,
    address: hit.address,
    city: hit.city ?? "",
    zone: hit.zone ?? "",
    latitude: hit.latitude,
    longitude: hit.longitude,
  };
}

export function MoodPlacePicker({
  value,
  onChange,
}: {
  value: PickedPlace | null;
  onChange: (next: PickedPlace | null) => void;
}) {
  const { messages } = useI18n();
  const [open, setOpen] = useState(Boolean(value));
  const [query, setQuery] = useState(value?.placeName ?? "");
  const [hits, setHits] = useState<GeocodeHit[]>([]);
  const [searching, setSearching] = useState(false);
  const [locating, setLocating] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [emptySearch, setEmptySearch] = useState(false);

  useEffect(() => {
    if (!open) return;
    const q = query.trim();
    if (q.length < 2) {
      setHits([]);
      setEmptySearch(false);
      return;
    }
    const t = window.setTimeout(() => {
      setSearching(true);
      fetch(`/geocode/search?q=${encodeURIComponent(q)}`)
        .then((r) => r.json())
        .then((d: { items?: GeocodeHit[] }) => {
          const items = d.items ?? [];
          setHits(items);
          setEmptySearch(items.length === 0);
        })
        .catch(() => {
          setHits([]);
          setEmptySearch(true);
        })
        .finally(() => setSearching(false));
    }, 350);
    return () => window.clearTimeout(t);
  }, [query, open]);

  function applyManual() {
    const name = query.trim();
    if (!name) {
      onChange(null);
      return;
    }
    onChange({
      placeName: name,
      address: value?.address && value.address !== value.placeName ? value.address : name,
      city: value?.city ?? "",
      zone: value?.zone ?? "",
      latitude: value?.latitude ?? null,
      longitude: value?.longitude ?? null,
    });
  }

  function locate() {
    if (!navigator.geolocation) {
      setGeoError(messages.world.moodLocationUnavailable);
      return;
    }
    setLocating(true);
    setGeoError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const lat = pos.coords.latitude;
        const lng = pos.coords.longitude;
        fetch(`/geocode/reverse?lat=${lat}&lng=${lng}`)
          .then((r) => r.json())
          .then((d: { place?: GeocodeHit }) => {
            const place = d.place
              ? fromHit(d.place)
              : {
                  ...emptyPlace(),
                  placeName: messages.world.moodUseMyLocation,
                  latitude: lat,
                  longitude: lng,
                };
            onChange(place);
            setQuery(place.placeName);
            setHits([]);
            setEmptySearch(false);
          })
          .catch(() => {
            const place: PickedPlace = {
              ...emptyPlace(),
              placeName: messages.world.moodUseMyLocation,
              latitude: lat,
              longitude: lng,
            };
            onChange(place);
            setQuery(place.placeName);
          })
          .finally(() => setLocating(false));
      },
      (err) => {
        setLocating(false);
        setGeoError(
          err.code === err.PERMISSION_DENIED
            ? messages.world.moodLocationDenied
            : messages.world.moodLocationUnavailable,
        );
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 30_000 },
    );
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex w-full items-center gap-2 rounded-2xl border border-dashed border-border px-4 py-3 text-left text-ink"
      >
        <PinIcon size={16} />
        <span>
          <span className="type-body-sm font-semibold">{messages.world.moodAddPlace}</span>
          <span className="type-caption mt-0.5 block text-subtle">{messages.world.moodAddPlaceHint}</span>
        </span>
      </button>
    );
  }

  return (
    <div className="rounded-2xl border border-border p-3">
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="type-label text-subtle">{messages.world.moodAddPlace}</p>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setQuery("");
            setHits([]);
            setGeoError(null);
            onChange(null);
          }}
          className="type-caption font-semibold text-muted"
        >
          {messages.world.moodLocationClear}
        </button>
      </div>
      <TextInput
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          if (!e.target.value.trim()) onChange(null);
        }}
        onBlur={applyManual}
        placeholder={messages.world.moodPlaceSearch}
      />
      <button
        type="button"
        onClick={locate}
        disabled={locating}
        className="tap-scale mt-2 inline-flex items-center gap-1.5 rounded-pill bg-accent-soft px-3 py-2 type-caption font-semibold text-accent disabled:opacity-50"
      >
        <LocateIcon size={14} />
        {locating ? messages.world.moodLocating : messages.world.moodUseMyLocation}
      </button>
      {geoError ? <p className="type-caption mt-2 text-danger">{geoError}</p> : null}
      {searching ? <p className="type-caption mt-2 text-subtle">{messages.common.loading}</p> : null}
      {!searching && emptySearch && query.trim().length >= 2 ? (
        <p className="type-caption mt-2 text-subtle">{messages.world.moodGeocodeEmpty}</p>
      ) : null}
      {hits.length > 0 ? (
        <ul className="mt-2 space-y-1">
          {hits.map((hit) => (
            <li key={`${hit.latitude}-${hit.longitude}-${hit.placeName}`}>
              <button
                type="button"
                onClick={() => {
                  const place = fromHit(hit);
                  onChange(place);
                  setQuery(place.placeName);
                  setHits([]);
                  setEmptySearch(false);
                }}
                className="flex w-full items-start gap-2 rounded-xl px-2 py-2 text-left hover:bg-surface-sunken"
              >
                <PinIcon size={14} />
                <span>
                  <span className="type-body-sm font-semibold text-ink">{hit.placeName}</span>
                  <span className="type-caption block text-muted">{hit.address}</span>
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {value?.placeName ? (
        <p className="type-caption mt-2 inline-flex items-center gap-1 rounded-pill bg-accent-soft px-2.5 py-1 font-semibold text-accent">
          <PinIcon size={12} />
          {value.placeName}
          {value.address && value.address !== value.placeName ? ` · ${value.address}` : ""}
        </p>
      ) : null}
    </div>
  );
}
