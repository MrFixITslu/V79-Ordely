# Ordely security pre-launch checklist — draft

**NO PUBLIC LAUNCH / NO MERGE** while these gates are unmet.

## Findings patched in branch (not production)
- Registration cannot choose admin role.
- No production JWT-secret default.
- No production demo seeding on an empty database.
- Basic password length, input and JSON-body limits.
- Security negative tests, compile and dependency audit workflow.

## Outstanding high priority
- Inspect the *deployed* container and actual database for legacy demo users. Existing records are not automatically deleted; require authorized rotation/disablement after a tested backup and account inventory.
- Verify whether any old JWTs signed by the previously known fallback can still authenticate. Rotate credentials under a supervised outage plan; immediately invalidate sessions as appropriate.
- Verify per-object product/order/message ownership with authenticated tests using two distinct vendors and customers.
- Verify orders cannot be marked paid or fulfilled without a trusted payment receipt; inventory and refunds are server-authoritative.
- Apply rate limits to login, register, password reset and messaging; add abuse controls for anonymous routes.
- Verify cookie/session custody, logout/revocation, log/PII policy, TLS/HSTS and reverse-proxy rules.
- Inventory exactly which public routes, if any, expose this app. No live penetration testing or host changes were part of this source patch.
- Maintain CI source/digest parity and owner-approved backup/rollback.

**Status:** Isolated source candidate. Failing tests or dependency audit = release HOLD.
