import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Image, MapPin, Filter } from 'lucide-react';
import { Regions } from '../api';
import './RegionManagement.css';

const RegionManagementPage = () => {
  const [regions, setRegions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingRegion, setEditingRegion] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [regionFilter, setRegionFilter] = useState('all'); // all, 1, 2, 3

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    region_name: '',
    description: '',
    parent_region_id: '1', // Mặc định là Miền Bắc
    region_image: ''
  });

  // State for image handling
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  // Định nghĩa các miền chính
  const mainRegions = {
    1: { name: 'Miền Bắc', color: '#3b82f6', emoji: '🏔️' },
    2: { name: 'Miền Trung', color: '#f59e0b', emoji: '🏖️' },
    3: { name: 'Miền Nam', color: '#10b981', emoji: '🌾' }
  };

  // Fetch regions data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');

      try {
        const { mainRegions: _, provinces } = await Regions.getAllRegionsWithClassification();
        console.log('Loaded provinces:', provinces);
        setRegions(Array.isArray(provinces) ? provinces : []);
      } catch (error) {
        console.error('Error loading regions:', error);
        setError('Không thể tải dữ liệu vùng miền');
        setRegions([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      region_name: '',
      description: '',
      parent_region_id: '1',
      region_image: ''
    });
    setSelectedImage(null);
    setImagePreview('');
    setEditingRegion(null);
    setShowAddForm(false);
  };

  // Handle image upload
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        setError('Kích thước ảnh không được vượt quá 5MB');
        return;
      }
      setSelectedImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        let base64 = e.target.result;
        // Loại bỏ prefix nếu có
        if (base64.startsWith('data:image')) {
          base64 = base64.split(',')[1];
        }
        setImagePreview(e.target.result);
        setFormData({ ...formData, region_image: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  // Handle edit
  const handleEdit = (region) => {
    setFormData({
      region_name: region.name || '',
      description: region.description || '',
      parent_region_id: region.parent_region_id?.toString() || '1',
      region_image: region.region_image || ''
    });
    setImagePreview(
      region.region_image
        ? (region.region_image.startsWith("data:")
          ? region.region_image
          : `data:image/*;base64,${region.region_image}`)
        : ''
    );

    setEditingRegion(region);
    setShowAddForm(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      if (!formData.region_name.trim()) {
        setError('Vui lòng nhập tên tỉnh thành');
        return;
      }

      const payload = {
        region_name: formData.region_name.trim(),
        description: formData.description.trim(),
        parent_region_id: parseInt(formData.parent_region_id),
        region_image: formData.region_image
      };

      if (editingRegion) {
        // Update existing region
        const response = await fetch(`http://localhost:5000/api/regions/${editingRegion.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Lỗi khi cập nhật');

        // Update local state
        setRegions(regions.map(r =>
          r.id === editingRegion.id ? { ...r, ...payload, name: payload.region_name } : r
        ));
      } else {
        // Create new region
        const response = await fetch('http://localhost:5000/api/regions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Lỗi khi tạo mới');

        const newRegion = await response.json();
        setRegions([...regions, {
          id: newRegion.region_id || Date.now(),
          name: payload.region_name,
          ...payload
        }]);
      }

      setError('');
      resetForm();
    } catch (err) {
      console.error('Error saving region:', err);
      setError('Lỗi khi lưu: ' + err.message);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa tỉnh thành này?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/regions/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Lỗi khi xóa');

        setRegions(regions.filter(r => r.id !== id));
        setError('');
      } catch (err) {
        console.error('Error deleting region:', err);
        setError('Lỗi khi xóa: ' + err.message);
      }
    }
  };

  // Filter regions based on search and region filter
  const filteredRegions = regions.filter(region => {
    const matchesSearch = region.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      region.description?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesRegion = regionFilter === 'all' || region.parent_region_id === parseInt(regionFilter);

    return matchesSearch && matchesRegion;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredRegions.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedRegions = filteredRegions.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, regionFilter]);

  // Pagination component
  const renderPagination = () => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex justify-center items-center space-x-2 mt-6">
        <button
          onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
        >
          Trước
        </button>

        {[...Array(totalPages)].map((_, index) => {
          const page = index + 1;
          if (totalPages > 7) {
            if (page === 1 || page === totalPages || (page >= currentPage - 2 && page <= currentPage + 2)) {
              return (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-2 border text-sm font-medium rounded-md ${currentPage === page
                    ? 'bg-blue-500 text-white border-blue-500'
                    : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                    }`}
                >
                  {page}
                </button>
              );
            } else if ((page === currentPage - 3 && currentPage > 4) || (page === currentPage + 3 && currentPage < totalPages - 3)) {
              return <span key={page} className="px-2 py-2 text-gray-500">...</span>;
            }
            return null;
          }
          return (
            <button
              key={page}
              onClick={() => setCurrentPage(page)}
              className={`px-3 py-2 border text-sm font-medium rounded-md ${currentPage === page
                ? 'bg-blue-500 text-white border-blue-500'
                : 'bg-white text-gray-500 border-gray-300 hover:bg-gray-50'
                }`}
            >
              {page}
            </button>
          );
        })}

        <button
          onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
          disabled={currentPage === totalPages}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-500 bg-white hover:bg-gray-50 disabled:bg-gray-100 disabled:text-gray-400"
        >
          Sau
        </button>


      </div>
    );
  };

  // Group regions by main region
  const groupedRegions = paginatedRegions.reduce((acc, region) => {
    const parentId = region.parent_region_id || 1;
    if (!acc[parentId]) acc[parentId] = [];
    acc[parentId].push(region);
    return acc;
  }, {});

  // Get statistics
  const stats = {
    total: regions.length,
    north: regions.filter(r => r.parent_region_id === 1).length,
    central: regions.filter(r => r.parent_region_id === 2).length,
    south: regions.filter(r => r.parent_region_id === 3).length
  };

  return (
    <div className="page-container">
      <div className="dashboard-content">
        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        {/* Statistics Cards */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-number">{stats.total}</div>
            <div className="stat-label">Tổng tỉnh thành</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: mainRegions[1].color }}>{stats.north}</div>
            <div className="stat-label">{mainRegions[1].emoji} Miền Bắc</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: mainRegions[2].color }}>{stats.central}</div>
            <div className="stat-label">{mainRegions[2].emoji} Miền Trung</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: mainRegions[3].color }}>{stats.south}</div>
            <div className="stat-label">{mainRegions[3].emoji} Miền Nam</div>
          </div>
        </div>

        {/* Search Controls */}
        <div className="search-controls-card">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm tỉnh thành..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="controls-right">
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả miền</option>
              <option value="1">🏔️ Miền Bắc</option>
              <option value="2">🏖️ Miền Trung</option>
              <option value="3">🌾 Miền Nam</option>
            </select>

            <button
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} />
              Thêm tỉnh thành
            </button>
          </div>
        </div>

        {/* Regions Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Ảnh</th>
                <th style={{ width: '200px' }}>Tỉnh thành</th>
                <th style={{ width: '300px' }}>Mô tả</th>
                <th style={{ width: '150px' }}>Miền</th>
                <th style={{ width: '150px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="no-data">
                    Đang tải danh sách vùng miền...
                  </td>
                </tr>
              ) : paginatedRegions.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">
                    {searchTerm || regionFilter !== 'all' ? 'Không tìm thấy tỉnh thành nào' : 'Chưa có tỉnh thành nào'}
                  </td>
                </tr>
              ) : (
                paginatedRegions
                  .sort((a, b) => {
                    // Sort by region first, then by name
                    if (a.parent_region_id !== b.parent_region_id) {
                      return a.parent_region_id - b.parent_region_id;
                    }
                    return a.name.localeCompare(b.name);
                  })
                  .map((region) => (
                    <tr key={region.id}>
                      <td>
                        <div className="category-image">
                          {region.region_image ? (
                            <img
                              src={region.region_image.startsWith('data:image')
                                ? region.region_image
                                : `data:image/*;base64,${region.region_image}`}
                              alt={region.name}
                            />
                          ) : (
                            <div className="no-image">
                              <Image size={20} />
                            </div>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="category-name">
                          {region.name}
                        </div>
                      </td>
                      <td>
                        <div className="category-description">
                          {region.description || 'Chưa có mô tả'}
                        </div>
                      </td>
                      <td>
                        <div className="region-badge-container">
                          <span
                            className="region-badge"
                            style={{ backgroundColor: mainRegions[region.parent_region_id]?.color }}
                          >
                            {mainRegions[region.parent_region_id]?.emoji} {mainRegions[region.parent_region_id]?.name}
                          </span>
                        </div>
                      </td>
                      <td>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEdit(region)}
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>

                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(region.id)}
                            title="Xóa tỉnh thành"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
              )}
            </tbody>
          </table>
        </div>

        <div className="pagination-wrapper">
          {renderPagination()}
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content region-form-modal">
              <div className="modal-header">
                <h2>{editingRegion ? 'Sửa tỉnh thành' : 'Thêm tỉnh thành mới'}</h2>
                <button onClick={resetForm} className="btn-close">
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>Tên tỉnh thành <span className="required">*</span></label>
                    <input
                      type="text"
                      value={formData.region_name}
                      onChange={(e) => setFormData({ ...formData, region_name: e.target.value })}
                      placeholder="Nhập tên tỉnh thành"
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label>Thuộc miền <span className="required">*</span></label>
                    <select
                      value={formData.parent_region_id}
                      onChange={(e) => setFormData({ ...formData, parent_region_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="1">🏔️ Miền Bắc</option>
                      <option value="2">🏖️ Miền Trung</option>
                      <option value="3">🌾 Miền Nam</option>
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Mô tả ngắn gọn về tỉnh thành..."
                    rows={3}
                    className="form-textarea"
                  />
                </div>

                <div className="form-group">
                  <label>Ảnh đại diện</label>
                  <div className="image-upload-section">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file-input"
                      id="region-image"
                    />
                    <label htmlFor="region-image" className="file-input-label">
                      <Image size={20} />
                      {imagePreview ? 'Thay đổi hình ảnh' : 'Chọn ảnh tỉnh thành'}
                    </label>

                    {imagePreview && (
                      <div className="image-preview">
                        <img src={imagePreview} alt="Preview" className="preview-img" />
                        <button
                          type="button"
                          onClick={() => {
                            setImagePreview('');
                            setSelectedImage(null);
                            setFormData({ ...formData, region_image: '' });
                          }}
                          className="remove-image"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={resetForm} className="btn btn-secondary">
                  <X size={20} />
                  Hủy
                </button>
                <button onClick={handleSave} className="btn btn-primary">
                  <Save size={20} />
                  {editingRegion ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RegionManagementPage;