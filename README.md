# Problem Statement : Asset & Resource Allocation Management System

Organizations often allocate & manage assets such as laptops, projectors, routers, and other equipment using manual methods. This can lead to poor tracking, delayed approvals, and inefficient resource utilization.

This project provides a **centralized web-based system** to allocate & manage the complete lifecycle of organizational resources with **role-based dashboards**.

---
# System Overview

The system manages the full lifecycle of resources:

- Resource Request
- Approval Process
- Resource Allocation
- Maintenance Management
- Resource Return
- Scrap Management
- Procurement Management

The platform is designed as a **multi-tenant SaaS system**, allowing multiple institutions to independently manage their own resources while being centrally onboarded, supported, and billed by the platform.

---

# User Roles

The system supports seven roles:

1. **Requester** – Requests resources and manages allocated assets
2. **Department Head** – Approves requests and monitors department resources
3. **Registrar** – Approves procurement requests
4. **Staff** – Handles allocation, procurement, maintenance, and returns
5. **System Admin** – Manages users, departments, and permissions (within a single institution)
6. **Platform Employee** – Supports and manages institutions onboarded to the platform
7. **Platform Owner** – Owns and runs the platform; manages employees, institutions, and revenue

Roles 1–5 operate **within** a single institution. Roles 6–7 operate **across** institutions, at the platform level.

---

# Dashboards

## Requester Dashboard

### Request Resource
Users can request resources by selecting:

- Department
- Resource Type
- Quantity
- Reason

If the resource is not available, users can **request a new resource**.
Each request generates a **Request ID** and is sent to the Department Head.

### My Requests
Users can track all requests with statuses:

- Pending
- Approved
- Rejected
- Allocated

When allocated, the user confirms receipt and the resource appears in **My Resources**.

### My Resources
Shows all currently allocated resources.

Users can:
- **Return Resource**
- **Request Maintenance**

Possible resource statuses:
- Allocated
- Maintenance Requested
- Under Maintenance
- Repaired
- Scrap

---

# Department Head Dashboard

### Incoming Requests
Review resource requests from department users.

Actions:
- **Accept** → Forward to Staff for allocation
- **Reject** → Notify Requestor

### Department Resources
View all department resources with:

- Search
- Quantity tracking
- Allocation details
- Maintenance history

### Resource Analytics
Displays department statistics:

- Total Resources
- Available Resources
- Allocated Resources
- Resources Under Maintenance
- Scrap Resources
- Monthly Request Trends
- Most Requested Resources

### Stock Monitoring
Monitors resource stock levels using threshold values.

Stock categories:

- **Safe Stock** – Quantity above threshold
- **Near Threshold** – Quantity close to threshold
- **Low Stock** – Quantity below threshold

Actions:
- **Edit Threshold** – Change minimum stock level
- **Send Procurement Request** – Request additional resources

### Procurement Requests
Department Heads can request new resources by specifying:

- Resource Type
- Quantity

Status tracking:
- Pending
- Accepted
- Rejected

---

# Registrar Dashboard

The Registrar manages procurement approvals.

### Procurement Requests
Actions:
- **Accept** → Creates procurement task for staff
- **Reject** → Notify Department Head

### Requests Overview
View procurement requests with filters:

- Pending
- Accepted
- Rejected
- Department

### System Analytics
Displays system-wide statistics such as:

- Requests per department
- Monthly request trends
- High-demand departments
- Total resources

---

# Staff Operational Dashboards

Operational responsibilities are partitioned into dedicated, specialized role portals:

## 1. Inventory Officer Dashboard
The Inventory Officer manages resource stock levels, allocation fulfillment, return deadlines, and asset return inspections.

### Inventory Board & Asset Deadlines
- Search and filter inventory items across departments.
- **Return Deadline Tracking**: Displays active return deadlines for all allocated assets.
- **Overdue Asset Alerts**: Real-time warning badges and visual highlights for assets kept past their return deadline.
- **Force Return Action**: Allows the Inventory Officer to trigger force returns for overdue equipment.

### Allocation Queue
- Assign available resources to approved requests.
- Supports single and batch resource allocation with immediate inventory sync.

