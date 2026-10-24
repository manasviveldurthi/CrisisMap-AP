import React, { useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useCrisis } from '../../context/CrisisContext';
import { ShieldAlert, Loader2 } from 'lucide-react';

/**
 * Route protection guard that checks authenticated backend role.
 * Does not trust client-selected state; relies on backend-verified currentUser.role.
 */
export default function ProtectedRoute({ children, allowedRoles = [], redirectPortal = 'citizen' }) {
  const { currentUser, isLoadingAuth, showToast } = useCrisis();
  const location = useLocation();

  if (isLoadingAuth) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 text-red-600 animate-spin" />
        <p className="text-sm font-semibold text-slate-600">Verifying authorized access credentials...</p>
      </div>
    );
  }

  // If not logged in, redirect to dedicated login for this role
  if (!currentUser) {
    return (
      <Navigate
        to={`/login?portal=${redirectPortal}&redirect=${encodeURIComponent(location.pathname + location.search)}`}
        replace
      />
    );
  }

  // If role is not permitted, redirect to user's verified role dashboard
  const userRole = (currentUser.role === 'ngo')
    ? 'responder'
    : (currentUser.role === 'government' || currentUser.role === 'official')
    ? 'government_official'
    : currentUser.role;

  const normalizedAllowed = allowedRoles.map(r =>
    (r === 'ngo') ? 'responder' : (r === 'government' || r === 'official') ? 'government_official' : r
  );

  if (allowedRoles.length > 0 && !normalizedAllowed.includes(userRole)) {
    const targetDashboard =
      currentUser.role === 'admin'
        ? '/admin'
        : (userRole === 'government_official')
        ? '/government'
        : (userRole === 'responder')
        ? '/responder'
        : '/citizen';

    return <Navigate to={targetDashboard} replace />;
  }

  return children;
}
