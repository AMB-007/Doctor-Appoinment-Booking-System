import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import './DoctorDashboard.css';

const API = 'http://localhost:5000/api';

// --- Icons ---
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path></svg>;
const BellIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"></path><path d="M13.73 21a2 2 0 0 1-3.46 0"></path></svg>;
const CalendarIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect><line x1="16" y1="2" x2="16" y2="6"></line><line x1="8" y1="2" x2="8" y2="6"></line><line x1="3" y1="10" x2="21" y2="10"></line></svg>;
const LogoutIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path><polyline points="16 17 21 12 16 7"></polyline></svg>;
const SettingsIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="3"></circle><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"></path></svg>;
const ChevronLeft = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRight = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const CheckIcon = () => <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"></polyline></svg>;

const Avatar = ({ name }) => <div className="avatar">{name ? name.substring(0, 2).toUpperCase() : "DR"}</div>;
const StatusBadge = ({ status }) => <span className={`status-badge ${(status||'').toLowerCase()}`}>{status}</span>;

// --- SAFE DATE UTILITY ---
const toDateStr = (date) => {
    if (!date) return null;
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

const getDaysInMonth = (date) => new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
const getFirstDayOfMonth = (date) => new Date(date.getFullYear(), date.getMonth(), 1).getDay();

export default function DoctorDashboard({ user, onLogout }) {
  const [appointments, setAppointments] = useState([]);
  const [activeView, setActiveView] = useState('dashboard');
  
  // Multi-Leave State
  const [calDate, setCalDate] = useState(new Date()); 
  const [selectedLeaves, setSelectedLeaves] = useState([]); 
  const [confirmedLeaves, setConfirmedLeaves] = useState([]); 

  // Password State
  const [passData, setPassData] = useState({ current: '', new: '', confirm: '' });
  const [passMsg, setPassMsg] = useState({ type: '', text: '' });

  const doctorId = user?.id;

  // 1. Initial Data Load
  useEffect(() => {
    if (!doctorId) return;
    fetchData();
    fetchLeaveStatus();
    const int = setInterval(() => { fetchData(); fetchLeaveStatus(); }, 10000);
    return () => clearInterval(int);
  }, [doctorId]);

  const fetchData = async () => {
    try {
      const res = await axios.get(`${API}/appointments`, { params: { doctor_id: doctorId } });
      setAppointments(Array.isArray(res.data) ? res.data : []);
    } catch (e) { console.error(e); }
  };

  const fetchLeaveStatus = async () => {
    try {
        const res = await axios.get(`${API}/doctors/${doctorId}/leaves`);
        if (res.data && Array.isArray(res.data)) {
            setConfirmedLeaves(res.data.map(l => l.date));
        }
    } catch (e) { console.error(e); }
  };

  // 3. Actions
  const handleStatusChange = async (id, status) => {
    try {
        await axios.put(`${API}/appointments/${id}`, { status });
        // Instead of directly manipulating the array, we refresh the data source
        fetchData(); 
    } catch(err) { alert("Action failed"); }
  };

  // --- Password Update Logic ---
  const handlePasswordUpdate = async (e) => {
      e.preventDefault();
      setPassMsg({ type: '', text: '' });

      if (passData.new !== passData.confirm) {
          setPassMsg({ type: 'error', text: "New passwords do not match." });
          return;
      }
      if (passData.new.length < 6) {
          setPassMsg({ type: 'error', text: "Password must be at least 6 characters." });
          return;
      }

      try {
          const res = await axios.put(`${API}/auth/password`, {
              userId: user.id,
              currentPassword: passData.current,
              newPassword: passData.new
          });
          
          setPassMsg({ type: 'success', text: res.data.message || "Password updated successfully!" });
          setPassData({ current: '', new: '', confirm: '' });
      } catch (err) {
          const errMsg = err.response?.data?.message || err.response?.data?.error || "Failed to update password. Check current password.";
          setPassMsg({ type: 'error', text: errMsg });
      }
  };

  // --- Multi-Select Calendar Logic ---
  const handleDateClick = (day) => {
      const clickedDate = new Date(calDate.getFullYear(), calDate.getMonth(), day, 12, 0, 0);
      const dateStr = toDateStr(clickedDate);
      const todayStr = toDateStr(new Date());
      
      if (dateStr < todayStr) return; 

      if (selectedLeaves.includes(dateStr)) {
          setSelectedLeaves(selectedLeaves.filter(d => d !== dateStr));
      } else {
          setSelectedLeaves([...selectedLeaves, dateStr]);
      }
  };

  const submitLeaves = async () => {
      if (selectedLeaves.length === 0) return alert("Please select at least one date.");
      try {
          for (const date of selectedLeaves) {
              await axios.put(`${API}/doctors/${doctorId}/leave`, { date: date, is_on_leave: true });
          }
          alert(`Leaves applied successfully!`);
          setSelectedLeaves([]);
          fetchLeaveStatus();
      } catch (err) {
          alert("Failed to update leaves.");
      }
  };

  const handleClearAllLeaves = async () => {
    if(!window.confirm("Clear ALL upcoming leaves?")) return;
    try {
        await axios.put(`${API}/doctors/${doctorId}/leave`, { date: null, is_on_leave: false });
        fetchLeaveStatus();
        alert("All leaves cleared.");
    } catch(err) { alert("Failed to clear leaves"); }
  };

  const stats = useMemo(() => ({
    total: appointments.length,
    cancelled: appointments.filter(a => (a.status||'').toLowerCase() === 'cancelled').length,
    pending: appointments.filter(a => (a.status||'').toLowerCase() === 'pending')
  }), [appointments]);

  const daysInMonth = getDaysInMonth(calDate);
  const startDay = getFirstDayOfMonth(calDate);
  const calendarDays = Array(startDay).fill(null).concat([...Array(daysInMonth).keys()].map(i => i + 1));

  return (
    <div className="doc-layout">
      {/* Sidebar */}
      <aside className="doc-sidebar">
        <div className="sidebar-brand">
            <div className="brand-logo">⚕️</div>
            <h3>MedBook</h3>
        </div>
        <nav className="sidebar-menu">
            <button className={`menu-item ${activeView === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveView('dashboard')}><HomeIcon /> <span>Dashboard</span></button>
            <button className={`menu-item ${activeView === 'requests' ? 'active' : ''}`} onClick={() => setActiveView('requests')}><BellIcon /> <span>Requests</span>{stats.pending.length > 0 && <span className="notification-badge">{stats.pending.length}</span>}</button>
            <button className={`menu-item ${activeView === 'leaves' ? 'active' : ''}`} onClick={() => setActiveView('leaves')}><CalendarIcon /> <span>Leave Calendar</span></button>
            <button className={`menu-item ${activeView === 'settings' ? 'active' : ''}`} onClick={() => setActiveView('settings')}><SettingsIcon /> <span>Settings</span></button>
        </nav>
        <div className="sidebar-footer">
            <div className="user-mini-profile"><Avatar name={user?.name} /><div className="user-info"><p className="user-name">{user?.name}</p><p className="user-role">Doctor</p></div></div>
            <button onClick={onLogout} className="btn-logout"><LogoutIcon /></button>
        </div>
      </aside>

      <main className="doc-main">
        <header className="page-header">
            <h2>{activeView === 'dashboard' ? 'Dashboard Overview' : activeView === 'requests' ? 'Appointment Requests' : activeView === 'leaves' ? 'Leave Management' : 'Settings'}</h2>
            <div className="header-date">{new Date().toDateString()}</div>
        </header>

        <div className="content-area">
            {/* VIEW: DASHBOARD */}
            {activeView === 'dashboard' && (
                <div className="dashboard-view">
                    <div className="stats-container">
                        <div className="stat-box purple"><div className="stat-icon">📅</div><div className="stat-info"><h4>Total Appointments</h4><h2>{stats.total}</h2></div></div>
                        <div className="stat-box orange"><div className="stat-icon">⏳</div><div className="stat-info"><h4>Pending Requests</h4><h2>{stats.pending.length}</h2></div></div>
                        <div className="stat-box red"><div className="stat-icon">❌</div><div className="stat-info"><h4>Cancelled</h4><h2>{stats.cancelled}</h2></div></div>
                    </div>
                    <div className="recent-section">
                        <div className="section-title"><h3>All Appointments</h3></div>
                        <div className="table-wrapper">
                            <table className="doc-table">
                                <thead>
                                    <tr>
                                        <th>Patient</th>
                                        <th>Age</th>
                                        <th>Date & Time</th>
                                        <th>Status</th>
                                        <th>Action</th> {/* NEW: Action Column */}
                                    </tr>
                                </thead>
                                <tbody>
                                    {appointments.length === 0 ? <tr><td colSpan="5" style={{textAlign:'center', padding:'20px'}}>No appointments found</td></tr> : 
                                    appointments.map(appt => (
                                        <tr key={appt.id}>
                                            <td><div className="patient-cell"><Avatar name={appt.patient_name} /><span>{appt.patient_name}</span></div></td>
                                            <td>{appt.age || 'N/A'}</td>
                                            <td><div className="date-cell"><span className="date">{appt.date}</span><span className="time">{appt.slot_time}</span></div></td>
                                            <td><StatusBadge status={appt.status} /></td>
                                            <td>
                                                {/* Only show Mark Done button for Confirmed appointments */}
                                                {appt.status === 'Confirmed' && (
                                                    <button 
                                                        className="btn-mark-done" 
                                                        onClick={() => handleStatusChange(appt.id, 'Completed')}
                                                    >
                                                        <CheckIcon /> Mark Done
                                                    </button>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW: REQUESTS */}
            {activeView === 'requests' && (
                <div className="requests-view">
                    <div className="section-title"><h3>Incoming Requests</h3></div>
                    {stats.pending.length === 0 ? <div className="empty-state"><div className="empty-icon">✓</div><p>No pending requests.</p></div> : (
                        <div className="requests-grid">
                            {stats.pending.map(req => (
                                <div key={req.id} className="request-card">
                                    <div className="req-header"><Avatar name={req.patient_name} /><div><h4>{req.patient_name}</h4><span className="req-age">Age: {req.age || 'N/A'}</span></div></div>
                                    <div className="req-body">
                                        <div className="req-detail"><span>Date</span><strong>{req.date}</strong></div>
                                        <div className="req-detail"><span>Time</span><strong>{req.slot_time}</strong></div>
                                    </div>
                                    <div className="req-actions">
                                        <button className="btn-accept" onClick={() => handleStatusChange(req.id, 'Confirmed')}>Accept</button>
                                        <button className="btn-reject" onClick={() => handleStatusChange(req.id, 'Cancelled')}>Decline</button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* VIEW: LEAVES (MULTI-SELECT CALENDAR) */}
            {activeView === 'leaves' && (
                <div className="leaves-view">
                    <div className="leave-content-wrapper">
                        <div className="leave-status-panel">
                            <h3>Availability Status</h3>
                            <div className="instruction-text">
                                <p><strong>Upcoming Confirmed Leaves:</strong></p>
                                {confirmedLeaves.length > 0 ? (
                                    <div className="leaves-scroll-list">
                                        {confirmedLeaves.sort().map(d => (
                                            <span key={d} className="leave-tag">{d}</span>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="status-text-green">You have no upcoming leaves.</p>
                                )}
                                
                                {confirmedLeaves.length > 0 && (
                                    <button className="btn-text-red" onClick={handleClearAllLeaves} style={{marginTop: '20px'}}>
                                        Clear All Leaves
                                    </button>
                                )}
                            </div>
                            <hr style={{margin: '20px 0', border:'none', borderTop:'1px solid #eee'}}/>
                            <div className="instruction-text">
                                <p><strong>How to Add Leaves:</strong></p>
                                <ul>
                                    <li>Click dates on the calendar to select them (<span style={{color:'var(--primary)'}}>Blue</span>).</li>
                                    <li>Dates already booked are <span style={{color:'var(--danger)'}}>Red</span>.</li>
                                    <li>Click "Apply Selected Leaves" to confirm.</li>
                                </ul>
                            </div>
                        </div>

                        <div className="leave-calendar-widget">
                            <div className="cal-top">
                                <button onClick={()=>setCalDate(new Date(calDate.getFullYear(), calDate.getMonth()-1, 1))}><ChevronLeft/></button>
                                <span>{calDate.toLocaleString('default',{month:'long', year:'numeric'})}</span>
                                <button onClick={()=>setCalDate(new Date(calDate.getFullYear(), calDate.getMonth()+1, 1))}><ChevronRight/></button>
                            </div>
                            <div className="cal-days-head">
                                {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d=><div key={d}>{d}</div>)}
                            </div>
                            <div className="cal-grid-body">
                                {calendarDays.map((day, i) => {
                                    if(!day) return <div key={i} className="day-cell empty"></div>;
                                    
                                    const thisDate = new Date(calDate.getFullYear(), calDate.getMonth(), day, 12, 0, 0);
                                    const dateStr = toDateStr(thisDate);
                                    
                                    const isSelected = selectedLeaves.includes(dateStr);
                                    const isConfirmedLeave = confirmedLeaves.includes(dateStr);
                                    const todayStr = toDateStr(new Date());
                                    const isPast = dateStr < todayStr;

                                    let classes = "day-cell";
                                    if(isConfirmedLeave) classes += " confirmed-leave"; 
                                    else if(isSelected) classes += " selected";        
                                    else if(isPast) classes += " past";

                                    return (
                                        <div key={i} className={classes} onClick={() => handleDateClick(day)}>
                                            {day}
                                        </div>
                                    )
                                })}
                            </div>
                            <div className="cal-actions">
                                <span>{selectedLeaves.length} days selected</span>
                                <button className="btn-primary" onClick={submitLeaves}>Apply Selected Leaves</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* VIEW: SETTINGS */}
            {activeView === 'settings' && (
                <div className="settings-view">
                    <div className="settings-card">
                        <h3>Change Password</h3>
                        <form onSubmit={handlePasswordUpdate} className="settings-form">
                            <div className="form-group">
                                <label>Current Password</label>
                                <input type="password" value={passData.current} onChange={(e)=>setPassData({...passData, current:e.target.value})} required/>
                            </div>
                            <div className="form-group">
                                <label>New Password</label>
                                <input type="password" value={passData.new} onChange={(e)=>setPassData({...passData, new:e.target.value})} required/>
                            </div>
                            <div className="form-group">
                                <label>Confirm New Password</label>
                                <input type="password" value={passData.confirm} onChange={(e)=>setPassData({...passData, confirm:e.target.value})} required/>
                            </div>
                            {passMsg.text && <div className={`msg-banner ${passMsg.type}`}>{passMsg.text}</div>}
                            <button type="submit" className="btn-primary">Update Password</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
      </main>
    </div>
  );
}