import React, { useState } from 'react';
import { AuthAPI } from '../api';

const RegisterPage = () => {
  const [full_name, setFull_name] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (password !== confirm) {
      setError('Mật khẩu không khớp');
      return;
    }
    setLoading(true); setError('');
    if (!full_name.trim() || !username.trim()) {
      setError('Vui lòng nhập Họ và Tên và Username');
      setLoading(false);
      return;
    }
    try {
      await AuthAPI.register({ username: username.trim(), email, password, full_name: full_name.trim() });
      window.location.href = '/login';
    } catch (e) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="auth-wrapper">
      <div className="auth-card">
        <div className="auth-logo">✶</div>
  <h1 className="auth-title">FOOD VIETNAM</h1>
  <p className="auth-subtitle">Đặc sản Việt Nam</p>
        <form onSubmit={handleSubmit} className="auth-form">
          <label className="auth-field">
            <span>Họ và Tên</span>
            <input
              type="text"
              value={full_name}
              onChange={e => setFull_name(e.target.value)}
              required
              placeholder="Nguyễn Văn A"
            />
          </label>
          <label className="auth-field">
            <span>Tên đăng nhập</span>
            <input
              type="text"
              value={username}
              onChange={e => setUsername(e.target.value)}
              required
              placeholder="ten_dang_nhap"
            />
          </label>
          <label className="auth-field">
            <span>Email</span>
            <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="you@example.com" />
          </label>
          <label className="auth-field">
            <span>Mật khẩu</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mật khẩu" />
          </label>
          <label className="auth-field">
            <span>Xác nhận mật khẩu</span>
            <input type="password" value={confirm} onChange={e => setConfirm(e.target.value)} required placeholder="Nhập lại mật khẩu" />
          </label>
          {error && <div className="auth-error">{error}</div>}
          <button type="submit" className="primary-btn" disabled={loading}>
            {loading ? 'Đang tạo...' : 'Tạo tài khoản'}
          </button>
        </form>
  <div className="divider">ĐÃ CÓ TÀI KHOẢN?</div>
        <div className="oauth-row single">
          <a href="/login" className="oauth-btn github">Đến trang đăng nhập</a>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
