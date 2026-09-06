# TipTop — écosystème social vivant

Complément d’architecture. **Ne redéfinit pas** TipTop.

Hiérarchie : décisions validées (`TIPTOP_PRODUCT_DECISIONS.md` D01–D38) → fonctionnalités déjà correctes → ce document → jugement technique.

Date : 6 septembre 2026.

---

## CONFLICT REVIEW

Le prompt « Social Network Living Ecosystem » complète, il ne remplace pas.

| Demande du prompt | Décision déjà validée | Choix |
| --- | --- | --- |
| 8 types « disponible pour… » | D10 : `HIDDEN` / `BUSY` / `AVAILABLE` + TTL 4 h | **Conserver D10.** Le contexte (mood, activité, invitation) porte déjà l’intention. |
| Feed « intelligent » unique | D13 : Home = mix social, Events = hub | **Évoluer le ranking et le mix**, pas fusionner Home et Events. |
| Notifications hors-app riches | D27 : push no-op, anti-spam | **Grouper l’in-app.** Pas de push réel, pas de fausses urgences. |
| Sync contacts téléphone | Jamais spécifié | **Non.** On utilise `Contact` TipTop déjà existant. |
| Compteur Vie partout | D36 + UX « pas un tableau » | **Emplacements existants seulement** (dock, carte, profil self, `/likes`). |
| Moods partout | D18 : `/mood` + pastilles + onglet profil | **Pas de nouvelles galeries Moods.** |
| Gamification (badges, records) | D28 anti-addiction | **Non.** Vie du jour / records = plus tard, élégant ou pas du tout. |
| IA recommandation | `TIPTOP_AI.md` | **Contrats de signaux seulement.** Pas de modèle. |

---

## 1. Ce qui existe déjà

| Objet | État | Ne pas reconstruire |
| --- | --- | --- |
| Vies (`LikePeriod`) | 1 placement actif, transfert, durée serveur | `TIPTOP_LIKE_TIME_SYSTEM.md` |
| Disponibilité | 3 états + expiration | D10 |
| Home mixte | Posts + events + people + moods | D13 |
| Graphe | Follow, Contact, UserBlock, SocialInvite | `TIPTOP_SOCIAL_GRAPH.md` |
| Découverte | Zone approchée, mood actif, filtres | `TIPTOP_DISCOVERY.md` |
| Notifs in-app + deep links | `notifAction` contextuel | D27 |
| Events sociaux | Compteurs globaux, people publics | `TIPTOP_EVENTS.md` |

---

## 2. Ce qui était insuffisant

1. **Feed** : firehose `createdAt desc` identique pour tous. Mix client en cycle figé 10 slots (`mood, post, person…`).
2. **Blocs** : `UserBlock` n’était pas appliqué au feed / à la découverte.
3. **Événements** : pas de « X de ton réseau y vont » (uniquement totaux globaux).
4. **Personnes** : le cercle est un badge, pas un *pourquoi* (intérêts, proximité + dispo).
5. **Notifs** : une ligne par événement, pas de regroupement fenêtre.
6. **Ranking** : seul `moodInterestScore` existait. Les secondes de Vie n’entraient pas dans le Home.
7. **Analytics** : catalogue lancement trop étroit pour mesurer la boucle vivante.

---

## 3. Architecture livrée

### Moteur de ranking (`packages/domain/src/feed-rank.ts`)

`feedItemScore(signals)` : pondérations nommées, remplaçables.

Signaux v1 : suivi, ami (`Contact`), même ville, récence (demi-vie), secondes de Vie, commentaires, blocage → −∞.

`feedHint` : `followed` | `alive` | `local` | `null` — **uniquement si le signal est vrai**. Pas de hint cosmétique.

Le serveur prend ~50 posts récents, score, garde le top 30. Le client **mélange** encore les seaux (posts / events / people / moods) avec une diversité dynamique — plus de motif 10 slots.

### Mix Home (`apps/web/lib/feed-mix.ts`)

Tirage pondéré + interdiction de répéter le même *kind* de surface tant qu’un autre seau a des cartes. Dédup événement déjà lié à un post : inchangée.

### Graphe (`apps/api/src/graph/viewer-graph.ts`)

`viewerHiddenIds` / `viewerNetwork` : source unique pour feed, events, discovery.

### Preuve sociale événements

`friendsGoing` (contacts en participation publique) et `networkGoing` (follows ∪ contacts, participation publique). UI : **une** ligne, seulement si > 0. Jamais d’adresse précise.

### Découverte : `why[]`

Clés : `shared_interests`, `nearby_available`, `mood`. Affichées seulement si pertinentes. Ce n’est pas un annuaire.

### Notifications

`groupNotifications` : LIKE/COMMENT même cible, FOLLOW même acteur, fenêtre 6 h. `unreadCount` reste le décompte brut. Deep links inchangés. Push toujours no-op.

### Analytics

Catalogue étendu (`app.open`, `content.ignore`, `event.view`, `event.join`, `notification.open`, …). Sink logs inchangé. Pas de dashboard.

---

## 4. Boucles connectées (sans tout afficher partout)

```
contenu → feed ranké → personne / why → profil → Vie / message / follow
     → invitation → notif groupée → retour contextuel → nouveau contenu

événement → friendsGoing / networkGoing → profils publics → invitation
     → participation → preuve sociale plus forte

hors-app → notif in-app (pas de spam push) → deep link → action
```

RIGHT FEATURE → RIGHT PLACE → RIGHT TIME.

---

## 5. Temps réel / push / IA — volontairement pas maintenant

| Sujet | Décision |
| --- | --- |
| Realtime messages | Existe déjà (chat). |
| Realtime Vies / dispo / feed | Polling + refresh placement suffisent. Pas de socket feed. |
| Push | D27 no-op. L’architecture `PushPreference` reste. |
| IA | Contrats de signaux (`feedItemScore`, `why`, social proof). Voir `TIPTOP_AI.md`. |
| 8 disponibilités | Non (D10). |
| Contacts téléphone | Non. |

---

## 6. Scénarios du test ultime

1. **Jour 1, peu d’amis** — le firehose local + moods + events + people `NEARBY` restent ; le ranking n’exige pas un graphe.
2. **5 h plus tard** — récence + Vies + nouveaux events changent le top 30 et le mix.
3. **Lendemain** — notifs groupées + events à venir avec preuve sociale.
4. **Sans amis** — discovery `why` (intérêts, dispo proche) + contenu ville.
5. **Hors-app** — in-app seulement ; pas de push inventé.
6. **Quelqu’un donne une Vie** — inchangé (D36) + notif LIKE deep-link.
7. **Vie 3 h** — `LikePeriod` serveur, déjà correct.
8. **Transfert** — `pickUnitForTarget`, déjà correct.
9. **Dispo proche** — D10 + `why.nearby_available` si vraiment dispo et proche. Zones approximatives.
10. **5 contacts à un event** — `friendsGoing` si participation publique.
11. **Mood** — expérience `/mood` inchangée ; hint / profil déjà là.
12. **Journée dense** — mix diversifié, pas un mur monotone ni un cycle mécanique.
