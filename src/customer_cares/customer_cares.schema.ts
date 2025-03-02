import { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Define the Contact Schema for email
const ContactEmailSchema = new Schema({
  title: { type: String, required: true },
  is_default: { type: Boolean, required: true },
  email: { type: String, required: true },
});

// Define the Contact Schema for phone
const ContactPhoneSchema = new Schema({
  title: { type: String, required: true },
  number: { type: String, required: true },
  is_default: { type: Boolean, required: true },
});

// Define the CustomerCare Schema
export const CustomerCareSchema = new Schema({
  _id: { type: String }, // Custom _id field with the 'CC_' prefix
  user_id: { type: String, required: true, ref: 'User' }, // Reference to User collection
  contact_email: { type: [ContactEmailSchema], required: false }, // Array of email contacts
  contact_phone: { type: [ContactPhoneSchema], required: false }, // Array of phone contacts
  first_name: { type: String, required: false }, // CustomerCare's first name
  last_name: { type: String, required: false }, // CustomerCare's last name
  assigned_tickets: { type: [String], required: false }, // Array of ticket IDs
  created_at: { type: Number, required: false }, // Unix timestamp of creation
  updated_at: { type: Number, required: false }, // Unix timestamp of last update
  last_login: { type: Number, required: false }, // Last login timestamp
  avatar: { type: { key: String, url: String }, required: false }, // Avatar image information
  available_for_work: { type: Boolean, required: false }, // If the CustomerCare is available for work
  is_assigned: { type: Boolean, required: false }, // If the CustomerCare is currently assigned to a ticket
});

// Pre-save hook to generate a custom ID with 'CC_' prefix and a random UUID
CustomerCareSchema.pre('save', function (next) {
  if (this.isNew) {
    // Generate a custom ID with the 'CC_' prefix and a random UUID
    this._id = `FF_CC_${uuidv4()}`;
    // Set timestamps if not provided
    if (!this.created_at) this.created_at = Math.floor(Date.now() / 1000); // Current Unix timestamp
    if (!this.updated_at) this.updated_at = Math.floor(Date.now() / 1000); // Current Unix timestamp
  }
  next();
});

// Define the interface for the CustomerCare model
export interface CustomerCare extends Document {
  id: string; // Custom CustomerCare ID
  user_id: string; // Reference to the User's ID
  contact_email: { title: string; is_default: boolean; email: string }[]; // Array of email contacts
  contact_phone: { title: string; number: string; is_default: boolean }[]; // Array of phone contacts
  first_name: string; // CustomerCare's first name
  last_name: string; // CustomerCare's last name
  assigned_tickets?: string[]; // Array of ticket IDs
  created_at: number; // Unix timestamp of creation
  updated_at: number; // Unix timestamp of last update
  last_login: number; // Last login timestamp
  avatar?: { key: string; url: string }; // Avatar information
  available_for_work: boolean; // If the CustomerCare is available for work
  is_assigned?: boolean; // If the CustomerCare is currently assigned to a ticket
}
