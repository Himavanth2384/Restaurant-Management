import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import './App.css';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import OwnerDashboardPage from './pages/OwnerDashboardPage';
import CustomerRestaurantsPage from './pages/CustomerRestaurantsPage';
import OrdersPage from './pages/OrdersPage';

function getSessionState() {
  const token = localStorage.getItem('token');
  const role = localStorage.getItem('role');

  return {
    isLoggedIn: Boolean(token),
    role: role || null,
  };
}

function getNavItems(role) {
  if (role === 'SuperAdmin') {
    return [
      { label: 'Dashboard', path: '/admin/dashboard', icon: '▣' },
      { label: 'Restaurants', path: '/admin/dashboard', icon: '⌂' },
      { label: 'Owners', path: '/admin/dashboard', icon: '👥' },
      { label: 'Users', path: '/admin/dashboard', icon: '◎' },
      { label: 'Orders', path: '/admin/dashboard', icon: '◫' },
      { label: 'Settings', path: '/admin/dashboard', icon: '⚙' },
    ];
  }

  if (role === 'RestaurantOwner') {
    return [
      { label: 'Dashboard', path: '/owner/dashboard', icon: '▣' },
      { label: 'Categories', path: '/owner/categories', icon: '☰' },
      { label: 'Menu', path: '/owner/menu', icon: '☼' },
      { label: 'Orders', path: '/owner/orders', icon: '◫' },
      { label: 'Customers', path: '/owner/dashboard', icon: '👥' },
      { label: 'Offers', path: '/owner/dashboard', icon: '✦' },
      { label: 'Settings', path: '/owner/restaurant', icon: '⚙' },
    ];
  }

  if (role === 'User') {
    return [
      { label: 'Home', path: '/restaurants', icon: '⌂' },
      { label: 'Restaurants', path: '/restaurants', icon: '☰' },
      { label: 'Menu', path: '/restaurants', icon: '☼' },
      { label: 'Cart', path: '/restaurants', icon: '◫' },
      { label: 'My Orders', path: '/orders', icon: '✓' },
      { label: 'Favorites', path: '/restaurants', icon: '★' },
      { label: 'Reviews', path: '/restaurants', icon: '✎' },
      { label: 'Profile', path: '/restaurants', icon: '◎' },
    ];
  }

  return [
    { label: 'Login', path: '/login', icon: '→' },
    { label: 'Register', path: '/register', icon: '+' },
  ];
}

function Layout() {
  const [session, setSession] = useState(getSessionState);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const syncSession = () => setSession(getSessionState());
    syncSession();

    window.addEventListener('auth:change', syncSession);
    return () => window.removeEventListener('auth:change', syncSession);
  }, []);

  const { role, isLoggedIn } = session;
  const navItems = useMemo(() => getNavItems(role), [role]);
  const isAuthRoute = location.pathname === '/login' || location.pathname === '/register';

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('role');
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
      <Route path="/admin/dashboard" element={isLoggedIn && role === 'SuperAdmin' ? <AdminDashboardPage /> : <Navigate to="/login" replace />} />
      <Route path="/owner/dashboard" element={isLoggedIn && role === 'RestaurantOwner' ? <OwnerDashboardPage /> : <Navigate to="/login" replace />} />
      <Route path="/owner/restaurant" element={isLoggedIn && role === 'RestaurantOwner' ? <OwnerDashboardPage /> : <Navigate to="/login" replace />} />
      <Route path="/owner/categories" element={isLoggedIn && role === 'RestaurantOwner' ? <OwnerDashboardPage /> : <Navigate to="/login" replace />} />
      <Route path="/owner/menu" element={isLoggedIn && role === 'RestaurantOwner' ? <OwnerDashboardPage /> : <Navigate to="/login" replace />} />
      <Route path="/owner/orders" element={isLoggedIn && role === 'RestaurantOwner' ? <OwnerDashboardPage /> : <Navigate to="/login" replace />} />
      <Route path="/restaurants" element={isLoggedIn && role === 'User' ? <CustomerRestaurantsPage /> : <Navigate to="/login" replace />} />
      <Route path="/restaurants/:restaurantId" element={isLoggedIn && role === 'User' ? <CustomerRestaurantsPage /> : <Navigate to="/login" replace />} />
      <Route path="/orders" element={isLoggedIn && role === 'User' ? <OrdersPage /> : <Navigate to="/login" replace />} />
      <Route path="*" element={<Navigate to={homeRedirect} replace />} />
    </Routes>
  );

  if (isAuthRoute) {
    return (
      <div className="auth-viewport">
        <div className="auth-glow auth-glow-one" />
        <div className="auth-glow auth-glow-two" />
        <div className="auth-screen">{routes}</div>
      </div>
    );
  }

  return (
    <div className="app-shell">
      <aside className={`sidebar ${sidebarOpen ? 'open' : 'collapsed'}`}>
        <div className="sidebar-header">
          <div className="brand-mark">RMS</div>
          <div className="brand-copy">
            <span>Restaurant</span>
            <strong>Management</strong>
          </div>
          <button type="button" className="sidebar-toggle" onClick={() => setSidebarOpen((value) => !value)}>
            {sidebarOpen ? '⟨' : '⟩'}
          </button>
        </div>

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
              <span className="user-avatar">{role?.slice(0, 1) || 'U'}</span>
              <div className="user-meta">
                <strong>{role === 'SuperAdmin' ? 'Admin' : role === 'RestaurantOwner' ? 'Owner' : 'Customer'}</strong>
                <small>{role === 'User' ? 'Member' : role}</small>
              </div>
            </div>
            <button type="button" className="logout-button" onClick={logout}>Logout</button>
          </div>
        )}
      </aside>

      <div className="main-panel">
        <header className="topbar">
          <div>
            <p className="topbar-label">Operations</p>
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
