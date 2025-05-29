# React Native Mobile App Specification: Family Scheduler

## 1. Introduction

This document outlines the functional and technical specifications for the Family Scheduler mobile application, built using React Native for iOS and Android platforms. The mobile app will serve as a primary interface for family members to interact with the Family Scheduler platform, complementing the existing web interface. It will leverage the backend Django REST API for data persistence and business logic.

## 2. Goals

*   **Provide a seamless mobile experience:** Offer a user-friendly and intuitive interface optimized for mobile devices, consistent with the web platform's core functionality.
*   **Ensure cross-platform consistency:** Deliver a comparable feature set and user experience on both iOS and Android devices.
*   **Facilitate on-the-go coordination:** Enable family members to view schedules, manage events, respond to invitations, and communicate easily from their mobile devices.
*   **Leverage native capabilities:** Utilize push notifications for timely reminders and updates. Access native calendar functionalities where appropriate and permitted by the user.
*   **Maintain security and privacy:** Implement secure authentication and adhere to the platform's established role-based permissions and privacy controls.
*   **Optimize for performance:** Ensure the app is responsive, minimizes data usage, and performs efficiently on target mobile devices.
*   **Accessibility:** Adhere to WCAG 2.1 AA guidelines to ensure usability for all family members.

## 3. Core Functionality & Screens

The mobile application will mirror the core features available through the Django API. Key functional areas and corresponding screens include:

### 3.1. Authentication & Onboarding
*   **Login Screen:** Allow users to log in using email/password (JWT) or Google OAuth.
*   **Registration Screen:** Enable new users to sign up. Handle referral codes if provided.
*   **Password Reset:** Standard password reset flow.
*   **Onboarding (Optional):** Brief tutorial highlighting key features upon first login.

### 3.2. Dashboard/Home Screen
*   **Overview:** Display upcoming events, pending tasks, recent notifications, or a summary relevant to the user.
*   **Quick Actions:** Buttons for common tasks like adding a new event or task.
*   **Navigation:** Primary entry point to other sections of the app (e.g., via a tab bar or drawer menu).

### 3.3. Calendar Views
*   **Unified Calendar:** Display events from selected internal and synced external calendars.
*   **View Modes:** Support Day, Week, and Month views.
*   **Filtering:** Allow users to filter events by calendar, family member, or event type/category.
*   **Color Coding:** Utilize color coding for different family members or calendars as defined in the web application.
*   **Event Interaction:** Tapping an event should navigate to the Event Detail screen. Tapping an empty slot could initiate event creation.
*   **Vacation Context:** When viewing a specific vacation's calendar, automatically include relevant regional events alongside personal vacation plans (mirroring web functionality).

### 3.4. Event Management
*   **Event List Screen:** Display a chronological list of upcoming or past events with search/filter capabilities (leveraging FTS).
*   **Event Detail Screen:** Show comprehensive event information (title, description, time, location, participants, RSVP status, associated tasks, notes, polls, expenses).
*   **Event Creation/Edit Screen:** Form to create or modify events, including setting title, time, location, description, recurrence, participants, visibility, and associated calendar.
*   **RSVP Interaction:** Allow users to easily respond (Yes/No/Maybe) to event invitations directly from the detail screen or list.
*   **Event Search:** Implement search functionality using the backend FTS capabilities.

### 3.5. Task Management
*   **Task List Screen:** Display tasks assigned to the user or associated with specific events/projects. Filterable by status, assignee, or due date.
*   **Task Detail Screen:** Show task details, allow status updates (e.g., mark as complete), and potentially add comments.
*   **Task Creation/Edit Screen:** Form to create or modify tasks, assign them to users, set due dates, and link them to events if necessary.

### 3.6. Notes Management
*   **Note List Screen:** Display shared family notes or notes linked to specific events.
*   **Note Detail Screen:** View note content.
*   **Note Creation/Edit Screen:** Form to create or modify notes.

### 3.7. Vacation Planning
*   **Vacation List Screen:** Display upcoming and past family vacations.
*   **Vacation Detail Screen:** Show vacation overview, dates, location, participants, associated events, packing lists, grocery lists, and regional calendar context.
*   **Vacation Creation/Edit Screen:** Form to create or modify vacation plans, including setting dates, location (potentially linking to a Region), and participants.
*   **List Management (Packing/Grocery):**
    *   View items on packing and grocery lists associated with a vacation.
    *   Add/edit/delete items.
    *   Mark items as packed/purchased.

