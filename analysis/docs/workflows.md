# Sell.do Workflows, State Machines & Business Logic

## 1. Lead Lifecycle & Stage State Machine

The Sell.do lead qualification process operates on a strictly governed finite-state machine (FSM):

```
                        [Webform / Portal / Inbound Call / Manual Entry]
                                              |
                                              v
                                       +--------------+
                                       |   Incoming   |
                                       +--------------+
                                              |
                                              v (Contact established / Qualified)
                                       +--------------+
                               +-----> |   Prospect   | <-------------------------+
                               |       +--------------+                           |
                               |          /          \                            |
                               | (Unqualified)    (Opportunity / Commercial intent)
                               |        /              \                          |
                               v       v                v                         |
                    +---------------+              +-----------------+            |
                    |  Unqualified  |              |   Opportunity   |            |
                    +---------------+              | (Hot / Warm)    |            |
                                                   +-----------------+            |
                                                      /             \             |
                                              (Booking Done)     (Lost Deal)      |
                                                    /                 \           |
                                                   v                   v          |
                                            +--------------+    +---------------+ |
                                            |    Booked    |    |     Lost      | |
                                            +--------------+    +---------------+ |
                                                   |                    |         |
                                                   +--------------------+---------+
                                                     (Re-opened / Re-engaged)
```

### Transition Validation Rules:
1. **`Incoming` -> `Prospect`**:
   - Triggers when initial contact is made by Pre-Sales / Telecaller.
   - Requires valid contact details (Phone or Email).
2. **`Prospect` -> `Opportunity`**:
   - Can transition directly to `Opportunity` with sub-stage `hot` or `warm`.
   - Requires real estate requirement (BHK or Budget) and project association.
3. **`Prospect` -> `Unqualified`**:
   - Requires mandatory `UnqualifiedReason` (e.g., "Out of budget", "Location mismatch", "Wrong number", "Student / No income").
   - Can transition back to `Prospect` or `Incoming` upon re-engagement.
4. **`Opportunity` -> `Booked`**:
   - Requires unit selection, agreement value, applicant details, and booking token amount.
   - Automatically provisions a new `Booking` entity in Post-Sales.
5. **`Opportunity` -> `Lost`**:
   - Requires mandatory `LostReason` (e.g., "Bought competitor property", "Dropped plan", "Loan rejected").
   - Can be re-opened back to `Prospect` if prospect re-engages via campaign within attribution window.

---

## 2. Pre-Sales to Sales Handoff Workflow ("Push to Sales")

1. **Pre-Sales Phase (Telecalling & Lead Qualification)**:
   - Inbound call or digital lead enters Pre-Sales queue.
   - Telecaller conducts qualification calls, assesses budget, interest, and timeline.
   - Telecaller schedules a Site Visit or logs verbal agreement.
2. **Push to Sales Execution**:
   - Strategy: Defined in `client_configuration[pre_sales_configuration][push_lead_strategy]` ("team" or "round_robin").
   - Action: Pre-sales user clicks "Push to Sales" on Lead 360 profile.
   - Modal Form: Telecaller selects target project, target sales team/rep, and enters handoff summary.
   - Assignment: Lead `assignee_id` changes to the selected Sales executive (closing manager).
   - Activity: Automatically schedules a followup/site visit for the Sales rep.
   - Notification: Real-time Pusher notification + SMS/WhatsApp sent to both Sales rep and Customer.
3. **Pull to Sales Alternative**:
   - If `pull_to_sales` is enabled, Sales reps can browse an unassigned "Opportunity Pool" and claim leads meeting their criteria.

---

## 3. Site Visit Management Workflow

1. **Scheduling**:
   - Lead owner initiates Site Visit from Lead 360 or New Lead form.
   - Selects Project, Date, Time, Pick-up required (Cab service), and Attending Sales Executive.
   - Status set to `scheduled`.
   - Automated WhatsApp / SMS confirmation sent to Customer with Google Maps location pin and executive contact.
2. **Conduction**:
   - On scheduled day, customer arrives at site office.
   - Executive marks Site Visit as `conducted`.
   - Feedback Form triggered: Rating (1-5 stars), Comments, Customer Interest level (High, Medium, Low), Preferred Units/Towers.
   - Lead stage automatically advances (or remains in `Opportunity - Hot`).
3. **No-Show / Reschedule**:
   - If not conducted within window, status flips to `missed`.
   - System prompts automated reminder followup task for the rep to reschedule.

---

## 4. Telephony & Call Flow Architecture

1. **Inbound Call Routing**:
   - Caller dials Virtual DID Number (associated with specific Project / Campaign).
   - IVR Engine triggers: Welcome audio played.
   - Working Hours Check:
     - If after hours: Voicemail or next-day callback task generated.
     - If during hours: Route to Hunt Group based on Routing Rule (Round Robin across available agents).
   - Agent Phone rings: Agent answers via SIP / WebRTC / Mobile forwarding.
   - System auto-creates/matches `Lead` record based on caller CLI (Phone number).
   - Audio recorded and uploaded to CDN.
   - AI Speech Engine generates transcript and sentiment summary.
2. **Outbound Click-to-Call (C2C)**:
   - Agent clicks phone icon next to Lead in CRM.
   - Bridge initiates dual-leg call:
     - Leg 1: Calls Agent's mobile/VoIP.
     - Leg 2: Upon agent pickup, dials Customer via Virtual DID (Customer sees business number, agent personal number masked).
   - On completion, call disposition modal appears on agent screen: mandatory selection of Outcome ("Answered", "Busy", "Callback") and Followup scheduling.

---

## 5. Intelligent Routing & Distribution Engine

1. **Round Robin**:
   - Sequential distribution across active, logged-in team members.
2. **Capacity / Load Balancing**:
   - Assigns new leads to agents with the fewest active untouched leads.
3. **Project / Territory Specialization**:
   - Directs lead to agents assigned to the specific Project.
4. **Source Matching**:
   - Dedicated teams for Channel Partner leads vs Direct Digital Ad leads.
5. **Reassignment Escalation**:
   - If a lead remains "Untouched" (0 calls) for > 2 hours (or configured SLA), rule reassigns lead to team manager or next available rep.
