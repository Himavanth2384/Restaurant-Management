import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { deleteAdminUser, fetchAdminOrders, fetchAdminProfile, fetchAdminRestaurantMenu, fetchAdminUsers, fetchDashboard, fetchRestaurants, updateAdminProfile, updateAdminRestaurantVisibility } from '../services/api';

export default function AdminDashboard() {
  const location = useLocation();
  const [stats, setStats] = useState({});
  const [restaurants, setRestaurants] = useState([]);
  const [users, setUsers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [restaurantMenu, setRestaurantMenu] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (!message) return undefined;
    const timer = setTimeout(() => setMessage(''), 5000);
    return () => clearTimeout(timer);
  }, [message]);

  useEffect(() => {
    if (!error) return undefined;
    const timer = setTimeout(() => setError(''), 5000);
    return () => clearTimeout(timer);
  }, [error]);

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

  const openRestaurantMenu = async (restaurant) => {
    try {
      const data = await fetchAdminRestaurantMenu(restaurant.id);
      setSelectedRestaurant(data.restaurant);
      setRestaurantMenu(data.menuItems || []);
      setMessage(`${restaurant.name} menu loaded.`);
      setError('');
    } catch (err) {
      setError(err.message);
    }
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
    <div className="stat-card"><h3>Active Restaurants</h3><p>{stats.activeRestaurants ?? restaurants.filter((restaurant) => restaurant.isActive).length}</p></div>
    <div className="stat-card"><h3>Total Registered Users</h3><p>{stats.totalUsers ?? customers.length}</p></div>
    <div className="stat-card"><h3>Orders Today</h3><p>{stats.todaysOrders ?? 0}</p></div>
    <div className="stat-card"><h3>Revenue Today</h3><p>₹{stats.todaysRevenue ?? 0}</p></div>
    <div className="stat-card"><h3>Total Orders</h3><p>{stats.totalOrders ?? 0}</p></div>
    <div className="stat-card"><h3>Total Revenue</h3><p>₹{stats.totalRevenue ?? 0}</p></div>
  </div>;

  const renderRestaurants = () => <div className="card admin-restaurants-section" id="restaurants">
    <div className="admin-section-title">
      <h3>Restaurants</h3>
      <span className="pill">{restaurants.length}</span>
    </div>
    {restaurants.length === 0 ? <p className="empty-state">No restaurants found.</p> : <div className="admin-restaurant-card-grid">
      {restaurants.map((restaurant) => (
        <div className="admin-restaurant-card" key={restaurant.id}>
          <div className="admin-restaurant-card-top">
            <div>
              <strong className="admin-restaurant-card-name">{restaurant.name}</strong>
              <small className="admin-restaurant-card-address">{restaurant.address || 'No address provided'}</small>
            </div>
            <span className={`status-badge ${restaurant.isActive ? 'active' : 'hidden'}`}>{restaurant.isActive ? 'Active' : 'Hidden'}</span>
          </div>
          <div className="admin-restaurant-card-meta">
            <span><b>Owner</b>{restaurant.owner?.name || restaurant.ownerName || 'No owner assigned'}</span>
            <span><b>Status</b>{restaurant.status || 'Pending'}</span>
          </div>
          <div className="admin-restaurant-card-actions">
            <div className="admin-restaurant-card-footer">
              <button type="button" className="admin-open-menu-button" onClick={() => openRestaurantMenu(restaurant)}>Open Menu</button>
              <label className="availability-toggle restaurant-visibility-toggle" title={restaurant.isActive ? 'Disable restaurant' : 'Enable restaurant'}>
                <input type="checkbox" checked={restaurant.isActive} onChange={(event) => updateVisibility(restaurant.id, event.target.checked)} />
                <span className="toggle-track" aria-hidden="true"><span /></span>
                <span className="toggle-label">{restaurant.isActive ? 'Active' : 'Inactive'}</span>
              </label>
            </div>
          </div>
        </div>
      ))}
    </div>}
    {selectedRestaurant && (
      <div className="admin-restaurant-menu-panel">
        <div className="admin-restaurant-menu-head">
          <div>
            <span className="panel-kicker">Restaurant Menu</span>
            <h3>{selectedRestaurant.name}</h3>
          </div>
          <span className="pill">{restaurantMenu.length} items</span>
        </div>
        {restaurantMenu.length === 0 ? <p className="empty-state">No menu items found.</p> : (
          <div className="admin-restaurant-menu-card-grid">
            {restaurantMenu.map((item) => (
              <div className="admin-restaurant-menu-card" key={item.id}>
                <div className="admin-restaurant-menu-card-top">
                  <div>
                    <strong className="admin-restaurant-menu-card-name">{item.name}</strong>
                    <small className="admin-restaurant-menu-card-category">{item.categoryName || 'General'} </small>
                  </div>
                  <span className={`menu-card-availability ${item.isAvailable ? 'available' : 'unavailable'}`}>{item.isAvailable ? 'Available' : 'Unavailable'}</span>
                </div>
                <p className="admin-restaurant-menu-card-description">{item.description || 'No description'}</p>
                <div className="admin-restaurant-menu-card-meta">
                  <span className={`food-type-${item.foodType}`}>{item.foodType}</span>
                  <span className="menu-price">₹{item.price}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    )}
  </div>;

  const renderOwners = () => <div className="card" id="owners">
    <div className="admin-section-title">
      <h3>Owners</h3>
      <span className="pill">{owners.length}</span>
    </div>
    {owners.length === 0 ? <p className="empty-state">No restaurant owners found.</p> : (
      <div className="admin-profile-card-grid">
        {owners.map((owner) => {
          const ownerRestaurants = (owner.restaurants?.length ? owner.restaurants : restaurants.filter((restaurant) => restaurant.ownerId === owner.id));
          return (
            <div className="admin-profile-card" key={owner.id}>
              <div className="admin-profile-card-head">
                <div>
                  <strong className="admin-profile-card-name">{owner.name}</strong>
                  <small className="admin-profile-card-role">Restaurant Owner</small>
                </div>
              </div>
              <div className="admin-profile-card-details">
                <span>{'Email: ' + owner.email}</span>
                <span>{'Phone: ' + (owner.phone || 'No phone')}</span>
                <span>{'Address: ' + (owner.address || 'No address')}</span>
              </div>
              <div className="admin-profile-card-footer">
                <span className="admin-profile-card-restaurants">{ownerRestaurants.map((restaurant) => `Restaurant: ${restaurant.name}`).join(', ') || 'No restaurant assigned'}</span>
              </div>
            </div>
          );
        })}
      </div>
    )}
  </div>;

  const renderUsers = () => <div className="card" id="users">
    <div className="admin-section-title">
      <h3>Users</h3>
      <span className="pill">{customers.length}</span>
    </div>
    {customers.length === 0 ? <p className="empty-state">No users found.</p> : (
      <div className="admin-profile-card-grid">
        {customers.map((user) => (
          <div className="admin-profile-card" key={user.id}>
            <div className="admin-profile-card-head">
              <div>
                <strong className="admin-profile-card-name">{user.name}</strong>
                <small className="admin-profile-card-role">Customer</small>
              </div>
            </div>
            <div className="admin-profile-card-details">
              <span>{'Email: ' + user.email}</span>
              <span>{'Phone: ' + (user.phone || 'No phone')}</span>
              <span>{'Address: ' + (user.address || 'No address')}</span>
            </div>
            <div className="admin-profile-card-footer">
              <button type="button" className="danger-button" onClick={() => deleteUser(user.id)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    )}
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

  const renderOrders = () => <div className="card order-card-grid" id="orders">
    <h3>Orders</h3>
    {orders.length === 0 ? <p className="empty-state">No orders found.</p> : orders.map((order) => (
      <div className="order-card compact-order-card" key={order.id}>
        <div>
          <strong>Order #{order.id}</strong>
          <small> {order.customer?.name || 'Customer'} · {order.restaurant?.name || 'Restaurant'} · {new Date(order.createdAt).toLocaleString()}</small>
        </div>
        <div className="row-actions">
          <span className="order-status" data-status={order.status}>{order.status}</span>
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
