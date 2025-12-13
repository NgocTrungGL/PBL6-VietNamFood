// food.js (đã sửa lại)
import request from './request';

function buildFormData(data) {
  const form = new FormData();
  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      form.append(key, data[key]);
    }
  });
  return form;
}

// Map frontend → backend fields
function mapToBackend(data) {
  return {
    category_id: data.category_id,
    name: data.name,
    description: data.description,
    ingredients: data.ingredients || [],   // ✅ không stringify nữa
    main_image: data.main_image,
    origin_region_id: data.origin_region_id,
    avg_rating: data.avg_rating,
    most_popular: data.most_popular,
    serve_time: data.serve_time,
    nutrition_info: data.nutrition_info
  };
}

export async function listFoods(params = {}) {
  const query = new URLSearchParams(params).toString();
  return request(`/api/foods?${query}`);
}

export async function getFood(id) {
  return request(`/api/foods/${id}`);
}

export async function createFood(data) {
  const body = mapToBackend(data);
  const form = buildFormData(body);

  return request(`/api/foods`, {
    method: 'POST',
    body: form,
    headers: {}
  });
}

export async function updateFood(id, data) {
  const body = mapToBackend(data);
  const form = buildFormData(body);

  return request(`/api/foods/${id}`, {
    method: 'PUT',
    body: form,
    headers: {}
  });
}

export async function deleteFood(id) {
  return request(`/api/foods/${id}`, {
    method: 'DELETE'
  });
}
