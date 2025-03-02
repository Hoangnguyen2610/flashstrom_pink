import { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

const LocationSchema = new Schema({
  lat: { type: Number, required: true },
  lng: { type: Number, required: true }
});

const WeatherSchema = new Schema({
  temperature: { type: Number },
  condition: { type: String }
});

const StateDetailsSchema = new Schema({
  location: {
    lat: { type: Number },
    lng: { type: Number }
  },
  estimated_time: { type: Number },
  actual_time: { type: Number },
  notes: { type: String },
  tip: { type: Number },
  weather: { type: WeatherSchema }
});

const StageSchema = new Schema({
  state: { type: String, required: true },
  status: {
    type: String,
    enum: ['completed', 'in_progress', 'pending', 'failed'],
    required: true
  },
  timestamp: { type: Date, required: true },
  duration: { type: Number, required: true },
  details: { type: StateDetailsSchema }
});

const EventSchema = new Schema({
  event_type: {
    type: String,
    enum: ['driver_start', 'pickup_complete', 'delivery_complete'],
    required: true
  },
  event_timestamp: { type: Date, required: true },
  event_details: {
    location: { type: LocationSchema },
    notes: { type: String }
  }
});

export const DriverProgressStageSchema = new Schema({
  _id: { type: String },
  driver_id: { type: String, required: true, ref: 'Driver' },
  order_ids: [{ type: String, ref: 'Order' }],
  current_state: {
    type: String,
    enum: [
      'driver_ready',
      'waiting_for_pickup',
      'restaurant_pickup',
      'en_route_to_customer',
      'delivery_complete'
    ],
    required: true
  },
  previous_state: { type: String },
  stages: [StageSchema],
  next_state: { type: String },
  estimated_time_remaining: { type: Number },
  actual_time_spent: { type: Number },
  total_distance_travelled: { type: Number },
  total_tips: { type: Number },
  events: [EventSchema],
  created_at: { type: Number, default: Math.floor(Date.now() / 1000) },
  updated_at: { type: Number, default: Math.floor(Date.now() / 1000) }
});

// Pre-save hook
DriverProgressStageSchema.pre('save', function (next) {
  if (this.isNew) {
    this._id = `FF_DPS_${uuidv4()}`;
    if (!this.created_at) this.created_at = Math.floor(Date.now() / 1000);
  }
  this.updated_at = Math.floor(Date.now() / 1000);
  next();
});

export interface DriverProgressStage extends Document {
  id: string;
  driver_id: string;
  order_ids: string[];
  current_state:
    | 'driver_ready'
    | 'waiting_for_pickup'
    | 'restaurant_pickup'
    | 'en_route_to_customer'
    | 'delivery_complete';

  previous_state?: string;
  stages: Array<{
    state: string;
    status: 'completed' | 'in_progress' | 'pending' | 'failed';
    timestamp: Date;
    duration: number;
    details?: {
      location?: {
        lat: number;
        lng: number;
      };
      estimated_time?: number;
      actual_time?: number;
      notes?: string;
      tip?: number;
      weather?: {
        temperature?: number;
        condition?: string;
      };
    };
  }>;
  next_state?: string;
  estimated_time_remaining?: number;
  actual_time_spent?: number;
  total_distance_travelled?: number;
  total_tips?: number;
  events: Array<{
    event_type: 'driver_start' | 'pickup_complete' | 'delivery_complete';
    event_timestamp: Date;
    event_details?: {
      location?: {
        lat: number;
        lng: number;
      };
      notes?: string;
    };
  }>;
  created_at: number;
  updated_at: number;
}
