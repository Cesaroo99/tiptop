export function StatusDot({ status }: { status: string }) {
  const color =
    status === "ok"
      ? "bg-emerald-500"
      : status === "needs_config"
        ? "bg-amber-400"
        : status === "error"
          ? "bg-red-500"
          : "bg-zinc-400";
  const label =
    status === "ok"
      ? "OK"
      : status === "needs_config"
        ? "À configurer"
        : status === "error"
          ? "Erreur"
          : "Désactivé / hors stack";
  return (
    <span className="inline-flex items-center gap-1.5 text-xs">
      <span className={`h-2 w-2 rounded-full ${color}`} />
      {label}
    </span>
  );
}
