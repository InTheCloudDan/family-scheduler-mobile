# Active Context: Family Scheduler Mobile App (Family Management Setup)

## Current Focus

*   **Vacation Invites:** Finalizing implementation and testing (Inviting, Viewing Pending, Responding, Deep Linking).
*   **Vacation Feature:** Finishing Create/Update API calls. Fetching/displaying category/label names for items is now possible with new backend endpoints.
*   **Family Management:** Implementation complete (Member Role Update, Child Edit/Delete/Link).

## Recent Changes

*   Created initial Memory Bank files:
    *   `projectbrief.md`
    *   `productContext.md`
    *   `systemPatterns.md`
    *   `techContext.md`
*   Implemented Authentication Flow (Login, Register, Password Reset, Token Handling, Google Sign-In frontend).
*   Implemented Main Tab Navigator and basic structure for Dashboard, Calendar, Tasks, Settings, Vacations tabs.
*   Integrated React Native Paper UI library and applied basic styling.
*   Implemented basic Dashboard functionality (upcoming events/tasks/notifications).
*   Integrated basic Calendar view (`react-native-calendars`).
*   Implemented basic Tasks list view.
*   Implemented Vacation list, detail view (including members, quest progress), and form (with date/location/family pickers).
*   Implemented Packing/Grocery list viewing (displaying lists and nested items).
*   Added pull-to-refresh for Vacation, Packing, and Grocery lists.
*   **Consolidated Event Search:** Moved search bar and results display from Events tab to Dashboard screen. Removed Events tab from `MainTabNavigator`.
*   **Family Management Setup:**
    *   Identified relevant backend API endpoints (`/families`, `/memberships`, `/invites`, `/children`, etc.) in `users/api.py` and `users/urls.py`.
    *   Created placeholder `FamilyScreen.tsx` and `FamilyStackNavigator.tsx`.
    *   Added "Family" tab to `MainTabNavigator.tsx`.
    *   Enhanced `familySlice.ts` with state structure, interfaces (User, FamilyGroup, FamilyMembership, FamilyInvite, Child), and async thunks (fetchFamilyGroups, fetchFamilyDetail, fetchFamilyMembers, fetchFamilyChildren, createFamily, updateFamily, deleteFamily, createInvite, acceptInvite, declineInvite, addChild, removeMembership).
    *   Updated `FamilyScreen.tsx` to fetch and display the list of families using Redux, navigate to Detail/Create.
    *   Implemented `FamilyDetailScreen` to fetch/display details, members, children, and navigate to Edit/Delete/Manage Members/Manage Children/Invite.
    *   Implemented `FamilyFormScreen` for creating and editing family names.
    *   Implemented `deleteFamily` logic with confirmation in `FamilyDetailScreen`.
    *   Created basic `MemberManagementScreen`, `ChildManagementScreen`, `InviteFormScreen`, `AddChildScreen` components.
    *   Added all screens to `FamilyStackNavigator` and enabled navigation.
    *   Implemented `removeMembership` logic with confirmation in `MemberManagementScreen`.
    *   Implemented `addChild` logic in `AddChildScreen`.
    *   Implemented `createInvite` logic in `InviteFormScreen`.
    *   Implemented Member Role Update UI/logic in `MemberManagementScreen`.
    *   Implemented Child Delete logic in `ChildManagementScreen`.
    *   Implemented Child Edit UI/logic (including profile picture and user account linking) in `EditChildScreen`. Added necessary Redux selectors.
    *   **Event Media:** Implemented image/video fetching, display, upload (using `react-native-image-picker`), and deletion functionality within `EventDetailScreen`. Updated `eventsSlice` accordingly. Added necessary native permissions (iOS Info.plist, AndroidManifest.xml).
    *   **Vacation Invites Feature:**
        *   Updated `vacationsSlice.ts` with state, interfaces (`VacationInvite`), thunks (`sendVacationInvite`, `fetchPendingVacationInvites`, `respondToVacationInvite`, `acceptVacationInviteByToken`), reducers, and selectors.
        *   Exported `User` and `FamilyGroup` interfaces from `familySlice.ts`.
        *   Added "Invite Family" button, modal, and logic to `VacationDetailScreen.tsx`.
        *   Created `PendingVacationInvitesScreen.tsx` to display and handle pending invites.
        *   Created `SettingsStackNavigator.tsx` to manage navigation from Settings.
        *   Updated `MainTabNavigator.tsx` to use `SettingsStackNavigator`.
        *   Configured deep linking for Android (`AndroidManifest.xml`) and iOS (`Info.plist`).
        *   Implemented deep link handling logic in `App.tsx` using `Linking` API and navigation ref.
        *   Introduced `RootStackParamList` in `AppNavigator.tsx` to manage top-level navigation (Auth vs. MainTabs).
    *   **Event Detail Enhancement:** Added a collapsible "Nearby Restaurants" section to `EventDetailScreen`, fetching data from `/api/events/{event_id}/nearby-restaurants/` using local component state and `react-native-collapsible`.
    *   **Calendar Filtering Setup:**
        *   Analyzed web app calendar views (`calendars/views/calendar_views.py`) to identify required filtering features (by internal/external calendars, families, visibility, members).
        *   Analyzed backend API (`events/api.py`, `calendars/api.py`, `events/serializers.py`) and determined necessary backend changes for filtering support on `/api/events/` and data enrichment (calendar color, child info) in `EventDetailSerializer`.
        *   Created `calendarSlice.ts` to manage filter state and options.
        *   Created `CalendarFilterModal.tsx` component.
        *   Integrated filter modal trigger (FAB) into `CalendarScreen.tsx`.
    *   **Add External Calendar (ICS URL):**
        *   Created `AddIcsCalendarScreen.tsx` with form UI.
        *   Added `addIcsCalendar` thunk to `calendarSlice.ts` targeting the `/api/calendar-connect/ics-url/` API endpoint (for URL import).
        *   Integrated thunk/selectors into `AddIcsCalendarScreen.tsx`.
        *   Added screen to `SettingsStackNavigator`.
        *   **Confirmed:** Backend API now supports direct ICS file upload via `/api/calendar-connect/ics-file/`.
        *   Added navigation item to `SettingsScreen.tsx`.
    *   **Vacation Item CRUD:** Implemented Add/Edit/Delete functionality for items in `PackingListScreen.tsx` and `GroceryListScreen.tsx` (including fixing previous errors). Backend now provides category/label data in serializers.
    *   **Keychain Logout:** Implemented Keychain token clearing on logout in `SettingsScreen.tsx`.
    *   **Pull-to-Refresh:** Added/Verified pull-to-refresh in `VacationsScreen.tsx`, `PackingListScreen.tsx`, `GroceryListScreen.tsx`, `TasksScreen.tsx`, and `FamilyScreen.tsx`. Verified pagination handling in corresponding thunks.
    *   **OAuth Referral Code (Frontend & Backend):**
        *   Added Referral Code input and Google Sign-Up button to `RegisterScreen.tsx`.
        *   Implemented logic in `RegisterScreen.tsx` to call `/api/auth/session-store-referral/` (if code provided) *before* initiating Google Sign-In. (Backend endpoint confirmed).
        *   Removed Google Sign-In button/logic from `LoginScreen.tsx`.
    *   **Design System v1 ("Poppy"):**
        *   Created `memory-bank/designGuidelines.md` defining a new light theme (colors, typography, spacing).
        *   Implemented the new light theme colors in `App.tsx` by updating `CombinedPaperLightTheme`.
        *   Fixed resulting ESLint issues in `App.tsx`.
    *   **Dashboard FAB:** Implemented initial navigation from the Dashboard FAB to `EventFormScreen` (Add Event). Added `EventFormScreen` to `DashboardStackNavigator`.
    *   **Settings Screen Fixes:**
        *   Backend `UserSerializer` updated to include `has_social_account` field.
        *   Updated `authSlice.ts` to handle the new field.
        *   Updated `SettingsScreen.tsx` to conditionally render "Change Password" based on `has_social_account`.
        *   Created placeholder `ProfileScreen.tsx`.
        *   Updated `SettingsStackNavigator.tsx` to import and register `ProfileScreen`, fixing the Profile button navigation.
    *   **Profile Screen Implementation:**
        *   Created `profileSlice.ts` with thunks (`fetchUserProfile`, `updateUserProfile`) and selectors for managing profile state.
        *   Integrated `profileSlice` into the root reducer.
        *   Implemented `ProfileScreen.tsx` to fetch profile data (`GET /api/profiles/{userId}/`), display editable fields for `UserProfile` data, and save changes (`PATCH /api/profiles/{userId}/`). User fields (name, email) are displayed as read-only.
    *   **Vacation Form Enhancements:**
        *   Updated `VacationFormScreen.tsx` and `vacationsSlice.ts` to make the 'Region' field optional.
        *   Implemented logic in `VacationFormScreen.tsx` to automatically select the 'Family Group' if the user belongs to only one family when creating a new vacation.
        *   Resolved related TypeScript errors in `vacationsSlice.ts` and `VacationFormScreen.tsx`.

