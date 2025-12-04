import { Search, Bell, Menu, Sun, Moon } from 'lucide-react';
import { useState } from 'react';
import { AuthAPI } from '../api/auth';

const Header = ({ isDark, toggleTheme, onMenuClick }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const currentUser = AuthAPI.currentUser();

  const getInitials = (full_name) => {
    if (!full_name) return 'U';
    const words = full_name.trim().split(' ');
    if (words.length === 1) return words[0].charAt(0).toUpperCase();
    return (words[0].charAt(0) + words[words.length - 1].charAt(0)).toUpperCase();
  };

  return (
    <header className="header">
      <div className="header-left">
        <button className="menu-button" onClick={onMenuClick}>
          <Menu size={20} />
        </button>
        
        <div className="search-container">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            placeholder="Search..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>
      
      <div className="header-right">
        <div className="notification-container">
          <button className="notification-button">
            <Bell size={18} />
            <span className="notification-badge">3</span>
          </button>
        </div>
        
        <div className="user-profile">
          <div className="user-avatar-initials">
            {getInitials(currentUser?.full_name)}
          </div>
          <span className="user-name">{currentUser?.full_name || 'Người dùng'}</span>
        </div>
        
        <div className="theme-toggle">
          <span className="theme-label">LIGHT</span>
          <button 
            className={`toggle-switch ${isDark ? 'dark' : 'light'}`}
            onClick={toggleTheme}
          >
            <div className="toggle-slider">
              {isDark ? <Moon size={12} /> : <Sun size={12} />}
            </div>
          </button>
          <span className="theme-label">DARK</span>
        </div>
      </div>
    </header>
  );
};

export default Header;