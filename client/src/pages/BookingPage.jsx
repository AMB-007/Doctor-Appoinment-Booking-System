import React, { useEffect, useState, useMemo } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './BookingPage.css';

const API = 'http://localhost:5000/api';

// --- Icons ---
const HomeIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>;
const ChevronLeft = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>;
const ChevronRight = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>;
const UserIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>;
const DoctorIcon = () => <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path><rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect><path d="M10 14h4"></path><path d="M12 12v4"></path></svg>;

// --- Utilities ---
function pad(n){ return String(n).padStart(2,'0'); }
function minutesToTime(m){ return `${pad(Math.floor(m/60))}:${pad(m%60)}`; }

// Safe Local Date String (YYYY-MM-DD)
const toDateStr = (date) => {
    if (!date) return '';
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

function startOfMonth(date){ return new Date(date.getFullYear(), date.getMonth(), 1); }

export default function BookingPage() {
    const navigate = useNavigate();
    const [doctors, setDoctors] = useState([]);
    const [doctorId, setDoctorId] = useState(null);
    const [monthCursor, setMonthCursor] = useState(() => startOfMonth(new Date()));
    
    const [leavesMap, setLeavesMap] = useState({}); 
    const [bookedMap, setBookedMap] = useState({}); 
    
    // Form States
    const [selectedDate, setSelectedDate] = useState(toDateStr(new Date()));
    const [age, setAge] = useState(''); 
    
    const [slots, setSlots] = useState([]);
    const [loadingSlots, setLoadingSlots] = useState(false);
    const [statusMsg, setStatusMsg] = useState('');
    
    // Constants
    const [clinicStart] = useState(9*60);
    const [clinicEnd] = useState(12 * 60 + 20); 
    const [slotDuration] = useState(20);
    const [user] = useState(()=>{ try { return JSON.parse(localStorage.getItem('user')); } catch { return null; } });

    // 1. Fetch Doctors
    useEffect(() => {
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        async function fetchDoctors(){
            try {
                const res = await axios.get(`${API}/doctors`, { headers });
                const arr = res.data || [];
                setDoctors(arr);
                if(arr.length > 0 && !doctorId) setDoctorId(arr[0].id);
            } catch(err){ 
                console.error(err); 
                if (err.response?.status === 401) navigate('/login');
            }
        }
        fetchDoctors();
    }, []);

    // 2. Fetch Leaves
    useEffect(() => {
        if (!doctorId) return;
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const fetchLeavesForDoctor = async () => {
            try {
                const res = await axios.get(`${API}/doctors/${doctorId}/leaves`, { headers });
                if (res.data && Array.isArray(res.data)) {
                    const set = new Set(res.data.map(l => l.date)); 
                    setLeavesMap(prev => ({ ...prev, [doctorId]: set }));
                }
            } catch (err) { console.warn(err); }
        };
        fetchLeavesForDoctor();
    }, [doctorId, monthCursor]);

    // 3. Fetch Slots
    useEffect(() => {
        if (!doctorId || !selectedDate) return;
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };
        
        const key = `${doctorId}|${selectedDate}`;
        const fetchBooked = async () => {
            setLoadingSlots(true);
            try {
                const res = await axios.get(`${API}/doctors/${doctorId}/booked`, { params: { date: selectedDate }, headers });
                const data = res.data || [];
                
                if (data && (data.is_on_leave || data.leave)) {
                    setBookedMap(prev => ({ ...prev, [key]: 'LEAVE'})); 
                    setSlots([]);
                    setStatusMsg('Doctor is on leave on this date.');
                    return;
                }

                const bookedSet = new Set((Array.isArray(data) ? data : []).map(s => s.slot_time || s.time || s));
                setBookedMap(prev => ({ ...prev, [key]: bookedSet }));

                const generated = [];
                for (let t = clinicStart; t + slotDuration <= clinicEnd; t += slotDuration) {
                    const label = minutesToTime(t);
                    generated.push({ time: label, disabled: bookedSet.has(label) });
                }
                setSlots(generated);
                setStatusMsg('');
            } catch (err) { setStatusMsg(err.response?.data?.message || 'Could not load slots.'); } 
            finally { setLoadingSlots(false); }
        };
        fetchBooked();
    }, [doctorId, selectedDate, clinicStart, clinicEnd, slotDuration]);

    // Calendar Logic
    const calendar = useMemo(() => {
        const weeks = [];
        const start = startOfMonth(monthCursor);
        const startWeekday = start.getDay();
        let cursor = new Date(start);
        cursor.setDate(cursor.getDate() - startWeekday);

        for (let week = 0; week < 6; week++) {
            const days = [];
            for (let d = 0; d < 7; d++) {
                const dateAtNoon = new Date(cursor.getFullYear(), cursor.getMonth(), cursor.getDate(), 12, 0, 0);
                const iso = toDateStr(dateAtNoon);
                
                days.push({
                    date: new Date(cursor),
                    iso: iso,
                    inMonth: cursor.getMonth() === monthCursor.getMonth()
                });
                cursor.setDate(cursor.getDate() + 1);
            }
            weeks.push(days);
        }
        return weeks;
    }, [monthCursor]);

    function isLeaveDay(iso) {
        if (leavesMap[doctorId] && leavesMap[doctorId].has(iso)) return true;
        if (bookedMap[`${doctorId}|${iso}`] === 'LEAVE') return true;
        return false;
    }

    // --- Booking Action ---
    async function bookSlot(time) {
        setStatusMsg('');
        if (!user || String(user.role || '').toLowerCase() !== 'patient') {
            setStatusMsg('Please log in as a patient.');
            return;
        }
        if (isLeaveDay(selectedDate)) {
            setStatusMsg('Doctor unavailable on this date.');
            return;
        }
        if (!age || isNaN(age) || age <= 0 || age > 120) {
            setStatusMsg('Please enter a valid age (1-120).');
            return;
        }
        
        const token = localStorage.getItem('token');
        const headers = { Authorization: `Bearer ${token}` };

        const payload = {
            patient_id: user.id,
            doctor_id: doctorId,
            date: selectedDate,
            time,
            age: parseInt(age, 10)
        };

        try {
            await axios.post(`${API}/appointments`, payload, { headers });
            setStatusMsg('Appointment Request Sent Successfully!');
            
            // Optimistically update slots
            const key = `${doctorId}|${selectedDate}`;
            setBookedMap(prev => {
                const next = { ...prev };
                const existing = (next[key] instanceof Set) ? next[key] : new Set();
                existing.add(time);
                next[key] = existing;
                return next;
            });
            setSlots(s => s.map(sl => sl.time === time ? { ...sl, disabled: true } : sl));

        } catch (err) {
            setStatusMsg(err.response?.data?.error || err.response?.data?.message || 'Booking failed. Try refreshing.');
        }
    }

    // UI Helpers
    const prevMonth = () => setMonthCursor(d => new Date(d.getFullYear(), d.getMonth()-1, 1));
    const nextMonth = () => setMonthCursor(d => new Date(d.getFullYear(), d.getMonth()+1, 1));
    
    const pickDay = (iso, inMonth, status) => {
        const todayStr = toDateStr(new Date());
        const isPastDay = iso < todayStr;
        
        if(status === 'leave' || isPastDay) return;
        
        if (!inMonth) {
            const d = new Date(iso);
            setMonthCursor(startOfMonth(d));
        }
        setSelectedDate(iso);
    };

    const isPast = (iso) => iso < toDateStr(new Date());

    return (
        <div className="booking-wrapper">
            
            <div className="booking-top-nav">
                <button className="btn-back" onClick={() => navigate('/patient-dashboard')}>
                    <HomeIcon /> Return to Dashboard
                </button>
            </div>

            <div className="booking-content-card">
                
                {/* LEFT COLUMN: SELECTION */}
                <div className="booking-left">
                    <div className="section-header">
                        <h2>1. Select Specialist & Date</h2>
                        <p>Choose your doctor and desired appointment date from the calendar.</p>
                    </div>

                    <div className="form-grid">
                        {/* Doctor Selection */}
                        <div className="input-group doctor-select">
                            <label>Select Specialist</label>
                            <div className="custom-field-container">
                                <span className="input-icon"><DoctorIcon /></span>
                                <select className="input-field" value={doctorId || ''} onChange={e => {
                                    setDoctorId(Number(e.target.value));
                                    setMonthCursor(startOfMonth(new Date()));
                                    setSelectedDate(toDateStr(new Date()));
                                }}>
                                    {doctors.map(d => (
                                        <option key={d.id} value={d.id}>Dr. {d.name} — {d.specialization || ''}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        
                        {/* Age Input - Targeted for CSS fix */}
                        <div className="input-group age-input">
                            <label>Your Age</label>
                            <div className="custom-field-container">
                                <span className="input-icon"><UserIcon /></span>
                                <input 
                                    className="input-field"
                                    type="number" 
                                    placeholder="24" 
                                    value={age} 
                                    onChange={(e) => setAge(e.target.value)}
                                    min="1"
                                    max="120"
                                />
                            </div>
                        </div>
                    </div>

                    <div className="calendar-container">
                        <div className="cal-header-modern">
                            <button className="nav-btn" onClick={prevMonth}><ChevronLeft /></button>
                            <span className="month-label">{monthCursor.toLocaleString('default', { month: 'long', year: 'numeric' })}</span>
                            <button className="nav-btn" onClick={nextMonth}><ChevronRight /></button>
                        </div>

                        <div className="cal-days-header">
                            {['S','M','T','W','T','F','S'].map(d => <span key={d}>{d}</span>)}
                        </div>

                        <div className="cal-days-grid">
                            {calendar.map((week, wi) => (
                                week.map(day => {
                                    const iso = day.iso;
                                    const leave = isLeaveDay(iso);
                                    const past = isPast(iso);
                                    const isSelected = selectedDate === iso;

                                    let statusClass = 'available'; 
                                    if (leave) statusClass = 'leave'; 
                                    else if (past) statusClass = 'past'; 

                                    return (
                                        <div 
                                            key={iso} 
                                            className={`day-cell ${!day.inMonth ? 'dimmed' : ''} ${isSelected ? 'selected' : ''} ${statusClass}`}
                                            onClick={() => pickDay(iso, day.inMonth, statusClass)}
                                        >
                                            {new Date(day.date).getDate()}
                                            {iso === toDateStr(new Date()) && <div className="dot-today"></div>}
                                        </div>
                                    );
                                })
                            ))}
                        </div>

                        <div className="cal-footer">
                            <div className="legend"><span className="dot green"></span> Available</div>
                            <div className="legend"><span className="dot red"></span> Leave</div>
                            <div className="legend"><span className="dot gray"></span> Past/Unavailable</div>
                        </div>
                    </div>
                </div>

                {/* RIGHT COLUMN: SLOTS */}
                <div className="booking-right">
                    <div className="slots-header">
                        <h2>2. Choose Time Slot</h2>
                        <h4 className="slots-date">{new Date(selectedDate).toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' })}</h4>
                        <span className="slots-count">{slots.filter(s=>!s.disabled).length} Slots Available</span>
                    </div>

                    {statusMsg && (
                        <div className={`notification-banner ${statusMsg.includes('Success') || statusMsg.includes('Request') ? 'success' : 'error'}`}>
                            {statusMsg}
                        </div>
                    )}

                    <div className="slots-scroller">
                        {isLeaveDay(selectedDate) || isPast(selectedDate) ? (
                            <div className="empty-state">
                                <div className="icon-xl">🚫</div>
                                <h4>{isPast(selectedDate) ? 'Date is in the Past' : 'Doctor Unavailable'}</h4>
                                <p>Please select a future, green date to proceed with booking.</p>
                            </div>
                        ) : loadingSlots ? (
                            <div className="loading-state">Checking schedule...</div>
                        ) : slots.length === 0 ? (
                            <div className="empty-state">
                                <div className="icon-xl">🕒</div>
                                <h4>No Slots Available</h4>
                                <p>All appointments are currently booked for this day. Try another date.</p>
                            </div>
                        ) : (
                            <div className="time-grid">
                                {slots.map(s => (
                                    <button
                                        key={s.time}
                                        className={`time-pill ${s.disabled ? 'booked' : ''}`}
                                        disabled={s.disabled}
                                        onClick={() => !s.disabled && bookSlot(s.time)}
                                    >
                                        {s.time}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    );
}