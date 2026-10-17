# Sell.do Domain Entities & Data Model Specification

## Entity Relational & Document Schema

Sell.do utilizes MongoDB with Ruby on Rails Mongoid ODM, leveraging 24-character hexadecimal `BSON::ObjectId` identifiers. Below is the comprehensive domain model specification.

### 1. `Client` (Account / Developer Tenant)
- `_id`: ObjectId
- `name`: String (e.g., "Vishal Chugera Properties pvt ltd")
- `broadline_phone`: String (e.g., "+918069150607")
- `support_email`: String
- `currency`: String (default: "INR", symbol: "₹")
- `leads_balance`: Integer (e.g., 8174)
- `account_balance`: Decimal (e.g., -2638.14)
- `features_enabled`: Embedded Document
  - `ip_restriction`: Boolean
  - `allowed_ips`: Array<String>
  - `user_availability_control`: Boolean
- `configuration`: Embedded Document
  - `hide_inactive_users`: Boolean
  - `enable_international_calling`: Boolean
  - `allow_direct_conduct_followup`: Boolean
  - `regenerate_campaign_response_period_days`: Integer (default: 1)
  - `session_timeout_hours`: Integer (default: 23)
  - `reassign_lead_strategy`: String ("team" | "round_robin" | "individual")
  - `allowed_roles_for_lead_reassignment`: Array<String>
  - `enable_communication`: Embedded Document
    - `mixpanel`: Boolean
    - `sms`: Boolean
    - `email`: Boolean
    - `pusher`: Boolean
    - `call`: Boolean
    - `whatsapp`: Boolean
    - `voip_call`: Boolean
  - `pre_sales_configuration`: Embedded Document
    - `enabled`: Boolean
    - `push_lead_strategy`: String ("team" | "round_robin")
    - `auto_forward`: Boolean
    - `pull_to_sales`: Boolean
    - `disposition_timeout_seconds`: Integer (default: 30)

### 2. `User` (Agent / Manager / Admin)
- `_id`: ObjectId
- `client_id`: ObjectId (Foreign Key -> Client)
- `salutation`: String
- `first_name`: String
- `last_name`: String
- `email`: String (Unique, Indexed)
- `phone`: String
- `virtual_number`: String (Telephony agent extension)
- `role`: Enum ("super_admin", "admin", "manager", "pre_sales", "sales", "post_sales")
- `team_id`: ObjectId (Foreign Key -> Team)
- `manager_id`: ObjectId (Foreign Key -> User, Hierarchical Reporting)
- `status`: Enum ("active", "inactive", "suspended")
- `is_available_for_calls`: Boolean
- `shift_timings`: Embedded Document (start_time, end_time, days_active)
- `created_at`: DateTime
- `updated_at`: DateTime

### 3. `Team`
- `_id`: ObjectId
- `client_id`: ObjectId (Foreign Key -> Client)
- `name`: String (e.g., "Sales Team", "Pre-Sales Team", "Digital Inbound")
- `type`: Enum ("sales", "pre_sales", "post_sales", "channel_partner")
- `manager_ids`: Array<ObjectId> (Foreign Key -> User)
- `member_ids`: Array<ObjectId> (Foreign Key -> User)
- `project_ids`: Array<ObjectId> (Foreign Key -> Project)
- `is_active`: Boolean

### 4. `Lead` (Core CRM Entity)
- `_id`: ObjectId
- `client_id`: ObjectId (Foreign Key -> Client)
- `crm_id`: Integer (Auto-increment display sequence, e.g., 88898)
- `salutation`: String ("Mr.", "Mrs.", "Ms.", "Dr.", "Prof.")
- `first_name`: String
- `last_name`: String
- `primary_phone`: Embedded Document
  - `type`: Enum ("work", "mobile", "home", "main", "work-fax", "home-fax", "other", "personal", "whatsapp")
  - `number`: String (Indexed)
  - `is_verified`: Boolean
- `secondary_phones`: Array<Embedded Document (type, number)>
- `primary_email`: Embedded Document
  - `type`: Enum ("office", "personal")
  - `email`: String (Indexed)
