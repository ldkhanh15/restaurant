import { ComplaintAttributes } from "../../models/complaint.model";
import { ReviewAttributes } from "../../models/review.model";

export interface CreateComplaintDTO {
  user_id: string;
  order_id?: string;
  subject: string;
  description: string;
  category?: string;
  priority?: "low" | "medium" | "high";
  images?: string[];
  assigned_to?: string;
  status?: ComplaintAttributes["status"];
}

export interface UpdateComplaintDTO extends Partial<CreateComplaintDTO> {
  resolution?: string;
}

export interface CreateComplaintResponseDTO {
  complaint_id: string;
  response: string;
  respondent_id: string;
}

export interface CreateReviewDTO {
  user_id: string;
  order_id?: string;
  dish_id?: string;
  rating: number;
  comment?: string;
  images?: string[];
  sentiment?: "positive" | "neutral" | "negative";
}

export interface UpdateReviewDTO extends Partial<CreateReviewDTO> {}