## Next Steps

1.  ~~Create `progress.md`~~ (Done)
2.  ~~Initialize React Native Project~~ (Done)
3.  ~~Install Core Dependencies~~ (Done)
4.  ~~Basic Setup~~ (Done)
5.  ~~Establish API Base URL~~ (Done)
6.  ~~Create API Service Layer~~ (Done)
7.  ~~Implement Authentication Flow~~ (Done - Deep linking TBD)
8.  ~~Implement Main App Navigator~~ (Done)
9.  ~~Implement Dashboard Screen~~ (Done - Search added)
10. ~~Implement Remaining Tab Screens~~ (Done - Events tab removed)
11. ~~Add Tab Icons~~ (Done)
12. ~~Refine Styling / Choose UI Library~~ (Done - Paper). **Applied new "Poppy" light theme.**
13. **Implement Screen Features:**
    *   ~~Implement basic Dashboard functionality~~ (Done)
    *   ~~Integrate basic Calendar component~~ (Done)
    *   ~~Implement basic Events list/search~~ (Done - Merged into Dashboard)
    *   ~~Implement basic Tasks list~~ (Done)
    *   ~~Implement Event Detail Navigation & Fetching~~ (Done - Needs review/refinement)
14. **Implement Vacation Feature:**
    *   ~~Create Screens & Navigation~~ (Done)
    *   ~~Setup Redux Slice~~ (Done)
    *   ~~Implement Fetching/Displaying Vacation List~~ (Done)
    *   ~~Implement Fetching/Displaying Vacation Detail~~ (Done)
    *   ~~Implement Add/Edit Form UI~~ (Done - Region changed to dropdown)
    *   Implement Create/Update API calls in `VacationFormScreen`.
    *   ~~Implement Add/Edit/Delete for Packing/Grocery lists and items.~~ (Done)
    *   Fetch and display category/label names for list items (Backend API/Serializers Updated).
