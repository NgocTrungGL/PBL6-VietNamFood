import request from './request';

/**
 * Frontend wrapper for favorites endpoints
 * Backend endpoints (observed):
 * GET  /api/favorites?user_id=...
 * POST /api/favorites                { user_id, food_id }
 * DELETE /api/favorites/<user_id>/<food_id>
 */

export async function listFavorites({ user_id = null, limit = 500, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (user_id !== null && user_id !== undefined) params.append('user_id', String(user_id));
  if (limit !== undefined) params.append('limit', String(limit));
  if (offset !== undefined) params.append('offset', String(offset));
  const path = `/api/favorites${params.toString() ? `?${params.toString()}` : ''}`;
  const data = await request(path);
  return Array.isArray(data) ? data : [];
}

export async function addFavorite({ user_id, food_id }) {
  if (user_id === undefined || food_id === undefined) throw new Error('user_id and food_id are required');
  const body = { user_id, food_id };
  // backend returns message and favorited_at
  const data = await request('/api/favorites', { method: 'POST', body });
  return data;
}

export async function removeFavorite(user_id, food_id) {
  if (user_id === undefined || food_id === undefined) throw new Error('user_id and food_id are required');
  return await request(`/api/favorites/${user_id}/${food_id}`, { method: 'DELETE' });
}

export default { listFavorites, addFavorite, removeFavorite };
