import { Link, useNavigate, useLocation } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import {
  Link as LinkIcon, User, Calendar, Megaphone, Clock, CalendarDays, 
  Mail, GraduationCap, CheckCircle, FileText, Paperclip, BookOpen, 
  BarChart, AlertTriangle, ClipboardList, Unlock, Building, 
  UserPlus, Users, CheckSquare, School, TrendingUp, Library,
  Palmtree, Shield 
} from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { departmentCreationAPI, departmentAPI, logout, getMe, noticeAPI } from '../services/api';

const ROLE_LABELS = {
  admin: 'Administrator',
  hod: 'Head of Department',
  advisor: 'Batch Advisor',
  faculty: 'Faculty',
  student: 'Student',
};

const ROLE_COLORS = {
  admin: { bg: 'var(--primary-light)', accent: 'var(--primary)', text: 'var(--primary)' },
  hod: { bg: 'var(--primary-light)', accent: 'var(--primary)', text: 'var(--primary)' },
  advisor: { bg: '#cce5ff', accent: '#007bff', text: '#0056b3' },
  faculty: { bg: '#ede9fe', accent: '#007bff', text: '#5b21b6' },
  student: { bg: '#f3f4f8', accent: '#23364d', text: '#23364d' },
};

const CARD_COLORS = ['#3393fbff'];

// ── Reusable card-link ──────────────────────────────────────────────────────
function DashCard({ to, icon, label, description, variant = 'primary', cardColor }) {
  // In light mode, apply the background color via CSS variable.
  return (
    <Link to={to} className={`dash-card dash-card--${variant} ${cardColor ? 'dash-card--colored' : ''}`} style={cardColor ? { '--card-accent': cardColor } : {}}>
      <span className="dash-card-icon">{icon}</span>
      <span className="dash-card-label">{label}</span>
      {/* {description && <span className="dash-card-desc">{description}</span>} */}
    </Link>
  );
}

// ── Section with anchor id ──────────────────────────────────────────────────
function DashSection({ id, title, icon, children }) {
  // Flatten children including Fragments
  const flatten = (nodes) => {
    return React.Children.toArray(nodes).reduce((acc, node) => {
      if (node && node.type === React.Fragment) {
        return acc.concat(flatten(node.props.children));
      }
      return acc.concat(node);
    }, []);
  };

  const flatChildren = flatten(children).filter(Boolean);

  // Inject colors into DashCards cyclically
  const coloredChildren = flatChildren.map((child, index) => {
    if (child && child.type === DashCard) {
      return React.cloneElement(child, {
        cardColor: CARD_COLORS[index % CARD_COLORS.length]
      });
    }
    return child;
  });

  return (
    <div id={id} className="dash-section" style={{ scrollMarginTop: '80px' }}>
      <h3 className="dash-section-title">
        <span className="dash-section-icon">{icon}</span>
        {title}
      </h3>
      <div className="dash-section-grid">{coloredChildren}</div>
    </div>
  );
}

