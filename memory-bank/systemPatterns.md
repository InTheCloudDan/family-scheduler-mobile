# System Patterns: Family Scheduler Mobile App

## Architecture Overview

*   **Client-Server:** The React Native mobile app acts as a client to the existing Django REST API backend. All business logic and data persistence reside on the server.
*   **Cross-Platform:** Built using React Native to target both iOS (13+) and Android (8+).

## Key Technical Decisions & Patterns

*   **Framework:** React Native.
*   **State Management:** Redux is used for managing global application state. Key slices include `authSlice`, `eventsSlice`, `tasksSlice`, `notificationsSlice`, `vacationsSlice`, and `familySlice`. Data fetching is handled via async thunks within these slices. `vacationsSlice` now includes state, actions, and thunks for managing `VacationInvite` objects (`sendVacationInvite`, `fetchPendingVacationInvites`, `respondToVacationInvite`, `acceptVacationInviteByToken`).
*   **Navigation:** React Navigation handles screen transitions. A root `StackNavigator` (`AppNavigator`) manages the top-level navigation between the `AuthNavigator` (stack) and the `MainTabNavigator`. The `MainTabNavigator` contains nested Stack Navigators for Dashboard (`DashboardStackNavigator`), Vacations (`VacationsStackNavigator`), Family (`FamilyStackNavigator`), and Settings (`SettingsStackNavigator`). The `SettingsStackNavigator` includes the `PendingVacationInvitesScreen`.
*   **API Interaction:**
    *   Communication exclusively via the Django REST API using HTTPS. API base URL is configured in `src/services/api.ts`.
    *   `axios` (or standard `fetch`) will be used for making API requests.
    *   Authentication will use JWT. Tokens obtained from `/api/auth/login/` will be stored securely on the device (e.g., using `react-native-keychain` or similar secure storage) and sent in the `Authorization: Bearer <token>` header. Token refresh logic needs implementation.
    *   Robust error handling for API calls is required, providing user feedback.
    *   **Pagination Pattern:** Many list endpoints (e.g., `/api/vacation-plans/`, `/api/packing-lists/`, `/api/grocery-lists/`, `/api/families/`) use DRF's standard pagination, returning an object like `{ count: number, next: string | null, previous: string | null, results: Array<Item> }`. **Crucially, Redux thunks fetching these lists MUST extract the `results` array (e.g., `return response.data.results;`) instead of returning `response.data` directly.**
    *   **Image Uploads:** Implemented using `react-native-image-picker` to select images and `FormData` to send the image data via `PATCH` requests in Redux thunks (e.g., `updateChild` in `familySlice.ts`, `uploadEventMedia` in `eventsSlice.ts`). The API client (`axios`) needs the `Content-Type: multipart/form-data` header set for these requests.
    *   **External Calendar Sync (Google/ICS):**
        *   The app initiates the Google OAuth 2.0 flow via a backend URL (`/accounts/google/login/`). The backend handles token storage and periodic syncing.
        *   New endpoints manage external accounts and visibility:
            *   `GET /api/external-calendars/`: List connected accounts (Google, ICS).
            *   `GET /api/external-calendars/{account_pk}/`: Get details of one account.
            *   `DELETE /api/external-calendars/{account_pk}/`: Disconnect an account.
            *   `GET /api/external-calendars/{account_pk}/visibility/`: List visibility rules for an account.
            *   `POST /api/external-calendars/{account_pk}/visibility/`: Create a visibility rule (share with role or user).
            *   `GET /api/external-calendars/{account_pk}/visibility/{rule_pk}/`: Get details of a rule.
            *   `PUT /api/external-calendars/{account_pk}/visibility/{rule_pk}/`: Update a rule.
            *   `DELETE /api/external-calendars/{account_pk}/visibility/{rule_pk}/`: Delete a rule.
            *   `POST /api/external-calendars/{account_pk}/sync/`: Trigger manual sync for an account.
        *   The app needs UI to list accounts, manage visibility rules (per account, targeting roles or specific users), initiate the Google connection, and trigger manual sync.
        *   Event fetching (`GET /api/events/`) automatically includes visible external events based on backend rules; no client-side filtering for visibility is needed.
    *   Data fetching is primarily on-demand via Redux thunks.
*   **UI Components:** Standard React Native components supplemented by `react-native-paper` (UI library), `react-native-calendars`, `react-native-modal-datetime-picker`, `react-native-google-places-autocomplete`, `@react-native-picker/picker`, and `react-native-image-picker` (for media selection). `Avatar.Icon` from `react-native-paper` is used as a fallback when an image URI (e.g., profile picture) is not available. UI elements will be needed in Settings to manage external calendar connections, visibility rules, and manual sync triggers.
*   **Push Notifications:** Integration planned but not yet implemented.
*   **Permissions:** Network permission is implicit. Photo Library (iOS), Media Storage (Android), and Microphone (iOS - for video audio) permissions added for media uploads. Push Notifications and potential Calendar/Location permissions TBD. Google Calendar access is handled via server-side OAuth.
*   **Security:** Secure token storage via `react-native-keychain`, HTTPS communication. Token refresh handled via Axios interceptor. Adherence to role-based permissions enforced by the API. Google OAuth flow managed by backend.
*   **Polyfills:** `react-native-get-random-values` is imported in `index.js` to support dependencies requiring `crypto.getRandomValues`.
*   **Deep Linking:** Implemented using React Navigation's `linking` configuration in `App.tsx`. Handles `https://kinhearthly.com/vacations/accept-invite/:token` and `famsched://vacations/accept-invite/:token` patterns. Native configuration updated in `AndroidManifest.xml` and `Info.plist`. Logic in `App.tsx` processes the link, extracts the token, checks authentication, dispatches the `acceptVacationInviteByToken` thunk, and navigates the user appropriately using a navigation container ref.

## Component Relationships (High-Level)

*   **App Entry Point:** Initializes Redux store, sets up navigation container with linking config.
*   **Navigation Container:** Manages overall app flow (e.g., Auth stack vs. Main App stack).
*   **Screen Components:** Each screen defined in the spec (Login, Dashboard, Calendar, EventDetail, etc.) will be a React component.
*   **Shared Components:** Reusable UI elements (buttons, inputs, list items, custom cards) will be created.
*   **Redux Store:** Central hub for application state.
*   **Actions/Reducers:** Define how state changes in response to user interactions or API responses.
*   **API Service Layer:** Encapsulates logic for making API calls (e.g., functions like `loginUser`, `fetchEvents`, `createTask`, `listExternalCalendars`, `createVisibilityRule`). Redux thunks (`fetchEventMedia`, `uploadEventMedia`, `deleteEventMedia`) handle interactions with the `/api/media/` endpoint for event media management. Thunks will be needed for managing external calendars and their visibility rules.
*   **Settings Section:** Will likely contain screens for managing connected external accounts (Google, ICS) and their visibility settings.

*(Note: Specific UI library choice and detailed component breakdown will evolve during development.)*
