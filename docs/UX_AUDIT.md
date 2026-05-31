# YPIT Internals - Full UI/UX Quality Audit Report
**Audited:** May 25, 2026 | **App:** https://ypit-internals.vercel.app/ | **Auditor:** Senior Product Designer + Frontend Engineer

---

## 1. Executive Summary

**What a new user would hit in the first 60 seconds:**

- **No login wall.** `/login` redirects to `/dashboard` directly - the app is fully accessible without credentials, giving zero security signal and potentially confusing any real-world user who expects authentication.
- **Dashboard is visually broken.** Four large white cards contain only light-grey placeholder text: *"Monthly Intake Chart Placeholder"*, *"Pipeline Stage Donut Placeholder"*, *"Recent Activity Feed Placeholder"*, *"Department Reports Placeholder"* - these are literal strings occupying ~60% of the screen. The above-the-fold experience looks unfinished.
- **Currency chaos.** In the first three pages a new user visits, three different currency formats appear: `TZS 45M` (Dashboard), `TZS 181.6M` (Payments), `TSh 273,585,000` (Finance). `/reports` shows `$1.2M` in USD. There is no single agreed format anywhere in the app.
- **The sidebar "Audit Logs" link 404s.** It points to `/audit` - a completely unstyled, black-screen Next.js 404 page - rather than `/audit-logs` where the page actually lives.
- **Finance KPI cards truncate all values at 1280px.** "RECEIVABLES" shows `TSh 2...` - the actual amount is invisible. This is the standard laptop breakpoint.
- **Table column sorting is non-functional.** All six sort icons (↑↓) across every table in the app are purely decorative - clicking them does nothing.
- **Tasks page shows blank white on first load** with no empty state, no illustration, no CTA - only after clicking "Create Task" do previously-seeded tasks appear.
- **The branded 404 page** (e.g. `/students/YP-2026-001`) renders "404 | This page could not be found." in near-white text on a white background - functionally invisible.

---

## 2. Design System Findings

### 2.1 Colors Observed

The app uses a coherent dark-red / crimson primary (`rgb(156, 0, 61)` ≈ `#9C003D`) consistently on active sidebar items and primary CTA buttons. However, currency and status semantics are not consistent:

| Role | Color(s) Used | Consistent? |
|---|---|---|
| Primary brand / CTA | `#9C003D` (crimson) | ✓ Yes |
| Success / positive | Green (`rgb(21,128,61)`) on badges; green (`oklch(0.627 0.194 149.214)`) on deltas | ✓ Yes |
| Warning | Orange-amber (`rgb(180,83,9)` on yellow bg) for PAYMENT PENDING | ✓ Yes |
| Danger / overdue | Crimson border cards on Finance overview | Partial - sometimes orange circle, sometimes red border |
| Info | Blue (`rgb(29,78,216)`) on blue bg for COUNSELING, APPLICATION SUBMITTED | ✓ Yes |
| Currency label | `TZS`, `TSh`, `$` all used for the same Tanzanian shilling | ✗ **Inconsistent** |
| Sidebar background | Dark (`#141413`) | ✓ Yes |

**Unique non-semantic colors counted:** ~7 distinct text colours, ~6 badge background colours. No design token system is surfaced in the CSS (uses Tailwind utility classes + OKLCH colour space - the color values are not obviously systematised).

**Specific cross-page status colour drift:**
- `ACTIVE` badge on `/subagents` is green-on-green, on `/staff` it's also green - consistent ✓
- `PAID` / `PAYMENT CONFIRMED` both use green - consistent ✓
- Finance `PAYABLES` icon is orange-circle; Finance overview `overdue` alert is red-border card - same semantic, different visual treatment ✗

### 2.2 Typography

Measured font sizes on `/dashboard`:

| Size | Count | Used for |
|---|---|---|
| 16px | 188 elements | Body text, KPI labels, badges |
| 14px | 35 elements | Sub-labels, "vs last month" |
| 12px | 7 elements | Badge text, small metadata |
| 36px | 4 elements | KPI numbers (524, 89, etc.) |
| 24px | 1 element | Sub-headings |
| 20px | 1 element | Section headings |
| 10px | 3 elements | Tiny labels |

