const DashboardPage = () => {
  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
  <h1 className="dashboard-title">Trang chủ</h1>
        <p className="dashboard-subtitle">Tổng quan hệ thống nhận diện món ăn</p>
      </div>
      
      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle blue">🍽️</div>
            </div>
            <div className="card-content">
              <h3>Tổng số món ăn</h3>
              <p className="card-number">2,847</p>
              <span className="card-label">Món ăn đã nhận diện</span>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle green">🌏</div>
            </div>
            <div className="card-content">
              <h3>Vùng miền</h3>
              <p className="card-number">34</p>
              <span className="card-label">Tỉnh thành phố</span>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle orange">🎯</div>
            </div>
            <div className="card-content">
              <h3>Độ chính xác</h3>
              <p className="card-number">94.8%</p>
              <span className="card-label">Tỷ lệ nhận diện đúng</span>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle purple">�</div>
            </div>
            <div className="card-content">
              <h3>Hình ảnh hôm nay</h3>
              <p className="card-number">156</p>
              <span className="card-label">Ảnh đã xử lý</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-info">
          <div className="info-card">
            <h2>Top món ăn nhận diện nhiều nhất</h2>
            <div className="top-foods">
              <div className="food-item">
                <div className="food-info">
                  <span className="food-name">Phở Hà Nội</span>
                  <span className="food-region">Miền Bắc</span>
                </div>
                <div className="food-stats">
                  <span className="food-count">1,247 lần</span>
                  <div className="food-bar">
                    <div className="food-progress" style={{width: '100%'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="food-item">
                <div className="food-info">
                  <span className="food-name">Bánh mì Sài Gòn</span>
                  <span className="food-region">Miền Nam</span>
                </div>
                <div className="food-stats">
                  <span className="food-count">987 lần</span>
                  <div className="food-bar">
                    <div className="food-progress" style={{width: '79%'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="food-item">
                <div className="food-info">
                  <span className="food-name">Cơm tấm</span>
                  <span className="food-region">Miền Nam</span>
                </div>
                <div className="food-stats">
                  <span className="food-count">743 lần</span>
                  <div className="food-bar">
                    <div className="food-progress" style={{width: '59%'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="food-item">
                <div className="food-info">
                  <span className="food-name">Bún bò Huế</span>
                  <span className="food-region">Miền Trung</span>
                </div>
                <div className="food-stats">
                  <span className="food-count">612 lần</span>
                  <div className="food-bar">
                    <div className="food-progress" style={{width: '49%'}}></div>
                  </div>
                </div>
              </div>
              
              <div className="food-item">
                <div className="food-info">
                  <span className="food-name">Chả cá Lã Vọng</span>
                  <span className="food-region">Miền Bắc</span>
                </div>
                <div className="food-stats">
                  <span className="food-count">389 lần</span>
                  <div className="food-bar">
                    <div className="food-progress" style={{width: '31%'}}></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="info-card">
            <h2>Kết quả nhận diện gần đây</h2>
            <div className="activity-list">
              <div className="activity-item">
                <span className="activity-dot success"></span>
                <span>Nhận diện thành công: Phở Hà Nội</span>
                <span className="activity-time">2 phút trước</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot success"></span>
                <span>Nhận diện thành công: Bánh mì Sài Gòn</span>
                <span className="activity-time">5 phút trước</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot warning"></span>
                <span>Nhận diện không chắc chắn: Món ăn miền Trung</span>
                <span className="activity-time">8 phút trước</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot success"></span>
                <span>Nhận diện thành công: Cơm tấm Sài Gòn</span>
                <span className="activity-time">12 phút trước</span>
              </div>
              <div className="activity-item">
                <span className="activity-dot error"></span>
                <span>Nhận diện thất bại: Ảnh không rõ nét</span>
                <span className="activity-time">15 phút trước</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;