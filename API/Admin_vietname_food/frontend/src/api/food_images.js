import request from './request';

function _toDataUrl(row) {
  if (!row) return null;
  return row.image_data || null; // Use image_data directly
}

export async function listImages({ food_id = null, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (food_id !== null && food_id !== undefined) params.append('food_id', String(food_id));
  if (limit !== undefined) params.append('limit', String(limit));
  if (offset !== undefined) params.append('offset', String(offset));
  const path = `/api/food_images${params.toString() ? `?${params.toString()}` : ''}`;
  const data = await request(path);
  if (!Array.isArray(data)) return [];
  return data.map(r => ({ ...r, data_url: _toDataUrl(r) }));
}

export async function getImage(id) {
  const data = await request(`/api/food_images/${id}`);
  if (!data) return null;
  return { ...data, data_url: _toDataUrl(data) };
}

export async function createImage({ food_id, image_data, caption } = {}) {
  if (!food_id || !image_data) throw new Error('food_id and image_data are required');
  const resp = await request('/api/food_images', { method: 'POST', body: { food_id, image_data, caption } });
  return resp;
}

export async function updateImage(id, data) {
  const body = { ...data };
  return await request(`/api/food_images/${id}`, { method: 'PUT', body });
}

export async function deleteImage(id) {
  return await request(`/api/food_images/${id}`, { method: 'DELETE' });
}

export default { listImages, getImage, createImage, updateImage, deleteImage };
