# Implementation Plan: Embedded Cube Problem Key-In Section for Students

## Overview
Currently, students submit maintenance requests via a popup modal initiated by clicking "+ Report Maintenance Fault" or sidebar buttons. To make keying in problems regarding their cube as immediate, intuitive, and accessible as possible, we will add an **embedded "Key In Cube Problem" card directly on the Student Dashboard**. Per your preferences, students will be able to easily toggle between reporting an issue for their **assigned cube** (with their hall, room, and cube bunk pre-selected) or a **common facility / area** (washroom, corridor, study room, laundry).

---

## Proposed Changes

### 1. New Component: `QuickCubeReportCard.tsx`
Create a dedicated component at `src/components/student/QuickCubeReportCard.tsx`:
- **Location Mode Selector**:
  - **"My Assigned Cube" (Default)**: Automatically binds to student's assigned hall (e.g., Mount Meru Hall), room (e.g., Room 204), and cube bunk (e.g., Cube 204-A Window Left) with clear visual confirmation badge.
  - **"Common Facility / Floor Area"**: Enables clean dropdown selection of institutional building, block/floor, room or shared facility (e.g. Common Bathroom, Floor Kitchenette, Study Room).
- **Streamlined Fault Inputs**:
  - Fault Category selector (Beds & Mattresses, Electrical & Plugs, Plumbing & Water, Doors & Locks, Windows & Glazing, Lighting & Bulbs, Desks & Storage).
  - Quick affected item chips/dropdown based on category (e.g., "Bunk Bed Frame", "Mattress", "Locker Lock", "Wall Socket", "Study Lamp").
  - Problem Summary (e.g., "Broken locker latch", "Flickering overhead cube light").
  - Detailed description with placeholder guidance.
  - Urgency level pill selector (Low, Medium, High, Emergency).
  - Safety hazard checkbox indicator.
- **Feedback & UX**:
  - In-card loading spinner during API submission (`api.createTicket`).
  - Success banner with generated institutional ticket reference number (e.g., `TCK-2026-XXXX`).
  - Option to immediately view ticket details or file another report.
  - Clear validation warnings before submit.

### 2. Integration into `StudentDashboard.tsx`
Update `src/components/student/StudentDashboard.tsx`:
- Embed the `QuickCubeReportCard` directly beneath the "Assigned Dormitory & Cube Details" card and above the KPI metrics.
- Pass a callback `onTicketCreated` that automatically refreshes the student's recent tickets table and updates KPI metric badges.
- Retain the top navigation button `+ Report Maintenance Fault` to preserve existing navigation flows.

### 3. Styling & Merishaw Branding Alignment
- Styled in accordance with Merishaw school brand guidelines:
  - Header badge and primary submit button: Primary Maroon (`#681C32`).
  - Subtle accents and cube focus borders: Muted Gold (`#B99A55`).
  - Card background: Clean White (`#FFFFFF`) with subtle border (`border-slate-200`) and shadow.
  - Text typography: Charcoal (`#263238`) and muted slate (`#546E7A`).

---

## Verification Plan

### Automated Validation
1. **Compilation Check**:
   - Run `compile_applet` to verify TypeScript types, Vite bundling, and component imports.
2. **Linting Check**:
   - Run `lint_applet` to confirm 0 ESLint warnings or syntax issues.
3. **Integration & Security Tests**:
   - Run `npm test` to ensure authorization, session tokens, and database migrations remain 100% passing.

### Manual & UI Testing
1. **Student Dashboard Flow**:
   - Sign in as student resident (`student.john@merishaw.edu`).
   - Confirm the new "Key In Cube Problem" card is immediately visible on the main screen without clicking any modals.
   - Verify that "My Assigned Cube" is selected by default with John's room and cube details displayed.
   - Switch toggle to "Common Facility" and verify building/room cascades work properly.
   - Submit a test ticket for the assigned cube (e.g., "Cube Bunk Study Lamp Not Turning On").
   - Confirm success feedback message, verify the ticket appears at the top of the Recent Maintenance Requests table, and verify KPI counters increment.
