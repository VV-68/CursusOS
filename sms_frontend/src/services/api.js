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
  updateRole: (id, role) => fetch(`${BASE_URL}/api/users/${id}/role`, { method: 'PATCH', headers: getHeaders(true), body: JSON.stringify({ role }) }).then(handleResponse),
  updateProfile: (data) => fetch(`${BASE_URL}/api/users/me`, { method: 'PATCH', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  updateDesignation: (id, designation) => fetch(`${BASE_URL}/api/users/${id}/designation`, { method: 'PATCH', headers: getHeaders(true), body: JSON.stringify({ designation }) }).then(handleResponse),
  approveUser: (id) => fetch(`${BASE_URL}/api/users/${id}/approve`, { method: 'PATCH', headers: getHeaders(true) }).then(handleResponse),
};

// ─── Institutions ──────────────────────────────────────────────

export const institutionAPI = {
  getMine: () => fetch(`${BASE_URL}/api/institutions/mine`, { headers: getHeaders(true) }).then(handleResponse),
  updateMine: (data) => fetch(`${BASE_URL}/api/institutions/mine`, { method: 'PUT', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
};

// ─── Departments ─────────────────────────────────────────────

export const departmentAPI = {
  getAll: () => fetch(`${BASE_URL}/api/departments`, { headers: getHeaders(true) }).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/api/departments`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),

  assignHOD: (id, data) => fetch(`${BASE_URL}/api/departments/${id}/hod`, { method: 'PATCH', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  approveHOD: (id) => fetch(`${BASE_URL}/api/departments/${id}/hod/approve`, { method: 'PATCH', headers: getHeaders(true) }).then(handleResponse),
  rejectHOD: (id) => fetch(`${BASE_URL}/api/departments/${id}/hod/reject`, { method: 'PATCH', headers: getHeaders(true) }).then(handleResponse),
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
  getCourses: (id) => fetch(`${BASE_URL}/api/departments/${id}/courses`, { headers: getHeaders(true) }).then(handleResponse),
};

// ─── Semesters ─────────────────────────────────────────────────

export const semesterAPI = {
  getAll: () => fetch(`${BASE_URL}/api/semesters`, { headers: getHeaders(true) }).then(handleResponse),
};

// ─── Classes ─────────────────────────────────────────────────

export const classAPI = {
  getAll: () => fetch(`${BASE_URL}/api/classes`, { headers: getHeaders(true) }).then(handleResponse),
  getAllUnrestricted: () => fetch(`${BASE_URL}/api/classes/all`, { headers: getHeaders(true) }).then(handleResponse),
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
  get: (classId) => fetch(`${BASE_URL}/api/timetable/${classId}`, { headers: getHeaders(true) }).then(handleResponse),
  upload: (data) => fetch(`${BASE_URL}/api/timetable`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getAvailableCourses: (classId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    return fetch(`${BASE_URL}/api/timetable/available-courses/${classId}?${qs}`, { headers: getHeaders(true) }).then(handleResponse);
  },
};

// ─── Attendance ──────────────────────────────────────────────

export const attendanceAPI = {
  validate: (qs) => fetch(`${BASE_URL}/api/attendance/validate?${qs}`, { headers: getHeaders(true) }).then(handleResponse),
  getSheet: (qs) => fetch(`${BASE_URL}/api/attendance/sheet?${qs}`, { headers: getHeaders(true) }).then(handleResponse),
  mark: (data) => fetch(`${BASE_URL}/api/attendance/mark`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getSummary: (studentId) => fetch(`${BASE_URL}/api/attendance/summary/${studentId}`, { headers: getHeaders(true) }).then(handleResponse),
  getLow: (qs) => fetch(`${BASE_URL}/api/attendance/low?${qs}`, { headers: getHeaders(true) }).then(handleResponse),
  requestOverride: (data) => fetch(`${BASE_URL}/api/attendance/override-request`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  listOverrides: () => fetch(`${BASE_URL}/api/attendance/overrides`, { headers: getHeaders(true) }).then(handleResponse),
  reviewOverride: (id, status) => fetch(`${BASE_URL}/api/attendance/overrides/${id}`, { method: 'PATCH', headers: getHeaders(true), body: JSON.stringify({ status }) }).then(handleResponse),
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
  getMine: (params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/api/courses/assignments/mine${qs ? `?${qs}` : ''}`;
    return fetch(url, { headers: getHeaders(true) }).then(handleResponse);
  },
};

// ─── Assignments ─────────────────────────────────────────────────────────

export const assignmentAPI = {
  create: (data, questionFile = null) => {
    const token = getToken();
    if (questionFile) {
      const formData = new FormData();
      Object.entries(data).forEach(([k, v]) => {
        if (v !== undefined && v !== null) formData.append(k, v);
      });
      formData.append('question', questionFile);
      return fetch(`${BASE_URL}/api/assignments`, {
        method: 'POST',
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body: formData,
      }).then(handleResponse);
    }
    return fetch(`${BASE_URL}/api/assignments`, {
      method: 'POST', headers: getHeaders(true), body: JSON.stringify(data),
    }).then(handleResponse);
  },

  delete: (id) => fetch(`${BASE_URL}/api/assignments/${id}`, {
    method: 'DELETE', headers: getHeaders(true),
  }).then(handleResponse),

  uploadQuestion: (id, file) => {
    const formData = new FormData();
    formData.append('question', file);
    const token = getToken();
    return fetch(`${BASE_URL}/api/assignments/${id}/question`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(handleResponse);
  },

  getQuestionUrl: (id) => fetch(`${BASE_URL}/api/assignments/${id}/question-url`, {
    headers: getHeaders(true),
  }).then(handleResponse),

  publish: (id, is_published) => fetch(`${BASE_URL}/api/assignments/${id}/publish`, {
    method: 'PATCH', headers: getHeaders(true), body: JSON.stringify({ is_published }),
  }).then(handleResponse),

  listByCourse: (courseAssignmentId) => fetch(`${BASE_URL}/api/assignments/course/${courseAssignmentId}`, {
    headers: getHeaders(true),
  }).then(handleResponse),

  listMine: () => fetch(`${BASE_URL}/api/assignments/mine`, {
    headers: getHeaders(true),
  }).then(handleResponse),

  submit: (assignmentId, file) => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getToken();
    return fetch(`${BASE_URL}/api/assignments/${assignmentId}/submit`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(handleResponse);
  },

  deleteMySubmission: (assignmentId) => fetch(`${BASE_URL}/api/assignments/${assignmentId}/my-submission`, {
    method: 'DELETE', headers: getHeaders(true),
  }).then(handleResponse),

  getMySubmission: (assignmentId) => fetch(`${BASE_URL}/api/assignments/${assignmentId}/my-submission`, {
    headers: getHeaders(true),
  }).then(handleResponse),

  listSubmissions: (assignmentId, params = {}) => {
    const qs = new URLSearchParams(params).toString();
    const url = `${BASE_URL}/api/assignments/${assignmentId}/submissions${qs ? `?${qs}` : ''}`;
    return fetch(url, { headers: getHeaders(true) }).then(handleResponse);
  },

  evaluate: (submissionId, data) => fetch(`${BASE_URL}/api/assignments/submissions/${submissionId}/evaluate`, {
    method: 'PATCH', headers: getHeaders(true), body: JSON.stringify(data),
  }).then(handleResponse),
};

// ─── Study Materials ─────────────────────────────────────────────────────

export const studyMaterialAPI = {
  create: (data, file = null) => {
    const token = getToken();
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, v);
    });
    if (file) formData.append('file', file);
    return fetch(`${BASE_URL}/api/study-materials`, {
      method: 'POST',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(handleResponse);
  },

  update: (id, data, file = null) => {
    const token = getToken();
    const formData = new FormData();
    Object.entries(data).forEach(([k, v]) => {
      if (v !== undefined && v !== null) formData.append(k, v);
    });
    if (file) formData.append('file', file);
    return fetch(`${BASE_URL}/api/study-materials/${id}`, {
      method: 'PATCH',
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      body: formData,
    }).then(handleResponse);
  },

  listByCourse: (courseAssignmentId) => fetch(`${BASE_URL}/api/study-materials/course/${courseAssignmentId}`, {
    headers: getHeaders(true),
  }).then(handleResponse),

  listMine: () => fetch(`${BASE_URL}/api/study-materials/mine`, {
    headers: getHeaders(true),
  }).then(handleResponse),

  getDownloadUrl: (id) => fetch(`${BASE_URL}/api/study-materials/${id}/download`, {
    headers: getHeaders(true),
  }).then(handleResponse),

  delete: (id) => fetch(`${BASE_URL}/api/study-materials/${id}`, {
    method: 'DELETE', headers: getHeaders(true),
  }).then(handleResponse),
};

// ─── Student Profile ─────────────────────────────────────────────────────

export const profileAPI = {
  getMyCourses: (semester) => fetch(`${BASE_URL}/api/profile/my-courses${semester ? `?semester=${semester}` : ''}`, {
    headers: getHeaders(true),
  }).then(handleResponse),

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

  getPendingClassStudents: (classId) => fetch(`${BASE_URL}/api/profile/class/${classId}/pending`, {
    headers: getHeaders(true)
  }).then(handleResponse),

  createStudentManually: (data) => fetch(`${BASE_URL}/api/students/profile`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),

  bulkUploadStudents: (formData) => fetch(`${BASE_URL}/api/students/bulk-upload`, {
    method: 'POST', 
    headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` },
    body: formData
  }).then(handleResponse),

  verifyStudent: (studentId) => fetch(`${BASE_URL}/api/students/${studentId}/verify`, {
    method: 'POST', headers: getHeaders(true)
  }).then(handleResponse),

  completeProfile: (data) => fetch(`${BASE_URL}/api/students/complete-profile`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify(data)
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

// ─── Internal Marks ──────────────────────────────────────────────────────
export const internalMarksAPI = {
  getInternalMarksSheet: (course_assignment_id) => fetch(`${BASE_URL}/api/internal-marks/course/${course_assignment_id}`, {
    headers: getHeaders(true)
  }).then(handleResponse),
  
  updateInternalMarks: (course_assignment_id, marksData) => fetch(`${BASE_URL}/api/internal-marks/course/${course_assignment_id}`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify({ marksData })
  }).then(handleResponse),
  
  getStudentInternals: () => fetch(`${BASE_URL}/api/internal-marks/my`, {
    headers: getHeaders(true)
  }).then(handleResponse),
  
  getClassInternals: (class_id) => fetch(`${BASE_URL}/api/internal-marks/class/${class_id}`, {
    headers: getHeaders(true)
  }).then(handleResponse),
  
  getDepartmentInternals: (dept_id) => fetch(`${BASE_URL}/api/internal-marks/department/${dept_id}`, {
    headers: getHeaders(true)
  }).then(handleResponse),
};

// ─── Notifications ───────────────────────────────────────────────────────
export const notificationAPI = {
  getMine: () => fetch(`${BASE_URL}/api/notifications`, {
    headers: getHeaders(true),
  }).then(handleResponse),

  clearAll: () => fetch(`${BASE_URL}/api/notifications`, {
    method: 'DELETE', headers: getHeaders(true),
  }).then(handleResponse),

  deleteOne: (id) => fetch(`${BASE_URL}/api/notifications/${id}`, {
    method: 'DELETE', headers: getHeaders(true),
  }).then(handleResponse),
};

// ─── Batch Progression ─────────────────────────────────────────────────────
export const progressionAPI = {
  requestPromotion: (data) => fetch(`${BASE_URL}/api/progression/batch-promotion-requests`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),
  directPromote: (data) => fetch(`${BASE_URL}/api/progression/batch-promotion-direct`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),
  listPromotions: (status) => fetch(`${BASE_URL}/api/progression/batch-promotion-requests${status ? `?status=${status}` : ''}`, {
    headers: getHeaders(true)
  }).then(handleResponse),
  reviewPromotion: (requestId, approve, remarks = '') => fetch(`${BASE_URL}/api/progression/batch-promotion-requests/${requestId}/review`, {
    method: 'PATCH', headers: getHeaders(true), body: JSON.stringify({ approve, remarks })
  }).then(handleResponse),
  requestDeactivation: (data) => fetch(`${BASE_URL}/api/progression/batch-deactivation-requests`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),
  listDeactivations: (status) => fetch(`${BASE_URL}/api/progression/batch-deactivation-requests${status ? `?status=${status}` : ''}`, {
    headers: getHeaders(true)
  }).then(handleResponse),
  reviewDeactivation: (requestId, approve) => fetch(`${BASE_URL}/api/progression/batch-deactivation-requests/${requestId}/review`, {
    method: 'PATCH', headers: getHeaders(true), body: JSON.stringify({ approve })
  }).then(handleResponse),

  requestReactivation: (data) => fetch(`${BASE_URL}/api/progression/batch-reactivation-requests`, {
    method: 'POST', headers: getHeaders(true), body: JSON.stringify(data)
  }).then(handleResponse),
  listReactivations: (status) => fetch(`${BASE_URL}/api/progression/batch-reactivation-requests${status ? `?status=${status}` : ''}`, {
    headers: getHeaders(true)
  }).then(handleResponse),
  reviewReactivation: (requestId, approve) => fetch(`${BASE_URL}/api/progression/batch-reactivation-requests/${requestId}/review`, {
    method: 'PATCH', headers: getHeaders(true), body: JSON.stringify({ approve })
  }).then(handleResponse),
};

export const documentAPI = {
  uploadDocument: async (file, documentType) => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('document_type', documentType);
    
    const token = getToken();
    const headers = {};
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const response = await fetch(`${BASE_URL}/api/documents/upload`, {
      method: 'POST',
      headers, // Content-Type is not set for FormData so browser handles boundary
      body: formData
    });
    return handleResponse(response);
  },
  
  getMyDocuments: async () => {
    const response = await fetch(`${BASE_URL}/api/documents/me`, {
      headers: getHeaders(true)
    });
    return handleResponse(response);
  },
  
  getStudentDocuments: async (studentId) => {
    const response = await fetch(`${BASE_URL}/api/documents/student/${studentId}`, {
      headers: getHeaders(true)
    });
    return handleResponse(response);
  },
  
  getDocumentUrl: async (id) => {
    const response = await fetch(`${BASE_URL}/api/documents/download/${id}`, {
      headers: getHeaders(true)
    });
    return handleResponse(response);
  },
  
  deleteMyDocument: async (id) => {
    const response = await fetch(`${BASE_URL}/api/documents/${id}`, {
      method: 'DELETE',
      headers: getHeaders(true)
    });
    return handleResponse(response);
  },
  
  verifyDocument: async (id, status) => {
    const response = await fetch(`${BASE_URL}/api/documents/${id}/verify`, {
      method: 'PUT',
      headers: getHeaders(true),
      body: JSON.stringify({ status })
    });
    return handleResponse(response);
  }
};
