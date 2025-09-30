import { EventAttributes } from "../../models/event.model";
import { EventBookingAttributes } from "../../models/eventBooking.model";

export interface CreateEventDTO {
  name: string;
  description?: string;
  start_date: Date;
  end_date: Date;
  location?: string;
  max_participants?: number;
  price?: number;
  image_url?: string;
  status?: EventAttributes["status"];
  type?: string;
  requirements?: string[];
  organizer_id?: string;
  metadata?: {
    menu_items?: string[];
    seating_arrangement?: string;
    equipment_needed?: string[];
    staff_required?: number;
    setup_time?: string;
    cleanup_time?: string;
  };
}

export interface UpdateEventDTO extends Partial<CreateEventDTO> {}

export interface CreateEventBookingDTO {
  event_id: string;
  user_id: string;
  number_of_guests: number;
  special_requests?: string;
  contact_info?: {
    phone?: string;
    email?: string;
  };
  payment_status?: EventBookingAttributes["payment_status"];
  amount_paid?: number;
  payment_method?: string;
}

export interface UpdateEventBookingDTO extends Partial<CreateEventBookingDTO> {
  status?: EventBookingAttributes["status"];
  cancellation_reason?: string;
  refund_amount?: number;
}
