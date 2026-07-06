import mongoose, { Schema, Document, Model } from "mongoose";

export interface IDoctor extends Document {
  name: string;
  specialization: string;
  location: string;
  consultationFee: number;
  experience: number; // in years
  rating: number;
  about: string;
  avatar: string;
}

const DoctorSchema = new Schema<IDoctor>(
  {
    name: { type: String, required: true },
    specialization: { type: String, required: true },
    location: { type: String, required: true },
    consultationFee: { type: Number, required: true },
    experience: { type: Number, required: true },
    rating: { type: Number, default: 4.5 },
    about: { type: String, required: true },
    avatar: { type: String, required: true },
  },
  { timestamps: true }
);

// Prevent compile error during Next.js hot reloads by checking if the model is already registered
const Doctor: Model<IDoctor> = mongoose.models.Doctor || mongoose.model<IDoctor>("Doctor", DoctorSchema);

export default Doctor;
