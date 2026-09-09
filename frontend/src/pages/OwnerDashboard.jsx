import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  createOwnerCategory,
  createOwnerMenuItem,
  deleteOwnerCategory,
  deleteOwnerMenuItem,
  fetchOwnerCategories,
  fetchOwnerDashboard,
  fetchOwnerMenu,
  fetchOwnerOrders,
  fetchOwnerProfile,
  fetchOwnerRestaurant,
  updateOwnerMenuItem,
  updateOwnerOrderStatus,
  updateOwnerProfile,
  updateOwnerRestaurant,
} from '../services/api';

const emptyMenuForm = {
  name: '',
  description: '',
  price: '',
  foodType: 'Veg',
  categoryId: '',
  isAvailable: true,
};

export default function OwnerDashboard() {
  const location = useLocation();
  const [data, setData] = useState({});
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [menuFilter, setMenuFilter] = useState('All');
  const [editingMenuId, setEditingMenuId] = useState(null);
  const [isMenuFormOpen, setIsMenuFormOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [categoryName, setCategoryName] = useState('');
  const [menuForm, setMenuForm] = useState(emptyMenuForm);
  const [restaurantForm, setRestaurantForm] = useState({
    name: '',
    description: '',
    address: '',
    phone: '',
    email: '',
    openingTime: '',
    closingTime: '',
    isActive: true,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const section = location.pathname;

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
      try {
        const dashboard = await fetchOwnerDashboard();
        const restaurantData = await fetchOwnerRestaurant();
        const categoryData = await fetchOwnerCategories();
        const menuData = await fetchOwnerMenu();
        const orderData = await fetchOwnerOrders();
        const profileData = await fetchOwnerProfile();

        setData(dashboard);
        setRestaurant(restaurantData);
        setCategories(categoryData);
        setMenuItems(menuData);
        setOrders(orderData);
        setProfile({ ...profileData, password: '' });
        setRestaurantForm({
          name: restaurantData.name || '',
          description: restaurantData.description || '',
          address: restaurantData.address || '',
          phone: restaurantData.phone || '',
          email: restaurantData.email || '',
          openingTime: restaurantData.openingTime || '',
          closingTime: restaurantData.closingTime || '',
          isActive: restaurantData.isActive ?? true,
        });
      } catch (err) {
        setError(err.message);
      }
    }

    load();
  }, [section]);

  const submitRestaurant = async (event) => {
    event.preventDefault();
    try {
      const updated = await updateOwnerRestaurant(restaurantForm);
      setRestaurant(updated);
      setMessage('Restaurant details updated.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const updated = await updateOwnerProfile({ ...profile, password: profile.password || null });
      setProfile({ ...updated, password: '' });
      localStorage.setItem('userName', updated.name);
      window.dispatchEvent(new Event('auth:change'));
      setMessage('Settings updated successfully.');
      setError('');
    } catch (err) {
      setError(err.message);
      setMessage('');
    }
  };

  const submitCategory = async (event) => {
    event.preventDefault();
    try {
      await createOwnerCategory(categoryName);
      setCategoryName('');
      const nextCategories = await fetchOwnerCategories();
      setCategories(nextCategories);
      setMessage('Category added successfully.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const removeCategory = async (categoryId) => {
    try {
      await deleteOwnerCategory(categoryId);
      setCategories((items) => items.filter((category) => category.id !== categoryId));
      setMessage('Category removed.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const submitMenuItem = async (event) => {
    event.preventDefault();
    try {
      const payload = {
        ...menuForm,
        price: Number(menuForm.price),
        categoryId: Number(menuForm.categoryId),
      };
      if (editingMenuId) {
        await updateOwnerMenuItem(editingMenuId, payload);
        setMessage('Menu item updated.');
      } else {
        await createOwnerMenuItem(payload);
        setMessage('Menu item added.');
      }
      setMenuForm(emptyMenuForm);
      setEditingMenuId(null);
      setIsMenuFormOpen(false);
      const nextMenu = await fetchOwnerMenu();
      setMenuItems(nextMenu);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const editMenuItem = (item) => {
    setEditingMenuId(item.id);
    setIsMenuFormOpen(true);
    setMenuForm({
      name: item.name || '',
      description: item.description || '',
      price: item.price || '',
      foodType: item.foodType || 'Veg',
      categoryId: item.categoryId || '',
      isAvailable: item.isAvailable ?? true,
    });
  };

  const removeMenuItem = async (menuId) => {
    try {
      await deleteOwnerMenuItem(menuId);
      setMenuItems((items) => items.filter((item) => item.id !== menuId));
      setMessage('Menu item deleted.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleMenuAvailability = async (item) => {
    try {
      await updateOwnerMenuItem(item.id, { isAvailable: !item.isAvailable });
      setMenuItems((items) => items.map((menuItem) => (
        menuItem.id === item.id ? { ...menuItem, isAvailable: !item.isAvailable } : menuItem
      )));
      setMessage(`${item.name} is now ${!item.isAvailable ? 'available' : 'unavailable'}.`);
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleStatusUpdate = async (orderId, status) => {
    try {
      await updateOwnerOrderStatus(orderId, status);
      setOrders((items) => items.map((order) => order.id === orderId ? { ...order, status } : order));
      setMessage('Order status updated.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const toggleOrderDetails = (orderId) => {
    setExpandedOrderId((current) => current === orderId ? null : orderId);
  };

  const renderDashboard = () => (
    <>
      <div className="page-header">
        <h2>Owner Dashboard</h2>
        <span className="pill">Restaurant operations</span>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><h3>Restaurant</h3><p>{data.restaurantName || '—'}</p></div>
        <div className="stat-card"><h3>Total Menu Items</h3><p>{data.totalMenuItems ?? 0}</p></div>
        <div className="stat-card"><h3>Current Pending Orders</h3><p>{data.pendingOrders ?? data.currentPendingOrders ?? 0}</p></div>
        <div className="stat-card"><h3>Completed Orders</h3><p>{data.completedOrders ?? 0}</p></div>
        <div className="stat-card"><h3>Today's Orders</h3><p>{data.todaysOrders ?? 0}</p></div>
        <div className="stat-card"><h3>Total Orders</h3><p>{data.totalOrders ?? 0}</p></div>
        <div className="stat-card"><h3>Average Order Value</h3><p>₹{data.averageOrderValue ?? 0}</p></div>
        <div className="stat-card"><h3>Most Ordered Item Today</h3><p>{data.mostOrderedItemToday?.foodName || 'No orders today'}</p><small>{data.mostOrderedItemToday ? `${data.mostOrderedItemToday.count} ordered` : ''}</small></div>
        <div className="stat-card"><h3>Today's Sales</h3><p>₹{data.todaysSales ?? 0}</p></div>
        <div className="stat-card"><h3>Today's Profit</h3><p>₹{data.todaysProfit ?? 0}</p><small>Estimated at 30% margin</small></div>
        <div className="stat-card"><h3>Total Profit</h3><p>₹{data.totalProfit ?? 0}</p><small>Estimated at 30% margin</small></div>
      </div>
    </>
  );

  const renderRestaurant = () => (
    <div className="page-header-column">
      <div className="page-header">
        <h2>My Restaurant</h2>
        <span className="pill">Profile</span>
      </div>
      <div className="card owner-card">
        <form onSubmit={submitRestaurant} className="owner-form">
          <div className="field-grid">
            <label>
              Restaurant name
              <input value={restaurantForm.name} onChange={(e) => setRestaurantForm({ ...restaurantForm, name: e.target.value })} />
            </label>
            <label>
              Email
              <input value={restaurantForm.email} onChange={(e) => setRestaurantForm({ ...restaurantForm, email: e.target.value })} />
            </label>
            <label>
              Phone
              <input value={restaurantForm.phone} onChange={(e) => setRestaurantForm({ ...restaurantForm, phone: e.target.value })} />
            </label>
            <label className="full-width">
              Description
              <input value={restaurantForm.description} onChange={(e) => setRestaurantForm({ ...restaurantForm, description: e.target.value })} />
            </label>
            <label className="full-width">
              Address
              <input value={restaurantForm.address} onChange={(e) => setRestaurantForm({ ...restaurantForm, address: e.target.value })} />
            </label>
            <label>
              Opening time
              <input value={restaurantForm.openingTime} onChange={(e) => setRestaurantForm({ ...restaurantForm, openingTime: e.target.value })} />
            </label>
            <label>
              Closing time
              <input value={restaurantForm.closingTime} onChange={(e) => setRestaurantForm({ ...restaurantForm, closingTime: e.target.value })} />
            </label>
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={restaurantForm.isActive} onChange={(e) => setRestaurantForm({ ...restaurantForm, isActive: e.target.checked })} />
            Restaurant is active
          </label>
          <button type="submit">Save restaurant</button>
        </form>
      </div>
    </div>
  );

  const renderSettings = () => (
    <div className="page-header-column">
      <div className="page-header">
        <h2>Settings</h2>
        <span className="pill">Account details</span>
      </div>
      <div className="card owner-card">
        <form className="owner-form" onSubmit={saveProfile}>
          <label>Name<input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
          <label>Email<input type="email" required value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label>
          <label>Phone<input value={profile.phone || ''} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
          <label>Address<input value={profile.address || ''} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>
          <label>New password<input type="password" placeholder="Leave blank to keep current password" value={profile.password} onChange={(event) => setProfile({ ...profile, password: event.target.value })} /></label>
          <button type="submit">Save settings</button>
        </form>
      </div>
    </div>
  );

  const renderCategories = () => (
    <div className="page-header-column">
      <div className="page-header">
        <h2>Categories</h2>
        <span className="pill">Manage menu groups</span>
      </div>
      <div className="card owner-card categories-card">
        <form onSubmit={submitCategory} className="category-form">
          <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Add new category" />
          <button type="submit" className="category-submit">Add category</button>
        </form>
        <div className="category-grid">
          {categories.length === 0 ? <p className="empty-state">No categories added yet.</p> : categories.map((category) => (
            <div className="category-card" key={category.id}>
              <span className="category-name">{category.name}</span>
              <button type="button" className="danger-button" onClick={() => removeCategory(category.id)}>Delete</button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderMenu = () => (
    <div className="page-header-column">
      <div className="page-header">
        <h2>Menu</h2>
        <span className="pill">Add or update dishes</span>
      </div>
      <div className="card owner-card">
        <button
          type="button"
          className="add-menu-button"
          onClick={() => {
            setEditingMenuId(null);
            setMenuForm(emptyMenuForm);
            setIsMenuFormOpen((isOpen) => !isOpen);
          }}
        >
          {isMenuFormOpen && !editingMenuId ? 'Close menu form' : 'Add menu'}
        </button>
        {isMenuFormOpen && <form onSubmit={submitMenuItem} className="owner-form menu-form">
          <div className="field-grid">
            <label>
              Food name
              <input value={menuForm.name} onChange={(e) => setMenuForm({ ...menuForm, name: e.target.value })} />
            </label>
            <label>
              Price
              <input type="number" min="0" step="1" value={menuForm.price} onChange={(e) => setMenuForm({ ...menuForm, price: e.target.value })} />
            </label>
            <label>
              Food type
              <select value={menuForm.foodType} onChange={(e) => setMenuForm({ ...menuForm, foodType: e.target.value })}>
                <option value="Veg">Veg</option>
                <option value="NonVeg">Non-Veg</option>
              </select>
            </label>
            <label>
              Category
              <select value={menuForm.categoryId} onChange={(e) => setMenuForm({ ...menuForm, categoryId: e.target.value })}>
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>{category.name}</option>
                ))}
              </select>
            </label>
            <label>
              Description
              <input value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} />
            </label>
            <label className="menu-availability-field">
              <span>Availability</span>
              <span className="availability-toggle">
                <input
                  type="checkbox"
                  checked={menuForm.isAvailable}
                  onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })}
                />
                <span className="toggle-track" aria-hidden="true"><span /></span>
                <span>{menuForm.isAvailable ? 'Available' : 'Unavailable'}</span>
              </span>
            </label>
          </div>
          <div className="row-actions">
            <button type="submit" className="menu-submit">{editingMenuId ? 'Save menu item' : 'Add menu item'}</button>
            <button type="button" className="secondary-button menu-cancel" onClick={() => { setEditingMenuId(null); setMenuForm(emptyMenuForm); setIsMenuFormOpen(false); }}>Cancel</button>
          </div>
        </form>}
        <div className="menu-filter-controls" role="group" aria-label="Filter menu by food type">
          {['All', 'Veg', 'NonVeg'].map((filter) => (
            <button
              type="button"
              key={filter}
              className={`menu-filter-button ${menuFilter === filter ? 'active' : ''}`}
              onClick={() => setMenuFilter(filter)}
            >
              {filter === 'NonVeg' ? 'Non-Veg' : filter}
            </button>
          ))}
        </div>
        <div className="owner-menu-grid">
          {menuItems.filter((item) => menuFilter === 'All' || item.foodType === menuFilter).length === 0 ? <p className="empty-state">No {menuFilter === 'All' ? '' : `${menuFilter === 'NonVeg' ? 'non-veg' : 'veg'} `}menu items found.</p> : menuItems.filter((item) => menuFilter === 'All' || item.foodType === menuFilter).map((item) => (
            <div className="owner-menu-card" key={item.id}>
              <div>
                <div className="owner-menu-card-heading">
                  <strong>{item.name}</strong>
                  <span className={`food-type-badge ${item.foodType === 'Veg' ? 'veg' : 'non-veg'}`}>
                    {item.foodType === 'NonVeg' ? 'Non-Veg' : item.foodType}
                  </span>
                </div>
                <small className="owner-menu-price">₹{item.price}</small>
              </div>
              <div className="row-actions">
                <button type="button" className="secondary-button" onClick={() => editMenuItem(item)}>Edit</button>
                <button type="button" className="danger-button" onClick={() => removeMenuItem(item.id)}>Delete</button>
                <label className="availability-toggle" title="Toggle availability">
                  <input
                    type="checkbox"
                    checked={item.isAvailable}
                    onChange={() => toggleMenuAvailability(item)}
                  />
                  <span className="toggle-track" aria-hidden="true"><span /></span>
                  <span className="visually-hidden">{item.isAvailable ? 'Available' : 'Unavailable'}</span>
                </label>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderOrders = () => (
    <div className="page-header-column">
      <div className="page-header">
        <h2>Orders</h2>
        <span className="pill">Track customer orders</span>
      </div>
      <div className="card owner-card">
        <div className="owner-orders-grid">
          {orders.length === 0 ? <p className="empty-state">No orders yet.</p> : orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-top">
                <div>
                  <strong>Order #{order.id}</strong>
                  <small>{order.customer?.name || 'Customer'} · {order.deliveryAddress}</small>
                </div>
                <strong>₹{order.totalAmount}</strong>
              </div>
              <div className="order-card-bottom">
                <span className="order-status" data-status={order.status}>{order.status}</span>
                <select value={order.status} onChange={(e) => handleStatusUpdate(order.id, e.target.value)}>
                  <option value="Placed">Placed</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
              <button
                type="button"
                className="secondary-button order-details-button"
                onClick={() => toggleOrderDetails(order.id)}
                aria-expanded={expandedOrderId === order.id}
              >
                {expandedOrderId === order.id ? 'Hide details' : 'Show details'}
              </button>
              {expandedOrderId === order.id && (
                <div className="order-details">
                  <div className="order-detail-meta">
                    <div>
                      <strong>Customer details</strong>
                      <small>{order.customer?.name || 'Not available'}</small>
                      <small>{order.customer?.email || 'No email provided'}</small>
                      <small>{order.customer?.phone || 'No phone provided'}</small>
                    </div>
                    <div>
                      <strong>Delivery address</strong>
                      <small>{order.deliveryAddress || 'Not provided'}</small>
                    </div>
                  </div>
                  <div className="order-detail-meta">
                    <span>Payment mode: {order.payment?.paymentMethod || 'Not available'}</span>
                  </div>
                  {order.items?.map((item) => (
                    <div className="list-row" key={item.id}>
                      <span>{item.foodName} x {item.quantity}</span>
                      <strong>₹{item.subtotal}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="page">
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      {section === '/owner/restaurant' && renderRestaurant()}
      {section === '/owner/settings' && renderSettings()}
      {section === '/owner/categories' && renderCategories()}
      {section === '/owner/menu' && renderMenu()}
      {section === '/owner/orders' && renderOrders()}
      {section === '/owner/dashboard' && renderDashboard()}
    </div>
  );
}
