import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboard from './pages/AdminDashboard';
import OwnerDashboard from './pages/OwnerDashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import OrdersPage from './pages/OrdersPage';
import SettingsPage from './pages/SettingsPage';
import AnalyticsPage from './pages/AnalyticsPage';
import AdminAnalyticsPage from './pages/AdminAnalyticsPage';
import { fetchMe } from './services/api';

function getSessionState() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');
  const name = localStorage.getItem('userName');

  return {
    isLoggedIn: Boolean(token),
    role: role || null,
    name: name || null,
  };
}

function getNavItems(role) {
  if (role === 'SuperAdmin') {
    return [
      { label: 'Dashboard', path: '/admin/dashboard#dashboard', icon: '🖼️' },
      { label: 'Restaurants', path: '/admin/dashboard#restaurants', icon: '🍽️' },
      { label: 'Owners', path: '/admin/dashboard#owners', icon: '🤵' },
      { label: 'Users', path: '/admin/dashboard#users', icon: '◎' },
      { label: 'Orders', path: '/admin/dashboard#orders', icon: '📄' },
      { label: 'Analytics', path: '/admin/analytics', icon: '📊' },
      { label: 'Settings', path: '/admin/dashboard#settings', icon: '⚙' },
    ];
  }

  if (role === 'RestaurantOwner') {
    return [
      { label: 'Dashboard', path: '/owner/dashboard', icon: '🖼️' },
      { label: 'Categories', path: '/owner/categories', icon: '☰' },
      { label: 'Menu', path: '/owner/menu', icon: '📃' },
      { label: 'Orders', path: '/owner/orders', icon: '📄' },
      { label: 'Analytics', path: '/owner/analytics', icon: '📊' },
      { label: 'My Restaurant', path: '/owner/restaurant', icon: '🏠' },
      { label: 'Settings', path: '/owner/settings', icon: '⚙' },
    ];
  }

  if (role === 'User') {
    return [
      { label: 'Home', path: '/restaurants#home', icon: '🏠' },
      { label: 'Restaurants', path: '/restaurants#restaurants', icon: '🍽️' },
      { label: 'Cart', path: '/cart', icon: '🛒' },
      { label: 'My Orders', path: '/orders', icon: '📄' },
      { label: 'Settings', path: '/settings', icon: '⚙' },
    ];
  }

  return [
    { label: 'Login', path: '/login', icon: '→' },
    { label: 'Register', path: '/register', icon: '+' },
  ];
}

function Layout() {
  const [session, setSession] = useState(getSessionState);
  const location = useLocation();

  useEffect(() => {
    const syncSession = () => setSession(getSessionState());
    syncSession();

    if (localStorage.getItem('token') && !localStorage.getItem('userName')) {
      fetchMe().then((user) => {
        localStorage.setItem('userName', user.name);
        setSession(getSessionState());
      }).catch(() => {});
    }

    window.addEventListener('auth:change', syncSession);
    return () => window.removeEventListener('auth:change', syncSession);
  }, []);

  const { role, name, isLoggedIn } = session;
  const navItems = useMemo(() => getNavItems(role), [role]);
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('userName');
    window.dispatchEvent(new Event('auth:change'));
    window.location.href = '/login';
  };

  const heroTitle = isLoggedIn
    ? role === 'SuperAdmin'
      ? 'Restaurant Management System'
      : role === 'RestaurantOwner'
        ? 'Restaurant Management System'
        : 'Restaurant Management System'
    : 'Restaurant Management System';

  const heroText = isLoggedIn
    ? role === 'SuperAdmin'
      ? 'Monitor restaurants, approvals, orders, and revenue from one clean dashboard.'
      : role === 'RestaurantOwner'
        ? 'Manage menu items, categories, and guest orders without clutter.'
        : 'Browse restaurants, place orders, and track your activity in one place.'
    : 'A simple full-stack app for managing restaurants, menu items, orders, and users.';

  const homeRedirect = isLoggedIn
    ? role === 'SuperAdmin'
      ? '/admin/dashboard'
      : role === 'RestaurantOwner'
        ? '/owner/dashboard'
        : '/restaurants'
    : '/login';

  const routes = (
    <Routes>
      <Route path="/" element={<Navigate to={homeRedirect} replace />} />
      <Route path="/login" element={isLoggedIn ? <Navigate to={homeRedirect} replace /> : <LoginPage />} />
      <Route path="/register" element={isLoggedIn ? <Navigate to={homeRedirect} replace /> : <RegisterPage />} />
      <Route path="/admin/dashboard" element={isLoggedIn && role === 'SuperAdmin' ? <AdminDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/admin/analytics" element={isLoggedIn && role === 'SuperAdmin' ? <AdminAnalyticsPage /> : <Navigate to="/login" replace />} />
      <Route path="/owner/dashboard" element={isLoggedIn && role === 'RestaurantOwner' ? <OwnerDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/owner/restaurant" element={isLoggedIn && role === 'RestaurantOwner' ? <OwnerDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/owner/categories" element={isLoggedIn && role === 'RestaurantOwner' ? <OwnerDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/owner/menu" element={isLoggedIn && role === 'RestaurantOwner' ? <OwnerDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/owner/orders" element={isLoggedIn && role === 'RestaurantOwner' ? <OwnerDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/owner/analytics" element={isLoggedIn && role === 'RestaurantOwner' ? <AnalyticsPage /> : <Navigate to="/login" replace />} />
      <Route path="/owner/settings" element={isLoggedIn && role === 'RestaurantOwner' ? <OwnerDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/restaurants" element={isLoggedIn && role === 'User' ? <CustomerDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/restaurants/:restaurantId" element={isLoggedIn && role === 'User' ? <CustomerDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/cart" element={isLoggedIn && role === 'User' ? <CustomerDashboard /> : <Navigate to="/login" replace />} />
      <Route path="/orders" element={isLoggedIn && role === 'User' ? <OrdersPage /> : <Navigate to="/login" replace />} />
      <Route path="/settings" element={isLoggedIn && role === 'User' ? <SettingsPage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={homeRedirect} replace />} />
    </Routes>
  );

  if (isAuthRoute) {
    return (
      <div className="auth-viewport">
        <div className="auth-screen">{routes}</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <h1 className="sidebar-heading">Restaurant Management System</h1>
        <nav className="sidebar-nav">
          {navItems.map((item) => (
            <Link key={item.label} to={item.path} className="sidebar-link">
              <span className="sidebar-icon">{item.icon}</span>
              <span className="sidebar-label">{item.label}</span>
            </Link>
          ))}
        </nav>

        {isLoggedIn && (
          <div className="sidebar-footer">
            <div className="user-badge">
              <div className="user-meta">
                <strong>{role === 'SuperAdmin' ? 'Admin' : role === 'RestaurantOwner' ? 'Restaurant Owner' : 'Customer'}</strong>
                <p>{name || 'User'}</p>
              </div>
            </div>
            <button type="button" className="logout-button" onClick={logout}>Logout</button>
          </div>
        )}
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div>
            <h2>{isLoggedIn ? 'Restaurant Management System' : 'Restaurant Management System'}</h2>
          </div>
          {!isLoggedIn && (
            <div className="quick-actions">
              <Link to="/login" className="topbar-action">Login</Link>
              <Link to="/register" className="topbar-action primary">Register</Link>
            </div>
          )}
        </header>

        <main className="content-area">
          {routes}
        </main>
      </div>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout />
    </BrowserRouter>
  );
}
