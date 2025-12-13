import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import '../styles/Navbar.css';

export const Navbar = () => {
    const [user, setUser] = useState(null);
    const navigate = useNavigate();
    const location = useLocation();

    const readUser = () => {
        try {
            const raw = localStorage.getItem('user');
            return raw ? JSON.parse(raw) : null;
        } catch (e) { return null; }
    };

    useEffect(() => {
        setUser(readUser());
        const onStorage = (ev) => { if (ev.key === 'user') setUser(readUser()); };
        const onAuthChange = () => setUser(readUser());

        window.addEventListener('storage', onStorage);
        window.addEventListener('authChange', onAuthChange);

        return () => {
            window.removeEventListener('storage', onStorage);
            window.removeEventListener('authChange', onAuthChange);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        window.dispatchEvent(new Event('authChange'));
        setUser(null);
        
        navigate('/'); 
    };

    const getDashboardPath = () => {
        if (!user) return '/login';
        return (user.role || '').toLowerCase() === 'doctor' ? '/doctor-dashboard' : '/patient-dashboard';
    };

    return (
        <nav className="main-navbar">
            <div className="nav-container"> {/* Renamed for clarity */}
                <Link to="/" className="nav-brand">
                    <span className="brand-icon">⚕️</span>
                    <span className="brand-text">MedBook</span>
                </Link>

                <div className="nav-actions">
                    {user ? (
                        <div className="user-menu">
                            {/* Standard Link: Dashboard */}
                            <Link to={getDashboardPath()} className={`nav-link ${location.pathname.includes('dashboard') ? 'active' : ''}`}>
                                Dashboard
                            </Link>

                            {/* Patient Only Link: Booking */}
                            {user.role === 'patient' && (
                                <Link to="/booking" className={`nav-link ${location.pathname === '/booking' ? 'active' : ''}`}>
                                    Book Appointment
                                </Link>
                            )}

                            {/* User Info Group */}
                            <div className="user-info-group">
                                <div className="user-divider"></div>
                                
                                <div className="user-badge">
                                    <div className="user-avatar">
                                        {user.name ? user.name[0].toUpperCase() : 'U'}
                                    </div>
                                    <div className="user-details">
                                        <span className="user-name">{user.name}</span>
                                        <span className="user-role">{user.role}</span>
                                    </div>
                                </div>

                                <button onClick={handleLogout} className="btn-logout">
                                    Logout
                                </button>
                            </div>
                        </div>
                    ) : (
                        <div className="guest-menu">
                            <Link to="/login" className="nav-link">Log In</Link>
                            <Link to="/signup" className="btn-primary-nav">Sign Up</Link>
                        </div>
                    )}
                </div>
            </div>
        </nav>
    );
};