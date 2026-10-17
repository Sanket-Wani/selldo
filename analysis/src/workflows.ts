/**
 * Sell.do Workflow Engine & State Machines
 */

import { Lead, LeadStage, SiteVisit, Booking, Call, User } from './models';

export interface StageTransitionResult {
  success: boolean;
  previousStage: LeadStage;
  newStage: LeadStage;
  error?: string;
}

export class LeadLifecycleFSM {
  private static readonly ALLOWED_TRANSITIONS: Record<LeadStage, LeadStage[]> = {
    incoming: ['prospect', 'unqualified'],
    prospect: ['opportunity', 'unqualified'],
    opportunity: ['booked', 'lost'],
    booked: ['prospect'],
    unqualified: ['prospect', 'incoming'],
    lost: ['prospect'],
    first_visit_old: ['lost', 'booked'],
    second_visit_old: ['lost', 'booked'],
    first_visit: ['lost', 'booked', 'second_visit'],
    second_visit: ['lost', 'booked']
  };

  public static canTransition(from: LeadStage, to: LeadStage): boolean {
    const allowed = this.ALLOWED_TRANSITIONS[from];
    return allowed ? allowed.includes(to) : false;
  }

  public static transition(
    lead: Lead,
    to: LeadStage,
    meta?: { reasonId?: string; subStage?: string }
  ): StageTransitionResult {
    if (!this.canTransition(lead.stage, to)) {
      return {
        success: false,
        previousStage: lead.stage,
        newStage: to,
        error: `Invalid stage transition from ${lead.stage} to ${to}`
      };
    }

    if (to === 'unqualified' && !meta?.reasonId) {
      return {
        success: false,
        previousStage: lead.stage,
        newStage: to,
        error: 'UnqualifiedReason is mandatory when marking a lead as unqualified'
      };
    }

    if (to === 'lost' && !meta?.reasonId) {
      return {
        success: false,
        previousStage: lead.stage,
        newStage: to,
        error: 'LostReason is mandatory when marking a lead as lost'
      };
    }

    const previous = lead.stage;
    lead.stage = to;
    lead.subStage = meta?.subStage;
    lead.stageUpdatedAt = new Date().toISOString();

    return {
      success: true,
      previousStage: previous,
      newStage: to
    };
  }
}

export class PreSalesHandoffService {
  public static pushToSales(
    lead: Lead,
    targetSalesUser: User,
    projectUnitRequirement?: string
  ): boolean {
    if (targetSalesUser.role !== 'sales') {
      throw new Error('Handoff target user must have Sales role');
    }

    lead.assigneeId = targetSalesUser.id;
    lead.teamId = targetSalesUser.teamId;

    if (lead.stage === 'incoming') {
      LeadLifecycleFSM.transition(lead, 'prospect');
    }

    return true;
  }
}

export class SiteVisitWorkflow {
  public static conductVisit(
    visit: SiteVisit,
    feedback: { rating: number; comments: string; interest: 'high' | 'medium' | 'low' }
  ): void {
    visit.status = 'conducted';
    visit.conductedAt = new Date().toISOString();
    visit.feedback = {
      rating: feedback.rating,
      comments: feedback.comments,
      customerInterest: feedback.interest,
      preferredUnitIds: []
    };
  }
}
