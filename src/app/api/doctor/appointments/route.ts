import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";

const JWT_SECRET = process.env.JWT_SECRET || "ambula_super_secret_jwt_key_2026";

async function verifyDoctorAuth() {
  const cookieStore = await cookies();
  const token = cookieStore.get("doctor_token")?.value;
  if (!token) return null;

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { doctorId: string; name: string };
    return decoded.doctorId;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export async function GET(request: Request) {
  try {
    await dbConnect();
    const doctorId = await verifyDoctorAuth();

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const viewAll = searchParams.get("all") === "true";

    // Setup date filters for Today (local time coverage)
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = { doctorId };

    if (!viewAll) {
      filter.datetime = { $gte: startOfToday, $lte: endOfToday };
    }

    // Retrieve confirmed or completed bookings
    const bookings = await Booking.find(filter)
      .sort({ datetime: 1 })
      .exec();

    return NextResponse.json({ success: true, bookings });
  } catch (error: unknown) {
    console.error("Fetch appointments error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    await dbConnect();
    const doctorId = await verifyDoctorAuth();

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Unauthorized access" }, { status: 401 });
    }

    const { bookingId, diagnosis, prescription } = await request.json();

    if (!bookingId || !diagnosis || !prescription) {
      return NextResponse.json(
        { success: false, error: "Missing required fields: bookingId, diagnosis, prescription" },
        { status: 400 }
      );
    }

    // Find the booking and verify it belongs to this doctor
    const booking = await Booking.findOne({ _id: bookingId, doctorId });
    if (!booking) {
      return NextResponse.json(
        { success: false, error: "Booking not found or access denied" },
        { status: 404 }
      );
    }

    booking.consultationNotes = {
      diagnosis,
      prescription,
      updatedAt: new Date(),
    };
    booking.status = "completed";
    await booking.save();

    return NextResponse.json({ success: true, booking });
  } catch (error: unknown) {
    console.error("Update consultation notes error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
