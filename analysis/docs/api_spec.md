# Sell.do API & Network Architecture Specification

## Authentication & Session Security
- **Protocol**: HTTPS / REST
- **Session Mechanism**: Cookie-based session (`_selldo_session`) with CSRF token validation (`authenticity_token`).
- **Authorization**: Role-Based Access Control (RBAC) checked at controller filter level (`before_action :authenticate_user!`, `before_action :authorize_client!`).
- **IP Protection**: Whitelisted CIDR range enforcement if `ip_restriction` is active.

---

## Key Endpoints & Routes Inventory

### 1. Authentication
- `POST /users/login`: Authenticate user credentials.
- `GET /users/logout`: Destroy user session.
- `GET /users/password/new`: Request password reset instructions.
- `GET /users/unlock/new`: Request account unlock instructions.

### 2. Dashboards & Analytics APIs
- `GET /client/v2/custom-dashboards`: Fetch dashboard layout and widget metrics.
- `GET /client/v2/cp-dashboard`: Fetch Channel Partner summary and conversion statistics.
- `GET /client/reports/{report_type}`: Query reporting datasets with aggregate filters:
  - `lead_stage_dist`
  - `lead_funnel`
  - `lead_unqualified_reasons`
  - `lead_lost_reasons`
  - `touched_untouched`
  - `sitevisits_by_sales`
  - `campaign_roi`

### 3. Lead Management APIs
- `GET /client/0/{filter_id}/filters`: Fetch paginated list of leads with filter criteria.
  - Query Params: `page`, `per_page`, `sort_by`, `date_range[actual]`, `stage`, `project_id`, `sales_id`, `source`.
- `GET /client/0/{filter_id}/{lead_id}/f/{tab}`: Fetch Lead 360 profile and active tab view (`AddNote`, `Calls`, `SiteVisits`, `Followups`).
- `POST /client/0/{filter_id}/NewLead`: Create new lead record with requirement, source, and assignee attributes.
- `PUT /client/leads/{lead_id}`: Update lead attributes.
- `POST /client/leads/{lead_id}/stage_change`: Advance or update lead stage and sub-stage.
- `POST /client/leads/{lead_id}/reassign`: Reassign lead to another user or team.
- `POST /client/leads/bulk_actions`: Batch operations (Bulk Reassign, Bulk Stage Change, Bulk WhatsApp, Bulk Delete).
- `GET /client/lead_search_dashboard`: Search leads by Phone, Email, CRM ID, or Name.

### 4. Telephony & Activities APIs
- `GET /client/0/calls/inbound`: Paginated list of inbound calls with audio URLs and metadata.
- `POST /client/calls/click_to_call`: Trigger outbound dual-leg call bridge.
- `POST /client/calls/{call_id}/disposition`: Save call outcome, notes, and next followup.
- `GET /client/0/site_visits/all`: List scheduled and conducted site visits.
- `POST /client/site_visits`: Schedule new site visit.
- `PUT /client/site_visits/{site_visit_id}/conduct`: Mark site visit as conducted and submit feedback.
- `GET /client/0/followups/all`: Query agent followup tasks.
- `POST /client/followups`: Create followup reminder.
- `PUT /client/followups/{followup_id}/complete`: Complete followup.
- `GET /client/0/tasks/all`: List user tasks.
- `POST /client/0/task/NewTask`: Create user task.

### 5. WhatsApp & Omnichannel APIs
- `GET /client/whatsapp-conversations`: List active chat threads.
- `GET /client/whatsapp-conversations/{conversation_id}/messages`: Fetch chat history.
- `POST /client/whatsapp-conversations/{conversation_id}/send`: Send message or template.
- `GET /client/whatsapp-templates`: List approved WhatsApp message templates.
- `POST /client/whatsapp-broadcasts`: Schedule bulk WhatsApp campaign.

### 6. Post-Sales & Bookings APIs
- `GET /client/post_sales/{filter_id}`: Query bookings list.
- `POST /client/bookings`: Provision new booking record from qualified lead.
- `PUT /client/bookings/{booking_id}`: Update applicant, agreement value, payment milestone details.
- `POST /client/bookings/{booking_id}/cancel`: Cancel booking with reason ID.

