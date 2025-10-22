export type Table = {
  id: string;
  table_number: string;
  capacity: number;
  deposit: number;
  cancel_minutes: number;
  location?: string;
  status: "available" | "occupied" | "cleaning" | "reserved";
  panorama_urls?: any;
  amenities?: any;
  description?: string;
  created_at?: Date;
  updated_at?: Date;
  deleted_at?: Date | null;
}
