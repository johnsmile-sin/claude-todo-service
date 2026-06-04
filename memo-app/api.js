const BASE_URL = 'https://claude-todo-service.onrender.com';

function getToken()      { return localStorage.getItem('idToken'); }
export function setToken(token) { localStorage.setItem('idToken', token); }
export function clearToken()    { localStorage.removeItem('idToken'); localStorage.removeItem('uid'); }

async function request(path, options = {}) {
  const token = getToken();
  const res = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
  });

  if (res.status === 401) {
    clearToken();
    window.location.href = 'index.html';
    return null;
  }

  return res.json();
}

export const api = {
  auth: {
    login:          (email, password)            => request('/api/auth/login',           { method: 'POST', body: { email, password } }),
    signup:         (email, password, name, org) => request('/api/auth/signup',          { method: 'POST', body: { email, password, name, org } }),
    logout:         ()                           => request('/api/auth/logout',          { method: 'POST' }),
    forgotPassword: (email)                      => request('/api/auth/forgot-password', { method: 'POST', body: { email } }),
  },
  users: {
    me: () => request('/api/users/me'),
  },
  todos: {
    list:   ()            => request('/api/todos'),
    create: (authorName)  => request('/api/todos',        { method: 'POST',   body: { authorName } }),
    update: (id, updates) => request(`/api/todos/${id}`,  { method: 'PATCH',  body: updates }),
    delete: (id)          => request(`/api/todos/${id}`,  { method: 'DELETE' }),
  },
};
