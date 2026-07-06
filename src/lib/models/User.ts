import mongoose, { Schema, Document, Model } from "mongoose";

export interface IUser extends Document {
  doctorId: mongoose.Types.ObjectId;
  email: string;
  passwordHash: string;
}

const UserSchema = new Schema<IUser>(
  {
    doctorId: { type: Schema.Types.ObjectId, ref: "Doctor", required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    passwordHash: { type: String, required: true },
  },
  { timestamps: true }
);

const User: Model<IUser> = mongoose.models.User || mongoose.model<IUser>("User", UserSchema);

export default User;