**Issues observed:**
- No distinct h1/h2/h3 hierarchy in CSS - page titles ("Students", "Finance Hub", "Task Manager") visually differ in size but no semantic mapping is enforced consistently.
- Font weight is not systematically varied - most headings rely solely on `font-bold` (700). The KPI figures on dashboard are very large but the KPI labels ("Total Students") are the same 16px as body text, reducing scanability.
- The `10px` text (3 elements) is below minimum readable size at typical DPI.

### 2.3 Spacing

The app uses Tailwind's default 4px grid system (`p-4`, `gap-4`, `p-6`, etc.) which is correct in principle. However, several anomalies:
- The Finance `/finance` overview page KPI cards at 1280px viewport have only ~176px width - the content overflows by truncation rather than wrapping gracefully.
- The students table search bar has `w-1/2` maximum width but no `min-width`, causing it to shrink to 200px on narrower desktops.
- The pipeline progress stepper in student detail has no `overflow-x: auto` - at 1061px it overflows the card container with no scroll affordance.

### 2.4 Border Radii

Five distinct border-radius values are used:

| Value | Applied to |
|---|---|
| `6px` | Sidebar nav links (active state) |
| `12px` | Cards and modal containers |
| `8px` | Some inner data cards |
| `4px` | Small tags/labels |
| `~16,777,215px` (full pill) | Status badges, toggle switches |
| `0px` | One bare button (anomaly) |

This is acceptable for a Tailwind system (`rounded`, `rounded-md`, `rounded-lg`, `rounded-full`) but the mixing of 6px and 8px on similar-level elements (nav links vs card interiors) is slightly inconsistent.

### 2.5 Buttons

Primary button: crimson fill (`#9C003D`), white text, `rounded-md` (8px), consistent padding. **Mostly consistent** across pages.

**Observed variations:**
- `/finance/petty-cash` has two side-by-side primary-level CTAs: "Replenish Float" (white outline) and "New Voucher" (crimson fill). The visual hierarchy here is correct.
- The `/tasks` "Submit Report" button is white-outline style (secondary) while "Create Task" is crimson (primary) - correct.
- `/settings` "Save Changes" and "Update Password" buttons both carry a **save/floppy-disk icon** prefix - unusual for form submissions (most apps use no icon or a checkmark).
- `/subagents` "View Details" is a text link with an external-link icon (`↗`) - appropriate for navigation but could be confused with an out-of-app link.
- The `Student Payments` tab in Finance has the same external-link `↗` icon despite routing to `/payments` within the app - misleading affordance.

### 2.6 Form Inputs

Inputs: white background, `rounded-md` border, subtle gray border colour - **consistent** across pages. Placeholder text is helpful (`e.g. Tanzanian`, `jane@example.com`) in the Add Student drawer but generic (`Search...`) in table search boxes.

**Focus state:** Tailwind default outline focus ring is present but very subtle - barely passes contrast at 3:1. No custom focus ring defined.

**Validation style:** On "Add Student" submit with empty required field, a browser-native HTML5 tooltip appears ("Please fill out this field.") - this is inconsistent with an app that uses custom styled components everywhere. No custom inline error state exists.

### 2.7 Design System Conclusion

**Verdict: An *emerging* design system, not a mature one.** There is a clear brand direction (dark crimson primary, clean white content panels, Lucide-style icons, Tailwind utility classes) and many components behave consistently. However, the currency symbol chaos, the non-functional sort icons, missing empty states, and native browser validation mixing with custom UI are the hallmarks of a system that was built fast without a fully codified token set or component library specification.

---

## 3. Per-Page UI Quality

### `/dashboard`
**URL:** `https://ypit-internals.vercel.app/dashboard`
**State on load:** Partially populated (4 KPI cards with real data) + 4 large placeholder sections

**Working well:**
- KPI card layout (4-up grid) is clean at full width
- Delta indicators (↑12% vs last month) are clearly coloured green/red
- Page title and date are in a consistent top-left position

**Broken or off:**
- Four literal placeholder strings occupy the majority of the page: *"Monthly Intake Chart Placeholder"*, *"Pipeline Stage Donut Placeholder"*, *"Recent Activity Feed Placeholder"*, *"Department Reports Placeholder"*
- Placeholder text colour (`oklch(0.707 0.022 261.325)` ≈ `#B0B0B9`) on white background = **2.15:1 contrast ratio - fails WCAG AA**
- At 1440px, the "Revenue Collected" KPI card title wraps to two lines and "TZS 45M" also wraps - the number breaks across lines, harming readability
- Currency: `TZS 45M` - no locale separator, abbreviation format inconsistent with `/payments` (`TZS 181.6M`) and `/finance` (`TSh 273,585,000`)
- No loading skeleton - on page refresh, content area is blank until hydration

