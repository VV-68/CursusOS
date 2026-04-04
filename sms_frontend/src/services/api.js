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
    throw new Error(data.message || data.error || 'Request failed');
  }
  return data;
};

export const login = async (credentials) => {
  const response = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
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

export const getStudents = async (params = {}) => {
  const { page = 1, limit = 5, department, sort } = params;
  const searchParams = new URLSearchParams();
  searchParams.set('page', page);
  searchParams.set('limit', limit);
  if (department) searchParams.set('department', department);
  if (sort) searchParams.set('sort', sort);

  const response = await fetch(`${BASE_URL}/students?${searchParams}`, {
    headers: getHeaders(true),
  });
  const data = await handleResponse(response);
  return data;
};

export const searchStudents = async (name) => {
  const response = await fetch(
    `${BASE_URL}/students/search?name=${encodeURIComponent(name)}`,
    { headers: getHeaders(true) }
  );
  const data = await handleResponse(response);
  return data;
};

export const getStudentById = async (id) => {
  const response = await fetch(`${BASE_URL}/students/${id}`, {
    headers: getHeaders(true),
  });
  return handleResponse(response);
};

export const addStudent = async (student) => {
  const response = await fetch(`${BASE_URL}/students`, {
    method: 'POST',
    headers: getHeaders(true),
    body: JSON.stringify(student),
  });
  return handleResponse(response);
};

export const updateStudent = async (id, student) => {
  const { name, department, marks } = student;
  const response = await fetch(`${BASE_URL}/students/${id}`, {
    method: 'PUT',
    headers: getHeaders(true),
    body: JSON.stringify({ name, department, marks }),
  });
  return handleResponse(response);
};

export const deleteStudent = async (id) => {
  const response = await fetch(`${BASE_URL}/students/${id}`, {
    method: 'DELETE',
    headers: getHeaders(true),
  });
  return handleResponse(response);
};

export const changePassword = async (data) => {
  const response = await fetch(`${BASE_URL}/auth/change-password`, {
    method: 'PATCH',
    headers: getHeaders(true),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const userAPI = {
  getAll: () => fetch(`${BASE_URL}/api/users`, { headers: getHeaders(true) }).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/api/users`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  resetPassword: (id) => fetch(`${BASE_URL}/api/users/${id}/reset-password`, { method: 'PATCH', headers: getHeaders(true) }).then(handleResponse),
  delete: (id) => fetch(`${BASE_URL}/api/users/${id}`, { method: 'DELETE', headers: getHeaders(true) }).then(handleResponse),
};

export const departmentAPI = {
  getAll: () => fetch(`${BASE_URL}/api/departments`, { headers: getHeaders(true) }).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/api/departments`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  assignHOD: (id, data) => fetch(`${BASE_URL}/api/departments/${id}/hod`, { method: 'PATCH', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getClasses: (id) => fetch(`${BASE_URL}/api/departments/${id}/classes`, { headers: getHeaders(true) }).then(handleResponse),
};

export const classAPI = {
  getAll: () => fetch(`${BASE_URL}/api/classes`, { headers: getHeaders(true) }).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/api/classes`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  assignAdvisors: (id, data) => fetch(`${BASE_URL}/api/classes/${id}/advisors`, { method: 'PATCH', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getStudents: (id) => fetch(`${BASE_URL}/api/classes/${id}/students`, { headers: getHeaders(true) }).then(handleResponse),
};

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

export const timetableAPI = {
  get: (classId) => fetch(`${BASE_URL}/api/timetable/${classId}`, { headers: getHeaders(true) }).then(handleResponse),
  upload: (data) => fetch(`${BASE_URL}/api/timetable`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
};

export const attendanceAPI = {
  getSheet: (qs) => fetch(`${BASE_URL}/api/attendance/sheet?${qs}`, { headers: getHeaders(true) }).then(handleResponse),
  mark: (data) => fetch(`${BASE_URL}/api/attendance/mark`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getSummary: (studentId) => fetch(`${BASE_URL}/api/attendance/summary/${studentId}`, { headers: getHeaders(true) }).then(handleResponse),
  getLow: (qs) => fetch(`${BASE_URL}/api/attendance/low?${qs}`, { headers: getHeaders(true) }).then(handleResponse),
};

export const marksAPI = {
  getSheet: (qs) => fetch(`${BASE_URL}/api/marks/sheet?${qs}`, { headers: getHeaders(true) }).then(handleResponse),
  update: (data) => fetch(`${BASE_URL}/api/marks/update`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getStudentMarks: (studentId) => fetch(`${BASE_URL}/api/marks/student/${studentId}`, { headers: getHeaders(true) }).then(handleResponse),
};

export const leaveAPI = {
  apply: (data) => fetch(`${BASE_URL}/api/leave`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
  getMine: () => fetch(`${BASE_URL}/api/leave/mine`, { headers: getHeaders(true) }).then(handleResponse),
  getPending: () => fetch(`${BASE_URL}/api/leave/pending`, { headers: getHeaders(true) }).then(handleResponse),
  process: (id, status) => fetch(`${BASE_URL}/api/leave/${id}/process`, { method: 'PATCH', headers: getHeaders(true), body: JSON.stringify({ status }) }).then(handleResponse),
};

export const noticeAPI = {
  getAll: () => fetch(`${BASE_URL}/api/notices`, { headers: getHeaders(true) }).then(handleResponse),
  create: (data) => fetch(`${BASE_URL}/api/notices`, { method: 'POST', headers: getHeaders(true), body: JSON.stringify(data) }).then(handleResponse),
};
