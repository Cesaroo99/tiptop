# Déployer TipTop sur Render + installer l’APK

## 1. Héberger sur Render (gratuit)

1. Crée un compte sur [render.com](https://render.com) (GitHub autorisé).
2. **New → Blueprint**.
3. Choisis le repo `Cesaroo99/tiptop` et la branche qui contient `render.yaml` (cette PR, ou `main` après merge).
4. Apply. Render crée :
   - Postgres gratuit `tiptop-db` (expire au bout de 30 jours sur le plan free)
   - le service web `tiptop-phone`
5. Attends le premier deploy (build + seed, 5–10 min). Le service free s’endort après 15 min : le premier chargement peut prendre ~1 min.

**URL :** [https://tiptop-phone.onrender.com](https://tiptop-phone.onrender.com)

**Compte démo :** `+237 695 21 47 85` / OTP `1234`

Si le nom `tiptop-phone` est déjà pris, change `name:` dans `render.yaml` et l’URL dans `apps/android/app/src/main/res/values/strings.xml`.

## 2. APK téléphone

L’APK est une WebView qui ouvre l’URL Render (plein écran, caméra / localisation autorisées).

- Artifact de cette session : `tiptop.apk`
- Ou GitHub → Actions → **APK TipTop** → artifact `tiptop-apk`

Sur le téléphone : autorise « sources inconnues », installe, ouvre TipTop. Au premier lancement le serveur Render peut encore dormir.

## 3. Sans APK

Depuis Chrome Android, ouvre l’URL → menu → **Ajouter à l’écran d’accueil** (PWA).
