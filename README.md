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

# Staff Dashboard

Staff manage operational tasks including allocation, procurement, and maintenance.

### Allocation Requests
Assign resources to approved requests with support for **partial allocation**.

### Procurement Tasks
After registrar approval, staff complete procurement by entering:

- Vendor Name
- Invoice Number
- Purchase Date
- Warranty Details

Purchased resources are then **registered in the system**.

### Manage Resources
Staff can:
- Add resources
- Edit resource details
- View resource information

### Maintenance Management
Staff process maintenance requests:

- Accept / Reject request
- Mark as Repaired
- Mark as Scrap

### Return Management
Staff inspect returned resources and mark them as:

- Available
- Scrap

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

## 1. Prerequisites
- **Node.js**: v18.x or v20.x installed
- **npm**: v9.x or v10.x installed
- **Git**

## 2. Dependencies & Tech Stack
- **Frontend (`react-frontend`)**: React 19, React Router v7, Vite 8, Native CSS & Glassmorphism UI
- **Backend (`backend`)**: NestJS 11, Express, Node.js, TypeScript, Multer, Class-Validator, Swagger
- **Authentication**: JWT Bearer Tokens, Role-Based Access Control (RBAC), Multi-tab LocalStorage sync

## 3. Installation & Execution Steps

### Step 1: Start the Backend Server
Open a terminal in the project root:
```bash
cd backend
npm install
npm start
```
* Backend runs at: `http://localhost:3000`
* Swagger API Documentation: `http://localhost:3000/api/docs`

### Step 2: Start the React Frontend Application
Open a second terminal in the project root:
```bash
cd react-frontend
npm install
npm run dev
```
* React Application runs at: `http://localhost:5173`

---

# Testing & Evaluation Guide

### Demo Test Credentials (All Roles)

| Role | Email | Password | Default Landing Dashboard |
| :--- | :--- | :--- | :--- |
| **Requestor** | `ravi@resourcex.com` | `12345678` | `/dashboard/requestor` |
| **Department Head** | `pradhyum@resourcex.com` | `12345678` | `/dashboard/dept-head` |
| **Registrar** | `harsha@resourcex.com` | `12345678` | `/dashboard/registrar` |
| **Staff** | `yaswanth@resourcex.com` | `12345678` | `/dashboard/staff` |
| **System Admin** | `yashwath@resourcex.com` | `12345678` | `/dashboard/admin` |
| **Platform Owner** | `owner@resourcex.com` | `password` | `/dashboard/owner` |
| **Platform Employee** | `employee1@resourcex.com` | `password` | `/dashboard/employee` |

### Core Working Functionalities to Test:
1. **Multi-Role Authentication & Route Protection**:
   - Log in using any role above.
   - Verified that unauthenticated users attempting to access `/dashboard/*` are redirected to `/login` via `ProtectedRoute`.
   - Verified that authenticated users visiting `/login` are automatically forwarded to their specific dashboard via `PublicOnlyRoute`.
2. **Resource Request & Department Head Approval Workflow**:
   - As **Requestor** (`ravi@resourcex.com`), submit a request for an item (e.g. Dell Laptop).
   - Log out and log in as **Dept Head** (`pradhyum@resourcex.com`) to accept or reject the pending request.
3. **Staff Allocation & Inventory Control**:
   - Log in as **Staff** (`yaswanth@resourcex.com`).
   - Navigate to **Allocations** to assign an available physical asset with a serial number to approved requests.
4. **Registrar Procurement & Spec Document Upload**:
   - As **Dept Head**, submit a procurement request with an attached specification file (`specFile`).
   - The universal client dispatches multipart form data to backend storage.
   - Log in as **Registrar** (`harsha@resourcex.com`) to review, accept, or reject the procurement.
5. **System Admin User & Department Management**:
   - Log in as **System Admin** (`yashwath@resourcex.com`).
   - Add new users via controlled modal forms, assign departments, and suspend/reactivate accounts.

---

