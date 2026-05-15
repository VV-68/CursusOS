const BASE_URL = 'http://localhost:3000';

const getToken = () => localStorage.getItem('token');

const getHeaders = (includeAuth = false, customHeaders = {}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...customHeaders,
  };
  if (includeAuth) {
    const token = getToken();
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
};

const handleResponse = async (response) => {
  if (response.status === 401) {
    localStorage.removeItem('token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Request failed');
  }
  return data;
};

// ─── Auth ────────────────────────────────────────────────────

export const login = async (credentials) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(credentials),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || data.message || 'Login failed');
  }
  return data;
};

export const register = async (userData) => {
  const response = await fetch(`${BASE_URL}/auth/register`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(userData),
  });
  return handleResponse(response);
};

export const logout = async () => {
  const token = getToken();
  if (token) {
    try {
      await fetch(`${BASE_URL}/auth/logout`, {
        method: 'POST',
        headers: getHeaders(true),
      });
    } catch (e) {
      // Ignore logout errors
    }
  }
  localStorage.removeItem('token');
};

export const changePassword = async (data) => {
  const response = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'PATCH',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const getMe = async () => {
  const response = await fetch(`${BASE_URL}/auth/me`, {
    headers: getHeaders(true),
  });
  return handleResponse(response);
};

// ─── Users ───────────────────────────────────────────────────

export const userAPI = {
  getAll: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/api/users?${qs}`, { headers: getHeaders(true) }).then(handleResponse);
  },
  create: (data) => fetch(`${BASE_URL}/api/users`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  resetPassword: (id) => fetch(`${BASE_URL}/api/users/${id}/reset-password`, { method: 'PATCH', headers: getHeaders(true) }).then(handleResponse),
  delete: (id) => fetch(`${BASE_URL}/api/users/${id}`, { method: 'DELETE', headers: getHeaders(true) }).then(handleResponse),
};

// ─── Departments ─────────────────────────────────────────────

export const departmentAPI = {
  getAll: () => fetch(`${BASE_URL}/api/departments`, { headers: getHeaders(true) }).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/api/departments`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  assignHOD: (id, data) => fetch(`${BASE_URL}/api/departments/${id}/hod`, { method: 'PATCH', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getClasses: (id) => fetch(`${BASE_URL}/api/departments/${id}/classes`, { headers: getHeaders(true) }).then(handleResponse),
  uploadCourses: (id, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    return fetch(`${BASE_URL}/api/departments/${id}/courses/upload`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    }).then(handleResponse);
  },
  getCourses: (id, semester_id) => fetch(`${BASE_URL}/api/departments/${id}/courses?semester_id=${semester_id}`, { headers: getHeaders(true) }).then(handleResponse),
};

// ─── Semesters ─────────────────────────────────────────────────

export const semesterAPI = {
  getAll: () => fetch(`${BASE_URL}/api/semesters`, { headers: getHeaders(true) }).then(handleResponse),
};

// ─── Classes ─────────────────────────────────────────────────

export const classAPI = {
  getAll: () => fetch(`${BASE_URL}/api/classes`, { headers: getHeaders(true) }).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/api/classes`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  update: (id, data) => fetch(`${BASE_URL}/api/classes/${id}`, { method: 'PUT', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  delete: (id) => fetch(`${BASE_URL}/api/classes/${id}`, { method: 'DELETE', headers: getHeaders(true) }).then(handleResponse),
  assignAdvisors: (id, data) => fetch(`${BASE_URL}/api/classes/${id}/advisors`, { method: 'PATCH', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getStudents: (id) => fetch(`${BASE_URL}/api/classes/${id}/students`, { headers: getHeaders(true) }).then(handleResponse),
};

// ─── Courses ─────────────────────────────────────────────────

export const courseAPI = {
  getAll: () => fetch(`${BASE_URL}/api/courses`, { headers: getHeaders(true) }).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/api/courses`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getAssignments: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/api/courses/assignments?${qs}`, { headers: getHeaders(true) }).then(handleResponse);
  },
  assign: (data) => fetch(`${BASE_URL}/api/courses/assignments`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  removeAssignment: (id) => fetch(`${BASE_URL}/api/courses/assignments/${id}`, { method: 'DELETE', headers: getHeaders(true) }).then(handleResponse),
};

// ─── Timetable ───────────────────────────────────────────────

export const timetableAPI = {
  get: (classId, semesterId) => {
    const qs = semesterId ? `?semester_id=${semesterId}` : '';
    return fetch(`${BASE_URL}/api/timetable/${classId}${qs}`, { headers: getHeaders(true) }).then(handleResponse);
  },
  upload: (data) => fetch(`${BASE_URL}/api/timetable`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getAvailableCourses: (classId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/api/timetable/available-courses/${classId}?${qs}`, { headers: getHeaders(true) }).then(handleResponse);
  },
};

