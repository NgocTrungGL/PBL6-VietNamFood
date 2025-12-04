import { useState, useRef } from 'react';
import { 
  Upload, Search, Filter, Download, Play, Pause, 
  Eye, Edit3, Trash2, Plus, Tag, CheckCircle, 
  AlertCircle, Clock, BarChart3, HardDrive
} from 'lucide-react';

const DatasetPage = () => {
  const fileInputRef = useRef(null);
  
  const [datasets, setDatasets] = useState([
    {
      id: 1,
      filename: 'pho_hanoi_001.jpg',
      foodName: 'Phở Hà Nội',
      region: 'Miền Bắc',
      province: 'Hà Nội',
      status: 'labeled',
      confidence: 95.2,
      uploadDate: '2025-01-15',
      size: '2.3 MB',
      image: 'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=300&h=200&fit=crop',
      labels: ['phở', 'bò', 'hà nội', 'miền bắc'],
      trainingUsed: true
    },
    {
      id: 2,
      filename: 'banh_mi_002.jpg',
      foodName: 'Bánh mì Sài Gòn',
      region: 'Miền Nam', 
      province: 'TP. Hồ Chí Minh',
      status: 'pending',
      confidence: null,
      uploadDate: '2025-01-20',
      size: '1.8 MB',
      image: 'https://images.unsplash.com/photo-1558030006-450675393462?w=300&h=200&fit=crop',
      labels: [],
      trainingUsed: false
    },
    {
      id: 3,
      filename: 'bun_bo_hue_003.jpg',
      foodName: 'Bún bò Huế',
      region: 'Miền Trung',
      province: 'TP. Huế',
      status: 'verified',
      confidence: 98.7,
      uploadDate: '2025-01-18',
      size: '2.1 MB',
      image: 'https://images.unsplash.com/photo-1559847844-5315695dadae?w=300&h=200&fit=crop',
      labels: ['bún bò', 'huế', 'cay', 'miền trung'],
      trainingUsed: true
    },
    {
      id: 4,
      filename: 'com_tam_004.jpg',
      foodName: 'Cơm tấm',
      region: 'Miền Nam',
      province: 'TP. Hồ Chí Minh',
      status: 'error',
      confidence: null,
      uploadDate: '2025-01-22',
      size: '3.2 MB',
      image: 'https://images.unsplash.com/photo-1569718212165-3a8278d5f624?w=300&h=200&fit=crop',
      labels: ['cơm tấm', 'sườn'],
      trainingUsed: false
    }
  ]);

  const [selectedImages, setSelectedImages] = useState([]);
  const [filterStatus, setFilterStatus] = useState('');
  const [filterRegion, setFilterRegion] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [editingImage, setEditingImage] = useState(null);
  const [showTrainingModal, setShowTrainingModal] = useState(false);
  const [isTraining, setIsTraining] = useState(false);
  
  const [labelForm, setLabelForm] = useState({
    foodName: '',
    region: '',
    province: '',
    labels: ''
  });

  const statusColors = {
    labeled: 'bg-blue-500',
    verified: 'bg-green-500', 
    pending: 'bg-yellow-500',
    error: 'bg-red-500'
  };

  const statusLabels = {
    labeled: 'Đã gắn nhãn',
    verified: 'Đã xác thực',
    pending: 'Chờ xử lý',
    error: 'Lỗi'
  };

  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    const newDatasets = files.map((file, index) => ({
      id: Date.now() + index,
      filename: file.name,
      foodName: '',
      region: '',
      province: '',
      status: 'pending',
      confidence: null,
      uploadDate: new Date().toISOString().split('T')[0],
      size: (file.size / 1024 / 1024).toFixed(1) + ' MB',
      image: URL.createObjectURL(file),
      labels: [],
      trainingUsed: false
    }));
    
    setDatasets([...datasets, ...newDatasets]);
  };

  const handleSelectImage = (id) => {
    setSelectedImages(prev => 
      prev.includes(id) 
        ? prev.filter(imgId => imgId !== id)
        : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    const filteredIds = filteredDatasets.map(item => item.id);
    setSelectedImages(
      selectedImages.length === filteredIds.length ? [] : filteredIds
    );
  };

  const handleLabelImage = (image) => {
    setEditingImage(image);
    setLabelForm({
      foodName: image.foodName,
      region: image.region,
      province: image.province,
      labels: image.labels.join(', ')
    });
    setShowLabelModal(true);
  };

  const handleSaveLabel = () => {
    const labelsArray = labelForm.labels.split(',').map(label => label.trim()).filter(label => label);
    
    setDatasets(datasets.map(item => 
      item.id === editingImage.id 
        ? {
            ...item,
            foodName: labelForm.foodName,
            region: labelForm.region,
            province: labelForm.province,
            labels: labelsArray,
            status: 'labeled',
            confidence: Math.random() * 10 + 90 // Mock confidence
          }
        : item
    ));
    
    setShowLabelModal(false);
    setEditingImage(null);
  };

  const handleDeleteImage = (id) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa ảnh này?')) {
      setDatasets(datasets.filter(item => item.id !== id));
      setSelectedImages(selectedImages.filter(imgId => imgId !== id));
    }
  };

  const handleStartTraining = () => {
    setIsTraining(true);
    setShowTrainingModal(true);
    
    // Simulate training process
    setTimeout(() => {
      setIsTraining(false);
      const verifiedDatasets = datasets.map(item => 
        selectedImages.includes(item.id) && item.status === 'labeled'
          ? { ...item, status: 'verified', trainingUsed: true }
          : item
      );
      setDatasets(verifiedDatasets);
      setSelectedImages([]);
    }, 3000);
  };

  const filteredDatasets = datasets.filter(item => {
    const matchesSearch = item.filename.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         item.foodName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === '' || item.status === filterStatus;
    const matchesRegion = filterRegion === '' || item.region === filterRegion;
    return matchesSearch && matchesStatus && matchesRegion;
  });

  const stats = {
    total: datasets.length,
    labeled: datasets.filter(item => item.status === 'labeled').length,
    verified: datasets.filter(item => item.status === 'verified').length,
    pending: datasets.filter(item => item.status === 'pending').length,
    trained: datasets.filter(item => item.trainingUsed).length
  };

  return (
    <div className="dataset-page">
      <div className="page-header">
        <h1 className="page-title">Bộ dữ liệu AI</h1>
        <p className="page-subtitle">Quản lý ảnh dùng để huấn luyện mô hình nhận diện món ăn</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon blue">
            <HardDrive size={24} />
          </div>
          <div className="stat-content">
            <h3>Tổng số ảnh</h3>
            <p className="stat-number">{stats.total}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon green">
            <CheckCircle size={24} />
          </div>
          <div className="stat-content">
            <h3>Đã xác thực</h3>
            <p className="stat-number">{stats.verified}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon yellow">
            <Tag size={24} />
          </div>
          <div className="stat-content">
            <h3>Đã gắn nhãn</h3>
            <p className="stat-number">{stats.labeled}</p>
          </div>
        </div>
        
        <div className="stat-card">
          <div className="stat-icon purple">
            <BarChart3 size={24} />
          </div>
          <div className="stat-content">
            <h3>Đã huấn luyện</h3>
            <p className="stat-number">{stats.trained}</p>
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="controls-section">
        <div className="controls-left">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            multiple
            accept="image/*"
            style={{ display: 'none' }}
          />
          
          <button 
            className="btn primary"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload size={16} />
            Tải ảnh lên
          </button>
          
          <button 
            className="btn secondary"
            onClick={handleStartTraining}
            disabled={selectedImages.length === 0 || isTraining}
          >
            {isTraining ? <Pause size={16} /> : <Play size={16} />}
            {isTraining ? 'Đang huấn luyện...' : `Huấn luyện (${selectedImages.length})`}
          </button>
          
          <button className="btn secondary">
            <Download size={16} />
            Xuất dữ liệu
          </button>
        </div>
        
        <div className="controls-right">
          <div className="search-box">
            <Search size={16} />
            <input
              type="text"
              placeholder="Tìm kiếm ảnh..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="">Tất cả trạng thái</option>
            <option value="pending">Chờ xử lý</option>
            <option value="labeled">Đã gắn nhãn</option>
            <option value="verified">Đã xác thực</option>
            <option value="error">Lỗi</option>
          </select>
          
          <select
            value={filterRegion}
            onChange={(e) => setFilterRegion(e.target.value)}
          >
            <option value="">Tất cả vùng miền</option>
            <option value="Miền Bắc">Miền Bắc</option>
            <option value="Miền Trung">Miền Trung</option>
            <option value="Miền Nam">Miền Nam</option>
          </select>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedImages.length > 0 && (
        <div className="bulk-actions">
          <span>{selectedImages.length} ảnh được chọn</span>
          <button className="btn secondary">Gắn nhãn hàng loạt</button>
          <button className="btn danger">Xóa đã chọn</button>
        </div>
      )}

      {/* Images Grid */}
      <div className="dataset-grid">
        <div className="grid-header">
          <label className="checkbox-container">
            <input
              type="checkbox"
              checked={selectedImages.length === filteredDatasets.length}
              onChange={handleSelectAll}
            />
            Chọn tất cả ({filteredDatasets.length})
          </label>
        </div>
        
        <div className="images-grid">
          {filteredDatasets.map(item => (
            <div key={item.id} className="image-card">
              <div className="image-container">
                <img src={item.image} alt={item.filename} />
                
                <div className="image-overlay">
                  <label className="checkbox-container">
                    <input
                      type="checkbox"
                      checked={selectedImages.includes(item.id)}
                      onChange={() => handleSelectImage(item.id)}
                    />
                  </label>
                  
                  <div className="image-actions">
                    <button 
                      className="action-btn"
                      onClick={() => handleLabelImage(item)}
                      title="Gắn nhãn"
                    >
                      <Edit3 size={14} />
                    </button>
                    <button 
                      className="action-btn"
                      title="Xem chi tiết"
                    >
                      <Eye size={14} />
                    </button>
                    <button 
                      className="action-btn danger"
                      onClick={() => handleDeleteImage(item.id)}
                      title="Xóa"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div className={`status-badge ${statusColors[item.status]}`}>
                  {statusLabels[item.status]}
                </div>
                
                {item.confidence && (
                  <div className="confidence-badge">
                    {item.confidence.toFixed(1)}%
                  </div>
                )}
              </div>
              
              <div className="image-info">
                <h4>{item.filename}</h4>
                <p className="food-name">{item.foodName || 'Chưa gắn nhãn'}</p>
                <p className="region">{item.region} - {item.province}</p>
                <p className="upload-date">Tải lên: {item.uploadDate}</p>
                <p className="file-size">{item.size}</p>
                
                {item.labels.length > 0 && (
                  <div className="labels">
                    {item.labels.slice(0, 3).map((label, index) => (
                      <span key={index} className="label-tag">{label}</span>
                    ))}
                    {item.labels.length > 3 && (
                      <span className="label-more">+{item.labels.length - 3}</span>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Label Modal */}
      {showLabelModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Gắn nhãn ảnh: {editingImage?.filename}</h2>
              <button onClick={() => setShowLabelModal(false)}>×</button>
            </div>
            
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Tên món ăn</label>
                  <input
                    type="text"
                    value={labelForm.foodName}
                    onChange={(e) => setLabelForm({...labelForm, foodName: e.target.value})}
                    placeholder="Nhập tên món ăn"
                  />
                </div>
                
                <div className="form-group">
                  <label>Vùng miền</label>
                  <select
                    value={labelForm.region}
                    onChange={(e) => setLabelForm({...labelForm, region: e.target.value})}
                  >
                    <option value="">Chọn vùng miền</option>
                    <option value="Miền Bắc">Miền Bắc</option>
                    <option value="Miền Trung">Miền Trung</option>
                    <option value="Miền Nam">Miền Nam</option>
                  </select>
                </div>
                
                <div className="form-group">
                  <label>Tỉnh thành</label>
                  <input
                    type="text"
                    value={labelForm.province}
                    onChange={(e) => setLabelForm({...labelForm, province: e.target.value})}
                    placeholder="Nhập tỉnh thành"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label>Nhãn (cách nhau bằng dấu phẩy)</label>
                  <input
                    type="text"
                    value={labelForm.labels}
                    onChange={(e) => setLabelForm({...labelForm, labels: e.target.value})}
                    placeholder="phở, bò, hà nội..."
                  />
                </div>
              </div>
              
              <div className="image-preview">
                <img src={editingImage?.image} alt="Preview" />
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn secondary" onClick={() => setShowLabelModal(false)}>
                Hủy
              </button>
              <button className="btn primary" onClick={handleSaveLabel}>
                Lưu nhãn
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Training Modal */}
      {showTrainingModal && (
        <div className="modal-overlay">
          <div className="modal-content small">
            <div className="modal-header">
              <h2>Đang huấn luyện mô hình</h2>
            </div>
            
            <div className="modal-body">
              <div className="training-progress">
                {isTraining ? (
                  <>
                    <div className="spinner"></div>
                    <p>Đang xử lý {selectedImages.length} ảnh...</p>
                    <div className="progress-bar">
                      <div className="progress-fill"></div>
                    </div>
                  </>
                ) : (
                  <>
                    <CheckCircle size={48} className="success-icon" />
                    <p>Huấn luyện hoàn tất!</p>
                    <p>Đã xử lý thành công {selectedImages.length} ảnh</p>
                  </>
                )}
              </div>
            </div>
            
            {!isTraining && (
              <div className="modal-footer">
                <button className="btn primary" onClick={() => setShowTrainingModal(false)}>
                  Đóng
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default DatasetPage;