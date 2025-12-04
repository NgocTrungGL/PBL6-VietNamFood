import request from './request';

export async function listRecipes({ q, limit = 100, offset = 0, food_id, author_id } = {}) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (limit) params.append('limit', String(limit));
  if (offset) params.append('offset', String(offset));
  if (food_id !== undefined && food_id !== null) params.append('food_id', String(food_id));
  if (author_id !== undefined && author_id !== null) params.append('author_id', String(author_id));
  const path = `/api/recipes?${params.toString()}`;
  return await request(path);
}

export async function getRecipe(id) {
  return await request(`/api/recipes/${id}`);
}

export async function createRecipe(data) {
  // requires food_id, title, instructions
  return await request('/api/recipes', { method: 'POST', body: data });
}

export async function updateRecipe(id, data) {
  return await request(`/api/recipes/${id}`, { method: 'PUT', body: data });
}

export async function deleteRecipe(id) {
  return await request(`/api/recipes/${id}`, { method: 'DELETE' });
}

export default { listRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe };
