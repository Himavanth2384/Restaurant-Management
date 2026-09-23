import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/api';

export default function LoginPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    const role = localStorage.getItem('role');

    if (token) {
      if (role === 'SuperAdmin') navigate('/admin/dashboard', { replace: true });
      else if (role === 'RestaurantOwner') navigate('/owner/dashboard', { replace: true });
      else navigate('/restaurants', { replace: true });
    }
  }, [navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    // Call the loginUser function to authenticate the user
    try {
      const data = await loginUser(form.email, form.password);
      localStorage.setItem('token', data.token); // Store the JWT token in localStorage
      localStorage.setItem('role', data.role); // Store the user's role in localStorage
      localStorage.setItem('userName', data.name); // Store the user's name in localStorage
      window.dispatchEvent(new Event('auth:change')); // Notify other parts of the app about the authentication status
      
      // Role-based navigation after successful login
      if (data.role === 'SuperAdmin') navigate('/admin/dashboard', { replace: true });
      else if (data.role === 'RestaurantOwner') navigate('/owner/dashboard', { replace: true });
      else navigate('/restaurants', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page auth-shell">
      <div className="card form-card auth-card">
        <div className="auth-card-header">
          <h1>Restaurant Management System</h1>
          <span className="badge">Welcome back</span>
          <h2>Sign in</h2>
        </div>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Email</label>
          <input placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <label>Password</label>
          <input placeholder="Enter your password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

          <button type="submit">Login</button>
        </form>

        <p className="auth-footer-text">
          Don’t have an account?{' '}
          <button type="button" className="link-button" onClick={() => navigate('/register')}>Create account</button>
        </p>
      </div>
    </div>
  );
}
