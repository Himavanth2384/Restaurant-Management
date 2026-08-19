import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { addCartItem, fetchCart, fetchCustomerRestaurants, fetchMenuSearch, fetchRestaurantDetail, placeOrder, removeCartItem } from '../services/api';

export default function CustomerRestaurantsPage() {
  const navigate = useNavigate();
  const { restaurantId } = useParams();
  const [restaurants, setRestaurants] = useState([]);
  const [items, setItems] = useState([]);
  const [cart, setCart] = useState({ items: [] });
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [search, setSearch] = useState('');
  const [foodType, setFoodType] = useState('All');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [orderForm, setOrderForm] = useState({ deliveryAddress: '', paymentMethod: 'Cash on Delivery' });

  const selectedRestaurantId = useMemo(() => Number(restaurantId || 0), [restaurantId]);

  useEffect(() => {
    loadRestaurants();
    loadMenu();
    loadCart();
  }, []);

  useEffect(() => {
    if (selectedRestaurantId) {
      loadRestaurant(selectedRestaurantId);
    } else {
      setSelectedRestaurant(null);
    }
  }, [selectedRestaurantId]);

  async function loadRestaurants() {
    const data = await fetchCustomerRestaurants(search);
    setRestaurants(data);
  }

  async function loadMenu() {
    const data = await fetchMenuSearch(search, foodType);
    setItems(data);
  }

  async function loadCart() {
    try {
      const data = await fetchCart();
      setCart(data || { items: [] });
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
      setMessage('Item added to cart.');
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

  return (
    <div className="page">
      <div className="page-header">
        <h2>Restaurants</h2>
        <span className="pill">Fresh picks</span>
      </div>
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <div className="card owner-card">
        <div className="search-row">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search restaurants or food" />
          <select value={foodType} onChange={(e) => setFoodType(e.target.value)}>
            <option value="All">All</option>
            <option value="Veg">Veg</option>
            <option value="NonVeg">Non-Veg</option>
          </select>
          <button type="button" onClick={() => { loadRestaurants(); loadMenu(); }}>Search</button>
        </div>
      </div>

      <div className="stats-grid restaurant-grid">
        {filteredRestaurants.map((restaurant) => (
          <button key={restaurant.id} type="button" className="card restaurant-card restaurant-click" onClick={() => navigate(`/restaurants/${restaurant.id}`)}>
            <h3>{restaurant.name}</h3>
            <p>{restaurant.description}</p>
            <p>{restaurant.address}</p>
            <span className="pill">{restaurant.status}</span>
          </button>
        ))}
      </div>

      {selectedRestaurant && (
        <div className="restaurant-detail card">
          <div className="page-header">
            <h2>{selectedRestaurant.name}</h2>
            <Link to="/restaurants" className="topbar-action">Back to all</Link>
          </div>
          <p>{selectedRestaurant.description}</p>
          <p>{selectedRestaurant.address}</p>
          <div className="stats-grid menu-grid">
            {selectedRestaurant.menuItems?.length ? selectedRestaurant.menuItems.map((item) => (
              <div key={item.id} className="card menu-card">
                <h3>{item.name}</h3>
                <p>{item.description}</p>
                <p className="price">₹{item.price}</p>
                <span className="pill">{item.foodType}</span>
                <button type="button" onClick={() => handleAddToCart(item)}>Add to cart</button>
              </div>
            )) : <p className="empty-state">No menu items available for this restaurant.</p>}
          </div>
        </div>
      )}

      {!selectedRestaurant && (
        <div className="stats-grid menu-grid">
          {items.map((item) => (
            <div key={item.id} className="card menu-card">
              <h3>{item.name}</h3>
              <p>{item.description}</p>
              <p className="price">₹{item.price}</p>
              <span className="pill">{item.foodType}</span>
              <small>{item.restaurant?.name}</small>
              <button type="button" onClick={() => handleAddToCart(item)}>Add to cart</button>
            </div>
          ))}
        </div>
      )}

      <div className="card owner-card">
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
                  <small>Qty: {item.quantity}</small>
                </div>
                <div className="row-actions">
                  <span>₹{item.quantity * item.price}</span>
                  <button type="button" className="danger-button" onClick={() => handleRemoveCartItem(item.id)}>Remove</button>
                </div>
              </div>
            ))}
          </div>
        )}

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
      </div>
    </div>
  );
}
