import request from './request';

export function mapFromBackend(row) {
  return {
    id: row.region_id,
    name: row.region_name,
    image: row.region_image,
    description: row.description,
    parent_region_id: row.parent_region_id || null,
  };
}

export function mapToBackend(data) {
  return {
    region_name: data.name,
    region_image: data.image,
    description: data.description,
    parent_region_id: data.parent_region_id || null,
  };
}

export async function listRegions({ q, limit = 100, offset = 0, parent_region_id } = {}) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (limit) params.append('limit', String(limit));
  if (offset) params.append('offset', String(offset));
  if (parent_region_id !== undefined && parent_region_id !== null) params.append('parent_region_id', String(parent_region_id));
  const path = `/api/regions?${params.toString()}`;
  const data = await request(path);
  return Array.isArray(data) ? data.map(mapFromBackend) : [];
}

export async function getRegion(id) {
  const data = await request(`/api/regions/${id}`);
  return data ? mapFromBackend(data) : null;
}

export async function createRegion(payload) {
  const body = mapToBackend(payload);
  return await request('/api/regions', { method: 'POST', body });
}

export async function updateRegion(id, payload) {
  const body = mapToBackend(payload);
  return await request(`/api/regions/${id}`, { method: 'PUT', body });
}

export async function deleteRegion(id) {
  return await request(`/api/regions/${id}`, { method: 'DELETE' });
}

export default { listRegions, getRegion, createRegion, updateRegion, deleteRegion, mapFromBackend, mapToBackend };
