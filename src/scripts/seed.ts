import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dbConnect from "../lib/db";
import Doctor from "../lib/models/Doctor";
import Slot from "../lib/models/Slot";
import Booking from "../lib/models/Booking";
import User from "../lib/models/User";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/ambula-healthcare";

const DOCTORS_DATA = [
  {
    name: "Dr. Amit Sharma",
    specialization: "Cardiologist",
    location: "Bangalore",
    consultationFee: 800,
    experience: 15,
    rating: 4.9,
    about: "Dr. Amit Sharma is a senior consultant cardiologist with over 15 years of experience in interventional cardiology. He is dedicated to providing personalized and advanced heart care.",
    avatar: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Dr. Sneha Patel",
    specialization: "Dermatologist",
    location: "Delhi",
    consultationFee: 600,
    experience: 8,
    rating: 4.7,
    about: "Dr. Sneha Patel specializes in clinical and aesthetic dermatology, treating all kinds of skin, hair, and nail conditions with state-of-the-art procedures.",
    avatar: "https://images.unsplash.com/photo-1594824813573-246434de83fb?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Dr. Rajesh Kumar",
    specialization: "Pediatrician",
    location: "Mumbai",
    consultationFee: 500,
    experience: 12,
    rating: 4.8,
    about: "Dr. Rajesh Kumar is passionate about child healthcare and development, ensuring a friendly and welcoming environment for infants, children, and teenagers.",
    avatar: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?q=80&w=300&auto=format&fit=crop",
  },
  {
    name: "Dr. Priya Nair",
    specialization: "General Physician",
    location: "Bangalore",
    consultationFee: 400,
    experience: 6,
    rating: 4.5,
    about: "Dr. Priya Nair provides comprehensive primary care services. She believes in preventive health management and detailed patient counseling.",
    avatar: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?q=80&w=300&auto=format&fit=crop",
  },
];

async function seed() {
  console.log("Connecting to MongoDB...");
  await dbConnect();
  console.log("Connected successfully!");

  // Clear existing collections
  console.log("Clearing existing data...");
  await Doctor.deleteMany({});
  await Slot.deleteMany({});
  await Booking.deleteMany({});
  await User.deleteMany({});
  console.log("Cleared collections.");

  // Insert Doctors
  console.log("Inserting doctors...");
  const insertedDoctors = await Doctor.insertMany(DOCTORS_DATA);
  console.log(`Inserted ${insertedDoctors.length} doctors.`);

  // Create test doctor user
  console.log("Creating test doctor user account...");
  const amitDoctor = insertedDoctors.find((d) => d.name === "Dr. Amit Sharma");
  if (!amitDoctor) throw new Error("Amit Sharma doctor not found in inserted doctors");

  const hashedPassword = await bcrypt.hash("password123", 10);
  const testUser = new User({
    doctorId: amitDoctor._id,
    email: "doctor@ambula.com",
    passwordHash: hashedPassword,
  });
  await testUser.save();
  console.log("Test doctor user created successfully!");
  console.log("Credentials: Email: doctor@ambula.com | Password: password123");

  // Generate slots for next 7 days for each doctor
  console.log("Generating 7-day slots for each doctor...");
  const slotsToInsert = [];
  const hours = [9, 10, 11, 14, 15, 16]; // 9 AM, 10 AM, 11 AM, 2 PM, 3 PM, 4 PM

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const doc of insertedDoctors) {
    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
      const slotDate = new Date(today);
      slotDate.setDate(today.getDate() + dayOffset);

      for (const hour of hours) {
        const slotDateTime = new Date(slotDate);
        slotDateTime.setHours(hour, 0, 0, 0);

        slotsToInsert.push({
          doctorId: doc._id,
          datetime: slotDateTime,
          status: "available",
          bookingId: null,
        });
      }
    }
  }

  await Slot.insertMany(slotsToInsert);
  console.log(`Generated ${slotsToInsert.length} slots successfully.`);

  mongoose.connection.close();
  console.log("Database seeded successfully and connection closed!");
}

seed().catch((err) => {
  console.error("Error seeding database:", err);
  process.exit(1);
});
