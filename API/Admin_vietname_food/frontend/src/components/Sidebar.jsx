import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { BarChart3, Home, Utensils, ChefHat, HardDrive, Users, Grid3x3, MapPin, MessageSquare, LogOut } from 'lucide-react';
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
            to="/region-management"
            className={({ isActive }) => 
              `nav-button ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-button-content">
              <MapPin size={20} />
              <span>Quản lý vùng miền</span>
            </div>
          </NavLink>
        </div>

        <div className="nav-item">
          <NavLink
            to="/category-management"
            className={({ isActive }) => 
              `nav-button ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-button-content">
              <Grid3x3 size={20} />
              <span>Quản lý danh mục</span>
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
            to="/recipe-management"
            className={({ isActive }) => 
              `nav-button ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-button-content">
              <ChefHat size={20} />
              <span>Quản lý công thức</span>
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
          <NavLink
            to="/review-management"
            className={({ isActive }) => 
              `nav-button ${isActive ? 'active' : ''}`
            }
          >
            <div className="nav-button-content">
              <MessageSquare size={20} />
              <span>Quản lý tương tác</span>
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
          <button
            type="button"
            onClick={handleLogout}
            className="nav-button logout-button"
          >
            <div className="nav-button-content">
              <LogOut size={20} />
              <span>Đăng xuất</span>
            </div>
          </button>
        </div>
      </nav>
    </div>
  );
};

export default Sidebar;