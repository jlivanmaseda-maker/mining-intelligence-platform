import React, { useState, useEffect } from 'react';

const DashboardGlobal = ({ user, supabase, userStats = {} }) => {
  const [globalData, setGlobalData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState('sharpe');
  const [timeRange, setTimeRange] = useState('all_time');

  // 🌍 DATOS GLOBALES SIMULADOS (En producción vendría de API/DB)
  const mockGlobalData = {
    totalUsers: 12847,
    totalStrategies: 68923,
    totalBacktests: 234567,
    
    globalBenchmarks: {
      sharpe: {
        average: 1.23,
        median: 0.89,
        top10: 2.45,
        top1: 3.87,
        percentiles: {
          p25: 0.45,
          p50: 0.89,
          p75: 1.67,
          p90: 2.23,
          p95: 2.78,
          p99: 3.45
        }
      },
      winRate: {
        average: 58.3,
        median: 56.7,
        top10: 78.2,
        top1: 89.5,
        percentiles: {
          p25: 45.2,
          p50: 56.7,
          p75: 68.4,
          p90: 76.8,
          p95: 82.1,
          p99: 87.3
        }
      },
      profitFactor: {
        average: 1.34,
        median: 1.21,
        top10: 2.12,
        top1: 3.45,
        percentiles: {
          p25: 0.89,
          p50: 1.21,
          p75: 1.65,
          p90: 2.01,
          p95: 2.34,
          p99: 2.89
        }
      },
      maxDrawdown: {
        average: 18.7,
        median: 15.4,
        top10: 8.2, // Menor es mejor
        top1: 4.1,
        percentiles: {
          p25: 25.3,
          p50: 15.4,
          p75: 12.1,
          p90: 9.8,
          p95: 7.6,
          p99: 5.2
        }
      }
    },

    topTechniques: [
      { name: 'WFM', avgSharpe: 1.67, users: 3421, winRate: 62.3 },
      { name: 'MC Trade', avgSharpe: 1.45, users: 2834, winRate: 59.8 },
      { name: 'SPP', avgSharpe: 1.34, users: 4123, winRate: 57.2 },
      { name: 'Secuencial', avgSharpe: 1.28, users: 1923, winRate: 61.4 },
      { name: 'High Back Test Precision', avgSharpe: 1.21, users: 987, winRate: 58.9 }
    ],

    topAssets: [
      { name: 'EURUSD', avgSharpe: 1.34, strategies: 15432, winRate: 58.7 },
      { name: 'GBPUSD', avgSharpe: 1.28, strategies: 12876, winRate: 57.1 },
      { name: 'USDJPY', avgSharpe: 1.23, strategies: 11234, winRate: 56.8 },
      { name: 'GOLD', avgSharpe: 1.45, strategies: 9876, winRate: 61.2 },
      { name: 'BTC/USD', avgSharpe: 1.67, strategies: 8765, winRate: 59.4 }
    ],

    marketConditions: {
      trending: 45.7,
      ranging: 54.3,
      highVolatility: 32.1,
      lowVolatility: 67.9,
      bullish: 58.9,
      bearish: 41.1
    },

    recentActivity: [
      { user: 'Trader_Alex', achievement: 'Sharpe 3.2 en EURUSD', time: '2 horas' },
      { user: 'Maria_FX', achievement: 'Win Rate 89% con WFM', time: '4 horas' },
      { user: 'CryptoKing', achievement: 'Portfolio +245% YTD', time: '6 horas' },
      { user: 'AlgoMaster', achievement: 'Nuevo récord Profit Factor 4.1', time: '8 horas' }
    ]
  };

  // 📊 CALCULAR POSICIÓN DEL USUARIO EN PERCENTILES
  const calculateUserPercentile = (userValue, metric) => {
    if (!userValue || !globalData) return 0;

    const benchmarks = globalData.globalBenchmarks[metric];
    if (!benchmarks) return 0;

    const percentiles = benchmarks.percentiles;
    const value = parseFloat(userValue);

    // Para drawdown, menor es mejor (invertir lógica)
    if (metric === 'maxDrawdown') {
      if (value <= percentiles.p99) return 99;
      if (value <= percentiles.p95) return 95;
      if (value <= percentiles.p90) return 90;
      if (value <= percentiles.p75) return 75;
      if (value <= percentiles.p50) return 50;
      if (value <= percentiles.p25) return 25;
      return 10;
    }

    // Para el resto, mayor es mejor
    if (value >= percentiles.p99) return 99;
    if (value >= percentiles.p95) return 95;
    if (value >= percentiles.p90) return 90;
    if (value >= percentiles.p75) return 75;
    if (value >= percentiles.p50) return 50;
    if (value >= percentiles.p25) return 25;
    return 10;
  };

  // 🎨 OBTENER COLOR SEGÚN PERCENTIL
  const getPercentileColor = (percentile) => {
    if (percentile >= 90) return '#10b981'; // Verde brillante
    if (percentile >= 75) return '#22c55e'; // Verde
    if (percentile >= 50) return '#f59e0b'; // Amarillo
    if (percentile >= 25) return '#f97316'; // Naranja
    return '#ef4444'; // Rojo
  };

  // 🏆 OBTENER BADGE SEGÚN PERCENTIL
  const getPercentileBadge = (percentile) => {
    if (percentile >= 99) return { icon: '👑', label: 'Elite', color: '#8b5cf6' };
    if (percentile >= 95) return { icon: '🥇', label: 'Top 5%', color: '#f59e0b' };
    if (percentile >= 90) return { icon: '🥈', label: 'Top 10%', color: '#6b7280' };
    if (percentile >= 75) return { icon: '🥉', label: 'Top 25%', color: '#cd7c2f' };
    if (percentile >= 50) return { icon: '📊', label: 'Above Avg', color: '#3b82f6' };
    return { icon: '📈', label: 'Below Avg', color: '#6b7280' };
  };

  // 🚀 CARGAR DATOS GLOBALES
  const loadGlobalData = async () => {
    setLoading(true);
    try {
      // Simular carga de API
      await new Promise(resolve => setTimeout(resolve, 1500));
      setGlobalData(mockGlobalData);
    } catch (error) {
      console.error('Error cargando datos globales:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGlobalData();
  }, [timeRange]);

  // 📊 DATOS DEL USUARIO (simulados basados en IA actual)
  const userData = {
    sharpe: userStats.avgSharpe || 0.04, // Del análisis IA anterior
    winRate: userStats.avgWinRate || 45.5,
    profitFactor: userStats.avgProfitFactor || 1.22,
    maxDrawdown: userStats.avgMaxDrawdown || 0.1
  };

  if (loading) {
    return (
      <div style={{
        padding: '40px',
        textAlign: 'center',
        background: 'var(--bg-secondary)',
        borderRadius: '15px',
        margin: '30px 0'
      }}>
        <div style={{
          width: '60px',
          height: '60px',
          border: '4px solid var(--border-color)',
          borderTop: '4px solid var(--primary-color)',
          borderRadius: '50%',
          animation: 'spin 1s linear infinite',
          margin: '0 auto 20px'
        }} />
        <h3 style={{ color: 'var(--text-primary)', margin: '0 0 10px 0' }}>
          Cargando Dashboard Global...
        </h3>
        <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
          Analizando datos de {mockGlobalData.totalUsers.toLocaleString()} traders worldwide
        </p>
      </div>
    );
  }

  return (
    <div style={{
      padding: '25px',
      background: 'var(--bg-secondary)',
      borderRadius: '15px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginTop: '30px',
      border: '1px solid var(--border-color)'
    }}>
      
      {/* HEADER */}
      <h2 style={{ 
        margin: '0 0 30px 0', 
        color: 'var(--text-primary)', 
        textAlign: 'center',
        fontSize: '1.8em',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '10px'
      }}>
        <span style={{ 
          background: 'linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '32px'
        }}>
          🌍
        </span>
        Dashboard Global - Benchmarking Mundial
      </h2>

      {/* CONTROLES */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <select
          value={selectedMetric}
          onChange={(e) => setSelectedMetric(e.target.value)}
          style={{
            padding: '8px 15px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <option value="sharpe">Sharpe Ratio</option>
          <option value="winRate">Win Rate</option>
          <option value="profitFactor">Profit Factor</option>
          <option value="maxDrawdown">Max Drawdown</option>
        </select>

        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          style={{
            padding: '8px 15px',
            borderRadius: '8px',
            border: '1px solid var(--border-color)',
            background: 'var(--bg-primary)',
            color: 'var(--text-primary)',
            cursor: 'pointer'
          }}
        >
          <option value="all_time">All Time</option>
          <option value="ytd">Year to Date</option>
          <option value="last_quarter">Last Quarter</option>
          <option value="last_month">Last Month</option>
        </select>
      </div>

      {/* ESTADÍSTICAS GLOBALES */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        {[
          { label: 'Traders Activos', value: globalData?.totalUsers?.toLocaleString(), icon: '👥', color: '#3b82f6' },
          { label: 'Estrategias Totales', value: globalData?.totalStrategies?.toLocaleString(), icon: '🎯', color: '#10b981' },
          { label: 'Backtests Realizados', value: globalData?.totalBacktests?.toLocaleString(), icon: '🧪', color: '#f59e0b' },
          { label: 'Performance Media', value: `${globalData?.globalBenchmarks?.[selectedMetric]?.average || 0}`, icon: '📊', color: '#8b5cf6' }
        ].map((stat, index) => (
          <div key={index} style={{
            background: 'var(--bg-primary)',
            padding: '20px',
            borderRadius: '12px',
            textAlign: 'center',
            border: '1px solid var(--border-color)'
          }}>
            <div style={{ fontSize: '2em', marginBottom: '8px' }}>{stat.icon}</div>
            <div style={{ 
              fontSize: '1.8em', 
              fontWeight: 'bold', 
              color: stat.color,
              marginBottom: '5px' 
            }}>
              {stat.value}
            </div>
            <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
              {stat.label}
            </div>
          </div>
        ))}
      </div>

      {/* COMPARACIÓN PERSONAL VS GLOBAL */}
      <div style={{
        background: 'var(--bg-primary)',
        padding: '25px',
        borderRadius: '15px',
        marginBottom: '30px',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          color: 'var(--text-primary)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '24px' }}>📈</span>
          Tu Performance vs Global - {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
        </h3>

        {globalData && (
          <div>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
              gap: '20px',
              marginBottom: '25px'
            }}>
              {/* TU VALOR */}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
                borderRadius: '12px',
                color: 'white'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>
                  Tu {selectedMetric === 'maxDrawdown' ? 'Max Drawdown' : selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
                </div>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '5px' }}>
                  {userData[selectedMetric]?.toFixed(2) || '0.00'}
                  {selectedMetric === 'winRate' || selectedMetric === 'maxDrawdown' ? '%' : ''}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  Tu valor personal
                </div>
              </div>

              {/* PROMEDIO GLOBAL */}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: 'var(--bg-secondary)',
                borderRadius: '12px',
                border: '2px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '5px' }}>
                  Promedio Global
                </div>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '5px', color: 'var(--text-primary)' }}>
                  {globalData.globalBenchmarks[selectedMetric]?.average?.toFixed(2)}
                  {selectedMetric === 'winRate' || selectedMetric === 'maxDrawdown' ? '%' : ''}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  Media de {globalData.totalUsers?.toLocaleString()} traders
                </div>
              </div>

              {/* TU PERCENTIL */}
              <div style={{
                textAlign: 'center',
                padding: '20px',
                background: getPercentileColor(calculateUserPercentile(userData[selectedMetric], selectedMetric)),
                borderRadius: '12px',
                color: 'white'
              }}>
                <div style={{ fontSize: '14px', opacity: 0.9, marginBottom: '5px' }}>
                  Tu Posición Global
                </div>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '5px' }}>
                  {getPercentileBadge(calculateUserPercentile(userData[selectedMetric], selectedMetric)).icon}
                </div>
                <div style={{ fontSize: '16px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Percentil {calculateUserPercentile(userData[selectedMetric], selectedMetric)}
                </div>
                <div style={{ fontSize: '12px', opacity: 0.8 }}>
                  {getPercentileBadge(calculateUserPercentile(userData[selectedMetric], selectedMetric)).label}
                </div>
              </div>
            </div>

            {/* BARRA DE PERCENTILES */}
            <div style={{
              background: 'var(--bg-secondary)',
              padding: '20px',
              borderRadius: '12px',
              border: '1px solid var(--border-color)'
            }}>
              <h4 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)', textAlign: 'center' }}>
                Distribución Global - {selectedMetric.charAt(0).toUpperCase() + selectedMetric.slice(1)}
              </h4>
              
              <div style={{
                display: 'flex',
                height: '60px',
                borderRadius: '30px',
                overflow: 'hidden',
                marginBottom: '15px',
                position: 'relative'
              }}>
                <div style={{ flex: 1, background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                  Bottom 25%
                </div>
                <div style={{ flex: 1, background: '#f97316', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                  25-50%
                </div>
                <div style={{ flex: 1, background: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                  50-75%
                </div>
                <div style={{ flex: 0.5, background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                  75-90%
                </div>
                <div style={{ flex: 0.3, background: '#10b981', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                  90-95%
                </div>
                <div style={{ flex: 0.2, background: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '12px', fontWeight: 'bold' }}>
                  Top 5%
                </div>
                
                {/* INDICADOR DE POSICIÓN DEL USUARIO */}
                <div style={{
                  position: 'absolute',
                  left: `${calculateUserPercentile(userData[selectedMetric], selectedMetric)}%`,
                  top: '-10px',
                  transform: 'translateX(-50%)',
                  width: '20px',
                  height: '80px',
                  background: '#1f2937',
                  borderRadius: '10px',
                  border: '3px solid #fbbf24',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '12px'
                }}>
                  👤
                </div>
              </div>
              
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                fontSize: '12px',
                color: 'var(--text-secondary)'
              }}>
                <span>Peor</span>
                <span style={{ color: 'var(--primary-color)', fontWeight: 'bold' }}>
                  Tú estás aquí (P{calculateUserPercentile(userData[selectedMetric], selectedMetric)})
                </span>
                <span>Mejor</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* RANKINGS GLOBALES */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '25px', marginBottom: '30px' }}>
        
        {/* TOP TÉCNICAS */}
        <div style={{
          background: 'var(--bg-primary)',
          padding: '25px',
          borderRadius: '15px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>🏆</span>
            Top Técnicas Globales
          </h3>
          
          {globalData?.topTechniques?.map((technique, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              marginBottom: '8px',
              background: index < 3 ? 'rgba(16, 185, 129, 0.1)' : 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {technique.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {technique.users.toLocaleString()} usuarios
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: '#10b981' }}>
                  {technique.avgSharpe.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {technique.winRate}% WR
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* TOP ACTIVOS */}
        <div style={{
          background: 'var(--bg-primary)',
          padding: '25px',
          borderRadius: '15px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{
            margin: '0 0 20px 0',
            color: 'var(--text-primary)',
            display: 'flex',
            alignItems: 'center',
            gap: '10px'
          }}>
            <span style={{ fontSize: '20px' }}>💰</span>
            Top Activos Globales
          </h3>
          
          {globalData?.topAssets?.map((asset, index) => (
            <div key={index} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '12px',
              marginBottom: '8px',
              background: index < 3 ? 'rgba(59, 130, 246, 0.1)' : 'var(--bg-secondary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ fontSize: '18px' }}>
                  {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`}
                </span>
                <div>
                  <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                    {asset.name}
                  </div>
                  <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                    {asset.strategies.toLocaleString()} estrategias
                  </div>
                </div>
              </div>
              
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontWeight: 'bold', color: '#3b82f6' }}>
                  {asset.avgSharpe.toFixed(2)}
                </div>
                <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                  {asset.winRate}% WR
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* CONDICIONES DE MERCADO GLOBALES */}
      <div style={{
        background: 'var(--bg-primary)',
        padding: '25px',
        borderRadius: '15px',
        marginBottom: '30px',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          color: 'var(--text-primary)',
          textAlign: 'center',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '24px' }}>📊</span>
          Condiciones de Mercado Globales
        </h3>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: '15px'
        }}>
          {[
            { label: 'Trending', value: globalData?.marketConditions?.trending, color: '#10b981', icon: '📈' },
            { label: 'Ranging', value: globalData?.marketConditions?.ranging, color: '#f59e0b', icon: '📊' },
            { label: 'Alta Volatilidad', value: globalData?.marketConditions?.highVolatility, color: '#ef4444', icon: '⚡' },
            { label: 'Baja Volatilidad', value: globalData?.marketConditions?.lowVolatility, color: '#3b82f6', icon: '😴' },
            { label: 'Sentiment Alcista', value: globalData?.marketConditions?.bullish, color: '#22c55e', icon: '🐂' },
            { label: 'Sentiment Bajista', value: globalData?.marketConditions?.bearish, color: '#dc2626', icon: '🐻' }
          ].map((condition, index) => (
            <div key={index} style={{
              textAlign: 'center',
              padding: '15px',
              background: 'var(--bg-secondary)',
              borderRadius: '10px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '24px', marginBottom: '8px' }}>{condition.icon}</div>
              <div style={{ 
                fontSize: '1.5em', 
                fontWeight: 'bold', 
                color: condition.color,
                marginBottom: '5px' 
              }}>
                {condition.value?.toFixed(1)}%
              </div>
              <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                {condition.label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ACTIVIDAD RECIENTE */}
      <div style={{
        background: 'var(--bg-primary)',
        padding: '25px',
        borderRadius: '15px',
        border: '1px solid var(--border-color)'
      }}>
        <h3 style={{
          margin: '0 0 20px 0',
          color: 'var(--text-primary)',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '20px' }}>🔥</span>
          Actividad Reciente Global
        </h3>

        {globalData?.recentActivity?.map((activity, index) => (
          <div key={index} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px',
            marginBottom: '8px',
            background: 'var(--bg-secondary)',
            borderRadius: '8px',
            border: '1px solid var(--border-color)'
          }}>
            <div>
              <span style={{ fontWeight: 'bold', color: 'var(--primary-color)' }}>
                {activity.user}
              </span>
              <span style={{ color: 'var(--text-secondary)', marginLeft: '8px' }}>
                {activity.achievement}
              </span>
            </div>
            <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              hace {activity.time}
            </div>
          </div>
        ))}
      </div>

      {/* CSS ANIMATIONS */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>

    </div>
  );
};

export default DashboardGlobal;
