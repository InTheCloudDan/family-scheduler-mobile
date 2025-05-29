# Progress: Family Scheduler Mobile App (Auth Setup)

## What Works

*   **Project Setup:** Memory Bank documentation structure established. React Native (TypeScript) project initialized.
*   **Core Dependencies:** Redux, React Navigation, Axios, Keychain installed (manually).
*   **Redux:** Store configured, `authSlice` created and integrated.
*   **Navigation:** Basic `AuthNavigator` and `AppNavigator` structure in place, conditionally rendering based on Redux state.
*   **API Client:** Axios instance configured (`apiClient`) with request/response interceptors for token injection and refresh.
*   **Login Screen:** UI created, connected to Redux, API call implemented, token storage via Keychain implemented, "Forgot Password?" link added.
*   **Registration Screen:** UI created, connected to Redux, API call implemented.
*   **Password Reset:** Request and Confirm screens created and added to navigation. API calls implemented. (Deep linking TBD).
*   **Startup Auth Check:** Logic implemented in `App.tsx` and `authThunks.ts` to check stored token on load.
*   **Google Sign-In:** Frontend logic and button added to Login screen. Requires backend endpoint and native setup by user.
*   **Main Navigation:** Bottom Tab Navigator (`MainTabNavigator`) created and integrated into `AppNavigator`. Icons added using `react-native-vector-icons`.
*   **Tab Screens:** Initial UI created for Dashboard, Calendar, Tasks, and Settings screens using React Native Paper components. Dashboard includes upcoming event/task/notification fetching/display, event search functionality, and logout. Settings includes logout. Calendar screen includes `react-native-calendars` component integration with event fetching, marking, and basic agenda view. Tasks screen includes basic list fetching. (Events tab removed).
*   **UI Library:** Integrated `react-native-paper` (`PaperProvider`) and applied to Auth and Tab screens.
*   **Dashboard Event Navigation:** Events (upcoming or search results) are clickable and navigate to a new `EventDetailScreen` via a nested `DashboardStackNavigator`.
*   **Vacation Feature (Partial):**
    *   Vacations tab added with stack navigator (`VacationsStackNavigator`).
    *   `VacationsScreen` fetches and displays list from `/api/vacation-plans/`.
    *   Placeholder `VacationDetailScreen` and `VacationFormScreen` created.
    *   `VacationFormScreen` includes Date Pickers, Google Places Autocomplete, Family Group Picker (fetching data from `/api/families/`), and Region Picker (fetching data from `/api/vacation-regions/`).
    *   `familySlice` added to Redux for managing family group data (initially for picker).
    *   `react-native-get-random-values` polyfill added.
*   **Family Management (Core CRUD & Screens):**
    *   New "Family" tab added to `MainTabNavigator`.
    *   `FamilyStackNavigator` created and populated with `FamilyScreen`, `FamilyDetailScreen`, `FamilyFormScreen`, `MemberManagementScreen`, `ChildManagementScreen`, `InviteFormScreen`, `AddChildScreen`.
    *   `FamilyScreen` fetches and displays family list, navigates to Detail/Create.
    *   `FamilyDetailScreen` fetches and displays details, members, children; navigates to Edit/Delete/Manage Members/Manage Children/Invite.
    *   `FamilyFormScreen` handles Create/Update family name.
    *   `MemberManagementScreen` displays members, implements Remove Member logic.
    *   `ChildManagementScreen` displays children, navigates to Add Child.
    *   `AddChildScreen` implements Add Child form and logic.
    *   `InviteFormScreen` implements Invite Member form and logic.
    *   `MemberManagementScreen` implements Member Role Update UI/logic.
    *   `ChildManagementScreen` implements Child Delete logic.
    *   `EditChildScreen` implements Child Edit UI/logic (including profile picture and user account linking).
    *   `familySlice` enhanced with state, interfaces, and thunks for Family CRUD, Member list/remove/update, Child list/add/update/delete, Invite create, User linking selectors.
