import React, { useState, useEffect } from 'react';
import { 
  Search, Plus, Edit2, Trash2, Lock, Unlock, 
  Eye, UserPlus, 
  CheckCircle, XCircle, Calendar, User 
} from 'lucide-react';
import { Users } from '../api';

const UserManagementPage = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);

  const [filteredUsers, setFilteredUsers] = useState(users);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showActivityModal, setShowActivityModal] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  
  const [newUser, setNewUser] = useState({
    username: '',
    email: '',
      full_name: '',
    password: ''
  });

  // Filter users based on search term and filters
  useEffect(() => {
    let filtered = users.filter(user => {
      const matchesSearch = 
        user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
          user.full_name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
    
    setFilteredUsers(filtered);
  }, [users, searchTerm, statusFilter]);

  // load users from backend on mount
  useEffect(() => {
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function apiToUI(u) {
    return {
      admin_id: u.id || u.user_id,
      username: u.username,
      email: u.email,
      full_name: u.full_name || '',
      avatar: u.avatar || null, // could be data URL or null
      status: 'active', // backend doesn't have status field; default to active
      createdAt: u.created_at ? (new Date(u.created_at).toISOString().split('T')[0]) : '',
      lastLogin: null,
      loginCount: 0,
    };
  }

  async function loadUsers() {
    setLoading(true);
    try {
      const data = await Users.list({ limit: 200 });
      // Users.list returns mapped objects (mapFromBackend) but our wrapper returns simplified objects
      const mapped = data.map(apiToUI);
      setUsers(mapped);
    } catch (err) {
      console.error('loadUsers', err);
      alert('Lỗi khi tải người dùng: ' + (err.message || err));
    } finally {
      setLoading(false);
    }
  }

  const handleAddUser = async () => {
    try {
      const payload = {
        username: newUser.username,
        email: newUser.email,
        password: newUser.password,
        full_name: newUser.full_name,
      };
      const resp = await Users.create(payload);
      if (resp && resp.user_id) {
        // fetch created user from backend
        const created = await Users.get(resp.user_id);
        const ui = apiToUI(created);
        setUsers(prev => [ui, ...prev]);
      } else {
        // fallback: refresh list
        await loadUsers();
      }
      setNewUser({ username: '', email: '', full_name: '', password: '' });
      setShowAddModal(false);
    } catch (err) {
      console.error('create user', err);
      alert('Lỗi khi tạo người dùng: ' + (err.message || err));
    }
  };

  const handleEditUser = async () => {
    try {
      const id = selectedUser.admin_id;
      const payload = {
        username: selectedUser.username,
        email: selectedUser.email,
        full_name: selectedUser.full_name,
      };
      await Users.update(id, payload);
      setUsers(users.map(user => user.admin_id === id ? { ...user, ...payload } : user));
      setShowEditModal(false);
      setSelectedUser(null);
    } catch (err) {
      console.error('update user', err);
      alert('Lỗi khi cập nhật người dùng: ' + (err.message || err));
    }
  };

  const handleToggleStatus = (userId) => {
    // client-side only — backend has no status field
    setUsers(users.map(user => 
      user.admin_id === userId 
        ? { ...user, status: user.status === 'active' ? 'locked' : 'active' }
        : user
    ));
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa người dùng này? Hành động này không thể hoàn tác.')) return;
    try {
      await Users.delete(userId);
      setUsers(users.filter(user => user.admin_id !== userId));
    } catch (err) {
      console.error('delete user', err);
      alert('Lỗi khi xóa người dùng: ' + (err.message || err));
    }
  };

  const handleViewActivity = (user) => {
    setSelectedUser(user);
    setShowActivityModal(true);
  };

  const getStatusBadge = (status) => {
    if (status === 'active') {
      return (
        <span className="status-badge active">
          <CheckCircle size={12} />
          Đang hoạt động
        </span>
      );
    } else {
      return (
        <span className="status-badge locked">
          <XCircle size={12} />
          Đã khóa
        </span>
      );
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.status === 'active').length,
    locked: users.filter(u => u.status === 'locked').length,
    newThisMonth: users.filter(u => {
      const userDate = new Date(u.createdAt);
      const currentDate = new Date();
      return userDate.getMonth() === currentDate.getMonth() && 
             userDate.getFullYear() === currentDate.getFullYear();
    }).length
  };

  return (
    <div className="user-management-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý người dùng</h1>
        <p className="page-subtitle">Quản lý tài khoản người dùng và phân quyền hệ thống</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <User size={24} />
          </div>
          <div className="stat-content">
            <h3>Tổng người dùng</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Đang hoạt động</h3>
            <p className="stat-number">{stats.active}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon red">
            <XCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Bị khóa</h3>
            <p className="stat-number">{stats.locked}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon purple">
            <UserPlus size={24} />
          </div>
          <div className="stat-content">
            <h3>Mới tháng này</h3>
            <p className="stat-number">{stats.newThisMonth}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="controls-left">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm người dùng..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="filter-select"
          >
            <option value="all">Tất cả trạng thái</option>
            <option value="active">Hoạt động</option>
            <option value="locked">Bị khóa</option>
          </select>
          

        </div>
        
        <button 
          className="btn primary"
          onClick={() => setShowAddModal(true)}
        >
          <Plus size={16} />
          Thêm người dùng
        </button>
      </div>

      {/* Users Table */}
      <div className="users-table-container">
        <table className="users-table">
          <thead>
            <tr>
              <th>Avatar</th>
              <th>Tên người dùng</th>
              <th>Email</th>
              <th>Trạng thái</th>
              <th>Ngày tạo</th>
              <th>Đăng nhập cuối</th>
              <th>Hành động</th>
            </tr>
          </thead>
          <tbody>
            {filteredUsers.map(user => (
              <tr key={user.admin_id}>
                <td>
                  <div className="user-avatar">
                    {user.avatar && typeof user.avatar === 'string' && user.avatar.startsWith('data:') ? (
                      <img src={user.avatar} alt={user.username} style={{ width: 40, height: 40, borderRadius: '50%' }} />
                    ) : (
                      <span>{user.avatar || '👤'}</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="user-info">
                    <div className="user-name">{user.full_name}</div>
                    <div className="username">@{user.username}</div>
                  </div>
                </td>
                <td>
                  <a href={`mailto:${user.email}`} className="email-link">
                    {user.email}
                  </a>
                </td>
                <td>
                  <div className="status-cell">
                    {getStatusBadge(user.status)}
                    <div className="status-info">
                      {user.status === 'active' ? 
                        `${user.loginCount} lần đăng nhập` : 
                        'Tài khoản bị khóa'
                      }
                    </div>
                  </div>
                </td>
                <td>
                  <div className="date-info">
                    <Calendar size={12} />
                    {user.createdAt}
                  </div>
                </td>
                <td>
                  <div className="login-info">
                    {user.lastLogin ? (
                      <>
                        <div>{user.lastLogin}</div>
                        <div className="login-count">({user.loginCount} lần)</div>
                      </>
                    ) : (
                      <span className="no-login">Chưa đăng nhập</span>
                    )}
                  </div>
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      className="action-btn edit"
                      onClick={() => {
                          setSelectedUser({...user});
                          setShowEditModal(true);
                        }}
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    
                    <button
                      className={`action-btn ${user.status === 'active' ? 'lock' : 'unlock'}`}
                      onClick={() => handleToggleStatus(user.admin_id)}
                      title={user.status === 'active' ? 'Khóa tài khoản' : 'Mở khóa tài khoản'}
                    >
                      {user.status === 'active' ? <Lock size={16} /> : <Unlock size={16} />}
                    </button>
                    
                    <button
                      className="action-btn activity"
                      onClick={() => handleViewActivity(user)}
                      title="Xem nhật ký hoạt động"
                    >
                      <Eye size={16} />
                    </button>
                    
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteUser(user.admin_id)}
                      title="Xóa người dùng"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Thêm người dùng mới</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowAddModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên đăng nhập</label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="username"
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    placeholder="user@example.com"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    value={newUser.full_name}
                      onChange={(e) => setNewUser({...newUser, full_name: e.target.value})}
                    placeholder="Nguyễn Văn A"
                  />
                </div>
                
                <div className="form-group">
                  <label>Mật khẩu</label>
                  <input
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="••••••••"
                  />
                </div>
                

              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn secondary" 
                onClick={() => setShowAddModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn primary" 
                onClick={handleAddUser}
                disabled={!newUser.username || !newUser.email || !newUser.full_name || !newUser.password}
              >
                Thêm người dùng
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Modal */}
      {showEditModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Chỉnh sửa người dùng</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowEditModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên đăng nhập</label>
                  <input
                    type="text"
                    value={selectedUser.username}
                    onChange={(e) => setSelectedUser({...selectedUser, username: e.target.value})}
                  />
                </div>
                
                <div className="form-group">
                  <label>Email</label>
                  <input
                    type="email"
                    value={selectedUser.email}
                    onChange={(e) => setSelectedUser({...selectedUser, email: e.target.value})}
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Họ và tên</label>
                  <input
                    type="text"
                    value={selectedUser.full_name}
                    onChange={(e) => setSelectedUser({...selectedUser, full_name: e.target.value})}
                  />
                </div>
                

                
                <div className="form-group">
                  <label>Trạng thái</label>
                  <select
                    value={selectedUser.status}
                    onChange={(e) => setSelectedUser({...selectedUser, status: e.target.value})}
                  >
                    <option value="active">Hoạt động</option>
                    <option value="locked">Bị khóa</option>
                  </select>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn secondary" 
                onClick={() => setShowEditModal(false)}
              >
                Hủy
              </button>
              <button 
                className="btn primary" 
                onClick={handleEditUser}
              >
                Cập nhật
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Activity Log Modal */}
      {showActivityModal && selectedUser && (
        <div className="modal-overlay">
          <div className="modal-content large">
            <div className="modal-header">
              <h2>Nhật ký hoạt động - {selectedUser.full_name}</h2>
              <button 
                className="close-btn" 
                onClick={() => setShowActivityModal(false)}
              >
                ×
              </button>
            </div>
            
            <div className="modal-body">
              <div className="activity-log">
                <div className="activity-item">
                  <div className="activity-time">2025-11-03 09:30</div>
                  <div className="activity-action success">Đăng nhập thành công</div>
                  <div className="activity-details">IP: 192.168.1.100</div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-time">2025-11-02 16:45</div>
                  <div className="activity-action info">Cập nhật thông tin cá nhân</div>
                  <div className="activity-details">Thay đổi số điện thoại</div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-time">2025-11-01 14:20</div>
                  <div className="activity-action success">Đăng nhập thành công</div>
                  <div className="activity-details">IP: 192.168.1.105</div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-time">2025-10-30 10:15</div>
                  <div className="activity-action warning">Thử đăng nhập sai mật khẩu</div>
                  <div className="activity-details">IP: 192.168.1.100 (3 lần)</div>
                </div>
                
                <div className="activity-item">
                  <div className="activity-time">2025-01-01 09:00</div>
                  <div className="activity-action info">Tài khoản được tạo</div>
                  <div className="activity-details">Bởi: Admin</div>
                </div>
              </div>
            </div>
            
            <div className="modal-footer">
              <button 
                className="btn secondary" 
                onClick={() => setShowActivityModal(false)}
              >
                Đóng
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagementPage;