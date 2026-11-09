# Contract: URL ↔ Room Map

Single source of truth binding real routes to 3D rooms. Shared by pages (payload
`route`), the island (routing state), and quickstart validation.

| Route (canonical, trailing slash) | Room id | RoomKind | Primary screens |
|---|---|---|---|
| `/` | home | home | hero/proof wall, services grid, method, work, repos wall, trajectory, background, faq, contact |
| `/services/svc-agentic-netops/` | svc-agentic-netops | service | fact cards, deliverables, evidence, related |
| `/services/svc-aiops-cloudops/` | svc-aiops-cloudops | service | same template |
| `/services/svc-local-inference/` | svc-local-inference | service | same template |
| `/services/svc-agent-platform/` | svc-agent-platform | service | same template |
| `/services/svc-critical-fabric/` | svc-critical-fabric | service | same template |
| `/services/svc-agent-delivery/` | svc-agent-delivery | service | same template |
| `/services/svc-enablement/` | svc-enablement | service | same template |
| `/about/` | about | about | bio, trajectory, certs/badges, skills, publications |
| `/404` | — (static only) | — | never rendered in 3D |

## Rules
1. The island MUST enter the room matching `payload.route` on boot (deep link/refresh).
2. In-app navigation: `history.pushState(route)` → camera transition → room content swap;
   `popstate` → reverse map lookup. Trailing slashes are mandatory on every pushed URL.
3. On room change the island sets `document.title`, meta description and canonical link
   from the destination page's values (embedded in navigation targets or payload slice
   pre-fetched at transition start).
4. This map is the ONLY allowed navigation surface; ad-hoc URLs are ignored (treated as
   deep-link boot per the route's static page).
5. `/404` and any unknown route: the static page stands alone; the island MUST NOT mount.
