import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Booking from "@/lib/models/Booking";
import Slot from "@/lib/models/Slot";
import { generateBookingId } from "@/lib/utils";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const body = await request.json();

    const { doctorId, slotId, patientDetails, healthSummary } = body;

    // Validate request body
    if (!doctorId || !slotId || !patientDetails || !healthSummary) {
      return NextResponse.json(
        { success: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    const { name, age, phone } = patientDetails;
    if (!name || !age || !phone) {
      return NextResponse.json(
        { success: false, error: "Missing patient details" },
        { status: 400 }
      );
    }

    const { bloodGroup } = healthSummary;
    if (!bloodGroup) {
      return NextResponse.json(
        { success: false, error: "Missing health summary blood group" },
        { status: 400 }
      );
    }

    // Step 1: Check if the slot exists and get its datetime
    const targetSlot = await Slot.findById(slotId);
    if (!targetSlot) {
      return NextResponse.json(
        { success: false, error: "Selected slot does not exist" },
        { status: 404 }
      );
    }

    if (targetSlot.status !== "available") {
      return NextResponse.json(
        { success: false, error: "Selected slot is no longer available. Please select another slot." },
        { status: 409 }
      );
    }

    // Step 2: Create a Booking document with 'pending' status
    const bookingCode = generateBookingId();
    const newBooking = new Booking({
      bookingId: bookingCode,
      doctorId,
      slotId,
      datetime: targetSlot.datetime,
      patientDetails: { name, age: Number(age), phone },
      healthSummary,
      status: "pending",
    });
    await newBooking.save();

    // Step 3: Atomic update on Slot to secure the booking
    // This is the core double-booking prevention.
    // MongoDB updates are atomic at the document level.
    // Only one concurrent write operation will find status: "available" and succeed.
    const updatedSlot = await Slot.findOneAndUpdate(
      { _id: slotId, status: "available" },
      { $set: { status: "booked", bookingId: newBooking._id } },
      { new: true }
    );

    if (!updatedSlot) {
      // Step 4: Race condition detected! Another client booked it in the split second.
      // Clean up the pending booking and return 409 conflict
      await Booking.deleteOne({ _id: newBooking._id });
      return NextResponse.json(
        {
          success: false,
          error: "Selected slot is no longer available. Another patient has booked this slot. Please choose the next available slot.",
        },
        { status: 409 }
      );
    }

    // Step 5: Successful lock! Update booking status to 'confirmed'
    newBooking.status = "confirmed";
    await newBooking.save();

    return NextResponse.json({
      success: true,
      booking: {
        bookingId: newBooking.bookingId,
        datetime: newBooking.datetime,
        patientName: newBooking.patientDetails.name,
      },
    });
  } catch (error: unknown) {
    console.error("Booking error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
