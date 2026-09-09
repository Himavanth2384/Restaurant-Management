import { useEffect, useState } from 'react';
import { fetchOrderDetail, fetchOrders } from '../services/api';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [expandedOrderId, setExpandedOrderId] = useState(null);
  const [orderDetails, setOrderDetails] = useState({});
  const [loadingOrderId, setLoadingOrderId] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOrders().then(setOrders).catch((err) => setError(err.message));
  }, []);

  const toggleOrderDetails = async (orderId) => {
    if (expandedOrderId === orderId) {
      setExpandedOrderId(null);
      return;
    }

    setExpandedOrderId(orderId);
    if (orderDetails[orderId]) return;

    setLoadingOrderId(orderId);
    try {
      const detail = await fetchOrderDetail(orderId);
      setOrderDetails((current) => ({ ...current, [orderId]: detail }));
      setError('');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoadingOrderId(null);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h2>My Orders</h2>
        <span className="pill">Recent activity</span>
      </div>
      {error && <p className="error">{error}</p>}
      <div className="card owner-card order-card-grid">
        {orders.length === 0 ? <p className="empty-state">No orders yet.</p> : orders.map((order) => (
          <div key={order.id} className="order-card">
            <div className="order-card-top">
              <div>
                <strong>Order number: #{order.id}</strong>
                <small>{order.restaurant?.name || 'Restaurant'}</small>
              </div>
              <strong>₹{order.totalAmount}</strong>
            </div>
            <div className="order-card-bottom">
              <span className="order-status" data-status={order.status}>{order.status}</span>
              <small>Payment: {order.payment?.paymentMethod || 'Not available'}</small>
              <small>{new Date(order.createdAt).toLocaleString()}</small>
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
                {loadingOrderId === order.id && <p className="empty-state">Loading order details...</p>}
                {orderDetails[order.id] && <>
                  <div className="order-detail-meta">
                    <span>Delivery address: {orderDetails[order.id].deliveryAddress}</span>
                    <span className="order-status" data-status={orderDetails[order.id].status}>Status: {orderDetails[order.id].status}</span>
                  </div>
                  <div className="order-detail-meta">
                    <span>Payment method: {orderDetails[order.id].payment?.paymentMethod || 'Not available'}</span>
                  </div>
                  {orderDetails[order.id].items?.map((item) => (
                    <div className="list-row" key={item.id}>
                      <span>{item.foodName} x {item.quantity}</span>
                      <strong>₹{item.subtotal}</strong>
                    </div>
                  ))}
                </>}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
