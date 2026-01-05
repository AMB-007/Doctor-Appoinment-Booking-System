import React, { useEffect, useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./PatientDashboard.css";

const API = "http://localhost:5000/api";

/* ---------------- Icons ---------------- */
const HomeIcon = () => <span className="icon">🏠</span>;
const UserIcon = () => <span className="icon">👤</span>;
const CalendarIcon = () => <span className="icon">📅</span>;
const LogoutIcon = () => <span className="icon">⎋</span>;
const PlusIcon = () => <span className="icon">＋</span>;

/* ---------------- Utils ---------------- */
const formatDisplayDate = (dateString) => {
  if (!dateString) return "N/A";
  const d = new Date(dateString + "T00:00:00");
  return d.toLocaleDateString("en-US", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
};

const StatusBadge = ({ status }) => {
  const s = (status || "").toLowerCase();
  let cls = "badge";
  if (s === "confirmed" || s === "approved") cls += " success";
  else if (s === "pending") cls += " pending";
  else if (s === "rejected") cls += " danger";
  return <span className={cls}>{status}</span>;
};

/* ---------------- Mini Calendar ---------------- *//*
const MiniCalendar = ({ leaves }) => {
  const today = new Date();
  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const days = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();

  const leaveSet = useMemo(
    () => new Set(leaves.map((l) => l.date)),
    [leaves]
  );

  return (
    <div className="mini-cal">
      <h4>Doctor Leave Days</h4>
      <div className="cal-grid">
        {Array.from({ length: days }).map((_, i) => {
          const d = new Date(
            today.getFullYear(),
            today.getMonth(),
            i + 1
          );
          const key = d.toISOString().slice(0, 10);
          return (
            <div
              key={i}
              className={`cal-day ${leaveSet.has(key) ? "off" : ""}`}
            >
              {i + 1}
            </div>
          );
        })}
      </div>
    </div>
  );
};/*

/* ---------------- Component ---------------- */
export default function PatientDashboardV2() {
  const navigate = useNavigate();
  const [user] = useState(() =>
    JSON.parse(localStorage.getItem("user"))
  );
  const [tab, setTab] = useState("home");
  const [appointments, setAppointments] = useState([]);
  const [leaves, setLeaves] = useState([]);
  const [doctors, setDoctors] = useState({});

  useEffect(() => {
    if (!user) navigate("/login");
    loadData();
  }, []);

  const loadData = async () => {
    const token = localStorage.getItem("token");
    const headers = { Authorization: `Bearer ${token}` };

    const [docRes, leaveRes, apptRes] = await Promise.all([
      axios.get(`${API}/doctors`, { headers }),
      axios.get(`${API}/doctors/leaves`, { headers }),
      axios.get(`${API}/appointments`, {
        params: { patient_id: user.id },
        headers,
      }),
    ]);

    const map = {};
    docRes.data.forEach((d) => (map[d.id] = d.name));
    setDoctors(map);
    setLeaves(leaveRes.data || []);
    setAppointments(apptRes.data || []);
  };

  const stats = useMemo(
    () => ({
      upcoming: appointments.filter((a) =>
        ["pending", "confirmed"].includes(
          (a.status || "").toLowerCase()
        )
      ).length,
      completed: appointments.filter(
        (a) => (a.status || "").toLowerCase() === "completed"
      ).length,
    }),
    [appointments]
  );

  const logout = () => {
    localStorage.clear();
    navigate("/");
  };

  return (
    <div className="v2-layout">
     
      <div className="content-wrap">
        {/* NAV */}
        <aside className="side-nav">
          <button onClick={() => setTab("home")} className={tab==="home"?"active":""}><HomeIcon/>Dashboard</button>
          <button onClick={() => setTab("profile")} className={tab==="profile"?"active":""}><UserIcon/>Profile</button>
        </aside>

        {/* MAIN */}
        <main className="main-area">
          {tab === "home" && (
            <>
              <div className="stat-strip">
                <div className="stat">
                  <span>Upcoming</span>
                  <strong>{stats.upcoming}</strong>
                </div>
                <div className="stat">
                  <span>Completed</span>
                  <strong>{stats.completed}</strong>
                </div>
                <button
                  className="primary"
                  onClick={() => navigate("/booking")}
                >
                  <PlusIcon /> New Booking
                </button>
              </div>

              <div className="grid">
                <section className="card">
                  <h3>Your Appointments</h3>
                  {appointments.length === 0 ? (
                    <p className="muted">No bookings yet.</p>
                  ) : (
                    <table>
                      <thead>
                        <tr>
                          <th>Doctor</th>
                          <th>Date</th>
                          <th>Time</th>
                          <th>Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {appointments.map((a, i) => (
                          <tr key={i}>
                            <td>{doctors[a.doctor_id]}</td>
                            <td>{formatDisplayDate(a.date)}</td>
                            <td>{a.slot_time}</td>
                            <td>
                              <StatusBadge status={a.status} />
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </section>

               
              </div>
            </>
          )}

          {tab === "profile" && (
            <div className="card">
              <h3>Profile</h3>
              <p><b>Name:</b> {user.name}</p>
              <p><b>Email:</b> {user.email}</p>
              <p className="muted"></p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