### Return Inspection & Return History
- Inspect returned assets submitted by requestors.
- Route inspected items to **Available Stock**, **Maintenance Bench**, or **Scrap**.
- Complete historical audit log of all return inspections and restocking actions.

---

## 2. Maintenance Officer Dashboard
The Maintenance Officer oversees technical diagnostics, servicing, repairs, and scrap decommissioning.

### Maintenance Overview
- Real-time KPI summary: Maintenance Requested, Under Maintenance, Routed from Returns, and Total Repaired History.
- Quick-action shortcuts and status distribution.

### Maintenance Queue
- **Triage & Diagnosis**: Review equipment issues reported by users or routed from returns.
- **Accept**: Assign priority (Low, Medium, High, Critical) and technician notes.
- **Repair**: Mark resources as repaired, record resolution notes, condition rating, and servicing costs. Repaired items automatically return to operational status.
- **Scrap**: Decommission assets that are beyond economical repair.

### Maintenance Activity History
- Dedicated audit log of all technical servicing, diagnostics, and repairs.
- **Outcome Filters**: Quick-filter by **All Records**, **Repaired**, and **Scrapped**.
- **Keyword Search**: Instant search by Asset ID, equipment type, reported issue, or technician resolution notes.
- *Return History is cleanly separated and managed under the Inventory Officer portal to preserve domain clarity.*

---

## 3. Procurement Officer Dashboard
The Procurement Officer manages vendor acquisitions and purchase orders.

### Department-Scoped Indents
- View and process approved indents strictly scoped to the officer's department.
- Detailed item specifications, requested quantities, and estimated budgets.

### Procurement Orders & Invoicing
- Execute orders with vendor names, purchase dates, invoice numbers, unit prices, and warranty terms.
- Register received assets directly into inventory upon order delivery.

---

# System Admin Dashboard

The System Admin manages configuration **within their own institution**.

### User Management
- Add users
- Edit users
- Assign roles
- Assign departments

### Department Management
- Add departments
- Edit departments
- Delete departments
- Assign department heads

### Role & Permission Control
Define which features each role can access.

---

# Platform Employee Dashboard

The Platform Employee works for the platform itself (not tied to any single institution) and is responsible for supporting and maintaining the institutions onboarded to the platform. They act as the point of contact between the Platform Owner and individual institutions.

### Support Management
- Receives support tickets raised by institutions
- Reviews and resolves technical or operational issues reported by institutions
- Updates ticket status (Open, In Progress, Resolved)
- Notifies the institution once the issue is resolved

### Institution Management
- Manages existing institution accounts assigned to them
- Updates institution information when required
- Activates, suspends, or reactivates institution accounts according to platform policies

### Communication Management
- Creates and sends announcements or notifications to institutions
- Delivers important updates such as scheduled maintenance, new features, subscription reminders, or policy changes
- Can communicate with a single institution or broadcast to multiple institutions at once

---

# Platform Owner Dashboard

The Platform Owner is the **website owner**, sitting above all other roles, responsible for running the platform end-to-end — including employees, institutions, and revenue.

### Employee Management
- Creates and manages Platform Employee accounts
- Assigns institutions to employees
- Updates employee roles and permissions
- Activates, suspends, or removes employee accounts

### Subscription & Revenue Management
- Creates and manages subscription plans (e.g., Basic, Pro, Enterprise)
- Assigns subscription plans to institutions
- Tracks payments, invoices, and revenue generated from subscriptions
- Monitors subscription renewals and expirations

### Institution Management
- Registers new institutions on the platform
- Updates institution details when required
- Activates, suspends, or removes institution accounts
- Assigns institutions to Platform Employees

### Platform Analytics
Displays platform-wide statistics such as:

- Total registered institutions
- Active users
- Active subscriptions
- Revenue generated
- Platform usage trends

Helps the owner monitor the overall performance and growth of the platform.

---

# Role Hierarchy (Platform-Level vs Institution-Level)

```
Platform Owner
      │
      ▼
Platform Employee
      │
      ▼
 ┌─────────────────────────────────────────────┐
 │              Institution (Tenant)            │
 │                                               │
 │   System Admin                                │
 │      ├── Department Head                      │
 │      ├── Registrar                             │
 │      ├── Staff                                 │
 │      └── Requester                             │
 └─────────────────────────────────────────────┘
```

