export type UserRole = "passenger" | "driver" | "both";

export type RideStatus =
  | "open"
  | "matched"
  | "en_route"
  | "in_progress"
  | "completed"
  | "cancelled";

export type BidStatus =
  | "pending"
  | "accepted"
  | "rejected"
  | "withdrawn"
  | "expired";

export type TripStatus =
  | "assigned"
  | "arriving"
  | "ongoing"
  | "completed"
  | "cancelled";

export type Profile = {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  trust_score: number;
  trips_completed: number;
  cancel_count: number;
};

export type DriverProfile = {
  user_id: string;
  vehicle_make: string;
  vehicle_model: string;
  vehicle_color: string;
  vehicle_plate: string;
  is_online: boolean;
  last_lat: number | null;
  last_lng: number | null;
};

export type RideRequest = {
  id: string;
  passenger_id: string;
  origin_lat: number;
  origin_lng: number;
  origin_label: string;
  dest_lat: number;
  dest_lng: number;
  dest_label: string;
  distance_m: number;
  duration_s: number;
  suggested_fare: number;
  offered_fare: number;
  fare_min: number;
  fare_max: number;
  status: RideStatus;
  notes: string | null;
  created_at: string;
  expires_at: string;
};

export type Bid = {
  id: string;
  ride_id: string;
  driver_id: string;
  amount: number;
  eta_min: number;
  message: string | null;
  status: BidStatus;
  created_at: string;
  profiles?: Pick<Profile, "full_name" | "trust_score" | "trips_completed">;
  driver_profiles?: Pick<
    DriverProfile,
    "vehicle_make" | "vehicle_model" | "vehicle_color" | "vehicle_plate"
  >;
};

export type Trip = {
  id: string;
  ride_id: string;
  passenger_id: string;
  driver_id: string;
  agreed_fare: number;
  status: TripStatus;
  driver_lat: number | null;
  driver_lng: number | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
};
