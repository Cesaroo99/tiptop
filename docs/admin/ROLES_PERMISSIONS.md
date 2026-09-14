# Rôles et permissions

`ADMIN` = super admin (toutes les permissions).

| Permission | ADMIN | MOD | FINANCE | SUPPORT | CONTENT | ANALYTICS | TECH |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Accès admin | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ | ✓ |
| Users write / ban | ✓ | | | write | | | |
| Users roles | ✓ | | | | | | |
| Finance refund | ✓ | | ✓ | | | | |
| Finance settings / commission | ✓ | | settings refund rules, **pas** commission | | | | |
| Modération | ✓ | ✓ | | lecture | ✓ | | |
| Flags / settings techniques | ✓ | | | | | | ✓ |
| Notifications | ✓ | | | | ✓ | | |
| Audit lecture | ✓ | ✓ | ✓ | ✓ | | | ✓ |

La commission plateforme (`PATCH /admin/settings`) reste **ADMIN uniquement** (`canChangePlatformFee`).

Assigner un rôle : `PATCH /admin/users/:id/staff` `{ "role": "FINANCE_ADMIN" }` (ADMIN seulement).
