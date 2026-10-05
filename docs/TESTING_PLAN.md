# Testing Plan

Execution snapshot: 1 October 2026. Manual API cases ran on a disposable, JPA-generated MySQL database after the security fixes. `Pass` means the listed assertion was exercised; `Partial` means only the noted subset ran. Browser interaction and remaining cases are still Pending.

| Test ID | Feature | Precondition | Steps | Expected Result | Actual Result | Status |
|---|---|---|---|---|---|---|
| AUTH-01 | Registration | New email/phone | Register FARMER, BUYER, MIDDLEMAN | Account created; password not returned | HTTP 201 for all three intended roles | Pass |
| AUTH-02 | Privileged role registration | Anonymous | Register with ADMIN role | Rejected; no admin account/token | HTTP 400; no account/token; automated controller validation test passed | Pass |
| AUTH-03 | Login input validation | Anonymous | Submit malformed email and blank password | HTTP 400 before auth service | MockMvc DTO validation test passed | Pass |
| AUTH-03 | Duplicate registration | Existing email/phone | Register duplicate | 4xx; no duplicate user | Pending | Pending |
| AUTH-04 | Login | Existing account | Correct then incorrect credentials | JWT on success; 401 on failure | Farmer/buyer/coordinator login HTTP 200; bad password HTTP 401 | Pass |
| AUTH-05 | Profile | Valid JWT | GET `/api/auth/profile` | Profile omits password/token; protected request accepts JWT | HTTP 200; no password/token fields | Pass |
| AUTH-06 | Credential logs | Logging enabled | Use sentinel password; inspect runtime log and DTO stringification | No password/token logged | Runtime sentinel and request log strings absent; automated DTO `toString()` tests passed | Pass |
| AUTH-07 | Role access | Farmer, buyer, coordinator accounts | Call protected APIs as each role | Only permitted authorities succeed | Anonymous farmer API HTTP 403; buyer farmer API HTTP 403; farmer coordinator API HTTP 403; allowed role calls succeeded | Pass |
| FARM-01 | Crop create/list | Farmer JWT | POST then GET `/api/farmer/crops` | Listing belongs to authenticated farmer | Create HTTP 201; own list HTTP 200 with matching crop | Pass |
| FARM-02 | Crop details | Own and other farmer crop | GET both IDs | Own returned; other owner's data not disclosed | Foreign lookup HTTP 404; owner-scoped repository query covered by passing service test; own detail HTTP call not separately exercised | Partial |
| FARM-03 | Crop update/delete | Own and other farmer crops | PUT/DELETE each ID | Own operation works; cross-owner denied, unchanged | Own update HTTP 200 and delete HTTP 204; foreign update HTTP 404; foreign delete not exercised | Partial |
| FARM-04 | Invalid crop input | Farmer JWT | Missing name, invalid unit, nonpositive price/quantity | 400 and no record | Pending | Pending |
| BUY-01 | Marketplace availability | Available crop exists | GET list/detail | Available crop is returned and details open | Buyer list/detail HTTP 200 and test crop appeared; unavailable exclusion not separately exercised | Partial |
| ADM-01 | Admin access | Admin authority | GET `/api/admin/dashboard` | Read-only summary returned | MockMvc test passed | Pass |
| ADM-02 | Non-admin denial | Farmer, Buyer, Coordinator authorities | GET `/api/admin/dashboard` | HTTP 403 | MockMvc tests passed for each role | Pass |
| ADM-03 | Admin overview data | Mixed-role users and available/unavailable crops | Service tests | Counts, safe account DTO, and crop attribution are correct | Focused service tests passed | Pass |
| ADM-04 | Local Admin provisioning | Local/dev profile and opt-in environment settings | Promote an existing non-Admin account | Existing account gets Admin authority; no password change | Service test passed; profile-gated startup path not exercised against a DB | Partial |
| ADM-05 | Unauthenticated Admin API | No token | GET `/api/admin/dashboard` | Request denied | Runtime request to backend on port 8081 returned HTTP 403 | Pass |
| BUY-02 | Search/category/location | Mixed crop fixtures | Search name and change category/location in UI | Client-side name/category/location filters match; no price filter | Source supports these three filters; no browser interaction run | Pending |
| BUY-03 | Farmer DTO privacy | Known account private data | Inspect marketplace response | No password, JWT, or private account fields | Pending | Pending |
| MID-01 | Collected Farmer CRUD | Coordinator JWT | Create/list/read/update/delete own records | Owned record operations succeed | Create/list/detail/update passed; a separate empty record deleted with HTTP 204; cross-coordinator isolation not tested | Pass |
| MID-02 | Collected Farmer validation | Coordinator JWT | Invalid/missing required values | 400 and no record | Pending | Pending |
| MID-03 | Account search/link | Coordinator and farmer account | Search farmer; attempt linking valid farmer and non-farmer | Farmer may link; wrong role rejected; scope/privacy correct | Pending | Pending |
| MID-04 | Coordinator crop create | Own collected farmer | POST and list `/api/middleman/farmers/{id}/crops` | Crop references collected farmer | Create HTTP 201; coordinator list HTTP 200 | Pass |
| MID-05 | Coordinator crop access | Record owned by another coordinator | Create/read/update/delete crop | Cross-owner denied except intended admin | Service tests pass for collected-farmer private list/read/update/delete and crop lookup; full HTTP/JWT flow pending | Partial |
| MID-06 | Marketplace attribution | Crop created for Suresh Kumar | Read buyer marketplace list/detail | Name equals collected farmer; marker true; no unrelated account owner | HTTP 200 list/detail; farmerName `Suresh Kumar`, `isCollectedFarmer=true`, `farmerId=null`; automated mapping test passed | Pass |
| FILE-01 | Image valid | Coordinator JWT, image <=5 MB | Multipart POST `file`; GET returned URL | URL returned and image served | Pending | Pending |
| FILE-02 | Image invalid | Coordinator JWT | Empty, wrong MIME, >5 MB files | 4xx; no file stored | Pending | Pending |
| FILE-03 | Upload authorization | No token, farmer, buyer | POST image endpoint | Only intended role can upload | Pending | Pending |
| API-01 | Unauthorized access | Missing token / wrong role | Call protected APIs | Rejected without mutation/data leak | Anonymous and wrong-role requests returned HTTP 403 | Pass |
| API-02 | API errors | Invalid bodies/IDs and server error | Exercise failure paths | Stable status and safe response, no internals | Pending | Pending |
| UI-01 | Role routes/redirects | Vite running | Request `/login`, `/marketplace` | SPA route shell served | Both HTTP 200; browser render/redirect not exercised | Partial |
| UI-02 | Frontend/backend endpoint match | Vite and backend running | Request `/api/auth/profile` via Vite proxy | Proxy reaches secured backend | HTTP 403 unauthenticated, as expected; not every UI service exercised | Partial |
| BUILD-01 | Frontend build | Dependencies installed | `npm.cmd run build` | Build succeeds | Vite production build succeeded | Pass |
| BUILD-02 | Backend build/tests | Java/Maven | `mvn verify` | Compile/package succeeds and discovered tests pass | BUILD SUCCESS; 6 JUnit tests passed, 0 failures/errors/skips | Pass |

Automated coverage in `AuthControllerTest` and `CropServiceImplTest` covers intended registration roles/Admin rejection, password/JWT stringification, owner-scoped crop lookup/denial, availability repository query, and collected-farmer name mapping. Remaining Pending cases still need execution. No performance, usability, adoption, or farmer-income results were collected.
