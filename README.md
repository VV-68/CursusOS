
<div align="center">

![CursusOS Logo](./img/logo.png)

### Modern Academic ERP & Institution Management Platform

Manage institutions, departments, faculty, students, academics, attendance, assignments, internal marks, syllabus versions, batch progression, and academic workflows from a single platform.

🌐 **Live Demo:** https://cursus-os.vercel.app/

</div>

---

# 📖 Overview

CursusOS is a comprehensive Academic ERP designed for colleges and educational institutions.

The platform provides complete control over institution administration, department management, academic operations, faculty activities, student engagement, syllabus management, attendance tracking, internal assessments, assignments, study materials, and batch lifecycle progression.

The system follows a strict role-based architecture where every user receives access only to the functionalities relevant to their responsibilities.

---

# ✨ Core Features

## 🔐 Authentication & Institution Registration

- Institution Registration
- Role-Based Authentication
- Secure Login System
- JWT Authentication
- Protected Routes
- Password Management
- User Activation / Deactivation
- Institution-Level Data Isolation

---

## 🏛 Institution Management

- Institution Registration
- Department Management
- User Approval Workflows
- Holiday Management
- Institution-wide Notifications
- Faculty Management
- Academic Structure Management
- Batch Lifecycle Approvals
- Academic Monitoring

---

## 🏢 Department Management

- Department Creation
- HOD Assignment
- Faculty Management
- Department Notices
- Department Holidays
- Course Management
- Syllabus Management
- Faculty Allocation

---

## 📚 Course Management

- Create Courses
- Edit Courses
- Assign Courses
- Department-wise Course Mapping
- Semester-wise Course Planning
- Credit Management
- Elective Management

---

## 📖 Advanced Syllabus Management

- Multiple Active Syllabi Support
- Department-wise Syllabus Management
- Semester-wise Syllabus Organization
- Syllabus Upload
- Version Control
- Curriculum Updates
- Historical Syllabus Tracking

### Example

A department can simultaneously maintain:

- 2023 Scheme
- 2024 Scheme
- Autonomous Scheme
- Honors Scheme

without affecting existing student batches.

---

## 🎓 Batch Lifecycle & Progression

Complete batch lifecycle support:

- Batch Creation
- Batch Progression Requests
- Semester Advancement
- Academic Progress Tracking
- Graduation Processing
- Batch Closure

Approval Workflow:

```text
Department → HOD Request
            ↓
Admin Approval
            ↓
Batch Progression Executed
```

---

## 📅 Timetable Management

- Class Timetable Management
- Advisor Timetable Management
- Faculty Timetable Access
- Student Timetable Access
- Timetable Updates

---

## 📊 Attendance Management

- Faculty Attendance Entry
- Attendance Tracking
- Student Attendance Reports
- Attendance Analytics
- Attendance Monitoring

---

## 📝 Internal Marks Management

- Internal Assessment Creation
- Marks Upload
- Marks Publishing
- Student Performance Tracking
- Academic Evaluation

---

## 📂 Study Material Management

- Notes Upload
- PDF Upload
- Resource Sharing
- Course-wise Materials
- Faculty Resource Management

---

## 🎯 Assignment Management

- Assignment Creation
- Assignment Publishing
- Student Submission
- Assignment Evaluation
- Marks Allocation
- Submission Tracking

---

## 🔔 Notification System

- Institution-wide Notices
- Department Notices
- Academic Announcements
- Student Notifications
- Faculty Notifications

---

## 📈 Analytics & Reporting

- Institution Statistics
- Department Statistics
- Faculty Statistics
- Student Analytics
- Attendance Reports
- Internal Marks Reports
- Academic Performance Reports

---

# 👥 User Roles

---

# 👑 Administrator

The Administrator owns and manages an institution.

---

## Registration Process

The Administrator creates an institution by providing:

- Institution Name
- Institution Details
- Contact Information
- Administrator Credentials

After registration:

- Institution workspace is created
- Institution database access is isolated
- Administrator gains complete control

---

## Administrator Responsibilities

### Institution Management

- Register Institution
- Manage Institution Settings
- Manage Academic Structure

### User Management

- Approve Users
- Activate Users
- Deactivate Users
- Manage Roles

### Department Management

- Create Departments
- Manage Departments
- Assign HODs

### Faculty Management

- Create Faculty Accounts
- Manage Faculty Accounts

### Academic Management

- Manage Courses
- Manage Department Courses
- Approve Syllabus Operations
- Manage Institution-wide Syllabus

### Holidays & Notices

- Create Holidays
- Manage Holidays
- Post Institution Notices

### Batch Lifecycle

- Approve Batch Progression Requests
- Approve Academic Advancement Requests

### Full System Control

- Complete Administrative Access
- Institution-wide Monitoring

---

## Screenshots

![Admin Dashboard](./img/admin-dashboard.png)

![Department Management](./img/admin-departments.png)

![User Management](./img/admin-users.png)

![Course Management](./img/admin-courses.png)

![Syllabus Management](./img/admin-syllabus.png)

![Batch Lifecycle](./img/admin-batch-lifecycle.png)

---

# 🏢 Head of Department (HOD)

The HOD manages academic and administrative operations of a department.

---

## HOD Responsibilities

### Faculty Management

- Create Department Faculty Accounts
- Manage Department Faculty

### Course Allocation

- Assign Faculties to Courses
- Manage Course Distribution

### Department Management

- Post Department Notices
- Manage Department Holidays

### Academic Management

- Manage Department Courses
- Manage Department Syllabus

