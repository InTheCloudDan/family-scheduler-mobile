# Onboarding Plan: Family Scheduler Mobile App

**Goal:** Create a welcoming and informative onboarding experience for new users, guiding them through initial setup (if needed) and familiarizing them with key app features. The flow must adapt based on whether the user is starting with a completely empty account or joining an existing setup with pre-populated data.

**Onboarding Scenarios:**

1.  **New User, Empty Account:** User registers and logs in for the first time. No families, events, tasks, etc., exist for them yet.
2.  **New User, Existing Account:** User logs in for the first time after being invited to one or more families. They will see shared data.

**Proposed Onboarding Flow:**

The onboarding flow will trigger immediately after the user's first successful login post-registration. It could be implemented as a sequence of screens or using a carousel/swiper component.

**Scenario 1: Empty Account Flow**

1.  **Screen 1: Welcome**
    *   **Content:** Friendly welcome message. Briefly state the app's purpose (e.g., "Your family's central hub for schedules, tasks, and plans!").
    *   **Action:** "Next" button.
2.  **Screen 2: The Core - Your Family**
    *   **Logic:** Check if the user belongs to any families (using `familySlice` state, assuming `fetchFamilyGroups` is called post-login). If empty:
    *   **Content:** Explain that the app revolves around families. Prompt the user: "To get started, create your first family group."
    *   **Actions:**
        *   **Primary:** "Create Family" button (navigates to `FamilyFormScreen`).
        *   **Secondary:** "Maybe Later" or "Skip" button (proceeds to feature intro).
3.  **Screen 3: Feature Tour (Highlights)**
    *   **Content:** Introduce key features sequentially (using text and potentially icons/simple illustrations matching the "Poppy" design):
        *   **Dashboard:** "See upcoming events and tasks at a glance on your Dashboard."
        *   **Calendar:** "View shared family calendars in one place."
        *   **Add Content:** "Use the '+' button (FAB) on the Dashboard to easily add new Events or Tasks." (Mentioning the future Action Sheet).
        *   **Vacations:** "Plan your next family getaway, complete with packing lists."
        *   **Settings:** "Customize your profile and connect external calendars in Settings."
    *   **Action:** "Next" through features.
4.  **Screen 4: All Set!**
    *   **Content:** Congratulatory message. "You're all set! Start exploring and organizing your family's schedule."
    *   **Action:** "Get Started" button (marks onboarding as complete, navigates to the main Dashboard screen).

**Scenario 2: Existing Account Flow**

1.  **Screen 1: Welcome Back / Welcome Aboard!**
    *   **Content:** Welcome message. Acknowledge they've joined existing families (e.g., "Welcome! You're now connected with the [Family Name] family."). If multiple families, list them or say "your families".
    *   **Action:** "Next" button.
2.  **Screen 2: Feature Tour (Data Context)**
    *   **Content:** Introduce key features, highlighting that they'll see existing shared data:
        *   **Dashboard:** "Your Dashboard shows upcoming events and tasks shared within your families." (Visually point towards the area where items appear).
        *   **Calendar:** "Check the Calendar to see everyone's schedule, including events from your families."
        *   **Tasks/Vacations:** "Shared tasks and vacation plans will appear in their respective sections."
        *   **Add Your Own:** "Use the '+' button (FAB) on the Dashboard to add your *own* events and tasks."
        *   **Settings:** "Manage your profile, check pending invites, or connect external calendars in Settings."
    *   **Action:** "Next" through features.
3.  **Screen 3: Ready to Go!**
    *   **Content:** Encouraging message. "Dive in and explore your family's shared schedules and plans!"
    *   **Action:** "Get Started" button (marks onboarding as complete, navigates to the main Dashboard screen).

**Implementation Plan:**

1.  **State Management:**
    *   Introduce an `hasCompletedOnboarding: boolean` flag in `authSlice`.
    *   Persist this flag using `AsyncStorage` (or similar) alongside the auth token logic in `authThunks.ts`. Load it on app start, save it upon completion.
2.  **Navigation:**
    *   Create `navigation/OnboardingNavigator.tsx` (StackNavigator).
    *   Modify `navigation/AppNavigator.tsx`: After checking authentication status, check the `hasCompletedOnboarding` flag from the Redux store. If `false`, render `OnboardingNavigator`; otherwise, render `MainTabNavigator`.
3.  **Screens:**
    *   Create new screens under `src/screens/Onboarding/`:
        *   `WelcomeScreen.tsx`
        *   `FamilyCheckScreen.tsx` (This might be a logical step rather than a visible screen, fetching family data and deciding the route).
        *   `FamilySetupScreen.tsx`
        *   `ExistingDataIntroScreen.tsx`
        *   `FeatureTourScreen.tsx` (Could potentially be a single screen using a swiper/carousel or multiple simple screens).
        *   `CompletionScreen.tsx`
4.  **Logic:**
    *   Ensure `fetchFamilyGroups` is dispatched early after login to inform the onboarding path.
    *   Implement navigation between onboarding screens.
    *   Connect the "Create Family" button to navigate to `FamilyFormScreen` and handle the return flow (potentially skipping the rest of the *empty* onboarding if a family is created).
    *   Implement the "Get Started" logic: dispatch action to update `hasCompletedOnboarding` state, save the flag to storage, and navigate to `MainTabNavigator` (Dashboard).
5.  **UI/UX:**
    *   Design screens following `designGuidelines.md` ("Poppy" theme). Use `react-native-paper` components.
    *   Keep text concise and clear.
    *   Consider using `react-native-swiper` or `react-native-app-intro-slider` for the feature tour part for a smoother experience.
    *   Ensure a "Skip" option is available, at least on the initial screens.
