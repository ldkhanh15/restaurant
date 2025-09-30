import { TableAttributes } from "../../models/table.model";
import { TableGroupAttributes } from "../../models/tableGroup.model";
import { ReservationAttributes } from "../../models/reservation.model";

export interface CreateTableDTO {
  table_number: string;
  capacity: number;
  book_minutes?: number;
  deposit?: number;
  cancel_minutes?: number;
  location?: string;
  status?: TableAttributes["status"];
  panorama_urls?: object;
  amenities?: object;
  description?: string;
}

export interface UpdateTableDTO extends Partial<CreateTableDTO> {}

export interface CreateTableGroupDTO {
  group_name: string;
  table_ids: string[];
  total_capacity: number;
  book_minutes?: number;
  deposit?: number;
  cancel_minutes?: number;
  status?: TableGroupAttributes["status"];
}

export interface UpdateTableGroupDTO extends Partial<CreateTableGroupDTO> {}

export interface CreateReservationDTO {
  user_id: string;
  table_id?: string;
  table_group_id?: string;
  reservation_time: Date;
  party_size: number;
  duration_minutes?: number;
  preferences?: object;
  status?: ReservationAttributes["status"];
  timeout_minutes?: number;
  notes?: string;
}

export interface UpdateReservationDTO extends Partial<CreateReservationDTO> {}