Each institution's data is isolated from other institutions (multi-tenancy). The Platform Owner and Platform Employee have controlled, cross-institution access for billing, support, and analytics purposes only — they do not participate in an institution's day-to-day resource workflows.

---

# Project Setup & Execution Instructions

### Prerequisites & Dependencies
- **Node.js**: v18.0.0 or higher (v20+ recommended)
- **Package Manager**: `npm` (v9+)
- **Operating System**: macOS, Linux, or Windows (WSL / PowerShell)

### Technology Stack
- **Frontend**: React 19, Vite 8, React Router v7, Vanilla CSS design tokens & Google Material Symbols
- **Backend**: NestJS 11, TypeScript 5+, Passport JWT Authentication, Swagger OpenAPI 3.0, Multer

---

### Step-by-Step Execution Guide

#### 1. Clone & Navigate to Repository
```bash
git clone https://github.com/IIIT-Sricity-FSD-2024-2028/32_resourceX.git
cd 32_resourceX
```

#### 2. Start the Backend API Server
```bash
cd backend
npm install
npm start
```
- The backend will start on **`http://localhost:3000`**.
- Interactive Swagger API Documentation is accessible at **`http://localhost:3000/docs`**.

#### 3. Start the React Frontend Application
In a separate terminal window:
```bash
cd react-frontend
npm install
npm run dev
```
- The frontend will launch at **`http://localhost:5173`**.
- Open your browser and navigate to `http://localhost:5173`.

---

# Demo Test Accounts & Credentials

All institution-level accounts are pre-seeded under tenant `ORG-001` (Acme Corp):

Email format: platform accounts are `owner@resourcex.com` and `employee{number}@resourcex.com`. Organization-level accounts use `{name}{roleCode}{organizationName}@gmail.com`, with role codes `re` Requestor, `rg` Registrar, `sa` System Admin, `dh` Department Head, `mo` Maintenance Officer, `io` Inventory Officer and `po` Procurement Officer. The backend enforces this when users and organizations are created. Sign in with email and password only; the dashboard is chosen from the account's role.

| Role | Name | Email | Password | Primary Scope / Capabilities |
| :--- | :--- | :--- | :--- | :--- |
| **Requestor** | RAVI CHANDRA | `ravichandrareacmecorp@gmail.com` | `12345678` | Resource requests, allocated assets, returns, maintenance tickets, and return/maintenance history logs |
| **Department Head** | pradhyum | `pradhyumdhacmecorp@gmail.com` | `12345678` | Request approvals/rejections, department inventory monitoring, stock thresholds, procurement requests |
| **Registrar** | HARSHA TEJ | `harshatejrgacmecorp@gmail.com` | `12345678` | Institutional procurement approvals, vendor invoice previews, global asset analytics |
| **Inventory Officer** | yaswanth kumar | `yaswanthkumarioacmecorp@gmail.com` | `12345678` | Resource inspection queue, return grading, destination dispatching (Available / Maintenance / Scrap), return history logs |
| **Maintenance Officer** | Kumar Maint | `kumarmaintmoacmecorp@gmail.com` | `12345678` | Equipment diagnostics, maintenance tickets, repair status updates, scrap marking |
| **Procurement Officer** | Kumar Proc | `kumarprocpoacmecorp@gmail.com` | `12345678` | Purchasing tasks, invoice & warranty entry, asset onboarding |
| **System Admin** | yashwath | `yashwathsaacmecorp@gmail.com` | `12345678` | Institution user management, department configuration, role permissions |
| **Platform Owner** | Platform Owner | `owner@resourcex.com` | `password` | Multi-tenant SaaS administration, subscription tiers, platform employee management, revenue analytics |
| **Platform Employee** | Support Employee 1 | `employee1@resourcex.com` | `password` | Cross-tenant support tickets, tenant onboarding, broadcast announcements |

---

# Testing & Verification Instructions

### 1. Backend Compilation & Type Safety Verification
Verify that the NestJS backend compiles with zero TypeScript errors:
```bash
cd backend
npx tsc --noEmit
```

