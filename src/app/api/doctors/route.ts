import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import Doctor from "@/lib/models/Doctor";

export async function GET(request: Request) {
  try {
    await dbConnect();
    const { searchParams } = new URL(request.url);
    const specialization = searchParams.get("specialization");
    const location = searchParams.get("location");

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const filter: any = {};
    if (specialization && specialization !== "all") {
      filter.specialization = { $regex: new RegExp(specialization, "i") };
    }
    if (location && location !== "all") {
      filter.location = { $regex: new RegExp(location, "i") };
    }

    const doctors = await Doctor.find(filter).sort({ rating: -1 });
    return NextResponse.json({ success: true, doctors });
  } catch (error: unknown) {
    console.error("Failed to fetch doctors:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
