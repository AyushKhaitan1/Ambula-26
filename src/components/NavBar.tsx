"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";

export default function NavBar() {
  const pathname = usePathname();
  const [isDocLoggedIn, setIsDocLoggedIn] = useState(false);

  useEffect(() => {
    // Check if the doctor is logged in (using document.cookie check or simple API)
    const checkLogin = () => {
      const loggedIn = document.cookie.includes("doctor_token=");
      setIsDocLoggedIn(loggedIn);
    };

    checkLogin();
    // Set up listener for custom event or periodic check
    window.addEventListener("focus", checkLogin);
    return () => window.removeEventListener("focus", checkLogin);
  }, [pathname]);

  return (
    <nav className="navbar">
      <Link href="/" className="nav-logo">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ width: "24px", height: "24px", color: "var(--primary)" }}
        >
          <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
          <path d="M12 5v14" />
          <path d="M5 12h14" />
        </svg>
        <span>AmbulaCare</span>
      </Link>

      <div className="nav-links">
        <Link href="/" className={`nav-link ${pathname === "/" ? "active" : ""}`}>
          Find Doctor
        </Link>
        {isDocLoggedIn ? (
          <Link
            href="/doctor/dashboard"
            className={`nav-link ${pathname.startsWith("/doctor") ? "active" : ""}`}
          >
            Doctor Dashboard
          </Link>
        ) : (
          <Link
            href="/doctor/login"
            className={`nav-link ${pathname.startsWith("/doctor") ? "active" : ""}`}
          >
            Doctor Portal
          </Link>
        )}
      </div>
    </nav>
  );
}
