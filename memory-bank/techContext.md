# Tech Context: Family Scheduler Mobile App

## Core Technologies

*   **Platform:** React Native
*   **Target OS:** iOS 13+, Android 8+
*   **Language:** TypeScript
*   **State Management:** Redux (`@reduxjs/toolkit` recommended for modern Redux)
*   **Navigation:** React Navigation (`@react-navigation/native`, `@react-navigation/stack`, `@react-navigation/bottom-tabs` or `@react-navigation/drawer`)
*   **API Client:** `axios` or `fetch` (built-in)
*   **UI Components:**
    *   Standard React Native components
    *   UI Library: `react-native-paper`
    *   Calendar Library: `react-native-calendars`
    *   Date Picker: `react-native-modal-datetime-picker` (depends on `@react-native-community/datetimepicker`)
    *   Location Autocomplete: `react-native-google-places-autocomplete`
    *   Dropdown/Picker: `@react-native-picker/picker`
    *   Image/Video Picker: `react-native-image-picker`
*   **Push Notifications:** Planned (requires integration library like `react-native-firebase`).
*   **Secure Storage:** `react-native-keychain` used for JWT tokens.
*   **Polyfills:** `react-native-get-random-values` (for crypto support).
*   **Testing:** Jest (planned).

## Backend API

*   **Development Endpoint Base URL:** `http://localhost:8000` (Inferred from backend `settings.py`)
*   **Production Endpoint Base URL:** `https://kinhearthly.com` (Inferred from backend `settings.py`)
*   **API Specification:** Defined by the Django REST Framework serializers and views in the `/Users/danielobrien/code/family-scheduler` project.
*   **Authentication:** JWT via `/api/auth/login/`. Requires `Authorization: Bearer <token>` header. Token refresh mechanism needed. Google OAuth also supported via API.
*   **Data Format:** JSON.
*   **Key Endpoints (Examples - need verification from backend):**
    *   `/api/auth/login/`
    *   `/api/auth/register/`
    *   `/api/auth/password/reset/`
    *   `/api/events/` (GET, POST)
    *   `/api/events/{id}/` (GET, PUT, PATCH, DELETE)
    *   `/api/events/search/?q={query}`
    *   `/api/tasks/`
    *   `/api/tasks/{id}/`
    *   `/api/notes/`
    *   `/api/vacation-plans/` (Corrected endpoint for listing/CRUD)
    *   `/api/families/` (Confirmed endpoint for user's groups - paginated)
    *   `/api/family/members/` (Likely for managing members within a family, not listing user's groups)
    *   `/api/media/` (ViewSet for EventMedia CRUD - used for image/video upload/delete)
    *   `/api/media/event_media/?event_id={id}` (Custom action to get media for a specific event)
    *   `/api/notifications/`
    *   `/api/users/me/` (Profile)
    *   `/api/vacations/{vacation_id}/invites/` (POST - Send vacation invite)
    *   `/api/vacations/invites/pending/` (GET - List pending invites for user's families)
    *   `/api/vacations/invites/{invite_id}/respond/` (POST - Accept/Decline invite)
    *   `/api/vacations/accept-invite/{token}/` (POST - Accept invite via deep link token)
    *   `/api/invites/{invite_id}/` (DELETE - Revoke family invite) - Confirmed
    *   `/api/families/{id}/sent-invites/` (GET - List sent invites for a family) - Added
    *   `/api/join-requests/` (POST - Create join request) - Confirmed
    *   `/api/families/{id}/join-requests/` (GET - List join requests for a family) - Added
    *   `/api/join-requests/{request_id}/approve/` (POST - Approve join request) - Confirmed
    *   `/api/join-requests/{request_id}/reject/` (POST - Reject join request) - Confirmed
    *   `/api/family-relationships/` (CRUD for Family Relationships) - Added
    *   `/api/meta-family-memberships/` (CRUD for Meta Family Memberships) - Added
    *   `/api/item-categories/` (GET - List item categories) - Added
    *   `/api/labels/` (GET - List labels) - Added
    *   `/api/auth/session-store-referral/` (POST - Store referral code in session before OAuth) - Added
    *   `/api/calendar-connect/ics-url/` (POST - Connect external calendar via ICS URL) - Confirmed
    *   `/api/calendar-connect/ics-file/` (POST - Upload ICS file) - Added
    *   `/api/external-calendars/{account_pk}/sync/` (POST - Trigger manual sync for an account) - Confirmed
    *   *(Note: No dedicated `/api/vacation-regions/` endpoint confirmed)*
    *   *(Note: Item serializers now include category/label data)*
    *   *(Note: Calendar filtering on `/api/events/` confirmed to handle visibility)*
    *   *(More endpoints exist as per the full API)*

## Development Setup & Constraints

*   **Environment:** Node.js, npm/yarn, Watchman, React Native CLI, Xcode (for iOS), Android Studio (for Android).
*   **Dependencies:** Manage via `package.json`.
*   **Backend Interaction:** Read-only access to `/Users/danielobrien/code/family-scheduler` for context. No direct modifications allowed as per `.clinerules`. Backend changes must be requested.
*   **Offline Support:** Not in initial scope (TBD).
*   **Accessibility:** Must adhere to WCAG 2.1 AA guidelines.

## Key Libraries to Install Initially

*   `@reduxjs/toolkit`
*   `react-redux`
*   `@react-navigation/native`
*   `@react-navigation/stack`
*   `react-native-screens`
*   `react-native-safe-area-context`
*   `axios` (if chosen over fetch)
*   `react-native-calendars`
*   `react-native-keychain`
*   `react-native-paper`
*   `@react-navigation/bottom-tabs`
*   `react-native-modal-datetime-picker`
*   `@react-native-community/datetimepicker`
*   `react-native-google-places-autocomplete`
*   `@react-native-picker/picker`
*   `react-native-get-random-values`
*   `react-native-image-picker`
*   `react-native-vector-icons` (already installed)

*(Note: This list will be refined as development progresses. API endpoint details need verification against the actual backend implementation.)*

Test Logins:
You can use any of the following with curl to make test API calls:
```{
                "username": "testuser10",
                "email": "dobrien.nj+testuser@gmail.com",
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "User1",
                "family_name": "Smith Family",
            },
            {
                "username": "testuser11",
                "email": "test2@example.com",
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "User2",
                "family_name": "Johnson Family",
            },
            {
                "username": "testuser12",
                "email": "test3@example.com",
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "User3",
                "family_name": "Williams Family",
            },
            {
                "username": "testuser13",
                "email": "test4@example.com",
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "User4",
                "family_name": "Brown Family",
            },
            {
                "username": "testuser15",
                "email": "test5@example.com",
                "password": "testpass123",
                "first_name": "Test",
                "last_name": "User5",
                "family_name": "Davis Family",
            }```
