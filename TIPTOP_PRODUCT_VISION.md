# TipTop — Vision produit

TipTop n’est pas un réseau social de plus. Instagram, TikTok et Snapchat
optimisent le **temps d’écran**. TipTop optimise le **temps passé dehors**.

La boucle n’est pas « scroller jusqu’à en avoir assez ». C’est :

**Découvrir → S’intéresser → Inviter → Se rencontrer → Vivre → Mood → Redécouvrir**

Un Mood n’est pas un Reel. C’est la preuve qu’une vie réelle vient d’avoir
lieu, et l’amorce de la suivante. Un like n’est pas un compteur : c’est du
**temps** (`LIKE + DURÉE = TEMPS DE LIKE`). Une personne « dehors maintenant »
n’est pas un profil à collectionner : c’est quelqu’un que tu peux rejoindre
ce soir.

## Ce que l’utilisateur ne doit plus pouvoir quitter

L’addiction TipTop n’est pas celle du feed infini. C’est celle du **FOMO réel** :

1. **Qui est dehors, près de moi, maintenant ?** — pas un catalogue mondial.
2. **Quel Mood vient d’être filmé dans ma zone ?** — une vidéo, un lieu, un visage.
3. **Quelle sortie commence bientôt ?** — réserver, inviter, y aller.
4. **Qui m’a donné du temps de like ?** — une relation, pas une métrique vaniteuse.

Si tu fermes l’app, tu rates une rencontre. Pas une story.

## Forme : un téléphone, partout

Les maquettes sont des écrans iPhone. Le produit aussi.

- Sur un vrai téléphone : plein écran, barre basse toujours là.
- Sur un ordinateur : le même iPhone 390×844, centré, pas un site à trois
  colonnes qui trahit le design.

Même navigation (Home / Mood / Ajouter / Amies / Events), mêmes gestes,
même charte : cyan `#05C7F2`, jaune `#F2E205`, noir `#0D0D0D`, Inter.

## Cartographie des cinq onglets

| Onglet | Rôle | Ce qui doit marcher |
| --- | --- | --- |
| Home | Pulse de ta zone | Moods en stories, « Dehors maintenant », publications et sorties locales |
| Mood | Preuve du réel | Flux vertical immersif, lieu optionnel, passerelle événement / profil |
| Ajouter | Créer | Publication, événement ou Mood — un seul composer, trois intentions |
| Amies | Qui est là | Carousel local, message réel, invitation à rejoindre |
| Events | Sortir | **Tous** = découvrir · **Mes événements** = gérer, tickets, favoris |

Les pages secondaires (menu, tickets, messages, compte) restent dans le
même cadre. Aucun bouton ne doit ouvrir une impasse : s’il n’est pas prêt
(OAuth social), il ramène vers le chemin qui marche (le numéro).

## Ce que TipTop n’est pas

- Pas un clone TikTok avec une tab « events » collée après.
- Pas un site vitrine desktop « responsive » qui cache la barre du téléphone.
- Pas un catalogue mondial d’événements. La zone est le produit.
- Pas des compteurs de likes. Le capital, c’est le **temps**.

## Performance perçue

L’app doit se sentir native : cadre 390 px, nav ancrée dans l’écran (jamais
`fixed` sur la fenêtre du navigateur), scroll contenu dans le téléphone,
vidéos Mood une à la fois, skeletons plutôt que pages blanches.

## Prochaine profondeur (volontairement hors de cette couche)

- OAuth Google / Apple / Facebook réellement branché.
- Rappels push « ça commence dans 30 min ».
- Upload / transcodage vidéo utilisateur au-delà des clips seed.
- Multi-devises le jour où le marché n’est plus uniquement le Cameroun.

Jusque-là : chaque écran ouvert mène quelque part de réel.
