import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Image } from 'lucide-react';
import { Categories, FoodAPI } from '../api';
import './CategoryManagement.css';

const CategoryManagementPage = () => {
  const [categories, setCategories] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    image: ''
  });

  // Fetch categories and foods count
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch categories
        const categoriesData = await Categories.listCategories({ limit: 1000 });
        console.log('Loaded categories:', categoriesData);
        setCategories(Array.isArray(categoriesData) ? categoriesData : []);

        // Fetch foods to count items per category
        const foodsData = await FoodAPI.list({ limit: 1000 });
        console.log('Loaded foods for counting:', foodsData);
        setFoods(Array.isArray(foodsData) ? foodsData : []);

      } catch (error) {
        console.error('Error loading data:', error);
        setError('Không thể tải dữ liệu danh mục');
        setCategories([]);
        setFoods([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Count foods per category
  const getFoodCountByCategory = (categoryId) => {
    return foods.filter(food => food.category_id === categoryId).length;
  };

  // Reset form
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      image: ''
    });
  };

  // Handle add new category
  const handleAdd = () => {
    setShowAddForm(true);
    setEditingCategory(null);
    resetForm();
  };

  // Handle edit category
  const handleEdit = (category) => {
    setEditingCategory(category);
    setShowAddForm(true);
    
    setFormData({
      name: category.name || category.category_name || '',
      description: category.description || '',
      image: category.image || ''
    });
  };

  // Handle save (create or update)
  const handleSave = async () => {
    if (!formData.name.trim()) {
      alert('Vui lòng nhập tên danh mục');
      return;
    }

    try {
      const categoryData = {
        category_name: formData.name,
        name: formData.name, // for UI consistency
        description: formData.description,
        image: formData.image, // Use image URL directly
      };

      console.log('Category data to save:', categoryData);

      if (editingCategory) {
        // Update existing category
        await Categories.updateCategory(editingCategory.id, categoryData);
        setCategories(categories.map((cat) =>
          cat.id === editingCategory.id
            ? { ...cat, ...categoryData, id: editingCategory.id }
            : cat
        ));
      } else {
        // Create new category
        const result = await Categories.createCategory(categoryData);
        const newId = result?.category_id || result?.id || Date.now();
        setCategories([{ ...categoryData, id: newId }, ...categories]);
      }

      setShowAddForm(false);
      resetForm();
      setEditingCategory(null);
    } catch (error) {
      console.error('Error saving category:', error);
      alert('Lỗi lưu danh mục: ' + error.message);
    }
  };

  // Handle delete category
  const handleDelete = async (id, name) => {
    const foodCount = getFoodCountByCategory(id);
    
    let confirmMessage = `Bạn có chắc chắn muốn xóa danh mục "${name}"?`;
    if (foodCount > 0) {
      confirmMessage += `\n\nLưu ý: Có ${foodCount} món ăn thuộc danh mục này. Việc xóa danh mục sẽ không xóa các món ăn nhưng chúng sẽ không còn danh mục.`;
    }
    
    if (!window.confirm(confirmMessage)) return;

    try {
      await Categories.deleteCategory(id);
      setCategories(categories.filter(cat => cat.id !== id));
    } catch (error) {
      console.error('Error deleting category:', error);
      alert('Lỗi xóa danh mục: ' + error.message);
    }
  };

  // Handle cancel
  const handleCancel = () => {
    setShowAddForm(false);
    resetForm();
    setEditingCategory(null);
  };

  // Filter categories based on search term
  const filteredCategories = categories.filter(category => {
    const name = category.name || category.category_name || '';
    const description = category.description || '';
    return name.toLowerCase().includes(searchTerm.toLowerCase()) ||
           description.toLowerCase().includes(searchTerm.toLowerCase());
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredCategories.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCategories = filteredCategories.slice(startIndex, endIndex);

  // Reset to first page when search term changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

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
                  className={`px-3 py-2 border text-sm font-medium rounded-md ${
                    currentPage === page
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
              className={`px-3 py-2 border text-sm font-medium rounded-md ${
                currentPage === page
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



  return (
    <div className="category-management-page">
      <div className="dashboard-content">
        {/* Search and Filter Controls */}
        <div className="search-controls-card">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm danh mục..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="controls-right">
            <button
              className="btn btn-primary"
              onClick={handleAdd}
            >
              <Plus size={16} />
              Thêm danh mục
            </button>
          </div>
        </div>



        {error && <div className="error-message">Lỗi: {error}</div>}

        {/* Statistics */}
        <div className="stats-cards">
          <div className="stat-card">
            <div className="stat-number">{categories.length}</div>
            <div className="stat-label">Tổng danh mục</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">{foods.length}</div>
            <div className="stat-label">Tổng món ăn</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">
              {categories.filter(cat => getFoodCountByCategory(cat.id) === 0).length}
            </div>
            <div className="stat-label">Danh mục trống</div>
          </div>
        </div>

        {/* Categories Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '80px' }}>Ảnh</th>
                <th>Tên danh mục</th>
                <th>Mô tả</th>
                <th style={{ width: '120px' }}>Số món</th>
                <th style={{ width: '150px' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="no-data">
                    Đang tải danh sách danh mục...
                  </td>
                </tr>
              ) : paginatedCategories.length === 0 ? (
                <tr>
                  <td colSpan="5" className="no-data">
                    {searchTerm ? 'Không tìm thấy danh mục nào' : 'Chưa có danh mục nào'}
                  </td>
                </tr>
              ) : (
                paginatedCategories.map((category) => (
                  <tr key={category.id}>
                    <td>
                      <div className="category-image">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name || category.category_name}
                            onError={(e) => {
                              e.target.src = '/placeholder-category.jpg'; // Sử dụng hình ảnh placeholder cục bộ
                            }}
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
                        {category.name || category.category_name || 'Chưa có tên'}
                      </div>
                    </td>
                    <td>
                      <div className="category-description">
                        {category.description || 'Chưa có mô tả'}
                      </div>
                    </td>
                    <td>
                      <div className="food-count">
                        <span className="count-badge">
                          {getFoodCountByCategory(category.id)} món
                        </span>
                      </div>
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button
                          className="action-btn edit"
                          onClick={() => handleEdit(category)}
                          title="Chỉnh sửa"
                        >
                          <Edit2 size={16} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(category.id, category.name || category.category_name)}
                          title="Xóa"
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
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingCategory ? 'Chỉnh sửa danh mục' : 'Thêm danh mục mới'}</h2>
                <button className="close-btn" onClick={handleCancel}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tên danh mục *</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nhập tên danh mục"
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label>Mô tả</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Nhập mô tả danh mục"
                      rows={3}
                    />
                  </div>

                  {/* Image Section */}
                  <div className="form-group full-width">
                    <label>Link ảnh danh mục</label>
                    <input
                      type="text"
                      value={formData.image}
                      onChange={(e) => setFormData({ ...formData, image: e.target.value })}
                      placeholder="Nhập URL ảnh"
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn secondary" onClick={handleCancel}>
                  Hủy
                </button>
                <button className="btn primary" onClick={handleSave}>
                  <Save size={16} />
                  {editingCategory ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryManagementPage;