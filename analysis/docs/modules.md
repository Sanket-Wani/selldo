# Sell.do System Architecture & Module Decomposition

## Overview
Sell.do is an enterprise end-to-end Real Estate CRM and Marketing Automation platform designed specifically for real estate developers, builders, and channel partners. It unifies marketing campaign tracking, telephony/IVR, lead qualification, sales execution, site visit management, inventory booking, and post-sales workflows into a single system.

## Primary Modules & Submodules

### 1. Executive Dashboards & Analytics
- **System Default Dashboard (`/client/v2/custom-dashboards`)**:
  - Key Performance Indicators (KPIs): Total Leads, Reengaged Leads, New Enquiries, NFA (No Follow-up Action), Missed Calls, Missed Followups.
  - Multi-dimensional Filtering: Date Range, Project, Enquired Project, Campaign, Source, Sub-Source.
  - Visual Widgets:
    - Lead Stage Distribution by Interested Project.
    - MTD Site Visits by Project (Conducted vs Scheduled).
    - MTD Site Visits by Sales Representative.
    - MTD Bookings by Project (Agreement Value, Saleable Area, Units).
    - MTD Bookings by Sales Representative.
- **Channel Partner Dashboard (`/client/v2/cp-dashboard`)**:
  - Broker/CP Lead to Booking conversion pipeline.
  - Quick Summary metrics: Total Leads, Conducted Visits, Total Bookings, Cumulative Agreement Value.
  - Lead Breakdown by Stage, Source, and Project.
- **Reporting Engine (`/client/reporting/custom-reports` & `/client/reports/*`)**:
  - Pipeline Analysis: Lead Stage Distribution, Lead Funnel, Unqualified Reasons, Lost Reasons, Touched vs Untouched analysis.
  - Sales Performance: Leads vs Sales Rep, Site Visits by Sales, Followups by Sales, Bookings Done, Reassignments, Untouched Attempts, Agent Roster Logs.
  - Marketing ROI: Campaign ROI, Site Visits by Campaign, Re-engaged Leads, Lead Geolocation Analysis.
  - Call Reports: Inbound/Outbound Telephony statistics, Talktime, Answer rate.

### 2. Lead Management & 360 CRM (`/client/0/*`)
- **Smart Filters & Buckets**:
  - Standard Views: All Leads, New Enquiries, Missed Calls, Untouched Leads (1, 2, 3+ attempts), Call Later, Reassigned To Me, Missed Followups, Unread Emails, Scheduled Followups, Scheduled Site Visits, Reengaged Leads, NRI Leads.
  - Priority Buckets: Hot Leads, Warm Leads, Recently Contacted.
  - Lifecycle Stages: Incoming, Prospect, Opportunity (Hot, Warm), Booked, Lost, Unqualified.
  - Custom Pipeline Stages: First Visit Old, Second Visit Old, 1st Visit, 2nd Visit.
- **Lead 360 Profile View (`/client/0/{filterId}/{leadId}/f/*`)**:
  - Header: Lead CRM ID, Name, Phone, Email, Assignee, Team, Rating Score, Stage Pill, Secondary Sales Access.
  - Action Bar: Direct Telephony Call, WhatsApp Message, Add Note, Schedule Followup, Schedule Site Visit, Push to Sales, Change Stage, Reassign, Price Quote Generation.
  - Activity Feeds & Tabs:
    - Activity Feed (Chronological events log).
    - Notes (Rich text collaboration).
    - Calls (Call records, audio playback, AI sentiment & transcript).
    - Site Visits (Scheduled, Conducted, Visitor Feedback).
    - Followups (Pending, Conducted, Overdue).
    - WhatsApp Conversations (Two-way chat, templates).
    - Tasks (Reminders, assignments, priorities).
    - Documents & Quotations (Cost sheets, payment plans).
    - History & Audit Log (Field-level tracking).
- **Lead Creation Engine (`/client/0/{filterId}/NewLead`)**:
  - Comprehensive 94-field schema covering Contact, Demographics, Real Estate Requirements (BHK, Budget, Possession, Area, Facing), Source Attribution, Direct Site Visit Scheduling, and Channel Partner linking.

### 3. Communications & Telephony Engine
- **Telephony & Virtual Numbers (`/client/campaigns/numbers` & `/client/dashboard/telephony_settings`)**:
  - Dynamic DID Number Pool management.
  - IVR Menus, Working Hours, Welcome Audio, Agent Hunt Groups (Round Robin, Simultaneous Ring).
  - Outbound Click-to-Call with agent number masking.
  - Call Recording storage, streaming, and AI Speech-to-Text evaluation.
- **WhatsApp Cloud API Integration (`/client/whatsapp-conversations`)**:
  - Two-way agent-prospect chat interface.
  - Meta-approved Business WhatsApp Templates.
  - Automated WhatsApp Flows and bulk Broadcasts.
