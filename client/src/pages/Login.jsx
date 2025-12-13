import { useState } from 'react';
import axios from 'axios';
import { useNavigate, Link } from 'react-router-dom';
import './Login.css';

const API_LOGIN = 'http://localhost:5000/api/login';

// Removed 'onLogin' and 'user' props as they are no longer used for navigation
export default function Login() { 
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    // Removed isLoggedIn state and useEffect hook

    const saveAuthAndNotify = (userObj, token) => {
        if (userObj) {
            localStorage.setItem('user', JSON.stringify(userObj));
        }
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
        
        try {
            const res = await axios.post(API_LOGIN, { email, password });
            
            const returnedUser = res.data?.user || res.data;
            const token = res.data?.token || res.data?.accessToken || null;

            if (!returnedUser) throw new Error("No user data returned");

            saveAuthAndNotify(returnedUser, token);
            
            // DEFINITIVE FIX: Use window.location.replace() to force a hard navigation 
            // that correctly initializes the ProtectedRoute with the fresh localStorage.
            const role = (returnedUser.role || '').toLowerCase();

            if (role === 'doctor') {
                window.location.replace('/doctor-dashboard');
            } else {
                window.location.replace('/patient-dashboard');
            }

        } catch (err) {
            console.error('Login error ->', err.response || err.message);
            const msg = err.response?.data?.message || 'Invalid email or password';
            setError(msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="login-page-wrapper">
            <div className="login-card-container">
                
                {/* Header */}
                <div className="text-center mb-10">
                    <div className="login-brand-icon">⚕️</div> 
                    <h1 className="text-3xl font-extrabold text-gray-900 mb-2">Welcome Back</h1>
                    <p className="text-gray-500">Sign in to access your MedBook account</p>
                </div>

                {error && (
                    <div className="error-message-box">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    
                    {/* Email Input - Added autocomplete */}
                    <div>
                        <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            placeholder="you@example.com"
                            className="input-field-style"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            autoComplete="username" 
                        />
                    </div>

                    {/* Password Input - Added autocomplete */}
                    <div>
                        <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">Password</label>
                        <input
                            id="password"
                            type="password"
                            required
                            placeholder="••••••••"
                            className="input-field-style"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            autoComplete="current-password" 
                        />
                    </div>

                    {/* Submit Button */}
                    <button
                        type="submit"
                        className="btn-primary-login"
                        disabled={loading}
                    >
                        {loading ? 'Logging In...' : 'Login Securely'}
                    </button>
                </form>

                {/* Footer */}
                <p className="mt-8 text-center text-sm text-gray-600">
                    Need an account? <Link to="/signup" className="text-indigo-600 font-bold hover:underline">Register Here</Link>
                </p>
            </div>
        </div>
    );
}