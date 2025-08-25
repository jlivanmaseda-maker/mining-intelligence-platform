import React from 'react';
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const ChartSection = ({ dashboardData }) => {
  
  // 📈 DATOS SIMULADOS PARA GRÁFICOS
  const timeSeriesData = [
    { mes: 'Ene', winRate: 62, sharpeRatio: 1.8, maxDrawdown: 15 },
    { mes: 'Feb', winRate: 65, sharpeRatio: 2.1, maxDrawdown: 12 },
    { mes: 'Mar', winRate: 68, sharpeRatio: 2.3, maxDrawdown: 10 },
    { mes: 'Abr', winRate: 64, sharpeRatio: 2.0, maxDrawdown: 14 },
    { mes: 'May', winRate: 71, sharpeRatio: 2.5, maxDrawdown: 8 },
    { mes: 'Jun', winRate: 69, sharpeRatio: 2.2, maxDrawdown: 11 }
  ];

  const techniquePerformance = [
    { technique: 'SPP', bots: 12, avgWinRate: 65, simulations: 3200 },
    { technique: 'WFM', bots: 8, avgWinRate: 72, simulations: 2100 },
    { technique: 'MC Trade', bots: 15, avgWinRate: 58, simulations: 4500 },
    { technique: 'MC Lento', bots: 6, avgWinRate: 68, simulations: 1800 },
    { technique: 'Secuencial', bots: 10, avgWinRate: 61, simulations: 2800 },
    { technique: 'HBTP', bots: 4, avgWinRate: 78, simulations: 1200 }
  ];

  const equityCurveData = [
    { period: '0', balance: 10000 },
    { period: '1', balance: 10250 },
    { period: '2', balance: 10180 },
    { period: '3', balance: 10420 },
    { period: '4', balance: 10680 },
    { period: '5', balance: 10590 },
    { period: '6', balance: 10890 },
    { period: '7', balance: 11200 },
    { period: '8', balance: 11050 },
    { period: '9', balance: 11380 },
    { period: '10', balance: 11650 }
  ];

  const assetPerformanceData = [
    { name: 'EURUSD', value: 35, color: '#8884d8' },
    { name: 'GBPUSD', value: 25, color: '#82ca9d' },
    { name: 'USDJPY', value: 20, color: '#ffc658' },
    { name: 'GOLD', value: 12, color: '#ff7300' },
    { name: 'BTC', value: 8, color: '#00ff88' }
  ];

  // 🎨 COLORES PARA GRÁFICOS
  const COLORS = ['#8884d8', '#82ca9d', '#ffc658', '#ff7300', '#00ff88', '#ff0080'];

  return (
    <div style={{ 
      padding: '25px', 
      background: '#f8f9fa', 
      borderRadius: '15px',
      marginTop: '30px'
    }}>
      
      {/* TÍTULO SECCIÓN */}
      <h2 style={{ 
        margin: '0 0 30px 0', 
        color: '#333', 
        textAlign: 'center',
        fontSize: '1.8em'
      }}>
        📊 Análisis Visual Avanzado
      </h2>

      {/* GRID DE GRÁFICOS */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(500px, 1fr))', 
        gap: '30px' 
      }}>
        
        {/* 📈 GRÁFICO 1: EVOLUCIÓN TEMPORAL */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#667eea' }}>
            📈 Evolución de Métricas en el Tiempo
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={timeSeriesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="mes" />
              <YAxis />
              <Tooltip 
                formatter={(value, name) => [
                  `${value}${name.includes('Rate') || name.includes('Drawdown') ? '%' : ''}`, 
                  name
                ]}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="winRate" 
                stroke="#8884d8" 
                strokeWidth={3}
                name="Win Rate (%)"
                dot={{ r: 6 }}
              />
              <Line 
                type="monotone" 
                dataKey="sharpeRatio" 
                stroke="#82ca9d" 
                strokeWidth={3}
                name="Sharpe Ratio"
                dot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* 📊 GRÁFICO 2: COMPARACIÓN POR TÉCNICAS */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#28a745' }}>
            🧠 Performance por Técnica
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={techniquePerformance}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="technique" />
              <YAxis />
              <Tooltip formatter={(value, name) => [`${value}${name === 'avgWinRate' ? '%' : ''}`, name]} />
              <Legend />
              <Bar 
                dataKey="avgWinRate" 
                fill="#28a745" 
                name="Win Rate Promedio (%)"
                radius={[4, 4, 0, 0]}
              />
              <Bar 
                dataKey="bots" 
                fill="#ffc107" 
                name="Número de Bots"
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* 📉 GRÁFICO 3: EQUITY CURVE */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#17a2b8' }}>
            💰 Curva de Capital Simulada
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={equityCurveData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="period" />
              <YAxis />
              <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Balance']} />
              <Legend />
              <Area 
                type="monotone" 
                dataKey="balance" 
                stroke="#17a2b8" 
                fill="#17a2b8" 
                fillOpacity={0.3}
                strokeWidth={3}
                name="Balance ($)"
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* 🎯 GRÁFICO 4: DISTRIBUCIÓN POR ACTIVOS */}
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '10px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#e83e8c' }}>
            🎯 Distribución por Activos
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={assetPerformanceData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {assetPerformanceData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

      </div>

      {/* ESTADÍSTICAS ADICIONALES */}
      <div style={{
        marginTop: '30px',
        padding: '20px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h3 style={{ margin: '0 0 15px 0' }}>📈 Insights Automáticos</h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>WFM</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Mejor técnica por Win Rate</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>+16.5%</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Crecimiento total simulado</div>
          </div>
          <div>
            <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>EURUSD</div>
            <div style={{ fontSize: '14px', opacity: 0.9 }}>Activo más utilizado</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChartSection;
