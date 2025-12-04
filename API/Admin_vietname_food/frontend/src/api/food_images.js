import request from './request';

function _toDataUrl(row) {
  if (!row) return null;
  const b64 = row.image_data || row.image || null;
  return b64 ? `data:image/jpeg;base64,${b64}` : null;
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
  const img = typeof image_data === 'string' && image_data.startsWith('data:') ? image_data.split('base64,')[1] : image_data;
  const resp = await request('/api/food_images', { method: 'POST', body: { food_id, image_data: img, caption } });
  return resp;
}

export async function updateImage(id, data) {
  const body = { ...data };
  if (body.image_data && typeof body.image_data === 'string' && body.image_data.startsWith('data:')) {
    body.image_data = body.image_data.split('base64,')[1];
  }
  return await request(`/api/food_images/${id}`, { method: 'PUT', body });
}

export async function deleteImage(id) {
  return await request(`/api/food_images/${id}`, { method: 'DELETE' });
}

export default { listImages, getImage, createImage, updateImage, deleteImage };