**Recommended fixes (UI/UX only):**
- Replace placeholder strings with skeleton/shimmer components, or a styled "coming soon" message with an icon
- Add `min-w-0` + `truncate` or `text-ellipsis` to KPI titles to prevent wrapping
- Standardise currency display: pick one format (`TSh 45,000,000` or `TZS 45M`) and apply everywhere

---

### `/students` (list)
**URL:** `https://ypit-internals.vercel.app/students`
**State:** Populated (20 students across 2 pages), empty state tested

**Working well:**
- Status badges are colour-coded with text labels (accessible - not colour-only)
- Pagination works (`Rows per page` selector, page indicator)
- Search filters rows in real time
- "Add Student" button top-right (correct placement)
- Empty search state shows "No results found." (minimal but functional)

**Broken or off:**
- **Sort icons (↑↓) are decorative only** - `cursor: auto`, no click handler, no `aria-sort` attribute - users expect these to sort
- **Filter chips (1 Lead, 1 Counseling, etc.) are non-interactive** - they show counts but clicking them does not filter the table. They look like interactive filter chips.
- **"CREATED DATE" column clips** at most viewport sizes (1280px shows only "Jan 10" with no year visible)
- **Row hover state is extremely subtle** - no background change visible on hover; cursor does change to pointer (rows are clickable to detail page)
- **The table rows do navigate** to `/students/std_001` - but no visual affordance indicates rows are clickable
- Filter chips display **stale counts**: after searching "zzzznoexist", the chip badges still show "1 Lead, 1 Counseling" even though 0 rows are shown
- No visible column for "Phone" or "Source" despite these being fields in the system
- Table columns have no `title` / tooltip for truncated content

**Recommended fixes:**
- Implement column sort on TH click, add `aria-sort` attribute, change cursor to pointer on sortable headers
- Make filter chips actually filter, or change them to read-only count badges with a different visual style (no border/hover state)
- Add `overflow: hidden; text-overflow: ellipsis; title` to clipped cells
- Add a subtle row hover background (e.g. `hover:bg-gray-50`)

---

### `/students/[id]` (detail page - `std_001`)
**URL:** `https://ypit-internals.vercel.app/students/std_001`
**State:** Populated

**Working well:**
- "Back to Students" back button present (`←` arrow)
- Breadcrumb: `Students / Std_001`
- Tabbed detail sections (Personal Info, Payments, Application, Travel, Documents, Activity)
- Pipeline progress stepper is a nice visual element
- "Edit Profile" button visible top-right area

**Broken or off:**
- **Breadcrumb shows `Std_001`** (capitalized slug) instead of "John Doe" - reads like a database ID, not a human name
- **Pipeline stepper overflows container** - at 1061px, the rightmost stages (Travelled, Monitoring) are cut off with no horizontal scroll affordance
- **Detail field values are truncated** - "University of Manche..." and "BSc Computer Scien..." have no tooltip on hover
- **Student avatar on detail page is different from the one in the list** - the list shows a real photo, the detail shows what appears to be a different/placeholder image
- No delete action visible (only "Edit Profile")
- The "Lead" stage badge is a dropdown (with chevron) - it's unclear that this is editable vs just a label

**Recommended fixes:**
- Breadcrumb second segment should show student's full name
- Add `overflow-x: auto` on the pipeline stepper container
- Add `title` attribute or tooltip on truncated fields
- Resolve avatar consistency between list and detail

---

### `/students` - Add Student Drawer
**State:** Opens as right-side drawer, fields visible

**Working well:**
- Clear section headings ("Personal Information", "Contact Details", "Academic Plan")
- Required fields marked with `*`
- Cancel + Submit at the bottom
- Placeholder examples are helpful (`e.g. Jane Doe`, `e.g. Tanzanian`)

