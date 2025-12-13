import { useState } from 'react'; // Removed useEffect
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Signup.css';

const API_SIGNUP = 'http://localhost:5000/api/signup';

// Removed onSignup and user props
export default function Signup() { 
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'patient' });
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // Removed isLoggedIn state and useEffect hook
    
    const navigate = useNavigate();

    const update = (key, val) => setFormData({ ...formData, [key]: val });

    const saveAuthAndNotify = (userObj, token) => {
        if (userObj) localStorage.setItem('user', JSON.stringify(userObj));
        if (token) {
            localStorage.setItem('token', token);
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        }
        window.dispatchEvent(new Event('authChange'));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        
        if (formData.password.length < 6) {
            setError("Password must be at least 6 characters.");
            setLoading(false);
            return;
        }

        try {
            const res = await axios.post(API_SIGNUP, formData);
            const returnedUser = res.data?.user || res.data;
            const token = res.data?.token || null;

            if (returnedUser && returnedUser.role) {
                returnedUser.role = String(returnedUser.role).toLowerCase();
            }

            if (returnedUser) {
                saveAuthAndNotify(returnedUser, token);
                
                // DEFINITIVE FIX: Use window.location.replace()
                const role = (returnedUser.role || '').toLowerCase();
                if (role === 'doctor') {
                    window.location.replace('/doctor-dashboard');
                } else {
                    window.location.replace('/patient-dashboard');
                }
            } else {
                navigate('/login');
            }
        } catch (err) {
            console.error('Signup error ->', err.response || err.message);
            const msg = err.response?.data?.message || 'Signup failed';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="signup-page-wrapper">
            <div className="signup-card-container">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="signup-brand-icon">⚕️</div>
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Create Your MedBook Account</h1>
                    <p className="text-gray-500">Fast, simple, and secure registration</p>
                </div>

                {error && (
                    <div className="error-message-box">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    
                    {/* Role Selection */}
                    <div className="space-y-2">
                        <label className="block text-sm font-semibold text-gray-700">Account Type:</label>
                        <div className="flex gap-6">
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="patient"
                                    checked={formData.role === 'patient'}
                                    onChange={(e) => update('role', e.target.value)}
                                    className="radio-input-style"
                                />
                                <span className="ml-2 text-gray-700">Patient</span>
                            </label>
                            
                            <label className="flex items-center cursor-pointer">
                                <input 
                                    type="radio" 
                                    name="role" 
                                    value="doctor"
                                    checked={formData.role === 'doctor'}
                                    onChange={(e) => update('role', e.target.value)}
                                    className="radio-input-style"
                                />
                                <span className="ml-2 text-gray-700">Doctor</span>
                            </label>
                        </div>
                    </div>

                    {/* Full Name Input - Added autocomplete */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Full Name</label>
                        <input
                            type="text"
                            required
                            placeholder="John Doe"
                            className="input-field-style"
                            value={formData.name}
                            onChange={(e) => update('name', e.target.value)}
                            autoComplete="name"
                        />
                    </div>

                    {/* Email Input - Added autocomplete */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                        <input
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="input-field-style"
                            value={formData.email}
                            onChange={(e) => update('email', e.target.value)}
                            autoComplete="email"
                        />
                    </div>

                    {/* Password Input - Added autocomplete */}
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                        <input
                            type="password"
                            required
                            placeholder="••••••••"
                            className="input-field-style"
                            value={formData.password}
                            onChange={(e) => update('password', e.target.value)}
                            autoComplete="new-password"
                        />
                        <p className="mt-2 text-xs text-gray-500">Must be at least 6 characters</p>
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn-primary-signup"
                        disabled={loading}
                    >
                        {loading ? 'Registering...' : 'Create Account'}
                    </button>
                </form>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-gray-600">
                    Already have an account? <Link to="/login" className="text-indigo-600 font-bold hover:underline">Login</Link>
                </p>
            </div>
        </div>
    );
}