### 2. Frontend Production Build & Bundle Verification
Verify that the React frontend builds successfully for production with zero bundle or syntax issues:
```bash
cd react-frontend
npm run build
```

### 3. API & Workflow Verification Scenarios
You can verify the complete end-to-end operational workflows:

1. **Request & Allocation Workflow**:
   - Log in as **Requestor** (`ravichandrareacmecorp@gmail.com`) -> Submit a resource request.
   - Log in as **Dept Head** (`pradhyumdhacmecorp@gmail.com`) -> Approve request.
   - Log in as **Inventory Officer** (`yaswanthkumarioacmecorp@gmail.com`) -> Allocate available resource.
   - Requestor receives asset and marks it as received in "My Resources".

2. **Resource Return & Inspection Workflow**:
   - In **Requestor** dashboard ("My Resources"), select an allocated asset and submit **Return Resource** with notes.
   - Log in as **Inventory Officer** (`yaswanthkumarioacmecorp@gmail.com`) -> Open **Process Returns** view.
   - Inspect asset condition (e.g. *Good*, *Fair*, *Damaged*) and route to destination (*Available*, *Maintenance Requested*, or *Scrapped*).
   - In **Return History Logs**, verify the immutable audit entry.
   - Return to **Requestor** dashboard -> Open **History & Activity** -> Check **Return History** tab.
   - Confirm status badge displays clean **`✅ Return Accepted & Closed`** and **`Processed by Inventory`** without exposing internal warehouse routing details.

3. **Maintenance Repair Workflow**:
   - When an item is dispatched to maintenance from returns or logged by a user, log in as **Maintenance Officer** (`kumarmaintmoacmecorp@gmail.com`).
   - View ticket under maintenance queue, process diagnostics, and mark as **Repaired**.
   - Requestor checks **Maintenance History** tab to view completed ticket, technician notes, and resolved status.

---

# Team & Individual Contributions