15. **Refactor Event Search:** ~~Merge event search functionality into Dashboard~~ (Done). ~~Remove the Events tab~~ (Done).
16. **Implement Family Management Features:**
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
    *   Implement Invite Listing/Revoking (Backend API Available: `GET /api/families/{id}/sent-invites/`, `DELETE /api/invites/{invite_id}/`).
    *   Handle accepting/declining invites (Via deep linking/notifications - Future Task). -> **(Implemented via Deep Link & Pending Screen)**
17. **Implement Vacation Invites Feature:**
    *   ~~Update Redux Slice (`vacationsSlice`)~~ (Done)
    *   ~~Add Invite UI to `VacationDetailScreen`~~ (Done)
    *   ~~Create `PendingVacationInvitesScreen`~~ (Done)
    *   ~~Setup Navigation (`SettingsStackNavigator`, `MainTabNavigator`)~~ (Done)
    *   ~~Configure Deep Linking (Native & React Navigation)~~ (Done)
    *   Test invite flows (Sending, Receiving, Responding, Deep Link). **Note:** Backend endpoint `/api/vacation-invites/pending/` is available.
    *   **Test OAuth Referral Code Flow (Backend Ready):** Verify the referral code is correctly passed and handled during Google Sign-Up using the `/api/auth/session-store-referral/` endpoint.
