import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Slot from "@/lib/models/Slot";

export async function GET(
  request: Request,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  context: any
) {
  try {
    await dbConnect();
    // In Next.js App Router context.params can be retrieved or awaited.
    // Let's retrieve context.params
    const params = await context.params;
    const doctorId = params.id;

    if (!doctorId) {
      return NextResponse.json({ success: false, error: "Doctor ID is required" }, { status: 400 });
    }

    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);

    const endOfSevenDays = new Date(startOfToday);
    endOfSevenDays.setDate(startOfToday.getDate() + 7);

    // Retrieve slots that are available (not booked, not blocked)
    const slots = await Slot.find({
      doctorId,
      status: "available",
      datetime: { $gte: startOfToday, $lte: endOfSevenDays },
    })
      .sort({ datetime: 1 })
      .exec();

    return NextResponse.json({ success: true, slots });
  } catch (error: unknown) {
    console.error("Fetch doctor public slots error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