**Broken or off:**
- **Validation uses native browser tooltip** ("Please fill out this field.") - not the app's design language; no inline error messages per field
- **Date of Birth uses browser native `<input type="date">`** (shows `dd/mm/yyyy` and a calendar picker icon) - inconsistent with a custom UI; also this is a date INPUT while other forms use plain text
- **"Gender" field is missing** from the scrolled-into-view initial state - it appears only after scrolling up on submit attempt (disorienting)
- **"Source" is a plain `<select>` dropdown** - not a styled component; inconsistent with the rest of the custom UI
- No "Assigned Lead" field in the drawer despite it appearing as a column in the list
- The drawer title says "Add New Student" but the submit button says "Add Student" - minor inconsistency
- No success/confirmation state after submission (no toast, no feedback)

**Field inventory (in order):** Full Name ✓, Date of Birth ✓, Gender ✓, Nationality ✓, Passport Number (optional) ✓, Email Address ✓, Phone ✓, WhatsApp ✓, Source ✓, Target Country ✓, Target University ✓, Target Program ✓, Target Intake ✓, Internal Notes ✓

**Missing vs spec:** No "Assigned Lead" assignment in drawer. No "Student ID" (auto-generated is fine). No document upload at creation.

---

### `/subagents`
**URL:** `https://ypit-internals.vercel.app/subagents`
**State:** Populated (3 subagents)

**Working well:**
- Clear table with Contact (email + phone, with icons), Status badge, metrics
- Avatars are consistent size

**Broken or off:**
- **No "Add Subagent" button** - the page is entirely read-only with no way to create a new subagent
- **"View Details" link with `↗` external-link icon** - the icon implies it opens a new tab or external URL; it actually routes within the app (to `/subagents/[id]` which 404s)
- **"View Details" links do not navigate** - clicking them had no observable effect (the detail route likely 404s)
- **No search, no filter, no sort** on this table - the column headers have no sort arrows at all (unlike /students)
- **"Converted Leads" shows 0 for all** despite Kevin Dube being listed as the assigned lead for multiple students
- Page title is "Subagents Management" (with the noun first) - other pages use "Noun Verb" pattern like "Staff Directory"
- No pagination - just 3 rows with no row count

**Recommended fixes:**
- Add "Add Subagent" CTA button
- Fix "View Details" routing to actual subagent detail pages
- Remove `↗` icon from internal navigation links
- Add column headers with sort arrows for consistency

---

### `/staff`
**URL:** `https://ypit-internals.vercel.app/staff`
**State:** Populated (13 staff members)

**Working well:**
- 4 KPI summary cards above table (Total, Active, Inactive, Administrators) - good overview
- Table has search, sortable columns (visually), role badges are colour-coded (MANAGING DIRECTOR in black, MARKETING MANAGER in pink)
- Three-dot overflow menu per row (visible on hover) - consistent action pattern
- "Add Staff" button top-right

**Broken or off:**
- **Role badge colours are inconsistent** - MANAGING DIRECTOR is dark charcoal-black, MARKETING MANAGER is hot-pink/crimson, IT ADMIN is teal - these seem arbitrary. There's no semantic mapping (is colour based on department? seniority? random seeding?)
- **No pagination shown** - 13 records with no page controls visible (the table may scroll infinitely)
- **Sort icons are visible** but, as with all tables in the app, clicking them does nothing
- The three-dot overflow menu item content is unknown (not tested to open)

---

### `/finance` (Overview)
**URL:** `https://ypit-internals.vercel.app/finance`
**State:** Populated

**Working well:**
- Tab navigation (Overview, Petty Cash, Invoices, Payroll, Expenses, Student Payments) is clearly styled with active state
- Action alert cards ("1 overdue invoice", "2 expenses awaiting approval", "3 draft payslips") are well-designed
- Quick Actions and Recent Activity sections add value

**Broken or off:**
- **At 1280px, all four KPI cards truncate**: "TSh 2..." - the actual amounts are invisible
- **"Student Payments" tab has an `↗` icon** - same misleading external-link affordance as in subagents; it routes to `/payments` (an internal page)
- **Currency uses "TSh"** here while Dashboard uses "TZS"
- The `Finance / Petty-cash` breadcrumb shows the URL slug ("Petty-cash") not the label ("Petty Cash")

---

### `/finance/payroll`
**URL:** `https://ypit-internals.vercel.app/finance/payroll`
**State:** Empty (no payroll generated)

**Working well:**
- Clear "no payroll generated" empty state with icon, text, and a CTA: "Click **Generate** above to seed payslips"
- "Generate May 2026" CTA is prominent

