import { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';
export const AdminSchema = new Schema({
  _id: { type: String }, // Custom admin ID with 'FF_ADM_' prefix
  user_id: { type: String, ref: 'User', required: true }, // Reference to User model
  role: {
    type: String,
    enum: ['SUPER_ADMIN', 'COMPANION_ADMIN', 'FINANCE_ADMIN'],
    required: true,
  },
  permissions: [
    {
      type: String,
      enum: [
        'MANAGE_USERS',
        'MANAGE_RESTAURANTS',
        'MANAGE_ORDERS',
        'MANAGE_PROMOTIONS',
        'MANAGE_PAYMENTS',
        'MANAGE_SUPPORT',
        'MANAGE_DRIVERS',
        'VIEW_ANALYTICS',
        'MANAGE_ADMINS',
        'MANAGE_PROMOTIONS',
      ],
    },
  ],
  assigned_restaurants: [{ type: String, ref: 'Restaurant' }], // For restaurant admins
  assigned_drivers: [{ type: String, ref: 'Driver' }], // For driver management
  assigned_customer_care: [{ type: String, ref: 'User' }], // For customer care staff
  last_active: { type: Number }, // Unix timestamp
  created_at: { type: Number },
  updated_at: { type: Number },
  created_by: { type: String, ref: 'Admin' }, // Reference to admin who created this admin
  status: {
    type: String,
    enum: ['ACTIVE', 'INACTIVE', 'SUSPENDED'],
    default: 'ACTIVE',
  },
});

AdminSchema.pre('save', function (next) {
  if (this.isNew) {
    // Generate a custom ID with the 'CC_' prefix and a random UUID
    this._id = `FF_ADMIN_${uuidv4()}`;
    // Set timestamps if not provided
    if (!this.created_at) this.created_at = Math.floor(Date.now() / 1000); // Current Unix timestamp
    if (!this.updated_at) this.updated_at = Math.floor(Date.now() / 1000); // Current Unix timestamp
  }
  next();
});

export interface Admin extends Document {
  id: string;
  user_id: string;
  role: 'SUPER_ADMIN' | 'COMPANION_ADMIN' | 'FINANCE_ADMIN';
  permissions: string[];
  assigned_restaurants?: string[];
  assigned_drivers?: string[];
  assigned_customer_care?: string[];
  last_active: number;
  created_at: number;
  updated_at: number;
  created_by?: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
}
