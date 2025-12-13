import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

/**
 * Helper function to read user data directly from localStorage. 
 * This ensures the guard uses the most current authentication state, 
 * independent of the parent component's React state during the render cycle.
 * * @returns {object | null} The user object or null.
 */
const readUserFromStorage = () => {
    try {
        const storedUser = localStorage.getItem('user');
        // Return null if not found, or the parsed object
        return storedUser ? JSON.parse(storedUser) : null;
    } catch (e) {
        // Clear storage if the JSON is corrupted
        localStorage.removeItem('user');
        return null;
    }
};

/**
 * A wrapper component to guard routes based on authentication status and user role.
 * * @param {object} props
 * @param {React.ReactNode} props.children - The component (e.g., DoctorDashboard) to render if authorized.
 * @param {string | undefined} props.allowedRole - The required role ('doctor' or 'patient').
 * @returns {React.ReactNode}
 */
export default function ProtectedRoute({ children, allowedRole }) {
    const user = readUserFromStorage();
    const location = useLocation();

    // 1. Check if the user is logged in
    if (!user) {
        // Redirect to login if not authenticated, preserving the intended destination
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    // 2. Check Role Authorization
    const userRole = (user.role || '').toLowerCase();
    const requiredRole = (allowedRole || '').toLowerCase();

    if (requiredRole && userRole !== requiredRole) {
        // Redirect unauthorized users (e.g., patient trying to access doctor dashboard) 
        // to the root path or their correct dashboard
        return <Navigate to="/" replace />;
    }

    // 3. Authorization successful: render the children component
    return children;
}