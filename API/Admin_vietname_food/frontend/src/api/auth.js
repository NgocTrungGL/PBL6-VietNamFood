import request from './request';

export async function login({ username, email, password }) {
  const payload = {};
  if (username) payload.username = username;
  if (email) payload.email = email;
  payload.password = password;

  const data = await request('/api/login', { method: 'POST', body: payload });
  if (data && data.token) {
    localStorage.setItem('auth_token', data.token);
    if (data.user) localStorage.setItem('auth_user', JSON.stringify(data.user));
  }
  return data;
}

export function logout() {
  localStorage.removeItem('auth_token');
  localStorage.removeItem('auth_user');
}

export function getToken() {
  return localStorage.getItem('auth_token');
}

export function getCurrentUser() {
  const raw = localStorage.getItem('auth_user');
  try { return raw ? JSON.parse(raw) : null; } catch { return null; }
}

export default { login, logout, getToken, getCurrentUser };

export async function register({ username, email, password, full_name }) {
  const payload = { username, email, password, full_name };
  const data = await request('/api/auth/register', { method: 'POST', body: payload });
  return data;
}

export function currentUser() {
  return getCurrentUser();
}

// Compatibility object
export const AuthAPI = {
  login,
  register,
  logout,
  getToken,
  currentUser,
  getCurrentUser
};
