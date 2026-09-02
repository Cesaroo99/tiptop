# TipTop — design system

Famille unique : **Inter** (déjà chargée, latin, FR/EN, clair/sombre, mobile/desktop).

Ne pas multiplier les polices. Les tailles, poids, interlignages et tracking passent par des jetons, pas des valeurs hardcodées dans chaque écran.

## Typographie

| Jeton | Usage |
|---|---|
| `.type-display` | Célébration, très grand titre |
| `.type-h1` | Titre d’écran |
| `.type-h2` | Nom sur une carte |
| `.type-h3` | Sous-section |
| `.type-heading` | Rubrique |
| `.type-body-lg` | Corps ample |
| `.type-body` | Corps |
| `.type-body-sm` | Secondaire |
| `.type-caption` | Légende |
| `.type-label` | Label uppercase |
| `.type-button` | Bouton |
| `.type-nav` | Navigation |
| `.type-meta` | Métadonnées (dont temps de likes compact) |
| `.type-stat` | Capital temporel du profil |

## Couleur / espace / rayon / ombre

Variables CSS `:root` / `[data-theme="dark"]` : `--bg`, `--surface`, `--text`, `--text-secondary`, `--accent`, `--yellow`, `--success`, `--danger`, `--border`, `--space-*`, `--radius-card`, `--radius-pill`, `--shadow-card`.

Tailwind mappe `bg`, `surface`, `ink`, `muted`, `accent`, `rounded-card`, `rounded-pill`, `shadow-card`.

## Statistiques temporelles

Le capital (`8 ans 4 mois` + « de likes ») utilise `.type-stat`. Ce n’est pas un badge compteur.

## Animation

`.milestone-pop` : entrée courte (opacity + 8 px). Pas d’animation agressive.
