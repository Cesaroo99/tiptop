# TipTop — événements

Référence complète : `TIPTOP_USER_FLOWS.md` (parcours 4-5), `TIPTOP_SCREEN_MATRIX.md` (S15-S21).

## Cycle de vie

`eventLifecycle(startsAt, endsAt, now)` (domaine, nouveau) :

- `upcoming` → compte à rebours (`eventCountdown`, déjà existant) : jours / heures / minutes.
- `ongoing` → badge « En cours » (`endsAt` explicite, sinon +3 h estimées).
- `ended` → badge « Terminé ».

Affiché sur `EventCard` : le badge « En cours »/« Terminé » remplace le compte à rebours une fois la fenêtre entamée. Aucune donnée inventée : si `endsAt` est absent, on utilise une estimation documentée (+3 h), jamais une valeur arbitraire cachée.

## Réservation vs participation

- Événement **avec réservation** (`requiresReservation`) : CTA « Réserver ».
- Événement **sans réservation** : CTA « Intéressé »/« Plus intéressé » (RSVP léger), jamais un faux bouton « Réserver ».
- Le nombre de participants (`reservedCount`, `interestedCount`) distingue les deux compteurs — jamais fusionnés.

## Mini-carte

`MapThumb` (existant) affiche une carte approximative (ville/zone), jamais de coordonnées exactes sur la vignette. La carte pleine page reste dans le détail de l'événement, avec la même règle de confidentialité que `TIPTOP_PRIVACY.md`.

## Retours / témoignages

Le système d'avis (`EventReview`, `TIPTOP_TESTING.md` G22) reste inchangé dans cette phase : avis texte, fenêtre d'ouverture 24 h après la fin de l'événement, un avis par personne et par sortie.
