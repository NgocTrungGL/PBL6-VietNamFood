const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export function getToken() {
  return localStorage.getItem('auth_token');
}

async function request(path, { method = 'GET', body = null, headers = {}, raw = false } = {}) {
  const url = `${BASE_URL}${path}`;
  const token = getToken();
  const h = {
    ...headers,
  };
  if (token) h['Authorization'] = `Bearer ${token}`;
  if (body && !(body instanceof FormData) && !raw) h['Content-Type'] = 'application/json';

  const resp = await fetch(url, {
    method,
    headers: h,
    body: body && !(body instanceof FormData) && !raw ? JSON.stringify(body) : body,
  });

  if (!resp.ok) {
    const ct = resp.headers.get('Content-Type') || '';
    let err = await resp.text();
    try { if (ct.includes('application/json')) err = JSON.stringify(await resp.json()); } catch(e){}
    throw new Error(`HTTP ${resp.status} ${err}`);
  }

  const contentType = resp.headers.get('Content-Type') || '';
  if (contentType.includes('application/json')) return await resp.json();
  return null;
}

export default request;