- **Task Management (`/client/0/tasks/*`)**:
  - Open, Completed, Archived task queues.
  - Due dates, priority levels (High, Medium, Low), task assignees.

### 4. Post-Sales & Booking Engine (`/client/post_sales/*`)
- **Booking Management**:
  - Stages: Tentative Booking, Confirmed Booking, Cancelled Booking.
  - Data points: Booking Name, Applicant Details, Co-applicant, Unit Number, Tower, Floor, Carpet Area, Saleable Area, Agreement Value, Booking Amount.
  - Payment Milestones & Demand Letters generation.
  - Cancellation tracking with mandatory reason recording.

### 5. Product & Inventory Management (`/client/dashboard/products` & `/client/projects`)
- **Project Structure Hierarchy**:
  - Client Account -> Projects -> Towers / Phases -> Wings -> Floors -> Units / Configurations.
- **Project Details**:
  - Project Profile: Name, Description, Media gallery, RERA ID, Assigned Sales Teams, Notification emails.
  - Location: Coordinates, Map pin, Micro-market, City.
  - Virtual Assets: 3D Walkthrough embeds, Video tours, Digital brochures.
  - Unit Inventory Matrix: Available, Blocked, Booked, Sold units with live status synchronization.
  - Real Estate Portals Integration: Bi-directional feed sync with Magicbricks, 99acres, Housing.com.

### 6. Marketing Automation & Lead Ingestion
- **Recipes & Workflows (`/client/recipes`)**:
  - Event-driven automation: Triggers (Lead Created, Stage Changed, Site Visit Conducted, Call Missed) -> Conditions (Project, Budget, Source, Assignee) -> Actions (Send WhatsApp, Assign Rep, Send Email, Push Webhook, Add Tag).
- **Lead Nurturing & Drip Campaigns**:
  - Multi-step drip sequences across SMS, Email, and WhatsApp.
- **Lead Capture Forms (Webforms) (`/client/webforms`)**:
  - Embedded and hosted form builder with automatic campaign attribution.
- **Lead Scoring Engine**:
  - Dynamic score computation based on interactions, email opens, call durations, and website visits.
- **Third-Party Integrations**:
  - Facebook/Meta Lead Ads webhook synchronization.
  - Google Ads lead form webhooks.
  - Webhooks dispatch system with retry and failure audit logs.

### 7. Governance, Administration & Settings (`/client/dashboard/settings`)
- **User & Hierarchy Management (`/client/dashboard/users`)**:
  - Roles: Super Admin, Admin, Manager, Pre-Sales (Telecaller), Sales (Closing Manager).
  - Multi-level Team structure with reporting hierarchy.
  - Agent Attendance, Working shifts, and Call Availability toggle.
- **Lead Pipeline Customization**:
  - State machine transition rules.
  - Mandatory field validations per stage.
  - Lost and Unqualified reason taxonomy.
- **Custom Field Engine (`/client/dashboard/custom_fields`)**:
  - Dynamic user-defined fields across 8 core entities: Client, User, Lead, Project, Call, Site Visit, Followup, Booking.
- **Routing Rules Engine (`/client/dashboard/routing_setup`)**:
  - Configurable routing policies: Round Robin, Capacity-weighted, Territory/Project matching, Source-based routing.
- **Lead Access Control & Privacy**:
  - Team-based segregation, phone number masking, role-based export permissions.

### 8. Billing, License & Telephony Credit Management (`/client/dashboard/billing`)
- **Subscription Tiering**:
  - Plan levels (e.g., Platinum Tier) with contract renewal and billing cycle tracking.
  - Wallet balance accounting with live negative balance overdraft protection (`Balance: ₹ -2639.74`).
- **Quota Accounting & Metering**:
  - Lead Ingestion Quota: Active consumption tracking (e.g., `8,165 / 50,000` remaining).
  - AI Model Credits: Credit ledger for automated transcription and AI enrichment (`500.0` credits).
  - Calling Agent Credits: Usage ledger for autonomous outbound conversational AI agents.
- **Seat Licensing Architecture**:
  - Pre-Sales / Sales Leads (SL/PSL).
  - System Administrators (Admin).
  - Marketing Users (MU).
  - Post-Sales Leads (POSL).
- **Telephony Resource Allocation**:
  - Virtual Numbers Subscribed (VNS), User Channels (UC), Mobile licenses (MBL), and International PRIs (INTNL).
  - Invoice generation, tax breakdown (CGST/SGST), payment history, and automated billing receipts.

