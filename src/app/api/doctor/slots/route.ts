import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Slot from "@/lib/models/Slot";

const JWT_SECRET = process.env.JWT_SECRET || "ambula_super_secret_jwt_key_2026";

async function verifyDoctorAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("doctor_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { doctorId: string };
    return decoded.doctorId;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export async function GET() {
  try {
    await dbConnect();
    const doctorId = await verifyDoctorAuth();

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    // Fetch all slots for this doctor for the next 7 days (or just all available slots in the database)
    const slots = await Slot.find({ doctorId }).sort({ datetime: 1 }).exec();

    return NextResponse.json({ success: true, slots });
  } catch (error: unknown) {
    console.error("Fetch doctor slots error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    await dbConnect();
    const doctorId = await verifyDoctorAuth();

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { slotId, action } = await request.json(); // action is "block" or "unblock"

    if (!slotId || !action || !["block", "unblock"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid slotId or action. Action must be 'block' or 'unblock'" },
        { status: 400 }
      );
    }

    const slot = await Slot.findOne({ _id: slotId, doctorId });
    if (!slot) {
      return NextResponse.json({ success: false, error: "Slot not found" }, { status: 404 });
    }

    if (action === "block") {
      if (slot.status === "booked") {
        return NextResponse.json(
          { success: false, error: "Cannot block a slot that is already booked" },
          { status: 400 }
        );
      }
      slot.status = "blocked";
    } else {
      // unblock
      if (slot.status !== "blocked") {
        return NextResponse.json(
          { success: false, error: "Slot is not currently blocked" },
          { status: 400 }
        );
      }
      slot.status = "available";
    }

    await slot.save();

    return NextResponse.json({ success: true, slot });
  } catch (error: unknown) {
    console.error("Block/unblock slot error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
