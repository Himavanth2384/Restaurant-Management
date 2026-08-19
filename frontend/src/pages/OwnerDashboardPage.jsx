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
  fetchOwnerRestaurant,
  updateOwnerMenuItem,
  updateOwnerOrderStatus,
  updateOwnerRestaurant,
} from '../services/api';

const emptyMenuForm = {
  name: '',
  description: '',
  price: '',
  foodType: 'Veg',
  categoryId: '',
  imageUrl: '',
  isAvailable: true,
};

export default function OwnerDashboardPage() {
  const location = useLocation();
  const [data, setData] = useState({});
  const [restaurant, setRestaurant] = useState(null);
  const [categories, setCategories] = useState([]);
  const [menuItems, setMenuItems] = useState([]);
  const [orders, setOrders] = useState([]);
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
    imageUrl: '',
    isActive: true,
  });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  const section = location.pathname;

  useEffect(() => {
    async function load() {
      try {
        const dashboard = await fetchOwnerDashboard();
        const restaurantData = await fetchOwnerRestaurant();
        const categoryData = await fetchOwnerCategories();
        const menuData = await fetchOwnerMenu();
        const orderData = await fetchOwnerOrders();

        setData(dashboard);
        setRestaurant(restaurantData);
        setCategories(categoryData);
        setMenuItems(menuData);
        setOrders(orderData);
        setRestaurantForm({
          name: restaurantData.name || '',
          description: restaurantData.description || '',
          address: restaurantData.address || '',
          phone: restaurantData.phone || '',
          email: restaurantData.email || '',
          openingTime: restaurantData.openingTime || '',
          closingTime: restaurantData.closingTime || '',
          imageUrl: restaurantData.imageUrl || '',
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
      await createOwnerMenuItem({
        ...menuForm,
        price: Number(menuForm.price),
        categoryId: Number(menuForm.categoryId),
      });
      setMenuForm(emptyMenuForm);
      const nextMenu = await fetchOwnerMenu();
      setMenuItems(nextMenu);
      setMessage('Menu item added.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
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

  const renderDashboard = () => (
    <>
      <div className="page-header">
        <h2>Owner Dashboard</h2>
        <span className="pill">Restaurant operations</span>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><h3>Restaurant</h3><p>{data.restaurantName || '—'}</p></div>
        <div className="stat-card"><h3>Today's Orders</h3><p>{data.todaysOrders ?? 0}</p></div>
        <div className="stat-card"><h3>Pending Orders</h3><p>{data.pendingOrders ?? 0}</p></div>
        <div className="stat-card"><h3>Completed Orders</h3><p>{data.completedOrders ?? 0}</p></div>
        <div className="stat-card"><h3>Today's Sales</h3><p>₹{data.todaysSales ?? 0}</p></div>
        <div className="stat-card"><h3>Menu Items</h3><p>{data.totalMenuItems ?? 0}</p></div>
      </div>
      <div className="card owner-card">
        <h3>Recent Orders</h3>
        {orders.length === 0 ? <p className="empty-state">No orders yet.</p> : orders.slice(0, 5).map((order) => (
          <div className="list-row" key={order.id}>
            <span>#{order.id}</span>
            <span>{order.status}</span>
            <strong>₹{order.totalAmount}</strong>
          </div>
        ))}
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
            <label>
              Image URL
              <input value={restaurantForm.imageUrl} onChange={(e) => setRestaurantForm({ ...restaurantForm, imageUrl: e.target.value })} />
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

  const renderCategories = () => (
    <div className="page-header-column">
      <div className="page-header">
        <h2>Categories</h2>
        <span className="pill">Manage menu groups</span>
      </div>
      <div className="card owner-card">
        <form onSubmit={submitCategory} className="inline-form">
          <input value={categoryName} onChange={(e) => setCategoryName(e.target.value)} placeholder="Add new category" />
          <button type="submit">Add category</button>
        </form>
        <div className="list-stack">
          {categories.length === 0 ? <p className="empty-state">No categories added yet.</p> : categories.map((category) => (
            <div className="list-row" key={category.id}>
              <span>{category.name}</span>
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
        <form onSubmit={submitMenuItem} className="owner-form">
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
            <label className="full-width">
              Description
              <input value={menuForm.description} onChange={(e) => setMenuForm({ ...menuForm, description: e.target.value })} />
            </label>
            <label className="full-width">
              Image URL
              <input value={menuForm.imageUrl} onChange={(e) => setMenuForm({ ...menuForm, imageUrl: e.target.value })} />
            </label>
          </div>
          <label className="checkbox-row">
            <input type="checkbox" checked={menuForm.isAvailable} onChange={(e) => setMenuForm({ ...menuForm, isAvailable: e.target.checked })} />
            Item is available
          </label>
          <button type="submit">Add menu item</button>
        </form>
        <div className="list-stack">
          {menuItems.length === 0 ? <p className="empty-state">No menu items added yet.</p> : menuItems.map((item) => (
            <div className="list-row menu-row" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <small>{item.foodType} • ₹{item.price}</small>
              </div>
              <div className="row-actions">
                <button type="button" className="secondary-button" onClick={() => updateOwnerMenuItem(item.id, { isAvailable: !item.isAvailable }) .then(async () => {
                  setMenuItems(await fetchOwnerMenu());
                }).catch((err) => setError(err.message))}>Toggle</button>
                <button type="button" className="danger-button" onClick={() => removeMenuItem(item.id)}>Delete</button>
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
        <div className="list-stack">
          {orders.length === 0 ? <p className="empty-state">No orders yet.</p> : orders.map((order) => (
            <div key={order.id} className="order-card">
              <div className="order-card-top">
                <div>
                  <strong>Order #{order.id}</strong>
                  <small>{order.deliveryAddress}</small>
                </div>
                <strong>₹{order.totalAmount}</strong>
              </div>
              <div className="order-card-bottom">
                <span className="pill">{order.status}</span>
                <select value={order.status} onChange={(e) => handleStatusUpdate(order.id, e.target.value)}>
                  <option value="Placed">Placed</option>
                  <option value="Accepted">Accepted</option>
                  <option value="Preparing">Preparing</option>
                  <option value="Out for Delivery">Out for Delivery</option>
                  <option value="Completed">Completed</option>
                  <option value="Cancelled">Cancelled</option>
                </select>
              </div>
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
      {section === '/owner/categories' && renderCategories()}
      {section === '/owner/menu' && renderMenu()}
      {section === '/owner/orders' && renderOrders()}
      {section === '/owner/dashboard' && renderDashboard()}
    </div>
  );
}
