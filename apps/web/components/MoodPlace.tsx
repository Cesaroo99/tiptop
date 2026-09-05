"use client";

import { mapsDirectionsUrl, moodHasPlace, moodPlaceLabel, osmBrowseUrl } from "@tiptop/domain";
import { DirectionsIcon, PinIcon } from "./Icons";
import { MapThumb } from "./MapThumb";
import { Modal, SecondaryButton } from "./ui";
import { useI18n } from "@/lib/i18n";

export type MoodPlaceFields = {
  placeName?: string | null;
  address?: string | null;
  city?: string | null;
  zone?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  placeLabel?: string | null;
};

export function moodPlaceFromItem(mood: MoodPlaceFields): MoodPlaceFields | null {
  if (!moodHasPlace(mood) && !mood.placeLabel) return null;
  return mood;
}

/** Pastille lieu façon TikTok — n'apparaît que si l'auteur a choisi un lieu. */
export function MoodPlaceChip({
  place,
  onOpen,
  tone = "overlay",
}: {
  place: MoodPlaceFields;
  onOpen: () => void;
  tone?: "overlay" | "surface";
}) {
  const label = place.placeLabel || moodPlaceLabel(place);
  if (!label) return null;
  const overlay = tone === "overlay";
  return (
    <button
      type="button"
      onClick={onOpen}
      className={`tap-scale inline-flex max-w-full items-center gap-1.5 rounded-pill px-3 py-1.5 shadow-sm backdrop-blur-sm ${
        overlay ? "bg-black/45 text-white" : "bg-surface-sunken text-ink"
      }`}
      aria-label={label}
    >
      <PinIcon size={13} />
      <span className="type-caption truncate font-semibold">{label}</span>
    </button>
  );
}

/** Feuille carte + itinéraire — l'utilisateur peut suivre le lieu hors de TipTop. */
export function MoodPlaceSheet({
  place,
  open,
  onClose,
}: {
  place: MoodPlaceFields | null;
  open: boolean;
  onClose: () => void;
}) {
  const { messages } = useI18n();
  if (!place) return null;
  const label = place.placeLabel || moodPlaceLabel(place);
  const directions = mapsDirectionsUrl(place);
  const osm = osmBrowseUrl(place);

  function go() {
    const url = directions || osm;
    if (!url) return;
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <Modal open={open} title={messages.world.moodPlaceSheetTitle} onClose={onClose}>
      <div className="space-y-3">
        <p className="type-h4 text-ink">{label}</p>
        {place.address ? <p className="type-body-sm text-muted">{place.address}</p> : null}
        {!place.address && (place.zone || place.city) ? (
          <p className="type-body-sm text-muted">
            {[place.zone, place.city].filter(Boolean).join(" · ")}
          </p>
        ) : null}
        <button
          type="button"
          onClick={() => {
            if (osm) window.open(osm, "_blank", "noopener,noreferrer");
            else go();
          }}
          className="block w-full overflow-hidden rounded-xl"
          aria-label={messages.world.moodOpenMap}
        >
          <MapThumb
            city={place.city}
            zone={place.zone}
            lat={place.latitude}
            lng={place.longitude}
            className="h-40 w-full border-0"
          />
        </button>
        {directions || osm ? (
          <SecondaryButton onClick={go}>
            <span className="inline-flex items-center justify-center gap-2">
              <DirectionsIcon size={15} />
              {messages.world.moodDirections}
            </span>
          </SecondaryButton>
        ) : null}
      </div>
    </Modal>
  );
}
