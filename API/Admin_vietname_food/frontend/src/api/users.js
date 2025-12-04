import request from './request';

function _stripDataUrlMaybe(s) {
  if (!s) return s;
  // if data url like 'data:image/png;base64,....' strip prefix
  const idx = s.indexOf('base64,');
  if (idx !== -1) return s.slice(idx + 7);
  return s;
}

export function mapFromBackend(row) {
  if (!row) return null;
  const avatarB64 = row.avatar;
  const avatar = avatarB64 ? `data:image/jpeg;base64,${avatarB64}` : null;
  return {
    id: row.user_id,
    username: row.username,
    email: row.email,
    full_name: row.full_name,
    avatar,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function mapToBackend(data) {
  if (!data) return {};
  const out = {};
  if (data.username !== undefined) out.username = data.username;
  if (data.email !== undefined) out.email = data.email;
  if (data.password !== undefined) out.password = data.password;
  if (data.full_name !== undefined) out.full_name = data.full_name;
  if (data.avatar !== undefined) out.avatar = _stripDataUrlMaybe(data.avatar);
  return out;
}

export async function listUsers({ q, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (limit !== undefined) params.append('limit', String(limit));
  if (offset !== undefined) params.append('offset', String(offset));
  const path = `/api/users${params.toString() ? `?${params.toString()}` : ''}`;
  const data = await request(path);
  return Array.isArray(data) ? data.map(mapFromBackend) : [];
}

export async function getUser(id) {
  const data = await request(`/api/users/${id}`);
  return data ? mapFromBackend(data) : null;
}

export async function createUser(payload) {
  const body = mapToBackend(payload);
  // backend requires username, email, password
  const resp = await request('/api/users', { method: 'POST', body });
  return resp;
}

export async function updateUser(id, payload) {
  const body = mapToBackend(payload);
  const resp = await request(`/api/users/${id}`, { method: 'PUT', body });
  return resp;
}

export async function deleteUser(id) {
  return await request(`/api/users/${id}`, { method: 'DELETE' });
}

export default { listUsers, getUser, createUser, updateUser, deleteUser, mapFromBackend, mapToBackend };
