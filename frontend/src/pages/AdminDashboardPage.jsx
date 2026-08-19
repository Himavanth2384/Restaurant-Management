import { useEffect, useState } from 'react';
import { fetchDashboard, fetchRestaurants } from '../services/api';

export default function AdminDashboardPage() {
  const [stats, setStats] = useState({});
  const [restaurants, setRestaurants] = useState([]);

  useEffect(() => {
    async function load() {
      try {
        const data = await fetchDashboard();
        const list = await fetchRestaurants();
        setStats(data);
        setRestaurants(list);
      } catch (err) {
        console.error(err);
      }
    }
    load();
  }, []);

  return (
    <div className="page">
      <div className="page-header">
        <h2>Admin Dashboard</h2>
        <span className="pill">System overview</span>
      </div>
      <div className="stats-grid">
        <div className="stat-card"><h3>Total Restaurants</h3><p>{stats.totalRestaurants}</p></div>
        <div className="stat-card"><h3>Pending</h3><p>{stats.pendingRestaurants}</p></div>
        <div className="stat-card"><h3>Approved</h3><p>{stats.approvedRestaurants}</p></div>
        <div className="stat-card"><h3>Total Orders</h3><p>{stats.totalOrders}</p></div>
        <div className="stat-card"><h3>Total Revenue</h3><p>{stats.totalRevenue}</p></div>
      </div>
      <div className="card">
        <h3>Restaurant list</h3>
        {restaurants.length === 0 ? <p className="empty-state">No restaurant data yet.</p> : restaurants.map((r) => (
          <div className="list-row" key={r.id}>
            <span>{r.name}</span>
            <span className="pill">{r.status}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
