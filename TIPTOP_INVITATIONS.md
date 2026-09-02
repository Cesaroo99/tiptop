# TipTop — invitations

Deux systèmes d'invitation coexistent, avec des rôles distincts. Ne pas les confondre.

## 1. Invitation événement (`Invitation`, existant)

- Toujours liée à un `Event` (capacité, âge minimum, prix, paiement host/invité).
- Écran : `/invite/:userId` (choix de l'événement) → `/tickets` (onglet « invites »).
- TTL 24 h (`DEFAULT_INVITATION_TTL_HOURS`).
- Acceptation → `EventParticipant` + éventuel ticket.

## 2. Invitation sociale (`SocialInvite`, nouveau)

Pont non-billetterie vers une expérience réelle spontanée (#22-25 du brief).

### Contextes

| Contexte | CTA (FR) | Usage |
|---|---|---|
| `MEETUP` | Inviter à me rejoindre / Rejoindre | Personne disponible ou mood actif |
| `RESTAURANT` | Inviter au restaurant | Depuis « Personnes autour de moi » |
| `CAFE` | Inviter à prendre un café | idem |
| `ACTIVITY` | Proposer cette activité | idem, ou envie catégorie activité |
| `WISH` | Je t'invite | Envie de catégorie « expérience » (événement, restaurant, activité, voyage, expérience, sport, loisir, lieu) |

Labels centralisés dans `packages/domain/src/social-invite.ts` (`socialInviteCtaLabel`), pas hardcodés dans les composants.

### Flux

```
A ouvre "Personnes autour de moi" ou un profil ou une envie
↓
A choisit le contexte (ou il est pré-rempli par l'envie/le mood)
↓
A écrit un label + message optionnel
↓
POST /social-invites
↓
Notification SOCIAL_INVITE à B
↓
B accepte → conversation directe ouverte automatiquement (ChatService.openDirect)
   ou refuse → statut REFUSED
```

### Règles

- TTL 72 h (`SOCIAL_INVITE_TTL_HOURS`), plus long qu'un ticket événement car moins urgent.
- **Anti-spam (#56)** : maximum 20 envois/24 h par utilisateur, pas de doublon en attente vers la même personne (`canSendSocialInvite`).
- Interdiction de s'inviter soi-même (`assertSocialInviteTarget`).
- Aucun paiement associé — si un paiement est nécessaire, l'utilisateur bascule vers le flux `Invitation` événement classique.
- Écran : `/invitations` (onglets Reçues/Envoyées).

## Paiement d'invitation (événement)

Inchangé : « Je paie pour la personne » (`payer = HOST`) vs « Chacun paie sa part » (`payer = GUEST`), résolu par `resolveInvitationPayer`. Les invitations sociales n'ont pas cette dimension.