### 7. Products & Inventory APIs
- `GET /client/projects`: List active projects.
- `GET /client/projects/{project_id}/about`: Fetch project profile and configuration.
- `POST /client/projects`: Create project.
- `GET /client/projects/{project_id}/units`: Inventory grid with unit status (Available, Booked, Sold).
- `PUT /client/projects/{project_id}/units/{unit_id}/block`: Temporarily block inventory unit.

### 8. Administration & Settings APIs
- `GET /client/dashboard/users`: User management list and filter.
- `POST /client/users`: Provision user, set role, virtual number, and team.
- `GET /client/teams`: List teams and manager hierarchy.
- `GET /client/configuration?type={config_type}`: Read configuration settings (`lead_form`, `lead_access`, `activity`, `other`, `features`).
- `PUT /client/configuration`: Update configuration parameters.
- `GET /client/dashboard/custom_fields`: List dynamic fields by entity.
- `POST /client/custom_fields`: Define new custom field.

### 9. Billing, Invoices & Quota APIs
- `GET /client/dashboard/billing`: Retrieve current subscription tier, balance, lead quotas, and seat allocations.
- `GET /client/invoices/{invoice_id}`: View invoice details, breakdown of CGST/SGST taxes, and payments.
- `POST /client/dashboard/billing/add_balance`: Credit top-up gateway integration.

### 10. Bulk Operations & Asynchronous Jobs APIs
- `POST /client/bulk_uploads/leads`: Upload multipart Excel/CSV file with column mapping configuration.
- `POST /client/bulk_uploads/{domain}`: Upload bulk site visits, followups, or VN tags.
- `GET /client/bulk_jobs`: List asynchronous jobs, execution status, duration, and download links.
- `POST /client/reassign_leads_form`: Bulk reassign selected leads with strategy and audit reason.

### 11. Universal Export & Job Schedule APIs
- `GET /client/export/export_types`: List all 26 supported export data categories.
- `POST /client/export/check_user_access/{domain}`: Initiate background export generation.
- `GET /client/export`: Audit log of all completed export jobs with presigned S3 URLs (48-hr TTL).
- `GET /client/job_schedules`: List and configure automated recurring export schedules.

### 12. Omnichannel Ad Networks & Conversion APIs
- `GET /client/settings/meta_conversion_api`: Fetch Meta Pixel ID and status.
- `POST /client/settings/meta_conversion_api`: Save Meta Pixel ID and Long-Lived System User Access Token.
- `GET /client/settings/google_conversion_api`: Fetch Google Offline Conversion status.
- `POST /client/settings/google_conversion_api`: Save Google OAuth Client credentials and Customer ID.

### 13. Interactive WhatsApp Flow Studio APIs
- `GET /client/whatsapp-templates`: List Meta HSM templates.
- `POST /client/whatsapp-templates`: Submit new template with content, variables, and header.
- `POST /client/whatsapp-templates/evaluate`: AI evaluation scoring spam risk before Meta submission.
- `GET /client/whatsapp-flows`: List published and draft Meta interactive flows.
- `POST /client/whatsapp-flows/builder`: Save multi-screen flow JSON schema.

### 14. Campaign Targets & Marketing Spend ROI APIs
- `GET /client/campaign_targets`: List KPI targets across campaigns and sources.
- `POST /client/campaign_targets`: Configure target metric, frequency, and threshold.
- `GET /client/roi_configs`: List channel spend allocations.
- `POST /client/roi_configs`: Log offline/online marketing expenditure for accurate CPL calculation.

### 15. Custom OLAP Reports APIs
- `GET /client/reporting/custom-reports`: List saved one-dimensional and multi-dimensional reports.
- `POST /client/reporting/custom-reports`: Create custom report definition with dimensions, metrics, and filters.
- `POST /client/reporting/custom-reports/{id}/preview`: Execute real-time OLAP aggregation query.

---

## Real-Time WebSocket Architecture (Pusher)
- Channels:
  - `private-client-{client_id}`: Organizational broadcast events.
  - `private-user-{user_id}`: Personal agent notifications (incoming call popup, new lead assigned, followup reminder, WhatsApp message received).
- Events:
  - `lead:created`
  - `lead:assigned`
  - `call:ringing`
  - `call:ended`
  - `site_visit:scheduled`
  - `whatsapp:message_received`