**Broken or off:**
- **"0 staff on payroll"** despite 13 active staff in `/staff` - this is a data/logic issue visible in the UI and actively misleading
- The empty state copy calls the CTA "Generate" in bold inline text - good; but the link/button in the page header just says "Generate May 2026" without explaining what that does
- Hero stats panel on dark crimson: white text on dark red - contrast is fine, but the `NSSF` acronym has no explanation/tooltip

---

### `/finance/invoices`
**URL:** `https://ypit-internals.vercel.app/finance/invoices`
**State:** Populated (7 invoices)

**Working well:**
- 4 summary tiles (Issued, Collected, Outstanding, Overdue) with semantic icon colours
- Clean invoice table with sensible columns

**Broken or off:**
- KPI tiles show truncated values ("TSh 21,695..." with `...`) - the cards are not wide enough at viewport
- No status column in the invoice table - status is implied only by "PAID" column value
- Date column shows two dates ("Issued · Due") stacked - inconsistent with other tables

---

### `/finance/petty-cash`
**URL:** `https://ypit-internals.vercel.app/finance/petty-cash`
**State:** Populated (10 vouchers)

**Working well:**
- Ledger-style running balance in the right column is clear and useful
- Colour coding (–red for expenses, +green for top-ups)

**Broken or off:**
- **Currency mixed within the same sentence**: "Healthy float · safe threshold **TZS** 100,000" while the big number shows "**TSh** 420,000"
- **Breadcrumb: "Finance / Petty-cash"** - hyphenated slug, should be "Finance / Petty Cash"
- "0 vouchers / 0 top-ups" in the hero panel despite 10 entries in the register below - the header stats appear to be for "current month" only, which is not clearly communicated

---

### `/finance/expenses`
**URL:** `https://ypit-internals.vercel.app/finance/expenses`
**State:** Populated (9 expenses)

**Working well:**
- Category chips with coloured icons (Commissions, Travel, Repairs) add visual variety
- Approval workflow context visible in KPI tiles

**Broken or off:**
- **"AMOUNT" column is visually cut off** at the right edge of the viewport - no horizontal scroll indicator
- The "STATUS" column (PART...) is similarly clipped
- EXP-2026-0009 description reads "5 sub-agents · USD 500k each" - USD in a Tanzanian shilling system is a data anomaly visible in the UI

---

### `/payments`
**URL:** `https://ypit-internals.vercel.app/payments`
**State:** Populated

**Working well:**
- Multiple receipts per student (RCP-2026-001, RCP-2026-005) stacked cleanly
- Clear colour coding: green = total paid, red = balance

**Broken or off:**
- **"STATUS" column is clipped** - only "PART..." is visible (should show "PARTIALLY PAID" or similar)
- Currency: `TZS 181.6M` in KPI card - different format from every other page
- "Record Payment" button icon is `$` dollar sign - should use `TSh` or a generic currency icon for a TZS system
- No filter by status, no date range filter

---

### `/applications`
**URL:** `https://ypit-internals.vercel.app/applications`
**State:** Populated

**Working well:**
- Filter chips at top (0 Preparing, 0 Submitted, 1 Under Review, 4 Accepted) - same pattern as Students but still non-interactive
- Clear column set with decision date

**Broken or off:**
- Filter chips are non-interactive (same issue as /students)
- `...` overflow menu per row - content untested
- No "Add Application" button - the only interaction is the overflow menu

---

### `/travel` (All Students / Upcoming Departures / Visa Tracker)
**URL:** `https://ypit-internals.vercel.app/travel`
**State:** All Students: Populated | Upcoming Departures: Empty ("No results found.") | Visa Tracker: Partially populated

**Working well:**
- Tab sub-navigation is clean
- "STATUS" column visible in Visa Tracker (READY/APPLIED) - but the STATUS column clips in "All Students" view

**Broken or off:**
- **Upcoming Departures shows "No results found."** and `Page 1 of 0` - with 2 students in "Awaiting Departure" per the KPI card. This is a data/filter mismatch visible in the UI
- **Tab click interaction unreliable** - clicking "Visa Tracker" from "Upcoming Departures" in a single session did not switch tabs; required navigating directly via URL `?view=visa`
- "STATUS" column (last column) clips in "All Students" view at most viewports
- No "Add Travel Record" or "Book Flight" action visible

---

### `/monitoring`
**URL:** `https://ypit-internals.vercel.app/monitoring`
**State:** Populated with alert banner

