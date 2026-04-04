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
