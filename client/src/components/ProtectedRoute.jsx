import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Reads user data directly from localStorage. This ensures the guard uses the
 * most current authentication state, independent of the parent component's React state.
 * @returns {object | null} The user object or null.
 */
const readUserFromStorage = () => {
    try {
        const storedUser = localStorage.getItem('user');
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
        return null;
    }
};

/**
 * A wrapper component to guard routes based on authentication status and user role.
 * * @param {object} props
 * @param {React.ReactNode} props.children - The component to render if authorized.
 * @param {string | undefined} props.allowedRole - The required role ('doctor', 'patient', or undefined for logged-in only).
 * @returns {React.ReactNode}
 */
export default function ProtectedRoute({ children, allowedRole }) {
    const user = readUserFromStorage(); // Check the definitive source (localStorage)
    const location = useLocation();

    // 1. Check if the user is logged in
    if (!user) {
        // Redirect to login if not authenticated
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Check Role Authorization (if required)
    const userRole = (user.role || '').toLowerCase();
    const requiredRole = (allowedRole || '').toLowerCase();

    if (requiredRole && userRole !== requiredRole) {
        // Redirect unauthorized users (e.g., doctor trying to access /booking)
        // Redirects to the root path ('/')
        return <Navigate to="/" replace />;
    }

    // 3. Authorization successful
    return children;
}