# TipTop — Audit UI (avant refonte visuelle)

Base : branche `cursor/tiptop-social-experience-5897`. Périmètre : `apps/web`.

Légende gravité : 🔴 élevée · 🟠 moyenne · 🟡 mineure.

| # | Problème | Écran(s) | Gravité | Recommandation | Composant concerné |
|---|---|---|---|---|---|
| 1 | Boutons hétérogènes : certains `<button className="rounded-pill bg-accent ...">` en ligne, d'autres via `PrimaryButton`, tailles/paddings variables (`px-4 py-2`, `px-5 py-3`, `py-3.5`) | Profil, PostCard, EventCard, WishList, People, Invitations | 🔴 | Créer un composant `Button` à variantes (primary/secondary/ghost/destructive) + tailles, migrer les CTA principaux | `ui.tsx` |
| 2 | Disponibilité affichée différemment selon l'écran (texte simple vs badge vs emoji brut) | Profil, `/people` (déjà un badge), `AppHeader` (pill bouton) | 🟠 | Un seul composant `AvailabilityBadge` (existe déjà partiellement) généralisé partout | `AvailabilityBadge.tsx` |
| 3 | Icônes mélangées : SVG dessinées à la main (Nav, AppHeader) + caractères Unicode bruts (`←`, `›`, `✓`, `▾`, `↗`) pour la même fonction (retour, chevron) | `ScreenHeader`, profil (liens « Tous voir »), `EventCard` (partage) | 🟠 | Centraliser une petite librairie `Icons.tsx` dans le même style stroke que Nav/AppHeader, remplacer les caractères Unicode fonctionnels (pas les emoji expressifs) | Nouveau `Icons.tsx` |
| 4 | Cartes à ombre/radius incohérents : certaines `rounded-card shadow-card`, d'autres `rounded-2xl` sans ombre, d'autres `rounded-[28px]` en dur | PostCard, MoodCard (mood/page.tsx), People (carte swipe), Notifications | 🟠 | Radius scale à 4 paliers (`sm/md/lg/xl`) + une seule échelle d'ombre | `globals.css`, `tailwind.config.js` |
| 5 | Palette incomplète : pas de `primary-hover/active`, pas de `surface-elevated`, pas de `warning`/`info`, pas de `text-muted` distinct de `text-secondary` | `globals.css` | 🔴 | Étendre la palette complète (voir design tokens) | `globals.css` |
| 6 | Skeletons génériques (rectangle uni) ne reproduisent pas la structure réelle (avatar + lignes) | Home, Profil, Discovery | 🟡 | Skeletons composés (avatar rond + lignes) pour feed/profil | `ui.tsx` (`Skeleton`) |
| 7 | Empty states très sobres (titre + corps), pas d'icône, ok fonctionnellement mais visuellement pauvres | Envies, Invitations, Découverte, Recherche | 🟡 | Ajouter une icône illustrative légère (SVG, pas d'image lourde) | `ui.tsx` (`EmptyState`) |
| 8 | Modale = un seul style pour dialogues de confirmation ET bottom sheets ; pas de poignée visuelle sur mobile, coins carrés en haut | Toutes les modales (`LikeDialogs`, `ReportModal`, `SocialInviteModal`, confirmation déconnexion) | 🟠 | Ajouter une poignée (drag handle) + coins arrondis uniquement en haut sur mobile, dialogue centré sur desktop | `ui.tsx` (`Modal`) |
| 9 | Notifications : ligne dense (avatar + texte + heure) sans hiérarchie claire icône/titre/description | `/notifications` | 🟡 | Restructurer en icône de type + titre + description + heure aligné | `notifications/page.tsx` |
| 10 | Header/CTA de compte à rebours événement en `bg-yellow` toujours, même quand l'événement est en cours ou terminé (avant l'ajout de `eventLifecycle`) | `EventCard` | 🟡 (déjà partiellement corrigé) | Vérifier cohérence couleur badge selon phase | `EventCard.tsx` |
| 11 | Boutons « Réserver »/« Inviter »/« Rejoindre » ont parfois le même poids visuel que des actions secondaires (« Partager », « Signaler ») sur la même ligne | PostCard, EventCard, profil | 🟠 | Un seul CTA primaire par carte, le reste en `ghost`/`icon button` | Cards |
| 12 | Formulaires (compose, wishes, settings) : inputs corrects mais pas de helper/erreur visuellement distincts, pas de focus state renforcé | Compose, WishList (formulaire ajout), Onboarding | 🟡 | Ajouter des styles `:focus`, erreur, succès cohérents | `TextInput` |
| 13 | Densité desktop : le contenu reste centré en `max-w-lg` même sur grand écran, sidebar simple sans vraie mise en page à colonnes | `AppShell` | 🟠 | Conserver la colonne principale mais ajouter un rail secondaire discret sur desktop large (`xl:`) pour éviter l'effet « app mobile étirée » | `AppShell.tsx` |
| 14 | Dark mode fonctionnel (tokens déjà séparés) mais palette pas assez riche : `surface` unique pour carte ET modale ET nav, pas de niveau « élevé » distinguable | Global | 🟠 | `--surface-elevated` distinct pour modales/popovers | `globals.css` |
| 15 | Aucune transition/micro-interaction sur les CTA (pression bouton, envoi réussi) hors la modale palier likes | Global | 🟡 | Ajouter un état `:active` (scale léger) au composant `Button`, toasts courts pour confirmations | `ui.tsx` |
| 16 | Avatar : une seule prop `size` en pixels, pas de tailles nommées standard, utilisé avec des valeurs différentes un peu partout (36, 40, 44, 56, 88) sans grille claire | `Avatar.tsx` et tous ses usages | 🟡 | Ajouter des presets `xs/sm/md/lg/xl` documentés, garder la prop numérique pour compat | `Avatar.tsx` |
| 17 | Ticket (`/tickets/:id`) : présentation correcte (`ticket-stub`) mais sans vraie hiérarchie « marque / événement / date / heure / lieu / QR » alignée en colonne premium | Ticket détail | 🟡 | Restructurer en bloc vertical centré, séparateur en pointillé | Écran ticket |

