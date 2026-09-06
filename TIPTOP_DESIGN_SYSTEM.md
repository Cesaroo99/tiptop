# TipTop — design system

Refonte visuelle complète (voir `UI_AUDIT.md` pour l'audit initial). Famille unique : **Inter** (déjà chargée, latin, FR/EN, clair/sombre, mobile/desktop). Ne pas multiplier les polices, ne pas hardcoder de valeurs dans les composants — tout passe par les jetons ci-dessous.

## Identité visuelle

Cyan TipTop (`--primary`) + jaune-vert d'accent (`--yellow`), chaleureux et humain plutôt que froid/SaaS. On ne copie ni Instagram, ni Facebook, ni Tinder : composants propres (badges de disponibilité à pastille, cartes respirantes, icônes trait fin cohérentes), emoji réservés aux moments expressifs (mood, envies, célébrations), jamais pour l'iconographie fonctionnelle (retour, chevron, partage → SVG).

## Typographie

| Jeton | Usage |
|---|---|
| `.type-display` | Célébration, très grand titre |
| `.type-h1` | Titre d'écran |
| `.type-h2` | Nom sur une carte / profil |
| `.type-h3` | Sous-section, titre de modale |
| `.type-h4` / `.type-heading` | Rubrique |
| `.type-body-lg` | Corps ample |
| `.type-body` | Corps |
| `.type-body-sm` | Secondaire |
| `.type-caption` | Légende |
| `.type-label` | Label uppercase (sections de menu) |
| `.type-button` | Bouton |
| `.type-nav` | Navigation |
| `.type-meta` | Métadonnées compactes |
| `.type-stat` | Capital temporel du profil |

## Couleurs

Variables CSS `:root` / `[data-theme="dark"]`, chacune avec une déclinaison claire et sombre distincte (pas un simple inversion noir/blanc) :

- **Surfaces** : `--bg`, `--surface`, `--surface-elevated` (modales/popovers), `--surface-sunken` (inputs, zones creuses).
- **Texte** : `--text`, `--text-secondary`, `--text-muted`, `--text-disabled`, `--text-on-primary`.
- **Marque** : `--primary` / `--primary-hover` / `--primary-active` / `--primary-soft`, `--yellow` / `--yellow-soft`.
- **Sémantique** : `--success` / `-soft`, `--warning` / `-soft`, `--danger` / `-soft`, `--info` / `-soft`.
- **Séparateurs** : `--border`, `--divider`, `--scrim` (fond de modale).

Tailwind mappe `bg`, `surface`, `surface-elevated`, `surface-sunken`, `ink`, `muted`, `subtle`, `disabled`, `on-primary`, `accent`/`primary` (+ `-hover`/`-active`), `success`, `warning`, `danger`, `info` (+ `-soft`), `border`, `divider`.

## Spacing, radius, ombres, motion

- **Spacing** : `--space-1` (4px) → `--space-20` (80px), alignés sur l'échelle Tailwind par défaut (§9 du brief).
- **Radius** : `--radius-sm` 8px, `--radius-md` 12px, `--radius-lg` 16px, `--radius-xl` 22px (= `--radius-card`), `--radius-pill` 999px.
- **Ombres** : `--shadow-xs`, `--shadow-sm`, `--shadow-card`, `--shadow-elevated` — toujours légères, jamais lourdes (§13).
- **Motion** : `--duration-fast` 120ms, `--duration-base` 200ms, `--duration-slow` 320ms, easing `--ease-standard`. Respecte `prefers-reduced-motion`.

## Composants (`components/ui.tsx`)

| Composant | Rôle |
|---|---|
| `PrimaryButton` | Action principale — un seul par écran/carte |
| `SecondaryButton` | Action secondaire (contour) |
| `GhostButton` | Action discrète (texte seul) |
| `DestructiveButton` | Suppression / déconnexion |
| `IconButton` | Action compacte iconique, `tone` neutral/accent/danger |
| `Chip` | Filtre, statut, onglet — `tone` neutral/success/warning/danger/info |
| `CardButton` + `NavChevron` | Ligne de menu avec chevron cohérent |
| `Modal` | Bottom sheet sur mobile (poignée, coins arrondis en haut), dialogue centré sur desktop ; option `danger` pour confirmations destructives |
| `EmptyState` | Icône + titre + corps + action, jamais un simple « Aucun résultat » |
| `Skeleton` / `CardSkeleton` | Squelette avec effet shimmer, `CardSkeleton` reproduit avatar + lignes + image |
| `TextInput` / `Field` | Champ avec label/helper/erreur cohérents |

`components/Icons.tsx` centralise le langage iconographique (stroke 1.8, tailles cohérentes) : flèches, chevrons, cœur, message, épingle, recherche, cloche, plus, check, calendrier, personnes, horloge, commentaire, étincelles, drapeau, envoi, image, micro, mallette.

`components/Avatar.tsx` : tailles nommées `xs` (24) / `sm` (32) / `md` (44) / `lg` (56) / `xl` (88), rétrocompatible avec une taille numérique.

`components/AvailabilityBadge.tsx` : badge unique (pastille + libellé) réutilisé partout — profil, feed, découverte, mood.

## Statistiques temporelles

Le capital (`8 ans 4 mois` + « de likes ») utilise `.type-stat` sur un fond dégradé subtil (`LikeCapital`). Ce n'est pas un badge compteur.

## Desktop

`AppShell` ajoute un rail secondaire (`DesktopRail`, `xl:` uniquement) pour éviter de centrer bêtement l'app mobile dans une grande page blanche (§13, §48).

## Tests

`components/*.test.tsx` (Vitest + Testing Library + jsdom) : `Avatar`, boutons/`Modal`/`Chip`/`IconButton` (`ui.test.tsx`), `AvailabilityBadge`, `Nav` (actif/cohérence), `EventCard` (hiérarchie CTA, badges de cycle de vie).
