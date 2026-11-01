# Merishaw Cube Maintenance System

A full-stack, enterprise-grade student accommodation and dormitory cube maintenance management portal built for **Merishaw School**.

![Merishaw School Brand](https://img.shields.io/badge/Merishaw-Primary%20Maroon%20%23681C32-681C32)
![Node Version](https://img.shields.io/badge/Node.js-v20%2B-green)
![React](https://img.shields.io/badge/React-v19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-Strict-blue)
![License](https://img.shields.io/badge/License-Apache--2.0-lightgrey)

---

## 🏛️ System Overview

The **Merishaw Cube Maintenance System** provides a unified institutional platform for managing student accommodation repair workflows:

1. **Student Residents**: Report maintenance problems in their assigned dormitory rooms and cubes with an embedded, one-click key-in form or common area selector. Track real-time repair progress and notifications.
2. **Administrators & Facility Managers**: Review, triage, prioritize, assign, and monitor maintenance tickets across all campus buildings, blocks, rooms, and individual cube bunks.
3. **Maintenance Staff & Trades**: Access assigned work orders, update repair progress (Assigned → In Progress → Awaiting Parts → Resolved), log labor hours, and record materials used.
4. **Auditability & Institutional Compliance**: Full cryptographic audit logging, status history trails, and safety hazard escalation protocols.

---

## ✨ Key Features

### 🎓 Student Experience
- **Embedded Cube Problem Key-In Card**: File maintenance requests directly from the student dashboard without opening extra modals.
- **Assigned Cube Auto-Detection**: Pre-fills the student's assigned residence hall, block/floor, room, and cube bunk identifier.
- **Common Facility Mode**: Instant dropdown cascade for reporting issues in shared washrooms, study lounges, dining halls, and corridors.
- **Quick Fixture Chips**: One-click selection for standard cube fixtures (Bunk Bed Frame, Mattress, Study Lamp, Locker Latch, Power Socket).
- **Safety Hazard Alerts**: Flags active electrical, water, or safety hazards for immediate escalation.
- **Real-Time Tracking**: Visual status badges (*Pending Review*, *Assigned*, *In Progress*, *Awaiting Parts*, *Resolved*, *Closed*).

### 🛠️ Administrative & Staff Tools
- **Centralized Helpdesk Dashboard**: Real-time KPI counters (Pending Triage, Active Repairs, Critical Emergencies, Completed).
- **Staff Assignment & Dispatch**: Assign technicians based on trade discipline (Carpentry, Electrical, Plumbing, Glazing).
- **Location Hierarchy Management**: Manage campus buildings, residential blocks, floor levels, rooms, and cube bed capacities.
- **User Account Management**: Create, deactivate, and assign students and staff with institutional ID codes.
- **Immutable Audit Logs**: Records all ticket submissions, status changes, and administrative actions with timestamps and user identifiers.

---

## 🏗️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 19, TypeScript, Tailwind CSS, Lucide Icons, Motion |
| **Backend** | Node.js, Express, RESTful API |
| **Database** | SQLite (WAL mode, Foreign Keys enabled) with auto-migrations |
| **Security** | Scrypt password hashing with unique salts, HMAC-SHA256 session token signatures, role-based access control (RBAC) |
| **Testing** | Node.js native test runner (`tsx --test`) |
| **Build Tooling** | Vite 8, TypeScript Compiler (`tsc`) |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js**: Version 20.x or higher
- **npm**: Version 9.x or higher

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/<YOUR_USERNAME>/<YOUR_REPO>.git
   cd <YOUR_REPO>
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the full-stack development server:
   ```bash
   npm run dev
   ```
   Open your browser at `http://localhost:3000`.

---

## 🧪 Available Scripts

| Command | Description |
| :--- | :--- |
| `npm run dev` | Starts the full-stack development server with Vite middleware on port 3000 |
| `npm run build` | Builds the frontend client bundle into `dist/` |
| `npm start` | Starts the production full-stack Node.js server (`node server.ts`) |
| `npm test` | Runs the automated security, database, and workflow test suite |
| `npm run lint` | Runs the TypeScript compiler verification (`tsc --noEmit`) |

---

## 🔑 Demo Institutional Accounts

The database seeds automatically on first launch with predefined accounts for institutional testing:

| Role | Email | Password | Access Level |
| :--- | :--- | :--- | :--- |
| **System Administrator** | `admin@merishaw.edu` | `Admin123!` | Full administrative & facility control |
| **Maintenance Staff** | `carpenter@merishaw.edu` | `Staff123!` | Carpentry work orders & ticket updates |
| **Maintenance Staff** | `electrician@merishaw.edu` | `Staff123!` | Electrical work orders & repairs |
| **Student Resident** | `student.john@merishaw.edu` | `Student123!` | Mt. Meru Hall, Room 204, Cube 204-A |
| **Student Resident** | `student.mary@merishaw.edu` | `Student123!` | Mt. Meru Hall, Room 204, Cube 204-B |

*(Quick 1-click login buttons for each role are also available on the login page for rapid evaluation).*

---

## 🎨 School Brand Guidelines

The application strictly adheres to the official Merishaw visual identity:

- **Primary Maroon**: `#681C32` (Header navigation, primary buttons, brand accents)
- **Muted Gold**: `#B99A55` (Icons, subtle dividers, priority highlights)
- **Charcoal Text**: `#263238` (High-contrast typography)
- **Light Grey Background**: `#F4F5F7` (Clean dashboard layout)
- **Card Background**: `#FFFFFF` (Structured white containers with subtle borders)

---

## 📄 License

This project is licensed under the Apache 2.0 License.
