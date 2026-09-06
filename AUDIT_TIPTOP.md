# AUDIT TIPTOP — lancement

Document d’audit produit / technique. Il **ne redéfinit pas** TipTop.
Hiérarchie appliquée : décisions déjà validées (`TIPTOP_PRODUCT_DECISIONS.md` D01–D38) → philosophie TipTop → ce prompt de lancement → jugement technique.

Date : 6 septembre 2026.
Socle audité : `main` / `dc8988d` (fil mixte + libellé « vie »).

---

## EXISTANT ET FONCTIONNEL

À **préserver**. Ne pas réécrire, ne pas déplacer « pour rendre plus accessible ».

### Architecture

- Monorepo pnpm : `apps/web` (Next 15), `apps/api` (Nest + Prisma), `packages/domain`, `packages/i18n`.
- Auth téléphone + OTP. Compte démo César `+237 695 21 47 85` / OTP `1234` / `cesar_memoli` (admin). Décision D04 / D31.
- Session cookie `tiptop_session` + Bearer. Rôles USER / MODERATOR / ADMIN.
- Prod Render (`render.yaml`, Docker, Postgres). APK servi par le même host.

### Navigation et UI (D01, D13, D33)

- Tabs : Home / Mood / Compose / Amies / Events. Profil hors tab (menu).
- Home = fil social mixte (`apps/web/lib/feed-mix.ts`) : publications, événements, personnes, vidéos mood.
- Hub Events = gestion / découverte d’événements — distinct du Home.
- Design system existant (`TIPTOP_DESIGN_SYSTEM.md`) et maquettes `docs/mockups/`.

### Moods (D18)

- Page `/mood` : expérience vidéo verticale immersive (swipe, like/vie, commentaires, partage, follow créateur, profil).
- STATUS = pastilles 24 h sur l’accueil. MOOD = reels vidéo. Lien événement **facultatif**.
- Le profil a déjà un onglet Moods dans son architecture actuelle — **ne pas en ajouter d’autres ailleurs**, ne pas transformer le profil en galerie.

### Profil

- Identité, bio, intérêts, activités, relations, éléments personnels.
- Architecture déjà définie — **conservée**.

### Relations (D09)

- Follow unidirectionnel.
- Contact / ami avec acceptation.
- InviteLater, SocialInvite, Invitation événement.
- Blocage et signalement.

### Disponibilité (D10)

- HIDDEN / BUSY / AVAILABLE — contrôle utilisateur.

### « Ce que je veux » (D37)

- Envies (`Wish`) distinctes des Need / offres locales. Pas une marketplace.

### Invitations

- Événement, sortie sociale, groupe. Le système existant est assez flexible — pas de nouvelles catégories artificielles.

### Événements et billetterie (D20–D24)

- Création, édition, publication, gestion hôte, participants, groupes.
- Réservation : gratuit → tickets `CONFIRMED` (0 $). Payant → `AWAITING_PAYMENT` puis paiement.
- QR HMAC, consommation atomique, scan hôte, fenêtre d’entrée.
- Check-in : `UPDATE … WHERE status = CONFIRMED AND consumedAt IS NULL`.

### Paiements (D25)

- **Mock volontaire** : `mockCharge` + ports CARD / Orange Money / MoMo.
- Webhooks idempotents (`idempotencyKey`).
- Ledger XAF distinct du ledger « vie » (likes).
- Remboursement admin mock (total / partiel).

### Messagerie (D26)

- 1:1, groupes, médias, lecture, blocage, signalement, invitations dans le fil.

### Notifications (D27)

- In-app. Push = architecture no-op (volontaire).

### Administration (D30)

- Users (certify / block), posts hide, events cancel, payments refund, likes anomalies, reports.
- `POST /admin/repair-schema` (filet prod, staff only).

### Privacy / localisation (D11)

- Précision exact / zone / ville / masqué. Pas d’exposition GPS temps réel automatique.

---

## EXISTANT MAIS À CORRIGER

| Sujet | Problème | Gravité | Action cette itération |
| --- | --- | --- | --- |
| Commission TipTop | Aucune constante centrale. Risque de hardcoder 0 % partout plus tard. | Produit / lancement | **Corrigé** : `TIPTOP_PLATFORM_FEE_PERCENT` + `AppConfig` |
| Admin monétisation | Pas d’écran commission / distinction prix billet vs frais vs commission | Produit | **Corrigé** : Admin → Paiements |
| Webhook `POST /payments/webhook` | Aucune auth : un idempotencyKey connu permet de confirmer un paiement (IDOR) | Sécu | **Corrigé** : secret requis en production |
| Uploads `/upload/video` et `/upload/chat` | Aucune session | Sécu | **Corrigé** : session obligatoire |
| CGU `/terms` | Texte encore « likes » alors que le produit dit « vie » | Cohérence | **Corrigé** |
| Refund admin | Change le statut Payment, ne void pas les tickets | Produit | Documenté, **non modifié** (mock D25, éviter de casser les billets démo) |
| Cancel event | Ne rembourse pas automatiquement | Produit | Conservé (décision implicite mock) |
| OTP mock en prod | `OTP_ALLOW_MOCK` volontaire pour la démo téléphone | Sécu / démo | **Conservé** (D31 + `TIPTOP_ENVIRONMENT.md`) |
| `SESSION_SECRET` défaut `dev-only-secret` | Dangereux si oublié en prod | Sécu | Documenté — ne pas casser le local |
| CORS `origin: true` | Permissif | Sécu | Documenté, pas de changement à l’aveugle |
| Reports ACTIONED | Ne masque pas moods / messages | Modération | Restant |
| Follow | API + Mood « Suivre », compteurs profil incomplets | Produit | Restant (ne pas inventer une UI profil) |
| Analytics produit | Aucun événement mesurable structuré | Lancement | Restant (architecture à préparer, pas un produit IA) |

