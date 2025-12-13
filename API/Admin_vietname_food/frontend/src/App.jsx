import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import DashboardPage from './pages/DashboardPage';
import ChartsPage from './pages/ChartsPage';
import FoodManagementPage from './pages/FoodManagementPage';
import RegionManagementPage from './pages/RegionManagementPage';
import CategoryManagementPage from './pages/CategoryManagementPage';
import RecipeManagementPage from './pages/RecipeManagementPage';
import ReviewManagementPage from './pages/ReviewManagementPage';
import DatasetPage from './pages/DatasetPage';
import UserManagementPage from './pages/UserManagementPage';
import LineChartComponent from './components/charts/LineChart';
import AreaChartComponent from './components/charts/AreaChart';
import ScatterChartComponent from './components/charts/ScatterChart';
import BarChartComponent from './components/charts/BarChart';
import LoginPage from './pages/LoginPage.jsx';
import RegisterPage from './pages/RegisterPage.jsx';
import ProtectedRoute from './components/ProtectedRoute.jsx';
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="charts" element={<ChartsPage />} />
          <Route path="food-management" element={<FoodManagementPage />} />
          <Route path="region-management" element={<RegionManagementPage />} />
          <Route path="category-management" element={<CategoryManagementPage />} />
          <Route path="recipe-management" element={<RecipeManagementPage />} />
          <Route path="review-management" element={<ReviewManagementPage />} />
          <Route path="dataset" element={<DatasetPage />} />
          <Route path="user-management" element={<UserManagementPage />} />
          <Route path="charts/line" element={<LineChartComponent />} />
          <Route path="charts/area" element={<AreaChartComponent />} />
          <Route path="charts/scatter" element={<ScatterChartComponent />} />
          <Route path="charts/bar" element={<BarChartComponent />} />
        </Route>
      </Routes>
    </Router>
  )
}

export default App