// ── Inline notice board ──────────────────────────────────────────────────────
function InlineNotices() {
  const [notices, setNotices] = useState([]);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    noticeAPI.getAll().then(setNotices).catch(() => { });
  }, []);

  const displayed = expanded ? notices : notices.slice(0, 3);

  return (
    <div style={{ marginBottom: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
        <h3 className="dash-section-title" style={{ margin: 0 }}>
          <span className="dash-section-icon"><Megaphone size="1em" /></span> Notice Board
        </h3>
        <div style={{ display: 'flex', gap: '0.5rem' }}>

          <Link to="/notices" className="dash-view-all" style={{
            fontSize: '0.8rem', padding: '0.3rem 0.75rem', background: '#f1f5f9',
            color: '#334155', borderRadius: 6, textDecoration: 'none'
          }}>View All →</Link>
        </div>
      </div>

      {notices.length === 0 ? (
        <p style={{ color: '#94a3b8', fontSize: '0.9rem' }}>No notices at this time.</p>
      ) : (
        <>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {displayed.map(n => (
              <div key={n.id} style={{
                background: '#fff', border: '1px solid #e2e8f0',
                borderLeft: n.is_pinned ? '4px solid #f59e0b' : '4px solid #e2e8f0',
                borderRadius: 8, padding: '0.75rem 1rem'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                  <span style={{ fontWeight: 600, fontSize: '0.9rem', color: '#1e293b' }}>
                    {n.is_pinned && '📌 '}{n.title}
                  </span>
                  <time style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                    {new Date(n.created_at).toLocaleDateString()}
                  </time>
                </div>
                <p style={{ margin: '0.25rem 0 0', fontSize: '0.82rem', color: '#475569', whiteSpace: 'pre-wrap' }}>
                  {n.body?.length > 180 ? n.body.slice(0, 180) + '…' : n.body}
                </p>
              </div>
            ))}
          </div>
          {notices.length > 3 && (
            <button onClick={() => setExpanded(e => !e)} style={{
              marginTop: '0.5rem', background: 'none', border: 'none',
              color: 'var(--primary)', cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600
            }}>
              {expanded ? '▲ Show less' : `▼ View ${notices.length - 3} more notices`}
            </button>
          )}
        </>
      )}
    </div>
  );
}

// ── Tab navigation ──────────────────────────────────────────────────────────
function Dashboard() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  let role = '';
  if (token) { try { role = jwtDecode(token).role; } catch { } }

  const [dept, setDept] = useState(null);
  const [userInfo, setUserInfo] = useState(null);
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const defaultTab = role === 'admin' ? 'admin' : 'general';
  const initialTab = searchParams.get('tab') || defaultTab;
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    if (token) getMe().then(setUserInfo).catch(() => { });
  }, [token]);

  useEffect(() => {
    if (role === 'hod' && token) {
      try {
        const decoded = jwtDecode(token);
        if (decoded.dept_id) {
          departmentCreationAPI.getDetails(decoded.dept_id).then(setDept).catch(() => { });
        }
      } catch { }
    }
  }, [role, token]);

  const handleApproveHOD = async () => {
    try {
      await departmentAPI.approveHOD(dept.id);
      alert('HOD change approved. You will be logged out.');
      await logout();
      navigate('/login', { replace: true });
    } catch (err) { alert(err.message); }
  };

  const handleRejectHOD = async () => {
    try {
      await departmentAPI.rejectHOD(dept.id);
      alert('HOD change rejected');
      window.location.reload();
    } catch (err) { alert(err.message); }
  };

  const colors = ROLE_COLORS[role] || ROLE_COLORS.faculty;
  const canPost = ['admin', 'hod'].includes(role);

  // Build tabs based on role
  const tabs = [];
  if (role !== 'admin') tabs.push({ id: 'general', label: '📌 General' });
  if (['faculty', 'advisor', 'hod'].includes(role)) tabs.push({ id: 'teaching', label: '🎓 Teaching' });
  if (role === 'advisor') tabs.push({ id: 'oversight', label: '📊 My Class' });
  if (role === 'hod') tabs.push({ id: 'dept', label: '🏛️ Department' });
  if (role === 'admin') tabs.push({ id: 'admin', label: '🛡️ Admin' });
  if (role === 'student') {
    tabs.push({ id: 'academics', label: '📚 Academics' });
    tabs.push({ id: 'profile', label: '👤 My Profile', to: '/student/profile' });
  }

  return (
    <div id="top" className="dashboard-page">
      {/* Header */}
      <div className="dash-header" style={{ borderLeftColor: colors.accent }}>
        <div>
          <h1 className="dash-greeting">
            Welcome back{userInfo?.full_name ? `, ${userInfo.full_name}` : ''}
          </h1>
          <p className={`dash-role-label dash-role-label--${role}`}>
            {ROLE_LABELS[role] || role.toUpperCase()}
          </p>
        </div>
        <span className={`dash-role-badge dash-role-badge--${role}`}>
          {role.toUpperCase()}
        </span>
      </div>

      {/* HOD Transfer Alert */}
      {role === 'hod' && dept?.pending_hod_id && (
        <div className="dash-alert dash-alert--warning">
          <h3 style={{ marginTop: 0 }}>⚠ Pending HOD Transfer</h3>
          <p>Admin has requested to transfer HOD role to <strong>{dept.pending_hod_name}</strong>.</p>
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
            <button onClick={handleApproveHOD} className="btn btn-primary" style={{ background: '#16a34a' }}>Approve</button>
            <button onClick={handleRejectHOD} className="btn" style={{ background: '#dc2626', color: '#fff' }}>Reject</button>
          </div>
        </div>
      )}

      {/* Tab bar */}
      <div style={{ display: 'flex', gap: 0, borderBottom: '2px solid var(--border)', marginBottom: '1.5rem', overflowX: 'auto' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => t.to ? navigate(t.to) : setActiveTab(t.id)} style={{
            padding: '0.6rem 1.25rem', border: 'none', background: 'none', cursor: 'pointer',
            fontWeight: activeTab === t.id ? 700 : 500, fontSize: '0.9rem', whiteSpace: 'nowrap',
            borderBottom: activeTab === t.id ? '2px solid var(--primary)' : '2px solid transparent',
            color: activeTab === t.id ? 'var(--primary)' : 'var(--text-muted)', marginBottom: '-2px',
            transition: 'all 0.2s'
          }}>
            {t.label}
          </button>
        ))}
      </div>

      {/* ── GENERAL (all roles) ── */}
      {activeTab === 'general' && (
        <>
          <InlineNotices />

          <DashSection id="general-links" title="Quick Links" icon={<LinkIcon size="1em" />}>
            {['faculty', 'advisor', 'hod'].includes(role) && (
              <>
                <DashCard to="/faculty/profile" icon={<User size="1em" />} label="Edit Profile" description="Update your contact info" />
                <DashCard to="/faculty/my-timetable" icon={<Calendar size="1em" />} label="My Timetable" description="Your courses per day" />
              </>
            )}
            {canPost && (
              <DashCard to="/notices/post" icon={<Megaphone size="1em" />} label="Post Notice" description="Publish announcements" />
            )}
            {role !== 'admin' && <DashCard to="/timetable" icon={<Clock size="1em" />} label="View Timetable" description="Class schedules" variant="secondary" />}
            {['student', 'faculty', 'advisor', 'hod'].includes(role) && (
              <DashCard to="/leave" icon={<CalendarDays size="1em" />} label="My Leaves" description="Apply for or view leaves" variant="secondary" />
            )}
            {['advisor', 'hod'].includes(role) && (
              <DashCard to="/approvals/leave" icon={<Mail size="1em" />} label="Pending Leaves" description="Review leave applications" variant="secondary" />
            )}
          </DashSection>
        </>
      )}

      {/* ── TEACHING (faculty, advisor, hod) ── */}
      {activeTab === 'teaching' && ['faculty', 'advisor', 'hod'].includes(role) && (
        <DashSection id="teaching" title="Teaching" icon={<GraduationCap size="1em" />}>
          <DashCard to="/faculty/attendance/mark" icon={<CheckCircle size="1em" />} label="Mark Attendance" description="Record student attendance" />
          <DashCard to="/faculty/internals" icon={<FileText size="1em" />} label="Faculty Internals" description="Manage your course internals" />
          <DashCard to="/faculty/assignments" icon={<Paperclip size="1em" />} label="Assignments" description="Create and manage assignments" />
          <DashCard to="/faculty/materials" icon={<BookOpen size="1em" />} label="Study Materials" description="Upload learning resources" />
        </DashSection>
      )}

      {/* ── OVERSIGHT (advisor) ── */}
      {activeTab === 'oversight' && role === 'advisor' && (
        <DashSection id="oversight" title="My Batch" icon={<BarChart size="1em" />}>
          <DashCard to="/advisor/timetable" icon={<Calendar size="1em" />} label="Manage Timetable" description="Upload class timetable" />
          <DashCard to="/advisor/attendance/low" icon={<AlertTriangle size="1em" />} label="Low Attendance" description="Students below threshold" variant="secondary" />
          <DashCard to="/advisor/students" icon={<GraduationCap size="1em" />} label="My Students" description="View student details" />
          <DashCard to="/advisor/internals" icon={<ClipboardList size="1em" />} label="Class Internals" description="View class-wise internals" />
          <DashCard to="/advisor/attendance/overrides" icon={<Unlock size="1em" />} label="Override Requests" description="Faculty attendance overrides" />
        </DashSection>
      )}

      {/* ── DEPARTMENT (hod) ── */}
      {activeTab === 'dept' && role === 'hod' && (
        <DashSection id="dept" title="Department Management" icon={<Building size="1em" />}>
          <DashCard to="/admin/users/create" icon={<UserPlus size="1em" />} label="Add Faculty / Advisor" description="Register new staff" />
          <DashCard to="/admin/users" icon={<Users size="1em" />} label="View Dept Users" description="Manage department users" />
          <DashCard to="/admin/users?role=student&pending=true" icon={<CheckSquare size="1em" />} label="Student Verification" description="Verify unverified students" />
          <DashCard to="/hod/classes" icon={<School size="1em" />} label="Manage Batches" description="Create and progress batches" />
          <DashCard to="/hod/batch-progression" icon={<TrendingUp size="1em" />} label="Batch Progression" description="Request promotions and deactivation" />
          <DashCard to="/hod/courses" icon={<Library size="1em" />} label="Manage Courses" description="Department course catalog" />
          <DashCard to="/hod/internals" icon={<BarChart size="1em" />} label="Dept Internals" description="View all class internal marks" />
          <DashCard to="/advisor/attendance/overrides" icon={<Unlock size="1em" />} label="Override Requests" description="Faculty attendance overrides" />
          <DashCard to="/holidays" icon={<Palmtree size="1em" />} label="Manage Holidays" description="Department holidays" />
        </DashSection>
      )}

      {/* ── ADMIN ── */}
      {activeTab === 'admin' && role === 'admin' && (
        <DashSection id="admin" title="Administration" icon={<Shield size="1em" />}>
          <DashCard to="/admin/institution" icon={<School size="1em" />} label="Institution Settings" description="Update institution details" />
          <DashCard to="/admin/users" icon={<Users size="1em" />} label="Manage Users" description="Create, edit, manage all users" />
          <DashCard to="/admin/users?role=faculty&pending=true" icon={<CheckSquare size="1em" />} label="Faculty Verification" description="Verify unverified faculties" />
          <DashCard to="/admin/departments" icon={<Building size="1em" />} label="Manage Departments" description="Add or edit departments" />
          <DashCard to="/admin/batch-lifecycle" icon={<CheckCircle size="1em" />} label="Batch Lifecycle Requests" description="Approve promotion/deactivation" />
          <DashCard to="/notices/post" icon={<Megaphone size="1em" />} label="Post Notice" description="Publish announcements" />
          <DashCard to="/holidays" icon={<Palmtree size="1em" />} label="Manage Holidays" description="Institution holidays" />
        </DashSection>
      )}

      {/* ── ACADEMICS (student) ── */}
      {activeTab === 'academics' && role === 'student' && (
        <DashSection id="academics" title="Academics" icon={<Library size="1em" />}>
          <DashCard to="/student/attendance" icon={<BarChart size="1em" />} label="My Attendance" description="View attendance summary" />
          <DashCard to="/student/internals" icon={<FileText size="1em" />} label="My Internals" description="Internal assessment scores" />
          <DashCard to="/student/assignments" icon={<Paperclip size="1em" />} label="My Assignments" description="View and submit assignments" />
          <DashCard to="/student/materials" icon={<BookOpen size="1em" />} label="Study Materials" description="Access course materials" />
        </DashSection>
      )}

      {/* Back to top */}
      <div style={{ marginTop: '2.5rem', textAlign: 'right' }}>
        <a href="#top" style={{ color: '#94a3b8', fontSize: '0.82rem', textDecoration: 'none' }}>↑ Back to top</a>
      </div>
    </div>
  );
}

export default Dashboard;
