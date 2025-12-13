import { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useNavigate } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Home } from './pages/Home';
import Login from './pages/Login';
import Signup from './pages/Signup';
import PatientDashboard from './pages/PatientDashboard';
import DoctorDashboard from './pages/DoctorDashboard';
import BookingPage from './pages/BookingPage'; 
import ProtectedRoute from "./utils/ProtectedRoute"; 

import './App.css';

// Helper function to read user from storage safely (used for initial state)
const readUserFromStorage = () => {
  try {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  } catch (error) {
    localStorage.removeItem('user');
    return null;
  }
};

function App() {
  // FIX: Initialize state directly from localStorage
  const [user, setUser] = useState(readUserFromStorage); 
  const navigate = useNavigate();

  // FIX: Listener to update state when login/logout happens
  useEffect(() => {
    const updateAuth = () => {
      setUser(readUserFromStorage());
    };

    window.addEventListener('authChange', updateAuth);
    
    return () => {
      window.removeEventListener('authChange', updateAuth);
    };
  }, []);

  // Removed handleLogin function as it's no longer necessary for navigation logic

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('authChange'));
    navigate('/'); 
  };
  
  const contentStyle = { paddingTop: '80px', minHeight: '100vh' }; 
  
  return (
    <div className="app-container">
      <Navbar />

      <div className="app-main-content" style={contentStyle}>
        <Routes>
          <Route path="/" element={<Home />} />
          
          {/* CRITICAL FIX: Removed obsolete props */}
          <Route path="/login" element={<Login />} /> 
          <Route path="/signup" element={<Signup />} /> 

          {/* DOCTOR PROTECTED ROUTE */}
          <Route 
            path="/doctor-dashboard" 
            element={
              <ProtectedRoute allowedRole="doctor">
                <DoctorDashboard user={user} onLogout={handleLogout} />
              </ProtectedRoute>
            } 
          />

          {/* PATIENT PROTECTED ROUTES */}
          <Route 
            path="/patient-dashboard" 
            element={
              <ProtectedRoute allowedRole="patient">
                <PatientDashboard />
              </ProtectedRoute>
            } 
          />

          <Route 
            path="/booking" 
            element={
              <ProtectedRoute allowedRole="patient">
                <BookingPage />
              </ProtectedRoute>
            } 
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  );
}

export default App;