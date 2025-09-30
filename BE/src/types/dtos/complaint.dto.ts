import { ComplaintAttributes } from "../../models/complaint.model";

export interface CreateComplaintDTO {
  user_id: string;
  order_id?: string;
  category: string;
  subject: string;
  description: string;
  priority?: "low" | "medium" | "high" | "urgent";
  status?: ComplaintAttributes["status"];
  attachments?: string[];
  metadata?: {
    reported_employee?: string;
    incident_time?: Date;
    affected_items?: string[];
    requested_compensation?: string;
    preferred_contact_method?: string;
  };
}

export interface UpdateComplaintDTO extends Partial<CreateComplaintDTO> {
  assigned_to?: string;
  resolution?: string;
  resolution_time?: Date;
  customer_satisfied?: boolean;
  follow_up_required?: boolean;
  follow_up_notes?: string;
}

export interface ComplaintEscalationDTO {
  complaint_id: string;
  escalation_reason: string;
  escalated_by: string;
  escalated_to: string;
  priority_change?: "low" | "medium" | "high" | "urgent";
  action_required?: string;
  deadline?: Date;
}

export interface ComplaintResolutionDTO {
  complaint_id: string;
  resolution: string;
  resolved_by: string;
  compensation_offered?: {
    type: string;
    value: number;
    details?: string;
  };
  actions_taken: string[];
  preventive_measures?: string[];
}
