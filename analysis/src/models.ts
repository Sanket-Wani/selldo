/**
 * Sell.do System Models and Schemas
 * Reconstructed 1:1 Domain Model
 */

export type ObjectId = string;

export interface Client {
  id: ObjectId;
  name: string;
  broadlinePhone: string;
  supportEmail: string;
  currency: string;
  leadsBalance: number;
  accountBalance: number;
  features: ClientFeatures;
  configuration: ClientConfiguration;
}

export interface ClientFeatures {
  ipRestriction: boolean;
  allowedIps: string[];
  userAvailabilityControl: boolean;
}

export interface ClientConfiguration {
  hideInactiveUsers: boolean;
  enableInternationalCalling: boolean;
  allowDirectConductFollowup: boolean;
  regenerateCampaignResponsePeriodDays: number;
  sessionTimeoutHours: number;
  reassignLeadStrategy: 'team' | 'round_robin' | 'individual';
  allowedRolesForLeadReassignment: string[];
  enableCommunication: {
    mixpanel: boolean;
    sms: boolean;
    email: boolean;
    pusher: boolean;
    call: boolean;
    whatsapp: boolean;
    voipCall: boolean;
  };
  preSalesConfiguration: {
    enabled: boolean;
    pushLeadStrategy: 'team' | 'round_robin';
    autoForward: boolean;
    pullToSales: boolean;
    dispositionTimeoutSeconds: number;
  };
}

