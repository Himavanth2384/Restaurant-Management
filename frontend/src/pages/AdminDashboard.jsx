import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { deleteAdminUser, fetchAdminOrders, fetchAdminProfile, fetchAdminUsers, fetchDashboard, fetchRestaurants, updateAdminProfile, updateAdminRestaurantVisibility } from '../services/api';

export default function AdminDashboard() {
  const location = useLocation();
  const [stats, setStats] = useState({});
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    async function load() {
      const results = await Promise.allSettled([fetchDashboard(), fetchRestaurants(), fetchAdminUsers(), fetchAdminProfile(), fetchAdminOrders()]);
      const [dashboardResult, restaurantsResult, usersResult, profileResult, ordersResult] = results;
      if (dashboardResult.status === 'fulfilled') setStats(dashboardResult.value);
      if (restaurantsResult.status === 'fulfilled') setRestaurants(restaurantsResult.value);
      if (usersResult.status === 'fulfilled') setUsers(usersResult.value);
      if (profileResult.status === 'fulfilled') setProfile({ ...profileResult.value, password: '' });
      if (ordersResult.status === 'fulfilled') setOrders(ordersResult.value);
      const failedResult = results.find((result) => result.status === 'rejected');
      if (failedResult) setError(failedResult.reason.message);
    }
    load();
  }, []);

  const updateVisibility = async (restaurantId, isActive) => {
    try {
      const updated = await updateAdminRestaurantVisibility(restaurantId, isActive);
      setRestaurants((items) => items.map((item) => item.id === restaurantId ? updated : item));
      setMessage('Restaurant visibility updated.');
      setError('');
    } catch (err) { setError(err.message); }
  };

  const deleteUser = async (userId) => {
    try {
      await deleteAdminUser(userId);
      setUsers((items) => items.filter((user) => user.id !== userId));
      setMessage('User deleted.');
      setError('');
    } catch (err) { setError(err.message); }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const updated = await updateAdminProfile({ email: profile.email, password: profile.password || null });
      setProfile((current) => ({ ...current, ...updated, password: '' }));
      setMessage('Admin details updated.');
      setError('');
    } catch (err) { setError(err.message); }
  };

  const section = location.hash.slice(1) || 'dashboard';
  const owners = users.filter((user) => user.role === 'RestaurantOwner');
  const customers = users.filter((user) => user.role === 'User');

  const renderOverview = () => <div className="stats-grid">
    <div className="stat-card"><h3>Total Restaurants</h3><p>{stats.totalRestaurants ?? 0}</p></div>
    <div className="stat-card"><h3>Active Restaurants</h3><p>{restaurants.filter((restaurant) => restaurant.isActive).length}</p></div>
    <div className="stat-card"><h3>Total Owners</h3><p>{owners.length}</p></div>
    <div className="stat-card"><h3>Total Users</h3><p>{customers.length}</p></div>
    <div className="stat-card"><h3>Total Orders</h3><p>{stats.totalOrders ?? 0}</p></div>
    <div className="stat-card"><h3>Total Revenue</h3><p>{stats.totalRevenue ?? 0}</p></div>
  </div>;

  const renderRestaurants = () => <div className="card" id="restaurants">
    <h3>Restaurants</h3>
    {restaurants.length === 0 ? <p className="empty-state">No restaurants found.</p> : restaurants.map((restaurant) => (
      <div className="list-row" key={restaurant.id}>
        <div><strong>{restaurant.name}</strong> <small>{restaurant.address || 'No address provided'}</small></div>
        <select value={restaurant.isActive ? 'Active' : 'Hide'} onChange={(event) => updateVisibility(restaurant.id, event.target.value === 'Active')}>
          <option>Active</option><option>Hide</option>
        </select>
      </div>
    ))}
  </div>;

  const renderOwners = () => <div className="card" id="owners">
    <h3>Owners</h3>
    {owners.length === 0 ? <p className="empty-state">No restaurant owners found.</p> : owners.map((owner) => (
      <div className="list-row" key={owner.id}><div><strong>{owner.name}</strong><small>{owner.email} · {owner.phone || 'No phone'} · {owner.address || 'No address'}</small></div><span>{(owner.restaurants?.length ? owner.restaurants : restaurants.filter((restaurant) => restaurant.ownerId === owner.id)).map((restaurant) => restaurant.name).join(', ') || 'No restaurant assigned'}</span></div>
    ))}
  </div>;

  const renderUsers = () => <div className="card" id="users">
    <h3>Users</h3>
    {customers.length === 0 ? <p className="empty-state">No users found.</p> : customers.map((user) => (
      <div className="list-row" key={user.id}><div><strong>{user.name}</strong> <small>{user.email} · {user.phone || 'No phone'} · {user.address || 'No address'}</small></div><button type="button" className="danger-button" onClick={() => deleteUser(user.id)}>Delete</button></div>
    ))}
  </div>;

  const renderSettings = () => <div className="card" id="settings">
    <h3>Settings</h3>
    <form className="owner-form" onSubmit={saveProfile}>
      <label>Name<input value={profile.name} readOnly /></label>
      <label>Email<input type="email" required value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label>
      <label>Phone<input value={profile.phone || ''} readOnly /></label>
      <label>Address<input value={profile.address || ''} readOnly /></label>
      <label>New password<input type="password" placeholder="Leave blank to keep current password" value={profile.password} onChange={(event) => setProfile({ ...profile, password: event.target.value })} /></label>
      <button type="submit">Save admin details</button>
    </form>
  </div>;

  const renderOrders = () => <div className="card" id="orders">
    <h3>Orders</h3>
    {orders.length === 0 ? <p className="empty-state">No orders found.</p> : orders.map((order) => (
      <div className="list-row" key={order.id}>
        <div>
          <strong>Order #{order.id}</strong>
          <small> {order.customer?.name || 'Customer'} · {order.restaurant?.name || 'Restaurant'} · {new Date(order.createdAt).toLocaleString()}</small>
        </div>
        <div className="row-actions">
          <span className="pill">{order.status}</span>
          <strong>₹{order.totalAmount}</strong>
        </div>
      </div>
    ))}
  </div>;

  return (
    <div className="page" id="dashboard">
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <span className="pill">System overview</span>
      </div>
      {section === 'dashboard' && renderOverview()}
      {section === 'restaurants' && renderRestaurants()}
      {section === 'owners' && renderOwners()}
      {section === 'users' && renderUsers()}
      {section === 'settings' && renderSettings()}
      {section === 'orders' && renderOrders()}
    </div>
  );
}