*   **Event Media (Image/Video):**
    *   Added `react-native-image-picker` dependency.
    *   Updated `eventsSlice` with state, thunks (`fetchEventMedia`, `uploadEventMedia`, `deleteEventMedia`), and reducers for media management.
    *   Integrated media fetching, display, upload, and deletion into `EventDetailScreen`.
    *   Added required native permissions (iOS `Info.plist`, Android `AndroidManifest.xml`).
    *   **Nearby Restaurants:** Added collapsible section with API fetching, display, and map linking.
*   **Vacation Invites Feature (Core):**
    *   Updated `vacationsSlice` with state, interfaces, thunks, reducers, and selectors for invites.
    *   Added "Invite Family" UI and logic to `VacationDetailScreen`.
    *   Created `PendingVacationInvitesScreen` to list and handle invites.
    *   Created `SettingsStackNavigator` and updated `MainTabNavigator` for navigation.
    *   Configured deep linking (Android, iOS, React Navigation) and implemented handling logic in `App.tsx`.
    *   Introduced `RootStackParamList` in `AppNavigator` for better navigation structure.
*   **Calendar Filtering Setup:**
    *   Analyzed web app features and backend API.
    *   Created `calendarSlice.ts` and `CalendarFilterModal.tsx`.
    *   Integrated filter modal trigger into `CalendarScreen.tsx`.
*   **Add External Calendar (ICS URL):**
    *   Created `AddIcsCalendarScreen.tsx` with form UI.
    *   Added `addIcsCalendar` thunk to `calendarSlice.ts` (for URL import).
    *   Integrated thunk/selectors into `AddIcsCalendarScreen.tsx`.
    *   Added screen to `SettingsStackNavigator`.
    *   Added navigation item to `SettingsScreen.tsx`.
*   **Vacation Item CRUD:** Implemented Add/Edit/Delete for items in `PackingListScreen.tsx` and `GroceryListScreen.tsx`. (Backend now provides category/label data).
*   **Keychain Logout:** Implemented Keychain token clearing on logout in `SettingsScreen.tsx`.
*   **Pull-to-Refresh:** Added/Verified pull-to-refresh in `VacationsScreen.tsx`, `PackingListScreen.tsx`, `GroceryListScreen.tsx`, `TasksScreen.tsx`, and `FamilyScreen.tsx`. Verified pagination handling in corresponding thunks.
    *   **Design System v1 ("Poppy"):** Created `memory-bank/designGuidelines.md` and applied the new light theme colors globally via `PaperProvider` in `App.tsx`.
    *   **Dashboard FAB:** Added `EventFormScreen` to `DashboardStackNavigator` and implemented initial navigation from FAB to `EventFormScreen`.
    *   **Settings Screen Fixes & Profile Implementation:**
        *   Conditionally rendered "Change Password" based on backend `has_social_account` field.
        *   Created `profileSlice.ts` for profile state management.
        *   Integrated `profileSlice` into root reducer.
        *   Implemented `ProfileScreen.tsx` with API fetching (`GET /api/profiles/{userId}/`) and updating (`PATCH /api/profiles/{userId}/`) for `UserProfile` fields. User fields (name, email) are read-only.

## What's Left to Build

*   **Authentication Flow:**
    *   ~~Registration Screen (UI & Logic)~~ (Done)
    *   ~~Password Reset Flow~~ (Done - UI/Logic; Deep linking TBD)
    *   ~~Check stored token on app startup~~ (Done)
    *   ~~Token refresh logic (using interceptors)~~ (Done)
    *   ~~Google OAuth Integration~~ (Done - Frontend logic moved to RegisterScreen; Backend endpoint `/api/auth/session-store-referral/` ready; Testing needed)
