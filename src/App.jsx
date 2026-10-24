import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { CrisisProvider } from './context/CrisisContext';

// Layout Components
import EmergencyBanner from './components/layout/EmergencyBanner';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Toast from './components/common/Toast';

// Core Emergency Portals
import HomePage from './pages/HomePage';
import CitizenPortalPage from './pages/CitizenPortalPage';
import ResponderPortalPage from './pages/ResponderPortalPage';
import AdminPortalPage from './pages/AdminPortalPage';
import GovernmentPortalPage from './pages/GovernmentPortalPage';
import LoginPage from './pages/LoginPage';
import RequestDetailPage from './pages/RequestDetailPage';

// Disaster Awareness & Resource Pages
import MapPage from './pages/MapPage';
import SheltersPage from './pages/SheltersPage';
import AboutPage from './pages/AboutPage';
import IncidentDetailPage from './pages/IncidentDetailPage';
import ReportIncidentPage from './pages/ReportIncidentPage';
import UserDashboardPage from './pages/UserDashboardPage';

import ProtectedRoute from './components/common/ProtectedRoute';
import ErrorBoundary from './components/common/ErrorBoundary';

// Scroll to top upon route change
function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

export default function App() {
  return (
    <ErrorBoundary>
      <CrisisProvider>
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-800">
          <EmergencyBanner />
          <Navbar />

          <main className="flex-1">
            <Routes>
              {/* Landing Page: Professional Role-Selection First Welcome Page */}
              <Route path="/" element={<HomePage />} />

              {/* Three Dedicated Disaster Response Portals (Role Protected) */}
              <Route
                path="/citizen"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'admin']} redirectPortal="citizen">
                    <CitizenPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/responder"
                element={
                  <ProtectedRoute allowedRoles={['responder', 'ngo', 'admin']} redirectPortal="ngo">
                    <ResponderPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin"
                element={
                  <ProtectedRoute allowedRoles={['admin']} redirectPortal="admin">
                    <AdminPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/government"
                element={
                  <ProtectedRoute allowedRoles={['government_official', 'government', 'official', 'admin']} redirectPortal="government">
                    <GovernmentPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/operations"
                element={
                  <ProtectedRoute allowedRoles={['government_official', 'government', 'official', 'admin']} redirectPortal="government">
                    <GovernmentPortalPage />
                  </ProtectedRoute>
                }
              />

              {/* Login & Multi-Persona Dedicated Portal Sign-in */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/register" element={<LoginPage />} />

              {/* SOS Request Tracking & Audit Timeline */}
              <Route path="/request/:id" element={<RequestDetailPage />} />

              {/* Public GIS Map & Relief Resources */}
              <Route path="/map" element={<MapPage />} />
              <Route path="/shelters" element={<SheltersPage />} />
              <Route path="/about" element={<AboutPage />} />

              {/* Protected Legacy / Alias Routes */}
              <Route
                path="/user-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'admin']} redirectPortal="citizen">
                    <CitizenPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute allowedRoles={['citizen', 'admin']} redirectPortal="citizen">
                    <CitizenPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']} redirectPortal="government">
                    <AdminPortalPage />
                  </ProtectedRoute>
                }
              />
              <Route path="/report" element={<CitizenPortalPage />} />
              <Route path="/incident/:id" element={<IncidentDetailPage />} />

              {/* Fallback */}
              <Route path="*" element={<HomePage />} />
            </Routes>
          </main>

          <Footer />
          <Toast />
        </div>
      </BrowserRouter>
    </CrisisProvider>
  </ErrorBoundary>
  );
}

