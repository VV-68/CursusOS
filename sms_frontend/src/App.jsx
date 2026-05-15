import { Routes, Route, Navigate } from 'react-router-dom';
import Navbar from './components/Navbar';
import ProtectedRoute from './components/ProtectedRoute';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';

import ChangePassword from './pages/shared/ChangePassword';
import Users from './pages/admin/Users';
import CreateUser from './pages/admin/CreateUser';
import Departments from './pages/admin/Departments';
import AssignHOD from './pages/admin/AssignHOD';
import CreateDepartment from './pages/admin/CreateDepartment';
import EditDepartment from './pages/shared/EditDepartment';
import Classes from './pages/hod/Classes';
import AssignAdvisors from './pages/hod/AssignAdvisors';
import Courses from './pages/hod/Courses';

import AssignCourse from './pages/hod/AssignCourse';
import Timetable from './pages/advisor/Timetable';
import TimetableView from './pages/shared/TimetableView';
import MarkAttendance from './pages/faculty/MarkAttendance';
import AttendanceSummary from './pages/student/AttendanceSummary';
import LowAttendance from './pages/advisor/LowAttendance';
import MarkGrades from './pages/faculty/MarkGrades';
import Marks from './pages/student/Marks';
import LeaveRequests from './pages/shared/LeaveRequests';
import ApproveLeaves from './pages/shared/ApproveLeaves';
import Notices from './pages/shared/Notices';
import CreateNotice from './pages/admin/CreateNotice';

// New pages
import MyCourses from './pages/faculty/MyCourses';
import Assignments from './pages/faculty/Assignments';
import ViewSubmissions from './pages/faculty/ViewSubmissions';
import FacultyStudyMaterials from './pages/faculty/StudyMaterials';
import MyAssignments from './pages/student/MyAssignments';
import StudentStudyMaterials from './pages/student/StudyMaterials';
import ProfilePage from './pages/student/ProfilePage';
import MyStudents from './pages/advisor/MyStudents';
import StudentProfile from './pages/advisor/StudentProfile';

import './App.css';

