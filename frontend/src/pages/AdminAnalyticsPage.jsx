import { useEffect, useState } from 'react';
import { fetchAdminAnalytics } from '../services/api';

const emptyData = {
  summary: {},
  restaurantComparison: [],
  weeklyRevenue: [],
  monthlyRevenue: [],
  topItems: [],
  peakOrderTime: { label: 'No orders yet', count: 0 },
};

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
const maxValue = (values) => Math.max(...values, 1);

function ComparisonBars({ data, valueKey, formatter = (value) => value, color = 'blue' }) {
  const max = maxValue(data.map((item) => Number(item[valueKey] || 0)));
  return <div className={`admin-comparison-bars ${color}`}>
    {data.map((item) => <div className="admin-comparison-bar" key={item.id || item.name}>
      <strong>{formatter(item[valueKey])}</strong>
      <div><span style={{ height: `${(Number(item[valueKey] || 0) / max) * 100}%` }} /></div>
      <small>{item.name}</small>
    </div>)}
  </div>;
}

export default function AdminAnalyticsPage() {
  const [data, setData] = useState(emptyData);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchAdminAnalytics().then(setData).catch((err) => setError(err.message));
  }, []);

  const restaurants = data.restaurantComparison;
  const weeklyTotals = restaurants.map((restaurant) => ({
    ...restaurant,
    total: data.weeklyRevenue.reduce((sum, day) => sum + (day.restaurants.find((entry) => entry.restaurantId === restaurant.id)?.total || 0), 0),
  }));
  const topRestaurant = [...restaurants].sort((first, second) => second.totalSales - first.totalSales)[0];
  const monthlyMax = maxValue(data.monthlyRevenue.map((item) => item.total));

  return <div className="page admin-analytics-page">
    <div className="page-header analytics-header">
      <div><p className="eyebrow">System intelligence</p><h2>SuperAdmin Analytics</h2><p className="analytics-subtitle">Cross-restaurant performance and customer activity.</p></div>
      <div className="analytics-peak-card"><span>Peak ordering time</span><strong>{data.peakOrderTime.label}</strong><small>{data.peakOrderTime.count} orders in this hour</small></div>
    </div>
    {error && <p className="error">{error}</p>}

    <div className="analytics-kpis admin-kpis">
      <div className="analytics-kpi"><span>Total restaurants</span><strong>{data.summary.totalRestaurants ?? 0}</strong></div>
      <div className="analytics-kpi"><span>Active restaurants</span><strong>{data.summary.activeRestaurants ?? 0}</strong></div>
      <div className="analytics-kpi"><span>Registered customers</span><strong>{data.summary.totalCustomers ?? 0}</strong></div>
      <div className="analytics-kpi"><span>Orders today</span><strong>{data.summary.todaysOrders ?? 0}</strong></div>
      <div className="analytics-kpi"><span>Revenue today</span><strong>{money(data.summary.todaysRevenue)}</strong></div>
      <div className="analytics-kpi"><span>Total orders</span><strong>{data.summary.totalOrders ?? 0}</strong></div>
      <div className="analytics-kpi"><span>Total revenue</span><strong>{money(data.summary.totalRevenue)}</strong></div>
    </div>

    <section className="analytics-panel admin-comparison-panel">
      <div className="analytics-panel-heading"><div><p className="eyebrow">Restaurant comparison</p><h3>Sales and order performance</h3></div><strong className="panel-total">Top: {topRestaurant?.name || '—'}</strong></div>
      <div className="admin-restaurant-cards">{restaurants.map((restaurant) => <div className="admin-restaurant-card" key={restaurant.id}><strong>{restaurant.name}</strong><span>Total sales <b>{money(restaurant.totalSales)}</b></span><span>Total orders <b>{restaurant.totalOrders}</b></span><span>Average order value <b>{money(restaurant.averageOrderValue)}</b></span></div>)}</div>
      <div className="admin-chart-section"><h4>Restaurant sales comparison</h4><ComparisonBars data={restaurants.map((item) => ({ ...item, name: item.name }))} valueKey="totalSales" formatter={money} color="green" /></div>
      <div className="admin-chart-section"><h4>Orders comparison</h4><ComparisonBars data={restaurants} valueKey="totalOrders" color="blue" /></div>
    </section>

    <section className="analytics-panel admin-revenue-panel">
      <div className="analytics-panel-heading"><div><p className="eyebrow">Weekly revenue comparison</p><h3>Last 7 days by restaurant</h3></div></div>
      <div className="admin-weekly-table">{data.weeklyRevenue.map((day) => <div className="admin-weekly-row" key={day.date}><strong>{day.label}<small>{day.date}</small></strong>{restaurants.map((restaurant) => <span key={restaurant.id}>{restaurant.name}<b>{money(day.restaurants.find((entry) => entry.restaurantId === restaurant.id)?.total)}</b></span>)}</div>)}</div>
    </section>

    <section className="analytics-panel admin-revenue-panel">
      <div className="analytics-panel-heading"><div><p className="eyebrow">Monthly revenue comparison</p><h3>Last 30 days total</h3></div><strong className="panel-total">{money(data.monthlyRevenue.reduce((sum, item) => sum + item.total, 0))}</strong></div>
      <div className="admin-monthly-bars">{data.monthlyRevenue.map((item) => <div title={`${item.date}: ${money(item.total)}`} key={item.date}><span style={{ height: `${(item.total / monthlyMax) * 100}%` }} /><small>{item.label}</small></div>)}</div>
    </section>

    <div className="analytics-lower-grid">
      <section className="analytics-panel"><div className="analytics-panel-heading"><div><p className="eyebrow">Most popular food items</p><h3>Across all restaurants</h3></div></div>{data.topItems.map((item, index) => <div className="analytics-table-row" key={item.foodName}><span><b>{index + 1}</b>{item.foodName}</span><strong>{item.count}</strong></div>)}</section>
      <section className="analytics-panel"><div className="analytics-panel-heading"><div><p className="eyebrow">User analytics</p><h3>Customer registrations</h3></div></div><div className="admin-user-metrics"><div><span>Last 7 days</span><strong>{data.summary.newCustomers7Days ?? 0}</strong></div><div><span>Last 30 days</span><strong>{data.summary.newCustomers30Days ?? 0}</strong></div><div><span>Total customers</span><strong>{data.summary.totalCustomers ?? 0}</strong></div></div></section>
    </div>
  </div>;
}
