# AgriConnect Project Status

**Snapshot:** 1 October 2026. Maven `verify` passes with 20 focused backend tests; the frontend production build passes. Backend startup succeeded on port 8081 with schema updates disabled; an unauthenticated Admin request was denied (403). Existing authentication, farmer/coordinator services, and marketplace flows were previously verified with API checks. Full browser-based end-to-end interaction and a real Admin login remain unverified.

## Architecture

React/Vite frontend, Spring Boot 3.2.5 / Java 17 backend, Spring Security with JWT, Spring Data JPA, and MySQL. The active application has four persistence entities: `Role`, `User`, `Crop`, and `CollectedFarmer`. Crop listings can belong to a registered farmer (`Crop.farmer`) or a separately collected farmer (`Crop.collectedFarmer`).

Routes include farmer `/farmer/*`, buyer/farmer marketplace `/marketplace/*`, coordinator `/middleman/*`, and admin `/admin/dashboard`. The Admin UI uses read-only APIs protected by `ROLE_ADMIN`.

## Status

| Module | Status | Evidence / limits |
|---|---|---|
| Authentication and role signup | Implemented; core backend checks passed | BCrypt/JWT, profile endpoint, public ADMIN registration rejected. Login DTO validation now runs. |
| Farmer crop CRUD and ownership | Implemented; API checks and focused tests passed | Owner scoped by authenticated account. Farmer A/B browser flows not automated. |
| Buyer marketplace and attribution | Implemented; API checks and mapping tests passed | Marketplace endpoints return available crops and correct registered/collected farmer attribution. |
| Search and filters | Implemented in UI; partially verified | Crop name, category and location filtering are client-side. Browser interaction not run. |
| Field coordinator and collected farmers | Implemented; API checks and focused ownership tests | Service list/update/delete paths scope records by authenticated coordinator identity. Full coordinator A/B runtime scenario not run. |
| Coordinator-assisted crop listings | Implemented; owner checks reviewed and crop lookup isolation tested | Listing update/delete checks the collected farmer's coordinator. Full coordinator A/B runtime scenario not run. |
| Crop availability | Implemented; source and focused test coverage | Marketplace repository queries only available crops; Admin overview counts available/all listings. |
| Crop images | Partially verified | Coordinator upload endpoint and UI exist; file type is checked by reported MIME and size is capped at 5 MB. Farmer add/edit accepts an image URL. Persistent upload and browser display were not exercised in this task. |
| Validation and errors | Implemented; focused checks present | Registration/crop/collected-farmer DTO constraints; invalid login is rejected before service invocation. Generic 500 response no longer returns exception text. |
| Admin | Implemented; automated access/service tests added | Read-only dashboard stats, account overview, and all crop listings; server restricts `/api/admin/**` to `ROLE_ADMIN`. Opt-in local/dev promotion of an existing account is available; real Admin login and interactive dashboard not verified. |
| Documentation / research plan | Updated to match source | No adoption, income, survey, performance, or market outcome claims. |

## Runtime configuration

The backend requires `AGRICONNECT_JWT_SECRET` (Base64 key with at least 32 decoded bytes) for token generation. `AGRICONNECT_DB_PASSWORD` supplies the configured MySQL user's password. Neither is set in this workspace, and no ignored `application-local.properties` override exists here; therefore a successful real login was not verified in this run. Keep values local/environment-managed and never commit them.

## Completed

- Authentication, farmer, buyer, coordinator and collected-farmer workflows exist in the current application.
- Registered farmer and coordinator-collected farmer remain distinct ownership paths; marketplace mapping uses the represented farmer's name.
- Read-only Admin statistics, account list, and crop overview are implemented; no destructive Admin actions were added.
- Role signup does not allow public ADMIN registration.

## Partially verified

- Interactive browser workflows for farmer, buyer, coordinator, and Admin were not automated.
- Image upload and retrieval were inspected in source but were not tested with a persistent file in this task.
- Real Admin login depends on a provisioned Admin account; automated security uses mock authenticated principals and does not establish that a real account exists. Local/dev provisioning is opt-in through explicit profile and environment settings.
- Backend token issuance requires the JWT secret environment setting; the current workspace has no such setting.
- Coordinator cross-account service tests cover collected-farmer list/read/update/delete and assisted crop lookup isolation; a full HTTP/JWT scenario remains unverified.

## Limitations and future enhancements

Orders, cart, payments, reviews, notifications, advanced recommendations, production hosting, automated browser tests, and production Admin provisioning are outside the current implementation. The local image directory is not a production object-storage service. The root `schema.sql` and older README may describe tables not represented by current JPA entities; preserve current records and reconcile those artifacts separately.

### Local Admin setup

Create the intended account through ordinary public registration with a non-Admin role. For one local startup only, activate the `local` or `dev` Spring profile and set `AGRICONNECT_ADMIN_BOOTSTRAP_ENABLED=true` and `AGRICONNECT_ADMIN_BOOTSTRAP_EMAIL` to that account's email. The application promotes only that existing account; public ADMIN registration remains disabled. Unset the enable flag after startup. No password is stored or generated by this mechanism.

### Local password reset

If the password of an account that already exists is unknown, use the opt-in `PasswordResetRunner` and `PasswordResetService`. It replaces the stored password of exactly one account and leaves role, active flag and profile fields untouched.

For one local startup only, activate the `local` or `dev` Spring profile and set:

- `AGRICONNECT_PASSWORD_RESET_ENABLED=true` — required; without it the runner is never registered
- `AGRICONNECT_PASSWORD_RESET_EMAIL` — the email of an account that already exists
- `AGRICONNECT_PASSWORD_RESET_PASSWORD` — the new password, which must be 8 to 100 characters

Safety properties:

- The runner only exists under the `local` and `dev` profiles, so it cannot activate under `prod` or a default profile run.
- Startup aborts if the email does not match an existing account. No account is ever created.
- Only the password column is written. Roles, the active flag and profile fields are unchanged.
- The password is validated before any database lookup, and only the email is written to the log.

Unset `AGRICONNECT_PASSWORD_RESET_ENABLED` after the startup that needs it, otherwise the stored password is rewritten on every restart. This is a local development aid and not an administrative password-reset feature: there is no reset endpoint and no email-token flow.
