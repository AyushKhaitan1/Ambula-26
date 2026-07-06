# Ambula Care - Healthcare & Consultation Web Platform

Ambula Care is a full-stack, mobile-friendly healthcare web platform built for patients to easily book doctor appointments and for doctors to manage schedules and consultations.

## Features

### Patient Side (Mobile-First)
- **Browse & Search**: Search doctors by specialization and location with instant filtering.
- **Detailed Profiles**: View doctor experience, ratings, consultation fees, and available slots.
- **Sleek Booking Wizard**: 7-day tabbed calendar for picking slots and form for entering patient details and health summaries.
- **Instant Confirmation**: Generates a unique Booking ID upon confirmation.

### Doctor Side
- **Secure Doctor Login**: JWT-based session management using secure, HTTP-only cookies.
- **Appointments Dashboard**: Lists all consultations (today's schedule vs. history), showing patient details and their health summary.
- **Post-Consultation Updates**: Add diagnosis notes and prescriptions after each visit, changing appointment status to completed.
- **Slot Management**: Block/unblock slots for leave, holidays, or breaks (blocked slots are hidden from patients).

---

## Double-Booking Prevention (Backend Level)
Double-booking prevention is implemented at the database query level to remain 100% reliable under high concurrent loads:
1. When a booking request arrives, a temporary `Booking` record is created in a `"pending"` state.
2. The database performs an **atomic update** on the slot requiring its status to be `"available"`:
   ```javascript
   Slot.findOneAndUpdate({ _id: slotId, status: "available" }, { status: "booked", bookingId })
   ```
3. If another concurrent request updates the slot first, the query matches 0 documents and returns `null`. The system then deletes the pending booking and returns a `409 Conflict` to the second patient, advising them to choose the next slot.

---

## Tech Stack
- **Framework**: Next.js App Router (React 19, TypeScript)
- **Database**: MongoDB (Mongoose ODM)
- **Styling**: Vanilla CSS (CSS Modules & Globals)
- **Authentication**: JWT cookies + bcrypt password hashing

---

## Setup & Running Instructions

### Prerequisites
1. **Node.js**: Version 18 or above (v22 recommended)
2. **MongoDB**: Ensure a local MongoDB instance is running at `mongodb://localhost:27017`

### 1. Install Dependencies
```bash
npm install
```

### 2. Seed the Database
Initialize mock doctors, 7 days of available slots, and a doctor user account:
```bash
npx tsx src/scripts/seed.ts
```
*Credentials created:*
- **Email**: `doctor@ambula.com`
- **Password**: `password123`
*(Linked to Dr. Amit Sharma)*

### 3. Run Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) on your desktop or mobile browser.

### 4. Run Concurrency Verification Test
With the development server running in a separate terminal on `http://localhost:3000`, execute:
```bash
npx tsx src/scripts/test-concurrency.ts
```
This fires 5 simultaneous requests for the exact same slot. Verify that exactly 1 request succeeds (200 OK) and 4 requests return a 409 conflict.

---

## Data Model Diagram

```mermaid
classDiagram
    class Doctor {
        +ObjectId _id
        +String name
        +String specialization
        +String location
        +Number consultationFee
        +Number experience
        +Number rating
        +String about
        +String avatar
    }

    class Slot {
        +ObjectId _id
        +ObjectId doctorId
        +Date datetime
        +String status ("available" | "booked" | "blocked")
        +ObjectId bookingId
    }

    class Booking {
        +ObjectId _id
        +String bookingId
        +ObjectId doctorId
        +ObjectId slotId
        +Date datetime
        +Object patientDetails { name, age, phone }
        +Object healthSummary { bloodGroup, conditions, medications }
        +String status ("pending" | "confirmed" | "completed" | "cancelled")
        +Object consultationNotes { diagnosis, prescription, updatedAt }
        +Date createdAt
    }

    class User {
        +ObjectId _id
        +ObjectId doctorId
        +String email
        +String passwordHash
    }

    Doctor "1" --> "0..*" Slot : has
    Slot "1" --> "0..1" Booking : references
    Booking "1" --> "1" Doctor : for
    User "1" --> "1" Doctor : authenticates
```
