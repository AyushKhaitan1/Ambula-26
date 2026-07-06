import { NextResponse } from "next/server";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dbConnect from "@/lib/db";
import User from "@/lib/models/User";
import Doctor from "@/lib/models/Doctor";

const JWT_SECRET = process.env.JWT_SECRET || "ambula_super_secret_jwt_key_2026";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { success: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // Find the user credentials
    const user = await User.findOne({ email });
    if (!user) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Verify password
    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return NextResponse.json(
        { success: false, error: "Invalid email or password" },
        { status: 401 }
      );
    }

    // Get doctor details
    const doctor = await Doctor.findById(user.doctorId);
    if (!doctor) {
      return NextResponse.json(
        { success: false, error: "Doctor profile not found" },
        { status: 404 }
      );
    }

    // Create JWT token
    const token = jwt.sign(
      {
        userId: user._id,
        doctorId: user.doctorId,
        email: user.email,
        name: doctor.name,
      },
      JWT_SECRET,
      { expiresIn: "7d" }
    );

    // Set secure HTTP-only cookie
    const response = NextResponse.json({
      success: true,
      doctor: {
        id: doctor._id,
        name: doctor.name,
        specialization: doctor.specialization,
        avatar: doctor.avatar,
      },
    });

    response.cookies.set("doctor_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      path: "/",
    });

    return response;
  } catch (error: unknown) {
    console.error("Login API error:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal Server Error";
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
}
