import { useEffect, useState } from 'react';
import { fetchOwnerAnalytics } from '../services/api';

const emptyAnalytics = {
  restaurantName: '',
  last7Days: { orders: [], sales: [], totalSales: 0 },
  monthlySales: { daily: [], totalSales: 0 },
  weeklyOrders: [],
  hourlyFoodItems: [],
  topItems: { today: [], last7Days: [], last30Days: [] },
  peakOrderTime: { label: 'No orders yet', count: 0 },
};

function formatCurrency(value) {
  return `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;
}

function getMax(values) {
  return Math.max(...values, 1);
}

// BarChart component
function BarChart({ data, valueKey, valueFormatter = (value) => value, tone = 'gold' }) {
  const max = getMax(data.map((item) => Number(item[valueKey] || 0)));
  const [hoveredIndex, setHoveredIndex] = useState(null);

  return (
    <div className={`analytics-bars ${tone}`}>
      {data.map((item, index) => {
        const value = Number(item[valueKey] || 0);
        return (
          <div
            className="analytics-bar-column"
            key={item.date || item.day || item.label}
            onMouseEnter={() => setHoveredIndex(index)}
            onMouseLeave={() => setHoveredIndex(null)}
          >
            {hoveredIndex === index && <span className="chart-tooltip">{ item.day || item.label}: {valueFormatter(value)}</span>}
            <strong>{valueFormatter(value)}</strong>
            <div className="analytics-bar-track"><span style={{ height: `${(value / max) * 100}%` }} /></div>
            <small>{item.label || item.day}</small>
          </div>
        );
      })}
    </div>
  );
}

// SalesLineChart component
function SalesLineChart({ data }) {
  const width = 960;
  const height = 230;
  const padding = { top: 18, right: 16, bottom: 34, left: 16 };
  const values = data.map((item) => Number(item.total || 0));
  const max = getMax(values);
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const points = data.map((item, index) => {
    const x = padding.left + (index * (width - padding.left - padding.right)) / Math.max(data.length - 1, 1);
    const y = height - padding.bottom - (Number(item.total || 0) / max) * (height - padding.top - padding.bottom);
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="sales-line-chart">
      <div className="sales-line-chart-inner">
        <svg viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Daily sales trend for the last 30 days">
          <line x1="16" y1="196" x2="944" y2="196" className="chart-axis" />
          <polyline points={points} className="sales-line" />
          {data.map((item, index) => {
            const [x, y] = points.split(' ')[index].split(',');
            return <circle key={item.date} cx={x} cy={y} r={hoveredIndex === index ? '6' : '3'} className="sales-point" onMouseEnter={() => setHoveredIndex(index)} onMouseLeave={() => setHoveredIndex(null)} />;
          })}
        </svg>
        {hoveredIndex !== null && <div className="line-chart-tooltip" style={{ left: `${(hoveredIndex / Math.max(data.length - 1, 1)) * 100}%` }}>
          {data[hoveredIndex].date}: {formatCurrency(data[hoveredIndex].total)}
        </div>}
        <div className="line-chart-labels">
          {data.map((item) => <span key={item.date}>{item.label}</span>)}
        </div>
      </div>
    </div>
  );
}

function TopItemsTable({ title, items }) {
  return (
    <div className="analytics-table-block">
      <h3>{title}</h3>
      {items.length === 0 ? <p className="empty-state">No item data yet.</p> : items.map((item, index) => (
        <div className="analytics-table-row" key={item.foodName}>
          <span><b>{index + 1}</b>{item.foodName}</span>
          <strong>{item.count}</strong>
        </div>
      ))}
    </div>
  );
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOwnerAnalytics().then(setAnalytics).catch((err) => setError(err.message));
  }, []);

  const orderMax = getMax(analytics.weeklyOrders.map((item) => item.count));

  return (
    <div className="page analytics-page">
      <div className="page-header analytics-header">
        <div>
          <p className="eyebrow">Restaurant intelligence</p>
          <h2>{analytics.restaurantName || 'Analytics'}</h2>
          <p className="analytics-subtitle">Real order and menu performance from the last 30 days.</p>
        </div>
        <div className="analytics-peak-card">
          <span>Peak ordering time</span>
          <strong>{analytics.peakOrderTime.label}</strong>
          <small>{analytics.peakOrderTime.count} orders in this hour</small>
        </div>
      </div>
      {error && <p className="error">{error}</p>}

      <div className="analytics-kpis">
        <div className="analytics-kpi"><span>7-day orders</span><strong>{analytics.last7Days.totalOrders ?? analytics.last7Days.orders.reduce((sum, item) => sum + item.count, 0)}</strong><small>Non-cancelled orders in the last 7 days</small></div>
        <div className="analytics-kpi"><span>7-day sales</span><strong>{formatCurrency(analytics.last7Days.totalSales)}</strong><small>Last seven calendar days</small></div>
        <div className="analytics-kpi"><span>30-day orders</span><strong>{analytics.monthlySales.totalOrders ?? 0}</strong><small>Non-cancelled orders in the last 30 days</small></div>
        <div className="analytics-kpi"><span>30-day sales</span><strong>{formatCurrency(analytics.monthlySales.totalSales)}</strong><small>Monthly sales total</small></div>
      </div>

      <div className="analytics-chart-grid">
        <section className="analytics-panel"> // Daily orders chart
          <div className="analytics-panel-heading"><div><p className="eyebrow">Past 7 days</p><h3>Daily orders</h3></div><span className="chart-legend orders-legend">Orders</span></div>
          <BarChart data={analytics.last7Days.orders} valueKey="count" tone="blue" />
        </section>
        <section className="analytics-panel"> // Daily sales chart
          <div className="analytics-panel-heading"><div><p className="eyebrow">Past 7 days</p><h3>Daily sales</h3></div><span className="chart-legend sales-legend">Sales</span></div>
          <BarChart data={analytics.last7Days.sales} valueKey="total" valueFormatter={formatCurrency} tone="green" />
        </section>
      </div>

      <section className="analytics-panel monthly-panel"> // Monthly sales trend chart
        <div className="analytics-panel-heading"><div><p className="eyebrow">Monthly sales analytics</p><h3>30-day sales trend</h3></div><strong className="panel-total">{formatCurrency(analytics.monthlySales.totalSales)}</strong></div>
        <SalesLineChart data={analytics.monthlySales.daily} />
      </section>

      <div className="analytics-lower-grid">
        <section className="analytics-panel"> // Weekly / Busiest Days
          <div className="analytics-panel-heading"><div><p className="eyebrow">Weekly order analytics</p><h3>Busiest days</h3></div></div>
          <div className="weekday-bars">
            {analytics.weeklyOrders.map((item) => <div className="weekday-row" key={item.day}><span>{item.day}</span><div><i style={{ width: `${(item.count / orderMax) * 100}%` }} /></div><strong>{item.count}</strong></div>)}
          </div>
        </section>
        <section className="analytics-panel"> // Hourly Food / Daypart
          <div className="analytics-panel-heading"><div><p className="eyebrow">Hourly food item analytics</p><h3>What guests order by daypart</h3></div></div>
          <div className="daypart-grid">
            {analytics.hourlyFoodItems.map((period) => <div className="daypart-card" key={period.period}><strong>{period.period}</strong>{period.items.length === 0 ? <small>No orders</small> : period.items.slice(0, 3).map((item) => <span key={item.foodName}>{item.foodName}<b>{item.count}</b></span>)}</div>)}
          </div>
        </section>
      </div>

      // Top Ordered Food Items
      <section className="analytics-panel top-items-panel">
        <div className="analytics-panel-heading"><div><p className="eyebrow">Most ordered food items</p><h3>Top performers</h3></div></div>
        <div className="top-items-grid">
          <TopItemsTable title="Today" items={analytics.topItems.today} />
          <TopItemsTable title="Last 7 days" items={analytics.topItems.last7Days} />
          <TopItemsTable title="Last 30 days" items={analytics.topItems.last30Days} />
        </div>
      </section>
    </div>
  );
}
