export type User = {
  id: number;
  username: string;
  email: string;
  phone: string;
  role: "customer" | "employee" | "admin";
  full_name: string;
  ranking: "regular" | "vip" | "platinum";
  points: number;
  created_at: string;
  deleted_at?: string;
  preferences?: any;
  face_image_url?: string;
  // Computed field for blog display compatibility
  name?: string; // Can use full_name or username as fallback
  avatar?: string; // Alias for face_image_url
};
