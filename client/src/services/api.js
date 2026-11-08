const API_URL = import.meta.env.VITE_API_URL || '/api';

function getAuthHeader() {
  const token = localStorage.getItem('sweety_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

async function request(endpoint, options = {}) {
  const url = `${API_URL}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    ...getAuthHeader(),
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  if (config.body && typeof config.body === 'object' && !(config.body instanceof FormData)) {
    config.body = JSON.stringify(config.body);
  }

  const response = await fetch(url, config);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const errorMsg = data.error || (data.errors && data.errors[0]?.message) || 'Something went wrong';
    const error = new Error(errorMsg);
    error.status = response.status;
    error.errors = data.errors;
    throw error;
  }

  return data;
}

export const api = {
  // Auth
  register: (payload) => request('/auth/register', { method: 'POST', body: payload }),
  login: (payload) => request('/auth/login', { method: 'POST', body: payload }),
  getProfile: () => request('/auth/me', { method: 'GET' }),

  // Readings
  getReadings: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/readings${query ? `?${query}` : ''}`, { method: 'GET' });
  },
  getReadingById: (id) => request(`/readings/${id}`, { method: 'GET' }),
  createReading: (payload) => request('/readings', { method: 'POST', body: payload }),
  updateReading: (id, payload) => request(`/readings/${id}`, { method: 'PUT', body: payload }),
  deleteReading: (id) => request(`/readings/${id}`, { method: 'DELETE' }),

  // Reports
  getAllReports: (date) => request(`/reports${date ? `?date=${date}` : ''}`, { method: 'GET' }),
  getDailyReport: (date) => request(`/reports/daily${date ? `?date=${date}` : ''}`, { method: 'GET' }),
  getMonthToDateReport: (date) => request(`/reports/month-to-date${date ? `?date=${date}` : ''}`, { method: 'GET' }),
  getMonthlyReport: (date) => request(`/reports/monthly${date ? `?date=${date}` : ''}`, { method: 'GET' }),
};