18. **Continue Other Feature Implementation:**
    *   **Implement Calendar Filtering (Backend Ready):**
        *   Backend filtering logic confirmed.
        *   Update `fetchFilterOptions` thunk with actual API calls (if needed for filter UI).
        *   Update event fetching logic (`eventsSlice` or new thunk) to use selected filters.
        *   Refine `CalendarFilterModal` UI/UX.
        *   Display calendar colors and child info (Backend serializers confirmed).
    *   Implement full Calendar interaction (adding/editing events - separate from filtering).
    *   Implement full Task interaction (Add/Edit/Delete, Filtering).
    *   **Implement Dashboard FAB Action Sheet:** Add an Action Sheet or Modal to the Dashboard FAB to allow users to choose between adding an Event or a Task.
    *   Implement remaining Settings screen features (Profile, Change Password, Notifications, Calendar Sync, Privacy). This includes UI for:
        *   Listing/Revoking sent family invites.
        *   Creating/Managing family join requests.
        *   Managing Family Relationships/Meta Families (if deemed necessary for mobile).
        *   Uploading ICS files.
        *   ~~Implement Profile screen functionality (currently a placeholder).~~ (Done - Basic implementation)
        *   **Implement Manual External Calendar Sync:** Add a sync button to `ExternalAccountsScreen` and connect it to the existing `POST /api/external-calendars/{account_pk}/sync/` endpoint.
    *   **Refine Event Detail:** Review and enhance `EventDetailScreen`. (Nearby Restaurants section added). Consider adding caption editing for media.
    *   **Refine Vacation Items:** Update UI to display category/label names.
    *   Refine UI/UX across the app.
    *   Push Notifications.
    *   Testing.
    *   **Visual Review:** Review the application with the new theme applied to identify areas needing specific component-level style adjustments to fully match the "Poppy" guidelines.
    *   **Dark Theme:** Implement the corresponding dark theme based on `designGuidelines.md`.

## Active Decisions & Considerations

*   **API Structure:** Noted that `/api/families/`, `/api/vacation-plans/`, `/api/packing-lists/`, `/api/grocery-lists/`, `/api/vacation-regions/` are paginated (require extracting `results`). Packing/Grocery items are nested within their respective list API responses. Backend now provides endpoints for Item Categories (`/api/item-categories/`) and Labels (`/api/labels/`), and serializers include this data. `/api/vacation-regions/` endpoint confirmed and used for dropdown.
*   **Library Issues:** `react-native-google-places-autocomplete` required specific prop handling and the `react-native-get-random-values` polyfill.
*   **Event State:** `eventsSlice` uses a single `items` array for both upcoming events and search results. Dashboard logic fetches `fetchUpcomingEvents` initially and `fetchEvents` when searching.
*   **Event Media Implementation:** Added image/video upload via `/api/media/` endpoint. Audio upload is currently excluded pending backend model/service updates. Media is displayed in `EventDetailScreen`.
*   **Deep Linking Navigation:** Introduced `RootStackParamList` and updated `AppNavigator` to handle deep linking navigation correctly, especially when navigating between Auth and Main stacks. Used navigation ref in `App.tsx` for deep link handling logic. Resolved several TypeScript issues related to nested navigation types.
*   **Nearby Restaurants:** Implemented in `EventDetailScreen` using local state (`useState`) and `react-native-collapsible`. Fetches data from `/api/events/{event_id}/nearby-restaurants/` on demand when the section is expanded for the first time. Includes loading/error states and links to maps using `Linking`.
*   **Child Profile Pictures & Linking:** Implemented profile picture display/upload and user account linking via `user_account` field (PATCH `/api/children/{id}/`) in `EditChildScreen.tsx`.
*   **OAuth Referral Code Handling:** Frontend calls `/api/auth/session-store-referral/` before initiating Google Sign-In. Backend endpoint confirmed. Testing needed.
*   **ICS Upload:** Backend now supports file upload via `POST /api/calendar-connect/ics-file/`. Frontend UI/logic needed.
*   **Calendar Filtering:** Backend filtering logic confirmed sufficient for now. Frontend needs refinement for applying filters.
    *   **Family Management APIs:** Endpoints for listing sent invites, managing join requests, and managing family relationships/meta-families are now available. UI implementation pending.
    *   **Design System ("Poppy" v1):** Established initial guidelines focusing on a vibrant light theme (`#00A99D` primary, `#FF6F61` accent). Theme applied globally via `PaperProvider` in `App.tsx`. Further component-specific styling adjustments may be needed.
    *   **Settings Screen Logic:** The "Change Password" option is now hidden for users who signed up via social providers (e.g., Google), based on the new `has_social_account` field from the backend. The Profile button now navigates to the implemented `ProfileScreen`.
    *   **Profile Screen API:** Uses `GET /api/profiles/{userId}/` to fetch and `PATCH /api/profiles/{userId}/` to update profile data. Core user fields (name, email) are displayed read-only as they are not part of the `UserProfile` model updated by this endpoint.
*   **External Calendar Sync:** Manual sync trigger is possible using the existing `POST /api/external-calendars/{account_pk}/sync/` endpoint.
