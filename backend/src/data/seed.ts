import {
  AppState,
  DepartmentRecord,
  StockThresholdRecord,
  UserRecord,
} from '../common/domain';

export const seedState: AppState = {
  subscriptionPlans: [
    {
      "id": "PLAN-001",
      "name": "Starter",
      "maxUsers": 50,
      "pricePerYear": 999,
      "features": [
        "Core Requests",
        "Basic Support"
      ]
    },
    {
      "id": "PLAN-002",
      "name": "Professional",
      "maxUsers": 200,
      "pricePerYear": 2999,
      "features": [
        "Advanced Analytics",
        "Priority Support"
      ]
    },
    {
      "id": "PLAN-003",
      "name": "Enterprise",
      "maxUsers": 1000,
      "pricePerYear": 9999,
      "features": [
        "Unlimited Workflows",
        "Dedicated Employee"
      ]
    }
  ],
  organizations: [
    {
      "id": "ORG-001",
      "name": "Acme Corp",
      "adminEmail": "yashwath@resourcex.com",
      "status": "Active",
      "assignedEmployeeId": "EMP-001",
      "subscriptionPlanId": "PLAN-002",
      "subscriptionExpiryDate": "2027-12-31"
    },
    {
      "id": "ORG-002",
      "name": "Enterprise Client 2",
      "adminEmail": "admin@client2.com",
      "status": "Active",
      "assignedEmployeeId": "EMP-002",
      "subscriptionPlanId": "PLAN-003",
      "subscriptionExpiryDate": "2027-12-31"
    },
    {
      "id": "ORG-003",
      "name": "Enterprise Client 3",
      "adminEmail": "admin@client3.com",
      "status": "Active",
      "assignedEmployeeId": "EMP-003",
      "subscriptionPlanId": "PLAN-001",
      "subscriptionExpiryDate": "2027-12-31"
    },
    {
      "id": "ORG-004",
      "name": "Enterprise Client 4",
      "adminEmail": "admin@client4.com",
      "status": "Active",
      "assignedEmployeeId": "EMP-004",
      "subscriptionPlanId": "PLAN-002",
      "subscriptionExpiryDate": "2027-12-31"
    },
    {
      "id": "ORG-005",
      "name": "Enterprise Client 5",
      "adminEmail": "admin@client5.com",
      "status": "Active",
      "assignedEmployeeId": "EMP-005",
      "subscriptionPlanId": "PLAN-003",
      "subscriptionExpiryDate": "2027-12-31"
    },
    {
      "id": "ORG-006",
      "name": "Enterprise Client 6",
      "adminEmail": "admin@client6.com",
      "status": "Active",
      "assignedEmployeeId": "EMP-001",
      "subscriptionPlanId": "PLAN-001",
      "subscriptionExpiryDate": "2027-12-31"
    },
    {
      "id": "ORG-007",
      "name": "Enterprise Client 7",
      "adminEmail": "admin@client7.com",
      "status": "Active",
      "assignedEmployeeId": "EMP-002",
      "subscriptionPlanId": "PLAN-002",
      "subscriptionExpiryDate": "2027-12-31"
    },
    {
      "id": "ORG-008",
      "name": "Enterprise Client 8",
      "adminEmail": "admin@client8.com",
      "status": "Active",
      "assignedEmployeeId": "EMP-003",
      "subscriptionPlanId": "PLAN-003",
      "subscriptionExpiryDate": "2027-12-31"
    },
    {
      "id": "ORG-009",
      "name": "Enterprise Client 9",
      "adminEmail": "admin@client9.com",
      "status": "Active",
      "assignedEmployeeId": "EMP-004",
      "subscriptionPlanId": "PLAN-001",
      "subscriptionExpiryDate": "2027-12-31"
    },
    {
      "id": "ORG-0010",
      "name": "Enterprise Client 10",
      "adminEmail": "admin@client10.com",
      "status": "Active",
      "assignedEmployeeId": "EMP-005",
      "subscriptionPlanId": "PLAN-002",
      "subscriptionExpiryDate": "2027-12-31"
    },
    {
      "id": "ORG-0011",
      "name": "TechStartup Alpha",
      "adminEmail": "ceo@techstartup.com",
      "status": "Pending",
      "assignedEmployeeId": null,
      "subscriptionPlanId": "PLAN-001",
      "subscriptionExpiryDate": null
    },
    {
      "id": "ORG-0012",
      "name": "Global Finance Ltd",
      "adminEmail": "ops@globalfinance.com",
      "status": "Pending",
      "assignedEmployeeId": null,
      "subscriptionPlanId": "PLAN-002",
      "subscriptionExpiryDate": null
    },
    {
      "id": "ORG-0013",
      "name": "EduTech Academy",
      "adminEmail": "admin@edutech.org",
      "status": "Pending",
      "assignedEmployeeId": null,
      "subscriptionPlanId": "PLAN-003",
      "subscriptionExpiryDate": null
    }
  ],
  supportTickets: [],
  announcements: [],
  invoices: [],
  users: [
    { "id": "OWN-001", "organizationId": "PLATFORM", "name": "Platform Owner", "email": "owner@resourcex.com", "password": "password", "role": "Owner", "status": "Active", "preferences": { "notifications": true } },
    { "id": "EMP-001", "organizationId": "PLATFORM", "name": "Support Employee 1", "email": "employee1@resourcex.com", "password": "password", "role": "Employee", "status": "Active", "preferences": { "notifications": true } },
    { "id": "EMP-002", "organizationId": "PLATFORM", "name": "Support Employee 2", "email": "employee2@resourcex.com", "password": "password", "role": "Employee", "status": "Active", "preferences": { "notifications": true } },
    { "id": "EMP-003", "organizationId": "PLATFORM", "name": "Support Employee 3", "email": "employee3@resourcex.com", "password": "password", "role": "Employee", "status": "Active", "preferences": { "notifications": true } },
    { "id": "EMP-004", "organizationId": "PLATFORM", "name": "Support Employee 4", "email": "employee4@resourcex.com", "password": "password", "role": "Employee", "status": "Active", "preferences": { "notifications": true } },
    { "id": "EMP-005", "organizationId": "PLATFORM", "name": "Support Employee 5", "email": "employee5@resourcex.com", "password": "password", "role": "Employee", "status": "Active", "preferences": { "notifications": true } },
    { id: 'U1', organizationId: 'ORG-001', name: 'RAVI CHANDRA', email: 'ravi@resourcex.com', password: '12345678', role: 'Requestor', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U2', organizationId: 'ORG-001', name: 'pradhyum', email: 'pradhyum@resourcex.com', password: '12345678', role: 'Dept Head', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U3', organizationId: 'ORG-001', name: 'HARSHA TEJ', email: 'harsha@resourcex.com', password: '12345678', role: 'Registrar', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U4', organizationId: 'ORG-001', name: 'yaswanth kumar', email: 'yaswanth@resourcex.com', password: '12345678', role: 'Inventory Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U4M', organizationId: 'ORG-001', name: 'Kumar Maint', email: 'kumarmaint@resourcex.com', password: '12345678', role: 'Maintenance Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U4P', organizationId: 'ORG-001', name: 'Kumar Proc', email: 'kumarproc@resourcex.com', password: '12345678', role: 'Procurement Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U5', organizationId: 'ORG-001', name: 'yashwath', email: 'yashwath@resourcex.com', password: '12345678', role: 'System Admin', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U6', organizationId: 'ORG-001', name: 'Alice Worker', email: 'alice@resourcex.com', password: '12345678', role: 'Requestor', department: 'HR Dept', status: 'Active', preferences: { notifications: true } },
    { id: 'U7', organizationId: 'ORG-001', name: 'John Doe', email: 'john@resourcex.com', password: '12345678', role: 'Dept Head', department: 'HR Dept', status: 'Active', preferences: { notifications: true } },
    { id: 'U8', organizationId: 'ORG-001', name: 'Jane Smith', email: 'jane@resourcex.com', password: '12345678', role: 'Dept Head', department: 'Operations', status: 'Active', preferences: { notifications: true } },
    { id: 'U9', organizationId: 'ORG-001', name: 'Bob Builder', email: 'bob@resourcex.com', password: '12345678', role: 'Requestor', department: 'Operations', status: 'Active', preferences: { notifications: true } },
    { id: 'U10', organizationId: 'ORG-002', name: 'Admin Org 2', email: 'admin@org2.com', password: 'password', role: 'System Admin', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U11', organizationId: 'ORG-002', name: 'Req Org 2', email: 'req@org2.com', password: 'password', role: 'Requestor', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U12', organizationId: 'ORG-002', name: 'Head Org 2', email: 'head@org2.com', password: 'password', role: 'Dept Head', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U13', organizationId: 'ORG-002', name: 'Inv Officer Org 2', email: 'inv@org2.com', password: 'password', role: 'Inventory Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U14', organizationId: 'ORG-002', name: 'Reg Org 2', email: 'reg@org2.com', password: 'password', role: 'Registrar', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U15', organizationId: 'ORG-003', name: 'Admin Org 3', email: 'admin@org3.com', password: 'password', role: 'System Admin', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U16', organizationId: 'ORG-003', name: 'Req Org 3', email: 'req@org3.com', password: 'password', role: 'Requestor', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U17', organizationId: 'ORG-003', name: 'Head Org 3', email: 'head@org3.com', password: 'password', role: 'Dept Head', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U18', organizationId: 'ORG-003', name: 'Maint Officer Org 3', email: 'maint@org3.com', password: 'password', role: 'Maintenance Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U19', organizationId: 'ORG-003', name: 'Reg Org 3', email: 'reg@org3.com', password: 'password', role: 'Registrar', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U20', organizationId: 'ORG-004', name: 'Admin Org 4', email: 'admin@org4.com', password: 'password', role: 'System Admin', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U21', organizationId: 'ORG-004', name: 'Req Org 4', email: 'req@org4.com', password: 'password', role: 'Requestor', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U22', organizationId: 'ORG-004', name: 'Head Org 4', email: 'head@org4.com', password: 'password', role: 'Dept Head', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U23', organizationId: 'ORG-004', name: 'Proc Officer Org 4', email: 'proc@org4.com', password: 'password', role: 'Procurement Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U24', organizationId: 'ORG-004', name: 'Reg Org 4', email: 'reg@org4.com', password: 'password', role: 'Registrar', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U25', organizationId: 'ORG-005', name: 'Admin Org 5', email: 'admin@org5.com', password: 'password', role: 'System Admin', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U26', organizationId: 'ORG-005', name: 'Req Org 5', email: 'req@org5.com', password: 'password', role: 'Requestor', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U27', organizationId: 'ORG-005', name: 'Head Org 5', email: 'head@org5.com', password: 'password', role: 'Dept Head', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U28', organizationId: 'ORG-005', name: 'Inv Officer Org 5', email: 'inv@org5.com', password: 'password', role: 'Inventory Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U29', organizationId: 'ORG-005', name: 'Reg Org 5', email: 'reg@org5.com', password: 'password', role: 'Registrar', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U30', organizationId: 'ORG-006', name: 'Admin Org 6', email: 'admin@org6.com', password: 'password', role: 'System Admin', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U31', organizationId: 'ORG-006', name: 'Req Org 6', email: 'req@org6.com', password: 'password', role: 'Requestor', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U32', organizationId: 'ORG-006', name: 'Head Org 6', email: 'head@org6.com', password: 'password', role: 'Dept Head', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U33', organizationId: 'ORG-006', name: 'Maint Officer Org 6', email: 'maint@org6.com', password: 'password', role: 'Maintenance Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U34', organizationId: 'ORG-006', name: 'Reg Org 6', email: 'reg@org6.com', password: 'password', role: 'Registrar', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U35', organizationId: 'ORG-007', name: 'Admin Org 7', email: 'admin@org7.com', password: 'password', role: 'System Admin', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U36', organizationId: 'ORG-007', name: 'Req Org 7', email: 'req@org7.com', password: 'password', role: 'Requestor', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U37', organizationId: 'ORG-007', name: 'Head Org 7', email: 'head@org7.com', password: 'password', role: 'Dept Head', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U38', organizationId: 'ORG-007', name: 'Proc Officer Org 7', email: 'proc@org7.com', password: 'password', role: 'Procurement Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U39', organizationId: 'ORG-007', name: 'Reg Org 7', email: 'reg@org7.com', password: 'password', role: 'Registrar', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U40', organizationId: 'ORG-008', name: 'Admin Org 8', email: 'admin@org8.com', password: 'password', role: 'System Admin', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U41', organizationId: 'ORG-008', name: 'Req Org 8', email: 'req@org8.com', password: 'password', role: 'Requestor', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U42', organizationId: 'ORG-008', name: 'Head Org 8', email: 'head@org8.com', password: 'password', role: 'Dept Head', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U43', organizationId: 'ORG-008', name: 'Inv Officer Org 8', email: 'inv@org8.com', password: 'password', role: 'Inventory Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U44', organizationId: 'ORG-008', name: 'Reg Org 8', email: 'reg@org8.com', password: 'password', role: 'Registrar', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U45', organizationId: 'ORG-009', name: 'Admin Org 9', email: 'admin@org9.com', password: 'password', role: 'System Admin', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U46', organizationId: 'ORG-009', name: 'Req Org 9', email: 'req@org9.com', password: 'password', role: 'Requestor', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U47', organizationId: 'ORG-009', name: 'Head Org 9', email: 'head@org9.com', password: 'password', role: 'Dept Head', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U48', organizationId: 'ORG-009', name: 'Maint Officer Org 9', email: 'maint@org9.com', password: 'password', role: 'Maintenance Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U49', organizationId: 'ORG-009', name: 'Reg Org 9', email: 'reg@org9.com', password: 'password', role: 'Registrar', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U50', organizationId: 'ORG-0010', name: 'Admin Org 10', email: 'admin@org10.com', password: 'password', role: 'System Admin', department: 'Administration', status: 'Active', preferences: { notifications: true } },
    { id: 'U51', organizationId: 'ORG-0010', name: 'Req Org 10', email: 'req@org10.com', password: 'password', role: 'Requestor', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U52', organizationId: 'ORG-0010', name: 'Head Org 10', email: 'head@org10.com', password: 'password', role: 'Dept Head', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U53', organizationId: 'ORG-0010', name: 'Proc Officer Org 10', email: 'proc@org10.com', password: 'password', role: 'Procurement Officer', department: 'IT Services', status: 'Active', preferences: { notifications: true } },
    { id: 'U54', organizationId: 'ORG-0010', name: 'Reg Org 10', email: 'reg@org10.com', password: 'password', role: 'Registrar', department: 'Administration', status: 'Active', preferences: { notifications: true } }
  ],
  departments: [
    { id: 'D1', organizationId: 'ORG-001', name: 'IT Services', head: 'pradhyum', memberCount: 15 },
    { id: 'D2', organizationId: 'ORG-001', name: 'HR Dept', head: 'John Doe', memberCount: 8 },
    { id: 'D3', organizationId: 'ORG-001', name: 'Operations', head: 'Jane Smith', memberCount: 20 },
    { id: 'D4', organizationId: 'ORG-001', name: 'Administration', head: 'HARSHA TEJ', memberCount: 5 },
    { id: 'D5', organizationId: 'ORG-001', name: 'Facilities', head: 'yaswanth kumar', memberCount: 12 }
  ],
  requests: [
    { id: 'REQ-101', organizationId: 'ORG-001', resourceType: 'High-Cap Batteries', quantity: 1, requestor: 'RAVI CHANDRA', requestorId: 'U1', department: 'IT Services', status: 'Allocated', priority: 'Normal', date: 'Oct 24, 2023', justification: 'Restocking for field ops' },
    { id: 'REQ-102', organizationId: 'ORG-001', resourceType: 'Server Blades v2', quantity: 2, requestor: 'RAVI CHANDRA', requestorId: 'U1', department: 'IT Services', status: 'Approved', priority: 'High', date: 'Oct 25, 2023', justification: 'Server upgrade capacity' },
    { id: 'REQ-103', organizationId: 'ORG-001', resourceType: 'Laptops', quantity: 3, requestor: 'RAVI CHANDRA', requestorId: 'U1', department: 'IT Services', status: 'Pending', priority: 'Normal', date: 'Oct 26, 2023', justification: 'New team members joining' },
    { id: 'REQ-104', organizationId: 'ORG-001', resourceType: 'External Hard Drives', quantity: 5, requestor: 'RAVI CHANDRA', requestorId: 'U1', department: 'IT Services', status: 'Approved', priority: 'Normal', date: 'Oct 27, 2023', justification: 'Local backup storage' },
    { id: 'REQ-201', organizationId: 'ORG-001', resourceType: 'Laptops', quantity: 2, requestor: 'Alice Worker', requestorId: 'U6', department: 'HR Dept', status: 'Approved', priority: 'Normal', date: 'Oct 22, 2023', justification: 'New hires onboarding' },
    { id: 'REQ-202', organizationId: 'ORG-001', resourceType: 'Standing Desks', quantity: 2, requestor: 'Alice Worker', requestorId: 'U6', department: 'HR Dept', status: 'Pending', priority: 'Normal', date: 'Oct 27, 2023', justification: 'Employee wellness program' },
    { id: 'REQ-203', organizationId: 'ORG-001', resourceType: 'Ergonomic Keyboards', quantity: 3, requestor: 'Alice Worker', requestorId: 'U6', department: 'HR Dept', status: 'Pending', priority: 'Low', date: 'Oct 28, 2023', justification: 'Ergonomic setup requested' },
    { id: 'REQ-301', organizationId: 'ORG-001', resourceType: 'Projector Screens', quantity: 2, requestor: 'Bob Builder', requestorId: 'U9', department: 'Operations', status: 'Rejected', priority: 'Low', date: 'Oct 18, 2023', justification: 'Not enough budget' },
    { id: 'REQ-302', organizationId: 'ORG-001', resourceType: 'Whiteboards', quantity: 4, requestor: 'Bob Builder', requestorId: 'U9', department: 'Operations', status: 'Allocated', priority: 'Low', date: 'Oct 01, 2023', justification: 'New meeting rooms' },
    { id: 'REQ-303', organizationId: 'ORG-001', resourceType: 'Walkie Talkies', quantity: 6, requestor: 'Bob Builder', requestorId: 'U9', department: 'Operations', status: 'Approved', priority: 'High', date: 'Oct 29, 2023', justification: 'Facility comms' }
  ],
  resources: [
    // --- IT Services ---
    { id: 'RES-1049', organizationId: 'ORG-001', name: 'Laptop - Dell XPS', type: 'Laptops', department: 'IT Services', serialNumber: 'SN-998822', status: 'Allocated', condition: 'Good', assignedTo: 'RAVI CHANDRA', assignedToId: 'U1', date: 'Jan 12, 2023' },
    { id: 'RES-9055', organizationId: 'ORG-001', name: 'Mechanical Keyboard', type: 'Accessories', department: 'IT Services', serialNumber: 'SN-778899', status: 'Allocated', condition: 'Good', assignedTo: 'RAVI CHANDRA', assignedToId: 'U1', date: 'Sep 22, 2023' },
    { id: 'RES-ITL-201', organizationId: 'ORG-001', name: 'Laptop - HP ProBook', type: 'Laptops', department: 'IT Services', serialNumber: 'SN-ITL-201', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'HP', invoice: 'INV-IT-201', location: 'IT Services Store' },
    { id: 'RES-ITL-202', organizationId: 'ORG-001', name: 'Laptop - Lenovo ThinkPad', type: 'Laptops', department: 'IT Services', serialNumber: 'SN-ITL-202', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Lenovo', invoice: 'INV-IT-202', location: 'IT Services Store' },
    { id: 'RES-ITL-203', organizationId: 'ORG-001', name: 'Laptop - Dell Latitude', type: 'Laptops', department: 'IT Services', serialNumber: 'SN-ITL-203', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Dell', invoice: 'INV-IT-203', location: 'IT Services Store' },
    { id: 'RES-ITL-204', organizationId: 'ORG-001', name: 'Laptop - Acer TravelMate', type: 'Laptops', department: 'IT Services', serialNumber: 'SN-ITL-204', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Acer', invoice: 'INV-IT-204', location: 'IT Services Store' },
    { id: 'RES-SB-101', organizationId: 'ORG-001', name: 'Server Blade v2 - Blade 1', type: 'Server Blades v2', department: 'IT Services', serialNumber: 'SN-SB-101', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Cisco Systems', invoice: 'INV-SB-101', location: 'IT Server Room' },
    { id: 'RES-SB-102', organizationId: 'ORG-001', name: 'Server Blade v2 - Blade 2', type: 'Server Blades v2', department: 'IT Services', serialNumber: 'SN-SB-102', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Cisco Systems', invoice: 'INV-SB-102', location: 'IT Server Room' },
    { id: 'RES-SB-103', organizationId: 'ORG-001', name: 'Server Blade v2 - Blade 3', type: 'Server Blades v2', department: 'IT Services', serialNumber: 'SN-SB-103', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Cisco Systems', invoice: 'INV-SB-103', location: 'IT Server Room' },
    { id: 'RES-5011', organizationId: 'ORG-001', name: 'Server Blade v2 - Unit 4', type: 'Server Blades v2', department: 'IT Services', serialNumber: 'SN-990088', status: 'Maintenance Requested', condition: 'Damaged', assignedTo: 'RAVI CHANDRA', assignedToId: 'U1', date: 'May 20, 2023', vendor: 'Cisco Systems', invoice: 'INV-8899' },
    { id: 'RES-IT-301', organizationId: 'ORG-001', name: 'External Hard Drive - 1TB', type: 'External Hard Drives', department: 'IT Services', serialNumber: 'SN-IT-301', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Seagate', invoice: 'INV-IT-301', location: 'IT Services Store' },
    { id: 'RES-IT-302', organizationId: 'ORG-001', name: 'External Hard Drive - 1TB', type: 'External Hard Drives', department: 'IT Services', serialNumber: 'SN-IT-302', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Seagate', invoice: 'INV-IT-302', location: 'IT Services Store' },
    { id: 'RES-IT-303', organizationId: 'ORG-001', name: 'External Hard Drive - 1TB', type: 'External Hard Drives', department: 'IT Services', serialNumber: 'SN-IT-303', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'WD', invoice: 'INV-IT-303', location: 'IT Services Store' },
    { id: 'RES-IT-304', organizationId: 'ORG-001', name: 'External Hard Drive - 1TB', type: 'External Hard Drives', department: 'IT Services', serialNumber: 'SN-IT-304', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'WD', invoice: 'INV-IT-304', location: 'IT Services Store' },
    { id: 'RES-IT-305', organizationId: 'ORG-001', name: 'External Hard Drive - 1TB', type: 'External Hard Drives', department: 'IT Services', serialNumber: 'SN-IT-305', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Toshiba', invoice: 'INV-IT-305', location: 'IT Services Store' },
    { id: 'RES-6022', organizationId: 'ORG-001', name: 'Network Switch - Cisco 24P', type: 'Network Switches', department: 'IT Services', serialNumber: 'SN-110022', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'Jun 10, 2023' },
    { id: 'RES-BAT-101', organizationId: 'ORG-001', name: 'High-Cap Battery Pack', type: 'High-Cap Batteries', department: 'IT Services', serialNumber: 'SN-BAT-101', status: 'Allocated', condition: 'Good', assignedTo: 'RAVI CHANDRA', assignedToId: 'U1', date: 'Oct 24, 2023' },
    { id: 'RES-6001', organizationId: 'ORG-001', name: 'Wireless Mouse', type: 'Accessories', department: 'IT Services', serialNumber: 'SN-112233-A', status: 'Returned', condition: 'Fair', assignedTo: 'RAVI CHANDRA', assignedToId: 'U1', date: 'Oct 28, 2023' },

    // --- HR Dept ---
    { id: 'RES-HR-210', organizationId: 'ORG-001', name: 'Laptop - HP EliteBook', type: 'Laptops', department: 'HR Dept', serialNumber: 'SN-HR-210', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'HP', invoice: 'INV-HR-210', location: 'HR Resource Room' },
    { id: 'RES-HR-211', organizationId: 'ORG-001', name: 'Laptop - Lenovo Yoga', type: 'Laptops', department: 'HR Dept', serialNumber: 'SN-HR-211', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Lenovo', invoice: 'INV-HR-211', location: 'HR Resource Room' },
    { id: 'RES-8044', organizationId: 'ORG-001', name: 'Monitor 27 inch', type: 'Monitors', department: 'HR Dept', serialNumber: 'SN-556677', status: 'Allocated', condition: 'Good', assignedTo: 'Alice Worker', assignedToId: 'U6', date: 'Aug 12, 2023' },
    { id: 'RES-DSK-201', organizationId: 'ORG-001', name: 'Standing Desk Pro', type: 'Standing Desks', department: 'HR Dept', serialNumber: 'SN-DSK-201', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Ikea', invoice: 'INV-DSK-201', location: 'HR Office' },
    { id: 'RES-DSK-202', organizationId: 'ORG-001', name: 'Standing Desk Pro', type: 'Standing Desks', department: 'HR Dept', serialNumber: 'SN-DSK-202', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Ikea', invoice: 'INV-DSK-202', location: 'HR Office' },
    { id: 'RES-KBD-201', organizationId: 'ORG-001', name: 'Ergonomic Keyboard', type: 'Ergonomic Keyboards', department: 'HR Dept', serialNumber: 'SN-KBD-201', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Logitech', invoice: 'INV-KBD-201', location: 'HR Office' },
    { id: 'RES-KBD-202', organizationId: 'ORG-001', name: 'Ergonomic Keyboard', type: 'Ergonomic Keyboards', department: 'HR Dept', serialNumber: 'SN-KBD-202', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Logitech', invoice: 'INV-KBD-202', location: 'HR Office' },
    { id: 'RES-KBD-203', organizationId: 'ORG-001', name: 'Ergonomic Keyboard', type: 'Ergonomic Keyboards', department: 'HR Dept', serialNumber: 'SN-KBD-203', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026', vendor: 'Logitech', invoice: 'INV-KBD-203', location: 'HR Office' },
    { id: 'RES-5012', organizationId: 'ORG-001', name: 'Office Printer', type: 'Printers', department: 'HR Dept', serialNumber: 'SN-880099', status: 'Maintenance Requested', condition: 'Damaged', assignedTo: 'Alice Worker', assignedToId: 'U6', date: 'May 21, 2023' },
    { id: 'RES-6003', organizationId: 'ORG-001', name: 'Headset', type: 'Headsets', department: 'HR Dept', serialNumber: 'SN-334455', status: 'Returned', condition: 'Fair', assignedTo: 'Alice Worker', assignedToId: 'U6', date: 'Oct 29, 2023' },

    // --- Operations ---
    { id: 'RES-4050', organizationId: 'ORG-001', name: 'Ergonomic Chair', type: 'Office Chairs', department: 'Operations', serialNumber: 'SN-221144', status: 'Allocated', condition: 'Good', assignedTo: 'Bob Builder', assignedToId: 'U9', date: 'Apr 15, 2023' },
    { id: 'RES-1122', organizationId: 'ORG-001', name: 'Tablet Pro', type: 'Tablets', department: 'Operations', serialNumber: 'SN-889900', status: 'Allocated', condition: 'Fair', assignedTo: 'Bob Builder', assignedToId: 'U9', date: 'Oct 01, 2023' },
    { id: 'RES-PS-301', organizationId: 'ORG-001', name: 'Projector Screen 100"', type: 'Projector Screens', department: 'Operations', serialNumber: 'SN-PS-301', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026' },
    { id: 'RES-PS-302', organizationId: 'ORG-001', name: 'Projector Screen 100"', type: 'Projector Screens', department: 'Operations', serialNumber: 'SN-PS-302', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026' },
    { id: 'RES-WB-301', organizationId: 'ORG-001', name: 'Magnetic Whiteboard', type: 'Whiteboards', department: 'Operations', serialNumber: 'SN-WB-301', status: 'Allocated', condition: 'Good', assignedTo: 'Bob Builder', assignedToId: 'U9', date: 'Oct 01, 2023' },
    { id: 'RES-WB-302', organizationId: 'ORG-001', name: 'Magnetic Whiteboard', type: 'Whiteboards', department: 'Operations', serialNumber: 'SN-WB-302', status: 'Allocated', condition: 'Good', assignedTo: 'Bob Builder', assignedToId: 'U9', date: 'Oct 01, 2023' },
    { id: 'RES-WB-303', organizationId: 'ORG-001', name: 'Magnetic Whiteboard', type: 'Whiteboards', department: 'Operations', serialNumber: 'SN-WB-303', status: 'Allocated', condition: 'Good', assignedTo: 'Bob Builder', assignedToId: 'U9', date: 'Oct 01, 2023' },
    { id: 'RES-WB-304', organizationId: 'ORG-001', name: 'Magnetic Whiteboard', type: 'Whiteboards', department: 'Operations', serialNumber: 'SN-WB-304', status: 'Allocated', condition: 'Good', assignedTo: 'Bob Builder', assignedToId: 'U9', date: 'Oct 01, 2023' },
    { id: 'RES-WT-301', organizationId: 'ORG-001', name: 'Walkie Talkie Long Range', type: 'Walkie Talkies', department: 'Operations', serialNumber: 'SN-WT-301', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026' },
    { id: 'RES-WT-302', organizationId: 'ORG-001', name: 'Walkie Talkie Long Range', type: 'Walkie Talkies', department: 'Operations', serialNumber: 'SN-WT-302', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026' },
    { id: 'RES-WT-303', organizationId: 'ORG-001', name: 'Walkie Talkie Long Range', type: 'Walkie Talkies', department: 'Operations', serialNumber: 'SN-WT-303', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026' },
    { id: 'RES-WT-304', organizationId: 'ORG-001', name: 'Walkie Talkie Long Range', type: 'Walkie Talkies', department: 'Operations', serialNumber: 'SN-WT-304', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026' },
    { id: 'RES-WT-305', organizationId: 'ORG-001', name: 'Walkie Talkie Long Range', type: 'Walkie Talkies', department: 'Operations', serialNumber: 'SN-WT-305', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026' },
    { id: 'RES-WT-306', organizationId: 'ORG-001', name: 'Walkie Talkie Long Range', type: 'Walkie Talkies', department: 'Operations', serialNumber: 'SN-WT-306', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026' },
    { id: 'RES-MS-301', organizationId: 'ORG-001', name: 'Microscope Set Pro', type: 'Microscope Sets', department: 'Operations', serialNumber: 'SN-MS-301', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026' },
    { id: 'RES-6002', organizationId: 'ORG-001', name: 'Presentation Remote', type: 'Presentation Remotes', department: 'Operations', serialNumber: 'SN-223344', status: 'Returned', condition: 'Fair', assignedTo: 'Bob Builder', assignedToId: 'U9', date: 'Oct 29, 2023' },

    // --- Administration ---
    { id: 'RES-2233', organizationId: 'ORG-001', name: 'Printer Color', type: 'Printers', department: 'Administration', serialNumber: 'SN-001122', status: 'Available', condition: 'Fair', assignedTo: 'None', date: 'Oct 15, 2023' },

    // --- Facilities ---
    { id: 'RES-5013', organizationId: 'ORG-001', name: 'Coffee Machine', type: 'Coffee Machines', department: 'Facilities', serialNumber: 'SN-770088', status: 'Maintenance', condition: 'Damaged', assignedTo: 'None', date: 'May 22, 2023' },
    { id: 'RES-CFT-501', organizationId: 'ORG-001', name: 'Conference Table - 12 Seater', type: 'Conference Tables', department: 'Facilities', serialNumber: 'SN-CFT-501', status: 'Available', condition: 'Good', assignedTo: 'None', date: 'May 05, 2026' }
  ],
  procurements: [
    { id: 'PROC-819', organizationId: 'ORG-001', resourceType: 'Server Blades v2', item: 'Server Blades v2', quantity: 10, department: 'IT Services', requestedBy: 'pradhyum', requester: 'pradhyum', requestedById: 'U2', status: 'Pending', date: 'Oct 26, 2023', justification: 'Capacity increase required.' },
    { id: 'PROC-820', organizationId: 'ORG-001', resourceType: 'HR Software Licenses', item: 'HR Software Licenses', quantity: 5, department: 'HR Dept', requestedBy: 'John Doe', requester: 'John Doe', requestedById: 'U7', status: 'Pending', date: 'Oct 28, 2023', justification: 'New system rollout.' },
    { id: 'PROC-821', organizationId: 'ORG-001', resourceType: 'Logistics Software', item: 'Logistics Software', quantity: 2, department: 'Operations', requestedBy: 'Jane Smith', requester: 'Jane Smith', requestedById: 'U8', status: 'Pending', date: 'Oct 29, 2023', justification: 'Tracking upgrade.' },
    { id: 'PROC-901', organizationId: 'ORG-001', resourceType: 'Microscope Sets', item: 'Microscope Sets', quantity: 5, department: 'Operations', requestedBy: 'Jane Smith', requester: 'Jane Smith', requestedById: 'U8', status: 'Approved', date: 'Oct 21, 2023', justification: 'Lab equipment upgrade.' },
    { id: 'PROC-911', organizationId: 'ORG-001', resourceType: 'Routers', item: 'Routers', quantity: 4, department: 'IT Services', requestedBy: 'pradhyum', requester: 'pradhyum', requestedById: 'U2', status: 'Approved', date: 'Oct 25, 2023', justification: 'Network infrastructure upgrade.' },
    { id: 'PROC-912', organizationId: 'ORG-001', resourceType: 'Office Desks', item: 'Office Desks', quantity: 8, department: 'HR Dept', requestedBy: 'John Doe', requester: 'John Doe', requestedById: 'U7', status: 'Approved', date: 'Oct 26, 2023', justification: 'New expansion.' },
    { id: 'PROC-905', organizationId: 'ORG-001', resourceType: 'Monitors', item: 'Monitors', quantity: 20, department: 'IT Services', requestedBy: 'pradhyum', requester: 'pradhyum', requestedById: 'U2', status: 'Rejected', date: 'Oct 15, 2023', justification: 'Exceeds annual budget.' },
    { id: 'PROC-850', organizationId: 'ORG-001', resourceType: 'Conference Tables', item: 'Conference Tables', quantity: 2, department: 'Facilities', requestedBy: 'prem kumar', requester: 'prem kumar', status: 'Fulfilled', date: 'Sep 10, 2023', justification: 'New building setup.' }
  ],
  notifications: [
    { id: 'N1', organizationId: 'ORG-001', title: 'Welcome to ResourceX', description: 'Your account has been created.', time: '1 day ago', read: false, recipientRole: 'All' },
    { id: 'N2', organizationId: 'ORG-001', title: 'Maintenance Alert', description: 'RES-5011 requires urgent repair.', time: '2 hours ago', read: false, recipientRole: 'Maintenance Officer' },
    { id: 'N3', organizationId: 'ORG-001', title: 'Procurement Approved', description: 'Microscope Sets Approved by Registrar.', time: '5 mins ago', read: false, recipientRole: 'Dept Head' }
  ],
  maintenanceHistory: [
    { code: 'RES-2233', organizationId: 'ORG-001', type: 'Printers', allocatedTo: 'None', issue: 'Paper Jam', actionDate: 'Oct 16, 2023', status: 'Repaired', department: 'Administration' },
    { code: 'RES-1122', organizationId: 'ORG-001', type: 'Tablets', allocatedTo: 'Jane Smith', issue: 'Shattered Screen', actionDate: 'Oct 10, 2023', status: 'Scrap', department: 'Operations' },
    { code: 'RES-3311', organizationId: 'ORG-001', type: 'Coffee Machines', allocatedTo: 'HQ Lounge', issue: 'Heating Element', actionDate: 'Oct 01, 2023', status: 'Repaired', department: 'Facilities' }
  ],
  returnHistory: [
    { code: 'RES-9988', organizationId: 'ORG-001', type: 'Laptops', returnedBy: 'Bob Builder', returnDate: 'Oct 20, 2023', processDate: 'Oct 21, 2023', condition: 'Bad', finalStatus: 'Scrapped', department: 'Operations' },
    { code: 'RES-7766', organizationId: 'ORG-001', type: 'Office Desks', returnedBy: 'Alice Worker', returnDate: 'Oct 22, 2023', processDate: 'Oct 23, 2023', condition: 'Good', finalStatus: 'Available', department: 'HR Dept' },
    { code: 'RES-5544', organizationId: 'ORG-001', type: 'Monitors', returnedBy: 'pradhyum', returnDate: 'Oct 25, 2023', processDate: 'Oct 26, 2023', condition: 'Good', finalStatus: 'Available', department: 'IT Services' }
  ],
  stockThresholds: [
    { id: 'TH-1', organizationId: 'ORG-001', department: 'IT Services', resourceType: 'Laptops', thresholdLevel: 15 },
    { id: 'TH-2', organizationId: 'ORG-001', department: 'IT Services', resourceType: 'Server Blades v2', thresholdLevel: 5 },
    { id: 'TH-3', organizationId: 'ORG-001', department: 'IT Services', resourceType: 'External Hard Drives', thresholdLevel: 8 },
    { id: 'TH-4', organizationId: 'ORG-001', department: 'IT Services', resourceType: 'Monitors', thresholdLevel: 5 },
    { id: 'TH-5', organizationId: 'ORG-001', department: 'IT Services', resourceType: 'Network Switches', thresholdLevel: 4 },
    { id: 'TH-6', organizationId: 'ORG-001', department: 'HR Dept', resourceType: 'Laptops', thresholdLevel: 5 },
    { id: 'TH-7', organizationId: 'ORG-001', department: 'HR Dept', resourceType: 'Standing Desks', thresholdLevel: 3 },
    { id: 'TH-8', organizationId: 'ORG-001', department: 'HR Dept', resourceType: 'Ergonomic Keyboards', thresholdLevel: 5 },
    { id: 'TH-9', organizationId: 'ORG-001', department: 'Operations', resourceType: 'Walkie Talkies', thresholdLevel: 10 },
    { id: 'TH-10', organizationId: 'ORG-001', department: 'Operations', resourceType: 'Projector Screens', thresholdLevel: 2 }
  ],
  resourceCatalog: [
    {
      organizationId: 'ORG-001', department: 'IT Services', resourceTypes: [
        'Laptops',
        'Server Blades v2',
        'External Hard Drives',
        'Network Switches',
        'Routers',
        'Monitors',
        'High-Cap Batteries',
        'Accessories',
      ],
    },
    {
      organizationId: 'ORG-001', department: 'HR Dept', resourceTypes: [
        'Laptops',
        'Standing Desks',
        'Office Desks',
        'Ergonomic Keyboards',
        'Monitors',
        'Printers',
        'Headsets',
        'HR Software Licenses',
      ],
    },
    {
      organizationId: 'ORG-001', department: 'Operations', resourceTypes: [
        'Walkie Talkies',
        'Projector Screens',
        'Whiteboards',
        'Tablets',
        'Microscope Sets',
        'Office Chairs',
        'Logistics Software',
      ],
    },
    {
      organizationId: 'ORG-001', department: 'Administration', resourceTypes: [
        'Printers',
        'Office Desks',
        'Monitors',
      ],
    },
    {
      organizationId: 'ORG-001', department: 'Facilities', resourceTypes: [
        'Conference Tables',
        'Coffee Machines',
        'Air Purifiers',
      ],
    },
  ]
};
