import LineChartComponent from '../components/charts/LineChart';
import AreaChartComponent from '../components/charts/AreaChart';
import ScatterChartComponent from '../components/charts/ScatterChart';
import BarChartComponent from '../components/charts/BarChart';

const ChartsPage = () => {
  return (
    <div className="charts-page">
      <div className="dashboard-content">
        <div className="dashboard-cards">
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle blue">📊</div>
            </div>
            <div className="card-content">
              <h3>Tổng số truy vấn</h3>
              <p className="card-number">12,456</p>
              <span className="card-label">Lượt nhận diện trong tháng</span>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle green">📈</div>
            </div>
            <div className="card-content">
              <h3>Tăng trưởng</h3>
              <p className="card-number">+24.7%</p>
              <span className="card-label">So với tháng trước</span>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle orange">⚡</div>
            </div>
            <div className="card-content">
              <h3>Thời gian phản hồi</h3>
              <p className="card-number">1.2s</p>
              <span className="card-label">Thời gian xử lý trung bình</span>
            </div>
          </div>
          
          <div className="dashboard-card">
            <div className="card-icon">
              <div className="icon-circle purple">🎯</div>
            </div>
            <div className="card-content">
              <h3>Hiệu suất</h3>
              <p className="card-number">98.3%</p>
              <span className="card-label">Tỷ lệ hoạt động ổn định</span>
            </div>
          </div>
        </div>
        
        <div className="charts-grid">
          <div className="chart-card">
            <LineChartComponent />
          </div>
          <div className="chart-card">
            <AreaChartComponent />
          </div>
          <div className="chart-card">
            <ScatterChartComponent />
          </div>
          <div className="chart-card">
            <BarChartComponent />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartsPage;