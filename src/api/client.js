/**
 * CrisisMap AP - Robust Authenticated API Client
 * Connects React frontend directly to the FastAPI backend.
 */

const RAW_API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_BASE_URL = RAW_API_BASE_URL !== undefined ? RAW_API_BASE_URL.replace(/\/+$/, '') : 'http://127.0.0.1:8000';
const TOKEN_KEY = 'crisismap_auth_token_jwt';

export function getAuthToken() {
  try {
    return localStorage.getItem(TOKEN_KEY) || null;
  } catch {
    return null;
  }
}

export function setAuthToken(token) {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch (e) {
    console.error('Failed to set auth token in localStorage:', e);
  }
}

export async function apiRequest(endpoint, { method = 'GET', data = null, headers = {} } = {}) {
  const token = getAuthToken();

  const reqHeaders = {
    'Content-Type': 'application/json',
    ...headers
  };

  if (token) {
    reqHeaders['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers: reqHeaders
  };

  if (data !== null) {
    options.body = JSON.stringify(data);
  }

  const primaryUrl = API_BASE_URL ? `${API_BASE_URL}${endpoint}` : endpoint;

  let response;
  try {
    response = await fetch(primaryUrl, options);
  } catch (err) {
    // If direct fetch to API_BASE_URL failed (e.g. cross-origin/PNA browser restriction), fallback to relative path proxy
    if (API_BASE_URL && (err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('fetch')))) {
      try {
        response = await fetch(endpoint, options);
      } catch (fallbackErr) {
        const netErr = new Error('Cannot connect to CrisisMap backend server. Please verify the server is running on http://127.0.0.1:8000.');
        netErr.isNetworkError = true;
        throw netErr;
      }
    } else {
      if (err.name === 'TypeError' || (err.message && err.message.toLowerCase().includes('fetch'))) {
        const netErr = new Error('Cannot connect to CrisisMap backend server. Please verify the server is running on http://127.0.0.1:8000.');
        netErr.isNetworkError = true;
        throw netErr;
      }
      throw err;
    }
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get('content-type');
  const isJson = contentType && contentType.includes('application/json');
  const responseData = isJson ? await response.json() : await response.text();

  if (!response.ok) {
    const errorMsg =
      responseData && typeof responseData === 'object' && responseData.detail
        ? (typeof responseData.detail === 'string' ? responseData.detail : JSON.stringify(responseData.detail))
        : `Request failed with status ${response.status}`;
    const err = new Error(errorMsg);
    err.status = response.status;
    err.data = responseData;
    throw err;
  }

  return responseData;
}

// ==============================================================================
// Authentication & Profiles
// ==============================================================================

export const api = {
  // Auth
  register: (userData) => apiRequest('/api/auth/register', { method: 'POST', data: userData }),
  login: (credentials) => apiRequest('/api/auth/login', { method: 'POST', data: credentials }),
  getMe: () => apiRequest('/api/auth/me'),
  updateProfile: (profileData) => apiRequest('/api/auth/profile', { method: 'PUT', data: profileData }),

  // Health
  checkHealth: () => apiRequest('/health'),
  checkDbHealth: () => apiRequest('/health/db'),

  // Emergency Requests
  createRequest: (requestData) => apiRequest('/api/requests', { method: 'POST', data: requestData }),
  getRequests: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/api/requests${qs}`);
  },
  getMyRequests: () => apiRequest('/api/requests/my'),
  getRequestById: (idOrCode) => apiRequest(`/api/requests/${idOrCode}`),
  updateRequestStatus: (id, newStatus, note = '') =>
    apiRequest(`/api/requests/${id}/status`, { method: 'PATCH', data: { new_status: newStatus, note } }),
  assignRequest: (id, { responderId, responderName, organizationId, note } = {}) =>
    apiRequest(`/api/requests/${id}/assign`, {
      method: 'POST',
      data: {
        responder_id: responderId,
        responder_name: responderName,
        organization_id: organizationId,
        note
      }
    }),
  verifyRequest: (id, verificationStatus, urgency = null, note = '') =>
    apiRequest(`/api/requests/${id}/verify`, {
      method: 'PATCH',
      data: {
        verification_status: verificationStatus,
        urgency,
        note
      }
    }),
  addRequestNote: (id, note) =>
    apiRequest(`/api/requests/${id}/notes`, { method: 'POST', data: { note } }),
  cancelRequest: (id, reason) => {
    const qs = reason ? `?reason=${encodeURIComponent(reason)}` : '';
    return apiRequest(`/api/requests/${id}/cancel${qs}`, { method: 'POST' });
  },

  // Shelters
  getShelters: (params = {}) => {
    const query = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v) query.append(k, v);
    });
    const qs = query.toString() ? `?${query.toString()}` : '';
    return apiRequest(`/api/shelters${qs}`);
  },
  createShelter: (shelterData) => apiRequest('/api/shelters', { method: 'POST', data: shelterData }),
  updateShelter: (id, updates) => apiRequest(`/api/shelters/${id}`, { method: 'PATCH', data: updates }),
  deleteShelter: (id) => apiRequest(`/api/shelters/${id}`, { method: 'DELETE' }),

  // Administrator
  getUsers: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/users${query ? '?' + query : ''}`);
  },
  updateUserStatus: (id, status) => apiRequest(`/api/admin/users/${id}/status`, { method: 'PATCH', data: { status } }),
  getOrganizations: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/organizations${query ? '?' + query : ''}`);
  },
  createOrganization: (orgData) => apiRequest('/api/admin/organizations', { method: 'POST', data: orgData }),
  updateOrganizationStatus: (id, status) =>
    apiRequest(`/api/admin/organizations/${id}/status`, { method: 'PATCH', data: { status } }),
  provisionUser: (userData) =>
    apiRequest('/api/admin/users/provision', { method: 'POST', data: userData }),
  getStats: () => apiRequest('/api/admin/stats'),

  // Government Official Verification & Access Requests
  requestGovernmentAccess: (data) =>
    apiRequest('/api/auth/government/request-access', { method: 'POST', data }),
  checkGovernmentRequestStatus: (email) =>
    apiRequest(`/api/auth/government/request-status?email=${encodeURIComponent(email)}`),
  getGovernmentRequests: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return apiRequest(`/api/admin/government-requests${query ? '?' + query : ''}`);
  },
  decideGovernmentRequest: (id, decision) =>
    apiRequest(`/api/admin/government-requests/${id}/decision`, { method: 'PATCH', data: decision }),

  // Password Reset
  resetPassword: (data) =>
    apiRequest('/api/auth/reset-password', { method: 'POST', data }),
  adminResetUserPassword: (id, new_password) =>
    apiRequest(`/api/admin/users/${id}/reset-password`, { method: 'POST', data: { new_password } })
};

export default api;
