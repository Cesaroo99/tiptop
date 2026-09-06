"use client";

import { useState } from "react";
import type { PersonCard } from "@/lib/api";
import { NearbyPersonCard } from "./NearbyPersonCard";
import { PersonSwipeDeck } from "./PersonSwipeDeck";

export function FeedPeopleDeck({
  people,
  onChanged,
}: {
  people: PersonCard[];
  onChanged?: (next: PersonCard) => void;
}) {
  const [index, setIndex] = useState(0);
  if (!people.length) return null;
  const safeIndex = Math.min(index, people.length - 1);

  return (
    <PersonSwipeDeck
      items={people}
      index={safeIndex}
      onIndexChange={setIndex}
      peekSrc={(p) => p.avatarUrl}
    >
      {(person) => <NearbyPersonCard person={person} onChanged={onChanged} />}
    </PersonSwipeDeck>
  );
}
