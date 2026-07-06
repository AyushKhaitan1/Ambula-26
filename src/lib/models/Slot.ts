import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISlot extends Document {
  doctorId: mongoose.Types.ObjectId;
  datetime: Date;
  status: "available" | "booked" | "blocked";
  bookingId: mongoose.Types.ObjectId | null;
}

const SlotSchema = new Schema<ISlot>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    datetime: { type: Date, required: true },
    status: {
      type: String,
      enum: ["available", "booked", "blocked"],
      default: "available",
      required: true,
    },
    bookingId: { type: Schema.Types.ObjectId, ref: "Booking", default: null },
  },
  { timestamps: true }
);

// Compound index to ensure uniqueness per doctor and time slot (optional check, but good practice)
SlotSchema.index({ doctorId: 1, datetime: 1 }, { unique: true });

const Slot: Model<ISlot> = mongoose.models.Slot || mongoose.model<ISlot>("Slot", SlotSchema);

export default Slot;
