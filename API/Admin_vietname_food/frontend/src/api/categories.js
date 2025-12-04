import request from './request';

export function mapFromBackend(row) {
  return {
    id: row.category_id,
    category_name: row.category_name,
    description: row.description,
    image: row.image, // base64 string
    created_at: row.created_at,
  };
}

export function mapToBackend(data) {
  return {
    category_name: data.category_name,
    description: data.description,
    image: data.image,
  };
}

export async function listCategories({ q, limit = 100, offset = 0 } = {}) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (limit) params.append('limit', String(limit));
  if (offset) params.append('offset', String(offset));
  const path = `/api/categories?${params.toString()}`;
  const data = await request(path);
  return Array.isArray(data) ? data.map(mapFromBackend) : [];
}

export async function getCategory(id) {
  const data = await request(`/api/categories/${id}`);
  return data ? mapFromBackend(data) : null;
}

export async function createCategory(payload) {
  const body = mapToBackend(payload);
  return await request('/api/categories', { method: 'POST', body });
}

export async function updateCategory(id, payload) {
  const body = mapToBackend(payload);
  return await request(`/api/categories/${id}`, { method: 'PUT', body });
}

export async function deleteCategory(id) {
  return await request(`/api/categories/${id}`, { method: 'DELETE' });
}

export default { listCategories, getCategory, createCategory, updateCategory, deleteCategory, mapFromBackend, mapToBackend };
