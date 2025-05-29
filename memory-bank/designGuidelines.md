# Design Guidelines: Family Scheduler Mobile App (v1 - "Poppy")

## Core Principles

*   **Sleek & Clean:** Minimalist approach, generous whitespace, clear visual hierarchy.
*   **Modern:** Contemporary typography, vibrant but accessible color palette, consistent spacing.
*   **Poppy & Engaging:** Use of bright accent colors for key actions, clear calls-to-action, focus on readability and ease of use.
*   **Accessible:** Adhere to WCAG 2.1 AA guidelines, especially regarding color contrast and touch target sizes.
*   **Consistent:** Leverage `react-native-paper` theming for consistent application across the app.

## Color Palette (Light Theme Focus)

*   **Primary:** Vibrant Teal (`#00A99D`) - Used for primary buttons, active states, headers, FABs. (`theme.colors.primary`)
*   **Accent:** Warm Coral (`#FF6F61`) - Used for secondary actions, highlights, alerts, or specific callouts. Use sparingly. (`theme.colors.secondary` or `accent`)
*   **Background:** White (`#FFFFFF`) - Main screen background. (`theme.colors.background`)
*   **Surface:** Light Grey (`#F5F5F5`) - Card backgrounds, input backgrounds. (`theme.colors.surface`)
*   **Text (Primary):** Dark Grey (`#333333`) - Default text color on light backgrounds. (`theme.colors.onBackground`, `theme.colors.onSurface`)
*   **Text (Secondary):** Medium Grey (`#757575`) - Less important text, placeholders. (`theme.colors.onSurfaceVariant` is often suitable)
*   **Text (On Primary/Accent):** White (`#FFFFFF`) - For text on Primary/Accent backgrounds. (`theme.colors.onPrimary`, `theme.colors.onSecondary`)
*   **Error:** Standard Red (`#B00020`) - Material Default or similar accessible red. (`theme.colors.error`)
*   **Success:** Standard Green (e.g., `#4CAF50`). (Define custom color if needed: `theme.colors.success`)
*   **Warning:** Standard Orange/Yellow (e.g., `#FFA000`). (Define custom color if needed: `theme.colors.warning`)
*   **Disabled:** Light Grey (`#BDBDBD`) - For text and component backgrounds. (Use theme disabled states)
*   **Outline:** Medium Grey (`#757575`) - Default input outlines. (`theme.colors.outline`)

*Contrast Note: All text/background combinations must meet WCAG AA (4.5:1 for normal text, 3:1 for large text).*

## Typography

*   **Font Family:** System default sans-serif fonts (San Francisco for iOS, Roboto for Android) unless a specific custom font is integrated later. (Use `theme.fonts`)
*   **Scale (Examples - Adjust based on Paper defaults):** Use Paper's `Text` component `variant` prop (e.g., `headlineLarge`, `titleMedium`, `bodyLarge`). Rely on theme defaults unless specific overrides are necessary.
    *   `headlineLarge` - Major screen titles.
    *   `headlineSmall` - Section titles.
    *   `titleLarge` - Card titles, important labels.
    *   `titleMedium` - List item titles, subheadings.
    *   `bodyLarge` - Main body text.
    *   `bodyMedium` - Secondary text, captions.
    *   `labelLarge` - Button text.
*   **Line Height:** Use theme defaults provided by Paper components.

## Spacing (Based on 8pt Grid)

*   **Base Unit:** 8pt
*   **Padding/Margins:** Use multiples of the base unit (e.g., 4pt, 8pt, 12pt, 16pt, 24pt, 32pt). Apply consistently via `StyleSheet`.
    *   Screen Padding: 16pt horizontal, 16pt/24pt vertical.
    *   Card Padding: 16pt internal.
    *   List Item Padding: 16pt horizontal, 12pt/16pt vertical.
    *   Gap between elements: 8pt, 16pt.

## Component Styling (React Native Paper)

*   **Theme:** Configure a `theme` object passed to `PaperProvider`. **All components should derive colors, fonts, and roundness from this theme object whenever possible.**
*   **Avoid Hardcoding:** **DO NOT** hardcode color values (e.g., `'#FFFFFF'`, `'red'`) directly in `StyleSheet.create` or inline styles. Instead, use theme properties like `theme.colors.primary`, `theme.colors.background`, `theme.colors.onSurface`, etc. Access the theme within functional components using the `useTheme` hook from `react-native-paper`.
*   **`Appbar`:** Background: `theme.colors.surface` (or `background` depending on desired effect). Title Color: `theme.colors.onSurface` (or `onBackground`). Use appropriate `Text` variants.
*   **`Button`:**
    *   `mode="contained"`: Uses `theme.colors.primary` background and `theme.colors.onPrimary` text by default.
    *   `mode="outlined"`: Uses `theme.colors.primary` for border and text by default.
    *   `mode="text"`: Use `textColor={theme.colors.primary}` prop for clarity if needed.
    *   Disabled states handled by the theme.
    *   Full width for form actions where appropriate (use `style` prop).
*   **`TextInput`:**
    *   `mode="outlined"` preferred.
    *   Colors derived from theme (outline, label, text). Active outline uses `theme.colors.primary`.
    *   Background should match `theme.colors.surface` or `background` depending on context.
*   **`Card`:**
    *   Background: `theme.colors.surface`.
    *   Elevation: Use theme defaults or subtle override (e.g., `elevation={1}`).
    *   Corner Radius: Use `theme.roundness`.
    *   Padding: Consistent internal padding (16pt) via `style` prop.
*   **`FAB` (Floating Action Button):**
    *   Background: `theme.colors.primary` or `theme.colors.secondary`.
    *   Icon Color: `theme.colors.onPrimary` or `theme.colors.onSecondary`.
*   **`BottomNavigation`:**
    *   Active Color: `theme.colors.primary`.
    *   Inactive Color: `theme.colors.onSurfaceVariant` (or similar secondary text color).
    *   Background: `theme.colors.elevation.level2` (or `surface`/`background`).
*   **`Avatar.Icon` / `Avatar.Image`:** Use theme colors. Ensure fallback (`Avatar.Icon`) provides good contrast (uses `theme.colors.primary` by default).
*   **`List.Item`:** Background uses `theme.colors.surface`. Text colors use `theme.colors.onSurface`. Use appropriate `Text` variants for title/description.

## Iconography

*   Use `react-native-vector-icons/MaterialCommunityIcons` consistently.
*   Ensure icons are clear, simple, and universally understood.
*   Icon Color: Should generally derive from context (e.g., `theme.colors.onSurface`, `theme.colors.primary` in buttons/active states).

## Dark Theme (Future Consideration)

*   A corresponding dark theme should be created using the same principles, adjusting the color palette as needed while maintaining contrast.
*   Leverage `MD3DarkTheme` as a base and apply overrides consistent with the light theme's structure.
