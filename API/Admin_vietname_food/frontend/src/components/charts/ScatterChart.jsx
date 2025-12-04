import { ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Legend, Cell } from 'recharts';

const data1 = [
  { x: 100, y: 200 }, { x: 120, y: 100 }, { x: 170, y: 300 }, { x: 140, y: 250 },
  { x: 150, y: 400 }, { x: 110, y: 280 }, { x: 200, y: 150 }, { x: 250, y: 320 },
  { x: 180, y: 180 }, { x: 160, y: 350 }, { x: 210, y: 220 }, { x: 190, y: 380 },
  { x: 220, y: 260 }, { x: 130, y: 340 }, { x: 240, y: 200 }
];

const data2 = [
  { x: 300, y: 300 }, { x: 400, y: 500 }, { x: 200, y: 700 }, { x: 340, y: 350 },
  { x: 560, y: 500 }, { x: 230, y: 780 }, { x: 500, y: 400 }, { x: 300, y: 500 },
  { x: 240, y: 300 }, { x: 320, y: 550 }, { x: 500, y: 400 }, { x: 420, y: 280 },
  { x: 380, y: 600 }, { x: 250, y: 500 }, { x: 460, y: 360 }
];

const ScatterChartComponent = () => {
  return (
    <div className="chart-container">
      <h3 className="chart-title">Scatter Chart</h3>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={300}>
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
            <XAxis 
              type="number"
              dataKey="x"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={[0, 600]}
            />
            <YAxis 
              type="number"
              dataKey="y"
              axisLine={false}
              tickLine={false}
              tick={{ fill: '#9CA3AF', fontSize: 12 }}
              domain={[0, 800]}
            />
            <Legend />
            <Scatter 
              name="Dataset 1" 
              data={data1} 
              fill="#EF4444"
            />
            <Scatter 
              name="Dataset 2" 
              data={data2} 
              fill="#3B82F6"
            />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

export default ScatterChartComponent;