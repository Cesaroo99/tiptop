"use client";

// Logo officiel TipTop (charte graphique fournie) : icône « atome » dégradé
// jaune → vert → cyan, wordmark Helvetica Bold en cyan #05C7F2. Les fichiers
// sont extraits directement de la charte (public/brand/tiptop-*.png), plutôt
// qu'une approximation dessinée à la main, pour rester fidèle au logo réel.
const ICON_RATIO = 682 / 728;
const LOCKUP_RATIO = 1867 / 728;

export function Logo({ size = 40, withWordmark = true }: { size?: number; withWordmark?: boolean }) {
  if (withWordmark) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src="/brand/tiptop-logo.png"
        alt="TipTop"
        height={size}
        width={Math.round(size * LOCKUP_RATIO)}
        style={{ height: size, width: "auto" }}
        draggable={false}
      />
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src="/brand/tiptop-icon.png"
      alt="TipTop"
      height={size}
      width={Math.round(size * ICON_RATIO)}
      style={{ height: size, width: "auto" }}
      draggable={false}
    />
  );
}
