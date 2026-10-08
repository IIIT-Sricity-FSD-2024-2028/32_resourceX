import React, { useState, useEffect, useRef } from "react";
import "./landing.css";

import Navbar from "./Navbar";
import HeroSection from "./HeroSection";
import PartnersSection from "./PartnersSection";
import DepartmentsSection from "./DepartmentsSection";
import UsersSection from "./UsersSection";
import ResourcesSection from "./ResourcesSection";
import Footer from "./Footer";

// ─── Static data (identical to PR #5 original specification) ───────────────────

const NAV_LINKS = [
  { id: "dashboard", label: "Dashboard" },
  { id: "departments", label: "Departments" },
  { id: "users", label: "Users" },
  { id: "resources", label: "Resources" },
];

const PARTNERS = ["techCorp", "global-el-x", "FINANCE X", "QUANTUM", "R-Corp"];

const DEPARTMENT_CARDS = [
  {
    icon: "domain",
    title: "Top-Down Visibility",
    description:
      "Visualize your organizational tree. Instantly know who manages which department and track their current operational capacity limits.",
    iconColor: "var(--primary-color)",
  },
  {
    icon: "account_balance",
    title: "Budget Allocation",
    description:
      "Allocate financial limits across different sectors to dynamically prevent over-purchasing and ensure strict enterprise compliance.",
    iconColor: "var(--primary-color)",
  },
  {
    icon: "speed",
    title: "Department Metrics",
    description:
      "Monitor procurement velocity, active employee requests, and maintenance schedules unique to specific structural divisions.",
    iconColor: "var(--primary-color)",
  },
];

const USER_ROLES = [
  {
    name: "The Requestor",
    description:
      "Empower employees to request hardware or services tracked with real-time ETA dashboards.",
    accentColor: "var(--primary-color)",
  },
  {
    name: "The Approver (Dept Head)",
    description:
      "Equip managers with one-click decision tools directly linking budgets to incoming employee needs.",
    accentColor: "#10b981",
  },
  {
    name: "Staff & Maintenance",
    description:
      "Direct ground-level workflow for physical inventory distribution and damage repairs.",
    accentColor: "#f59e0b",
  },
];

const RESOURCE_CARDS = [
  {
    icon: "inventory_2",
    title: "Live Inventory",
    description:
      "Search across thousands of physical assets instantly using our optimized indexing systems.",
    iconColor: "#8b5cf6",
  },
  {
    icon: "build",
    title: "Predictive Maintenance",
    description:
      "Automatically tag high-risk equipment and seamlessly generate repair tickets for on-site staff.",
    iconColor: "#ef4444",
  },
  {
    icon: "local_shipping",
    title: "Seamless Procurement",
    description:
      "Generate purchase orders managed directly by the Registrar for expanding active inventory loops.",
    iconColor: "#10b981",
  },
];

const FOOTER_LINKS = [
  { label: "Privacy Policy", href: "#" },
  { label: "Terms of Service", href: "#" },
  { label: "Contact Support", href: "#" },
  { label: "Documentation", href: "#" },
];

/**
 * Landing Page Component (Exact PR #5 Architecture)
 * LIFTED STATE: activeSection is shared by both Navbar and IntersectionObserver.
 */
export default function LandingPage() {
  const [activeSection, setActiveSection] = useState("dashboard");
  const observerRef = useRef(null);

  useEffect(() => {
    const sections = document.querySelectorAll("section[id]");

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveSection(entry.target.id);
          }
        });
      },
      { root: null, rootMargin: "-20% 0px -70% 0px", threshold: 0 }
    );

    sections.forEach((section) => observerRef.current.observe(section));

    return () => observerRef.current?.disconnect();
  }, []);

  const handleNavClick = (sectionId) => {
    setActiveSection(sectionId);
  };

  const handleExploreClick = () => {
    setActiveSection("departments");
    document.getElementById("departments")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="landing-body">
      <Navbar
        navLinks={NAV_LINKS}
        activeSection={activeSection}
        onNavClick={handleNavClick}
      />

      <main>
        <HeroSection
          tag="NEW: V2.0 RELEASE"
          title="Empower Your"
          titleHighlight="Enterprise"
          subtitle="A unified platform to orchestrate your global workforce. Manage departments, users, and organizational resources with unprecedented precision and real-time clarity."
          onExploreClick={handleExploreClick}
        />

        <PartnersSection
          title="Trusted By Global Enterprise Leaders"
          partners={PARTNERS}
        />

        <DepartmentsSection
          heading="Department Orchestration"
          subheading="Gain absolute visibility over every sector of your organization. Budgeting, hierarchies, and oversight simplified."
          cards={DEPARTMENT_CARDS}
        />

        <UsersSection
          heading="Role-Based Intelligence"
          subheading="Enterprise-grade security controls with custom authentication flows, specialized dashboards, and dynamic permissions."
          roles={USER_ROLES}
        />

        <ResourcesSection
          heading="Asset Lifecycle Management"
          subheading="From procurement to deployment to eventual scrapping, track the exact status and physical location of every enterprise asset."
          cards={RESOURCE_CARDS}
        />
      </main>

      <Footer footerLinks={FOOTER_LINKS} />
    </div>
  );
}
