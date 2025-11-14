export type Complaint = {
  id?: string;
  user_id?: string;
  order_id?: string;
  order_item_id?: string;
  description?: string;
  status: "pending" | "approved" | "rejected";
  resolution_notes?: string;
  created_at?: Date;
  updated_at?: Date;
};

export type CreateComplaintData = {
  user_id?: string;
  order_id?: string;
  order_item_id?: string;
  description: string;
};
