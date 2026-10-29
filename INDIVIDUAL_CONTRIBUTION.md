# ResourceX — Individual Project Contribution Report

* **Student Name**: B Ravi Chandra
* **Git Username**: `ravichandra14`
* **Email**: `ravichandra.b24@iiits.in`
* **Program**: B.Tech CSE — Full Stack Development (FSD 2024–2028)
* **Institution**: IIIT Sri City
* **Branch Submitted**: `main`

---

## 1. Executive Summary & Architectural Role

As part of the **ResourceX (Asset & Resource Allocation Management System)** group project, my primary contributions were:

1. **Complete System Admin Dashboard & Management Portal (Primary Contribution)**:
   - Built the entire System Admin operations suite from scratch, comprising **7 functional views**, **8 interactive components/modals**, and the complete administrative API integration service.
   - Implemented full CRUD management for institution users and departments, resource catalog oversight, support ticket tracking, announcement broadcasts, and subscription plan monitoring.
2. **Centralized API Client Layer (`api.js`)**:
   - Engineered the single universal HTTP client wrapper around native `fetch` used across the frontend.
   - Handled JWT Bearer token injection, automatic request body serialization (`JSON.stringify` for objects vs raw `FormData` for multipart file uploads), query parameter generation (`buildQuery`), and centralized error normalization.
3. **Global Authentication State Management (`AuthContext.jsx`)**:
   - Implemented the React Context API provider with custom `useAuth()` hook.
   - Added reactive session management and cross-tab session synchronization using window `storage` event listeners with lifecycle cleanup functions.
4. **Core Application Routing & Higher-Order Route Guards (`App.jsx`)**:
   - Designed client-side routing using React Router v7.
   - Built route guards (`ProtectedRoute` and `PublicOnlyRoute`) to restrict unauthorized access and dynamically navigate users based on system roles (`getRoleDashboardPath`).
5. **Universal Layout & Navigation (`Sidebar.jsx` & `AppHeader.jsx`)**:
   - Refactored navigation components to dynamically render role-specific menus, badges, and user info directly from `useAuth()`.

---

## 2. Detailed File Inventory (Developed & Implemented)

### A. System Admin Portal (`react-frontend/src/components/dashboards/admin/`)

| File Path | Type | Key Features & React Concepts |
| :--- | :--- | :--- |
| `views/AdminOverview.jsx` | **View** | System Admin landing overview with KPI cards, quick-action shortcuts, and department distribution summary. |
| `views/AdminUsers.jsx` | **View** | Complete User Management: table rendering, multi-field search, role/department filters, user status toggling, and suspension/reactivation. |
| `views/AdminDepartments.jsx` | **View** | Department Management: listing departments, member count, assigning department heads, and department creation. |
| `views/AdminResources.jsx` | **View** | Institutional asset & inventory oversight: monitors resource health, available vs allocated items, and scrap counts. |
| `views/AdminSubscription.jsx` | **View** | Institutional SaaS plan details: displays tier limits, license usage, billing status, and plan renewal dates. |
| `views/AdminSupport.jsx` | **View** | Support Ticket Desk: view open/resolved issues with platform support, filter tickets, and create new tickets. |
| `views/AdminAnnouncements.jsx` | **View** | Organization communications: view broadcast announcements from platform employees and post replies. |
| `components/AddUserModal.jsx` | **Modal Form** | Controlled modal form with two-way data binding for creating user accounts with department and role selection. |
| `components/EditUserModal.jsx` | **Modal Form** | Controlled modal form to update existing user names, roles, departments, and active statuses. |
| `components/AddDeptModal.jsx` | **Modal Form** | Controlled form to create a new institutional department. |
| `components/NewTicketModal.jsx` | **Modal Form** | Controlled form to submit support tickets with priority levels and descriptions. |
| `components/ReplyAnnModal.jsx` | **Modal Form** | Controlled modal for replying to platform announcements. |
| `components/AdminModal.jsx` | **Component** | Reusable generic confirmation modal with backdrop dismissal and event propagation control. |
| `components/AdminToast.jsx` | **Component** | Feedback notification toast system for real-time success and error alerts. |
| `components/AdminStatsCards.jsx` | **Component** | Modular statistics and metrics display cards. |
| `AdminLayout.jsx` & `AdminDashboard.jsx` | **Layout/Routes** | Role layout wrapper connecting sidebar navigation to admin subviews via routing. |

---

### B. Core Architecture, Services & Authentication

| File Path | Type | Key Features & React Concepts |
| :--- | :--- | :--- |
| `services/admin.js` | **Service** | Dedicated API service layer executing HTTP operations for users, departments, support, and announcements. |
| `services/api.js` | **Core Client** | Universal HTTP gateway with automatic JWT authentication, smart JSON / FormData body serialization, and error normalization. |
| `context/AuthContext.jsx` | **Context** | Global authentication provider with `createContext`, `useContext`, `useAuth()`, and cross-tab storage listener. |
| `App.jsx` | **Root Router** | React Router v7 routes, `ProtectedRoute`, `PublicOnlyRoute`, and role dashboard resolution. |
| `components/Sidebar.jsx` | **Navigation** | Universal dynamic sidebar rendering role-based navigation menus. |
| `components/AppHeader.jsx` | **Navigation** | Unified header showing live user profile, organization badge, and logout trigger. |
| `components/landing/Navbar.jsx` | **Component** | Landing page header dynamically adapting actions based on authentication state. |

---

## 3. Git Commit History (All Contributions)

Below is the complete record of commits authored by **B Ravi Chandra** (`ravichandra14`), detailing contributions  the project:

| Commit Hash | Date | Description |
| :--- | :--- | :--- |
| `10a594b` | 2026-10-13 | Merge pull request #11 from IIIT-Sricity-FSD-2024-2028/ReactChanges-in-owner-and-employee |
| `c6cb3ee` | 2026-10-13 | Merge pull request #10 from IIIT-Sricity-FSD-2024-2028/feature/requestor-dashboard |
| `3ffd4c4` | 2026-10-12 | `fix(allocations)`: eliminate card downward height shift when selecting resources |
| `f716184` | 2026-10-12 | `fix(inventory)`: prevent action buttons horizontal overflow and scope dropdown overflow |
| `eb7dcd0` | 2026-10-12 | `fix(allocation)`: remove alias mapping and standardize catalog mock data |
| `27a6eb6` | 2026-10-11 | `fix(sidebar)`: properly align brand logo and scope landing styles |
| `222eb8e` | 2026-10-09 | `feat`: introduce centralized `api.js` service client and refactor existing services |
| `823466c` | 2026-10-09 | `feat`: modularize dashboard wildcard routes and enforce active status on login |
| `9828dc3` | 2026-10-09 | `refactor`: make `Sidebar` and `AppHeader` universal across all dashboards with `AuthContext` |
| `0595480` | 2026-10-08 | `refactor`: remove redundant props from `AppHeader` and use `AuthContext` directly |
| `51eb0ef` | 2026-10-08 | `feat`: integrate `AuthContext` and fix landing page `Navbar` for authenticated users |
| `1e54399` | 2026-10-08 | `feat`: add complete React frontend application with landing page configuration, dashboards configuration, profile and System Admin complete dashboard |

---

