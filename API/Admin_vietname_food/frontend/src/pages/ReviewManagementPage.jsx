import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X, Star, User, MessageSquare, Calendar, Filter } from 'lucide-react';
import { FoodAPI } from '../api';
import './ReviewManagement.css';

const ReviewManagementPage = () => {
  const [reviews, setReviews] = useState([]);
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingReview, setEditingReview] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState('all'); // all, 1, 2, 3, 4, 5
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  
  const [formData, setFormData] = useState({
    user_id: '',
    food_id: '',
    rating: '5',
    comment: ''
  });

  // Fetch reviews and foods data
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      setError('');
      
      try {
        // Fetch reviews
        const reviewsResponse = await fetch('http://localhost:5000/api/reviews?limit=1000');
        if (!reviewsResponse.ok) throw new Error('Lỗi khi tải reviews');
        const reviewsData = await reviewsResponse.json();
        setReviews(Array.isArray(reviewsData) ? reviewsData : []);

        // Fetch foods for dropdown and display
        const foodsData = await FoodAPI.list({ limit: 1000 });
        setFoods(Array.isArray(foodsData) ? foodsData : []);
        
      } catch (error) {
        console.error('Error loading data:', error);
        setError('Không thể tải dữ liệu tương tác');
        setReviews([]);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Reset form
  const resetForm = () => {
    setFormData({
      user_id: '',
      food_id: '',
      rating: '5',
      comment: ''
    });
    setEditingReview(null);
    setShowAddForm(false);
  };

  // Handle edit
  const handleEdit = (review) => {
    setFormData({
      user_id: review.user_id?.toString() || '',
      food_id: review.food_id?.toString() || '',
      rating: review.rating?.toString() || '5',
      comment: review.comment || ''
    });
    setEditingReview(review);
    setShowAddForm(true);
  };

  // Handle save
  const handleSave = async () => {
    try {
      if (!formData.user_id || !formData.food_id || !formData.comment.trim()) {
        setError('Vui lòng nhập đầy đủ thông tin bắt buộc');
        return;
      }

      const payload = {
        user_id: parseInt(formData.user_id),
        food_id: parseInt(formData.food_id),
        rating: parseInt(formData.rating),
        comment: formData.comment.trim()
      };

      if (editingReview) {
        // Update existing review
        const response = await fetch(`http://localhost:5000/api/reviews/${editingReview.review_id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Lỗi khi cập nhật');

        // Update local state
        setReviews(reviews.map(r => 
          r.review_id === editingReview.review_id ? { ...r, ...payload } : r
        ));
      } else {
        // Create new review
        const response = await fetch('http://localhost:5000/api/reviews', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error('Lỗi khi tạo mới');

        const newReview = await response.json();
        setReviews([...reviews, { 
          review_id: newReview.review_id || Date.now(), 
          ...payload,
          created_at: new Date().toISOString()
        }]);
      }

      setError('');
      resetForm();
    } catch (err) {
      console.error('Error saving review:', err);
      setError('Lỗi khi lưu: ' + err.message);
    }
  };

  // Handle delete
  const handleDelete = async (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa đánh giá này?')) {
      try {
        const response = await fetch(`http://localhost:5000/api/reviews/${id}`, {
          method: 'DELETE'
        });

        if (!response.ok) throw new Error('Lỗi khi xóa');

        setReviews(reviews.filter(r => r.review_id !== id));
        setError('');
      } catch (err) {
        console.error('Error deleting review:', err);
        setError('Lỗi khi xóa: ' + err.message);
      }
    }
  };

  // Get food name by id
  const getFoodName = (foodId) => {
    const food = foods.find(f => f.food_id === foodId);
    return food ? food.name : `Món ăn #${foodId}`;
  };

  // Filter reviews based on search and rating filter
  const filteredReviews = reviews.filter(review => {
    const foodName = getFoodName(review.food_id);
    const matchesSearch = review.comment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         foodName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         review.user_id?.toString().includes(searchTerm);
    
    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter);
    
    return matchesSearch && matchesRating;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredReviews.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedReviews = filteredReviews.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, ratingFilter]);

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

  // Get statistics
  const stats = {
    total: reviews.length,
    avgRating: reviews.length > 0 ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1) : 0,
    fiveStars: reviews.filter(r => r.rating === 5).length,
    lowRating: reviews.filter(r => r.rating <= 2).length
  };

  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <Star
          key={i}
          size={16}
          className={i <= rating ? 'star-filled' : 'star-empty'}
          fill={i <= rating ? '#fbbf24' : 'none'}
        />
      );
    }
    return <div className="star-rating">{stars}</div>;
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'Không rõ';
    return new Date(dateString).toLocaleDateString('vi-VN');
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
            <div className="stat-label">Tổng đánh giá</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number">{stats.avgRating}★</div>
            <div className="stat-label">Điểm trung bình</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#10b981' }}>{stats.fiveStars}</div>
            <div className="stat-label">5 sao</div>
          </div>
          
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#ef4444' }}>{stats.lowRating}</div>
            <div className="stat-label">≤ 2 sao</div>
          </div>
        </div>

        {/* Search Controls */}
        <div className="search-controls-card">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm theo bình luận, món ăn, user ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <div className="controls-right">
            <select
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">Tất cả đánh giá</option>
              <option value="5">⭐⭐⭐⭐⭐ (5 sao)</option>
              <option value="4">⭐⭐⭐⭐ (4 sao)</option>
              <option value="3">⭐⭐⭐ (3 sao)</option>
              <option value="2">⭐⭐ (2 sao)</option>
              <option value="1">⭐ (1 sao)</option>
            </select>
            
            <button 
              className="btn btn-primary"
              onClick={() => setShowAddForm(true)}
            >
              <Plus size={16} />
              Thêm đánh giá
            </button>
          </div>
        </div>

        {/* Reviews Table */}
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '90px', textAlign: 'center' }}>User ID</th>
                <th style={{ width: '180px' }}>Món ăn</th>
                <th style={{ width: '80px', textAlign: 'center' }}>Thích</th>
                <th style={{ width: 'auto', minWidth: '220px' }}>Bình luận</th>
                <th style={{ width: '130px', textAlign: 'center' }}>Đánh giá</th>
                <th style={{ width: '100px', textAlign: 'center' }}>Ngày tạo</th>
                <th style={{ width: '120px', textAlign: 'center' }}>Hành động</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    Đang tải danh sách tương tác...
                  </td>
                </tr>
              ) : paginatedReviews.length === 0 ? (
                <tr>
                  <td colSpan="7" className="no-data">
                    {searchTerm || ratingFilter !== 'all' ? 'Không tìm thấy đánh giá nào' : 'Chưa có đánh giá nào'}
                  </td>
                </tr>
              ) : (
                paginatedReviews
                  .sort((a, b) => new Date(b.created_at) - new Date(a.created_at)) // Newest first
                  .map((review) => (
                    <tr key={review.review_id}>
                      <td style={{ textAlign: 'center' }}>
                        <div className="user-info">
                          <User size={16} />
                          #{review.user_id}
                        </div>
                      </td>
                      <td>
                        <div className="food-info">
                          <div className="food-name">{getFoodName(review.food_id)}</div>
                          <div className="food-id">ID: {review.food_id}</div>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="like-cell">
                          <span className="like-icon">❤️</span>
                          <span className="like-count">{Math.floor(Math.random() * 50)}</span>
                        </div>
                      </td>
                      <td>
                        <div className="comment-cell">
                          {review.comment ? (
                            <div className="comment-content">
                              {review.comment.length > 100 
                                ? `${review.comment.substring(0, 100)}...`
                                : review.comment
                              }
                            </div>
                          ) : (
                            <span className="no-comment">Không có bình luận</span>
                          )}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="rating-cell">
                          {renderStars(review.rating)}
                          <span className="rating-text">({review.rating}/5)</span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="date-info">
                          <Calendar size={12} />
                          {formatDate(review.created_at)}
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div className="action-buttons">
                          <button
                            className="action-btn edit"
                            onClick={() => handleEdit(review)}
                            title="Chỉnh sửa"
                          >
                            <Edit2 size={16} />
                          </button>
                          
                          <button
                            className="action-btn delete"
                            onClick={() => handleDelete(review.review_id)}
                            title="Xóa đánh giá"
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

        {/* Pagination */}
        <div className="pagination-wrapper">
          {renderPagination()}
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content review-form-modal">
              <div className="modal-header">
                <h2>{editingReview ? 'Sửa đánh giá' : 'Thêm đánh giá mới'}</h2>
                <button onClick={resetForm} className="btn-close">
                  <X size={24} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-row">
                  <div className="form-group">
                    <label>User ID <span className="required">*</span></label>
                    <input
                      type="number"
                      value={formData.user_id}
                      onChange={(e) => setFormData({ ...formData, user_id: e.target.value })}
                      placeholder="Nhập ID người dùng"
                      className="form-input"
                      min="1"
                    />
                  </div>

                  <div className="form-group">
                    <label>Món ăn <span className="required">*</span></label>
                    <select
                      value={formData.food_id}
                      onChange={(e) => setFormData({ ...formData, food_id: e.target.value })}
                      className="form-select"
                    >
                      <option value="">Chọn món ăn</option>
                      {foods.map(food => (
                        <option key={food.food_id} value={food.food_id}>
                          {food.name} (ID: {food.food_id})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="form-group">
                  <label>Đánh giá <span className="required">*</span></label>
                  <select
                    value={formData.rating}
                    onChange={(e) => setFormData({ ...formData, rating: e.target.value })}
                    className="form-select"
                  >
                    <option value="5">⭐⭐⭐⭐⭐ Xuất sắc (5 sao)</option>
                    <option value="4">⭐⭐⭐⭐ Tốt (4 sao)</option>
                    <option value="3">⭐⭐⭐ Trung bình (3 sao)</option>
                    <option value="2">⭐⭐ Kém (2 sao)</option>
                    <option value="1">⭐ Rất kém (1 sao)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label>Bình luận <span className="required">*</span></label>
                  <textarea
                    value={formData.comment}
                    onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                    placeholder="Nhập bình luận đánh giá..."
                    rows={4}
                    className="form-textarea"
                  />
                </div>
              </div>

              <div className="modal-footer">
                <button onClick={resetForm} className="btn btn-secondary">
                  <X size={20} />
                  Hủy
                </button>
                <button onClick={handleSave} className="btn btn-primary">
                  <Save size={20} />
                  {editingReview ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ReviewManagementPage;