### 3.8. Family Management
*   **Family/Member List Screen:** Display family members and their roles.
*   **Invite Member Screen:** Allow authorized users (e.g., Parents) to invite new members via email or referral link.
*   **Profile Screen:** View/edit own user profile information.
*   **Family Settings (Limited):** View family details. Role/permission changes likely deferred to the web interface for complexity reasons, unless specified otherwise.

### 3.9. Notifications
*   **Notification List Screen:** Display a history of received notifications (event reminders, new invitations, task assignments, etc.).
*   **Push Notifications:** Utilize Firebase Cloud Messaging (FCM) or Apple Push Notification service (APNs) to deliver real-time alerts even when the app is not active. Tapping a notification should navigate to the relevant screen (e.g., Event Detail).

### 3.10. Settings
*   **Account Settings:** Manage profile information, change password.
*   **Notification Preferences:** Allow users to configure which notifications they receive (push/email).
*   **Calendar Settings:** Manage connections to external calendars (Google, Apple iCal via URL). Initiate manual sync.
*   **Privacy Settings:** Review and potentially adjust visibility settings (may link to web for complex adjustments).

## 4. Technical Specifications

### 4.1. Platform & Framework
*   **React Native:** Core framework for cross-platform development.
*   **Target Platforms:** iOS 13+ and Android 8+.

### 4.2. State Management
*   **Redux:** Manage global application state, including user authentication, calendar data, events, tasks, etc.

### 4.3. Navigation
*   **React Navigation:** Implement screen transitions and navigation structure (e.g., tab navigator, stack navigators).

### 4.4. API Interaction
*   **Django REST API:** The mobile app will communicate exclusively with the existing backend API endpoints.
*   **Authentication:** Implement JWT (JSON Web Token) authentication. Securely store tokens on the device. Handle token refresh logic.
*   **Data Fetching:** Use libraries like `axios` or `fetch` for API requests.
*   **Error Handling:** Implement robust error handling for API requests (network errors, server errors, authentication failures) providing clear feedback to the user, consistent with `.clinerules`.
*   **Data Synchronization:** Fetch data on demand and implement strategies for caching or background synchronization where appropriate to improve performance and reduce API calls.

### 4.5. Native Modules & Permissions
*   **Push Notifications:** Integrate with native push notification services (FCM/APNs). Request user permission.
*   **Calendar Access (Optional):** If direct interaction with the device's native calendar is required (beyond syncing via backend), request appropriate permissions.
*   **Other Permissions:** Request necessary permissions (e.g., network access).

### 4.6. UI Components & Libraries
*   Utilize standard React Native components.
*   Consider using a UI component library (e.g., React Native Elements, React Native Paper) for consistency and faster development, ensuring it aligns with UX goals (simplicity, accessibility).
*   Use a dedicated calendar component library (e.g., `react-native-calendars`) for calendar views.

### 4.7. Offline Support (Optional - TBD)
*   Consider basic offline support, such as caching recently viewed data. Full offline editing capabilities would require significant additional effort (conflict resolution, background sync). This should be a separate discussion if required.

## 5. Non-Functional Requirements

*   **Performance:** Optimize rendering, minimize API calls, ensure smooth navigation and interaction. Implement techniques like list virtualization for long lists.
*   **Security:** Securely store credentials (JWT), use HTTPS for all API communication, implement best practices against common mobile vulnerabilities.
*   **Usability:** Ensure the interface is intuitive and follows platform conventions (iOS/Android). Prioritize common actions.
*   **Reliability:** Implement comprehensive error handling and logging.
*   **Testability:** Structure code for unit and integration testing (e.g., using Jest).

## 6. Interaction with Django API

*   The mobile app is a client to the existing Django REST API.
*   All data creation, retrieval, updates, and deletions will be performed via API calls to the endpoints defined in `techContext.md`.
*   Authentication will use the `/api/auth/login/` endpoint to obtain JWT tokens, which will be included in the `Authorization: Bearer <token>` header for subsequent requests.
*   The app must respect the role-based permissions enforced by the API. UI elements for actions the user isn't permitted to perform should be hidden or disabled.
*   Data formats exchanged will be JSON, following the structure defined by the Django REST Framework serializers. Separate read/write serializers defined in the API should be respected.