export interface User {
  id: ObjectId;
  clientId: ObjectId;
  salutation: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  virtualNumber: string;
  role: 'super_admin' | 'admin' | 'manager' | 'pre_sales' | 'sales' | 'post_sales';
  teamId: ObjectId;
  managerId?: ObjectId;
  status: 'active' | 'inactive' | 'suspended';
  isAvailableForCalls: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Team {
  id: ObjectId;
  clientId: ObjectId;
  name: string;
  type: 'sales' | 'pre_sales' | 'post_sales' | 'channel_partner';
  managerIds: ObjectId[];
  memberIds: ObjectId[];
  projectIds: ObjectId[];
  isActive: boolean;
}

export interface Lead {
  id: ObjectId;
  clientId: ObjectId;
  crmId: number;
  salutation?: string;
  firstName: string;
  lastName: string;
  primaryPhone: {
    type: 'work' | 'mobile' | 'home' | 'main' | 'whatsapp';
    number: string;
    isVerified: boolean;
  };
  secondaryPhones?: Array<{ type: string; number: string }>;
  primaryEmail?: {
    type: 'office' | 'personal';
    email: string;
  };
  secondaryEmails?: Array<{ type: string; email: string }>;
  timeZone: string;
  score: number;
  stage: LeadStage;
  subStage?: string;
  stageUpdatedAt: string;
  unqualifiedReasonId?: ObjectId;
  lostReasonId?: ObjectId;
  assigneeId: ObjectId;
  secondarySalesIds?: ObjectId[];
  teamId: ObjectId;
  channelPartnerId?: ObjectId;
  tags: string[];
  addresses?: Address[];
  demographics?: Demographics;
  requirement?: Requirement;
  customFields?: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

export type LeadStage =
  | 'incoming'
  | 'prospect'
  | 'opportunity'
  | 'booked'
  | 'unqualified'
  | 'lost'
  | 'first_visit_old'
  | 'second_visit_old'
  | 'first_visit'
  | 'second_visit';

export interface Address {
  type: 'home-address' | 'office-address';
  address1: string;
  address2?: string;
  city: string;
  state: string;
  country: string;
  zip: string;
}

export interface Demographics {
  age?: number;
  birthday?: string;
  gender?: 'male' | 'female' | 'other';
  married?: boolean;
  anniversary?: string;
  industry?: string;
  isNri?: boolean;
}

export interface Requirement {
  purpose: 'end_use' | 'investment';
  minBudget?: number;
  maxBudget?: number;
  minPossession?: string;
  maxPossession?: string;
  propertyTypes: string[];
  bhk: string[];
  bathrooms?: number;
  furnishing?: 'unfurnished' | 'semi_furnished' | 'fully_furnished';
  facing?: string;
  locations: string[];
  areaSqft?: number;
  fundingSource?: 'loan' | 'self_funding';
  transactionType?: 'new_booking' | 'resale';
}

export interface Project {
  id: ObjectId;
  clientId: ObjectId;
  name: string;
  reraId?: string;
  description: string;
  address: Address;
  virtualTourUrl?: string;
  brochureAssetId?: ObjectId;
  assignedSalesTeamIds: ObjectId[];
  notifyEmails: string[];
  isActive: boolean;
  portalIntegrations?: {
    magicbricksId?: string;
    ninetyNineAcresId?: string;
    housingId?: string;
  };
}

export interface ProjectUnit {
  id: ObjectId;
  projectId: ObjectId;
  tower: string;
  floor: number;
  unitNumber: string;
  bhk: string;
  carpetAreaSqft: number;
  saleableAreaSqft: number;
  basePrice: number;
  agreementValue: number;
  status: 'available' | 'blocked' | 'tentative_booked' | 'confirmed_booked' | 'sold';
  stage: 'plinth' | 'structure' | 'brickwork' | 'finishing' | 'ready_possession';
}

export interface Booking {
  id: ObjectId;
  clientId: ObjectId;
  leadId: ObjectId;
  projectId: ObjectId;
  projectUnitId: ObjectId;
  bookingCrmId: number;
  bookingName: string;
  applicantName: string;
  coApplicants?: Array<{ name: string; phone: string; email: string; pan?: string }>;
  stage: 'tentative' | 'confirmed' | 'cancelled';
  cancellationReasonId?: ObjectId;
  bookedBySalesId: ObjectId;
  agreementValue: number;
  bookingAmountPaid: number;
  bookedOn: string;
}

export interface Call {
  id: ObjectId;
  clientId: ObjectId;
  leadId: ObjectId;
  userId: ObjectId;
  direction: 'inbound' | 'outbound';
  virtualDid: string;
  customerNumber: string;
  agentNumber: string;
  status: 'answered' | 'not_answered' | 'busy' | 'failed' | 'missed';
  durationSeconds: number;
  recordingUrl?: string;
  aiSummary?: {
    transcript: string;
    sentiment: 'positive' | 'neutral' | 'negative';
    keyPoints: string[];
    actionItems: string[];
  };
  disposition?: string;
  initiatedAt: string;
}

export interface SiteVisit {
  id: ObjectId;
  clientId: ObjectId;
  leadId: ObjectId;
  projectId: ObjectId;
  initiatedByUserId: ObjectId;
  assignedSalesUserId: ObjectId;
  conductedByUserId?: ObjectId;
  status: 'scheduled' | 'conducted' | 'rescheduled' | 'cancelled' | 'missed';
  scheduledAt: string;
  conductedAt?: string;
  feedback?: {
    rating: number;
    comments: string;
    customerInterest: 'high' | 'medium' | 'low';
    preferredUnitIds: ObjectId[];
  };
}

export interface Followup {
  id: ObjectId;
  clientId: ObjectId;
  leadId: ObjectId;
  userId: ObjectId;
  type: 'call' | 'whatsapp' | 'email' | 'meeting' | 'site_visit_reminder';
  scheduledAt: string;
  status: 'pending' | 'completed' | 'missed' | 'cancelled';
  conductedAt?: string;
  remarks?: string;
}

export interface Task {
  id: ObjectId;
  clientId: ObjectId;
  leadId?: ObjectId;
  assignedToUserId: ObjectId;
  createdByUserId: ObjectId;
  title: string;
  description?: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'completed' | 'archived';
  dueAt: string;
  completedAt?: string;
}

export interface Recipe {
  id: ObjectId;
  clientId: ObjectId;
  title: string;
  description?: string;
  isActive: boolean;
  triggerEvent:
    | 'lead_created'
    | 'stage_changed'
    | 'call_missed'
    | 'site_visit_conducted'
    | 'form_submitted'
    | 'task_overdue';
  conditions: Array<{
    field: string;
    operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in';
    value: unknown;
  }>;
  actions: Array<{
    actionType: 'send_whatsapp' | 'assign_user' | 'send_email' | 'trigger_webhook' | 'add_tag' | 'create_task';
    parameters: Record<string, unknown>;
  }>;
  triggerCount: number;
  lastTriggeredAt?: string;
}

export interface CustomFieldDefinition {
  id: ObjectId;
  clientId: ObjectId;
  entityType: 'Client' | 'User' | 'Lead' | 'Project' | 'Call' | 'SiteVisit' | 'Followup' | 'Booking';
  fieldKey: string;
  label: string;
  dataType: 'string' | 'number' | 'boolean' | 'date' | 'select' | 'multiselect' | 'textarea';
  options?: string[];
  isRequired: boolean;
  isSearchable: boolean;
  isEditableByRoles: string[];
}

export interface BillingSubscription {
  planName: 'Platinum' | 'Gold' | 'Silver' | 'Custom';
  billingCycleEndDate: string;
  walletBalance: number;
  leadsBalance: number;
  totalLeadsQuota: number;
  aiCredits: number;
  callingAgentCredits: number;
  seats: {
    salesPresalesLeadSubscribed: number;
    salesPresalesLeadConsumed: number;
    adminSubscribed: number;
    adminConsumed: number;
    marketingUserSubscribed: number;
    marketingUserConsumed: number;
    postSalesLeadSubscribed: number;
    postSalesLeadConsumed: number;
  };
  telephony: {
    userChannelsSubscribed: number;
    userChannelsConsumed: number;
    virtualNumbersSubscribed: number;
    virtualNumbersConsumed: number;
    mobileLicensesSubscribed: number;
    mobileLicensesConsumed: number;
    internationalPriSubscribed: number;
    internationalPriConsumed: number;
  };
}

export interface BulkUploadJob {
  id: ObjectId;
  clientId: ObjectId;
  type: 'bulk_leads' | 'bulk_site_visits' | 'bulk_followups' | 'bulk_vn_tags' | 'reassign_lead_by_selection';
  status: 'Pending' | 'Processing' | 'Completed' | 'Failed';
  startedAt?: string;
  completedAt?: string;
  initiatedByUserId: ObjectId;
  assignedToUserIds: ObjectId[];
  totalRecordsCount: number;
  uploadedRecordsCount: number;
  existingRecordsCount: number;
  errorRecordsCount: number;
  sourceCampaignId?: ObjectId;
  inputFileUrl: string;
  outputFileUrl?: string;
  errorFileUrl?: string;
  allowReengagement: boolean;
}

export interface MetaConversionApiConfig {
  metaPixelId: string;
  metaAccessToken: string;
  isActive: boolean;
  eventMappings: Array<{
    crmEvent: 'Lead' | 'QualifiedLead' | 'ScheduleSiteVisit' | 'CompleteRegistration' | 'Purchase';
    metaStandardEvent: string;
  }>;
}

export interface GoogleConversionApiConfig {
  oauthClientId: string;
  oauthClientSecret: string;
  isConnected: boolean;
  googleAdsCustomerId: string;
  managerMccCustomerId?: string;
}

export interface DltComplianceDetails {
  dltEntityId: string;
  telemarketerId?: string;
  transactionalSmsMasks: string[];
  promotionalSmsMasks: string[];
}

export interface WhatsAppTemplate {
  id: ObjectId;
  accountName: string;
  entityType: 'Lead' | 'Booking';
  templateName: string;
  category: 'MARKETING' | 'UTILITY' | 'AUTHENTICATION';
  language: string;
  headerType: 'NONE' | 'TEXT' | 'IMAGE' | 'VIDEO' | 'DOCUMENT';
  aiEnabled: boolean;
  content: string;
  footer?: string;
  buttons: Array<{
    type: 'QUICK_REPLY' | 'PHONE_NUMBER' | 'URL' | 'FLOW';
    text: string;
    value?: string;
    flowId?: ObjectId;
  }>;
  status: 'DRAFT' | 'PENDING_APPROVAL' | 'APPROVED' | 'REJECTED';
  evaluationScore?: number;
}

export interface WhatsAppFlowScreen {
  screenId: string;
  title: string;
  isTerminal: boolean;
  components: Array<{
    type:
      | 'Heading'
      | 'Subheading'
      | 'Text'
      | 'Caption'
      | 'TextInput'
      | 'TextArea'
      | 'RadioButtons'
      | 'Checkboxes'
      | 'Dropdown'
      | 'DatePicker'
      | 'Calendar'
      | 'OptIn'
      | 'Multiselect'
      | 'PhotoUpload'
      | 'DocUpload'
      | 'RichText'
      | 'Link'
      | 'Image'
      | 'Carousel'
      | 'NavList'
      | 'FooterButton';
    label: string;
    name?: string;
    required?: boolean;
    options?: Array<{ id: string; title: string }>;
    action?: 'navigate' | 'complete' | 'data_exchange';
    targetScreenId?: string;
  }>;
}

export interface WhatsAppFlow {
  id: ObjectId;
  flowName: string;
  screens: WhatsAppFlowScreen[];
  metaFlowId?: string;
  status: 'DRAFT' | 'PUBLISHED' | 'DEPRECATED';
  version: string;
}

export interface CampaignTarget {
  id: ObjectId;
  name: string;
  description?: string;
  metric:
    | 'total_leads'
    | 'new_leads'
    | 're_engaged_leads'
    | 'cost_per_lead'
    | 'sale_value'
    | 'total_enquiries'
    | 'cost_per_qualified_lead'
    | 'cost_per_booking'
    | 'meetings'
    | 'qualified'
    | 'closure'
    | 'cost_per_meeting_scheduled'
    | 'cost_per_meeting_conducted';
  frequency: 'Lifetime' | 'Monthly' | 'Quarterly';
  targetValue: number;
  campaignId?: ObjectId;
  targetType: 'Source' | 'Campaign' | 'Publisher';
}

export interface RoiConfiguration {
  id: ObjectId;
  name: string;
  fromDate: string;
  toDate: string;
  spendTotal: number;
  channelSource: string;
  channelSubSource?: string;
  campaignId?: ObjectId;
  createdBy: ObjectId;
}

export interface CustomReportDefinition {
  id: ObjectId;
  reportName: string;
  description?: string;
  reportType: 'One Dimensional' | 'Multi Dimensional';
  entityType: 'Lead' | 'Site Visit' | 'Booking Detail' | 'Project Unit' | 'Call' | 'Followup';
  chartType: 'Table' | 'Bar' | 'Line' | 'Pie' | 'Funnel';
  dateFilterField: string;
  dateRangePreset: 'Current Month' | 'Last Month' | 'This Quarter' | 'Custom';
  startDate?: string;
  endDate?: string;
  dimensions: string[];
  metrics: string[];
  filters: Array<{
    field: string;
    operator: string;
    value: unknown;
  }>;
}

