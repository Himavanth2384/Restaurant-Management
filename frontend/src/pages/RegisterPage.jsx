import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { registerUser } from '../services/api';

export default function RegisterPage() {
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: '', email: '', password: '', phone: '', address: '' });
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const data = await registerUser(form);
      localStorage.setItem('token', data.token);
      localStorage.setItem('role', data.role);
      localStorage.setItem('userName', data.name);
      window.dispatchEvent(new Event('auth:change'));
      navigate('/restaurants', { replace: true });
    } catch (err) {
      setError(err.message);
    }
  };

  return (
    <div className="page auth-shell">
      <div className="card form-card auth-card">
        <div className="auth-card-header">
          <span className="badge">New account</span>
          <h2>Create account</h2>
        </div>
        {error && <p className="error">{error}</p>}
        <form onSubmit={handleSubmit} className="auth-form">
          <label>Name</label>
          <input placeholder="Your full name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />

          <label>Email</label>
          <input placeholder="you@example.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />

          <label>Password</label>
          <input placeholder="Choose a password" type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />

          <label>Phone</label>
          <input placeholder="Phone number" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />

          <label>Address</label>
          <input placeholder="Delivery address" value={form.address} onChange={(e) => setForm({ ...form, address: e.target.value })} />

          <button type="submit">Register</button>
        </form>

        <p className="auth-footer-text">
          Already have an account?{' '}
          <button type="button" className="link-button" onClick={() => navigate('/login')}>Sign in</button>
        </p>
      </div>
    </div>
  );
}
