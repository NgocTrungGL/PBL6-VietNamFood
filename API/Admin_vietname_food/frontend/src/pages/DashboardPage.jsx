
import './Dashboard.css';
import { useState, useEffect } from 'react';

const DashboardPage = () => {
  const [dashboardData, setDashboardData] = useState({
    totalFoods: 2847,
    totalRegions: 34,
    accuracy: 94.8,
    todayImages: 156
  });

  const [topFoods] = useState([
    { name: 'Phở Hà Nội', region: 'Miền Bắc', count: 1247, percentage: 100 },
    { name: 'Bánh mì Sài Gòn', region: 'Miền Nam', count: 987, percentage: 79 },
    { name: 'Cơm tấm', region: 'Miền Nam', count: 743, percentage: 59 },
    { name: 'Bún bò Huế', region: 'Miền Trung', count: 612, percentage: 49 },
    { name: 'Bánh cuốn', region: 'Miền Bắc', count: 456, percentage: 37 },
    { name: 'Cao lầu', region: 'Miền Trung', count: 389, percentage: 31 }
  ]);

  const [recentActivities] = useState([
    { type: 'success', message: 'Nhận diện thành công: Phở Hà Nội', time: '2 phút trước' },
    { type: 'success', message: 'Nhận diện thành công: Bánh mì Sài Gòn', time: '5 phút trước' },
    { type: 'warning', message: 'Nhận diện không chắc chắn: Món ăn miền Trung', time: '8 phút trước' },
    { type: 'success', message: 'Nhận diện thành công: Cơm tấm Sài Gòn', time: '12 phút trước' },
    { type: 'error', message: 'Nhận diện thất bại: Ảnh không rõ nét', time: '15 phút trước' }
  ]);

  return (
    <div className="dashboard-page">
      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle blue">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8.1 13.34l2.83-2.83L12.93 12l2.83-2.83L17.24 11H21V3H3v8h3.76l1.34 2.34zM3 21h18v-6H3v6z"/>
                </svg>
              </div>
            </div>
            <div className="card-content">
              <h3>Tổng số món ăn</h3>
              <p className="card-number">{dashboardData.totalFoods.toLocaleString()}</p>
              <span className="card-label">Món ăn đã nhận diện</span>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle green">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
                </svg>
              </div>
            </div>
            <div className="card-content">
              <h3>Vùng miền</h3>
              <p className="card-number">{dashboardData.totalRegions}</p>
              <span className="card-label">Tỉnh thành phố</span>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle orange">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                </svg>
              </div>
            </div>
            <div className="card-content">
              <h3>Độ chính xác</h3>
              <p className="card-number">{dashboardData.accuracy}%</p>
              <span className="card-label">Tỷ lệ nhận diện đúng</span>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle purple">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M21 19V5c0-1.1-.9-2-2-2H5c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2zM8.5 13.5l2.5 3.01L14.5 12l4.5 6H5l3.5-4.5z"/>
                </svg>
              </div>
            </div>
            <div className="card-content">
              <h3>Hình ảnh hôm nay</h3>
              <p className="card-number">{dashboardData.todayImages}</p>
              <span className="card-label">Ảnh đã xử lý</span>
            </div>
          </div>
        </div>
        
        <div className="dashboard-info">
          <div className="info-card">
            <h2>Top món ăn nhận diện nhiều nhất</h2>
            <div className="top-foods">
              {topFoods.map((food, index) => (
                <div key={index} className="food-item">
                  <div className="food-info">
                    <span className="food-name">{food.name}</span>
                    <span className="food-region">{food.region}</span>
                  </div>
                  <div className="food-stats">
                    <span className="food-count">{food.count.toLocaleString()} lần</span>
                    <div className="food-bar">
                      <div className="food-progress" style={{width: `${food.percentage}%`}}></div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="info-card">
            <h2>Kết quả nhận diện gần đây</h2>
            <div className="activity-list">
              {recentActivities.map((activity, index) => (
                <div key={index} className="activity-item">
                  <span className={`activity-dot ${activity.type}`}></span>
                  <span>{activity.message}</span>
                  <span className="activity-time">{activity.time}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardPage;