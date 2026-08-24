import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { addCartItem, fetchCart, fetchCustomerRestaurants, fetchOrders, fetchRestaurantDetail, placeOrder, removeCartItem } from '../services/api';
import { updateCartItem } from '../services/api';

export default function CustomerDashboard() {
  const navigate = useNavigate();
  const location = useLocation();
  const { restaurantId } = useParams();
  const [restaurants, setRestaurants] = useState([]);
  const [cart, setCart] = useState({ items: [] });
  const [orders, setOrders] = useState([]);
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [foodTypeFilter, setFoodTypeFilter] = useState('All');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [orderForm, setOrderForm] = useState({ deliveryAddress: '', paymentMethod: 'Cash on Delivery' });

  const selectedRestaurantId = useMemo(() => Number(restaurantId || 0), [restaurantId]);
  const isCartPage = location.pathname === '/cart';
  const section = location.hash.slice(1) || 'home';

  useEffect(() => {
    loadRestaurants();
    loadCart();
    loadOrders();
  }, [isCartPage]);

  useEffect(() => {
    if (selectedRestaurantId) {
      loadRestaurant(selectedRestaurantId);
    } else {
      setSelectedRestaurant(null);
    }
  }, [selectedRestaurantId]);

  useEffect(() => {
    const target = location.hash ? document.getElementById(location.hash.slice(1)) : null;
    target?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [location.hash]);

  async function loadRestaurants() {
    const data = await fetchCustomerRestaurants(search);
    setRestaurants(data);
  }

  async function loadCart() {
    try {
      const data = await fetchCart();
      setCart(data);
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadOrders() {
    try {
      setOrders(await fetchOrders());
    } catch (err) {
      setError(err.message);
    }
  }

  async function loadRestaurant(id) {
    try {
      const data = await fetchRestaurantDetail(id);
      setSelectedRestaurant(data);
    } catch (err) {
      setError(err.message);
    }
  }

  const handleAddToCart = async (menuItem) => {
    try {
      if (!selectedRestaurant && !menuItem.restaurantId) {
        throw new Error('Select a restaurant first.');
      }
      const restaurantId = selectedRestaurant?.id || menuItem.restaurantId;
      await addCartItem({ restaurantId, menuItemId: menuItem.id, quantity: 1 });
      await loadCart();
      setMessage(`${menuItem.name} added to cart.`);
      setError('');
    } catch (err) {
      setError(err.message);
      setMessage('');
    }
  };

  const handleRemoveCartItem = async (itemId) => {
    try {
      await removeCartItem(itemId);
      await loadCart();
      setMessage('Cart updated.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handleQuantityChange = async (itemId, quantity) => {
    if (quantity < 1) return;
    try {
      await updateCartItem(itemId, quantity);
      await loadCart();
      setMessage('Cart updated.');
      setError('');
    } catch (err) {
      setError(err.message);
    }
  };

  const handlePlaceOrder = async () => {
    try {
      if (!cart.items || cart.items.length === 0) {
        throw new Error('Add menu items to the cart before ordering.');
      }
      await placeOrder({
        deliveryAddress: orderForm.deliveryAddress || 'Home delivery',
        paymentMethod: orderForm.paymentMethod,
      });
      setOrderForm({ deliveryAddress: '', paymentMethod: 'Cash on Delivery' });
      await loadCart();
      setMessage('Order placed successfully.');
      setError('');
      navigate('/orders');
    } catch (err) {
      setError(err.message);
    }
  };

  const filteredRestaurants = selectedRestaurant ? [selectedRestaurant] : restaurants;
  const showRestaurants = !isCartPage && !selectedRestaurant;
  const showMenu = !isCartPage && Boolean(selectedRestaurant);
  const showHomeOrders = !isCartPage && !selectedRestaurant && section === 'home';
  const totalCartItems = (cart.items || []).reduce((total, item) => total + item.quantity, 0);
  const totalCartAmount = (cart.items || []).reduce((total, item) => total + item.quantity * item.price, 0);
  const filteredMenuItems = selectedRestaurant?.menuItems?.filter((item) => foodTypeFilter === 'All' || item.foodType === foodTypeFilter) || [];

  return (
    <div className="page">
      <div className="page-header">
        <h2>{isCartPage ? 'Cart' : selectedRestaurant ? selectedRestaurant.name : section === 'home' ? 'Home' : 'Restaurants'}</h2>
      </div>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      {!isCartPage && !selectedRestaurant && <div className="card owner-card">
        <div className="search-row">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search restaurants or food" />
          <button type="button" onClick={loadRestaurants}>Search</button>
        </div>
      </div>}

      {showRestaurants && <div className="stats-grid restaurant-grid" id="restaurants">
        {filteredRestaurants.map((restaurant) => (
          <button key={restaurant.id} type="button" className="card restaurant-card restaurant-click" onClick={() => navigate(`/restaurants/${restaurant.id}`)}>
            <h3>{restaurant.name}</h3>
            <p>{restaurant.description}</p>
            <p>{'Location: ' +restaurant.address}</p>
            <span className="pill">{restaurant.isActive ? 'Open' : 'Closed'}</span>
          </button>
        ))}
      </div>}

      {showHomeOrders && <div className="card owner-card">
        <div className="page-header">
          <h2>Recent orders</h2>
          <Link to="/orders" className="topbar-action">View all</Link>
        </div>
        {orders.length === 0 ? <p className="empty-state">No orders yet.</p> : orders.slice(0, 3).map((order) => (
          <div className="list-row" key={order.id}>
            <div><strong>Order #{order.id}</strong><small>{order.restaurant?.name || 'Restaurant'} · {new Date(order.createdAt).toLocaleString()}</small></div>
            <span className="pill">{order.status}</span>
            <strong>₹{order.totalAmount}</strong>
          </div>
        ))}
      </div>}

      {showMenu && (
        <div className="restaurant-detail card">
          <div className="page-header">
            <h2>{selectedRestaurant.name}</h2>
            <Link to="/restaurants" className="topbar-action">Back</Link>
          </div>
          <p>{selectedRestaurant.description}</p>
          <p>{selectedRestaurant.address}</p>
          <div className="menu-filter-row">
            <label htmlFor="food-type-filter">Filter menu</label>
            <select id="food-type-filter" value={foodTypeFilter} onChange={(e) => setFoodTypeFilter(e.target.value)}>
              <option value="All">All</option>
              <option value="Veg">Veg</option>
              <option value="NonVeg">Non-Veg</option>
            </select>
          </div>
          <div className="stats-grid menu-grid" id="menu">
            {filteredMenuItems.length ? filteredMenuItems.map((item) => (
              <div key={item.id} className="card menu-card">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <p className="price">₹{item.price}</p>
                <span className="pill">{item.foodType}</span>
                <button type="button" disabled={!item.isAvailable} onClick={() => handleAddToCart(item)}>{item.isAvailable ? 'Add to cart' : 'Unavailable'}</button>
              </div>
            )) : <p className="empty-state">No {foodTypeFilter === 'All' ? '' : `${foodTypeFilter === 'NonVeg' ? 'non-veg' : 'veg'} `}menu items available for this restaurant.</p>}
          </div>
        </div>
      )}

      {(isCartPage || section === 'cart') && <div className="card owner-card" id="cart">
        <div className="page-header">
          <h2>Cart</h2>
          <span className="pill">{cart.items?.length || 0} items</span>
        </div>
        {(!cart.items || cart.items.length === 0) ? <p className="empty-state">Your cart is empty.</p> : (
          <div className="list-stack">
            {cart.items.map((item) => (
              <div key={item.id} className="list-row">
                <div>
                  <strong>{item.menuItem?.name}</strong>
                  <div className="row-actions">
                    <button type="button" onClick={() => handleQuantityChange(item.id, item.quantity - 1)} disabled={item.quantity <= 1}>-</button>
                    <span>Qty: {item.quantity}</span>
                    <button type="button" onClick={() => handleQuantityChange(item.id, item.quantity + 1)}>+</button>
                  </div>
                </div>
                <div className="row-actions">
                  <span>₹{item.quantity * item.price}</span>
                  <button type="button" className="danger-button" onClick={() => handleRemoveCartItem(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="stats-grid cart-summary">
          <div className="stat-card"><h3>Number of items</h3><p>{totalCartItems}</p></div>
          <div className="stat-card"><h3>Total</h3><p>₹{totalCartAmount.toFixed(2)}</p></div>
        </div>

        <div className="field-grid order-grid">
          <label>
            Delivery address
            <input value={orderForm.deliveryAddress} onChange={(e) => setOrderForm({ ...orderForm, deliveryAddress: e.target.value })} />
          </label>
          <label>
            Payment method
            <select value={orderForm.paymentMethod} onChange={(e) => setOrderForm({ ...orderForm, paymentMethod: e.target.value })}>
              <option value="Cash on Delivery">Cash on Delivery</option>
              <option value="UPI">UPI</option>
              <option value="Card">Card</option>
            </select>
          </label>
        </div>
        <button type="button" onClick={handlePlaceOrder}>Place order</button>
      </div>}
    </div>
  );
}
