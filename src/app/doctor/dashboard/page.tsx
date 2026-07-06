"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, formatTime } from "@/lib/utils";

interface PatientDetails {
  name: string;
  age: number;
  phone: string;
}

interface HealthSummary {
  bloodGroup: string;
  conditions: string;
  medications: string;
}

interface BookingData {
  _id: string;
  bookingId: string;
  datetime: string;
  patientDetails: PatientDetails;
  healthSummary: HealthSummary;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  consultationNotes?: {
    diagnosis: string;
    prescription: string;
    updatedAt: string;
  };
}

interface SlotData {
  _id: string;
  datetime: string;
  status: "available" | "booked" | "blocked";
  bookingId: string | null;
}

export default function DoctorDashboardPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<"appointments" | "schedule">("appointments");
  const [appointments, setAppointments] = useState<BookingData[]>([]);
  const [slots, setSlots] = useState<SlotData[]>([]);
  const [viewAllAppointments, setViewAllAppointments] = useState(false);
  const [loading, setLoading] = useState(true);

  // Health Summary Modal state
  const [selectedHealthSummary, setSelectedHealthSummary] = useState<HealthSummary | null>(null);
  const [summaryPatientName, setSummaryPatientName] = useState("");

  // Consultation notes editor state
  const [activeConsultationBookingId, setActiveConsultationBookingId] = useState<string | null>(null);
  const [diagnosis, setDiagnosis] = useState("");
  const [prescription, setPrescription] = useState("");
  const [updatingNotes, setUpdatingNotes] = useState(false);

  // Load dashboard data
  useEffect(() => {
    async function loadDashboardData() {
      try {
        setLoading(true);
        // Load appointments
        const apptRes = await fetch(`/api/doctor/appointments?all=${viewAllAppointments}`);
        if (apptRes.status === 401) {
          router.push("/doctor/login");
          return;
        }

        const apptData = await apptRes.json();
        if (apptData.success) {
          setAppointments(apptData.bookings);
        }

        // Load slots
        const slotsRes = await fetch("/api/doctor/slots");
        const slotsData = await slotsRes.json();
        if (slotsData.success) {
          setSlots(slotsData.slots);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    loadDashboardData();
  }, [viewAllAppointments, router]);

  const handleLogout = async () => {
    try {
      const res = await fetch("/api/doctor/logout", { method: "POST" });
      if (res.ok) {
        router.push("/doctor/login");
      }
    } catch (err) {
      console.error("Logout error:", err);
    }
  };

  // Submit consultation notes
  const handleSaveConsultation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConsultationBookingId || !diagnosis || !prescription) return;

    setUpdatingNotes(true);
    try {
      const res = await fetch("/api/doctor/appointments", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bookingId: activeConsultationBookingId,
          diagnosis,
          prescription,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Refresh appointments list
        setAppointments((prev) =>
          prev.map((appt) =>
            appt._id === activeConsultationBookingId
              ? {
                  ...appt,
                  status: "completed",
                  consultationNotes: {
                    diagnosis,
                    prescription,
                    updatedAt: new Date().toISOString(),
                  },
                }
              : appt
          )
        );
        setActiveConsultationBookingId(null);
        setDiagnosis("");
        setPrescription("");
      } else {
        alert(data.error || "Failed to save consultation details");
      }
    } catch (err) {
      console.error("Consultation update error:", err);
    } finally {
      setUpdatingNotes(false);
    }
  };

  // Toggle slot block/unblock status
  const handleToggleSlot = async (slotId: string, currentStatus: "available" | "blocked" | "booked") => {
    if (currentStatus === "booked") return;

    const action = currentStatus === "available" ? "block" : "unblock";

    try {
      const res = await fetch("/api/doctor/slots", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slotId, action }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        // Update slots array in state
        setSlots((prev) =>
          prev.map((s) => (s._id === slotId ? { ...s, status: data.slot.status } : s))
        );
      } else {
        alert(data.error || "Failed to update slot status");
      }
    } catch (err) {
      console.error("Slot update error:", err);
    }
  };

  // Group slots by date for scheduling view
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

  return (
    <div className="page-container animate-fade-in">
      {/* Dashboard Header */}
      <header className="dashboard-header" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "1rem" }}>
        <div>
          <h1 style={{ fontSize: "1.75rem" }}>Physician Dashboard</h1>
          <p style={{ color: "var(--text-muted)", fontSize: "0.9rem" }}>Manage patient consultations and schedule availability</p>
        </div>
        <button onClick={handleLogout} className="btn btn-secondary" style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}>
          Log Out
        </button>
      </header>

      {/* Tabs Switcher */}
      <div className="tabs-container" style={{ display: "flex", gap: "1rem", marginBottom: "2rem" }}>
        <button
          onClick={() => setActiveTab("appointments")}
          className={`tab-btn ${activeTab === "appointments" ? "active" : ""}`}
        >
          Consultations &amp; Bookings
        </button>
        <button
          onClick={() => setActiveTab("schedule")}
          className={`tab-btn ${activeTab === "schedule" ? "active" : ""}`}
        >
          Slot &amp; Leave Manager
        </button>
      </div>

      {loading ? (
        <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
          <div className="loading-spinner"></div>
        </div>
      ) : (
        <>
          {/* TAB 1: Appointments / Bookings */}
          {activeTab === "appointments" && (
            <div className="animate-slide-up">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }} className="appt-toggle-row">
                <h2 style={{ fontSize: "1.3rem" }}>
                  {viewAllAppointments ? "Consultation History" : "Today's Appointments"} ({appointments.length})
                </h2>
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>View Consultation History:</span>
                  <input
                    type="checkbox"
                    checked={viewAllAppointments}
                    onChange={(e) => setViewAllAppointments(e.target.checked)}
                    style={{ width: "18px", height: "18px", accentColor: "var(--primary)", cursor: "pointer" }}
                  />
                </div>
              </div>

              {appointments.length === 0 ? (
                <div className="glass-container" style={{ padding: "4rem 2rem", textAlign: "center" }}>
                  <p style={{ color: "var(--text-muted)", fontSize: "1rem" }}>
                    {viewAllAppointments
                      ? "No consultations found in your history."
                      : "No appointments scheduled for today."}
                  </p>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {appointments.map((appt) => (
                    <div key={appt._id} className="glass-card" style={{ padding: "1.5rem" }}>
                      <div className="appt-card-top" style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "0.75rem" }}>
                        <div>
                          <div style={{ display: "flex", gap: "0.8rem", alignItems: "center", marginBottom: "0.25rem" }}>
                            <h3 style={{ fontSize: "1.2rem" }}>{appt.patientDetails.name}</h3>
                            <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>({appt.patientDetails.age} Yrs, {appt.healthSummary.bloodGroup})</span>
                          </div>
                          <p style={{ color: "var(--text-muted)", fontSize: "0.85rem" }}>
                            🕒 {formatDate(appt.datetime)} at {formatTime(appt.datetime)} &nbsp;|&nbsp; ID: <strong style={{ color: "var(--secondary)", fontFamily: "monospace" }}>{appt.bookingId}</strong>
                          </p>
                        </div>
                        <span className={`badge ${appt.status === "completed" ? "badge-available" : "badge-booked"}`}>
                          {appt.status === "completed" ? "Completed" : "Confirmed"}
                        </span>
                      </div>

                      {/* Patient Contacts & Summary */}
                      <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "1rem" }}>
                        <span style={{ fontSize: "0.9rem", color: "var(--text-muted)" }}>
                          📞 {appt.patientDetails.phone}
                        </span>
                        <button
                          onClick={() => {
                            setSelectedHealthSummary(appt.healthSummary);
                            setSummaryPatientName(appt.patientDetails.name);
                          }}
                          className="btn btn-secondary"
                          style={{ padding: "0.25rem 0.6rem", fontSize: "0.75rem", borderRadius: "var(--radius-sm)" }}
                        >
                          👁️ View Health Summary
                        </button>
                      </div>

                      {/* Post-Consultation Notes */}
                      {appt.status === "confirmed" && activeConsultationBookingId !== appt._id && (
                        <button
                          onClick={() => {
                            setActiveConsultationBookingId(appt._id);
                            setDiagnosis(appt.consultationNotes?.diagnosis || "");
                            setPrescription(appt.consultationNotes?.prescription || "");
                          }}
                          className="btn btn-primary"
                          style={{ padding: "0.5rem 1rem", fontSize: "0.85rem" }}
                        >
                          ✍️ Add Consultation Notes
                        </button>
                      )}

                      {/* Notes Editor (Conditional) */}
                      {activeConsultationBookingId === appt._id && (
                        <form onSubmit={handleSaveConsultation} className="glass-container animate-fade-in" style={{ padding: "1.25rem", background: "rgba(0,0,0,0.2)", marginTop: "1rem" }}>
                          <h4 style={{ fontSize: "0.95rem", marginBottom: "1rem", color: "#ffffff" }}>Add Diagnosis &amp; Prescription</h4>
                          
                          <div className="input-group">
                            <label className="input-label">Diagnosis Notes</label>
                            <textarea
                              required
                              placeholder="e.g. Acute viral gastroenteritis. Patient advised light diet..."
                              value={diagnosis}
                              onChange={(e) => setDiagnosis(e.target.value)}
                              className="input-field"
                              style={{ minHeight: "80px", resize: "vertical" }}
                            />
                          </div>

                          <div className="input-group">
                            <label className="input-label">Prescription / Medications</label>
                            <textarea
                              required
                              placeholder="e.g. Tab. Paracetamol 650mg TDS x 3 days. ORS liquid ad libitum..."
                              value={prescription}
                              onChange={(e) => setPrescription(e.target.value)}
                              className="input-field"
                              style={{ minHeight: "80px", resize: "vertical" }}
                            />
                          </div>

                          <div style={{ display: "flex", gap: "0.75rem", marginTop: "1rem" }}>
                            <button
                              type="button"
                              onClick={() => {
                                setActiveConsultationBookingId(null);
                                setDiagnosis("");
                                setPrescription("");
                              }}
                              className="btn btn-secondary"
                              style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                            >
                              Cancel
                            </button>
                            <button
                              type="submit"
                              disabled={updatingNotes}
                              className="btn btn-success"
                              style={{ padding: "0.4rem 1rem", fontSize: "0.85rem" }}
                            >
                              {updatingNotes ? "Saving..." : "Submit Consultation"}
                            </button>
                          </div>
                        </form>
                      )}

                      {/* Display Notes if Completed */}
                      {appt.status === "completed" && appt.consultationNotes && (
                        <div className="glass-container" style={{ padding: "1rem", background: "rgba(16, 185, 129, 0.03)", border: "1px solid rgba(16, 185, 129, 0.15)", marginTop: "1rem" }}>
                          <h4 style={{ fontSize: "0.9rem", color: "var(--success)", marginBottom: "0.5rem" }}>Consultation Notes Summary</h4>
                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="form-row-2">
                            <div>
                              <strong style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Diagnosis</strong>
                              <p style={{ fontSize: "0.9rem", color: "var(--text-main)", whiteSpace: "pre-line", marginTop: "0.2rem" }}>{appt.consultationNotes.diagnosis}</p>
                            </div>
                            <div>
                              <strong style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Prescription</strong>
                              <p style={{ fontSize: "0.9rem", color: "var(--text-main)", whiteSpace: "pre-line", marginTop: "0.2rem" }}>{appt.consultationNotes.prescription}</p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* TAB 2: Schedule / Slots Management */}
          {activeTab === "schedule" && (
            <div className="animate-slide-up">
              <h2 style={{ fontSize: "1.3rem", marginBottom: "1.5rem" }}>
                7-Day Availability &amp; Leave Planner
              </h2>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                {uniqueDates.map((dateKey) => (
                  <div key={dateKey} className="glass-container" style={{ padding: "1.25rem" }}>
                    <h3 style={{ fontSize: "1rem", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.5rem", marginBottom: "1rem", color: "#ffffff" }}>
                      📅 {formatDate(dateKey)}
                    </h3>

                    <div className="slots-grid-dash">
                      {slotsByDate[dateKey].map((slot) => {
                        let btnClass = "btn-secondary";
                        let labelText = "Available";
                        let btnActionLabel = "Block";

                        if (slot.status === "booked") {
                          btnClass = "btn-success-disabled";
                          labelText = "Booked";
                          btnActionLabel = "Locked";
                        } else if (slot.status === "blocked") {
                          btnClass = "btn-danger-outline";
                          labelText = "Blocked";
                          btnActionLabel = "Unblock";
                        }

                        return (
                          <div key={slot._id} className="slot-dash-card" style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "0.5rem", padding: "0.75rem", background: "rgba(0,0,0,0.15)", borderRadius: "var(--radius-sm)", border: "1px solid rgba(255,255,255,0.03)" }}>
                            <span style={{ fontSize: "0.9rem", fontWeight: "600" }}>{formatTime(slot.datetime)}</span>
                            <span className={`badge ${slot.status === "available" ? "badge-available" : slot.status === "blocked" ? "badge-blocked" : "badge-booked"}`} style={{ fontSize: "0.65rem", padding: "0.1rem 0.4rem" }}>
                              {labelText}
                            </span>
                            
                            <button
                              disabled={slot.status === "booked"}
                              onClick={() => handleToggleSlot(slot._id, slot.status)}
                              className={`btn-dash-action ${slot.status === "available" ? "block-btn" : slot.status === "blocked" ? "unblock-btn" : "locked-btn"}`}
                            >
                              {btnActionLabel}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* HEALTH SUMMARY MODAL */}
      {selectedHealthSummary && (
        <div className="modal-backdrop animate-fade-in">
          <div className="glass-container modal-content animate-slide-up" style={{ maxWidth: "480px", width: "90%", padding: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid var(--border-light)", paddingBottom: "0.75rem", marginBottom: "1rem" }}>
              <h3 style={{ fontSize: "1.2rem" }}>Health Summary</h3>
              <button
                onClick={() => {
                  setSelectedHealthSummary(null);
                  setSummaryPatientName("");
                }}
                className="btn-close"
              >
                ✕
              </button>
            </div>

            <p style={{ fontSize: "0.95rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              Patient: <strong style={{ color: "#ffffff" }}>{summaryPatientName}</strong>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <div>
                <strong style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Blood Group</strong>
                <p style={{ fontSize: "1rem", color: "var(--secondary)", fontWeight: "700", marginTop: "0.2rem" }}>
                  {selectedHealthSummary.bloodGroup}
                </p>
              </div>

              <div>
                <strong style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Known Medical Conditions</strong>
                <p style={{ fontSize: "0.9rem", color: "var(--text-main)", whiteSpace: "pre-line", marginTop: "0.2rem" }}>
                  {selectedHealthSummary.conditions || "No known medical conditions declared."}
                </p>
              </div>

              <div>
                <strong style={{ fontSize: "0.8rem", color: "var(--text-muted)", textTransform: "uppercase" }}>Current Medications</strong>
                <p style={{ fontSize: "0.9rem", color: "var(--text-main)", whiteSpace: "pre-line", marginTop: "0.2rem" }}>
                  {selectedHealthSummary.medications || "No current medications declared."}
                </p>
              </div>
            </div>

            <div style={{ marginTop: "1.5rem", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => {
                  setSelectedHealthSummary(null);
                  setSummaryPatientName("");
                }}
                className="btn btn-secondary"
                style={{ padding: "0.4rem 1.25rem", fontSize: "0.85rem" }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Embedded Dashboard CSS */}
      <style jsx global>{`
        .tab-btn {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid var(--border-light);
          color: var(--text-muted);
          padding: 0.6rem 1.25rem;
          border-radius: var(--radius-sm);
          font-weight: 600;
          font-family: var(--font-display);
          cursor: pointer;
          transition: all 0.2s ease;
        }

        .tab-btn:hover {
          background: rgba(255, 255, 255, 0.05);
          color: #ffffff;
        }

        .tab-btn.active {
          background: rgba(59, 130, 246, 0.15);
          border-color: var(--primary);
          color: #ffffff;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.15);
        }

        .slots-grid-dash {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(130px, 1fr));
          gap: 1rem;
        }

        .btn-dash-action {
          width: 100%;
          border: none;
          border-radius: var(--radius-sm);
          padding: 0.3rem 0.5rem;
          font-size: 0.75rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          text-align: center;
        }

        .block-btn {
          background: rgba(239, 68, 68, 0.15);
          color: #fca5a5;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }
        .block-btn:hover {
          background: var(--danger);
          color: #ffffff;
        }

        .unblock-btn {
          background: rgba(16, 185, 129, 0.15);
          color: #a7f3d0;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .unblock-btn:hover {
          background: var(--success);
          color: #ffffff;
        }

        .locked-btn {
          background: rgba(255, 255, 255, 0.03);
          color: rgba(255, 255, 255, 0.2);
          border: 1px solid rgba(255, 255, 255, 0.05);
          cursor: not-allowed;
        }

        .modal-backdrop {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.6);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 200;
        }

        .modal-content {
          animation: slideUp 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .btn-close {
          background: transparent;
          border: none;
          color: var(--text-muted);
          font-size: 1.2rem;
          cursor: pointer;
          transition: color 0.2s ease;
        }
        .btn-close:hover {
          color: #ffffff;
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
          .appt-toggle-row {
            flex-direction: column;
            align-items: flex-start !important;
            gap: 0.75rem;
          }
          .form-row-2 {
            grid-template-columns: 1fr !important;
            gap: 0.5rem !important;
          }
        }
      `}</style>
    </div>
  );
}
