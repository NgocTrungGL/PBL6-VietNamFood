import request from './request';

export function mapFromBackend(row) {
  // Map backend row to frontend-friendly shape expected by UI
  const imgB64 = row.main_image;
  const image = imgB64 ? `data:image/jpeg;base64,${imgB64}` : 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop';
  // Simple region mapping (adjust as needed)
  const regionMap = {
    1: 'Miền Bắc',
    2: 'Miền Trung',
    3: 'Miền Nam'
  };
  return {
    id: row.food_id,
    category_id: row.category_id,
    name: row.name,
    description: row.description,
    image: image,
    region: regionMap[row.origin_region_id] || '',
    origin_region_id: row.origin_region_id,
    avg_rating: row.avg_rating,
    most_popular: row.most_popular,
    created_at: row.created_at,
    updated_at: row.updated_at,
    // UI expects ingredients, calories, province — provide empty/defaults
    ingredients: Array.isArray(row.ingredients) ? row.ingredients : [],
    calories: row.calories || 0,
    province: row.province || ''
  };
}

export function mapToBackend(data) {
  return {
    category_id: data.category_id,
    name: data.name,
    description: data.description,
    main_image: data.main_image, // expect base64 string or null
    origin_region_id: data.origin_region_id,
    avg_rating: data.avg_rating,
    most_popular: data.most_popular,
  };
}

export async function listFoods({ q, limit = 100, offset = 0, category_id, origin_region_id } = {}) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (limit) params.append('limit', String(limit));
  if (offset) params.append('offset', String(offset));
  if (category_id !== undefined && category_id !== null) params.append('category_id', String(category_id));
  if (origin_region_id !== undefined && origin_region_id !== null) params.append('origin_region_id', String(origin_region_id));
  const path = `/api/foods?${params.toString()}`;
  const data = await request(path);
  return Array.isArray(data) ? data.map(mapFromBackend) : [];
}

export async function getFood(id) {
  const data = await request(`/api/foods/${id}`);
  return data ? mapFromBackend(data) : null;
}

export async function createFood(payload) {
  const body = mapToBackend(payload);
  const resp = await request('/api/foods', { method: 'POST', body });
  // If backend returns id or created object, try to return created object
  if (resp && resp.food_id) return { id: resp.food_id, ...payload };
  if (resp && resp.id) return resp;
  return { id: Date.now(), ...payload };
}

export async function updateFood(id, payload) {
  const body = mapToBackend(payload);
  await request(`/api/foods/${id}`, { method: 'PUT', body });
  return { id, ...payload };
}

export async function deleteFood(id) {
  return await request(`/api/foods/${id}`, { method: 'DELETE' });
}

export default { listFoods, getFood, createFood, updateFood, deleteFood, mapFromBackend, mapToBackend };