*   **Main Application:**
    *   ~~Implement Main App Navigator (Tabs/Drawer)~~ (Done - Bottom Tabs)
    *   ~~Implement Dashboard Screen~~ (Done - Initial UI)
    *   ~~Implement initial UI for remaining tab screens (Calendar, Events, Tasks, Settings)~~ (Done)
    *   ~~Integrate Icon library for tabs~~ (Done)
    *   **Refine Styling / Choose UI Library:** ~~Decide on UI library~~ (Done - Paper). ~~Apply to Auth screens~~ (Done). ~~Apply Paper components/styling to Tab screens~~ (Done). **Applied new "Poppy" light theme globally.**
    *   **Implement Screen Features:** ~~Build out initial Dashboard functionality~~ (Done - Upcoming events/tasks/notifications, event navigation). ~~Integrate basic Calendar component~~ (Done - Including event fetching/marking and agenda view). ~~Implement basic Events list/search~~ (Done). ~~Implement basic Tasks list~~ (Done). **Implement Event Detail Fetching:** (Done - Basic details passed via nav; Media fetching added). **Refine Event Detail Screen:** ~~Add Nearby Restaurants section~~ (Done). Review UI/UX, especially the media section. Consider adding caption editing. Continue implementing features for Settings screen and refining other screens.
    *   **Implement Calendar Features:**
        *   **Filtering:**
            *   ~~Analyze web app features~~ (Done).
            *   ~~Analyze backend API/serializers~~ (Done).
            *   ~~Create `calendarSlice.ts`~~ (Done).
            *   ~~Create `CalendarFilterModal.tsx`~~ (Done).
            *   ~~Integrate filter modal trigger into `CalendarScreen.tsx`~~ (Done).
            *   **Backend Changes:** Filtering logic confirmed sufficient. Serializers confirmed to include necessary data.
            *   **Implement Frontend Logic:** Update `fetchFilterOptions` thunk (if needed for UI), update event fetching logic to use filters, refine modal UI, display colors/child info.
        *   **Add External Calendar (ICS URL):**
            *   ~~Create `AddIcsCalendarScreen.tsx`~~ (Done).
            *   ~~Add `addIcsCalendar` thunk to `calendarSlice.ts`~~ (Done - Targeting `/api/calendar-connect/ics-url/`).
            *   ~~Integrate thunk/selectors into `AddIcsCalendarScreen.tsx`~~ (Done).
            *   ~~Add screen to `SettingsStackNavigator`~~ (Done).
            *   ~~Add navigation item to `SettingsScreen.tsx`~~ (Done).
        *   **Add External Calendar (ICS File Upload):**
            *   **Backend Ready:** Endpoint `POST /api/calendar-connect/ics-file/` available.
            *   Implement UI in Settings to allow file selection (using `react-native-document-picker` or similar).
            *   Create Redux thunk to handle file upload via FormData.
            *   Integrate into Settings navigation.
        *   Implement Add/Edit Event functionality.
        *   Implement other Calendar views (Week, Day) if needed.
    *   **Implement Vacation Feature:**
        *   ~~Create `VacationsScreen.tsx` and add to `MainTabNavigator`~~ (Done - Stack added).
        *   ~~Setup Redux slice (`vacationsSlice.ts`)~~ (Done).
        *   ~~Implement API interactions for fetching vacations list~~ (Done).
        *   ~~Build UI for listing vacations~~ (Done).
        *   ~~Create placeholder screens for Detail/Form~~ (Done).
        *   ~~Implement basic navigation stack~~ (Done).
        *   ~~Integrate Date Pickers, Location Autocomplete, Family Picker into Form~~ (Done).
    *   Implement Create/Update API calls in `VacationFormScreen`.
    *   ~~Implement Fetch/Display logic in `VacationDetailScreen`~~ (Done - Basic details, members, quests).
    *   ~~Implement Region selection (currently text input due to API limitation).~~ (Done - Replaced with Dropdown)
    *   ~~Implement Packing/Grocery List features (Viewing lists/items done; Add/Edit/Delete Done).~~
    *   **Implement Category/Label Display:** Update `PackingListScreen` and `GroceryListScreen` to fetch/display category and label names using new APIs (`/api/item-categories/`, `/api/labels/`) and updated serializers.
    *   **Refactor Event Search:** ~~Merge into Dashboard~~ (Done). ~~Remove Events Tab~~ (Done).
    *   **Implement Family Management Features (Remaining):**
        *   ~~Setup Navigation & Redux Slice~~ (Done)
        *   ~~Implement Family List Screen~~ (Done)
        *   ~~Implement Family Detail Screen (Read)~~ (Done)
        *   ~~Implement Family Form Screen (Create/Update)~~ (Done)
        *   ~~Implement Family Delete~~ (Done)
        *   ~~Create Member Management Screen (Basic UI)~~ (Done)
        *   ~~Implement Member Removal~~ (Done)
        *   ~~Implement Member Role Update.~~ (Done)
        *   ~~Create Child Management Screen (Basic UI)~~ (Done)
        *   ~~Implement Add Child~~ (Done)
        *   ~~Implement Edit/Delete Child.~~ (Done)
        *   ~~Implement Link Child to User Account.~~ (Done)
        *   ~~Create Invite Form Screen~~ (Done)
        *   ~~Implement Send Invite~~ (Done)
        *   **Implement Invite Listing/Revoking:** Create UI (likely in `FamilyDetailScreen` or a dedicated screen) to list sent invites (`GET /api/families/{id}/sent-invites/`) and revoke them (`DELETE /api/invites/{invite_id}/`). Add necessary Redux state/thunks.
        *   Handle accepting/declining invites (Via deep linking/notifications - Future Task). -> **(Implemented via Deep Link & Pending Screen)**
    *   **Implement Vacation Invites Feature (Testing):**
        *   Test invite flows thoroughly (Sending, Receiving, Responding, Deep Link success/error cases, unauthenticated user flow).
    *   **Implement OAuth Referral Code Flow (Testing):**
        *   ~~Add Referral Code input and Google Sign-Up button to `RegisterScreen.tsx`~~ (Done).
        *   ~~Implement pre-OAuth API call to `/api/auth/session-store-referral/` in `RegisterScreen.tsx`~~ (Done).
        *   ~~Remove Google Sign-In from `LoginScreen.tsx`~~ (Done).
        *   **Backend Ready:** Endpoint `/api/auth/session-store-referral/` available.
        *   Test full flow.
    *   Implement full features for remaining screens (Notes, Notifications, Settings refinement) as per spec. This includes UI for:
        *   ~~Listing/Revoking sent family invites~~ (Moved to Family Management).
        *   Creating/Managing family join requests (Backend APIs available).
        *   Managing Family Relationships/Meta Families (Backend APIs available, low mobile priority?).
        *   ~~Uploading ICS files~~ (Moved to Calendar Features).
        *   **Implement Profile Screen (Refinement):** Enhance `ProfileScreen` (e.g., add date/color pickers, improve error handling/validation).
    *   **Implement Dashboard FAB Action Sheet:** Add an Action Sheet or Modal to the Dashboard FAB to allow users to choose between adding an Event or a Task.
    *   **Implement Manual External Calendar Sync:** Add a sync button to `ExternalAccountsScreen` and connect it to the existing `POST /api/external-calendars/{account_pk}/sync/` endpoint.
    *   Refine UI Styling across the app.
    *   Push Notification integration.
    *   Accessibility improvements.
    *   Testing (Unit, Integration).
    *   **Visual Review:** Review app screens with the new theme, making component-level style adjustments as needed per `designGuidelines.md`.
    *   **Dark Theme:** Implement the corresponding dark theme.

## Current Status

*   **Phase:** General Feature Implementation & Refinement.
*   **Blockers:** None currently identified (Backend dependencies addressed). Focus shifts to frontend implementation and testing.

## Known Issues

*   `react-native-google-places-autocomplete` caused several render errors (`filter of undefined`, `onFocus of undefined`, `container of undefined`) requiring specific prop configurations and the `react-native-get-random-values` polyfill to resolve. Integration with `react-native-paper`'s `TextInput` might still be fragile.
*   TypeScript error "Cannot find module '../../navigation/VacationsStackNavigator'" persists in editor despite file existing and path seeming correct. Likely an environment/caching issue.
