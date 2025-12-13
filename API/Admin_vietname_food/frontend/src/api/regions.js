import axios from 'axios';
const API_URL = 'http://localhost:5000/api/regions';

// Convert base64 to viewable image, auto-detect type or use generic
const toImageUrl = (b64) => {
  if (!b64) return null;
  // If already has prefix, return as is
  if (b64.startsWith('data:image')) return b64;
  // Use generic type to avoid broken image
  return `data:image/*;base64,${b64}`;
};

export async function getAllRegionsWithClassification() {
  try {
    const res = await axios.get(API_URL);
    const data = res.data;

    const regions = Array.isArray(data) ? data : data.data || data.regions || [];

    const mainRegions = [
      { id: 1, name: 'Miền Bắc', parent_region_id: null },
      { id: 2, name: 'Miền Trung', parent_region_id: null },
      { id: 3, name: 'Miền Nam', parent_region_id: null }
    ];

    const provinces = regions.map(r => ({
      id: r.region_id,
      name: r.region_name,
      parent_region_id: r.parent_region_id,
      description: r.description,
      region_image: toImageUrl(r.region_image)
    }));

    return { mainRegions, provinces };
  } catch (err) {
    console.error('Error fetching regions:', err);
    throw err;
  }
}

export async function getProvincesByRegion(regionId) {
  try {
    const res = await axios.get(
      `${API_URL}?parent_region_id=${regionId}&limit=100`
    );
    const data = res.data;
    const regions = Array.isArray(data) ? data : data.data || data.regions || [];

    return regions.map(r => ({
      id: r.region_id,
      name: r.region_name,
      parent_region_id: r.parent_region_id,
      description: r.description,
      region_image: toImageUrl(r.region_image)
    }));
  } catch (err) {
    console.error('Error fetching provinces by region:', err);
    throw err;
  }
}

export async function createRegion(data) {
  try {
    const res = await axios.post(API_URL, data);
    return res.data;
  } catch (err) {
    console.error('Error creating region:', err);
    throw err;
  }
}

export async function updateRegion(id, data) {
  try {
    const res = await axios.put(`${API_URL}/${id}`, data);
    return res.data;
  } catch (err) {
    console.error('Error updating region:', err);
    throw err;
  }
}

export async function deleteRegion(id) {
  try {
    const res = await axios.delete(`${API_URL}/${id}`);
    return res.data;
  } catch (err) {
    console.error('Error deleting region:', err);
    throw err;
  }
}

export async function getRegionById(id) {
  try {
    const res = await axios.get(`${API_URL}/${id}`);
    const region = res.data;

    return {
      id: region.region_id,
      name: region.region_name,
      parent_region_id: region.parent_region_id,
      description: region.description,
      region_image: toImageUrl(region.region_image)
    };
  } catch (err) {
    console.error('Error fetching region by id:', err);
    throw err;
  }
}

export const listRegions = getAllRegionsWithClassification;
export const getRegion = getRegionById;
export { createRegion as createRegionAPI };
export { updateRegion as updateRegionAPI };
export { deleteRegion as deleteRegionAPI };

export const getMainRegions = () => ([
  { id: 1, name: 'Miền Bắc', parent_region_id: null },
  { id: 2, name: 'Miền Trung', parent_region_id: null },
  { id: 3, name: 'Miền Nam', parent_region_id: null }
]);
