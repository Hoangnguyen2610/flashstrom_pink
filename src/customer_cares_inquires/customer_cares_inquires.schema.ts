import { Schema, Document } from 'mongoose';
import { v4 as uuidv4 } from 'uuid';

// Define the Rating Review Schema
export const RatingReviewSchema = new Schema({
  _id: { type: String }, // Custom _id field for rating review
  source_id: { type: String, required: true }, // ID of the user who created the review
  receiver_id: { type: String, required: true }, // ID of the user/entity receiving the review
  rating: { type: Number, required: true }, // Numerical rating
  review: { type: String }, // Text review content
  order_id: { type: String, required: true }, // Reference to the order
  created_at: { type: Number, required: false }, // Unix timestamp of creation
  updated_at: { type: Number, required: false }, // Unix timestamp of last update
});

// Pre-save hook to generate a custom ID with 'FF_REVIEW_' prefix and timestamps
RatingReviewSchema.pre('save', function (next) {
  if (this.isNew) {
    // Generate a custom ID with the 'FF_REVIEW_' prefix and a random UUID
    this._id = `FF_REVIEW_${uuidv4()}`;
    // Set timestamps if not provided
    if (!this.created_at) this.created_at = Math.floor(Date.now() / 1000);
    if (!this.updated_at) this.updated_at = Math.floor(Date.now() / 1000);
  }
  next();
});

// Define the interface for the Rating Review model
export interface RatingReview extends Document {
  _id: string; // Custom review ID (FF_REVIEW_uuid)
  source_id: string; // ID of the reviewer
  receiver_id: string; // ID of the review recipient
  rating: number; // Numerical rating value
  review: string; // Review text content
  order_id: string; // Associated order ID
  created_at: number; // Unix timestamp of creation
  updated_at: number; // Unix timestamp of last update
}