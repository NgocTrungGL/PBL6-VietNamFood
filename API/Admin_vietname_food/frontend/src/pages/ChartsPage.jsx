import LineChartComponent from '../components/charts/LineChart';
import AreaChartComponent from '../components/charts/AreaChart';
import ScatterChartComponent from '../components/charts/ScatterChart';
import BarChartComponent from '../components/charts/BarChart';

const ChartsPage = () => {
  return (
    <div className="charts-page">
      <h1 className="charts-title">Thống kê</h1>
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
  );
};

export default ChartsPage;