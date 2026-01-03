# Flutter Migration Design (Full Rewrite)

## Summary
This design proposes a full rewrite of the current Expo/React Native client into Flutter with functional parity (not pixel-perfect) across iOS, Android, Web, and Desktop (macOS, Windows, Linux). The backend and API contracts remain unchanged. The existing app is frozen except for blockers, and the Flutter app ships via standard store releases with no OTA requirement for v1.

## Goals
- Deliver functional parity across iOS, Android, Web, and Desktop.
- Preserve backend APIs and contracts without changes.
- Maintain existing flows and behavior with similar styling.
- De-risk the three highest-risk areas early: LiveKit/WebRTC, libsodium encryption, and RevenueCat billing.
- Establish a parity matrix as the source of truth for scope and acceptance.

## Non-goals
- Incremental add-to-app migration.
- Backend or protocol redesign.
- Pixel-perfect UI parity.
- Retaining Expo OTA workflows for Flutter v1.
- Tauri-based desktop shell.

## Assumptions
- Team has strong Flutter experience.
- Backend contracts are stable for the duration of the rewrite.
- Current app is frozen except for critical fixes.
- Desktop parity requires native Flutter desktop apps, not web-only.

## Scope and Parity Matrix
Create a parity matrix derived from the current app's navigation map and feature inventory. Each entry should include:
- Flow and screen names
- API endpoints and payload expectations
- Offline and error handling behavior
- Platform-specific behavior differences
- Test evidence required for acceptance

This matrix is the primary release gate for parity completion.

## Architecture
- Flutter monorepo with shared packages: `core`, `api`, `crypto`, `media`, `billing`, `storage`, `ui`, and `platform` adapters.
- Per-platform app shells with shared routing, state, and UI.
- Clean layering: API clients -> repositories -> state controllers -> UI.
- Single routing source of truth with web and deep link mappings.

## State Management and Navigation
- Standardize on a single state pattern. Recommendation: Riverpod.
- Navigation via `go_router`, with canonical URLs for web and deep links for mobile.
- Desktop uses the same route map with added keyboard and window handling.

## Data and Storage
- API layer uses a typed HTTP client with interceptors and explicit error mapping.
- Local storage uses Drift for structured data and `flutter_secure_storage` for secrets.
- If local data migration is required, define schema migration rules; otherwise treat Flutter as a clean install and sync from backend.

## Security and Encryption
- Implement libsodium via Dart FFI or a vetted Flutter package.
- Use golden test vectors to verify encryption output equivalence with the current app.
- Centralize crypto boundaries to avoid duplicated or inconsistent implementations.

## Media (LiveKit/WebRTC)
- Validate LiveKit Flutter SDK across iOS, Android, Web, and Desktop early.
- Build a thin media abstraction to isolate platform differences (permissions, devices, lifecycle, backgrounding).
- Create a media test harness to validate camera/mic, device switches, and long sessions.

## Billing (RevenueCat)
- Implement RevenueCat Flutter SDK in a dedicated billing module.
- Validate SKU mappings, receipt validation flow, and restore behavior against current app.

## Push Notifications
- Implement base push flows required for auth, sessions, and critical alerts.
- Use platform-specific plugins with a shared notification model.

## Error Handling and Observability
- Central error mapping layer for network, crypto, media, and billing errors.
- Standardized user-facing messages and stable telemetry keys.
- Cross-platform logging and analytics sink.

## Testing Strategy
- Golden tests for encryption and API serialization.
- Integration tests for core flows (auth, session join, message send, billing restore).
- End-to-end smoke tests per platform with a small set of release gates.
- Media device capability tests per OS.

## Tooling
- Flutter stable channel
- `melos` for package management
- `freezed` + `json_serializable` for models
- `dio` or `http` for API requests
- `riverpod` for state management
- `drift` for local database
- LiveKit Flutter SDK
- RevenueCat Flutter SDK

## Sequencing and Milestones
1. Discovery and parity matrix build.
2. Risk spikes for LiveKit/WebRTC, libsodium FFI, and RevenueCat.
3. Foundation layer (routing, theming, auth, core networking, storage).
4. Domain features in parity order (low risk first, high risk gated by spike success).
5. Alpha: core flows.
6. Beta: payments and encryption parity.
7. RC: media parity and desktop polish.
8. Release with parity gate sign-off.

## Risks and Mitigations
- LiveKit/WebRTC: early cross-platform prototype and sustained session testing.
- libsodium: golden tests and strict crypto boundaries.
- RevenueCat: SKU mapping and receipt validation test plan.
- Desktop performance: performance budgets and profiling early.

## Open Questions
- Which state management library is preferred: Riverpod or Bloc?
- Is local data migration required, or can we rely on resync?
- Which analytics/telemetry provider should be used in Flutter?
- What are the exact parity gate criteria for desktop and web performance?
