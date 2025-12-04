import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Home, Utensils, HardDrive, Users } from 'lucide-react';
import { AuthAPI } from '../api/auth';

const Sidebar = ({ isCollapsed = false }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    try {
      AuthAPI.logout();
    } catch (e) {
      // Optional: log error; logout is mostly client-side
      console.error('Logout error', e);
    }
    navigate('/login');
  };

  return (
    <div className={`sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      <div className="sidebar-header">
        <div className="logo">
          <div className="logo-icon">A</div>
          <span className="logo-text">Adminator</span>
        </div>
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-item">
          <NavLink
            to="/dashboard"
            className={({ isActive }) => 
              `nav-button ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-button-content">
              <Home size={20} />
              <span>Trang chủ</span>
            </div>
          </NavLink>
        </div>
        
        <div className="nav-item">
          <NavLink
            to="/charts"
            className={({ isActive }) => 
              `nav-button ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-button-content">
              <BarChart3 size={20} />
              <span>Thống kê</span>
            </div>
          </NavLink>
        </div>
        
        <div className="nav-item">
          <NavLink
            to="/food-management"
            className={({ isActive }) => 
              `nav-button ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-button-content">
              <Utensils size={20} />
              <span>Quản lý món ăn</span>
            </div>
          </NavLink>
        </div>
        
        <div className="nav-item">
          <NavLink
            to="/dataset"
            className={({ isActive }) => 
              `nav-button ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-button-content">
              <HardDrive size={20} />
              <span>Bộ dữ liệu</span>
            </div>
          </NavLink>
        </div>

        <div className="nav-item">
          <NavLink
            to="/user-management"
            className={({ isActive }) => 
              `nav-button ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-button-content">
              <Users size={20} />
              <span>Quản lý người dùng</span>
            </div>
          </NavLink>
        </div>

        <div className="nav-item">
          <button
            type="button"
            onClick={handleLogout}
            className="nav-button logout-button"
          >
            <div className="nav-button-content">
              {/* Reuse HardDrive icon or choose a better one later */}
              <HardDrive size={20} />
              <span>Đăng xuất</span>
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;