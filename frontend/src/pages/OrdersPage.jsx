import { useEffect, useState } from 'react';
import { fetchOrders } from '../services/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    fetchOrders().then(setOrders).catch(console.error);
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h2>My Orders</h2>
        <span className="pill">Recent activity</span>
      </div>
      <div className="card owner-card">
        {orders.length === 0 ? <p className="empty-state">No orders yet.</p> : orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-card-top">
              <div>
                <strong>Order #{order.id}</strong>
                <small>{order.restaurant?.name || 'Restaurant'}</small>
              </div>
              <strong>₹{order.totalAmount}</strong>
            </div>
            <div className="order-card-bottom">
              <span className="pill">{order.status}</span>
              <small>{new Date(order.createdAt).toLocaleString()}</small>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
