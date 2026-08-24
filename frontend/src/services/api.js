export async function fetchCustomerProfile() {
  return request('/profile');
}

export async function updateCustomerProfile(payload) {
  return request('/profile', { method: 'PUT', body: JSON.stringify(payload) });
}
const API_BASE_URL = 'http://localhost:5277/api';

async function request(path, options = {}) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const response = await fetch(`${API_BASE_URL}${path}`, { ...options, headers });
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || 'Request failed');
  }

  return data;
}

export async function loginUser(email, password) {
  return request('/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password })
  });
}

export async function registerUser(form) {
  return request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(form)
  });
}

export async function fetchMe() {
  return request('/auth/me');
}

export async function fetchDashboard() {
  return request('/admin/dashboard');
}

export async function fetchRestaurants(status) {
  const query = status ? `?status=${status}` : '';
  return request(`/admin/restaurants${query}`);
}

export async function fetchAdminUsers() {
  return request('/admin/users');
}

export async function fetchAdminOrders() {
  return request('/admin/orders');
}

export async function fetchAdminProfile() {
  return request('/admin/profile');
}

export async function updateAdminProfile(payload) {
  return request('/admin/profile', { method: 'PUT', body: JSON.stringify(payload) });
}

export async function updateAdminRestaurantVisibility(restaurantId, isVisible) {
  return request(`/admin/restaurants/${restaurantId}/visibility`, {
    method: 'PUT',
    body: JSON.stringify({ isVisible })
  });
}

export async function deleteAdminUser(userId) {
  return request(`/admin/users/${userId}`, { method: 'DELETE' });
}

export async function fetchOwnerDashboard() {
  return request('/owner/dashboard');
}

export async function fetchOwnerRestaurant() {
  return request('/owner/restaurant');
}

export async function fetchOwnerProfile() {
  return request('/owner/profile');
}

export async function updateOwnerProfile(payload) {
  return request('/owner/profile', { method: 'PUT', body: JSON.stringify(payload) });
}

export async function updateOwnerRestaurant(payload) {
  return request('/owner/restaurant', {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function fetchOwnerCategories() {
  return request('/owner/categories');
}

export async function createOwnerCategory(name) {
  return request('/owner/categories', {
    method: 'POST',
    body: JSON.stringify({ name })
  });
}

export async function deleteOwnerCategory(categoryId) {
  return request(`/owner/categories/${categoryId}`, { method: 'DELETE' });
}

export async function fetchOwnerMenu() {
  return request('/owner/menu');
}

export async function createOwnerMenuItem(payload) {
  return request('/owner/menu', {
    method: 'POST',
    body: JSON.stringify(payload)
  });
}

export async function updateOwnerMenuItem(menuId, payload) {
  return request(`/owner/menu/${menuId}`, {
    method: 'PUT',
    body: JSON.stringify(payload)
  });
}

export async function deleteOwnerMenuItem(menuId) {
  return request(`/owner/menu/${menuId}`, { method: 'DELETE' });
}

export async function fetchOwnerOrders() {
  return request('/owner/orders');
}

export async function updateOwnerOrderStatus(orderId, status) {
  return request(`/owner/orders/${orderId}/status`, {
    method: 'PUT',
    body: JSON.stringify({ status })
  });
}

export async function fetchCustomerRestaurants(search) {
  const query = search ? `?search=${encodeURIComponent(search)}` : '';
  return request(`/restaurants${query}`);
}

export async function fetchRestaurantDetail(restaurantId) {
  return request(`/restaurants/${restaurantId}`);
}

export async function fetchMenuSearch(search, foodType) {
  const query = new URLSearchParams({ search: search || '', foodType: foodType || 'All' });
  return request(`/menu/search?${query.toString()}`);
}

export async function fetchCart() {
  const data = await request('/cart');
  return { ...data, items: data?.items || data?.cartItems || [] };
}

export async function addCartItem(payload) {
  return request('/cart', { method: 'POST', body: JSON.stringify(payload) });
}

export async function removeCartItem(itemId) {
  return request(`/cart/${itemId}`, { method: 'DELETE' });
}

export async function updateCartItem(itemId, quantity) {
  return request(`/cart/${itemId}`, { method: 'PUT', body: JSON.stringify({ quantity }) });
}

export async function placeOrder(payload) {
  return request('/orders', { method: 'POST', body: JSON.stringify(payload) });
}

export async function fetchOrders() {
  return request('/orders');
}

export async function fetchOrderDetail(orderId) {
  return request(`/orders/${orderId}`);
}