> Subject to institution permissions configured by the Administrator.

### Batch Lifecycle

- Create Batch Progression Requests
- Monitor Department Batches

### Faculty Operations

The HOD can also perform all regular faculty functions.

---

## Screenshots

![HOD Dashboard](./img/hod-dashboard.png)

![Faculty Assignment](./img/hod-faculty-assignment.png)

![Department Courses](./img/hod-courses.png)

![Department Syllabus](./img/hod-syllabus.png)

![Department Notices](./img/hod-notices.png)

---

# 👨‍🏫 Advisor

The Advisor manages an assigned class and acts as both an academic mentor and faculty member.

---

## Advisor Responsibilities

### Class Management

- Manage Assigned Class
- Manage Class Timetable

### Student Management

- Create Student Profiles
- Verify Student Profiles
- View Student Information
- Track Academic Progress

### Faculty Operations

Advisors also inherit normal faculty privileges:

- Upload Study Materials
- Create Assignments
- Mark Attendance
- Upload Internal Marks
- Evaluate Assignments

---

## Student Verification Workflow

```text
Advisor Creates Student
          ↓
Student Receives Credentials
          ↓
Student Updates Profile
          ↓
Advisor Verification
          ↓
Profile Verified
```

---

## Screenshots

![Advisor Dashboard](./img/advisor-dashboard.png)

![Student Creation](./img/advisor-student-create.png)

![Student Verification](./img/advisor-verification.png)

![Class Timetable](./img/advisor-timetable.png)

---

# 👨‍🏫 Faculty

Faculty members handle teaching and academic activities.

---

## Faculty Responsibilities

### Study Materials

- Upload Notes
- Upload PDFs
- Upload Reference Materials

### Assignments

- Create Assignments
- Publish Assignments
- Evaluate Assignments

### Attendance

- Mark Student Attendance
- Track Attendance

### Internal Assessments

- Upload Internal Marks
- Update Marks
- Track Performance

---

## Screenshots

![Faculty Dashboard](./img/faculty-dashboard.png)

![Study Materials](./img/faculty-materials.png)

![Assignments](./img/faculty-assignments.png)

![Attendance](./img/faculty-attendance.png)

![Internal Marks](./img/faculty-internal-marks.png)

---

# 👨‍🎓 Student

Students can access all academic resources related to their studies.

---

## Student Features

### Academic Resources

- View Study Materials
- Download Resources

### Assignments

- View Assignments
- Submit Assignments
- Track Submission Status

### Profile

- View Profile
- Update Profile
- Change Password

### Academics

- View Attendance
- View Internal Marks
- View Timetable
- View Notices

---

## Screenshots

![Student Dashboard](./img/student-dashboard.png)

![Study Materials](./img/student-materials.png)

![Assignments](./img/student-assignments.png)

![Profile](./img/student-profile.png)

![Attendance](./img/student-attendance.png)

![Internal Marks](./img/student-internal-marks.png)

---

# 🏗️ System Modules

- Authentication
- Institution Management
- Department Management
- User Management
- HOD Management
- Advisor Management
- Faculty Management
- Student Management
- Course Management
- Syllabus Management
- Batch Lifecycle Management
- Timetable Management
- Attendance Management
- Internal Marks Management
- Assignment Management
- Study Material Management
- Notification System
- Analytics & Reporting

---

# 🛠 Tech Stack

## Frontend

- React
- Vite
- React Router
- Axios
- Tailwind CSS
- shadcn/ui
- Lucide Icons

---

## Backend

- Node.js
- Express.js
- JWT Authentication
- REST API Architecture

---

## Database

- PostgreSQL

---

## Deployment

### Frontend

- Vercel

### Backend

- Render / Railway / VPS

### Database

- PostgreSQL

---

# 📷 Complete Screenshot Gallery

## Authentication

![Login](./img/login.png)

![Register Institution](./img/register-institution.png)

---

## Administration

![Admin Dashboard](./img/admin-dashboard.png)

![Departments](./img/admin-departments.png)

![Users](./img/admin-users.png)

![Courses](./img/admin-courses.png)

![Syllabus](./img/admin-syllabus.png)

---

## HOD

![HOD Dashboard](./img/hod-dashboard.png)

![Faculty Assignment](./img/hod-faculty-assignment.png)

![Department Notices](./img/hod-notices.png)

---

## Advisor

![Advisor Dashboard](./img/advisor-dashboard.png)

![Verification](./img/advisor-verification.png)

![Timetable](./img/advisor-timetable.png)

---

## Faculty

![Faculty Dashboard](./img/faculty-dashboard.png)

![Assignments](./img/faculty-assignments.png)

![Attendance](./img/faculty-attendance.png)

---

## Student

![Student Dashboard](./img/student-dashboard.png)

![Assignments](./img/student-assignments.png)

![Attendance](./img/student-attendance.png)

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/VV-68/CursusOS.git

cd CursusOS
```

---

## Frontend

```bash
cd sms_frontend

npm install

npm run dev
```

---

## Backend

```bash
cd sms_backend

npm install

npm run dev
```

---

# 🌐 Deployment

**Frontend (Vercel)**

https://cursus-os.vercel.app/

**Backend API**

https://cursusos.onrender.com

---

# 🔒 Security

- JWT Authentication
- Role-Based Authorization
- Protected APIs
- Institution Data Isolation
- Permission-Based Operations
- Secure Password Handling

---

# 📄 License

MIT License

---

# ⭐ Support

If you find CursusOS useful, consider giving the repository a star.

⭐ Star the repository to support development.