function App() {
  const isAuthenticated = !!localStorage.getItem('token');

  return (
    <div className="app">
      <Navbar />
      <main className="main-content">
        <Routes>
          <Route
            path="/"
            element={
              isAuthenticated ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            }
          />

          <Route path="/change-password" element={
            <ProtectedRoute roles={['admin','hod','advisor','faculty','student']}>
              <ChangePassword />
            </ProtectedRoute>
          } />

          <Route path="/admin/users" element={
            <ProtectedRoute roles={['admin', 'hod']}>
              <Users />
            </ProtectedRoute>
          } />
          
          <Route path="/admin/users/create" element={
            <ProtectedRoute roles={['admin', 'hod']}>
              <CreateUser />
            </ProtectedRoute>
          } />

          <Route path="/admin/departments" element={
            <ProtectedRoute roles={['admin']}>
              <Departments />
            </ProtectedRoute>
          } />

          <Route path="/admin/departments/:id/assign-hod" element={
            <ProtectedRoute roles={['admin']}>
              <AssignHOD />
            </ProtectedRoute>
          } />

          <Route path="/admin/departments/create" element={
            <ProtectedRoute roles={['admin']}>
              <CreateDepartment />
            </ProtectedRoute>
          } />

          <Route path="/admin/departments/:id/edit" element={
            <ProtectedRoute roles={['admin']}>
              <EditDepartment />
            </ProtectedRoute>
          } />

          <Route path="/hod/department/edit" element={
            <ProtectedRoute roles={['hod']}>
              <EditDepartment />
            </ProtectedRoute>
          } />

          <Route path="/hod/classes" element={
            <ProtectedRoute roles={['hod']}>
              <Classes />
            </ProtectedRoute>
          } />

          <Route path="/hod/classes/:id/assign-advisors" element={
            <ProtectedRoute roles={['hod']}>
              <AssignAdvisors />
            </ProtectedRoute>
          } />

          <Route path="/hod/courses" element={
            <ProtectedRoute roles={['hod']}>
              <Courses />
            </ProtectedRoute>
          } />



          <Route path="/hod/assign-course" element={
            <ProtectedRoute roles={['hod']}>
              <AssignCourse />
            </ProtectedRoute>
          } />

          <Route path="/advisor/timetable" element={
            <ProtectedRoute roles={['advisor']}>
              <Timetable />
            </ProtectedRoute>
          } />

          <Route path="/timetable" element={
            <ProtectedRoute roles={['student','faculty','advisor','hod','admin']}>
              <TimetableView />
            </ProtectedRoute>
          } />

          <Route path="/faculty/attendance/mark" element={
            <ProtectedRoute roles={['faculty']}>
              <MarkAttendance />
            </ProtectedRoute>
          } />

          <Route path="/student/attendance" element={
            <ProtectedRoute roles={['student']}>
              <AttendanceSummary />
            </ProtectedRoute>
          } />

          <Route path="/advisor/attendance/low" element={
            <ProtectedRoute roles={['advisor', 'hod', 'admin']}>
              <LowAttendance />
            </ProtectedRoute>
          } />

          <Route path="/faculty/marks/update" element={
            <ProtectedRoute roles={['faculty']}>
              <MarkGrades />
            </ProtectedRoute>
          } />

          <Route path="/student/marks" element={
            <ProtectedRoute roles={['student']}>
              <Marks />
            </ProtectedRoute>
          } />

          <Route path="/leave" element={
            <ProtectedRoute roles={['student', 'faculty', 'advisor', 'hod']}>
              <LeaveRequests />
            </ProtectedRoute>
          } />

          <Route path="/approvals/leave" element={
            <ProtectedRoute roles={['hod', 'advisor']}>
              <ApproveLeaves />
            </ProtectedRoute>
          } />

          <Route path="/notices" element={
            <ProtectedRoute roles={['student', 'faculty', 'advisor', 'hod', 'admin']}>
              <Notices />
            </ProtectedRoute>
          } />

          <Route path="/admin/notices/create" element={
            <ProtectedRoute roles={['admin', 'hod']}>
              <CreateNotice />
            </ProtectedRoute>
          } />

          {/* ── Faculty: Courses, Assignments, Materials ─── */}
          <Route path="/faculty/courses" element={
            <ProtectedRoute roles={['faculty', 'advisor', 'hod']}>
              <MyCourses />
            </ProtectedRoute>
          } />

          <Route path="/faculty/assignments/:course_assignment_id?" element={
            <ProtectedRoute roles={['faculty', 'advisor', 'hod']}>
              <Assignments />
            </ProtectedRoute>
          } />

          <Route path="/faculty/submissions/:assignment_id?" element={
            <ProtectedRoute roles={['faculty', 'advisor', 'hod']}>
              <ViewSubmissions />
            </ProtectedRoute>
          } />

          <Route path="/faculty/materials/:course_assignment_id?" element={
            <ProtectedRoute roles={['faculty', 'advisor', 'hod']}>
              <FacultyStudyMaterials />
            </ProtectedRoute>
          } />

          {/* ── Student: Assignments, Materials, Profile ─── */}
          <Route path="/student/assignments" element={
            <ProtectedRoute roles={['student']}>
              <MyAssignments />
            </ProtectedRoute>
          } />

          <Route path="/student/materials/:course_assignment_id" element={
            <ProtectedRoute roles={['student']}>
              <StudentStudyMaterials />
            </ProtectedRoute>
          } />

          <Route path="/student/profile" element={
            <ProtectedRoute roles={['student']}>
              <ProfilePage />
            </ProtectedRoute>
          } />

          {/* ── Advisor: Students ─── */}
          <Route path="/advisor/students" element={
            <ProtectedRoute roles={['advisor', 'hod', 'admin']}>
              <MyStudents />
            </ProtectedRoute>
          } />

          <Route path="/advisor/student/:student_id" element={
            <ProtectedRoute roles={['advisor', 'hod', 'admin']}>
              <StudentProfile />
            </ProtectedRoute>
          } />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

export default App;
