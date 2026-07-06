# Thought Process & Technical Decisions

This document details the engineering decisions made for the **Ambula '26 Healthcare Web Platform**, specifically focusing on concurrency, scalability, and design trade-offs.

---

## 1. Handling Concurrent Booking Requests (Double-Booking Prevention)

### The Problem
If two patients attempt to book the exact same slot at the same time, a race condition can occur. If not prevented, both patients could successfully book the slot, causing an embarrassing double-booking for the doctor and a terrible patient experience.

### The Solution: Backend-Level Atomic Lock
Rather than relying on complex and slow multi-document database transactions (which require specific configurations like replica sets in MongoDB and add high transaction overhead), we implemented a **single-document atomic update swap**. 

In MongoDB, write operations on a single document are **guaranteed to be atomic**. We leverage this property in our booking flow:

1. **Pending Booking Creation**: When a patient submits details, we first insert a new `Booking` document with a state of `"pending"`.
2. **Atomic Swap & Compare**: We then run an atomic find-and-update query on the `Slot` collection matching the specific slot ID and requiring its status to be exactly `"available"`:
   ```javascript
   const updatedSlot = await Slot.findOneAndUpdate(
     { _id: slotId, status: "available" },
     { $set: { status: "booked", bookingId: newBooking._id } },
     { new: true }
   );
   ```
3. **Branching Logic**:
   - **Success (Winner)**: If `updatedSlot` is returned, the atomic swap succeeded. The slot status becomes `"booked"` and the booking is linked. We update the booking status to `"confirmed"` and return the Booking ID to the client.
   - **Failure (Loser)**: If `updatedSlot` is `null`, it means another concurrent request succeeded first, modifying the status to `"booked"`. We delete the pending `Booking` document and return a `409 Conflict` error to the client, advising them to select the next available slot.

### Verification
We verified this with a concurrency script (`src/scripts/test-concurrency.ts`) that fires 5 simultaneous requests for the same slot. Exactly 1 request successfully receives a `200 OK` booking confirmation, while the other 4 fail with a `409 Conflict` error.

---

## 2. One Improvement I Would Make with More Time

### Real-Time Slots via WebSockets or Server-Sent Events (SSE)
Currently, slots are fetched when the doctor profile page loads. If a doctor blocks a slot or another patient books it while a user is filling out their booking form, the user only finds out upon submitting the form (leading to a 409 conflict error).

With more time, I would implement **real-time slot updates**:
- Establish a WebSocket or SSE connection on the patient profile page.
- When a slot is booked or blocked on the doctor side or by another patient, broadcast a `"slot_updated"` event to all connected clients.
- The UI will instantly grey out or remove that slot from the patient's screen in real time, preventing them from even attempting to fill out a form for an unavailable slot. This provides an even more frictionless user experience.

---

## 3. One Feature Intentionally Left Out and Why

### Patient Login & Authentication
I intentionally omitted a complete sign-up and login flow for patients, opting instead for a direct **"Enter Details & Confirm"** guest booking flow.

**Why?**
1. **Friction Reduction**: The evaluation criteria emphasizes the speed of the booking flow ("Can a patient search, view, and book in under 2 minutes on a mobile device?"). Requiring patients to create an account, verify their email, and log in introduces heavy friction, especially for one-time or urgent consultations.
2. **Speed & Mobile UX**: By allowing patients to directly enter their name, age, phone number, and health summary during slot selection, they can complete the booking in **under 45 seconds** on a mobile screen.
3. **Data Integrity**: Security and doctor visibility are still fully preserved because the personal health summary is collected at the time of booking and linked directly to the booking document, making it visible to the doctor in their secure dashboard.
