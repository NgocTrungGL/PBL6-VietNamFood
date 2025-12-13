import { Bell, Menu, Sun, Moon } from 'lucide-react';
import { AuthAPI } from '../api/auth';

const Header = ({ isDark, toggleTheme, onMenuClick }) => {
  const currentUser = AuthAPI.currentUser();

  const getInitials = (full_name) => {
    if (!full_name) return 'N';
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
      </div>
      
      <div className="header-right">
        <div className="notification-container">
          <Bell size={18} />
          <span className="notification-badge">3</span>
        </div>
        
        <div className="user-info">
          <div className="user-avatar">
            {getInitials(currentUser?.full_name)}
          </div>
          <span className="user-name">{currentUser?.full_name || 'Nhật Phan'}</span>
        </div>
      </div>
    </header>
  );
};

export default Header;