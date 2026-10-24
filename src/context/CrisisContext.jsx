import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
import { api, getAuthToken, setAuthToken } from '../api/client';
import { DEMO_RESPONDER_TEAMS } from '../data/responderTeams';

const CrisisContext = createContext(null);

const ROLE_STORAGE_KEY = 'crisismap_ap_active_portal_role_v3';
const OFFLINE_QUEUE_KEY = 'crisismap_ap_offline_pending_queue_v3';

// Normalizes backend EmergencyRequest into full frontend object
function normalizeRequest(r) {
  const coords = (r.latitude != null && r.longitude != null)
    ? [Number(r.latitude), Number(r.longitude)]
    : [16.5062, 80.6480];

  const timeline = (r.timeline_updates || []).map((u) => ({
    id: u.id,
    timestamp: u.created_at,
    status: u.new_status,
    actor: `${u.author_name} (${u.author_role})`,
    note: u.note || `Status updated to ${u.new_status}`
  }));

  const notes = (r.timeline_updates || [])
    .filter((u) => u.note)
    .map((u) => ({
      id: `NOTE-${u.id}`,
      timestamp: u.created_at,
      author: u.author_name,
      role: u.author_role,
      text: u.note
    }));

  return {
    ...r,
    id: r.reference_code || `REQ-${r.id}`,
    rawId: r.id,
    referenceCode: r.reference_code,
    status: r.response_status || 'Submitted',
    responseStatus: r.response_status,
    emergencyType: r.category || 'Flood',
    category: r.category || 'Flood',
    contactName: r.contact_name,
    phone: r.phone,
    peopleCount: r.people_affected || 1,
    peopleAffected: r.people_affected || 1,
    vulnerableGroups: r.vulnerable_groups || [],
    district: r.district,
    locality: r.locality || '',
    address: r.address || '',
    coordinates: coords,
    latitude: r.latitude,
    longitude: r.longitude,
    locationType: r.location_type || 'current_confirmed',
    urgency: r.urgency || 'High',
    aiUrgencySuggestion: r.ai_urgency_suggestion,
    aiSuggestionReason: r.ai_suggestion_reason,
    description: r.description,
    assistanceCategories: r.assistance_needs || [],
    assistanceNeeds: r.assistance_needs || [],
    assignedResponder: r.assigned_responder_name || null,
    assignedResponderId: r.assigned_responder_id || null,
    potentialDuplicateOfId: r.potential_duplicate_of_id || null,
    verificationStatus: r.verification_status || 'Unverified',
    submittedAt: r.created_at,
    lastUpdated: r.updated_at || r.created_at,
    imageUrl: r.photo_url || null,
    timeline,
    notes,
    isUserCreated: true
  };
}

// Normalizes backend ShelterResource into frontend format
function normalizeShelter(s) {
  return {
    ...s,
    id: `SHELTER-${s.id}`,
    rawId: s.id,
    name: s.name,
    district: s.district,
    location: s.address || s.locality || s.district,
    locality: s.locality || '',
    address: s.address || '',
    coordinates: [Number(s.latitude), Number(s.longitude)],
    capacity: Number(s.capacity) || 500,
    currentOccupants: Number(s.current_occupants) || 0,
    status: s.status || 'Active',
    facilities: s.facilities || [],
    contactRole: s.coordinator_name || 'Relief Coordinator',
    officialHelpline: s.helpline_phone || '112 / 1070',
    isDemo: false
  };
}

