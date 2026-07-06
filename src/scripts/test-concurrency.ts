import dbConnect from "../lib/db";
import Doctor from "../lib/models/Doctor";
import Slot from "../lib/models/Slot";

async function testConcurrency() {
  console.log("Connecting to database to find a slot...");
  await dbConnect();

  // Find a doctor
  const doctor = await Doctor.findOne();
  if (!doctor) {
    console.error("No doctor found. Please run the seed script first.");
    process.exit(1);
  }

  // Find an available slot
  const slot = await Slot.findOne({ doctorId: doctor._id, status: "available" });
  if (!slot) {
    console.error("No available slot found. Please run the seed script first.");
    process.exit(1);
  }

  console.log(`Testing slot booking for:`);
  console.log(`Doctor: ${doctor.name}`);
  console.log(`Slot ID: ${slot._id}`);
  console.log(`Slot Datetime: ${slot.datetime}`);
  console.log("\nStarting 5 concurrent booking requests to http://localhost:3000/api/book...\n");

  const patientDetails = {
    name: "Concurrent Test Patient",
    age: 30,
    phone: "9999999999",
  };

  const healthSummary = {
    bloodGroup: "O+",
    conditions: "None",
    medications: "None",
  };

  const requestBody = {
    doctorId: doctor._id.toString(),
    slotId: slot._id.toString(),
    patientDetails,
    healthSummary,
  };

  // Launch 5 concurrent fetch requests
  const promises = Array.from({ length: 5 }).map(async (_, index) => {
    try {
      const response = await fetch("http://localhost:3000/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
      });
      const data = await response.json();
      return {
        requestNum: index + 1,
        status: response.status,
        data,
      };
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : String(err);
      return {
        requestNum: index + 1,
        status: "ERROR",
        error: errMsg,
      };
    }
  });

  const results = await Promise.all(promises);

  console.log("Results from concurrent requests:");
  console.log("==================================");

  let successCount = 0;
  let conflictCount = 0;
  let errorCount = 0;

  for (const res of results) {
    console.log(`Request #${res.requestNum}: Status ${res.status}`);
    console.log(JSON.stringify(res.data || res.error, null, 2));
    console.log("----------------------------------");

    if (res.status === 200) {
      successCount++;
    } else if (res.status === 409) {
      conflictCount++;
    } else {
      errorCount++;
    }
  }

  console.log("Summary:");
  console.log(`- Successes (200 OK): ${successCount}`);
  console.log(`- Conflicts (409 Conflict): ${conflictCount}`);
  console.log(`- Errors: ${errorCount}`);

  if (successCount === 1 && conflictCount === 4) {
    console.log("\n✅ SUCCESS: Exactly 1 booking succeeded and 4 requests failed with 409 Conflict. Double-booking prevention is working perfectly!");
  } else {
    console.log("\n❌ FAILED: Concurrency test did not behave as expected. Ensure the Next.js dev server is running on http://localhost:3000.");
  }

  process.exit(0);
}

testConcurrency().catch((err) => {
  console.error("Error running concurrency test:", err);
  process.exit(1);
});
