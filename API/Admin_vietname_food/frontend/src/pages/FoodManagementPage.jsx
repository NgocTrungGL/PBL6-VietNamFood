import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, Save, X } from 'lucide-react';
import { FoodAPI, Categories, FoodImages, Nutrition, Recipes, Regions } from '../api';

const FoodManagementPage = () => {
  const [foods, setFoods] = useState([]); // start empty, load from backend
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingFood, setEditingFood] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    region: '',
    category_id: '',
    ingredients: '',
    image: '',
    calories: '',
    description: '',
    province: ''
  });
  const [categories, setCategories] = useState([]);
  const [selectedImages, setSelectedImages] = useState([]); // files
  const [imagePreviews, setImagePreviews] = useState([]);
  const [existingImages, setExistingImages] = useState([]); // { id, src }
  // nutrition fields
  const [nutrition, setNutrition] = useState({ serving_size: '', calories: '', protein: '', carbs: '', fat: '' });
  // recipe fields (single recipe for simplicity)
  const [recipe, setRecipe] = useState({ title: '', instructions: '', video_url: '', prep_time_minutes: '', cook_time_minutes: '' });
  
  const [selectedImage, setSelectedImage] = useState(null);
  const [imagePreview, setImagePreview] = useState('');

  const [allRegions, setAllRegions] = useState([]);
  const [regionsList, setRegionsList] = useState([]); // top-level regions
  const [provincesList, setProvincesList] = useState([]); // child regions (provinces)

  useEffect(() => {
    const fetchFoods = async () => {
      setLoading(true); setError('');
      try {
        const data = await FoodAPI.list();
        // FoodAPI.list returns frontend-ready objects already
        setFoods(Array.isArray(data) ? data : []);
        // load categories for form
        try {
          const cats = await Categories.listCategories({ limit: 500 });
          setCategories(cats || []);
        } catch (e) {
          // ignore categories errors but log
          console.warn('load categories', e);
        }
        // load regions (all) and compute top-level regions
        try {
          const regs = await Regions.list({ limit: 1000 });
          setAllRegions(regs || []);
          const top = (regs || []).filter(r => r.parent_region_id === null || r.parent_region_id === undefined);
          setRegionsList(top);
        } catch (e) {
          console.warn('load regions', e);
        }
      } catch (e) {
        setError(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchFoods();
  }, []);

  const resetForm = () => {
    setFormData({
      name: '',
      region: '',
      ingredients: '',
      image: '',
      calories: '',
      description: '',
      province: ''
    });
    setSelectedImage(null);
    setImagePreview('');
  };

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files || []);
    const valid = files.filter(f => f.type && f.type.startsWith('image/'));
    if (valid.length !== files.length) alert('Một số file không phải hình ảnh đã bị bỏ qua');
    setSelectedImages(prev => [...prev, ...valid]);
    // generate previews
    const readers = valid.map(f => {
      return new Promise((res) => {
        const r = new FileReader();
        r.onload = (ev) => res(ev.target.result);
        r.readAsDataURL(f);
      });
    });
    Promise.all(readers).then(results => setImagePreviews(prev => [...prev, ...results]));
  };

  // upload image files (File objects) to backend for a given food id
  async function uploadImagesForFood(foodId, files) {
    const toBase64 = (file) => new Promise((res, rej) => {
      const reader = new FileReader();
      reader.onload = () => res(reader.result.split('base64,')[1]);
      reader.onerror = rej;
      reader.readAsDataURL(file);
    });
    for (const f of files) {
      try {
        const b64 = await toBase64(f);
        await FoodImages.create({ food_id: foodId, image_data: b64 });
      } catch (err) {
        console.warn('upload image error', err);
      }
    }
  }

  async function saveNutrition(foodId) {
    // if all nutrition fields empty, skip
    const has = Object.values(nutrition).some(v => v !== '' && v !== null && v !== undefined);
    if (!has) return;
    try {
      // check exists
      const existing = await Nutrition.get(foodId);
      if (existing && existing.id) {
        await Nutrition.update(foodId, { ...nutrition });
      } else {
        await Nutrition.create({ food_id: foodId, ...nutrition });
      }
    } catch (err) {
      // if not found or API returned error, try create
      try {
        await Nutrition.create({ food_id: foodId, ...nutrition });
      } catch (e) {
        console.warn('saveNutrition error', e);
      }
    }
  }

  async function saveRecipe(foodId) {
    if (!recipe.title || !recipe.instructions) return;
    try {
      await Recipes.create({ food_id: foodId, ...recipe });
    } catch (err) {
      console.warn('saveRecipe error', err);
    }
  }

  const handleAdd = () => {
    setShowAddForm(true);
    setEditingFood(null);
    resetForm();
  };

  const handleEdit = (food) => {
    setEditingFood(food);
    setShowAddForm(true);
    setFormData({
      name: food.name,
      region: food.origin_region_id || '',
      category_id: food.category_id || '',
      ingredients: food.ingredients.join(', '),
      image: food.image,
      calories: food.calories.toString(),
      description: food.description,
      province: food.province
    });
    // set provinces list based on selected region (if regions already loaded)
    try {
      const rid = food.origin_region_id || null;
      const provinces = allRegions.filter(r => r.parent_region_id === rid);
      setProvincesList(provinces || []);
    } catch (e) {
      // ignore
    }
    setSelectedImage(null);
    setSelectedImages([]);
    setImagePreviews(food.image ? [food.image] : []);
    // load existing images, nutrition and recipe for this food
    (async () => {
      try {
        const imgs = await FoodImages.list({ food_id: food.id });
        // imgs could be array of { id, image_data } where image_data may be base64 or dataURL
        const mapped = (imgs || []).map(img => {
          let src = img.image_data || img.src || img.data || null;
          if (src && !src.startsWith('data:')) {
            // assume base64 without data prefix; default to jpeg
            src = `data:image/jpeg;base64,${src}`;
          }
          return { id: img.id || img.image_id || img.food_image_id || null, src };
        });
        setExistingImages(mapped);
        // include existing images in previews so user can see them
        setImagePreviews(prev => [...mapped.map(m => m.src).filter(Boolean), ...prev]);
      } catch (e) {
        console.warn('load existing images', e);
      }

      try {
        const nut = await Nutrition.get(food.id);
        if (nut) setNutrition({ serving_size: nut.serving_size || '', calories: nut.calories || '', protein: nut.protein || '', carbs: nut.carbs || '', fat: nut.fat || '' });
      } catch (e) {
        // ignore
      }

      try {
        const recs = await Recipes.list({ food_id: food.id, limit: 10 });
        if (Array.isArray(recs) && recs.length > 0) {
          const r = recs[0];
          setRecipe({ title: r.title || '', instructions: r.instructions || '', video_url: r.video_url || '', prep_time_minutes: r.prep_time_minutes || '', cook_time_minutes: r.cook_time_minutes || '' });
        }
      } catch (e) {
        // ignore
      }
    })();
  };

  const handleDeleteExistingImage = async (imageId) => {
    if (!imageId) return;
    if (!window.confirm('Bạn có chắc chắn muốn xóa hình ảnh này?')) return;
    try {
      await FoodImages.delete(imageId);
      setExistingImages(prev => prev.filter(img => img.id !== imageId));
      setImagePreviews(prev => prev.filter(src => !existingImages.find(e => e.id === imageId && e.src === src)));
    } catch (e) {
      console.warn('delete image', e);
      alert('Xóa hình ảnh thất bại');
    }
  };

  const handleSave = async () => {
    const ingredientsArray = formData.ingredients.split(',').map(item => item.trim()).filter(item => item);
    
    // Sử dụng hình ảnh đã chọn hoặc hình ảnh hiện tại hoặc hình mặc định
    let imageUrl = formData.image || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=300&h=200&fit=crop';
    if (selectedImage) {
      // Trong thực tế, bạn sẽ upload file lên server và nhận về URL
      // Hiện tại sử dụng DataURL để demo
      imageUrl = imagePreview;
    }
    
    const foodData = {
      name: formData.name,
      category_id: formData.category_id || null,
      origin_region_id: formData.region ? Number(formData.region) : null,
      ingredients: ingredientsArray,
      main_image: imageUrl && imageUrl.startsWith('data:') ? imageUrl.split('base64,')[1] : null,
      calories: parseInt(formData.calories || '0', 10),
      description: formData.description,
      province: formData.province
    };

    try {
      if (editingFood) {
        await FoodAPI.update(editingFood.id, foodData);
        // upload any new images
        if (selectedImages.length) await uploadImagesForFood(editingFood.id, selectedImages);
        // update nutrition
        await saveNutrition(editingFood.id);
        // save recipe (create)
        if (recipe.title && recipe.instructions) await saveRecipe(editingFood.id);
        setFoods(foods.map(f => f.id === editingFood.id ? { ...f, ...foodData, id: editingFood.id } : f));
      } else {
        const resp = await FoodAPI.create(foodData);
        const newId = resp?.food_id || resp?.id || Date.now();
        // upload images for created food
        if (selectedImages.length) await uploadImagesForFood(newId, selectedImages);
        // nutrition
        await saveNutrition(newId);
        // recipe
        if (recipe.title && recipe.instructions) await saveRecipe(newId);
        setFoods([...foods, { ...foodData, id: newId }]);
      }
      setShowAddForm(false);
      resetForm();
      setEditingFood(null);
    } catch (e) {
      alert('Lỗi lưu: ' + e.message);
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
  };

  const handleCancel = () => {
    setShowAddForm(false);
    resetForm();
    setEditingFood(null);
    setIsEditModalOpen(false);
  };

  const filteredFoods = foods.filter(food => {
    const matchesSearch = food.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         food.region.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRegion = filterRegion === '' || food.region === filterRegion;
    return matchesSearch && matchesRegion;
  });

  return (
    <div className="food-management-page">
      <div className="page-header">
        <h1 className="page-title">Quản lý món ăn</h1>
        <p className="page-subtitle">Thêm, sửa, xóa thông tin món đặc sản</p>
        {loading && <p>Đang tải dữ liệu...</p>}
        {error && <p style={{color:'red'}}>Lỗi: {error}</p>}
      </div>

      {/* Search and Filter Bar */}
      <div className="controls-bar">
        <div className="search-controls">
          <div className="search-box">
            <Search size={20} className="search-icon" />
            <input
              type="text"
              placeholder="Tìm kiếm món ăn..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
          </div>
          
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
            className="region-filter"
          >
            <option value="">Tất cả vùng miền</option>
            {regionsList.map(region => (
              <option key={region.id} value={region.name}>{region.name}</option>
            ))}
          </select>
        </div>
        
        <button 
          className="add-btn"
          onClick={handleAdd}
        >
          <Plus size={20} />
          Thêm món ăn
        </button>
      </div>

      {/* Food Grid */}
      <div className="food-grid">
        {filteredFoods.map(food => (
          <div key={food.id} className="food-card">
            <div className="food-image">
              <img src={food.image} alt={food.name} />
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
              <h3 className="food-name">{food.name}</h3>
              <span className="food-region">{food.region}</span>
              <p className="food-description">{food.description}</p>

              <div className="food-details">
                <div className="detail-item">
                  <span className="detail-label">Calories:</span>
                  <span className="detail-value">{food.calories} kcal</span>
                </div>
                <div className="detail-item">
                  <span className="detail-label">Tỉnh thành:</span>
                  <span className="detail-value">{food.province}</span>
                </div>
              </div>

              <div className="ingredients">
                <span className="ingredients-label">Nguyên liệu:</span>
                <div className="ingredients-tags">
                  {food.ingredients.slice(0, 3).map((ingredient, index) => (
                    <span key={index} className="ingredient-tag">{ingredient}</span>
                  ))}
                  {food.ingredients.length > 3 && (
                    <span className="ingredient-more">+{food.ingredients.length - 3}</span>
                  )}
                </div>
              </div>
            </div>
          </div>
        ))}
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
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    placeholder="Nhập tên món ăn"
                  />
                </div>
                
                <div className="form-group">
                  <label>Vùng miền</label>
                  <select
                    value={formData.region}
                    onChange={(e) => {
                      const val = e.target.value;
                      setFormData({...formData, region: val, province: ''});
                      // update provinces list based on selected region id
                      const rid = val ? Number(val) : null;
                      const provinces = allRegions.filter(r => r.parent_region_id === rid);
                      setProvincesList(provinces || []);
                    }}
                  >
                    <option value="">Chọn vùng miền</option>
                    {regionsList.map(region => (
                      <option key={region.id} value={region.id}>{region.name}</option>
                    ))}
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Calories (kcal)</label>
                  <input
                    type="number"
                    value={formData.calories}
                    onChange={(e) => setFormData({...formData, calories: e.target.value})}
                    placeholder="0"
                  />
                </div>
                
                <div className="form-group">
                  <label>Tỉnh thành</label>
                  <select
                    value={formData.province}
                    onChange={(e) => setFormData({...formData, province: e.target.value})}
                  >
                    <option value="">Chọn tỉnh thành</option>
                    {provincesList.length > 0 ? (
                      provincesList.map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))
                    ) : (
                      // fallback: show provinces inferred from allRegions where parent_region_id is not null
                      allRegions.filter(r => r.parent_region_id !== null && r.parent_region_id !== undefined).map(p => (
                        <option key={p.id} value={p.name}>{p.name}</option>
                      ))
                    )}
                  </select>
                </div>
                
                <div className="form-group full-width">
                  <label>Hình ảnh</label>
                  <div className="image-upload-section">
                    <input
                      type="file"
                      id="imageInput"
                      accept="image/*"
                      multiple
                      onChange={handleImageSelect}
                      style={{ display: 'none' }}
                    />
                    <button
                      type="button"
                      className="image-select-btn"
                      onClick={() => document.getElementById('imageInput').click()}
                    >
                      {imagePreviews.length ? 'Chọn thêm hình ảnh' : 'Chọn hình ảnh'}
                    </button>
                    {imagePreviews.length > 0 && (
                      <div className="image-preview-grid">
                        {imagePreviews.map((src, idx) => {
                          const existing = existingImages.find(e => e.src === src);
                          return (
                            <div key={idx} className="image-preview-item">
                              <img src={src} alt={`preview-${idx}`} />
                              {existing ? (
                                <button
                                  type="button"
                                  className="image-remove-btn"
                                  onClick={() => handleDeleteExistingImage(existing.id)}
                                >
                                  Xóa
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="image-remove-btn"
                                  onClick={() => {
                                    setImagePreviews(prev => prev.filter((_, i) => i !== idx));
                                    setSelectedImages(prev => prev.filter((_, i) => i !== idx));
                                  }}
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label>Nguyên liệu (cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={formData.ingredients}
                    onChange={(e) => setFormData({...formData, ingredients: e.target.value})}
                    placeholder="Bánh phở, Thịt bò, Hành tây..."
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Mô tả</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Mô tả về món ăn..."
                    rows="3"
                  />
                </div>
                
                {/* Nutrition section */}
                <div className="form-group full-width">
                  <label>Thông tin dinh dưỡng (tùy chọn)</label>
                  <div className="nutrition-grid">
                    <input type="text" placeholder="Serving size" value={nutrition.serving_size} onChange={e => setNutrition({...nutrition, serving_size: e.target.value})} />
                    <input type="number" placeholder="Calories" value={nutrition.calories} onChange={e => setNutrition({...nutrition, calories: e.target.value})} />
                    <input type="number" placeholder="Protein (g)" value={nutrition.protein} onChange={e => setNutrition({...nutrition, protein: e.target.value})} />
                    <input type="number" placeholder="Carbs (g)" value={nutrition.carbs} onChange={e => setNutrition({...nutrition, carbs: e.target.value})} />
                    <input type="number" placeholder="Fat (g)" value={nutrition.fat} onChange={e => setNutrition({...nutrition, fat: e.target.value})} />
                  </div>
                </div>

                {/* Recipe section */}
                <div className="form-group full-width">
                  <label>Công thức (tùy chọn)</label>
                  <input type="text" placeholder="Tiêu đề công thức" value={recipe.title} onChange={e => setRecipe({...recipe, title: e.target.value})} />
                  <textarea placeholder="Hướng dẫn" value={recipe.instructions} onChange={e => setRecipe({...recipe, instructions: e.target.value})} rows={4} />
                  <input type="text" placeholder="Video URL" value={recipe.video_url} onChange={e => setRecipe({...recipe, video_url: e.target.value})} />
                </div>
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
  );
};

export default FoodManagementPage;