- `secondary_emails`: Array<Embedded Document (type, email)>
- `time_zone`: String (e.g., "Asia/Kolkata")
- `score`: Integer (Dynamic Lead Rating, e.g., 13)
- `stage`: Enum ("incoming", "prospect", "opportunity", "booked", "unqualified", "lost", "first_visit_old", "second_visit_old", "first_visit", "second_visit")
- `sub_stage`: String (e.g., "hot", "warm", "cold")
- `stage_updated_at`: DateTime
- `unqualified_reason_id`: ObjectId (Foreign Key -> UnqualifiedReason)
- `lost_reason_id`: ObjectId (Foreign Key -> LostReason)
- `assignee_id`: ObjectId (Foreign Key -> User - Primary Sales/Pre-Sales Owner)
- `secondary_sales_ids`: Array<ObjectId> (Foreign Key -> User - Shared Access)
- `team_id`: ObjectId (Foreign Key -> Team)
- `channel_partner_id`: ObjectId (Foreign Key -> ChannelPartner)
- `tags`: Array<String> (e.g., ["organic", "manual_entry", "fb_leadgen"])
- `addresses`: Array<Embedded Document>
  - `type`: Enum ("home-address", "office-address")
  - `address1`: String
  - `address2`: String
  - `city`: String
  - `state`: String
  - `country`: String
  - `zip`: String
- `demographics`: Embedded Document
  - `age`: Integer
  - `birthday`: Date
  - `gender`: Enum ("male", "female", "other")
  - `married`: Boolean
  - `anniversary`: Date
  - `industry`: String
  - `is_nri`: Boolean
- `custom_fields`: Map<String, Dynamic> (e.g., {"how_did_you_hear_about_us": "Newspaper"})
- `created_at`: DateTime
- `updated_at`: DateTime

### 5. `Requirement` (Embedded in Lead or 1-to-1 Association)
- `purpose`: Enum ("end_use", "investment")
- `min_budget`: Decimal
- `max_budget`: Decimal
- `min_possession`: Date
- `max_possession`: Date
- `property_types`: Array<String> ("apartment", "villa", "plot", "commercial")
- `bhk`: Array<String> ("1 BHK", "2 BHK", "3 BHK", "4+ BHK")
- `bathrooms`: Integer
- `furnishing`: Enum ("unfurnished", "semi_furnished", "fully_furnished")
- `facing`: Enum ("east", "west", "north", "south", "north_east")
- `locations`: Array<String>
- `area_sqft`: Decimal
- `funding_source`: Enum ("loan", "self_funding")
- `transaction_type`: Enum ("new_booking", "resale")

### 6. `CampaignResponse` (Attribution & Source Tracking)
- `_id`: ObjectId
- `lead_id`: ObjectId (Foreign Key -> Lead)
- `project_id`: ObjectId (Foreign Key -> Project)
- `campaign_id`: ObjectId (Foreign Key -> Campaign)
- `source`: String (e.g., "99acres", "broker", "fb", "google", "magicbricks", "just_dial", "hoarding")
- `sub_source`: String (e.g., "leadgen_1418584160194843", "facebook_feed")
- `utm_source`: String
- `utm_medium`: String
- `utm_campaign`: String
- `utm_content`: String
- `utm_term`: String
- `received_at`: DateTime

### 7. `Project` (Real Estate Development)
- `_id`: ObjectId
- `client_id`: ObjectId (Foreign Key -> Client)
- `name`: String (e.g., "Nivaan Meadows", "Nivaan Legacy")
- `rera_id`: String (e.g., "P52100028456")
- `description`: Text
- `address`: Embedded Document (lat, lng, address1, city, state, pincode)
- `virtual_tour_url`: String
- `brochure_asset_id`: ObjectId (Foreign Key -> Asset)
- `assigned_sales_team_ids`: Array<ObjectId> (Foreign Key -> Team)
- `notify_emails`: Array<String>
- `is_active`: Boolean
- `portal_integrations`: Embedded Document (magicbricks_id, 99acres_id, housing_id)

### 8. `ProjectUnit` (Inventory Item)
- `_id`: ObjectId
- `project_id`: ObjectId (Foreign Key -> Project)
- `tower`: String (e.g., "Tower A")
- `floor`: Integer
- `unit_number`: String (e.g., "A-502")
- `bhk`: String ("2 BHK")
- `carpet_area_sqft`: Decimal
- `saleable_area_sqft`: Decimal
- `base_price`: Decimal
- `agreement_value`: Decimal
- `status`: Enum ("available", "blocked", "tentative_booked", "confirmed_booked", "sold")
- `stage`: Enum ("plinth", "structure", "brickwork", "finishing", "ready_possession")

