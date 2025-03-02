import { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Define the Promotion Schema
export const PromotionSchema = new Schema({
  _id: { type: String }, // Custom _id field for promotion
  name: { type: String, required: true }, // Name of the promotion
  description: { type: String }, // Description of the promotion
  avatar: { type: { url: String, key: String }, required: false }, // Avatar with URL and key
  start_date: { type: Number, required: true }, // Unix timestamp for the promotion start date
  end_date: { type: Number, required: true }, // Unix timestamp for the promotion end date
  status: {
    type: String,
    enum: ['ACTIVE', 'EXPIRED', 'PENDING', 'CANCELLED'],
    required: true,
  }, // Status of the promotion
  discount_type: {
    type: String,
    enum: ['PERCENTAGE', 'FIXED'],
    required: true,
  }, // Type of discount (percentage or fixed)
  discount_value: { type: Number, required: true }, // Discount value (either percentage or fixed amount)
  food_categories: { type: [String], ref: 'FoodCategory', required: true }, // Food category IDs that are affected by this promotion
  minimum_order_value: { type: Number }, // Minimum order value to apply the promotion
  promotion_cost_price: { type: Number, required: true },
  created_at: { type: Number, required: false }, // Unix timestamp of creation
  updated_at: { type: Number, required: false }, // Unix timestamp of last update
});

// Pre-save hook to generate a custom ID with 'FF_PROMO_' prefix and a random UUID
PromotionSchema.pre('save', function (next) {
  if (this.isNew) {
    // Generate a custom ID with the 'FF_PROMO_' prefix and a random UUID
    this._id = `FF_PROMO_${uuidv4()}`;
    // Set timestamps if not provided
    if (!this.created_at) this.created_at = Math.floor(Date.now() / 1000); // Current Unix timestamp
    if (!this.updated_at) this.updated_at = Math.floor(Date.now() / 1000); // Current Unix timestamp
  }
  next();
});

// Define the interface for the Promotion model
export interface Promotion extends Document {
  id: string; // Custom promotion ID (FF_PROMO_uuid)
  name: string; // Name of the promotion
  avatar: { url: string; key: string }; // Avatar object with url and key
  description: string; // Description of the promotion
  start_date: number; // Unix timestamp for the start date
  end_date: number; // Unix timestamp for the end date
  status: 'ACTIVE' | 'EXPIRED' | 'PENDING' | 'CANCELLED'; // Status of the promotion
  discount_type: 'PERCENTAGE' | 'FIXED'; // Type of discount (percentage or fixed)
  discount_value: number; // Discount value (percentage or fixed amount)
  food_categories: string[]; // Array of Food Category IDs affected by the promotion
  minimum_order_value: number; // Minimum order value required to apply the promotion
  promotion_cost_price: number; // Price of the promotion (if applicable)
  created_at: number; // Unix timestamp of creation
  updated_at: number; // Unix timestamp of last update
}
