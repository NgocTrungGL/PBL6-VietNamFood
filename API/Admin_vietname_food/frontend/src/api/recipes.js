import request from './request';

export function mapFromBackend(row) {
  return {
    recipe_id: row.recipe_id,
    food_id: row.food_id,
    title: row.title,
    description: row.description || '',
    instructions: row.instructions,
    video_url: row.video_url,
    prep_time_minutes: row.prep_time_minutes,
    cook_time_minutes: row.cook_time_minutes,
    author: row.author || '', // Map author_id to author for now
    author_id: row.author_id,
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export function mapToBackend(data) {
  const mapped = {
    food_id: Number(data.food_id), // Ensure it's a number
    title: data.title,
    instructions: data.instructions,
    video_url: data.video_url || null,
    prep_time_minutes: data.prep_time_minutes ? Number(data.prep_time_minutes) : null,
    cook_time_minutes: data.cook_time_minutes ? Number(data.cook_time_minutes) : null,
    author_id: data.author_id ? Number(data.author_id) : null
  };
  console.log('mapToBackend input:', data);
  console.log('mapToBackend output:', mapped);
  return mapped;
}

export async function listRecipes({ q, limit = 100, offset = 0, food_id, author_id } = {}) {
  const params = new URLSearchParams();
  if (q) params.append('q', q);
  if (limit) params.append('limit', String(limit));
  if (offset) params.append('offset', String(offset));
  if (food_id !== undefined && food_id !== null) params.append('food_id', String(food_id));
  if (author_id !== undefined && author_id !== null) params.append('author_id', String(author_id));
  const path = `/api/recipes?${params.toString()}`;
  const data = await request(path);
  return Array.isArray(data) ? data.map(mapFromBackend) : [];
}

export async function getRecipe(id) {
  const data = await request(`/api/recipes/${id}`);
  return data ? mapFromBackend(data) : null;
}

export async function createRecipe(data) {
  // requires food_id, title, instructions
  console.log('Creating recipe with data:', data);
  const body = mapToBackend(data);
  console.log('Mapped body for backend:', body);
  const result = await request('/api/recipes', { method: 'POST', body });
  console.log('Create recipe result:', result);
  return result;
}

export async function updateRecipe(id, data) {
  console.log('Updating recipe with id:', id, 'data:', data);
  const body = mapToBackend(data);
  console.log('Mapped body for backend update:', body);
  const result = await request(`/api/recipes/${id}`, { method: 'PUT', body });
  console.log('Update recipe result:', result);
  return result;
}

export async function deleteRecipe(id) {
  return await request(`/api/recipes/${id}`, { method: 'DELETE' });
}

export default { listRecipes, getRecipe, createRecipe, updateRecipe, deleteRecipe };
