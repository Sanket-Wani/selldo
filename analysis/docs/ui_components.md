# Sell.do Design System & UI Component Blueprint

## Visual Design System & Aesthetics

### 1. Typography & Hierarchy
- **Font Family**: Modern system sans-serif (`-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`).
- **Scale**:
  - `h1`: 24px - 28px, font-weight 600 (Page Titles, Sign-in banner).
  - `h2`: 20px - 22px, font-weight 600 (Section Headers).
  - `h3` / `h4`: 16px - 18px, font-weight 500 (Card Titles, Modal Headers).
  - Body Text: 13px - 14px, line-height 1.45, font-weight 400.
  - Meta / Sub-text: 11px - 12px, color muted (`#777777` / `#8c9ba5`).

### 2. Color Palette & Theming
- **Primary Accent**: Sell.do Red / Coral (`#ea4335` / `#d93829` / `#e53935`) used for primary buttons, notification counters, and active states.
- **Secondary Accent**: Deep Slate / Indigo (`#2c3e50` / `#1a252f`) used for sidebar container, headers, and top-navigation bar.
- **Backgrounds**:
  - Main App Canvas: Neutral Warm Gray (`#f4f6f9` / `#edf1f5`).
  - Card & Container Surface: Pure White (`#ffffff`) with subtle 1px border (`#e2e8f0` / `#e9ecef`) and soft elevation shadow (`0 2px 4px rgba(0,0,0,0.05)`).
- **Stage & Status Semantics**:
  - `Incoming`: Light Blue (`#2196f3`, bg: `#e3f2fd`)
  - `Prospect`: Purple / Indigo (`#5c6bc0`, bg: `#ede7f6`)
  - `Opportunity (Hot)`: Coral Red (`#f44336`, bg: `#ffebee`)
  - `Opportunity (Warm)`: Amber Orange (`#ff9800`, bg: `#fff3e0`)
  - `Booked`: Emerald Green (`#2e7d32`, bg: `#e8f5e9`)
  - `Lost`: Cool Gray / Crimson (`#757575` / `#c62828`)
  - `Unqualified`: Slate Gray (`#90a4ae`, bg: `#eceff1`)

### 3. Iconic Visual Elements & Micro-Animations
- **Icon Libraries**:
  - Ionicons (`ion-ios-*`, `ion-android-*`, `ion-social-whatsapp`, `ion-cube`, `ion-ios-color-wand`, `ion-speakerphone`).
  - FontAwesome 4.7 (`fa fa-phone`, `fa fa-bar-chart-o`, `fa fa-tasks`, `fa fa-bullseye`, `fa fa-chevron-down`).
- **Navigation Layout Blueprint**:
  - Fixed Top Navigation Bar (`.navbar.navbar-default.navbar-fixed-top.top-navigation`):
    - Left: Sell.do logo brand mark.
    - Center-Left: Global search bar (`Search...`) with instant lead/phone autocomplete.
    - Center-Right: Client organization selector pill (`Vishal Chugera Properties pvt ltd`).
    - Right: Support helpline (`+918069150607`), Account Balances (INR Balance & Leads Balance counter: `8174`), Notification Bell with badge counter, User profile dropdown avatar.
  - Left Primary Sidebar (`.main-nav-container`):
    - Slim 64px icon rail for major modules: Leads (`ion-ios-people`), Post Sales (`ion-ios-book`), WhatsApp (`ion-social-whatsapp`), Analytics (`fa-bar-chart-o`), Products (`ion-cube`), Automation (`ion-ios-color-wand`), Assets (`ion-ios-folder`), Settings (`ion-android-settings`).
  - Secondary Flyout / Contextual Sub-Nav:
    - 240px wide collapsible accordion panel displaying module filters, smart lists, pipeline stage counts, and custom views.

### 4. Interactive Components Blueprint
- **Lead 360 Header**:
  - Large CRM ID badge (`# 88898`).
  - Editable Customer Name with Inline Save.
  - Rating Score widget with star indicator.
  - Interactive Action Toolbar: Quick Call (triggers dual-leg telephony), Quick WhatsApp (opens conversation modal), Schedule Followup (date-time picker modal), Schedule Site Visit (project + slot selector), Push to Sales (assignee selection modal).
- **Data Tables & Grid System**:
  - Bulk Action multi-select header checkbox.
  - Sortable column headers with visual arrows.
  - Hover states on rows (`background: #f8fafc`).
  - Action ellipsis dropdown (`...`) on each row with "Preview", "Details", "Print", "Delete".
  - Sticky pagination footer with total records counter and page jumper.
- **Drawer / Slide-out Modals**:
  - Right-side slide-over drawers (`.modal.right.modal-from-right`) for quick lead overview without full page reload.
  - Top modal notifications (`.fixed-top-modal`).