## Constats transverses positifs (à conserver)

- Le concept `AvailabilityBadge`, `LikeCapital`, `type-*` (typographie) posés dans les phases précédentes sont une bonne base — cette refonte les **étend**, ne les remplace pas.
- Les couleurs de marque (`--accent` cyan, `--yellow`) sont déjà distinctives et évitent le bleu Facebook / rose Instagram — à conserver et enrichir, pas à changer.
- Le pattern `Modal` bottom-sheet-sur-mobile / centré-sur-desktop existe déjà en germe (`items-end sm:items-center`) — à renforcer visuellement, pas à réinventer.

## Priorisation retenue pour cette refonte

1. Design tokens complets (couleurs, radius, ombres, motion) — base de tout le reste.
2. Primitives (`Button`, `Badge/Chip`, `Icons`, `Avatar`, `Modal`, `Toast`, `Skeleton`, `EmptyState`).
3. Navigation (Nav, AppHeader, SideNav, ScreenHeader).
4. Écrans à fort trafic : Profil, Feed (Post/Event/Mood), Découverte.
5. Invitations, Envies, Messagerie, Notifications, Booking/Tickets.
6. Dark mode, responsive desktop, micro-interactions, accessibilité, tests.

## Résolution (fin de refonte)

| # | Statut | Résolution |
|---|---|---|
| 1 | ✅ Résolu | `PrimaryButton`/`SecondaryButton`/`GhostButton`/`DestructiveButton`/`IconButton` centralisés dans `ui.tsx`, appliqués aux CTA des cartes principales et écrans à fort trafic |
| 2 | ✅ Résolu | `AvailabilityBadge` généralisé (profil, découverte, header) |
| 3 | ✅ Résolu | `components/Icons.tsx` remplace les caractères Unicode fonctionnels (retour, chevrons, partage, cœur, commentaire, calendrier) ; emoji conservés pour le contenu expressif (mood, envies) |
| 4 | ✅ Résolu | Échelle de radius (`sm/md/lg/xl/card/pill`) et d'ombre (`xs/sm/card/elevated`) centralisée dans les jetons |
| 5 | ✅ Résolu | Palette complète (`primary`/`-hover`/`-active`, `surface`/`-elevated`/`-sunken`, texte à 4 niveaux, `warning`/`info`) |
| 6 | ✅ Résolu | `CardSkeleton` (avatar + lignes + image) utilisé sur feed, événements, tickets, notifications |
| 7 | ✅ Résolu | `EmptyState` accepte une icône ; utilisé sur envies, invitations, notifications |
| 8 | ✅ Résolu | `Modal` : poignée sur mobile, coins arrondis en haut uniquement, dialogue centré sur desktop, option `danger` |
| 9 | ✅ Résolu | Notifications restructurées : icône de type superposée à l'avatar, titre/description/heure alignés |
| 10 | ✅ Résolu | Badge de cycle de vie (`eventLifecycle`) cohérent : à venir (jaune) / en cours (vert) / terminé (gris) |
| 11 | ✅ Résolu | Un seul CTA primaire par carte (profil, événement, post) ; actions secondaires en `IconButton` |
| 12 | ✅ Résolu | `TextInput`/`Field` avec focus/erreur/helper cohérents |
| 13 | ✅ Résolu | `DesktopRail` (rail secondaire `xl:`) évite l'app mobile centrée sur grand écran |
| 14 | ✅ Résolu | `--surface-elevated` distinct pour modales/popovers |
| 15 | ✅ Résolu | Classe `.tap-scale` (pression bouton), `Modal` de confirmation « Invitation envoyée » sans fermeture immédiate |
| 16 | ✅ Résolu | `AVATAR_SIZES` nommées (`xs/sm/md/lg/xl`), rétrocompatible |
| 17 | ✅ Résolu | Ticket restructuré : en-tête marque, hiérarchie verticale, séparateur pointillé avant le QR |

Vérification navigateur : desktop large, mobile 390px, light/dark — aucun débordement, aucun texte coupé, contrastes vérifiés (voir historique de session).