export function CrisisProvider({ children }) {
  // Current user & authentication state
  const [currentUser, setCurrentUser] = useState(null);
  const [currentRole, setCurrentRole] = useState('public');


  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [backendConnected, setBackendConnected] = useState(true);

  // Real data collections
  const [assistanceRequests, setAssistanceRequests] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [isLoadingData, setIsLoadingData] = useState(false);

  // Offline pending requests queue
  const [offlineQueue, setOfflineQueue] = useState(() => {
    try {
      const saved = localStorage.getItem(OFFLINE_QUEUE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Toast notifications
  const [toast, setToast] = useState(null);

  const showToast = useCallback((message, type = 'info') => {
    setToast({ message, type, id: Date.now() });
    setTimeout(() => {
      setToast((current) => (current?.message === message ? null : current));
    }, 5000);
  }, []);

  // Save offline queue to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(OFFLINE_QUEUE_KEY, JSON.stringify(offlineQueue));
    } catch (e) {
      console.error(e);
    }
  }, [offlineQueue]);

  // Sync role to storage
  useEffect(() => {
    try {
      localStorage.setItem(ROLE_STORAGE_KEY, currentRole);
    } catch (e) {
      console.error(e);
    }
  }, [currentRole]);

  // Load authenticated user profile on application startup
  useEffect(() => {
    async function initAuth() {
      const token = getAuthToken();
      if (!token) {
        setIsLoadingAuth(false);
        return;
      }
      try {
        const userProfile = await api.getMe();
        setCurrentUser(userProfile);
        setCurrentRole(userProfile.role);
        setBackendConnected(true);
      } catch (err) {
        console.warn('Stored auth token expired or invalid:', err.message);
        setAuthToken(null);
        setCurrentUser(null);
      } finally {
        setIsLoadingAuth(false);
      }
    }
    initAuth();
  }, []);

  // Fetch real data from backend
  const refreshData = useCallback(async () => {
    setIsLoadingData(true);
    try {
      // 1. Fetch Shelters
      try {
        const rawShelters = await api.getShelters();
        if (Array.isArray(rawShelters)) {
          setShelters(rawShelters.map(normalizeShelter));
        }
      } catch (err) {
        console.warn('Failed to load shelters:', err.message);
      }

      // 2. Fetch Requests based on current role & token
      const token = getAuthToken();
      if (token && (currentRole === 'responder' || currentRole === 'ngo' || currentRole === 'admin' || currentRole === 'government_official' || currentRole === 'government' || currentRole === 'official')) {
        try {
          const rawRequests = await api.getRequests();
          if (Array.isArray(rawRequests)) {
            setAssistanceRequests(rawRequests.map(normalizeRequest));
          }
        } catch (err) {
          console.warn('Failed to fetch responder requests queue:', err.message);
        }
      }

      // 3. Fetch citizen's own requests
      if (token) {
        try {
          const myRaw = await api.getMyRequests();
          if (Array.isArray(myRaw)) {
            const mappedMy = myRaw.map(normalizeRequest);
            setMyRequests(mappedMy);
            // If in citizen view, also update assistanceRequests so public map shows real reports
            if (currentRole === 'citizen') {
              setAssistanceRequests(mappedMy);
            }
          }
        } catch (err) {
          console.warn('Failed to fetch personal requests:', err.message);
        }
      } else {
        // Unauthenticated guest citizen: requests queue is empty unless local reports exist
        setMyRequests([]);
      }

      setBackendConnected(true);
    } catch (e) {
      console.error('Error refreshing backend data:', e);
      setBackendConnected(false);
    } finally {
      setIsLoadingData(false);
    }
  }, [currentRole]);

  // Trigger data refresh when role or user changes
  useEffect(() => {
    refreshData();
  }, [refreshData, currentUser, currentRole]);

  // Flush offline queue when browser goes online
  const flushOfflineQueue = useCallback(async () => {
    if (offlineQueue.length === 0) return;
    showToast(`Online connection detected. Transmitting ${offlineQueue.length} pending emergency report(s)...`, 'info');

    const remaining = [];
    for (const item of offlineQueue) {
      try {
        const created = await api.createRequest(item.payload);
        const normalized = normalizeRequest(created);
        setAssistanceRequests((prev) => [normalized, ...prev]);
        setMyRequests((prev) => [normalized, ...prev]);
        showToast(`Pending emergency report #${created.reference_code} transmitted successfully!`, 'success');
      } catch (err) {
        console.error('Failed to flush offline request:', err);
        remaining.push(item);
      }
    }
    setOfflineQueue(remaining);
  }, [offlineQueue, showToast]);

  useEffect(() => {
    const handleOnline = () => flushOfflineQueue();
    window.addEventListener('online', handleOnline);
    return () => window.removeEventListener('online', handleOnline);
  }, [flushOfflineQueue]);

  // ==============================================================================
  // Authentication Actions
  // ==============================================================================

  const login = async (email, password) => {
    try {
      const res = await api.login({ email, password });
      setAuthToken(res.access_token);
      setCurrentUser(res.user);
      setCurrentRole(res.user.role);
      showToast(`Welcome back, ${res.user.full_name} (${res.user.role.toUpperCase()})!`, 'success');
      await refreshData();
      return res.user;
    } catch (err) {
      const msg = err.message || 'Login failed. Please check your credentials.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const register = async (userData) => {
    try {
      const res = await api.register(userData);
      if (res.user.status === 'active') {
        // Auto-login citizen
        setAuthToken(res.access_token);
        setCurrentUser(res.user);
        setCurrentRole(res.user.role);
        showToast(`Registration successful! Welcome to CrisisMap, ${res.user.full_name}.`, 'success');
        await refreshData();
      } else {
        // Pending approval responder
        showToast(
          `Responder registration submitted! Status: Pending Administrator Approval. You will be able to access the responder portal once approved.`,
          'info'
        );
      }
      return res.user;
    } catch (err) {
      const msg = err.message || 'Registration failed.';
      showToast(msg, 'error');
      throw err;
    }
  };

  const logout = () => {
    setAuthToken(null);
    setCurrentUser(null);
    setCurrentRole('public');
    setAssistanceRequests([]);
    setMyRequests([]);
    try {
      localStorage.removeItem(ROLE_STORAGE_KEY);
    } catch (e) {
      console.error(e);
    }
    showToast('You have been logged out securely.', 'info');
  };

  const updateUserProfile = async (profileData) => {
    try {
      const updated = await api.updateProfile(profileData);
      setCurrentUser(updated);
      showToast('Profile updated successfully.', 'success');
      return updated;
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
      throw err;
    }
  };

  // Helper kept for backward-compatibility only
  const switchRole = (newRole) => {
    console.warn('Direct role switching without authentication is disabled.');
  };


  // ==============================================================================
  // Emergency Assistance Actions
  // ==============================================================================

  const createAssistanceRequest = async (formData) => {
    // Construct payload for backend API, correctly parsing lat/lng or coordinates array
    let lat = null;
    let lng = null;
    if (formData.latitude != null && !isNaN(Number(formData.latitude))) {
      lat = Number(formData.latitude);
    } else if (formData.coordinates && !isNaN(Number(formData.coordinates[0]))) {
      lat = Number(formData.coordinates[0]);
    }

    if (formData.longitude != null && !isNaN(Number(formData.longitude))) {
      lng = Number(formData.longitude);
    } else if (formData.coordinates && !isNaN(Number(formData.coordinates[1]))) {
      lng = Number(formData.coordinates[1]);
    }

    if (lat === null) lat = 16.5062;
    if (lng === null) lng = 80.6480;

    const payload = {
      contact_name: (formData.contactName || currentUser?.full_name || 'Citizen in Need').trim(),
      phone: (formData.phone || currentUser?.phone || '9849000000').trim(),
      category: formData.emergencyType || 'Flood',
      urgency: formData.urgency || 'High',
      description: (formData.description || 'Emergency assistance requested.').trim(),
      people_affected: Number(formData.peopleCount) || 1,
      assistance_needs: formData.assistanceCategories || ['rescue'],
      vulnerable_groups: formData.vulnerableGroups || [],
      district: formData.district || currentUser?.district || 'NTR (Vijayawada)',
      locality: (formData.locality || '').trim(),
      address: (formData.address || '').trim(),
      latitude: lat,
      longitude: lng,
      location_type: formData.locationType || 'current_confirmed',
      photo_url: formData.imageUrl || null
    };

    // Check offline status
    if (!navigator.onLine) {
      const localId = `PENDING-OFFLINE-${Date.now()}`;
      const offlineItem = {
        id: localId,
        payload,
        queuedAt: new Date().toISOString()
      };
      setOfflineQueue((prev) => [offlineItem, ...prev]);

      const pendingRequest = normalizeRequest({
        id: localId,
        reference_code: localId,
        ...payload,
        response_status: 'Pending Submission (Offline)',
        verification_status: 'Offline Queue',
        created_at: new Date().toISOString(),
        timeline_updates: [
          {
            id: 0,
            created_at: new Date().toISOString(),
            new_status: 'Pending Submission (Offline)',
            author_name: payload.contact_name,
            author_role: 'Offline Client',
            note: 'Stored in offline queue. Awaiting internet connectivity to transmit to emergency servers. Note: delayed transmission cannot guarantee rescue assistance.'
          }
        ]
      });

      setAssistanceRequests((prev) => [pendingRequest, ...prev]);
      setMyRequests((prev) => [pendingRequest, ...prev]);
      showToast(
        'Offline: Emergency report saved locally. It will automatically submit once internet is available.',
        'warning'
      );
      return pendingRequest;
    }

    try {
      const created = await api.createRequest(payload);
      const normalized = normalizeRequest(created);

      setAssistanceRequests((prev) => [normalized, ...prev]);
      setMyRequests((prev) => [normalized, ...prev]);

      if (created.potential_duplicate_of_id) {
        showToast(
          `Emergency report #${created.reference_code} logged! Flagged for human review (potential duplicate of #${created.potential_duplicate_of_id}).`,
          'info'
        );
      } else {
        showToast(`Emergency SOS #${created.reference_code} saved to operational database!`, 'success');
      }

      return normalized;
    } catch (err) {
      showToast(err.message || 'Failed to submit emergency report.', 'error');
      throw err;
    }
  };

  const acknowledgeRequest = async (requestId, noteText = '') => {
    try {
      const targetReq = assistanceRequests.find((r) => r.id === requestId || r.referenceCode === requestId);
      const rawId = targetReq?.rawId || parseInt(requestId.replace(/\D/g, ''), 10);
      if (!rawId) throw new Error('Could not identify database record ID.');

      const updated = await api.updateRequestStatus(rawId, 'Under Review', noteText || 'Request acknowledged by response unit.');
      const normalized = normalizeRequest(updated);
      setAssistanceRequests((prev) => prev.map((r) => (r.rawId === rawId ? normalized : r)));
      showToast(`Request #${normalized.referenceCode} acknowledged.`, 'info');
      return normalized;
    } catch (err) {
      showToast(err.message || 'Failed to acknowledge request.', 'error');
      throw err;
    }
  };

  const assignRequest = async (requestId, responderName, noteText = '') => {
    try {
      const targetReq = assistanceRequests.find((r) => r.id === requestId || r.referenceCode === requestId);
      const rawId = targetReq?.rawId || parseInt(requestId.replace(/\D/g, ''), 10);
      if (!rawId) throw new Error('Could not identify database record ID.');

      const assignedTo = responderName || currentUser?.organization_name || currentUser?.full_name || 'Operational Team';
      const updated = await api.assignRequest(rawId, {
        responderName: assignedTo,
        responderId: currentUser?.id,
        note: noteText || `Assignment accepted by ${assignedTo}. Preparing operational response.`
      });
      const normalized = normalizeRequest(updated);
      setAssistanceRequests((prev) => prev.map((r) => (r.rawId === rawId ? normalized : r)));
      showToast(`Request #${normalized.referenceCode} assigned to ${assignedTo}.`, 'success');
      return normalized;
    } catch (err) {
      showToast(err.message || 'Failed to assign request.', 'error');
      throw err;
    }
  };

  const updateRequestStatus = async (requestId, newStatus, noteText = '') => {
    try {
      const targetReq = assistanceRequests.find((r) => r.id === requestId || r.referenceCode === requestId);
      const rawId = targetReq?.rawId || parseInt(requestId.replace(/\D/g, ''), 10);
      if (!rawId) throw new Error('Could not identify database record ID.');

      const updated = await api.updateRequestStatus(rawId, newStatus, noteText);
      const normalized = normalizeRequest(updated);
      setAssistanceRequests((prev) => prev.map((r) => (r.rawId === rawId ? normalized : r)));
      showToast(`Request #${normalized.referenceCode} status updated to "${newStatus}".`, 'info');
      return normalized;
    } catch (err) {
      showToast(err.message || 'Failed to update request status.', 'error');
      throw err;
    }
  };

  const verifyRequest = async (requestId, verificationStatus, urgency = null, noteText = '') => {
    try {
      const targetReq = assistanceRequests.find((r) => r.id === requestId || r.referenceCode === requestId);
      const rawId = targetReq?.rawId || parseInt(requestId.replace(/\D/g, ''), 10);
      if (!rawId) throw new Error('Could not identify database record ID.');

      const updated = await api.verifyRequest(rawId, verificationStatus, urgency, noteText);
      const normalized = normalizeRequest(updated);
      setAssistanceRequests((prev) => prev.map((r) => (r.rawId === rawId ? normalized : r)));
      showToast(`Request #${normalized.referenceCode} verified as "${verificationStatus}".`, 'success');
      return normalized;
    } catch (err) {
      showToast(err.message || 'Failed to verify request.', 'error');
      throw err;
    }
  };

  const addRequestNote = async (requestId, noteText) => {
    if (!noteText.trim()) return;
    try {
      const targetReq = assistanceRequests.find((r) => r.id === requestId || r.referenceCode === requestId);
      const rawId = targetReq?.rawId || parseInt(requestId.replace(/\D/g, ''), 10);
      if (!rawId) throw new Error('Could not identify database record ID.');

      await api.addRequestNote(rawId, noteText);
      // Refresh request
      const updated = await api.getRequestById(rawId);
      const normalized = normalizeRequest(updated);
      setAssistanceRequests((prev) => prev.map((r) => (r.rawId === rawId ? normalized : r)));
      showToast(`Coordination note added to #${normalized.referenceCode}.`, 'info');
    } catch (err) {
      showToast(err.message || 'Failed to add note.', 'error');
      throw err;
    }
  };

  const cancelRequest = async (requestId, reason = 'Situation resolved independently.') => {
    try {
      const targetReq = assistanceRequests.find((r) => r.id === requestId || r.referenceCode === requestId);
      const rawId = targetReq?.rawId || parseInt(requestId.replace(/\D/g, ''), 10);
      if (!rawId) throw new Error('Could not identify database record ID.');

      const updated = await api.cancelRequest(rawId, reason);
      const normalized = normalizeRequest(updated);
      setAssistanceRequests((prev) => prev.map((r) => (r.rawId === rawId ? normalized : r)));
      setMyRequests((prev) => prev.map((r) => (r.rawId === rawId ? normalized : r)));
      showToast(`Request #${normalized.referenceCode} has been marked as Cancelled.`, 'warning');
      return normalized;
    } catch (err) {
      showToast(err.message || 'Failed to cancel request.', 'error');
      throw err;
    }
  };

  // ==============================================================================
  // Shelter Management
  // ==============================================================================

  const addShelter = async (shelterData) => {
    try {
      const coords = shelterData.coordinates || [15.9129, 79.7400];
      const payload = {
        name: shelterData.name,
        district: shelterData.district,
        locality: shelterData.locality || shelterData.location || '',
        address: shelterData.address || shelterData.location || '',
        latitude: Number(coords[0]),
        longitude: Number(coords[1]),
        capacity: Number(shelterData.capacity) || 500,
        current_occupants: Number(shelterData.currentOccupants) || 0,
        status: shelterData.status || 'Active',
        facilities: shelterData.facilities || ['Potable Drinking Water', 'Community Kitchen', 'Medical Post'],
        helpline_phone: shelterData.officialHelpline || '112 / 1070',
        coordinator_name: shelterData.contactRole || currentUser?.full_name || 'Relief Coordinator'
      };

      const created = await api.createShelter(payload);
      const normalized = normalizeShelter(created);
      setShelters((prev) => [normalized, ...prev]);
      showToast(`Relief shelter "${normalized.name}" created in database.`, 'success');
      return normalized;
    } catch (err) {
      showToast(err.message || 'Failed to create relief shelter.', 'error');
      throw err;
    }
  };

  const updateShelter = async (id, updates) => {
    try {
      const rawId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10);
      const payload = {};
      if (updates.capacity !== undefined) payload.capacity = Number(updates.capacity);
      if (updates.currentOccupants !== undefined) payload.current_occupants = Number(updates.currentOccupants);
      if (updates.status !== undefined) payload.status = updates.status;
      if (updates.facilities !== undefined) payload.facilities = updates.facilities;
      if (updates.officialHelpline !== undefined) payload.helpline_phone = updates.officialHelpline;

      const updated = await api.updateShelter(rawId, payload);
      const normalized = normalizeShelter(updated);
      setShelters((prev) => prev.map((s) => (s.rawId === rawId ? normalized : s)));
      showToast(`Shelter "${normalized.name}" updated.`, 'success');
      return normalized;
    } catch (err) {
      showToast(err.message || 'Failed to update shelter.', 'error');
      throw err;
    }
  };

  const deleteShelter = async (id) => {
    try {
      const rawId = typeof id === 'number' ? id : parseInt(String(id).replace(/\D/g, ''), 10);
      await api.deleteShelter(rawId);
      setShelters((prev) => prev.filter((s) => s.rawId !== rawId));
      showToast('Relief shelter record removed.', 'info');
    } catch (err) {
      showToast(err.message || 'Failed to delete shelter.', 'error');
      throw err;
    }
  };

  // Reset store (clears offline queue & refreshes real DB data)
  const resetAllDemoData = () => {
    try {
      localStorage.removeItem(OFFLINE_QUEUE_KEY);
      setOfflineQueue([]);
    } catch (e) {
      console.error(e);
    }
    refreshData();
    showToast('Refreshed data view directly from MySQL database.', 'info');
  };

  // ==============================================================================
  // Dynamic Real Statistics
  // ==============================================================================

  const stats = useMemo(() => {
    const totalRequests = assistanceRequests.length;
    const awaitingAcknowledgment = assistanceRequests.filter((r) => r.status === 'Submitted').length;
    const acknowledgedCount = assistanceRequests.filter((r) => r.status === 'Under Review' || r.status === 'Acknowledged').length;
    const assignedCount = assistanceRequests.filter((r) => r.status === 'Assigned' || r.status === 'Assigned to Responder').length;
    const dispatchedCount = assistanceRequests.filter((r) => r.status === 'Assistance Dispatched').length;
    const deliveredCount = assistanceRequests.filter((r) => r.status === 'In Progress' || r.status === 'Assistance Delivered / In Progress').length;
    const resolvedCount = assistanceRequests.filter((r) => r.status === 'Resolved').length;
    const cancelledCount = assistanceRequests.filter((r) => r.status === 'Cancelled').length;
    const rejectedCount = assistanceRequests.filter((r) => r.status === 'Rejected').length;

    const criticalCount = assistanceRequests.filter((r) => r.urgency === 'Critical').length;
    const highCount = assistanceRequests.filter((r) => r.urgency === 'High').length;
    const mediumCount = assistanceRequests.filter((r) => r.urgency === 'Medium').length;
    const lowCount = assistanceRequests.filter((r) => r.urgency === 'Low').length;

    const highPriorityCount = criticalCount + highCount;
    const activeAssignments = assignedCount + dispatchedCount + deliveredCount;
    const awaitingAssistance = awaitingAcknowledgment + acknowledgedCount + assignedCount;

    const totalShelters = shelters.length;
    const activeShelters = shelters.filter((s) => s.status === 'Active').length;
    const totalCapacity = shelters.reduce((acc, s) => acc + (Number(s.capacity) || 0), 0);
    const totalOccupants = shelters.reduce((acc, s) => acc + (Number(s.currentOccupants) || 0), 0);

    return {
      totalRequests,
      awaitingAcknowledgment,
      acknowledgedCount,
      assignedCount,
      dispatchedCount,
      deliveredCount,
      resolvedCount,
      cancelledCount,
      rejectedCount,
      criticalCount,
      highCount,
      mediumCount,
      lowCount,
      highPriorityCount,
      activeAssignments,
      awaitingAssistance,
      totalShelters,
      activeShelters,
      totalCapacity,
      totalOccupants,
      myRequestsCount: myRequests.length,
      offlinePendingCount: offlineQueue.length
    };
  }, [assistanceRequests, shelters, myRequests, offlineQueue]);

  const value = {
    currentRole,
    currentUser,
    isLoadingAuth,
    isLoadingData,
    backendConnected,
    login,
    register,
    logout,
    updateUserProfile,
    switchRole,
    assistanceRequests,
    myRequests,
    shelters,
    responderTeams: DEMO_RESPONDER_TEAMS,
    stats,
    offlineQueue,
    flushOfflineQueue,
    toast,
    showToast,
    refreshData,
    createAssistanceRequest,
    acknowledgeRequest,
    assignRequest,
    updateRequestStatus,
    verifyRequest,
    addRequestNote,
    cancelRequest,
    updateShelter,
    addShelter,
    deleteShelter,
    resetAllDemoData
  };

  return <CrisisContext.Provider value={value}>{children}</CrisisContext.Provider>;
}

export function useCrisis() {
  const context = useContext(CrisisContext);
  if (!context) {
    throw new Error('useCrisis must be used within a CrisisProvider');
  }
  return context;
}
