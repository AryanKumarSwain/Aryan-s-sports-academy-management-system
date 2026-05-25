import axios from 'axios';

export const ADMIN_TOKEN_KEY = 'sams_admin_token';
export const COACH_TOKEN_KEY = 'sams_coach_token';

const api = axios.create({
  baseURL: '/api/v1',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const message =
      error.response?.data?.message || error.message || 'Request failed';
    const wrapped = new Error(message);
    wrapped.status = error.response?.status;
    wrapped.payload = error.response?.data;
    return Promise.reject(wrapped);
  }
);

function unwrap(response) {
  return response.data;
}

export function getAdminToken() {
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token) {
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken() {
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function getCoachToken() {
  return localStorage.getItem(COACH_TOKEN_KEY);
}

export function setCoachToken(token) {
  localStorage.setItem(COACH_TOKEN_KEY, token);
}

export function clearCoachToken() {
  localStorage.removeItem(COACH_TOKEN_KEY);
}

export async function signup(body) {
  const data = await api.post('/auth/signup', body).then(unwrap);
  if (data.data?.token) {
    setAdminToken(data.data.token);
  }
  return data;
}

export async function adminLogin(body) {
  const data = await api.post('/auth/login', body).then(unwrap);
  if (data.data?.token) {
    setAdminToken(data.data.token);
  }
  return data;
}

export async function coachLogin(body) {
  const data = await api.post('/auth/coach/login', body).then(unwrap);
  if (data.data?.token) {
    setCoachToken(data.data.token);
  }
  return data;
}

export async function adminGet(path) {
  return api
    .get(path, {
      headers: { Authorization: `Bearer ${getAdminToken()}` }
    })
    .then(unwrap);
}

export async function adminPost(path, body) {
  return api
    .post(path, body, {
      headers: { Authorization: `Bearer ${getAdminToken()}` }
    })
    .then(unwrap);
}

export async function adminPatch(path, body) {
  return api
    .patch(path, body, {
      headers: { Authorization: `Bearer ${getAdminToken()}` }
    })
    .then(unwrap);
}

export async function adminDelete(path) {
  return api
    .delete(path, {
      headers: { Authorization: `Bearer ${getAdminToken()}` }
    })
    .then(unwrap);
}

export async function coachGet(path) {
  return api
    .get(path, {
      headers: { Authorization: `Bearer ${getCoachToken()}` }
    })
    .then(unwrap);
}

export async function coachPost(path, body) {
  return api
    .post(path, body, {
      headers: { Authorization: `Bearer ${getCoachToken()}` }
    })
    .then(unwrap);
}

export const TIMING_OPTIONS = [
  '06:00', '06:30', '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30',
  '18:00', '18:30', '19:00', '19:30', '20:00'
];

export const PRICING_PLANS = [
  {
    id: 'basic',
    name: 'Basic',
    price: 29,
    coaches: 3,
    students: 50,
    featured: false,
    features: ['Batch scheduling', 'Email notifications', 'Standard support']
  },
  {
    id: 'pro',
    name: 'Pro',
    price: 79,
    coaches: 15,
    students: 300,
    featured: true,
    features: ['Advanced analytics', 'Payment tracking', 'Priority support']
  },
  {
    id: 'enterprise',
    name: 'Enterprise',
    price: 199,
    coaches: 'Unlimited',
    students: 'Unlimited',
    featured: false,
    features: ['Multi-branch academies', 'Custom integrations', 'Dedicated account manager']
  }
];
