/**
 * Sell.do API Client & Controller Contracts
 */

import { Lead, Call, SiteVisit, Followup, Task, Booking, Project, User } from './models';

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  perPage: number;
  totalPages: number;
}

export interface LeadFilterParams {
  dateRangeActual?: string;
  stage?: string;
  projectId?: string;
  salesId?: string;
  source?: string;
  page?: number;
  perPage?: number;
}

export interface ILeadController {
  getLeads(filterId: string, params: LeadFilterParams): Promise<PaginatedResponse<Lead>>;
  getLeadById(leadId: string): Promise<Lead>;
  createLead(payload: Partial<Lead>): Promise<Lead>;
  updateLead(leadId: string, payload: Partial<Lead>): Promise<Lead>;
  reassignLead(leadId: string, targetUserId: string, reason: string): Promise<boolean>;
  changeStage(leadId: string, stage: string, reasonId?: string): Promise<boolean>;
}

export interface ITelephonyController {
  getInboundCalls(params: { page?: number; perPage?: number }): Promise<PaginatedResponse<Call>>;
  triggerClickToCall(leadId: string, agentUserId: string): Promise<{ callId: string; status: string }>;
  saveCallDisposition(callId: string, disposition: string, remarks?: string): Promise<boolean>;
}

export interface ISiteVisitController {
  getSiteVisits(params: { status?: string; projectId?: string }): Promise<PaginatedResponse<SiteVisit>>;
  scheduleSiteVisit(leadId: string, projectId: string, date: string, time: string, salesUserId: string): Promise<SiteVisit>;
  conductSiteVisit(visitId: string, feedback: { rating: number; comments: string; interest: string }): Promise<boolean>;
}

export interface IBookingController {
  getBookings(params: { stage?: string; projectId?: string }): Promise<PaginatedResponse<Booking>>;
  createBooking(payload: Partial<Booking>): Promise<Booking>;
  cancelBooking(bookingId: string, reasonId: string): Promise<boolean>;
}

export interface IProjectController {
  getProjects(params: { isActive?: boolean }): Promise<Project[]>;
  getProjectDetails(projectId: string): Promise<Project>;
}

export interface IBillingController {
  getBillingSummary(): Promise<{
    plan: string;
    balance: number;
    leadsRemaining: number;
    totalLeadsQuota: number;
    aiCredits: number;
    callingAgentCredits: number;
  }>;
  getInvoices(params: { page?: number; perPage?: number }): Promise<PaginatedResponse<unknown>>;
  downloadInvoice(invoiceId: string): Promise<{ downloadUrl: string }>;
}

export interface IBulkOperationsController {
  uploadBulkLeads(file: Blob, options: { sourceId?: string; campaignId?: string; allowReengage: boolean }): Promise<{ jobId: string }>;
  getBulkJobs(params: { page?: number; type?: string }): Promise<PaginatedResponse<unknown>>;
  triggerBulkReassign(leadIds: string[], targetUserId: string, reason: string): Promise<{ jobId: string }>;
}

export interface IExportController {
  getExportTypes(): Promise<Array<{ domain: string; name: string; description: string; endpoint: string }>>;
  requestDomainExport(domain: string, filters: Record<string, unknown>): Promise<{ exportJobId: string; status: string }>;
  getExportHistory(params: { page?: number }): Promise<PaginatedResponse<unknown>>;
}

export interface IWhatsAppController {
  getTemplates(params: { status?: string }): Promise<unknown[]>;
  createTemplate(templatePayload: Record<string, unknown>): Promise<{ templateId: string; status: string }>;
  getFlows(): Promise<unknown[]>;
  saveFlow(flowPayload: Record<string, unknown>): Promise<{ flowId: string; version: string }>;
}

export interface IAdNetworkController {
  saveMetaCapiConfig(config: { pixelId: string; accessToken: string }): Promise<boolean>;
  saveGoogleCapiConfig(config: { clientId: string; clientSecret: string; customerId: string; mccId?: string }): Promise<boolean>;
}

export interface IReportingController {
  getLeadFunnelReport(params: { startDate: string; endDate: string; projectId?: string }): Promise<{
    incoming: number;
    prospect: number;
    opportunity: number;
    booked: number;
    unqualifiedBreakdown: Record<string, number>;
    lostBreakdown: Record<string, number>;
  }>;
  getCampaignRoiReport(params: { startDate: string; endDate: string }): Promise<Array<{
    campaignName: string;
    source: string;
    responses: number;
    spend: number;
    cpl: number;
    bookings: number;
  }>>;
  getCustomReports(): Promise<unknown[]>;
  createCustomReport(definition: Record<string, unknown>): Promise<{ reportId: string }>;
  executeCustomReport(reportId: string, runtimeFilters?: Record<string, unknown>): Promise<{
    dimensions: string[];
    metrics: string[];
    rows: Array<Record<string, unknown>>;
  }>;
}

export interface ITargetsAndRoiController {
  getCampaignTargets(): Promise<unknown[]>;
  createCampaignTarget(payload: Record<string, unknown>): Promise<{ targetId: string }>;
  getRoiConfigurations(): Promise<unknown[]>;
  saveRoiConfiguration(payload: Record<string, unknown>): Promise<{ id: string }>;
}

