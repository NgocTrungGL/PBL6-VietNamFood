import { AreaChart, Area, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend } from 'recharts';

const data = [
  { month: 'January', value: 65 },
  { month: 'February', value: 59 },
  { month: 'March', value: 80 },
  { month: 'April', value: 81 },
  { month: 'May', value: 56 },
  { month: 'June', value: 55 },
  { month: 'July', value: 40 }
];

const AreaChartComponent = () => {
  return (
    <div className="area-chart-container">
      <h3 className="area-chart-title">Area Chart</h3>
      <div className="area-chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={data}>
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
            <Area
              type="monotone"
              dataKey="value"
              stroke="#3B82F6"
              fill="url(#colorBlue)"
              name="Dataset 1"
            />
            <defs>
              <linearGradient id="colorBlue" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0.2}/>
              </linearGradient>
            </defs>
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default AreaChartComponent;