### B Ravi Chandra (Roll: `S20240010264`)
> 📄 **Official Individual Contribution Document (PDF)**: [`Individual_Contribution_S20240010264.pdf`](file:///c:/Users/ravic/OneDrive/Desktop/resourcex/Individual_Contribution_S20240010264.pdf) (Generated and stored in project root).

#### 1. Complete System Admin Operations Portal
- Architected and built the entire System Admin management suite under [`react-frontend/src/components/dashboards/admin/`](file:///c:/Users/ravic/OneDrive/Desktop/resourcex/react-frontend/src/components/dashboards/admin).
- Implemented 7 core views:
  - `AdminOverview.jsx`: Executive KPI metric cards, quick-action shortcuts, and department allocation breakdown.
  - `AdminUsers.jsx`: Full user lifecycle management with multi-field search, role/department filters, user creation, editing, and activation/suspension.
  - `AdminDepartments.jsx`: Department catalog, head assignments, member counts, and department creation.
  - `AdminResources.jsx`: Institutional resource & inventory oversight (monitors asset condition, stock health, and scrap statistics).
  - `AdminSubscription.jsx`: Institutional SaaS subscription tiers, plan limits, billing status, and renewal tracking.
  - `AdminSupport.jsx`: Institutional support desk to log, filter, and track technical tickets with platform employees.
  - `AdminAnnouncements.jsx`: Broadcast communications center to view platform announcements and post replies.
- Developed controlled modal dialogs: `AddUserModal.jsx`, `EditUserModal.jsx`, `AddDeptModal.jsx`, `NewTicketModal.jsx`, `ReplyAnnModal.jsx`, `AdminModal.jsx`, and `AdminToast.jsx`.

#### 2. Core Architecture, Services & Global State Management
- Engineered the centralized API gateway client ([`services/api.js`](file:///c:/Users/ravic/OneDrive/Desktop/resourcex/react-frontend/src/services/api.js)) with JWT token injection, automated body serialization, query generation, and normalized error handling.
- Implemented global authentication state management ([`AuthContext.jsx`](file:///c:/Users/ravic/OneDrive/Desktop/resourcex/react-frontend/src/context/AuthContext.jsx)) with cross-tab session synchronization.
- Designed application routing and route guards ([`App.jsx`](file:///c:/Users/ravic/OneDrive/Desktop/resourcex/react-frontend/src/App.jsx)) with `ProtectedRoute`, `PublicOnlyRoute`, and dynamic role-based dashboard landing resolution.
- Refactored universal navigation headers and dynamic sidebars ([`Sidebar.jsx`](file:///c:/Users/ravic/OneDrive/Desktop/resourcex/react-frontend/src/components/Sidebar.jsx), [`AppHeader.jsx`](file:///c:/Users/ravic/OneDrive/Desktop/resourcex/react-frontend/src/components/AppHeader.jsx)).

#### 3. Maintenance Officer Dashboard & History Refactoring
- Refactored the Maintenance Officer Activity History view ([`HistoryLogView.jsx`](file:///c:/Users/ravic/OneDrive/Desktop/resourcex/react-frontend/src/components/dashboards/maintenance-officer/views/HistoryLogView.jsx)) to strictly track technical diagnostics, servicing, and repair resolution logs with Repaired/Scrapped outcome filters and instant search, eliminating Return History clutter to maintain clean domain boundaries.
- Optimized [`maintenanceOfficer.js`](file:///c:/Users/ravic/OneDrive/Desktop/resourcex/react-frontend/src/services/maintenanceOfficer.js) and overview KPI cards to compute metrics focused exclusively on repair servicing throughput.

#### 4. Inventory Officer & Requestor Workflow Enhancements
- Enhanced Inventory Officer workflows with return deadline tracking, overdue asset detection, and force return actions.
- Implemented Requestor receipt confirmation ("I Received") to bind allocated resources directly to user inventories and mark requests completed.
- Scoped Indents and Procurement views strictly to officer departments.

---

### J Prem Sahith (Roll: `S20240010089`)
> 📄 **Official Individual Contribution Document (PDF)**: [`Prem_Sahith_S20240010089_Individual_Contribution.pdf`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/Prem_Sahith_S20240010089_Individual_Contribution.pdf) (Generated and stored in project root).

#### 1. Requestor History & Activity Center (Return & Maintenance Tracking)
- **Component Developed**: [`react-frontend/src/components/dashboards/requestor/views/RequestorHistoryView.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/requestor/views/RequestorHistoryView.jsx)
  - Designed and built a unified activity center featuring dual tabs: **Return History** and **Maintenance History**.
  - Implemented clean client-facing status badges: displays `check_circle Return Accepted & Closed` alongside `verified Processed by Inventory`, omitting internal routing tags (*Sent to Maintenance* / *Scrapped*) for a polished user experience.
  - Implemented search across asset IDs, types, and return reasons, with condition filtering (*Good*, *Average*, *Fair*, *Damaged*, *Bad*) and repair status filters (*Repaired*, *Under Repair*, *Ticket Logged*).
- **Dashboard Integrations**:
  - [`react-frontend/src/components/dashboards/requestor/RequestorDashboard.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/requestor/RequestorDashboard.jsx): Integrated the `History & Activity` nav item and view switching router.
  - [`react-frontend/src/components/dashboards/requestor/views/RequestorOverview.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/requestor/views/RequestorOverview.jsx): Added returned assets stat counter card and quick navigation banner.
  - [`react-frontend/src/components/dashboards/requestor/views/MyResourcesView.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/requestor/views/MyResourcesView.jsx): Linked direct jump button to view return and activity history.
  - [`react-frontend/src/services/requestor.js`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/services/requestor.js): Added client methods `fetchRequestorReturnHistory()` and `fetchRequestorMaintenanceHistory()`.
- **Backend Data Isolation & Scoping**:
  - [`backend/src/returns/returns.service.ts`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/backend/src/returns/returns.service.ts): Scoped return history queries so Requestors only access their own return logs (`returnedBy.toLowerCase() === user.name.toLowerCase()`).
  - [`backend/src/maintenance/maintenance.service.ts`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/backend/src/maintenance/maintenance.service.ts): Scoped maintenance queries to filter strictly to the requestor's allocated assets.

#### 2. Inventory Staff Return Management & Inspection Workflow
- **Component Developed**: [`react-frontend/src/components/dashboards/inventory-officer/views/InventoryReturnsView.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/inventory-officer/views/InventoryReturnsView.jsx)
  - Transferred return inspection responsibility from Maintenance to Inventory Staff.
  - Created interactive inspection modal allowing Inventory Officers to evaluate condition (*Good*, *Fair*, *Damaged*, etc.) and determine destination:
    - Route directly back to **Available** stock.
    - Dispatch to **Maintenance Queue** with issue description and priority.
    - Mark as **Scrapped** with condition rationale.
  - Built **Return History Logs** tab with destination-based filtering and audit search.
- **Officer Dashboard Integration**:
  - [`react-frontend/src/components/dashboards/inventory-officer/InventoryOfficerDashboard.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/inventory-officer/InventoryOfficerDashboard.jsx): Registered `Process Returns` navigation item.
  - [`react-frontend/src/components/dashboards/inventory-officer/views/InvOfficerOverview.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/inventory-officer/views/InvOfficerOverview.jsx): Added pending return inspection KPI cards and quick-action banner.
  - [`react-frontend/src/services/inventoryOfficer.js`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/services/inventoryOfficer.js): Added `fetchReturnHistory()` and `processReturn()` endpoints.
  - [`backend/src/returns/returns.controller.ts`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/backend/src/returns/returns.controller.ts): Updated endpoint security roles with `@Roles('Inventory Officer', 'Maintenance Officer', 'System Admin')`.

#### 3. React Conversion of Registrar Portal
- Architected and implemented the complete React Registrar suite under [`react-frontend/src/components/dashboards/registrar/`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/registrar).
- Built master dashboard router & layout ([`RegistrarDashboard.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/registrar/RegistrarDashboard.jsx)) synchronizing sidebar navigation, active tabs, and URL routes.
- Implemented core views:
  - [`RegistrarOverview.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/registrar/views/RegistrarOverview.jsx): High-level KPI metric cards and real-time recent requests/procurements tables with resilient parallel data loading (`Promise.all`).
  - [`ProcurementApprovalsView.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/registrar/views/ProcurementApprovalsView.jsx): Full procurement review lifecycle (approve, reject with mandatory justification, cost summaries).
  - [`GlobalRequestsView.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/registrar/views/GlobalRequestsView.jsx): Cross-institution request audit table with dynamic backend department loading.
  - [`SystemAnalyticsView.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/registrar/views/SystemAnalyticsView.jsx): Real-time departmental asset allocation and operational capacity visualization.
- Built supporting utilities:
  - [`FilePreviewModal.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/registrar/components/FilePreviewModal.jsx): In-browser document viewer for specification sheets and vendor invoices (supports PDF iframe embedding, image zoom, Base64-to-Blob conversion, and downloads).
  - [`RegistrarToast.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/dashboards/registrar/components/RegistrarToast.jsx): Non-intrusive floating feedback notification system.
  - [`services/registrar.js`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/services/registrar.js): Frontend API client connecting to NestJS backend endpoints.

#### 4. Landing Page Architecture & Conversion
- Modularized and converted the static marketing site into a complete React application under [`react-frontend/src/components/landing/`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing).
- Built component tree: [`LandingPage.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing/LandingPage.jsx), [`Navbar.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing/Navbar.jsx), [`HeroSection.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing/HeroSection.jsx), [`DepartmentsSection.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing/DepartmentsSection.jsx), [`UsersSection.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing/UsersSection.jsx), [`ResourcesSection.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing/ResourcesSection.jsx), [`PartnersSection.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing/PartnersSection.jsx), [`Footer.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing/Footer.jsx).
- Created reusable UI elements: [`FeatureCard.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing/FeatureCard.jsx) and [`RoleCard.jsx`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing/RoleCard.jsx).
- Implemented automated **Scroll-Spy** using `IntersectionObserver` to dynamically update active navbar indicators during scrolling.
- Authored scoped stylesheets in [`landing.css`](file:///Users/premsahith/Desktop/Sk/fefed/final_resource/react-frontend/src/components/landing/landing.css) ensuring responsive layouts across mobile, tablet, and desktop viewports.

