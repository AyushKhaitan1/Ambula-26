import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Doctor from "@/lib/models/Doctor";

export async function GET(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) {
  try {
    await dbConnect();
    const params = await context.params;
    const doctorId = params.id;

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Doctor ID is required" }, { status: 400 });
    }

    const doctor = await Doctor.findById(doctorId);
    if (!doctor) {
      return NextResponse.json({ success: false, error: "Doctor not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, doctor });
  } catch (error: unknown) {
    console.error("Fetch doctor details error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
