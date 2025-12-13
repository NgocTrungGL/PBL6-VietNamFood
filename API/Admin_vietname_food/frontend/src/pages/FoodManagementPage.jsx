import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X } from 'lucide-react';
import { FoodAPI, Categories, FoodImages, Regions } from '../api';
import axios from 'axios'; // Giữ lại để fallback
import './FoodManagement.css';

const FoodManagementPage = () => {
  const [foods, setFoods] = useState([]); // start empty, load from backend
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    name: '',
    region: '',
    category_id: '',
    main_image: '',
    ingredients: '',
    province: '',
    nutrition: '',
    recipe: { title: '', instructions: '', video_url: '', prep_time_minutes: '', cook_time_minutes: '' },
  });
  const [categories, setCategories] = useState([]);
  const [additionalImageUrls, setAdditionalImageUrls] = useState([]);
  const [newAdditionalUrl, setNewAdditionalUrl] = useState('');
  const [existingImages, setExistingImages] = useState([]); // State lưu danh sách hình ảnh phụ

  const [allRegions, setAllRegions] = useState([]);
  const [regionsList, setRegionsList] = useState([]); // top-level regions
  const [provincesList, setProvincesList] = useState([]); // child regions (provinces)

  // Thêm state để track khi regions đã được load
  const [regionsLoaded, setRegionsLoaded] = useState(false);

  // Helper function để convert raw data từ fallback API
  const convertRawRegionData = (rawData) => {
    return rawData.map(item => ({
      id: item.region_id,
      name: item.region_name,
      image: item.region_image,
      parent_region_id: item.parent_region_id
    }));
  };

  // Hàm lấy danh sách tỉnh thành theo region_id
  const loadProvincesByRegion = async (regionId) => {
    if (!regionId) {
      setProvincesList([]);
      return;
    }

    try {
      // Sử dụng API wrapper để lấy tỉnh thành theo region
      const provinces = await Regions.getProvincesByRegion(regionId);
      setProvincesList(provinces || []);
      console.log(`Loaded ${provinces.length} provinces for region ${regionId}`);
    } catch (error) {
      console.error('Lỗi khi lấy danh sách tỉnh thành:', error);
      // Fallback: lọc từ allRegions nếu đã có dữ liệu 
      const provinces = allRegions.filter(r => r.parent_region_id === Number(regionId));
      // Convert format nếu cần thiết
      const convertedProvinces = provinces.length > 0 && !provinces[0].id ?
        convertRawRegionData(provinces) : provinces;
      setProvincesList(convertedProvinces);
    }
  };

  useEffect(() => {
    const fetchFoods = async () => {
      setLoading(true);
      setError('');

      // Fetch foods data với timeout ngắn để tránh hang
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 5000); // 5s timeout

        const foodsData = await FoodAPI.list({ limit: 1000, signal: controller.signal });
        clearTimeout(timeoutId);

        console.log('Loaded foods sample:', foodsData?.[0]);
        setFoods(Array.isArray(foodsData) ? foodsData : []);
      } catch (error) {
        console.error('Error loading foods:', error);
        if (error.name === 'AbortError') {
          setError('Timeout khi tải dữ liệu - vui lòng thử lại');
        } else {
          setError('Không thể tải danh sách món ăn');
        }
      }

      // Sau đó fetch các dữ liệu phụ song song
      try {
        const [categoriesResult, regionsResult] = await Promise.allSettled([
          Categories.listCategories({ limit: 500 }),
          Regions.getAllRegionsWithClassification()
        ]);

        // Xử lý categories data
        if (categoriesResult.status === 'fulfilled') {
          console.log('Loaded categories:', categoriesResult.value);
          setCategories(categoriesResult.value || []);
        } else {
          console.warn('load categories error:', categoriesResult.reason);
        }

        // Xử lý regions data
        if (regionsResult.status === 'fulfilled') {
          const { mainRegions, provinces } = regionsResult.value;
          setAllRegions([...mainRegions, ...provinces]);
          setRegionsList(mainRegions);
          console.log('Loaded regions:', {
            total: mainRegions.length + provinces.length,
            mainRegions: mainRegions.length,
            provinces: provinces.length
          });
          setRegionsLoaded(true);
        } else {
          console.error('Error loading regions:', regionsResult.reason);
          // Fallback: try direct API call
          try {
            const response = await axios.get('http://localhost:5000/api/regions?limit=1000');
            if (Array.isArray(response.data)) {
              const rawData = response.data;
              const allRegs = convertRawRegionData(rawData);
              setAllRegions(allRegs);
              const mainRegions = allRegs.filter(r => r.parent_region_id === null || r.parent_region_id === undefined);
              setRegionsList(mainRegions);
              setRegionsLoaded(true);
            }
          } catch (fallbackError) {
            console.error('Fallback regions error:', fallbackError);
            setRegionsList([]);
            setAllRegions([]);
          }
        }
      } catch (e) {
        console.error('Error in fetchData:', e);
        // Không set error để không ảnh hưởng UI nếu foods đã load
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  // useEffect để update form khi regions được load và đang edit
  useEffect(() => {
    if (regionsLoaded && editingFood && regionsList.length > 0) {
      // Tìm lại region ID từ tên region
      if (editingFood.region && !formData.region) {
        const foundRegion = regionsList.find(r => r.name === editingFood.region);
        if (foundRegion) {
          const regionId = String(foundRegion.id);
          setFormData(prev => ({ ...prev, region: regionId }));
          // Load provinces
          loadProvincesByRegion(regionId);
          console.log('Auto-updated region from loaded data:', { region: editingFood.region, regionId });
        }
      }
    }
  }, [regionsLoaded, editingFood, regionsList, formData.region]);

  const resetForm = () => {
    setFormData({
      name: '',
      region: '',
      category_id: '',
      ingredients: '',
      main_image: '',
      nutrition_info: '',
      province: ''
    });
    setAdditionalImageUrls([]);
    setNewAdditionalUrl('');
    setExistingImages([]);
  };

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingFood(null);
    resetForm();
  };

  const handleEdit = (food) => {
    console.log('Editing food:', food); // Debug log to verify food object
    setEditingFood(food);
    setFormData({
      name: food.name || '',
      region: food.origin_region_id || '',
      category_id: food.category_id || '',
      main_image: food.main_image || '',
      ingredients: food.ingredients || '',
      province: food.province || '',
      nutrition_info: food.nutrition_info || '', // Ensure nutrition_info is set
      recipe: food.recipe || { title: '', instructions: '', video_url: '', prep_time_minutes: '', cook_time_minutes: '' },
    });
    setShowAddForm(true);

    // Load danh sách hình ảnh phụ
    console.log('Loading images for food_id:', food.food_id);
    FoodImages.list({ food_id: food.food_id })
      .then(images => {
        console.log('Raw images data:', images);
        if (Array.isArray(images)) {
          // Backend trả về image_id, cần map thành id để frontend sử dụng
          const mappedImages = images.map(img => ({
            id: img.image_id,
            food_id: img.food_id,
            image_data: img.image_data,
            data_url: img.image_data, // Sử dụng image_data làm data_url
            caption: img.caption,
            created_at: img.created_at
          }));
          setExistingImages(mappedImages);
          console.log('Mapped images loaded:', mappedImages.length, mappedImages);
        } else {
          setExistingImages([]);
        }
      })
      .catch(err => {
        console.error('Error loading additional images:', err);
        setExistingImages([]);
      });
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!imageId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) return;
    try {
      console.log('Deleting image with ID:', imageId);
      await FoodImages.delete(imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      console.log('Image deleted successfully');
    } catch (e) {
      console.error('delete image error:', e);
      alert('Xóa hình ảnh thất bại: ' + e.message);
    }
  };

  // Remove upload logic and use image URL directly
  const handleSave = async () => {
  if (!editingFood || !editingFood.food_id) {
    console.error('Food ID is missing or undefined:', editingFood);
    setError('Food ID is missing. Please select a food to edit.');
    return;
  }

  try {
    console.log('Saving food with ID:', editingFood.food_id);

    // Gọi API update
    await FoodAPI.update(editingFood.food_id, formData);
    console.log('Food saved successfully');

    // Xoá lỗi
    setError('');

    // 🔥 Đóng form chỉnh sửa
    setShowAddForm(false);

    // 🔥 Xoá item đang edit
    setEditingFood(null);

    // 🔥 Reset dữ liệu form
    resetForm();

    // 🔥 Load lại danh sách sau khi update
    const updatedFoods = await FoodAPI.list({ limit: 1000 });
    setFoods(updatedFoods);

  } catch (error) {
    console.error('Error saving food:', error);
    setError('Failed to save food. Please try again.');
  }
};



  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa món ăn này?')) return;
    try {
      await FoodAPI.delete(id);
      setFoods(foods.filter(f => f.id !== id));
    } catch (e) {
      alert('Lỗi xóa: ' + e.message);
    }
  }

  const handleCancel = () => {
    setShowAddForm(false);
    resetForm();
    setEditingFood(null);
    setExistingImages([]);
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (food.region && food.region.toLowerCase().includes(searchTerm.toLowerCase()));

    // Sửa logic lọc: tìm parent_region_id từ allRegions
    let matchesRegion = filterRegion === '';
    if (!matchesRegion && food.origin_region_id) {
      // Tìm region trong allRegions theo origin_region_id
      const region = allRegions.find(r => r.id === food.origin_region_id);
      if (region) {
        // Nếu là tỉnh thành (có parent_region_id), so sánh với parent
        // Nếu là vùng chính (không có parent_region_id), so sánh trực tiếp
        const parentRegionId = region.parent_region_id || region.id;
        matchesRegion = parentRegionId === Number(filterRegion);
      }
    }

    return matchesSearch && matchesRegion;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredFoods.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedFoods = filteredFoods.slice(startIndex, endIndex);

  // Reset to first page when search or filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterRegion]);

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

        <span className="text-sm text-gray-700 ml-4">
          Hiển thị {startIndex + 1}-{Math.min(endIndex, filteredFoods.length)} của {filteredFoods.length} món ăn
        </span>
      </div>
    );
  };

  return (
    <div className="food-management-page">
      <div className="dashboard-content">
        {/* Search Controls */}
        <div className="search-controls-card">
          <div className="search-input-wrapper">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>

          <div className="controls-right">
            <select
              value={filterRegion}
              onChange={(e) => setFilterRegion(e.target.value)}
              className="filter-select"
            >
              <option value="">Tất cả vùng miền</option>
              {(Array.isArray(regionsList) ? regionsList : []).map(region => (
                <option key={region.id} value={region.id}>
                  {region.name}
                </option>
              ))}
            </select>

            <button
              className="btn btn-primary"
              onClick={handleAdd}
            >
              <Plus size={16} />
              Thêm món ăn
            </button>
          </div>
        </div>

        {error && <div className="error-message">Lỗi: {error}</div>}

        {/* Food Grid */}
        <div className="food-grid">
          {loading ? (
            <div style={{ gridColumn: '1 / -1' }} className="no-data">
              Đang tải danh sách món ăn...
            </div>
          ) : paginatedFoods.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem', color: '#9ca3af' }}>
              {searchTerm || filterRegion ? 'Không tìm thấy món ăn nào' : 'Chưa có món ăn nào'}
            </div>
          ) : (
            paginatedFoods.map((food, index) => (
              <div key={food.id || `food-${index}`} className="food-card">
                <div className="food-image">
                  <img src={food.main_image || food.image || '/placeholder-food.jpg'} alt={food.name} onError={(e) => {
                    e.target.src = '/placeholder-food.jpg'; // Sử dụng hình ảnh placeholder cục bộ
                  }} />
                  <div className="food-actions">
                    <button
                      className="action-btn edit"
                      onClick={() => handleEdit(food)}
                      title="Chỉnh sửa"
                    >
                      <Edit2 size={16} />
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDelete(food.id)}
                      title="Xóa"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>

                <div className="food-info">
                  <div className="food-header">
                    <h3 className="food-name">{food.name}</h3>
                    <span className="food-category">
                      {categories.find(c => c.id === Number(food.category_id))?.name || 'Chưa xác định'}
                    </span>
                  </div>

                  <div className="food-details">
                    <div className="detail-item">
                      <span className="detail-label">Miền:</span>
                      <span className="detail-value">{food.region || 'Chưa xác định'}</span>
                    </div>

                    <div className="detail-item">
                      <span className="detail-label">Tỉnh thành:</span>
                      <span className="detail-value">{food.province || 'Chưa xác định'}</span>
                    </div>
                  </div>

                  {/* Nutrition */}
                  <div className="nutrition-info">
                    <span className="detail-label">Dinh dưỡng:</span>
                    <div className="nutrition-details">
                      {food.nutrition_info ? (
                        <span style={{
                          background: '#fef3c7',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          fontWeight: '500',
                          color: '#92400e'
                        }}>
                          🔥 {food.nutrition_info} kcal
                        </span>
                      ) : (
                        <span style={{
                          color: '#6b7280',
                          fontSize: '13px',
                          fontStyle: 'italic'
                        }}>
                          Chưa có thông tin dinh dưỡng
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Ingredients */}
                  <div className="ingredients-info">
                    <span className="detail-label">Nguyên liệu:</span>
                    <div className="ingredients-details">
                      <div style={{
                        borderRadius: '12px',
                        padding: '12px'
                      }}>
                        <div style={{ fontSize: '13px', lineHeight: '1.5' }}>
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', fontSize: '12px' }}>
                            {(Array.isArray(food.ingredients) ? food.ingredients :
                              (food.ingredients ? food.ingredients.split(', ') : [])
                            ).slice(0, 4).map((ingredient, index) => (
                              <span
                                key={index}
                                style={{
                                  background: '#e0f2fe',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontWeight: '500',
                                  color: '#0369a1',
                                  border: '1px solid #bae6fd'
                                }}
                              >
                                {ingredient}
                              </span>
                            ))}
                            {(Array.isArray(food.ingredients) ? food.ingredients :
                              (food.ingredients ? food.ingredients.split(', ') : [])
                            ).length > 4 && (
                                <span style={{
                                  background: '#f3f4f6',
                                  padding: '3px 8px',
                                  borderRadius: '6px',
                                  fontWeight: '500',
                                  color: '#6b7280',
                                  border: '1px solid #d1d5db'
                                }}>
                                  +{(Array.isArray(food.ingredients) ? food.ingredients :
                                    (food.ingredients ? food.ingredients.split(', ') : [])
                                  ).length - 4}
                                </span>
                              )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pagination-wrapper">
          {renderPagination()}
        </div>

        {/* Add/Edit Form Modal */}
        {showAddForm && (
          <div className="modal-overlay">
            <div className="modal-content">
              <div className="modal-header">
                <h2>{editingFood ? 'Chỉnh sửa món ăn' : 'Thêm món ăn mới'}</h2>
                <button className="close-btn" onClick={handleCancel}>
                  <X size={20} />
                </button>
              </div>

              <div className="modal-body">
                <div className="form-grid">
                  <div className="form-group">
                    <label>Tên món ăn</label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Nhập tên món ăn"
                    />
                  </div>

                  <div className="form-group">
                    <label>Danh mục <span style={{ fontSize: '12px', color: '#666' }}>({categories.length} danh mục)</span></label>
                    <select
                      value={formData.category_id}
                      onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(category => (
                        <option key={category.id} value={category.id}>{category.name}</option>
                      ))}
                    </select>
                    {categories.length === 0 && (
                      <div style={{ fontSize: '12px', color: 'red', marginTop: '4px' }}>
                        Không tải được danh sách danh mục. Kiểm tra Console và Network tab.
                      </div>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Vùng miền</label>
                    <select
                      value={formData.region}
                      onChange={(e) => {
                        const regionId = e.target.value;
                        console.log('Region changed:', regionId);
                        setFormData({ ...formData, region: regionId, province: '' });
                        // Load provinces từ API khi chọn vùng miền
                        loadProvincesByRegion(regionId);
                      }}
                    >
                      <option value="">Chọn vùng miền</option>
                      {regionsList.map((region) => (
                        <option key={region.id} value={String(region.id)}>
                          {region.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="form-group">
                    <label>Tỉnh thành</label>
                    <select id="provinceSelect"
                      value={formData.province}
                      onChange={(e) => setFormData({ ...formData, province: e.target.value })}
                    >
                      <option value="">Chọn tỉnh thành</option>
                      {provincesList.length > 0 ? (
                        provincesList.map(p => (
                          <option key={p.id} value={p.name}>
                            {p.name}
                          </option>
                        ))
                      ) : (
                        <option disabled>
                          {formData.region ? 'Đang tải tỉnh thành...' : 'Vui lòng chọn vùng miền trước'}
                        </option>
                      )}
                    </select>
                  </div>


                  {/* Main Image Section */}
                  <div className="form-group full-width">
                    <label>Hình ảnh chính</label>
                    <div className="image-upload-section">
                      <input
                        type="text"
                        placeholder="Nhập URL ảnh chính"
                        value={formData.main_image}
                        onChange={(e) => setFormData({ ...formData, main_image: e.target.value })}
                      />
                    </div>
                  </div>

                  {/* Additional Images Section */}
                  <div className="form-group full-width">
                    <label>Hình ảnh phụ</label>
                    
                    {/* Hiển thị hình ảnh phụ từ database (khi đang chỉnh sửa) */}
                    {editingFood && existingImages.length > 0 && (
                      <div>
                        <h4 style={{ fontSize: '14px', margin: '8px 0', color: '#374151' }}>Hình ảnh hiện tại:</h4>
                        <div className="image-preview-grid">
                          {existingImages.map((image) => (
                            <div key={image.id} className="image-preview-item">
                              <img 
                                src={image.data_url || image.image_data} 
                                alt={image.caption || 'Hình ảnh phụ'} 
                                onError={(e) => {
                                  console.log('Image load error:', image);
                                  e.target.src = '/placeholder-food.jpg';
                                }}
                              />
                              <button
                                className="delete-image-btn"
                                onClick={() => handleDeleteExistingImage(image.id)}
                                title="Xóa hình ảnh này"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Thêm hình ảnh phụ mới */}
                    <div style={{ marginTop: editingFood && existingImages.length > 0 ? '16px' : '0' }}>
                      <h4 style={{ fontSize: '14px', margin: '8px 0', color: '#374151' }}>Thêm hình ảnh mới:</h4>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nhập URL ảnh phụ"
                          value={newAdditionalUrl}
                          onChange={(e) => setNewAdditionalUrl(e.target.value)}
                        />
                        <button
                          type="button"
                          onClick={() => {
                            if (!newAdditionalUrl.trim()) return;
                            setAdditionalImageUrls([...additionalImageUrls, newAdditionalUrl.trim()]);
                            setNewAdditionalUrl('');
                          }}
                        >
                          Thêm
                        </button>
                      </div>
                      <div className="image-preview-grid">
                        {additionalImageUrls.map((url, idx) => (
                          <div key={idx} className="image-preview-item">
                            <img src={url} alt="" />
                            <button
                              className="delete-image-btn"
                              onClick={() => setAdditionalImageUrls(additionalImageUrls.filter((_, i) => i !== idx))}
                            >
                              <X size={16} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>


                  <div className="form-group full-width">
                    <label>Nguyên liệu (cách nhau bằng dấu phẩy)</label>
                    <input
                      type="text"
                      value={formData.ingredients}
                      onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                      placeholder="Bánh phở, Thịt bò, Hành tây..."
                    />
                  </div>

                  {/* Nutrition section */}
                  <div className="form-group full-width">
                    <label>Thông tin dinh dưỡng</label>
                    <input
                      type="text"
                      placeholder="Nhập thông tin dinh dưỡng"
                      value={formData.nutrition_info || ''} // Display value from formData
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          nutrition_info: e.target.value, // Update value on change
                        })
                      }
                    />
                  </div>

                  {/* Recipe section */}
                  {/* <div className="form-group full-width">
                  <label>Công thức (tùy chọn)</label>
                  <input type="text" placeholder="Tiêu đề công thức" value={recipe.title} onChange={e => setRecipe({...recipe, title: e.target.value})} />
                  <textarea placeholder="Hướng dẫn" value={recipe.instructions} onChange={e => setRecipe({...recipe, instructions: e.target.value})} rows={4} />
                  <input type="text" placeholder="Video URL" value={recipe.video_url} onChange={e => setRecipe({...recipe, video_url: e.target.value})} />
                </div> */}
                </div>
              </div>

              <div className="modal-footer">
                <button className="btn secondary" onClick={handleCancel}>
                  Hủy
                </button>
                <button className="btn primary" onClick={handleSave}>
                  <Save size={16} />
                  {editingFood ? 'Cập nhật' : 'Thêm mới'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FoodManagementPage;
