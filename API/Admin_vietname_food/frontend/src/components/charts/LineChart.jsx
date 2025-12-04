import { LineChart, Line, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { month: 'January', value: 65 },
  { month: 'February', value: 59 },
  { month: 'March', value: 80 },
  { month: 'April', value: 81 },
  { month: 'May', value: 56 },
  { month: 'June', value: 55 },
  { month: 'July', value: 40 }
];

const LineChartComponent = () => {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Line Chart</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="month" 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
            />
            <Legend />
            <Line 
              type="monotone" 
              dataKey="value" 
              stroke="#06B6D4" 
              strokeWidth={2}
              dot={{ fill: '#06B6D4', strokeWidth: 2, r: 4 }}
              name="Dataset 1"
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default LineChartComponent;