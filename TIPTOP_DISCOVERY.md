# TipTop — découverte

Complète `TIPTOP_NEARBY_DISCOVERY.md` (livré avec le like-time) avec les ajouts de cette phase.

## Ajouts

1. **Mood actif** (`activeMood`) sur chaque carte, voir `TIPTOP_MOOD.md`.
2. **Filtres** (déjà présents, confirmés fonctionnels) : ville/zone, distance max, âge min/max, profession, disponibilité, catégorie d'envie.
3. **Invitation contextuelle** : le CTA principal change selon le contexte (mood actif → « Rejoindre » ; sinon → « Inviter à me rejoindre »), tous les deux ouvrant désormais une `SocialInviteModal` plutôt qu'un flux de sélection d'événement — cf. `TIPTOP_INVITATIONS.md`.

## Recherche par région (#34-35)

**Décision v1 (documentée, pas simulée) :** TipTop Cameroun n'a aujourd'hui qu'une seule ville réelle peuplée (Yaoundé, `YAOUNDE_ZONES`). Construire une UI complète pays → région → ville sans données réelles produirait des écrans vides déguisés en fonctionnalité — contraire à la consigne « ne pas créer de fausses données ».

Ce qui est fait :

- `DiscoveryService.people` et `search` acceptent déjà un paramètre `city` indépendant de la position réelle de l'utilisateur (`filters.city`), donc l'architecture **supporte** de rechercher ailleurs que sa position — le mécanisme existe.
- `GET /geo/zones` retourne le catalogue de zones disponibles (`/zone` écran existant), prêt à être étendu à d'autres villes/pays dès que des données réelles existent.

Ce qui n'est **pas** fait : un sélecteur pays/région/ville dans l'UI, car il n'y a rien de réel à montrer au-delà de Yaoundé. À réévaluer quand une deuxième ville sera onboardée.

## Confidentialité

Inchangé : `HIDDEN` exclut totalement la personne de la découverte ; `CITY`/`ZONE` limitent la précision affichée ; distance toujours arrondie (`formatApproxDistance`, `roundDistanceKm`).