### 9. `Booking` (Post-Sales Record)
- `_id`: ObjectId
- `client_id`: ObjectId (Foreign Key -> Client)
- `lead_id`: ObjectId (Foreign Key -> Lead)
- `project_id`: ObjectId (Foreign Key -> Project)
- `project_unit_id`: ObjectId (Foreign Key -> ProjectUnit)
- `booking_crm_id`: Integer (e.g., # 17)
- `booking_name`: String
- `applicant_name`: String
- `co_applicants`: Array<Embedded Document (name, phone, email, pan)>
- `stage`: Enum ("tentative", "confirmed", "cancelled")
- `cancellation_reason_id`: ObjectId (Foreign Key -> CancellationReason)
- `booked_by_sales_id`: ObjectId (Foreign Key -> User)
- `agreement_value`: Decimal
- `booking_amount_paid`: Decimal
- `payment_schedule_id`: ObjectId
- `booked_on`: DateTime

### 10. `Call` (Telephony Activity)
- `_id`: ObjectId
- `client_id`: ObjectId (Foreign Key -> Client)
- `lead_id`: ObjectId (Foreign Key -> Lead)
- `user_id`: ObjectId (Foreign Key -> User - Caller / Receiver)
- `direction`: Enum ("inbound", "outbound")
- `virtual_did`: String (DID dialed or displayed)
- `customer_number`: String
- `agent_number`: String
- `status`: Enum ("answered", "not_answered", "busy", "failed", "missed")
- `duration_seconds`: Integer (Talktime)
- `recording_url`: String (Audio stream URL)
- `ai_summary`: Embedded Document (transcript, sentiment, key_points, action_items)
- `disposition`: String ("interested", "not_interested", "callback_requested", "wrong_number")
- `initiated_at`: DateTime

### 11. `SiteVisit` (Property Tour Activity)
- `_id`: ObjectId
- `client_id`: ObjectId (Foreign Key -> Client)
- `lead_id`: ObjectId (Foreign Key -> Lead)
- `project_id`: ObjectId (Foreign Key -> Project)
- `initiated_by_user_id`: ObjectId (Foreign Key -> User)
- `assigned_sales_user_id`: ObjectId (Foreign Key -> User)
- `conducted_by_user_id`: ObjectId (Foreign Key -> User)
- `status`: Enum ("scheduled", "conducted", "rescheduled", "cancelled", "missed")
- `scheduled_at`: DateTime
- `conducted_at`: DateTime
- `feedback`: Embedded Document
  - `rating`: Integer (1 to 5)
  - `comments`: Text
  - `customer_interest`: Enum ("high", "medium", "low")
  - `preferred_unit_ids`: Array<ObjectId>

### 12. `Followup` (Next Action Item)
- `_id`: ObjectId
- `client_id`: ObjectId (Foreign Key -> Client)
- `lead_id`: ObjectId (Foreign Key -> Lead)
- `user_id`: ObjectId (Foreign Key -> User)
- `type`: Enum ("call", "whatsapp", "email", "meeting", "site_visit_reminder")
- `scheduled_at`: DateTime
- `status`: Enum ("pending", "completed", "missed", "cancelled")
- `conducted_at`: DateTime
- `remarks`: Text

### 13. `Task`
- `_id`: ObjectId
- `client_id`: ObjectId (Foreign Key -> Client)
- `lead_id`: ObjectId (Optional Foreign Key -> Lead)
- `assigned_to_user_id`: ObjectId (Foreign Key -> User)
- `created_by_user_id`: ObjectId (Foreign Key -> User)
- `title`: String
- `description`: Text
- `priority`: Enum ("low", "medium", "high", "urgent")
- `status`: Enum ("open", "completed", "archived")
- `due_at`: DateTime
- `completed_at`: DateTime

### 14. `Recipe` (Automation Workflow)
- `_id`: ObjectId
- `client_id`: ObjectId (Foreign Key -> Client)
- `title`: String
- `description`: Text
- `is_active`: Boolean
- `trigger_event`: Enum ("lead_created", "stage_changed", "call_missed", "site_visit_conducted", "form_submitted", "task_overdue")
- `conditions`: Array<Embedded Document> (field, operator, value)
- `actions`: Array<Embedded Document> (action_type: "send_whatsapp", "assign_user", "send_email", "trigger_webhook", "add_tag", "create_task", parameters)
- `trigger_count`: Integer
- `last_triggered_at`: DateTime

### 15. `CustomFieldDefinition`
- `_id`: ObjectId
- `client_id`: ObjectId (Foreign Key -> Client)
- `entity_type`: Enum ("Client", "User", "Lead", "Project", "Call", "SiteVisit", "Followup", "Booking")
- `field_key`: String (e.g., "custom_how_did_you_hear_about_us")
- `label`: String ("How Did You Hear About Us")
- `data_type`: Enum ("string", "number", "boolean", "date", "select", "multiselect", "textarea")
- `options`: Array<String>
- `is_required`: Boolean
- `is_searchable`: Boolean
- `is_editable_by_roles`: Array<String>
