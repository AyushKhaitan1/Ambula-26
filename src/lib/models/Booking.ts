import mongoose, { Schema, Document, Model } from "mongoose";

export interface IBooking extends Document {
  bookingId: string; // e.g., AMB-1234-XY
  doctorId: mongoose.Types.ObjectId;
  slotId: mongoose.Types.ObjectId;
  datetime: Date;
  patientDetails: {
    name: string;
    age: number;
    phone: string;
  };
  healthSummary: {
    bloodGroup: string;
    conditions: string;
    medications: string;
  };
  status: "pending" | "confirmed" | "completed" | "cancelled";
  consultationNotes?: {
    diagnosis: string;
    prescription: string;
    updatedAt: Date;
  };
  createdAt: Date;
}

const BookingSchema = new Schema<IBooking>(
  {
    bookingId: { type: String, required: true, unique: true },
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    slotId: { type: Schema.Types.ObjectId, ref: "Slot", required: true },
    datetime: { type: Date, required: true },
    patientDetails: {
      name: { type: String, required: true },
      age: { type: Number, required: true },
      phone: { type: String, required: true },
    },
    healthSummary: {
      bloodGroup: { type: String, required: true },
      conditions: { type: String, default: "" },
      medications: { type: String, default: "" },
    },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
      required: true,
    },
    consultationNotes: {
      diagnosis: { type: String, default: "" },
      prescription: { type: String, default: "" },
      updatedAt: { type: Date },
    },
  },
  { timestamps: true }
);

const Booking: Model<IBooking> = mongoose.models.Booking || mongoose.model<IBooking>("Booking", BookingSchema);

export default Booking;
