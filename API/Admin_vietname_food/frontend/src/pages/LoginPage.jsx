import React, { useState } from 'react';
import { AuthAPI } from '../api';

const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await AuthAPI.login({ username, password });
      window.location.href = '/';
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
            <span>Tên đăng nhập</span>
            <input type="text" value={username} onChange={e => setUsername(e.target.value)} required placeholder="tendangnhap" />
          </label>
          <label className="auth-field">
            <span>Mật khẩu</span>
            <input type="password" value={password} onChange={e => setPassword(e.target.value)} required placeholder="Mật khẩu" />
          </label>
          <div className="auth-row">
            <label className="remember">
              <input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /> Ghi nhớ phiên đăng nhập
            </label>
            <button type="button" className="link-btn">Quên mật khẩu?</button>
          </div>

          {error && <div className="auth-error">{error}</div>}

          {/* <button type="submit" name="login-btnn" className="primary-btn" disabled={loading}>
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button> */}
          <button type="submit" className="primary-btn" >
            {loading ? 'Đang đăng nhập...' : 'Đăng nhập'}
          </button>
        </form>


        <div className="auth-footer">
          {/* Removed the registration link as admin accounts are pre-assigned */}
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
