import type { ReactNode } from "react";

/**
 * TipTop est un produit téléphone. Sur un vrai mobile, l'écran est plein cadre.
 * Sur desktop, l'app vit dans un iPhone 390×844 agrandi pour remplir la fenêtre :
 * même navigation, mêmes gestes — pas un site à trois colonnes.
 */
export function PhoneStage({ children }: { children: ReactNode }) {
  return (
    <div className="phone-stage">
      <div className="phone-glow" aria-hidden />
      <div className="phone-frame">
        <div className="phone-device" data-phone-device>
          <div className="phone-island" aria-hidden />
          <div className="phone-screen">{children}</div>
          <div className="phone-home-bar" aria-hidden />
        </div>
      </div>
    </div>
  );
}
