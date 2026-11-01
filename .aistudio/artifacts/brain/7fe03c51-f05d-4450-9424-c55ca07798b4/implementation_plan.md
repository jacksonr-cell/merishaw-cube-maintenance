# Implementation Plan: Production Hardening & Live Data Cleansing

## Overview
To ensure the Merishaw Cube Maintenance System operates strictly as a production-grade institutional system without any appearance or behavior of a demo:
1. Remove all quick-login helper buttons and demo cards from the authentication screens, enforcing strict institutional login credentials.
2. Retain the authentic Merishaw campus accommodation hierarchy (halls, blocks, rooms, and individual cube bunks) and fault categories while purging test tickets, work logs, and status history to a clean zero state.
3. Verify that every statistic, counter, SLA percentage, and metric displayed across student, staff, and admin dashboards is dynamically computed from live database records.

---

## Proposed Changes

### 1. Authentication Hardening (`src/components/auth/LoginPage.tsx`)
- Completely remove the demo quick sign-in button panel and helper credentials grid.
- Enforce strict institutional sign-in with:
  - Institutional Email or Official Identifier Code (Student ID / Staff ID / Admin ID).
  - Encrypted password field with secure toggle.
  - Institutional security notice (*"Authorized Merishaw School Personnel and Enrolled Residents Only"*).
  - Clear institutional IT / Accommodation Office support contact information.

### 2. Live Database Cleansing & Zero Baseline (`src/server/db.ts`)
- Retain all institutional structural schemas:
  - **4 Residence Halls**: Mount Meru Hall, Mount Kilimanjaro Residence, Aberdare Hall, Mount Elgon House.
  - **Floors, Blocks & Rooms**: Ground, First, Second, and Third floor wings.
  - **Cube Units**: Cube A, Cube B, Cube C, Cube D per room with specific identifiers (Window Left, Window Right, Door Left, Door Right).
  - **Fault Categories & SLAs**: 10 formal trades with institutional SLA response benchmarks (Beds & Mattresses, Electrical, Plumbing, Windows, Locks, Lighting, Desks, Sanitation, General).
  - **Initial Administrative & Staff Accounts**: Pre-provisioned initial admin (`admin@merishaw.edu`) and designated maintenance heads for Carpentry, Electrical, and Plumbing so the facility team can manage the platform immediately upon launch.
- **Purge Test Ticket Data to Zero**:
  - Remove all pre-seeded sample tickets (`tickets` table starts at 0).
  - Clear test status history, work logs, and ticket comments.
  - Reset notification logs and audit logs to a clean initial state.
  - Ensure all dashboard metrics (Total Tickets, Pending Triage, Active Repairs, Resolved) reflect 0 until real student residents submit real reports.

### 3. Documentation & Production Polish (`README.md`)
- Update `README.md` to remove any "demo" framing.
- Provide instructions for initial system administrator login, password updates, and deploying the platform to institutional servers.

---

## Verification Plan

### Automated Testing
1. **Compilation Check**: Run `compile_applet` to confirm 0 TypeScript or build issues.
2. **Linting Check**: Run `lint_applet` to confirm 0 ESLint errors.
3. **Automated Test Suite**: Run `npm test` to ensure all 5 integration and security tests pass.
4. **Production Build**: Run `npm run build` to ensure production bundle compiles cleanly.

### Manual Verification
1. Open login page and confirm that only the official institutional login form is present with no demo shortcuts.
2. Sign in as Administrator and verify:
   - Total Tickets: 0
   - Pending Review: 0
   - Active Repairs: 0
   - Resolved: 0
   - Tickets table: Empty state (*"No maintenance tickets recorded yet"*).
3. Sign in as Student and verify:
   - Assigned cube is correctly loaded.
   - Total Reports: 0.
   - Recent Maintenance Requests: 0.
   - Key in a real ticket via the new embedded card and confirm counter updates from 0 to 1 with real database persistence.
