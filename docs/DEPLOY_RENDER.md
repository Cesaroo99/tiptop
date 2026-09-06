# Déployer TipTop sur Render + installer l’APK

## 1. Nettoyer les essais ratés

Le Blueprint **échoue à créer** le service si un Postgres free ou un service du même nom existe déjà (un seul Postgres gratuit par compte).

Dans [dashboard.render.com](https://dashboard.render.com) → **supprime** s’ils existent :

- services web `tiptop-cesar99`, `tiptop-phone`
- base `tiptop-db`
- l’ancien Blueprint TipTop

Attends que la suppression soit **terminée** (plus de ligne grise).

## 2. Héberger (gratuit)

1. Compte [render.com](https://render.com) lié à GitHub.
2. **New → Blueprint**.
3. Repo `Cesaroo99/tiptop`, branche **`main`**.
4. Apply. Render crée Postgres `tiptop-db` (30 jours) + le web `tiptop-phone`.
5. Premier deploy : 5–10 min. Le free s’endort après 15 min.

**URL :** [https://tiptop-phone.onrender.com](https://tiptop-phone.onrender.com)

**Compte démo :** `+237 695 21 47 85` / OTP `1234`

Si le nom `tiptop-phone` est pris mondialement, change `name:` dans `render.yaml` et l’URL dans `apps/android/app/src/main/res/values/strings.xml`.

## 3. APK téléphone

WebView plein écran vers l’URL Render (caméra / localisation autorisées).

- Artifact session : `tiptop.apk`
- Ou GitHub → Actions → **APK TipTop** → artifact `tiptop-apk`

Sur le téléphone : autorise « sources inconnues », installe, ouvre TipTop. Au réveil Render, le premier chargement peut prendre ~1 min.

## 4. Sans APK

Chrome Android → l’URL → menu → **Ajouter à l’écran d’accueil** (PWA).