// ─── Attendance ──────────────────────────────────────────────

export const attendanceAPI = {
  getSheet: (qs) => fetch(`${BASE_URL}/api/attendance/sheet?${qs}`, { headers: getHeaders(true) }).then(handleResponse),
  mark: (data) => fetch(`${BASE_URL}/api/attendance/mark`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getSummary: (studentId) => fetch(`${BASE_URL}/api/attendance/summary/${studentId}`, { headers: getHeaders(true) }).then(handleResponse),
  getLow: (qs) => fetch(`${BASE_URL}/api/attendance/low?${qs}`, { headers: getHeaders(true) }).then(handleResponse),
};

// ─── Marks ───────────────────────────────────────────────────

export const marksAPI = {
  getSheet: (qs) => fetch(`${BASE_URL}/api/marks/sheet?${qs}`, { headers: getHeaders(true) }).then(handleResponse),
  update: (data) => fetch(`${BASE_URL}/api/marks/update`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getStudentMarks: (studentId) => fetch(`${BASE_URL}/api/marks/student/${studentId}`, { headers: getHeaders(true) }).then(handleResponse),
};

// ─── Leave ───────────────────────────────────────────────────

export const leaveAPI = {
  apply: (data) => fetch(`${BASE_URL}/api/leave`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getMine: () => fetch(`${BASE_URL}/api/leave/mine`, { headers: getHeaders(true) }).then(handleResponse),
  getPending: () => fetch(`${BASE_URL}/api/leave/pending`, { headers: getHeaders(true) }).then(handleResponse),
  process: (id, status) => fetch(`${BASE_URL}/api/leave/${id}/process`, { method: 'PATCH', headers: getHeaders(true), body: JSON.stringify({ status }) }).then(handleResponse),
};

// ─── Notices ─────────────────────────────────────────────────

export const noticeAPI = {
  getAll: () => fetch(`${BASE_URL}/api/notices`, { headers: getHeaders(true) }).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/api/notices`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  remove: (id) => fetch(`${BASE_URL}/api/notices/${id}`, { method: 'DELETE', headers: getHeaders(true) }).then(handleResponse),
};

// ─── Students (legacy) ──────────────────────────────────────

export const getStudents = async (params = {}) => {
  const { page = 1, limit = 5, department, sort } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('page', page);
  searchParams.set('limit', limit);
  if (department) searchParams.set('department', department);
  if (sort) searchParams.set('sort', sort);
  const response = await fetch(`${BASE_URL}/students?${searchParams}`, { headers: getHeaders(true) });
  return handleResponse(response);
};

export const searchStudents = async (name) => {
  const response = await fetch(`${BASE_URL}/students/search?name=${encodeURIComponent(name)}`, { headers: getHeaders(true) });
  return handleResponse(response);
};

export const getStudentById = async (id) => {
  const response = await fetch(`${BASE_URL}/students/${id}`, { headers: getHeaders(true) });
  return handleResponse(response);
};

export const addStudent = async (student) => {
  const response = await fetch(`${BASE_URL}/students`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(student) });
  return handleResponse(response);
};

export const updateStudent = async (id, student) => {
  const { name, department, marks } = student;
  const response = await fetch(`${BASE_URL}/students/${id}`, { method: 'PUT', headers: getHeaders(true), body: JSON.stringify({ name, department, marks }) });
  return handleResponse(response);
};

export const deleteStudent = async (id) => {
  const response = await fetch(`${BASE_URL}/students/${id}`, { method: 'DELETE', headers: getHeaders(true) });
  return handleResponse(response);
};

// ─── Course Assignments (Faculty) ────────────────────────────────────────

export const courseAssignmentAPI = {
  getMine: () => fetch(`${BASE_URL}/api/courses/assignments/mine`, { headers: getHeaders(true) }).then(handleResponse),
};

// ─── Assignments ─────────────────────────────────────────────────────────

export const assignmentAPI = {
  create: (data) => fetch(`${BASE_URL}/api/assignments`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),

  publish: (id, is_published) => fetch(`${BASE_URL}/api/assignments/${id}/publish`, {
    method: 'PATCH', headers: getHeaders(true), body: JSON.stringify({ is_published })
  }).then(handleResponse),

  listByCourse: (courseAssignmentId) => fetch(`${BASE_URL}/api/assignments/course/${courseAssignmentId}`, {
    headers: getHeaders(true)
  }).then(handleResponse),

  submit: (assignmentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    return fetch(`${BASE_URL}/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: token ? { 'Authorization': `Bearer ${token}` } : {},
      body: formData,
    }).then(handleResponse);
  },

  getMySubmission: (assignmentId) => fetch(`${BASE_URL}/api/assignments/${assignmentId}/my-submission`, {
    headers: getHeaders(true)
  }).then(handleResponse),

  listSubmissions: (assignmentId) => fetch(`${BASE_URL}/api/assignments/${assignmentId}/submissions`, {
    headers: getHeaders(true)
  }).then(handleResponse),

  evaluate: (submissionId, data) => fetch(`${BASE_URL}/api/assignments/submissions/${submissionId}/evaluate`, {
    method: 'PATCH', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),
};

// ─── Study Materials ─────────────────────────────────────────────────────

export const studyMaterialAPI = {
  create: (data) => fetch(`${BASE_URL}/api/study-materials`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),

  listByCourse: (courseAssignmentId) => fetch(`${BASE_URL}/api/study-materials/course/${courseAssignmentId}`, {
    headers: getHeaders(true)
  }).then(handleResponse),

  delete: (id) => fetch(`${BASE_URL}/api/study-materials/${id}`, {
    method: 'DELETE', headers: getHeaders(true)
  }).then(handleResponse),
};

// ─── Student Profile ─────────────────────────────────────────────────────

export const profileAPI = {
  getMyProfile: () => fetch(`${BASE_URL}/api/profile/me`, {
    headers: getHeaders(true)
  }).then(handleResponse),

  updateMyProfile: (data) => fetch(`${BASE_URL}/api/profile/me`, {
    method: 'PATCH', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),

  getStudentProfile: (studentId) => fetch(`${BASE_URL}/api/profile/student/${studentId}`, {
    headers: getHeaders(true)
  }).then(handleResponse),

  getClassStudents: (classId) => fetch(`${BASE_URL}/api/profile/class/${classId}`, {
    headers: getHeaders(true)
  }).then(handleResponse),
};

// ─── Consolidated Marks ──────────────────────────────────────────────────

export const consolidatedMarksAPI = {
  get: (courseAssignmentId) => fetch(`${BASE_URL}/api/marks/consolidated/${courseAssignmentId}`, {
    headers: getHeaders(true)
  }).then(handleResponse),
};

// ─── Department Creation ─────────────────────────────────────────────────

export const departmentCreationAPI = {
  create: (data) => fetch(`${BASE_URL}/api/department-creation`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),

  getDetails: (id) => fetch(`${BASE_URL}/api/department-creation/${id}`, {
    headers: getHeaders(true)
  }).then(handleResponse),

  update: (id, data) => fetch(`${BASE_URL}/api/department-creation/${id}`, {
    method: 'PUT', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),

  delete: (id) => fetch(`${BASE_URL}/api/department-creation/${id}`, {
    method: 'DELETE', headers: getHeaders(true)
  }).then(handleResponse),

  saveDraft: (data) => fetch(`${BASE_URL}/api/department-creation/draft`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),

  getDraft: () => fetch(`${BASE_URL}/api/department-creation/draft`, {
    headers: getHeaders(true)
  }).then(handleResponse),

  deleteDraft: () => fetch(`${BASE_URL}/api/department-creation/draft`, {
    method: 'DELETE', headers: getHeaders(true)
  }).then(handleResponse),

  validateCode: (code) => fetch(`${BASE_URL}/api/department-creation/validate-code`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify({ code })
  }).then(handleResponse),

  getManageCourses: (id, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/api/department-creation/${id}/manage-courses?${qs}`, {
      headers: getHeaders(true)
    }).then(handleResponse);
  },

  assignFaculty: (id, data) => fetch(`${BASE_URL}/api/department-creation/${id}/assign-faculty`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),
};
