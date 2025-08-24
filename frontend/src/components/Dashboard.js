import React, { useState, useEffect } from 'react';

const Dashboard = ({ user, supabase }) => {
  const [dashboardData, setDashboardData] = useState({
    totalBots: 0,
    activeBots: 0,
    generatedBots: 0,
    totalSimulations: 0,
    topTechniques: [],
    assetDistribution: [],
    timeframeDistribution: [],
    recentActivity: [],
    performanceMetrics: null
  });
  const [loading, setLoading] = useState(true);
  const [selectedDateRange, setSelectedDateRange] = useState('7d');
  const [selectedTechnique, setSelectedTechnique] = useState('all');
  const [selectedAsset, setSelectedAsset] = useState('all');

  // Cargar datos del dashboard
  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user, selectedDateRange, selectedTechnique, selectedAsset]);

  const loadDashboardData = async () => {
    setLoading(true);
    try {
      // Construir query con filtros
      let query = supabase
        .from('bot_configurations')
        .select('*')
        .eq('user_id', user.id);

      // Aplicar filtros de fecha
      if (selectedDateRange !== 'all') {
        const daysAgo = parseInt(selectedDateRange.replace('d', ''));
        const dateLimit = new Date();
        dateLimit.setDate(dateLimit.getDate() - daysAgo);
        query = query.gte('fecha_creacion', dateLimit.toISOString());
      }

      const { data: bots, error } = await query.order('fecha_creacion', { ascending: false });

      if (error) throw error;

      // Procesar datos para el dashboard
      const processedData = processBotData(bots || []);
      setDashboardData(processedData);

    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const processBotData = (bots) => {
    // Filtrar por técnica si está seleccionada
    let filteredBots = bots;
    if (selectedTechnique !== 'all') {
      filteredBots = bots.filter(bot => 
        bot.tecnicas_simulaciones && 
        Object.keys(bot.tecnicas_simulaciones).includes(selectedTechnique)
      );
    }

    // Filtrar por activo si está seleccionado
    if (selectedAsset !== 'all') {
      filteredBots = filteredBots.filter(bot => bot.activo === selectedAsset);
    }

    // Calcular métricas básicas
    const totalBots = filteredBots.length;
    const activeBots = filteredBots.filter(bot => bot.estado === 'Activo').length;
    const generatedBots = filteredBots.filter(bot => bot.estado === 'Generado').length;
    const totalSimulations = filteredBots.reduce((sum, bot) => sum + (bot.total_simulaciones || 0), 0);

    // Analizar distribución por técnicas
    const techniqueStats = {};
    filteredBots.forEach(bot => {
      if (bot.tecnicas_simulaciones) {
        Object.keys(bot.tecnicas_simulaciones).forEach(technique => {
          if (!techniqueStats[technique]) {
            techniqueStats[technique] = { count: 0, simulations: 0, bots: [] };
          }
          techniqueStats[technique].count++;
          techniqueStats[technique].simulations += bot.tecnicas_simulaciones[technique].simulaciones || 0;
          techniqueStats[technique].bots.push(bot);
        });
      }
    });

    const topTechniques = Object.entries(techniqueStats)
      .map(([name, stats]) => ({
        name,
        count: stats.count,
        simulations: stats.simulations,
        avgSimulations: Math.round(stats.simulations / stats.count),
        percentage: ((stats.count / totalBots) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 6);

    // Distribución por activos
    const assetStats = {};
    filteredBots.forEach(bot => {
      assetStats[bot.activo] = (assetStats[bot.activo] || 0) + 1;
    });

    const assetDistribution = Object.entries(assetStats)
      .map(([asset, count]) => ({
        asset,
        count,
        percentage: ((count / totalBots) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);

    // Distribución por temporalidades
    const timeframeStats = {};
    filteredBots.forEach(bot => {
      timeframeStats[bot.temporalidad] = (timeframeStats[bot.temporalidad] || 0) + 1;
    });

    const timeframeDistribution = Object.entries(timeframeStats)
      .map(([timeframe, count]) => ({
        timeframe,
        count,
        percentage: ((count / totalBots) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count);

    // Actividad reciente (últimos 10 bots)
    const recentActivity = filteredBots.slice(0, 10).map(bot => ({
      id: bot.id,
      name: bot.nombre_base,
      activo: bot.activo,
      temporalidad: bot.temporalidad,
      direccion: bot.direccion,
      estado: bot.estado,
      fecha_creacion: bot.fecha_creacion,
      total_simulaciones: bot.total_simulaciones,
      techniques: bot.tecnicas_simulaciones ? Object.keys(bot.tecnicas_simulaciones) : []
    }));

    // Métricas de performance simuladas (en el futuro vendrán de backtesting real)
    const performanceMetrics = calculatePerformanceMetrics(filteredBots);

    return {
      totalBots,
      activeBots,
      generatedBots,
      totalSimulations,
      topTechniques,
      assetDistribution,
      timeframeDistribution,
      recentActivity,
      performanceMetrics
    };
  };

  const calculatePerformanceMetrics = (bots) => {
    // Simulamos métricas de performance (en producción vendrían de resultados reales)
    const totalBots = bots.length;
    if (totalBots === 0) return null;

    // Simulamos diferentes win rates basados en las técnicas utilizadas
    const winRates = bots.map(bot => {
      const techniques = bot.tecnicas_simulaciones ? Object.keys(bot.tecnicas_simulaciones) : ['SPP'];
      
      // Win rates simulados por técnica (estos vendrían de backtesting real)
      const baseWinRates = {
        'SPP': 0.65,
        'WFM': 0.72,
        'MC Trade': 0.58,
        'MC Lento': 0.68,
        'Secuencial': 0.61,
        'High Back Test Precision': 0.78
      };

      const avgWinRate = techniques.reduce((sum, tech) => sum + (baseWinRates[tech] || 0.60), 0) / techniques.length;
      return avgWinRate + (Math.random() - 0.5) * 0.15; // Añadir variabilidad
    });

    const avgWinRate = winRates.reduce((sum, rate) => sum + rate, 0) / winRates.length;
    const maxDrawdown = Math.random() * 0.25 + 0.05; // 5-30%
    const sharpeRatio = Math.random() * 2 + 0.5; // 0.5-2.5
    const profitFactor = Math.random() * 2 + 1.2; // 1.2-3.2

    return {
      avgWinRate: (avgWinRate * 100).toFixed(1),
      maxDrawdown: (maxDrawdown * 100).toFixed(1),
      sharpeRatio: sharpeRatio.toFixed(2),
      profitFactor: profitFactor.toFixed(2),
      consistency: (Math.random() * 30 + 70).toFixed(1) // 70-100%
    };
  };

  const getUniqueAssets = () => {
    const { data: bots } = supabase
      .from('bot_configurations')
      .select('activo')
      .eq('user_id', user.id);
    
    // Por ahora retornamos assets comunes, en producción vendría de la query
    return ['EURUSD', 'GBPUSD', 'USDJPY', 'GOLD', 'BTC', 'ETH'];
  };

  const formatNumber = (num) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const getPerformanceColor = (value, type) => {
    switch (type) {
      case 'winRate':
        return parseFloat(value) >= 70 ? '#28a745' : parseFloat(value) >= 60 ? '#ffc107' : '#dc3545';
      case 'drawdown':
        return parseFloat(value) <= 10 ? '#28a745' : parseFloat(value) <= 20 ? '#ffc107' : '#dc3545';
      case 'sharpe':
        return parseFloat(value) >= 1.5 ? '#28a745' : parseFloat(value) >= 1.0 ? '#ffc107' : '#dc3545';
      case 'profitFactor':
        return parseFloat(value) >= 2.0 ? '#28a745' : parseFloat(value) >= 1.5 ? '#ffc107' : '#dc3545';
      default:
        return '#007bff';
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '400px',
        fontSize: '18px'
      }}>
        📊 Cargando Dashboard Analytics...
      </div>
    );
  }

  return (
    <div style={{
      background: 'white',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      maxWidth: '1400px',
      margin: '20px auto'
    }}>
      {/* Header */}
      <div style={{ marginBottom: '30px' }}>
        <h1 style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          margin: '0 0 20px 0',
          padding: '20px',
          borderRadius: '10px',
          fontSize: '2em',
          textAlign: 'center'
        }}>
          📊 Dashboard Analytics
        </h1>

        {/* Filtros */}
        <div style={{
          display: 'flex',
          gap: '15px',
          flexWrap: 'wrap',
          alignItems: 'center',
          padding: '15px',
          background: '#f8f9fa',
          borderRadius: '10px'
        }}>
          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '8px' }}>Período:</label>
            <select
              value={selectedDateRange}
              onChange={(e) => setSelectedDateRange(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              <option value="7d">Últimos 7 días</option>
              <option value="30d">Últimos 30 días</option>
              <option value="90d">Últimos 90 días</option>
              <option value="all">Todo el tiempo</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '8px' }}>Técnica:</label>
            <select
              value={selectedTechnique}
              onChange={(e) => setSelectedTechnique(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              <option value="all">Todas las técnicas</option>
              <option value="SPP">SPP</option>
              <option value="WFM">WFM</option>
              <option value="MC Trade">MC Trade</option>
              <option value="MC Lento">MC Lento</option>
              <option value="Secuencial">Secuencial</option>
              <option value="High Back Test Precision">High Back Test Precision</option>
            </select>
          </div>

          <div>
            <label style={{ fontSize: '14px', fontWeight: 'bold', marginRight: '8px' }}>Activo:</label>
            <select
              value={selectedAsset}
              onChange={(e) => setSelectedAsset(e.target.value)}
              style={{
                padding: '6px 12px',
                border: '1px solid #ddd',
                borderRadius: '5px',
                fontSize: '14px'
              }}
            >
              <option value="all">Todos los activos</option>
              {getUniqueAssets().map(asset => (
                <option key={asset} value={asset}>{asset}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* KPIs Principales */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
        gap: '20px',
        marginBottom: '30px'
      }}>
        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          borderRadius: '15px'
        }}>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '5px' }}>
            {dashboardData.totalBots}
          </div>
          <div style={{ fontSize: '16px', opacity: 0.9 }}>Total Bots</div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
          color: 'white',
          borderRadius: '15px'
        }}>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '5px' }}>
            {dashboardData.activeBots}
          </div>
          <div style={{ fontSize: '16px', opacity: 0.9 }}>Bots Activos</div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #ffc107 0%, #fd7e14 100%)',
          color: 'white',
          borderRadius: '15px'
        }}>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '5px' }}>
            {formatNumber(dashboardData.totalSimulations)}
          </div>
          <div style={{ fontSize: '16px', opacity: 0.9 }}>Total Simulaciones</div>
        </div>

        <div style={{
          textAlign: 'center',
          padding: '20px',
          background: 'linear-gradient(135deg, #e83e8c 0%, #fd7e14 100%)',
          color: 'white',
          borderRadius: '15px'
        }}>
          <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '5px' }}>
            {dashboardData.topTechniques.length}
          </div>
          <div style={{ fontSize: '16px', opacity: 0.9 }}>Técnicas Usadas</div>
        </div>
      </div>

      {/* Métricas de Performance */}
      {dashboardData.performanceMetrics && (
        <div style={{
          marginBottom: '30px',
          padding: '25px',
          background: '#f8f9fa',
          borderRadius: '15px'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333', textAlign: 'center' }}>
            🎯 Métricas de Performance
          </h3>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '15px'
          }}>
            <div style={{
              textAlign: 'center',
              padding: '15px',
              background: 'white',
              borderRadius: '10px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{
                fontSize: '1.8em',
                fontWeight: 'bold',
                color: getPerformanceColor(dashboardData.performanceMetrics.avgWinRate, 'winRate'),
                marginBottom: '5px'
              }}>
                {dashboardData.performanceMetrics.avgWinRate}%
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Win Rate Promedio</div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '15px',
              background: 'white',
              borderRadius: '10px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{
                fontSize: '1.8em',
                fontWeight: 'bold',
                color: getPerformanceColor(dashboardData.performanceMetrics.maxDrawdown, 'drawdown'),
                marginBottom: '5px'
              }}>
                {dashboardData.performanceMetrics.maxDrawdown}%
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Max Drawdown</div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '15px',
              background: 'white',
              borderRadius: '10px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{
                fontSize: '1.8em',
                fontWeight: 'bold',
                color: getPerformanceColor(dashboardData.performanceMetrics.sharpeRatio, 'sharpe'),
                marginBottom: '5px'
              }}>
                {dashboardData.performanceMetrics.sharpeRatio}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Sharpe Ratio</div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '15px',
              background: 'white',
              borderRadius: '10px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{
                fontSize: '1.8em',
                fontWeight: 'bold',
                color: getPerformanceColor(dashboardData.performanceMetrics.profitFactor, 'profitFactor'),
                marginBottom: '5px'
              }}>
                {dashboardData.performanceMetrics.profitFactor}
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Profit Factor</div>
            </div>

            <div style={{
              textAlign: 'center',
              padding: '15px',
              background: 'white',
              borderRadius: '10px',
              border: '2px solid #e9ecef'
            }}>
              <div style={{
                fontSize: '1.8em',
                fontWeight: 'bold',
                color: '#17a2b8',
                marginBottom: '5px'
              }}>
                {dashboardData.performanceMetrics.consistency}%
              </div>
              <div style={{ fontSize: '14px', color: '#666' }}>Consistencia</div>
            </div>
          </div>
        </div>
      )}

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px', marginBottom: '30px' }}>
        
        {/* Top Técnicas */}
        <div style={{
          padding: '25px',
          background: '#fff',
          borderRadius: '15px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>🧠 Top Técnicas de Minería</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {dashboardData.topTechniques.map((technique, index) => (
              <div key={technique.name} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 15px',
                background: `hsl(${index * 60}, 70%, 95%)`,
                borderRadius: '8px',
                border: `2px solid hsl(${index * 60}, 70%, 80%)`
              }}>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{technique.name}</div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {formatNumber(technique.simulations)} simulaciones
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontWeight: 'bold', color: `hsl(${index * 60}, 70%, 40%)` }}>
                    {technique.count} bots
                  </div>
                  <div style={{ fontSize: '12px', color: '#666' }}>
                    {technique.percentage}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Distribución por Activos */}
        <div style={{
          padding: '25px',
          background: '#fff',
          borderRadius: '15px',
          border: '1px solid #e9ecef',
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>💱 Distribución por Activos</h3>
          <div style={{ display: 'grid', gap: '12px' }}>
            {dashboardData.assetDistribution.slice(0, 8).map((asset, index) => (
              <div key={asset.asset} style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                padding: '12px 15px',
                background: '#f8f9fa',
                borderRadius: '8px',
                border: '1px solid #e9ecef'
              }}>
                <div style={{ fontWeight: 'bold', fontSize: '14px' }}>{asset.asset}</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{
                    width: `${Math.max(asset.percentage * 2, 20)}px`,
                    height: '6px',
                    background: `hsl(${200 + index * 20}, 70%, 60%)`,
                    borderRadius: '3px'
                  }}></div>
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>
                    {asset.count} ({asset.percentage}%)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Actividad Reciente */}
      <div style={{
        padding: '25px',
        background: '#fff',
        borderRadius: '15px',
        border: '1px solid #e9ecef',
        boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        <h3 style={{ margin: '0 0 20px 0', color: '#333' }}>⚡ Actividad Reciente</h3>
        <div style={{ display: 'grid', gap: '10px' }}>
          {dashboardData.recentActivity.map((bot, index) => (
            <div key={bot.id} style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              padding: '15px',
              background: index % 2 === 0 ? '#f8f9fa' : 'white',
              borderRadius: '8px',
              border: '1px solid #e9ecef'
            }}>
              <div>
                <div style={{ fontWeight: 'bold', fontSize: '14px', marginBottom: '5px' }}>
                  {bot.name}
                </div>
                <div style={{ fontSize: '12px', color: '#666' }}>
                  {bot.activo} • {bot.temporalidad} • {bot.direccion} 
                  {bot.techniques.length > 0 && ` • ${bot.techniques.join('+')}`}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{
                  padding: '4px 8px',
                  background: bot.estado === 'Activo' ? '#d4edda' : '#fff3cd',
                  color: bot.estado === 'Activo' ? '#155724' : '#856404',
                  borderRadius: '12px',
                  fontSize: '12px',
                  fontWeight: 'bold',
                  marginBottom: '5px'
                }}>
                  {bot.estado}
                </div>
                <div style={{ fontSize: '11px', color: '#999' }}>
                  {formatNumber(bot.total_simulaciones || 0)} sim
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
