import { useEffect, useState } from 'react';
import { fetchCustomerProfile, updateCustomerProfile } from '../services/api';

export default function SettingsPage() {
  const [profile, setProfile] = useState({ name: '', email: '', phone: '', address: '', password: '' });
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    fetchCustomerProfile()
      .then((data) => setProfile({ ...data, password: '' }))
      .catch((err) => setError(err.message));
  }, []);

  const saveProfile = async (event) => {
    event.preventDefault();
    try {
      const updated = await updateCustomerProfile({ ...profile, password: profile.password || null });
      setProfile({ ...updated, password: '' });
      setMessage('Settings updated successfully.');
      setError('');
    } catch (err) {
      setError(err.message);
      setMessage('');
    }
  };

  return (
    <div className="page">
      {message && <p className="success">{message}</p>}
      {error && <p className="error">{error}</p>}
      <div className="page-header">
        <h2>Settings</h2>
        <span className="pill">Account details</span>
      </div>
      <div className="card owner-card">
        <form className="owner-form" onSubmit={saveProfile}>
          <label>Name<input required value={profile.name} onChange={(event) => setProfile({ ...profile, name: event.target.value })} /></label>
          <label>Email<input type="email" required value={profile.email} onChange={(event) => setProfile({ ...profile, email: event.target.value })} /></label>
          <label>Phone<input value={profile.phone || ''} onChange={(event) => setProfile({ ...profile, phone: event.target.value })} /></label>
          <label>Address<input value={profile.address || ''} onChange={(event) => setProfile({ ...profile, address: event.target.value })} /></label>
          <label>New password<input type="password" placeholder="Leave blank to keep current password" value={profile.password} onChange={(event) => setProfile({ ...profile, password: event.target.value })} /></label>
          <button type="submit">Save settings</button>
        </form>
      </div>
    </div>
  );
}
