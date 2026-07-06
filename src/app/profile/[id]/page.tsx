"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import { formatDate, formatTime } from "@/lib/utils";

interface DoctorData {
  _id: string;
  name: string;
  specialization: string;
  location: string;
  consultationFee: number;
  experience: number;
  rating: number;
  about: string;
  avatar: string;
}

interface SlotData {
  _id: string;
  doctorId: string;
  datetime: string;
  status: string;
}

export default function DoctorProfilePage({
  params: paramsPromise,
}: {
  params: Promise<{ id: string }>;
}) {
  // Unwrap params using React.use()
  const params = use(paramsPromise);
  const doctorId = params.id;

  const [doctor, setDoctor] = useState<DoctorData | null>(null);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSlot, setSelectedSlot] = useState<SlotData | null>(null);

  // Form Fields
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [phone, setPhone] = useState("");
  const [bloodGroup, setBloodGroup] = useState("O+");
  const [conditions, setConditions] = useState("");
  const [medications, setMedications] = useState("");

  // Booking Flow States
  const [bookingStep, setBookingStep] = useState<"slot-selection" | "details-form" | "confirmation">("slot-selection");
  const [bookingStatus, setBookingStatus] = useState<"idle" | "submitting" | "success" | "error">("idle");
  const [bookingError, setBookingError] = useState("");
  const [confirmedBooking, setConfirmedBooking] = useState<{ bookingId: string; datetime: string } | null>(null);

  useEffect(() => {
    async function fetchData() {
      if (!doctorId) return;
      setLoading(true);
      try {
        const [docRes, slotsRes] = await Promise.all([
          fetch(`/api/doctors/${doctorId}`),
          fetch(`/api/doctors/${doctorId}/slots`),
        ]);

        const docData = await docRes.json();
        const slotsData = await slotsRes.json();

        if (docData.success) setDoctor(docData.doctor);
        if (slotsData.success) setSlots(slotsData.slots);
      } catch (err) {
        console.error("Error fetching doctor/slots:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [doctorId]);

  // Group slots by date
  const slotsByDate: { [dateKey: string]: SlotData[] } = {};
  slots.forEach((slot) => {
    const d = new Date(slot.datetime);
    d.setHours(0, 0, 0, 0);
    const dateKey = d.toISOString();
    if (!slotsByDate[dateKey]) {
      slotsByDate[dateKey] = [];
    }
    slotsByDate[dateKey].push(slot);
  });

  const uniqueDates = Object.keys(slotsByDate).sort();
  const [selectedDateKey, setSelectedDateKey] = useState<string>("");

  useEffect(() => {
    if (uniqueDates.length > 0 && !selectedDateKey) {
      setSelectedDateKey(uniqueDates[0]);
    }
  }, [uniqueDates, selectedDateKey]);

  const handleBookSlot = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) return;

    setBookingStatus("submitting");
    setBookingError("");

    try {
      const response = await fetch("/api/book", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          doctorId: doctor?._id,
          slotId: selectedSlot._id,
          patientDetails: { name, age: Number(age), phone },
          healthSummary: { bloodGroup, conditions, medications },
        }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setConfirmedBooking({
          bookingId: data.booking.bookingId,
          datetime: data.booking.datetime,
        });
        setBookingStatus("success");
        setBookingStep("confirmation");
      } else {
        setBookingStatus("error");
        setBookingError(data.error || "An error occurred while booking. Please try again.");
      }
    } catch (err) {
      console.error("Booking submission error:", err);
      setBookingStatus("error");
      setBookingError("Connection error. Please check your internet connection.");
    }
  };

  if (loading) {
    return (
      <div className="page-container" style={{ display: "flex", justifyContent: "center", padding: "8rem 0" }}>
        <div className="loading-spinner"></div>
      </div>
    );
  }

  if (!doctor) {
    return (
      <div className="page-container" style={{ textAlign: "center", padding: "4rem 0" }}>
        <h2 style={{ marginBottom: "1rem" }}>Doctor Not Found</h2>
        <Link href="/" className="btn btn-primary">
          Back to Doctor Search
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container animate-fade-in" style={{ maxWidth: "800px" }}>
      {/* Doctor Summary Header */}
      <section className="glass-container" style={{ padding: "1.5rem", marginBottom: "2rem" }}>
        <div className="profile-header-grid">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={doctor.avatar}
            alt={doctor.name}
            style={{ width: "96px", height: "96px", borderRadius: "50%", objectFit: "cover", border: "3px solid var(--primary)" }}
          />
          <div>
            <span className="badge badge-available" style={{ marginBottom: "0.5rem" }}>
              {doctor.specialization}
            </span>
            <h1 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>{doctor.name}</h1>
            <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "0.5rem" }}>
              📍 {doctor.location} &nbsp;•&nbsp; ⭐ {doctor.rating.toFixed(1)} &nbsp;•&nbsp; {doctor.experience} Yrs Exp
            </p>
            <p style={{ color: "var(--secondary)", fontSize: "1.2rem", fontWeight: "700" }}>
              ₹{doctor.consultationFee} <span style={{ fontSize: "0.85rem", color: "var(--text-muted)", fontWeight: "normal" }}>fee per consultation</span>
            </p>
          </div>
        </div>
        <div style={{ marginTop: "1rem", borderTop: "1px solid var(--border-light)", paddingTop: "1rem" }}>
          <h3 style={{ fontSize: "1rem", marginBottom: "0.4rem" }}>About</h3>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem", lineHeight: "1.6" }}>{doctor.about}</p>
        </div>
      </section>

      {/* Booking Wizard */}
      {bookingStep === "slot-selection" && (
        <section className="glass-container" style={{ padding: "1.5rem" }}>
          <h2 style={{ fontSize: "1.3rem", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.75rem" }}>
            Select Appointment Slot
          </h2>

          {/* Date Selector Tabs */}
          {uniqueDates.length === 0 ? (
            <p style={{ color: "var(--text-muted)", textAlign: "center", padding: "2rem" }}>
              No available slots found for the next 7 days. The doctor might be fully booked or on leave.
            </p>
          ) : (
            <>
              <div className="date-tabs-container">
                {uniqueDates.map((dateKey) => (
                  <button
                    key={dateKey}
                    onClick={() => {
                      setSelectedDateKey(dateKey);
                      setSelectedSlot(null); // Reset slot selection on date change
                    }}
                    className={`date-tab ${selectedDateKey === dateKey ? "active" : ""}`}
                  >
                    <span>{formatDate(dateKey).split(",")[0]}</span>
                    <strong>{formatDate(dateKey).split(",")[1]}</strong>
                  </button>
                ))}
              </div>

              {/* Time Slots for Selected Date */}
              {selectedDateKey && (
                <div style={{ marginTop: "1.5rem" }}>
                  <h4 style={{ fontSize: "0.9rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
                    Available Times for {formatDate(selectedDateKey)}
                  </h4>
                  <div className="slots-grid">
                    {slotsByDate[selectedDateKey].map((slot) => (
                      <button
                        key={slot._id}
                        onClick={() => setSelectedSlot(slot)}
                        className={`slot-btn ${selectedSlot?._id === slot._id ? "active" : ""}`}
                      >
                        {formatTime(slot.datetime)}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Next Step Action */}
              <div style={{ marginTop: "2rem", borderTop: "1px solid var(--border-light)", paddingTop: "1.25rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  {selectedSlot ? (
                    <p style={{ fontSize: "0.95rem" }}>
                      Selected: <strong style={{ color: "var(--secondary)" }}>{formatDate(selectedSlot.datetime)} at {formatTime(selectedSlot.datetime)}</strong>
                    </p>
                  ) : (
                    <p style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>Please choose a time slot</p>
                  )}
                </div>
                <button
                  disabled={!selectedSlot}
                  onClick={() => setBookingStep("details-form")}
                  className="btn btn-primary"
                >
                  Continue
                </button>
              </div>
            </>
          )}
        </section>
      )}

      {bookingStep === "details-form" && selectedSlot && (
        <section className="glass-container animate-slide-up" style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.25rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.75rem" }}>
            <h2 style={{ fontSize: "1.3rem" }}>Patient &amp; Medical Details</h2>
            <button
              onClick={() => setBookingStep("slot-selection")}
              className="btn btn-secondary"
              style={{ padding: "0.4rem 0.8rem", fontSize: "0.85rem" }}
            >
              Change Slot
            </button>
          </div>

          <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "1.5rem" }}>
            Slot: <strong style={{ color: "var(--secondary)" }}>{formatDate(selectedSlot.datetime)} at {formatTime(selectedSlot.datetime)}</strong>
          </p>

          <form onSubmit={handleBookSlot}>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-row-2">
              <div className="input-group">
                <label className="input-label">Patient Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Age</label>
                <input
                  type="number"
                  required
                  min="1"
                  max="120"
                  placeholder="e.g. 28"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  className="input-field"
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-row-2">
              <div className="input-group">
                <label className="input-label">Phone Number</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  placeholder="10-digit number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="input-field"
                />
              </div>

              <div className="input-group">
                <label className="input-label">Blood Group</label>
                <select
                  value={bloodGroup}
                  onChange={(e) => setBloodGroup(e.target.value)}
                  className="input-field"
                >
                  {["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"].map((bg) => (
                    <option key={bg} value={bg} style={{ background: "#1f2937" }}>
                      {bg}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="input-group">
              <label className="input-label">Known Medical Conditions (Optional)</label>
              <textarea
                placeholder="e.g. Hypertension, Diabetes, Asthma (leave blank if none)"
                value={conditions}
                onChange={(e) => setConditions(e.target.value)}
                className="input-field"
                style={{ resize: "vertical", minHeight: "60px" }}
              />
            </div>

            <div className="input-group">
              <label className="input-label">Current Medications (Optional)</label>
              <textarea
                placeholder="e.g. Metformin 500mg daily, Lipitor (leave blank if none)"
                value={medications}
                onChange={(e) => setMedications(e.target.value)}
                className="input-field"
                style={{ resize: "vertical", minHeight: "60px" }}
              />
            </div>

            {bookingStatus === "error" && (
              <div className="alert-error" style={{ marginBottom: "1.5rem" }}>
                ⚠️ {bookingError}
              </div>
            )}

            <div style={{ display: "flex", gap: "1rem", marginTop: "2rem" }}>
              <button
                type="button"
                onClick={() => setBookingStep("slot-selection")}
                className="btn btn-secondary"
                style={{ flex: 1 }}
                disabled={bookingStatus === "submitting"}
              >
                Back
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                style={{ flex: 2 }}
                disabled={bookingStatus === "submitting"}
              >
                {bookingStatus === "submitting" ? "Securing Slot..." : `Book Appointment (₹${doctor.consultationFee})`}
              </button>
            </div>
          </form>
        </section>
      )}

      {bookingStep === "confirmation" && confirmedBooking && (
        <section className="glass-container animate-slide-up" style={{ padding: "2.5rem 1.5rem", textAlign: "center" }}>
          {/* Confirmed Banner */}
          <div style={{ width: "72px", height: "72px", borderRadius: "50%", background: "rgba(16, 185, 129, 0.15)", border: "2px solid var(--success)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 1.5rem auto" }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="var(--success)"
              strokeWidth="3"
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ width: "32px", height: "32px" }}
            >
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>

          <h2 style={{ fontSize: "1.75rem", marginBottom: "0.5rem" }}>Appointment Confirmed!</h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.95rem", marginBottom: "2rem" }}>
            Your booking has been secured. Your physician has been notified.
          </p>

          <div className="glass-card" style={{ textAlign: "left", display: "flex", flexDirection: "column", gap: "0.8rem", maxWidth: "480px", margin: "0 auto 2rem auto", background: "rgba(255,255,255,0.015)" }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Booking ID:</span>
              <strong style={{ color: "var(--secondary)", fontSize: "1.1rem", fontFamily: "monospace" }}>{confirmedBooking.bookingId}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Doctor:</span>
              <strong style={{ color: "#ffffff" }}>{doctor.name}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Specialty:</span>
              <strong style={{ color: "#ffffff" }}>{doctor.specialization}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Date &amp; Time:</span>
              <strong style={{ color: "#ffffff" }}>{formatDate(confirmedBooking.datetime)} at {formatTime(confirmedBooking.datetime)}</strong>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ color: "var(--text-muted)" }}>Consultation Fee:</span>
              <strong style={{ color: "var(--success)" }}>Paid (₹{doctor.consultationFee})</strong>
            </div>
          </div>

          <div style={{ display: "flex", gap: "1rem", maxWidth: "480px", margin: "0 auto" }}>
            <Link href="/" className="btn btn-secondary" style={{ flex: 1 }}>
              Back to Home
            </Link>
          </div>
        </section>
      )}

      {/* Embedded Component Styles */}
      <style jsx global>{`
        .profile-header-grid {
          display: grid;
          grid-template-columns: auto 1fr;
          gap: 1.5rem;
          align-items: center;
        }

        .date-tabs-container {
          display: flex;
          gap: 0.6rem;
          overflow-x: auto;
          padding-bottom: 0.5rem;
          scrollbar-width: thin;
        }

        .date-tab {
          display: flex;
          flex-direction: column;
          align-items: center;
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-md);
          padding: 0.6rem 1rem;
          cursor: pointer;
          min-width: 80px;
          color: var(--text-muted);
          transition: all 0.2s ease;
        }

        .date-tab:hover {
          border-color: rgba(255, 255, 255, 0.15);
          background: rgba(255, 255, 255, 0.04);
        }

        .date-tab.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: var(--primary);
          color: #ffffff;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.2);
        }

        .date-tab span {
          font-size: 0.75rem;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          margin-bottom: 0.2rem;
        }

        .date-tab strong {
          font-size: 0.95rem;
        }

        .slots-grid {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(100px, 1fr));
          gap: 0.6rem;
        }

        .slot-btn {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-light);
          border-radius: var(--radius-sm);
          color: var(--text-main);
          padding: 0.5rem;
          font-size: 0.85rem;
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .slot-btn:hover {
          background: rgba(255, 255, 255, 0.06);
          border-color: var(--border-hover);
        }

        .slot-btn.active {
          background: linear-gradient(135deg, var(--primary), var(--secondary));
          border-color: transparent;
          color: #ffffff;
          box-shadow: 0 4px 10px var(--primary-glow);
        }

        .alert-error {
          background: rgba(239, 68, 68, 0.1);
          border: 1px solid var(--danger);
          border-radius: var(--radius-sm);
          color: #fca5a5;
          padding: 0.75rem 1rem;
          font-size: 0.9rem;
        }

        .loading-spinner {
          width: 40px;
          height: 40px;
          border: 3px solid rgba(255, 255, 255, 0.1);
          border-radius: 50%;
          border-top-color: var(--primary);
          animation: spin 1s ease-in-out infinite;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }

        @media (max-width: 580px) {
          .profile-header-grid {
            grid-template-columns: 1fr;
            text-align: center;
            justify-items: center;
          }
          .form-row-2 {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }
        }
      `}</style>
    </div>
  );
}
