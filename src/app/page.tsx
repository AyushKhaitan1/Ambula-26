"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

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

export default function HomePage() {
  const [doctors, setDoctors] = useState<DoctorData[]>([]);
  const [specialization, setSpecialization] = useState("all");
  const [location, setLocation] = useState("all");
  const [loading, setLoading] = useState(true);

  // Specialties and locations for filter dropdowns
  const specializations = ["all", "Cardiologist", "Dermatologist", "Pediatrician", "General Physician"];
  const locations = ["all", "Bangalore", "Delhi", "Mumbai"];

  useEffect(() => {
    async function fetchDoctors() {
      setLoading(true);
      try {
        const query = new URLSearchParams();
        if (specialization !== "all") query.set("specialization", specialization);
        if (location !== "all") query.set("location", location);

        const response = await fetch(`/api/doctors?${query.toString()}`);
        const data = await response.json();
        if (data.success) {
          setDoctors(data.doctors);
        }
      } catch (error) {
        console.error("Error fetching doctors:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchDoctors();
  }, [specialization, location]);

  return (
    <div className="page-container animate-fade-in">
      {/* Hero Section */}
      <header style={{ textAlign: "center", marginBottom: "3rem" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "1rem", lineHeight: "1.2" }}>
          Find the Right Doctor, <span style={{ color: "var(--primary)" }}>Book in 2 Minutes</span>
        </h1>
        <p style={{ color: "var(--text-muted)", maxWidth: "600px", margin: "0 auto", fontSize: "1.1rem" }}>
          Connect with trusted healthcare professionals. Enter details, select your slot, and confirm instantly.
        </p>
      </header>

      {/* Search Filters Bar */}
      <section className="glass-container" style={{ padding: "1.5rem", marginBottom: "2.5rem" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1rem" }} className="filter-grid">
          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Specialization</label>
            <select
              value={specialization}
              onChange={(e) => setSpecialization(e.target.value)}
              className="input-field"
              style={{ appearance: "none", backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"white\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
            >
              {specializations.map((spec) => (
                <option key={spec} value={spec} style={{ background: "#1f2937" }}>
                  {spec === "all" ? "All Specializations" : spec}
                </option>
              ))}
            </select>
          </div>

          <div className="input-group" style={{ marginBottom: 0 }}>
            <label className="input-label">Location</label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="input-field"
              style={{ appearance: "none", backgroundImage: "url('data:image/svg+xml;utf8,<svg fill=\"white\" height=\"24\" viewBox=\"0 0 24 24\" width=\"24\" xmlns=\"http://www.w3.org/2000/svg\"><path d=\"M7 10l5 5 5-5z\"/></svg>')", backgroundRepeat: "no-repeat", backgroundPosition: "right 10px center" }}
            >
              {locations.map((loc) => (
                <option key={loc} value={loc} style={{ background: "#1f2937" }}>
                  {loc === "all" ? "All Locations" : loc}
                </option>
              ))}
            </select>
          </div>
        </div>
      </section>

      {/* Doctors List */}
      <section>
        <h2 style={{ fontSize: "1.5rem", marginBottom: "1.5rem", fontFamily: "var(--font-display)" }}>
          Available Doctors ({doctors.length})
        </h2>

        {loading ? (
          <div style={{ display: "flex", justifyContent: "center", padding: "4rem 0" }}>
            <div className="loading-spinner"></div>
          </div>
        ) : doctors.length === 0 ? (
          <div className="glass-container animate-slide-up" style={{ padding: "4rem 2rem", textAlign: "center" }}>
            <p style={{ color: "var(--text-muted)", fontSize: "1.1rem" }}>
              No doctors found matching your criteria. Try adjusting the filters.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "1.5rem" }}>
            {doctors.map((doctor) => (
              <div key={doctor._id} className="glass-card animate-slide-up" style={{ display: "flex", flexDirection: "column", height: "100%" }}>
                {/* Profile Header */}
                <div style={{ display: "flex", gap: "1rem", alignItems: "center", marginBottom: "1rem" }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={doctor.avatar}
                    alt={doctor.name}
                    style={{ width: "64px", height: "64px", borderRadius: "50%", objectFit: "cover", border: "2px solid var(--primary-glow)" }}
                  />
                  <div>
                    <h3 style={{ fontSize: "1.15rem", marginBottom: "0.2rem" }}>{doctor.name}</h3>
                    <span className="badge badge-available" style={{ fontSize: "0.7rem", padding: "0.15rem 0.5rem" }}>
                      {doctor.specialization}
                    </span>
                  </div>
                </div>

                {/* Body Details */}
                <div style={{ flex: 1, fontSize: "0.9rem", color: "var(--text-muted)", display: "flex", flexDirection: "column", gap: "0.4rem", marginBottom: "1.25rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Experience:</span>
                    <strong style={{ color: "#ffffff" }}>{doctor.experience} Years</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Location:</span>
                    <strong style={{ color: "#ffffff" }}>{doctor.location}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span>Rating:</span>
                    <strong style={{ color: "var(--warning)" }}>⭐ {doctor.rating.toFixed(1)}</strong>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", marginTop: "0.4rem", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.4rem" }}>
                    <span>Consultation Fee:</span>
                    <strong style={{ color: "var(--secondary)", fontSize: "1.05rem" }}>₹{doctor.consultationFee}</strong>
                  </div>
                </div>

                {/* Action button */}
                <Link href={`/profile/${doctor._id}`} className="btn btn-primary" style={{ width: "100%", padding: "0.6rem" }}>
                  Book Appointment
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Embedded Spinner Styles */}
      <style jsx global>{`
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
          .filter-grid {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </div>
  );
}
