import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useCrisis } from '../context/CrisisContext';
import { api } from '../api/client';
import { AP_DISTRICTS } from '../data/districts';
import EmptyState from '../components/common/EmptyState';
import {
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCcw,
  Search,
  Filter,
  Users,
  Building2,
  Plus,
  X,
  History,
  AlertTriangle,
  UserCheck,
  LogOut,
  User,
  KeyRound,
  ExternalLink,
  ChevronRight,
  Shield,
  Layers,
  Lock,
  Activity,
  Check,
  Mail,
  Phone,
  FileText,
  BadgeCheck
} from 'lucide-react';

export default function AdminPortalPage() {
  const { currentUser, showToast, logout } = useCrisis();
  const navigate = useNavigate();
  const location = useLocation();

  // Active Section: 'overview' | 'pending-ngos' | 'approved-orgs' | 'rejected-apps' | 'gov-accounts' | 'users'
  const [activeSection, setActiveSection] = useState(() => {
    const params = new URLSearchParams(location.search);
    const sec = params.get('section') || params.get('tab');
    if (sec === 'pending' || sec === 'pending-ngos') return 'pending-ngos';
    if (sec === 'approved' || sec === 'approved-orgs') return 'approved-orgs';
    if (sec === 'rejected' || sec === 'rejected-apps') return 'rejected-apps';
    if (sec === 'gov' || sec === 'gov-accounts') return 'gov-accounts';
    if (sec === 'users' || sec === 'user-management') return 'users';
    return 'overview';
  });

  // State from real database
  const [users, setUsers] = useState([]);
  const [organizations, setOrganizations] = useState([]);
  const [govRequests, setGovRequests] = useState([]);
  const [stats, setStats] = useState({
    total_requests: 0,
    submitted_count: 0,
    verified_count: 0,
    resolved_count: 0,
    critical_count: 0,
    total_shelters: 0,
    pending_responders_count: 0
  });

  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Government accounts view: 'requests' | 'provisioned'
  const [govViewSubTab, setGovViewSubTab] = useState('requests');
  const [govReqFilter, setGovReqFilter] = useState('all');

  // Filters & Search for User Management
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('all');
  const [userStatusFilter, setUserStatusFilter] = useState('all');

  // Provisioning Modal State
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [provisionForm, setProvisionForm] = useState({
    full_name: '',
    email: '',
    phone: '1070',
    password: '',
    role: 'government_official',
    district: 'AP Disaster Management Command',
    title_or_designation: 'District Disaster Management Officer'
  });
  const [isProvisioning, setIsProvisioning] = useState(false);

  // Rejection Modal State
  const [rejectModal, setRejectModal] = useState(null); // { user, note: '' }

  // Admin Password Reset Modal State
  const [resetPasswordModal, setResetPasswordModal] = useState(null); // { user, newPassword: '' }
  const [isResettingPw, setIsResettingPw] = useState(false);

  // Government Request Decision Modal State
  const [govDecisionModal, setGovDecisionModal] = useState(null); // { request, decision: 'approved'|'rejected', notes: '' }
  const [isDecidingGov, setIsDecidingGov] = useState(false);

  // Sync section with URL search
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const sec = params.get('section');
    if (sec) setActiveSection(sec);
  }, [location.search]);

  // Load all authentic database records
  const loadDatabaseData = async () => {
    setIsLoading(true);
    try {
      const [usersData, orgsData, statsData, govReqsData] = await Promise.all([
        api.getUsers(),
        api.getOrganizations(),
        api.getStats().catch(() => ({})),
        api.getGovernmentRequests().catch(() => ([]))
      ]);
      setUsers(usersData || []);
      setOrganizations(orgsData || []);
      setGovRequests(govReqsData || []);
      if (statsData) setStats(statsData);
    } catch (err) {
      console.error('Failed to load admin telemetry:', err);
      showToast(err.message || 'Error fetching records from backend MySQL.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDatabaseData();
  }, []);

  // Filtered Collections derived from authentic records
  const pendingNgos = useMemo(() => {
    return users.filter(u => (u.role === 'responder' || u.role === 'ngo') && u.status === 'pending_approval');
  }, [users]);

  const approvedOrgs = useMemo(() => {
    return users.filter(u => (u.role === 'responder' || u.role === 'ngo') && u.status === 'active');
  }, [users]);

  const rejectedApplications = useMemo(() => {
    return users.filter(u => (u.role === 'responder' || u.role === 'ngo') && u.status === 'rejected');
  }, [users]);

  const governmentAccounts = useMemo(() => {
    return users.filter(u =>
      u.role === 'government_official' ||
      u.role === 'admin' ||
      u.role === 'official' ||
      u.role === 'government'
    );
  }, [users]);

  const pendingGovRequests = useMemo(() => {
    return govRequests.filter(r => r.status === 'pending');
  }, [govRequests]);

  const filteredGovRequests = useMemo(() => {
    if (govReqFilter === 'all') return govRequests;
    return govRequests.filter(r => r.status === govReqFilter);
  }, [govRequests, govReqFilter]);

  const filteredUsers = useMemo(() => {
    return users.filter(u => {
      if (userRoleFilter !== 'all') {
        if (userRoleFilter === 'responder' && u.role !== 'responder' && u.role !== 'ngo') return false;
        if (userRoleFilter === 'government_official' && u.role !== 'government_official' && u.role !== 'government' && u.role !== 'official') return false;
        if (userRoleFilter !== 'responder' && userRoleFilter !== 'government_official' && u.role !== userRoleFilter) return false;
      }
      if (userStatusFilter !== 'all' && u.status !== userStatusFilter) return false;
      if (userSearch.trim()) {
        const q = userSearch.toLowerCase();
        const mName = u.full_name?.toLowerCase().includes(q);
        const mEmail = u.email?.toLowerCase().includes(q);
        const mDist = u.district?.toLowerCase().includes(q);
        const mOrg = u.organization_name?.toLowerCase().includes(q);
        if (!mName && !mEmail && !mDist && !mOrg) return false;
      }
      return true;
    });
  }, [users, userRoleFilter, userStatusFilter, userSearch]);

  // Handle Approve NGO Application
  const handleApproveNgo = async (targetUser) => {
    setActionLoadingId(targetUser.id);
    try {
      await api.updateUserStatus(targetUser.id, 'active');
      showToast(`Application approved! "${targetUser.organization_name || targetUser.full_name}" is now active.`, 'success');
      await loadDatabaseData();
    } catch (err) {
      showToast(err.message || 'Failed to approve application.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Reject NGO Application
  const handleConfirmReject = async () => {
    if (!rejectModal) return;
    setActionLoadingId(rejectModal.user.id);
    try {
      await api.updateUserStatus(rejectModal.user.id, 'rejected');
      showToast(`Application for "${rejectModal.user.organization_name || rejectModal.user.full_name}" rejected.`, 'info');
      setRejectModal(null);
      await loadDatabaseData();
    } catch (err) {
      showToast(err.message || 'Failed to reject application.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Suspend / Toggle User Status
  const handleToggleUserStatus = async (targetUser, newStatus) => {
    if (targetUser.id === currentUser?.id && newStatus !== 'active') {
      showToast('Administrators cannot suspend their own active session.', 'warning');
      return;
    }
    setActionLoadingId(targetUser.id);
    try {
      await api.updateUserStatus(targetUser.id, newStatus);
      showToast(`User ${targetUser.email} status changed to '${newStatus}'.`, 'success');
      await loadDatabaseData();
    } catch (err) {
      showToast(err.message || 'Failed to update user status.', 'error');
    } finally {
      setActionLoadingId(null);
    }
  };

  // Handle Provisioning Privileged User from Modal
  const handleProvisionSubmit = async (e) => {
    e.preventDefault();
    setIsProvisioning(true);
    try {
      await api.provisionUser(provisionForm);
      showToast(`Successfully provisioned ${provisionForm.role.toUpperCase()} account for ${provisionForm.email}!`, 'success');
      setShowProvisionModal(false);
      setProvisionForm({
        full_name: '',
        email: '',
        phone: '1070',
        password: '',
        role: 'government_official',
        district: 'AP Disaster Management Command',
        title_or_designation: 'District Disaster Management Officer'
      });
      await loadDatabaseData();
    } catch (err) {
      showToast(err.message || 'Provisioning failed. Check requirements.', 'error');
    } finally {
      setIsProvisioning(false);
    }
  };

  // Handle Government Access Request Decision (Verify & Provision OR Reject)
  const handleConfirmGovDecision = async (e) => {
    e.preventDefault();
    if (!govDecisionModal) return;
    setIsDecidingGov(true);
    try {
      await api.decideGovernmentRequest(govDecisionModal.request.id, {
        status: govDecisionModal.decision,
        admin_notes: govDecisionModal.notes
      });
      const actionLabel = govDecisionModal.decision === 'approved' ? 'approved & provisioned' : 'rejected';
      showToast(`Government access request for ${govDecisionModal.request.email} ${actionLabel} successfully!`, 'success');
      setGovDecisionModal(null);
      await loadDatabaseData();
    } catch (err) {
      showToast(err.message || 'Failed to record decision.', 'error');
    } finally {
      setIsDecidingGov(false);
    }
  };

  // Handle Admin User Password Reset
  const handleAdminResetPasswordSubmit = async (e) => {
    e.preventDefault();
    if (!resetPasswordModal || !resetPasswordModal.newPassword) return;
    if (resetPasswordModal.newPassword.length < 6) {
      showToast('Password must be at least 6 characters.', 'error');
      return;
    }
    setIsResettingPw(true);
    try {
      await api.adminResetUserPassword(resetPasswordModal.user.id, resetPasswordModal.newPassword);
      showToast(`Password for ${resetPasswordModal.user.email} has been reset successfully!`, 'success');
      setResetPasswordModal(null);
      await loadDatabaseData();
    } catch (err) {
      showToast(err.message || 'Password reset failed.', 'error');
    } finally {
      setIsResettingPw(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const switchSection = (sectionKey) => {
    setActiveSection(sectionKey);
    navigate(`/admin?section=${sectionKey}`, { replace: true });
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Administrator Header */}
      <div className="bg-gradient-to-r from-navy-950 via-slate-900 to-navy-950 rounded-2xl p-6 sm:p-8 text-white shadow-xl flex flex-col md:flex-row items-start md:items-center justify-between gap-6 border border-navy-800">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold uppercase tracking-wider border border-indigo-500/30">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>State Administrator Command & Governance</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            CrisisMap AP &bull; Administrator Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-2xl leading-relaxed">
            Logged in: <strong>{currentUser?.full_name}</strong> ({currentUser?.email}) &bull; Role: <strong className="uppercase text-amber-400">STATE ADMINISTRATOR</strong> &bull; System Jurisdiction: <strong>Andhra Pradesh Operations</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/government"
            className="px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-slate-200 text-xs font-semibold border border-navy-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Activity className="w-3.5 h-3.5 text-red-400" />
            <span>Operations Center & SOS Queue</span>
          </Link>

          <button
            onClick={() => { loadDatabaseData(); showToast('Telemetry reloaded from MySQL database.', 'info'); }}
            className="px-3.5 py-2 rounded-xl bg-navy-800 hover:bg-navy-700 text-white text-xs font-semibold border border-navy-700 transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <RotateCcw className={`w-3.5 h-3.5 text-blue-400 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-red-950/60 hover:bg-red-900 text-red-200 text-xs font-semibold border border-red-800/60 transition-colors flex items-center gap-1.5"
          >
            <LogOut className="w-3.5 h-3.5 text-red-400" />
            <span>Logout</span>
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 text-xs overflow-x-auto pb-1">
        <button
          onClick={() => switchSection('overview')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'overview'
              ? 'border-navy-900 text-navy-950 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Layers className="w-4 h-4 text-navy-800" />
          <span>Overview</span>
        </button>

        <button
          onClick={() => switchSection('pending-ngos')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'pending-ngos'
              ? 'border-amber-600 text-amber-800 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <UserCheck className="w-4 h-4 text-amber-600" />
          <span>Pending NGO Applications</span>
          {pendingNgos.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-mono text-[10px] font-bold">
              {pendingNgos.length}
            </span>
          )}
        </button>

        <button
          onClick={() => switchSection('approved-orgs')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'approved-orgs'
              ? 'border-emerald-600 text-emerald-800 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Building2 className="w-4 h-4 text-emerald-600" />
          <span>Approved Organizations</span>
          <span className="px-1.5 py-0.2 rounded-full bg-emerald-100 text-emerald-800 font-mono text-[10px]">
            {approvedOrgs.length}
          </span>
        </button>

        <button
          onClick={() => switchSection('rejected-apps')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'rejected-apps'
              ? 'border-red-600 text-red-800 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <XCircle className="w-4 h-4 text-red-600" />
          <span>Rejected Applications</span>
          {rejectedApplications.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-red-100 text-red-800 font-mono text-[10px]">
              {rejectedApplications.length}
            </span>
          )}
        </button>

        <button
          onClick={() => switchSection('gov-accounts')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'gov-accounts'
              ? 'border-indigo-600 text-indigo-800 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <ShieldAlert className="w-4 h-4 text-indigo-600" />
          <span>Government Portal & Verification</span>
          {pendingGovRequests.length > 0 && (
            <span className="px-1.5 py-0.2 rounded-full bg-indigo-100 text-indigo-800 font-mono text-[10px] font-bold">
              {pendingGovRequests.length} Pending
            </span>
          )}
        </button>

        <button
          onClick={() => switchSection('users')}
          className={`px-4 py-2.5 rounded-t-xl font-bold border-b-2 transition-all flex items-center gap-2 whitespace-nowrap ${
            activeSection === 'users'
              ? 'border-blue-600 text-blue-800 bg-white shadow-sm'
              : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <Users className="w-4 h-4 text-blue-600" />
          <span>User Oversight Directory</span>
          <span className="px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700 font-mono text-[10px]">
            {users.length}
          </span>
        </button>

        <button
          onClick={handleLogout}
          className="ml-auto px-3.5 py-2 rounded-t-xl font-semibold text-slate-500 hover:text-red-600 transition-colors flex items-center gap-1.5 whitespace-nowrap"
        >
          <LogOut className="w-3.5 h-3.5 text-red-500" />
          <span>Logout</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 1: OVERVIEW */}
      {/* ========================================================================= */}
      {activeSection === 'overview' && (
        <div className="space-y-6">
          {/* Action Alert Banner for Pending NGOs or Gov Requests */}
          {(pendingNgos.length > 0 || pendingGovRequests.length > 0) && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-300 text-amber-950 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-sm">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-200 text-amber-900 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-sm text-amber-950">
                    Pending Verification Queue: {pendingNgos.length} NGO Application{pendingNgos.length !== 1 ? 's' : ''} &bull; {pendingGovRequests.length} Government Official Request{pendingGovRequests.length !== 1 ? 's' : ''}
                  </h3>
                  <p className="text-xs text-amber-800 mt-0.5">
                    Relief organizations and government commanders require administrator verification before active dispatch or command permissions are authorized.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {pendingNgos.length > 0 && (
                  <button
                    onClick={() => switchSection('pending-ngos')}
                    className="px-3.5 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>Review NGOs ({pendingNgos.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
                {pendingGovRequests.length > 0 && (
                  <button
                    onClick={() => { switchSection('gov-accounts'); setGovViewSubTab('requests'); }}
                    className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1 whitespace-nowrap"
                  >
                    <span>Review Officials ({pendingGovRequests.length})</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Genuine Telemetry KPIs */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Users</span>
              <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">{users.length}</p>
              <span className="text-[10px] text-slate-400">In MySQL DB</span>
            </div>

            <div
              onClick={() => switchSection('pending-ngos')}
              className="p-4 rounded-xl bg-white border border-amber-200 shadow-sm cursor-pointer hover:border-amber-400 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase text-amber-700">Pending NGOs</span>
              <p className="text-2xl font-extrabold font-mono text-amber-600 mt-1">{pendingNgos.length}</p>
              <span className="text-[10px] text-amber-600 font-semibold">Needs review &bull; Click</span>
            </div>

            <div
              onClick={() => switchSection('approved-orgs')}
              className="p-4 rounded-xl bg-white border border-emerald-200 shadow-sm cursor-pointer hover:border-emerald-400 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase text-emerald-700">Approved NGOs</span>
              <p className="text-2xl font-extrabold font-mono text-emerald-600 mt-1">{approvedOrgs.length}</p>
              <span className="text-[10px] text-emerald-600">Active responders</span>
            </div>

            <div
              onClick={() => { switchSection('gov-accounts'); setGovViewSubTab('requests'); }}
              className="p-4 rounded-xl bg-white border border-indigo-200 shadow-sm cursor-pointer hover:border-indigo-400 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase text-indigo-700">Gov Requests</span>
              <p className="text-2xl font-extrabold font-mono text-indigo-600 mt-1">{pendingGovRequests.length}</p>
              <span className="text-[10px] text-indigo-600 font-semibold">Pending review</span>
            </div>

            <div
              onClick={() => { switchSection('gov-accounts'); setGovViewSubTab('provisioned'); }}
              className="p-4 rounded-xl bg-white border border-indigo-200 shadow-sm cursor-pointer hover:border-indigo-400 transition-colors"
            >
              <span className="text-[10px] font-bold uppercase text-indigo-700">Gov Officials</span>
              <p className="text-2xl font-extrabold font-mono text-indigo-600 mt-1">{governmentAccounts.length}</p>
              <span className="text-[10px] text-indigo-600">Active command</span>
            </div>

            <div className="p-4 rounded-xl bg-white border border-slate-200 shadow-sm">
              <span className="text-[10px] font-bold uppercase text-slate-400">Total Citizens</span>
              <p className="text-2xl font-extrabold font-mono text-slate-900 mt-1">
                {users.filter(u => u.role === 'citizen').length}
              </p>
              <span className="text-[10px] text-slate-400">Direct registered</span>
            </div>
          </div>

          {/* Quick Access Action Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">NGO Verification Workflow</h4>
                  <p className="text-xs text-slate-500">Review organization credentials & synchronize field permissions.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                NGO registrations begin in <code>pending_approval</code> status. Approving an organization automatically synchronizes all registered representatives in the MySQL database.
              </p>
              <button
                onClick={() => switchSection('pending-ngos')}
                className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <span>View {pendingNgos.length} Pending Application{pendingNgos.length !== 1 ? 's' : ''}</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                  <ShieldAlert className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Government Verification & Provisioning</h4>
                  <p className="text-xs text-slate-500">Review submitted access requests and provision verified command accounts.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Public registration cannot directly access government accounts. Administrators review claimed authority, employee ID, and department before provisioning accounts.
              </p>
              <button
                onClick={() => { switchSection('gov-accounts'); setGovViewSubTab('requests'); }}
                className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <BadgeCheck className="w-3.5 h-3.5" />
                <span>Review {pendingGovRequests.length} Official Request{pendingGovRequests.length !== 1 ? 's' : ''}</span>
              </button>
            </div>

            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center">
                  <Users className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-slate-900">Complete User Oversight</h4>
                  <p className="text-xs text-slate-500">Filter, inspect, and reset credentials across all personas.</p>
                </div>
              </div>
              <p className="text-xs text-slate-600 leading-relaxed">
                Audit registered citizens, accredited NGOs, and commanders. Enforce account suspension or securely reset passwords when credentials are lost.
              </p>
              <button
                onClick={() => switchSection('users')}
                className="w-full py-2.5 rounded-xl bg-navy-900 hover:bg-navy-800 text-white font-bold text-xs shadow-sm transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Browse All {users.length} Users</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 2: PENDING NGO APPLICATIONS */}
      {/* ========================================================================= */}
      {activeSection === 'pending-ngos' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-3">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-amber-600" />
                  <span>Pending NGO & Relief Organization Applications</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review applicant credentials before activating dispatch permissions. Decisions and timestamps are persisted in MySQL.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-amber-100 text-amber-800">
                {pendingNgos.length} Pending Approval
              </span>
            </div>

            {pendingNgos.length === 0 ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8" />
                </div>
                <h4 className="text-base font-bold text-slate-900">No Pending NGO Applications</h4>
                <p className="text-xs text-slate-500 max-w-md mx-auto">
                  All relief organization and responder applications have been reviewed. New applications submitted by humanitarian teams will appear here automatically.
                </p>
              </div>
            ) : (
              <div className="space-y-4 pt-2">
                {pendingNgos.map((ngo) => (
                  <div
                    key={ngo.id}
                    className="p-5 rounded-xl border-2 border-amber-200 bg-amber-50/30 space-y-4 hover:border-amber-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-amber-200/60 pb-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-base font-extrabold text-navy-950">
                            {ngo.organization_name || ngo.full_name}
                          </h4>
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 uppercase">
                            Pending Review
                          </span>
                        </div>
                        <p className="text-xs text-slate-600 mt-0.5">
                          Applicant: <strong>{ngo.full_name}</strong> {ngo.title_or_designation ? `(${ngo.title_or_designation})` : ''} &bull; Operational Base: <strong>{ngo.district || 'Andhra Pradesh'}</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2 text-xs text-slate-500">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>Submitted: {new Date(ngo.created_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Contact Email</span>
                        <p className="font-semibold text-slate-800 truncate">{ngo.email}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Phone</span>
                        <p className="font-semibold text-slate-800">{ngo.phone || 'Not provided'}</p>
                      </div>
                      <div className="p-3 rounded-lg bg-white border border-slate-200 space-y-1">
                        <span className="text-[10px] uppercase font-bold text-slate-400">Assigned ID</span>
                        <p className="font-mono font-bold text-slate-800">USER-AP-{ngo.id}</p>
                      </div>
                    </div>

                    {/* Action Decision Buttons */}
                    <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
                      <button
                        onClick={() => setRejectModal({ user: ngo, note: '' })}
                        disabled={actionLoadingId === ngo.id}
                        className="px-4 py-2 rounded-xl bg-white border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                      >
                        <XCircle className="w-4 h-4 text-red-600" />
                        <span>Reject Application</span>
                      </button>

                      <button
                        onClick={() => handleApproveNgo(ngo)}
                        disabled={actionLoadingId === ngo.id}
                        className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        <span>{actionLoadingId === ngo.id ? 'Processing...' : 'Approve & Activate NGO'}</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 3: APPROVED ORGANIZATIONS */}
      {/* ========================================================================= */}
      {activeSection === 'approved-orgs' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-emerald-600" />
                <span>Approved Relief Organizations & Field Battalions</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Accredited humanitarian partners authorized to claim rescue requests and coordinate relief dispatches.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-100 text-emerald-800">
              {approvedOrgs.length} Active Organizations
            </span>
          </div>

          {approvedOrgs.length === 0 ? (
            <EmptyState
              title="No Approved Organizations Found"
              description="No NGO applications have been approved yet. Review pending applications to activate accredited response units."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Organization</th>
                    <th className="px-4 py-3">Representative</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Approved Timestamp</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {approvedOrgs.map((org) => (
                    <tr key={org.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3 font-bold text-navy-950">
                        {org.organization_name || org.full_name}
                      </td>
                      <td className="px-4 py-3 text-slate-700">
                        {org.full_name} {org.title_or_designation && <span className="text-slate-400">({org.title_or_designation})</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-600">
                        <div>{org.email}</div>
                        <div className="text-slate-400 text-[11px]">{org.phone || 'N/A'}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-700">{org.district || 'Andhra Pradesh'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 border border-emerald-200">
                          ACTIVE & ACCREDITED
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {org.updated_at ? new Date(org.updated_at).toLocaleString('en-IN') : new Date(org.created_at).toLocaleString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => setResetPasswordModal({ user: org, newPassword: '' })}
                            className="px-2.5 py-1 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-800 font-semibold text-[11px] border border-indigo-200 flex items-center gap-1"
                            title="Reset NGO Password"
                          >
                            <KeyRound className="w-3 h-3 text-indigo-600" />
                            <span>Reset PW</span>
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(org, 'suspended')}
                            disabled={actionLoadingId === org.id}
                            className="px-2.5 py-1 rounded-lg bg-amber-50 hover:bg-amber-100 text-amber-800 font-semibold text-[11px] border border-amber-200"
                          >
                            Suspend Access
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 4: REJECTED APPLICATIONS */}
      {/* ========================================================================= */}
      {activeSection === 'rejected-apps' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <XCircle className="w-5 h-5 text-red-600" />
                <span>Rejected Applications Archive</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Archived registrations rejected due to insufficient credentials or failed authority verification.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-red-100 text-red-800">
              {rejectedApplications.length} Rejected
            </span>
          </div>

          {rejectedApplications.length === 0 ? (
            <EmptyState
              title="No Rejected Applications"
              description="No applications have been rejected."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                  <tr>
                    <th className="px-4 py-3">Applicant / Organization</th>
                    <th className="px-4 py-3">Contact</th>
                    <th className="px-4 py-3">District</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-4 py-3">Decision Date</th>
                    <th className="px-4 py-3 text-right">Re-evaluate</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {rejectedApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-bold text-slate-900">{app.organization_name || app.full_name}</div>
                        <div className="text-[11px] text-slate-500">{app.full_name}</div>
                      </td>
                      <td className="px-4 py-3 text-slate-600 font-mono">{app.email}</td>
                      <td className="px-4 py-3 text-slate-700">{app.district || 'Andhra Pradesh'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-800">
                          REJECTED
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500 font-mono text-[11px]">
                        {new Date(app.updated_at || app.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <button
                          onClick={() => handleApproveNgo(app)}
                          disabled={actionLoadingId === app.id}
                          className="px-3 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-800 font-semibold text-[11px] border border-emerald-200"
                        >
                          Re-approve
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 5: GOVERNMENT ACCOUNTS & ACCESS REQUEST REVIEW */}
      {/* ========================================================================= */}
      {activeSection === 'gov-accounts' && (
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-5">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <ShieldAlert className="w-5 h-5 text-indigo-600" />
                  <span>Government Official Verification & Account Provisioning</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Review incoming access requests, verify employment and credentials, and manage provisioned accounts.
                </p>
              </div>

              <button
                onClick={() => setShowProvisionModal(true)}
                className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Direct Provision Account</span>
              </button>
            </div>

            {/* Sub-tabs: Incoming Access Requests vs Provisioned Officials */}
            <div className="flex border-b border-slate-200 gap-2 text-xs font-bold">
              <button
                onClick={() => setGovViewSubTab('requests')}
                className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-2 ${
                  govViewSubTab === 'requests'
                    ? 'border-indigo-600 text-indigo-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <FileText className="w-4 h-4 text-indigo-600" />
                <span>Official Access Requests</span>
                <span className="px-2 py-0.2 rounded-full bg-indigo-100 text-indigo-800 text-[10px]">
                  {pendingGovRequests.length} Pending
                </span>
              </button>

              <button
                onClick={() => setGovViewSubTab('provisioned')}
                className={`pb-2.5 px-3 border-b-2 transition-colors flex items-center gap-2 ${
                  govViewSubTab === 'provisioned'
                    ? 'border-indigo-600 text-indigo-900 font-extrabold'
                    : 'border-transparent text-slate-500 hover:text-slate-800'
                }`}
              >
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                <span>Provisioned Government Officials ({governmentAccounts.length})</span>
              </button>
            </div>

            {/* SUB-VIEW A: GOVERNMENT ACCESS REQUESTS */}
            {govViewSubTab === 'requests' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-slate-600">Filter status:</span>
                    <select
                      value={govReqFilter}
                      onChange={(e) => setGovReqFilter(e.target.value)}
                      className="px-2 py-1 rounded-lg border border-slate-200 text-xs font-semibold focus:outline-none"
                    >
                      <option value="all">All Requests ({govRequests.length})</option>
                      <option value="pending">Pending Review ({pendingGovRequests.length})</option>
                      <option value="approved">Approved & Provisioned</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>
                </div>

                {filteredGovRequests.length === 0 ? (
                  <EmptyState
                    title="No Government Access Requests"
                    description="No access requests match the selected status filter."
                  />
                ) : (
                  <div className="space-y-4">
                    {filteredGovRequests.map((req) => (
                      <div
                        key={req.id}
                        className={`p-5 rounded-2xl border-2 space-y-4 transition-all ${
                          req.status === 'pending'
                            ? 'border-indigo-200 bg-indigo-50/20 hover:border-indigo-300'
                            : req.status === 'approved'
                            ? 'border-emerald-200 bg-emerald-50/20'
                            : 'border-red-200 bg-red-50/20'
                        }`}
                      >
                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-200/60 pb-3">
                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="text-base font-extrabold text-navy-950">
                                {req.full_name}
                              </h4>
                              <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full uppercase tracking-wider ${
                                req.status === 'approved'
                                  ? 'bg-emerald-100 text-emerald-900 border border-emerald-200'
                                  : req.status === 'rejected'
                                  ? 'bg-red-100 text-red-900 border border-red-200'
                                  : 'bg-indigo-100 text-indigo-900 border border-indigo-200'
                              }`}>
                                {req.status === 'approved' ? 'APPROVED & PROVISIONED' : req.status === 'rejected' ? 'REJECTED' : 'PENDING REVIEW'}
                              </span>
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {req.designation} &bull; <strong>{req.department}</strong> &bull; District: <strong>{req.district}</strong>
                            </p>
                          </div>

                          <div className="text-xs text-slate-500 font-mono">
                            Submitted: {new Date(req.created_at).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Official Email</span>
                            <p className="font-semibold text-slate-900 font-mono truncate">{req.email}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Contact Phone</span>
                            <p className="font-semibold text-slate-900">{req.phone || 'N/A'}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Employee ID / Badge</span>
                            <p className="font-semibold font-mono text-indigo-900">{req.employee_id}</p>
                          </div>
                          <div className="p-3 rounded-xl bg-white border border-slate-200 space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Request Tracking ID</span>
                            <p className="font-semibold font-mono text-slate-700">GOV-REQ-{req.id}</p>
                          </div>
                        </div>

                        {req.verification_details && (
                          <div className="p-3 rounded-xl bg-white border border-slate-200 text-xs space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Claimed Verification & Authority Proof</span>
                            <p className="text-slate-700">{req.verification_details}</p>
                          </div>
                        )}

                        {req.admin_notes && (
                          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-1">
                            <span className="text-[10px] uppercase font-bold text-slate-400">Administrator Decision Notes</span>
                            <p className="text-slate-800 font-semibold">{req.admin_notes}</p>
                          </div>
                        )}

                        {/* Action buttons for pending requests */}
                        {req.status === 'pending' && (
                          <div className="flex flex-wrap items-center justify-end gap-2 pt-1 border-t border-slate-200/50">
                            <button
                              onClick={() => setGovDecisionModal({ request: req, decision: 'rejected', notes: 'Credentials or jurisdiction could not be verified.' })}
                              className="px-3.5 py-1.5 rounded-xl border border-red-300 text-red-700 hover:bg-red-50 text-xs font-bold transition-colors flex items-center gap-1.5"
                            >
                              <XCircle className="w-3.5 h-3.5 text-red-600" />
                              <span>Reject Request</span>
                            </button>

                            <button
                              onClick={() => setGovDecisionModal({ request: req, decision: 'approved', notes: `Verified ${req.designation} authority and employee ID ${req.employee_id}. Account provisioned.` })}
                              className="px-4 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-md transition-all flex items-center gap-1.5"
                            >
                              <BadgeCheck className="w-3.5 h-3.5" />
                              <span>Verify & Provision Official Account</span>
                            </button>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* SUB-VIEW B: PROVISIONED OFFICIALS TABLE */}
            {govViewSubTab === 'provisioned' && (
              <div className="space-y-4">
                <div className="p-4 rounded-xl bg-slate-900 text-slate-200 text-xs space-y-2 border border-slate-800">
                  <div className="flex items-center gap-2 text-amber-400 font-bold text-[11px]">
                    <KeyRound className="w-4 h-4" />
                    <span>Secure Local CLI Provisioning Procedure</span>
                  </div>
                  <p className="text-[11px] text-slate-300">
                    You can also bootstrap or provision accounts from the <code>backend/</code> working directory:
                  </p>
                  <div className="p-2.5 rounded bg-black/60 font-mono text-[11px] text-emerald-400 space-y-1">
                    <div>python -m app.cli provision-government --email official@ap.gov.in --password &lt;secret&gt; --name &quot;Commander Name&quot;</div>
                    <div className="text-slate-400"># Or provision administrator:</div>
                    <div>python -m app.cli provision-admin --email admin@crisismap.org --password &lt;secret&gt; --name &quot;Admin Name&quot;</div>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                      <tr>
                        <th className="px-4 py-3">Officer Name & Title</th>
                        <th className="px-4 py-3">Official Email</th>
                        <th className="px-4 py-3">District / Center</th>
                        <th className="px-4 py-3">Role</th>
                        <th className="px-4 py-3">Status</th>
                        <th className="px-4 py-3 text-right">Access Control</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {governmentAccounts.map((officer) => (
                        <tr key={officer.id} className="hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="font-bold text-navy-950">{officer.full_name}</div>
                            <div className="text-[11px] text-slate-400">{officer.title_or_designation || 'Operations Officer'}</div>
                          </td>
                          <td className="px-4 py-3 text-slate-700 font-mono">{officer.email}</td>
                          <td className="px-4 py-3 text-slate-600">{officer.district || 'State Operations'}</td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              officer.role === 'admin'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-indigo-100 text-indigo-800 border border-indigo-200'
                            }`}>
                              {officer.role === 'admin' ? 'STATE ADMINISTRATOR' : 'GOVERNMENT OFFICIAL'}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                              officer.status === 'active'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {officer.status.toUpperCase()}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-right">
                            {officer.id === currentUser?.id ? (
                              <span className="text-[10px] text-slate-400 font-semibold italic">Current Active Session</span>
                            ) : (
                              <div className="flex items-center justify-end gap-1.5">
                                <button
                                  onClick={() => setResetPasswordModal({ user: officer, newPassword: '' })}
                                  className="px-2 py-1 rounded text-[11px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200"
                                  title="Reset Official Password"
                                >
                                  Reset PW
                                </button>
                                <button
                                  onClick={() => handleToggleUserStatus(officer, officer.status === 'active' ? 'suspended' : 'active')}
                                  disabled={actionLoadingId === officer.id}
                                  className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border ${
                                    officer.status === 'active'
                                      ? 'bg-red-50 hover:bg-red-100 text-red-700 border-red-200'
                                      : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                  }`}
                                >
                                  {officer.status === 'active' ? 'Suspend' : 'Reactivate'}
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* SECTION 6: USER MANAGEMENT */}
      {/* ========================================================================= */}
      {activeSection === 'users' && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-100 pb-4">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-blue-600" />
                <span>Complete User Oversight Directory</span>
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Centralized registry of all citizen accounts, accredited responders, and command officials.
              </p>
            </div>
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-slate-100 text-slate-800">
              {filteredUsers.length} of {users.length} Users Displayed
            </span>
          </div>

          {/* User Filters Bar */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 flex flex-wrap items-center justify-between gap-3 text-xs">
            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                <input
                  type="text"
                  placeholder="Search by name, email, district..."
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  className="pl-8 pr-3 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none w-52 sm:w-64"
                />
              </div>

              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
              >
                <option value="all">All Roles</option>
                <option value="citizen">Citizens</option>
                <option value="responder">NGOs / Responders</option>
                <option value="government_official">Government Officials</option>
                <option value="admin">Administrators</option>
              </select>

              <select
                value={userStatusFilter}
                onChange={(e) => setUserStatusFilter(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 text-xs focus:outline-none"
              >
                <option value="all">All Account Statuses</option>
                <option value="active">Active</option>
                <option value="pending_approval">Pending Approval</option>
                <option value="rejected">Rejected</option>
                <option value="suspended">Suspended</option>
              </select>
            </div>

            {(userSearch || userRoleFilter !== 'all' || userStatusFilter !== 'all') && (
              <button
                onClick={() => { setUserSearch(''); setUserRoleFilter('all'); setUserStatusFilter('all'); }}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                Clear Filters
              </button>
            )}
          </div>

          {/* User Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200">
                <tr>
                  <th className="px-3 py-2.5">ID</th>
                  <th className="px-3 py-2.5">User</th>
                  <th className="px-3 py-2.5">Contact</th>
                  <th className="px-3 py-2.5">District</th>
                  <th className="px-3 py-2.5">Role</th>
                  <th className="px-3 py-2.5">Status</th>
                  <th className="px-3 py-2.5">Registered</th>
                  <th className="px-3 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-3 py-2.5 font-mono text-slate-400 text-[11px]">{u.id}</td>
                    <td className="px-3 py-2.5">
                      <div className="font-bold text-slate-900">{u.full_name}</div>
                      {u.organization_name && (
                        <div className="text-[10px] text-amber-700 font-semibold">{u.organization_name}</div>
                      )}
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">
                      <div>{u.email}</div>
                      <div className="text-slate-400 text-[10px]">{u.phone || 'N/A'}</div>
                    </td>
                    <td className="px-3 py-2.5 text-slate-600">{u.district || 'AP'}</td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.role === 'admin' ? 'bg-purple-100 text-purple-800' :
                        u.role === 'government_official' || u.role === 'government' ? 'bg-indigo-100 text-indigo-800' :
                        u.role === 'responder' || u.role === 'ngo' ? 'bg-amber-100 text-amber-800' :
                        'bg-slate-100 text-slate-700'
                      }`}>
                        {u.role}
                      </span>
                    </td>
                    <td className="px-3 py-2.5">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                        u.status === 'active' ? 'bg-emerald-100 text-emerald-800' :
                        u.status === 'pending_approval' ? 'bg-amber-100 text-amber-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {u.status}
                      </span>
                    </td>
                    <td className="px-3 py-2.5 text-slate-500 font-mono text-[10px]">
                      {new Date(u.created_at).toLocaleDateString('en-IN')}
                    </td>
                    <td className="px-3 py-2.5 text-right">
                      {u.id === currentUser?.id ? (
                        <span className="text-[10px] text-slate-400 italic">Self</span>
                      ) : (
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setResetPasswordModal({ user: u, newPassword: '' })}
                            className="px-2 py-1 rounded text-[10px] font-semibold bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200"
                            title="Reset User Password"
                          >
                            Reset PW
                          </button>
                          <button
                            onClick={() => handleToggleUserStatus(u, u.status === 'active' ? 'suspended' : 'active')}
                            disabled={actionLoadingId === u.id}
                            className={`px-2 py-1 rounded text-[10px] font-semibold ${
                              u.status === 'active'
                                ? 'bg-red-50 hover:bg-red-100 text-red-700'
                                : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                            }`}
                          >
                            {u.status === 'active' ? 'Suspend' : 'Activate'}
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: GOVERNMENT REQUEST DECISION (APPROVE & PROVISION OR REJECT) */}
      {/* ========================================================================= */}
      {govDecisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                {govDecisionModal.decision === 'approved' ? (
                  <BadgeCheck className="w-5 h-5 text-emerald-600" />
                ) : (
                  <XCircle className="w-5 h-5 text-red-600" />
                )}
                <h3 className="font-bold text-base text-slate-900">
                  {govDecisionModal.decision === 'approved'
                    ? 'Verify & Provision Government Official Account'
                    : 'Reject Government Access Request'}
                </h3>
              </div>
              <button onClick={() => setGovDecisionModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 text-xs space-y-2">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Applicant</span>
                <strong className="text-slate-900">{govDecisionModal.request.full_name}</strong> ({govDecisionModal.request.email})
              </div>
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div>
                  <span className="text-slate-500">Department:</span> {govDecisionModal.request.department}
                </div>
                <div>
                  <span className="text-slate-500">Designation:</span> {govDecisionModal.request.designation}
                </div>
                <div>
                  <span className="text-slate-500">Employee ID:</span> <strong className="font-mono">{govDecisionModal.request.employee_id}</strong>
                </div>
                <div>
                  <span className="text-slate-500">District:</span> {govDecisionModal.request.district}
                </div>
              </div>
            </div>

            {govDecisionModal.decision === 'approved' ? (
              <p className="text-xs text-slate-600 leading-relaxed">
                Approving this request verifies the official's claimed authority and immediately provisions an authentic active account with the <code className="text-indigo-900 font-bold">government_official</code> role. The official will be able to log in with their submitted password.
              </p>
            ) : (
              <p className="text-xs text-slate-600 leading-relaxed">
                Rejecting this request blocks command access. Please provide an administrative reason below for audit tracking.
              </p>
            )}

            <form onSubmit={handleConfirmGovDecision} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Administrative Verification Notes *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="e.g. Employee ID and departmental post confirmed with District Collectorate."
                  value={govDecisionModal.notes}
                  onChange={(e) => setGovDecisionModal({ ...govDecisionModal, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setGovDecisionModal(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isDecidingGov}
                  className={`px-5 py-2 rounded-xl text-white font-bold shadow-md transition-all ${
                    govDecisionModal.decision === 'approved'
                      ? 'bg-emerald-600 hover:bg-emerald-700'
                      : 'bg-red-600 hover:bg-red-700'
                  }`}
                >
                  {isDecidingGov
                    ? 'Processing...'
                    : govDecisionModal.decision === 'approved'
                    ? 'Confirm & Provision Account'
                    : 'Confirm Rejection'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: ADMIN RESET USER PASSWORD */}
      {/* ========================================================================= */}
      {resetPasswordModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <KeyRound className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Reset User Account Password</h3>
              </div>
              <button onClick={() => setResetPasswordModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Reset credentials for <strong>{resetPasswordModal.user.full_name}</strong> ({resetPasswordModal.user.email}). The new password is encrypted with bcrypt (12 rounds) and will allow the user to immediately log in.
            </p>

            <form onSubmit={handleAdminResetPasswordSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">New Password (min 6 characters) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={resetPasswordModal.newPassword}
                  onChange={(e) => setResetPasswordModal({ ...resetPasswordModal, newPassword: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-indigo-600"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setResetPasswordModal(null)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isResettingPw}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  {isResettingPw ? 'Resetting...' : 'Update Password'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: DIRECT PROVISION GOVERNMENT OR ADMIN ACCOUNT */}
      {/* ========================================================================= */}
      {showProvisionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <ShieldAlert className="w-5 h-5 text-indigo-600" />
                <h3 className="font-bold text-base text-slate-900">Provision Privileged Official Account</h3>
              </div>
              <button onClick={() => setShowProvisionModal(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Create an authenticated Government Official or State Administrator account. The account is activated immediately with secure bcrypt password hashing.
            </p>

            <form onSubmit={handleProvisionSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Privilege Role *</label>
                <select
                  value={provisionForm.role}
                  onChange={(e) => setProvisionForm({ ...provisionForm, role: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-semibold"
                >
                  <option value="government_official">Government Official (Operations Command & Dispatch)</option>
                  <option value="admin">State Administrator (Full Governance & User Oversight)</option>
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Full Official Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Dr. K. Srinivas Rao"
                    value={provisionForm.full_name}
                    onChange={(e) => setProvisionForm({ ...provisionForm, full_name: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Official Designation / Title</label>
                  <input
                    type="text"
                    placeholder="e.g. District Collector"
                    value={provisionForm.title_or_designation}
                    onChange={(e) => setProvisionForm({ ...provisionForm, title_or_designation: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Official Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="e.g. collector.ntr@ap.gov.in"
                  value={provisionForm.email}
                  onChange={(e) => setProvisionForm({ ...provisionForm, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">Contact Phone</label>
                  <input
                    type="tel"
                    placeholder="1070"
                    value={provisionForm.phone}
                    onChange={(e) => setProvisionForm({ ...provisionForm, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">District / Division</label>
                  <select
                    value={provisionForm.district}
                    onChange={(e) => setProvisionForm({ ...provisionForm, district: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                  >
                    <option value="AP State Disaster Management Authority">AP State Operations</option>
                    {AP_DISTRICTS.map(d => (
                      <option key={d.id} value={d.name}>{d.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Secure Password (min 6 characters) *</label>
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••••••"
                  value={provisionForm.password}
                  onChange={(e) => setProvisionForm({ ...provisionForm, password: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowProvisionModal(false)}
                  className="px-3.5 py-2 rounded-xl border border-slate-200 text-slate-600 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProvisioning}
                  className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold shadow-md"
                >
                  {isProvisioning ? 'Provisioning...' : 'Provision Account'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL: REJECT APPLICATION CONFIRMATION */}
      {/* ========================================================================= */}
      {rejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-navy-950/70 backdrop-blur-sm animate-fadeIn">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
                <XCircle className="w-5 h-5" />
                <span>Confirm Application Rejection</span>
              </div>
              <button onClick={() => setRejectModal(null)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Are you sure you want to reject the application for <strong>{rejectModal.user.organization_name || rejectModal.user.full_name}</strong> ({rejectModal.user.email})?
            </p>
            <p className="text-[11px] text-slate-500">
              The status will transition to <code>rejected</code> and the organization account will remain restricted from operational dispatch management.
            </p>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setRejectModal(null)}
                className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 font-semibold text-xs"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmReject}
                className="px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-bold text-xs shadow-md"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
