import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Cell } from 'recharts';

const data = [
  { name: 'Chart 1', votes: 12, color: '#EF4444' },
  { name: 'Chart 2', votes: 19, color: '#3B82F6' },
  { name: 'Chart 3', votes: 3, color: '#F59E0B' },
  { name: 'Chart 4', votes: 5, color: '#06B6D4' },
  { name: 'Chart 5', votes: 2, color: '#8B5CF6' },
  { name: 'Chart 6', votes: 3, color: '#F97316' }
];

const BarChartComponent = () => {
  return (
    <div className="bar-chart-container">
      <h3 className="bar-chart-title">Bar Chart</h3>
      <div className="bar-chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              dataKey="name" 
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
            <Bar 
              dataKey="votes" 
              name="# of Votes"
              radius={[4, 4, 0, 0]}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default BarChartComponent;