### 9. Bulk Data Operations & Asynchronous Job Architecture
- **Bulk Data Ingestion (`/client/dashboard/import` & `/client/bulk_uploads/*`)**:
  - Domains: Bulk Leads, Bulk Site Visits, Bulk Followups, Virtual Number Tags.
  - Batching: Up to 10,000 records per upload batch in XLS (Excel 97-2003) or CSV format.
  - Interactive Schema Mapping: Maps arbitrary spreadsheet headers to 94 internal lead attributes.
  - Verification: Auto-validation of E.164 phone numbers with country codes (`+91...`).
- **Universal Data Export Engine (`/client/export/export_types`)**:
  - 26 Dedicated Export Domains: Leads, Lead Analytics, Users, User Logs, Tasks, Virtual Numbers, Bookings, Campaigns, Invoices, Calls, Site Visits, Followups, SMS, Emails, Partners, Projects, Templates, Routing Rules, Brokerage Invoices, Booking Receipts, Demand Letters, Marketing Leads, WhatsApp Chats, and Export History.
  - Export Job Scheduler (`/client/job_schedules`): Cron-like automated daily/weekly CSV exports to S3/DigitalOcean Spaces.
- **Asynchronous Bulk Job Tracker (`/client/bulk_jobs`)**:
  - Asynchronous background worker orchestration (Sidekiq/DelayedJob).
  - Job execution status: `Pending`, `Running`, `Completed`, `Failed` with error CSV logs.
  - Output files with secure time-limited presigned URLs (48-hour expiration).

### 10. Omnichannel Ad Networks & Conversion APIs (CAPI)
- **Meta Conversions API (CAPI) (`/client/settings/meta_conversion_api`)**:
  - Direct server-side integration sending CRM events (`Lead Qualified`, `Site Visit Conducted`, `Unit Booked`) back to Facebook Business Manager.
  - Credentials: Meta Pixel ID and Long-Lived System User Access Token.
- **Google Offline Conversion API (`/client/settings/google_conversion_api`)**:
  - OAuth 2.0 Client credentials (Client ID, Secret, Refresh Token) with Google Cloud Console.
  - Customer ID & Manager (MCC) ID configuration for uploading offline conversion metrics to optimize Google Ads bidding.
- **TRAI DLT Compliance & SMS Gateways (`/client/edit` & `/client/settings/sms`)**:
  - India Telecom Regulatory Authority (TRAI) Distributed Ledger Technology (DLT) Entity ID and Telemarketer ID enforcement.
  - Separation of Transactional SMS Masks (6-character alphabetic) from Promotional SMS Masks.

### 11. Visual WhatsApp Flow Builder & Template Studio
- **Business WhatsApp Templates (`/client/whatsapp-templates`)**:
  - Meta-compliant HSM templates across Marketing, Utility, and Authentication categories.
  - Variable interpolation (`{{1}}`, `{{customer_name}}`), media header types (Image, Video, Document), and Interactive CTAs.
  - Built-in AI Evaluation engine assessing template spam probability before submission to Meta.
- **Visual WhatsApp Flow Studio (`/client/whatsapp-flows/builder`)**:
  - Drag-and-drop conversational screen builder generating Meta Flows v3/v4 JSON specs.
  - Component Palette: Headings, Subheadings, Body Text, Captions, Text Inputs, Text Areas, Radio Buttons, Checkboxes, Dropdowns, Date Pickers, Inline Calendars, Opt-In check, Multi-select, Photo Upload, Document Upload, Rich Text, Links, Media Carousel, Nav Lists, and Footer Buttons.

### 12. Campaign Targets & Financial ROI Attribution
- **Target Tracking Matrix (`/client/campaign_targets`)**:
  - Target tracking across 13 KPIs: Total Leads, New Leads, Re-engaged Leads, Cost Per Lead (CPL), Sale Value, Total Enquiries, Cost Per Qualified Lead (CPQL), Cost Per Booking (CPB), Meetings Scheduled, Meetings Conducted, Closures, Cost Per Meeting Scheduled, and Cost Per Meeting Conducted.
- **Financial Spend Ledger (`/client/roi_configs`)**:
  - Manual & API-driven marketing spend recording by channel, sub-source, and date interval.
  - Dynamic derivation of blended and channel-specific Cost Per Lead and Cost Per Acquisition.

### 13. Enterprise Custom Reporting Engine (`/client/reporting/custom-reports`)
- **OLAP Matrix Builder**:
  - Multi-Dimensional and One-Dimensional tabular & graphical reporting.
  - Cross-Entity Aggregations: `Lead`, `Site Visit`, `Booking Detail`, `Project Unit`, `Call`, `Followup`.
  - Visualizations: Table, Bar Chart, Line Graph, Pie Chart, Conversion Funnel.
  - Dynamic Groupings & Drag-and-Drop Dimensions (Project, Sales Rep, Source, Campaign, Sub-source, Date Intervals).
  - Computed Aggregates: Record Counts, Sum of Agreement Values, Average Talk Times, Site Visit to Booking Conversion Rates.
