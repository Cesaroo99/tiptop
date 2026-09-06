"use client";

import { useState, type ReactNode } from "react";
import { useI18n } from "@/lib/i18n";

const DEFAULT_LIMIT = 160;

export function ExpandableText({
  text,
  lead,
  rest,
  limit = DEFAULT_LIMIT,
  className = "type-body-sm mt-3 text-ink",
}: {
  text: string;
  lead?: string;
  rest?: string;
  limit?: number;
  className?: string;
}) {
  const { messages } = useI18n();
  const [open, setOpen] = useState(false);
  const long = text.length > limit;
  const body: ReactNode = lead ? (
    <>
      <span className="font-bold">{lead}</span>
      {rest ? ` ${rest}` : null}
    </>
  ) : (
    text
  );

  return (
    <div className={className}>
      <p className={long && !open ? "line-clamp-3" : undefined}>{body}</p>
      {long ? (
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="type-caption mt-1 font-semibold text-accent"
        >
          {open ? messages.social.seeLess : messages.social.seeMore}
        </button>
      ) : null}
    </div>
  );
}
