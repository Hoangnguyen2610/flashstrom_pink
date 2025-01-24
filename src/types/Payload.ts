// Enum for UserType
export enum Enum_UserType {
  DRIVER = 'DRIVER',
  ADMIN = 'ADMIN',
  CUSTOMER = 'CUSTOMER',
  RESTAURANT_OWNER = 'RESTAURANT_OWNER',
  CUSTOMER_CARE_REPRESENTATIVE = 'CUSTOMER_CARE_REPRESENTATIVE',
  F_WALLET = 'F_WALLET',
}

export enum Enum_AppTheme {
  LIGHT = 'light',
  DARK = 'dark',
}

export type BasePayload = {
  user_id: string;
  email: string;
  user_type: Enum_UserType[];
  first_name: string;
  last_name: string;
  app_preferences: { theme: Enum_AppTheme };
};

export type DriverPayload = BasePayload & {
  contact_email: string;
  contact_phone: string;
  vehicle: string;
  current_location: string;
  avatar: string;
  fWallet_id: string;
  driver_id: string;
  fWallet_balance: number;
  available_for_work: boolean;
};

export type RestaurantOwnerPayload = BasePayload & {
  owner_id: string;
  owner_name: string;
  address: string;
  restaurant_name: string;
  contact_email: { title: string; is_default: boolean; email: string }[];
  contact_phone: { number: string; is_default: boolean, title: string }[];
  created_at: number;
  updated_at: number;
  avatar: { url: string; key: string };
  images_gallery: string[];
  status: { is_open: boolean; is_active: boolean; is_accepted_orders: boolean };
  promotions: string[];
  ratings: { average_rating: number; review_count: number };
  specialize_in: string[];
  opening_hours: {
    mon: { from: number; to: number };
    tue: { from: number; to: number };
    wed: { from: number; to: number };
    thu: { from: number; to: number };
    fri: { from: number; to: number };
    sat: { from: number; to: number };
    sun: { from: number; to: number };
  };
};

export type CustomerPayload = BasePayload & {
  preferred_category: string;
  favorite_restaurants: string[];
  favorite_items: string[];
  support_tickets: string[];
};
export type FWalletPayload = BasePayload & {
  balance: number;
  fWallet_id: string;
};

// The final payload type can be a union of both driver and customer payload types.
export type Payload = DriverPayload | CustomerPayload | FWalletPayload | RestaurantOwnerPayload;
