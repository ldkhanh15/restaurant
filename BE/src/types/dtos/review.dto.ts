import { ReviewAttributes } from "../../models/review.model";

export interface CreateReviewDTO {
  user_id: string;
  order_id?: string;
  dish_id?: string;
  rating: number;
  content?: string;
  images?: string[];
  status?: ReviewAttributes["status"];
  sentiment?: "positive" | "neutral" | "negative";
  tags?: string[];
  metadata?: {
    taste_rating?: number;
    presentation_rating?: number;
    service_rating?: number;
    ambiance_rating?: number;
    value_rating?: number;
    dining_time?: string;
    visit_type?: string;
  };
}

export interface UpdateReviewDTO extends Partial<CreateReviewDTO> {
  admin_response?: string;
  is_featured?: boolean;
  moderation_notes?: string;
}

export interface ReviewResponseDTO {
  review_id: string;
  response_content: string;
  responded_by: string;
  is_public: boolean;
}

export interface ReviewAnalyticsDTO {
  average_rating: number;
  total_reviews: number;
  rating_distribution: {
    [key: number]: number;
  };
  sentiment_distribution: {
    positive: number;
    neutral: number;
    negative: number;
  };
  common_tags: Array<{
    tag: string;
    count: number;
  }>;
  recent_trends: Array<{
    date: string;
    average_rating: number;
    review_count: number;
  }>;
}