**Working well:**
- Alert banner ("Action Required: Escalated Students") with crimson icon is very visible
- WELLBEING badge ("GOOD") in table is contextually appropriate

**Broken or off:**
- Alert copy has a grammar error: "There are **1** students requiring immediate attention." - should be "There **is** 1 student..."
- No action button on the alert - the banner has no "View" or "Resolve" link
- WELLBEING badge uses "GOOD" in green - other positive states use "ACTIVE" - no unified terminology for status

---

### `/tasks`
**URL:** `https://ypit-internals.vercel.app/tasks`
**State on first load:** **Blank** (confirmed bug)

**Working well:**
- Grid/Board/List view toggle is a nice affordance (though Board and List views untested for content)
- Task cards have priority badges (HIGH), tags (MD, Audit), and due date

**Broken or off:**
- **Empty state is a blank white rectangle** - no illustration, no message, no CTA. This is the most jarring empty state in the app
- **Tasks only appear after clicking "Create Task"** - a "seed data on click" bug
- "My Tasks", "Assigned by Me", "Department" tabs are present but it's unclear if they actually filter
- "Write Report" per-task action is unlabelled in terms of where the report goes
- Task status indicator is a small grey circle (top-right of card) - its meaning is unexplained (likely "not started", but there's no legend)

**Recommended fix:** Add a proper empty state: icon + "No tasks yet" + "Create your first task" CTA. Fix seed data to load on page render.

---

### `/reports`
**URL:** `https://ypit-internals.vercel.app/reports`
**State:** Populated with charts and Key Metrics Summary

**Working well:**
- Charts are rendered (Lead Conversion Trends, Revenue vs Target) - not placeholders
- Key Metrics Summary table is clean

**Broken or off:**
- **"Revenue Collected: $1.2M"** - USD dollar sign, inconsistent with every other financial figure in the app
- Charts have minimal axis labelling - Y-axis values only, no currency symbol on Revenue chart
- "Export Report" button in top-right - clicking it is untested but the lack of a format selection (PDF / CSV) is a UX gap
- No date range selector - the report appears to show all-time data with no way to filter by period

---

### `/audit-logs`
**URL:** `https://ypit-internals.vercel.app/audit-logs`
**State:** Populated (5 seeded entries)

**Working well:**
- Action icons (LOGIN in blue, CREATE in green, DELETE in red, PAYMENT_RECORDED in grey) are semantically colour-coded
- Table is clean and readable

**Broken or off:**
- **Seeded with fictional test users**: Alice Johnson, Bob Smith, Charlie Brown, Diana Prince - not production-quality data
- **IP ADDRESS column is clipped** at all viewport sizes - "192.168.1.10..." - no horizontal scroll
- **The sidebar link routes to `/audit` (404)** - users navigating from the sidebar cannot reach this page
- No "TIMESTAMP" column - the log has no time, only an implicit order
- No export/filter controls - a compliance-oriented log needs date range filtering

---

### `/settings` (My Profile / Security / Notifications)
**URL:** `https://ypit-internals.vercel.app/settings`
**State:** Populated

**Working well:**
- Tab navigation is consistent with Finance pattern
- Notification toggles (My Tasks, Lead Changes, Daily Digest) are correctly styled
- Security tab correctly shows only password change (no 2FA or session management, which may be intentional)

**Broken or off:**
- **Profile data mismatch**: The sidebar shows "David Mwangi / MANAGING DIRECTOR" with David's real avatar, but Settings → My Profile shows "Admin User" with `admin@ypit.com` and a completely different female avatar. The user's identity is split between two personas.
- **No required field marking on Change Password** - all three password fields have `*` in their visual label but no asterisk marker. Standard convention would mark them required.
- **Phone placeholder** "+1 (555) 000-0000" is a US format - should be "+255..." for a Tanzanian context
- No form validation visible on the security tab (would need to test submit)

---

## 4. State Coverage Matrix

| Page | Populated | Empty | Loading | Error |
|---|---|---|---|---|
| `/dashboard` | ✓ (KPI cards only) | ✗ (placeholders, not a designed empty state) | ✗ No skeleton | N/A |
| `/students` | ✓ | ✓ "No results found." | ✗ No skeleton | N/A |
| `/students/[id]` (std_001) | ✓ | N/A | ✗ | N/A |
| `/students/YP-2026-001` | N/A | N/A | N/A | ✗ Near-invisible white-on-white 404 |
| `/subagents` | ✓ | N/A (no empty path) | ✗ | N/A |
| `/staff` | ✓ | N/A | ✗ | N/A |
| `/finance` (overview) | ✓ | N/A | ✗ | N/A |
| `/finance/payroll` | ✗ (0 staff) | ✓ "No payroll generated" with CTA | ✗ | N/A |
| `/finance/invoices` | ✓ | N/A | ✗ | N/A |
| `/finance/petty-cash` | ✓ | N/A | ✗ | N/A |
| `/finance/expenses` | ✓ | N/A | ✗ | N/A |
| `/payments` | ✓ | N/A | ✗ | N/A |
| `/applications` | ✓ | N/A | ✗ | N/A |
| `/travel` (All Students) | ✓ | N/A | ✗ | N/A |
| `/travel?view=upcoming` | ✗ Shows "No results found." incorrectly (2 students await departure) | N/A | ✗ | N/A |
| `/travel?view=visa` | ✓ | N/A | ✗ | N/A |
| `/monitoring` | ✓ | N/A | ✗ | N/A |
| `/tasks` | ✗ First load shows blank - bug | ✗ No empty state design | ✗ | N/A |
| `/reports` | ✓ | N/A | ✗ | N/A |
| `/audit-logs` | ✓ (seeded) | N/A | ✗ | N/A |
| `/settings` | ✓ | N/A | ✗ | N/A |
| `/audit` (sidebar link) | N/A | N/A | N/A | ✗ Unstyled black Next.js 404 |
| `/login` | N/A - redirects to /dashboard | N/A | N/A | N/A |

**Notes on ✗ entries:**
- **Loading state (all pages):** No loading skeletons were observed anywhere. On initial page load, content area is blank then snaps in. This is jarring on slower connections.
- `/tasks` populated state: Tasks fail to render on page load even though data exists. Appears to be a client-side state initialisation bug.
- `/travel?view=upcoming` "No results found." is incorrect - 2 students have "Awaiting Departure" status. The filter logic for "upcoming" appears broken.

---

## 5. Responsive Issues

| Page | Breakpoint | Issue |
|---|---|---|
| `/dashboard` | 768px (tablet) | Sidebar collapses to hamburger ✓; search bar disappears entirely from header |
| `/dashboard` | 480px (mobile) | Cards stack 1-col ✓; "TZS 45M" value readable; search bar absent |
| `/dashboard` | 1440px | "Revenue Collected" card title wraps to 2 lines; "TZS 45M" number wraps to 2 lines |
| `/finance` (overview) | 1280px | All 4 KPI values truncated to "TSh 2..." - amounts invisible |
| `/finance` (overview) | 768px | KPI cards collapse but values still truncate |
| `/students` | 480px | Table clips to 2 columns; "NATIONALITY" shows as "NATION"; "TARGET UNIVERSITY", "STAGE" etc. completely hidden |
| `/students` | 480px | "Add Student" button is full-width ✓; filter chips wrap awkwardly to 3 rows |
| `/students/[id]` | 1061px | Pipeline stepper overflows card with no scroll; last 3 stages invisible |
| `/audit-logs` | All | IP ADDRESS column clips at right edge |
| `/payments` | All | STATUS column clips at right edge |
| `/finance/expenses` | All | AMOUNT column clips at right edge |
| Sidebar | 1280px | Sidebar collapses to hamburger (breakpoint appears set at `lg: 1024px`); at 1280px the sidebar is unexpectedly hidden |
| Sidebar | 768px | Hamburger present ✓; clicking hamburger opens no drawer (sidebar remains hidden) |
| Finance tabs | 1280px | "Student Payments" tab may clip or wrap depending on window width |

**Summary:** The most critical responsive failure is the Finance overview at 1280px where the KPI card values are fully truncated. The sidebar collapses earlier than expected (seems to break at ~1280px, which is a common laptop resolution). Mobile table handling is the worst overall - no horizontal scroll and no card-collapse pattern.

---

## 6. Accessibility Issues (Top 10)

| # | Page(s) | Type | Details |
|---|---|---|---|
| 1 | All pages | **Icon-only buttons with no accessible name** | Three buttons globally: hamburger toggle, notification bell, user avatar dropdown - all have no `aria-label` or `title`. Screen reader users hear "button" with no context. |
| 2 | All pages with search/tables | **Search input has no associated `<label>`** | The `Search...` input (`type=text`) has a `placeholder` but no `<label for>`, `aria-label`, or `aria-labelledby`. Fails WCAG 1.3.1. |
| 3 | All tables | **Table headers missing `scope` attribute** | All 7 `<th>` elements on `/students` (and presumably all other tables) have no `scope="col"`. Screen readers cannot determine header-to-cell relationships. |
| 4 | All tables | **Sort icons not interactive, not announced** | Column headers show ↑↓ icons but are not `<button>` elements, have no `role="button"`, and have no `aria-sort` attribute. Screen readers cannot discover sorting capability. |
| 5 | `/dashboard` | **Placeholder text fails WCAG AA contrast** | "Monthly Intake Chart Placeholder" etc. at `oklch(0.707)` on white = **2.15:1 contrast ratio** (minimum 4.5:1 required for 16px normal weight text). |
| 6 | `/students/[id]` | **Pipeline stepper is not keyboard-navigable** | The stage circles are not focusable elements - keyboard users cannot tab through or interact with the pipeline progress indicator. |
| 7 | All | **No skip-to-content link** | No `<a href="#main-content">Skip to main content</a>` link for keyboard/screen reader users to bypass the sidebar navigation. |
| 8 | All form pages | **Form validation via browser native tooltip only** | Native HTML5 `required` attribute triggers browser-default "Please fill out this field." tooltip - this is not surfaced in the app's visual language, not announced consistently across screen readers, and disappears after a few seconds. |
| 9 | `/monitoring` | **Alert banner uses colour + text but no `role="alert"`** | The escalation banner should have `role="alert"` or `aria-live="polite"` to announce to screen readers when it appears dynamically. |
| 10 | All | **Focus ring insufficient** | Tailwind's default focus-visible ring (`ring-2 ring-offset-2`) is used where present, but on many interactive elements (table rows, filter chips, badge dropdowns) no focus ring is applied at all. The student detail "Lead ▾" dropdown shows no focus ring when tabbed to. |

---

## 7. Microcopy and Content Issues

| # | Location | Issue |
|---|---|---|
| 1 | `/monitoring` alert | Grammar error: "There are **1** students" → should be "There **is** 1 student" |
| 2 | `/reports` Key Metrics | **Currency: "$1.2M"** - USD dollar sign for Tanzanian shilling; should be `TSh 1.2M` or `TZS 1,200,000` |
| 3 | All finance pages | **Three different currency prefixes in use**: `TZS`, `TSh`, `$` - pick one and apply consistently. Recommend `TSh` (ISO 4217 code for Tanzanian shilling is TZS; "TSh" is the local abbreviation) |
| 4 | `/finance/petty-cash` sub-label | "safe threshold **TZS** 100,000" mixed with "**TSh** 420,000" in the same card |
| 5 | `/finance/payroll` hero | **"0 staff on payroll"** alongside `TSh 0 Net Payroll` - the payroll page silently omits all 13 staff. No explanation to the user why staff are missing. |
| 6 | `/tasks` | **Empty state has zero copy** - blank white rectangle with no message, no illustration, no guidance. |
| 7 | Sidebar | **"Audit Logs" label links to `/audit`** not `/audit-logs` - a broken internal link |
| 8 | `/settings` | Profile shows **"Admin User"** while sidebar shows **"David Mwangi"** - two different user identities shown simultaneously |
| 9 | `/settings` | Phone placeholder is **"+1 (555) 000-0000"** (US format) in a Tanzanian ops system - should be "+255 7XX XXX XXX" |
| 10 | Finance tabs | **"Student Payments"** tab has an `↗` external link icon but routes internally - misleading affordance. The tab copy could also be "Payments" to match the sidebar item. |
| 11 | Add Student drawer | Title says **"Add New Student"** but submit button says **"Add Student"** - pick one |
| 12 | `/students` breadcrumb | `Students / Std_001` - slug as breadcrumb. Should be `Students / John Doe` |
| 13 | `/finance/petty-cash` breadcrumb | **"Finance / Petty-cash"** - should be "Finance / Petty Cash" |
| 14 | `/audit-logs` data | Seeded with fictional/Western test users (Alice Johnson, Bob Smith, Charlie Brown, Diana Prince) - should use realistic names matching the staff directory |