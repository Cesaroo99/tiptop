"use client";

import Link from "next/link";
import { SearchIcon } from "./Icons";
import { useI18n } from "@/lib/i18n";

export function SearchEntry({
  href = "/search",
  className,
  size = 18,
}: {
  href?: string;
  className?: string;
  size?: number;
}) {
  const { messages } = useI18n();
  return (
    <Link
      href={href}
      aria-label={messages.common.search}
      className={
        className ??
        "tap-scale grid h-12 w-12 shrink-0 place-items-center rounded-full bg-surface-sunken text-muted transition hover:brightness-95"
      }
    >
      <SearchIcon size={size} />
    </Link>
  );
}