---

## MANQUANT

### Requis par ce prompt et **compatibles** avec les décisions existantes

- Configuration centrale de commission (0 %, administrable, auditée).
- Distinction prix du billet / frais prestataire / commission TipTop.
- Admin → Monétisation / Paiements.
- Durcissement webhook et uploads.

### Requis par ce prompt mais **en conflit ou hors phase** — ne pas inventer

| Manque | Pourquoi on ne le livre pas maintenant |
| --- | --- |
| Vrai PSP (Stripe, OM, MoMo live) | D25 : mock jusqu’à décision fondateur + contrats. Inventer un PSP casserait D25. |
| Commission > 0 % | Interdit en phase initiale. |
| Moods « partout » (sections sur chaque écran) | Contredit D13 / D18 et l’architecture profil. |
| Galerie Moods supplémentaire sur le profil | Le profil a déjà sa structure. |
| Suppression de compte (`deletedAt` inutilisé) | Jamais spécifié en détail. À faire avec un juriste / CGU. |
| SMS OTP réel | Adaptateur prévu, provider non choisi. |
| Push réel | D27 no-op volontaire. |
| IA recommandations / anti-spam | Non nécessaire au lancement. |
| Admin Moods dédié (hide) | `Mood` n’a pas `hiddenAt`. Ajouter une colonne + filtres partout est trop invasif pour ce tour. Les signalements MOOD existent déjà. |

---

## CONFLIT POTENTIEL AVEC LES SPÉCIFICATIONS PRÉCÉDENTES

Voir **CONFLICT REVIEW** ci-dessous.

Les plus importants :

1. **Paiements réels vs mock (D25)** — ce prompt dit « le paiement du billet DOIT fonctionner ». L’existant fait payer le **prix du billet** via mock (0 $ si gratuit, montant sinon). Un vrai PSP n’a jamais été validé. **On conserve le mock** et on rend le fonctionnement du billet + la commission 0 % explicites.
2. **Moods partout** — intention = découvrabilité contextuelle (déjà : fil mixte, page Moods, onglet profil existant). **Pas** de nouvelles galeries.
3. **OTP mock prod** — ce prompt pousse la sécu ; D31 + environnement imposent le code 1234 pour la démo téléphone. **On conserve**.
4. **Analytics / IA** — préparer plus tard, ne pas inventer un produit.

---

## RECOMMANDATIONS

1. **Lancer** avec le mock de paiement documenté, commission 0 % configurable, parcours social + billet QR opérationnels.
2. **Avant un vrai argent** : choisir le PSP, brancher les ports déjà prévus, secret webhook, void tickets au refund, CGU juridiques.
3. **Ne pas** élargir le Home, le Mood ou le Profil « pour tout mettre partout ».
4. **Suivre** le filet schéma (`ensure-schema`) : les 500 prod venaient de colonnes manquantes, pas d’un manque de features.

---

## CONFLICT REVIEW

| Élément | Existant | Nouvelle demande | Conflit ? | Décision |
| --- | --- | --- | --- | --- |
| Structure du feed Home | Fil mixte validé (posts, events, people, moods vidéo) | Feed vivant / diversifié | Non | **Conserver** la structure. L’intelligence du mix existe déjà. |
| Page Moods | Immersion verticale `/mood` | Même chose | Non | **Conserver**. |
| Moods « partout » | Moods déjà dans le fil + page dédiée + onglet profil | Découvrabilité | Oui si pris à la lettre | **Intention** : déjà satisfaite. Pas de nouvelles sections Moods. |
| Profil | Architecture identité / activités / relations + onglet Moods existant | Ne pas transformer en galerie | Non | **Préserver** le profil. |
| Follow vs ami | D09 implémenté | Même distinction | Non | **Conserver**. |
| Envies / wishlist | D37 Wish ≠ Need | Préserver si existe | Non | **Conserver**. |
| Paiement billet | Mock D25, montant = `price × seats`, gratuit = 0 | « Le paiement DOIT fonctionner » + 0 $ si gratuit | Apparent | **Le mock EST le paiement v1.** On ne branche pas Stripe. On documente et on garde le flux. |
| Commission 0 % | Absente (donc 0 de facto) | Constante centrale + admin | Non | **Ajouter** la config. Ne pas hardcoder 0 partout. |
| Commission future > 0 | — | Admin pourra modifier | Non | Admin + audit log. Défaut 0. |
| Vrai PSP | Ports mock CARD/OM/MoMo | Paiements utilisateurs actifs | Non si on lit D25 | **Paiements mock restent actifs.** Pas de désactivation. |
| Webhook ouvert | Sans auth (D25 idempotence) | Audit sécu BOLA/IDOR | Léger | **Sécuriser** sans changer le mock `POST /payments` session. |
| Uploads ouverts | Next routes sans session | Audit sécu | Non | **Exiger** la session. |
| OTP 1234 en prod | D31 / env démo | Durcir l’auth | Oui | **Conserver** le mock démo. SMS réel = reste à faire. |
| Push | No-op D27 | Vérifier les notifs | Non | In-app suffit au lancement. |
| Admin Moods | Reports MOOD seulement | Admin doit gérer les Moods | Partiel | Signalements conservés. Hide Mood = reste (schéma). |
| Analytics | Aucun | Mesurer les événements clés | Non bloquant | Documenté comme reste. Pas de produit IA. |
| Refund → void ticket | Non | Auditer check-in / remboursement | Partiel | **Ne pas casser** les billets mock existants. Documenté. |

**Règle appliquée :** une instruction récente n’est jamais supérieure à une décision produit déjà validée.
