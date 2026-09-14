# Sécurité admin

- RBAC serveur (`hasPermission`) — le frontend n’est jamais une source de vérité.
- `AdminGuard` + `AdminPermissionGuard` + `SessionGuard`.
- Rôles : `ADMIN` (super), `MODERATOR`, `FINANCE_ADMIN`, `SUPPORT_ADMIN`, `CONTENT_ADMIN`, `ANALYTICS_ADMIN`, `TECH_ADMIN`.
- Rate limit actions sensibles (30 / heure / acteur, mémoire process).
- OTP : lock + max attempts existants. Codes **jamais** exposés à l’admin.
- Compte démo César protégé.
- Sessions révocables (blocage + « forcer déconnexion »).
- Audit append-only (`AdminAudit`) — pas de delete UI.
- Secrets masqués ; jamais dans le bundle Next `NEXT_PUBLIC_*` pour les clés secrètes.
- Webhooks mock : secret header en prod ; reçus idempotents.
- Pas d’accès généralisé au chat privé.
- CSRF : cookies session same-origin via rewrite `/api`. XSS : React escaping.
- MFA/TOTP : **non implémenté** (auth téléphone seulement). À ajouter plus tard, ne pas le simuler comme « connecté ».

Validation : class-validator sur les DTO. Permissions rejouées dans le service.
