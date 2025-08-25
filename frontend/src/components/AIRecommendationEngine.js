import React, { useState, useEffect } from 'react';

const AIRecommendationEngine = ({ user, supabase, backtestResults = [], userBots = [] }) => {
  const [aiInsights, setAiInsights] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [performanceScores, setPerformanceScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState([]);

  // 🐛 DEBUG: Agregar useEffect para monitorear datos
  useEffect(() => {
    console.log('🔍 AIRecommendationEngine - Debug Info:');
    console.log('- backtestResults:', backtestResults);
    console.log('- backtestResults.length:', backtestResults?.length);
    console.log('- user:', user);
    console.log('- loading:', loading);
  }, [backtestResults, user, loading]);

  // 🧠 MOTOR DE ANÁLISIS INTELIGENTE SIMPLIFICADO (para testing)
  const analyzeBacktestData = (results) => {
    console.log('📊 Analizando datos:', results);
    
    if (!results || results.length === 0) {
      console.log('❌ No hay datos para analizar');
      return null;
    }

    const techniquePerformance = {};
    const assetPerformance = {};
    
    results.forEach(result => {
      console.log('🔎 Procesando resultado:', result);
      
      // Performance por técnica
      const mainTechnique = Object.keys(result.tecnicas || {})[0] || 'Unknown';
      if (!techniquePerformance[mainTechnique]) {
        techniquePerformance[mainTechnique] = {
          count: 0,
          totalSharpe: 0,
          totalWinRate: 0
        };
      }
      
      techniquePerformance[mainTechnique].count++;
      techniquePerformance[mainTechnique].totalSharpe += parseFloat(result.sharpeRatio || 0);
      techniquePerformance[mainTechnique].totalWinRate += parseFloat(result.winRate || 0);

      // Performance por activo
      const asset = result.activo || 'Unknown';
      if (!assetPerformance[asset]) {
        assetPerformance[asset] = {
          count: 0,
          totalSharpe: 0
        };
      }
      
      assetPerformance[asset].count++;
      assetPerformance[asset].totalSharpe += parseFloat(result.sharpeRatio || 0);
    });

    // Calcular promedios
    Object.keys(techniquePerformance).forEach(technique => {
      const data = techniquePerformance[technique];
      data.avgSharpe = data.totalSharpe / data.count;
      data.avgWinRate = data.totalWinRate / data.count;
    });

    Object.keys(assetPerformance).forEach(asset => {
      const data = assetPerformance[asset];
      data.avgSharpe = data.totalSharpe / data.count;
    });

    console.log('✅ Análisis completado:', {
      techniquePerformance,
      assetPerformance,
      totalConfigs: results.length
    });

    return {
      techniquePerformance,
      assetPerformance,
      totalConfigs: results.length,
      avgPerformance: {
        sharpe: results.reduce((sum, r) => sum + parseFloat(r.sharpeRatio || 0), 0) / results.length,
        winRate: results.reduce((sum, r) => sum + parseFloat(r.winRate || 0), 0) / results.length
      }
    };
  };

  // 🎯 GENERADOR DE RECOMENDACIONES SIMPLIFICADO
  const generateRecommendations = (analysis) => {
    console.log('💡 Generando recomendaciones:', analysis);
    
    if (!analysis) return [];

    const recommendations = [];

    // Recomendación de mejor técnica
    const bestTechnique = Object.entries(analysis.techniquePerformance)
      .sort((a, b) => b[1].avgSharpe - a[1].avgSharpe)[0];
    
    if (bestTechnique) {
      recommendations.push({
        type: 'technique',
        priority: 'high',
        title: `🧠 Tu mejor técnica: ${bestTechnique[0]}`,
        description: `Sharpe promedio: ${bestTechnique[1].avgSharpe.toFixed(2)} | Win Rate: ${bestTechnique[1].avgWinRate.toFixed(1)}%`,
        action: `Considera enfocar más configuraciones en ${bestTechnique[0]}`,
        confidence: 85,
        category: 'strategy'
      });
    }

    // Recomendación de mejor activo
    const bestAsset = Object.entries(analysis.assetPerformance)
      .sort((a, b) => b[1].avgSharpe - a[1].avgSharpe)[0];
    
    if (bestAsset) {
      recommendations.push({
        type: 'asset',
        priority: 'high',
        title: `💰 Tu activo más rentable: ${bestAsset[0]}`,
        description: `Sharpe promedio: ${bestAsset[1].avgSharpe.toFixed(2)} con ${bestAsset[1].count} configuraciones`,
        action: `Aumenta allocation en ${bestAsset[0]}`,
        confidence: 80,
        category: 'asset'
      });
    }

    console.log('✅ Recomendaciones generadas:', recommendations);
    return recommendations;
  };

  // 📈 CALCULADORA DE SCORING SIMPLIFICADO
  const calculateDynamicScores = (results) => {
    console.log('🏆 Calculando scores:', results);
    
    return results.map((result, index) => {
      let score = 50;

      const sharpe = parseFloat(result.sharpeRatio || 0);
      const winRate = parseFloat(result.winRate || 0);

      if (sharpe > 2) score += 30;
      else if (sharpe > 1) score += 20;
      else if (sharpe > 0.5) score += 10;

      if (winRate > 70) score += 20;
      else if (winRate > 60) score += 15;
      else if (winRate > 50) score += 10;

      return {
        ...result,
        aiScore: Math.min(100, Math.max(0, score))
      };
    }).sort((a, b) => b.aiScore - a.aiScore);
  };

  // 🚀 FUNCIÓN PRINCIPAL CON DEBUG
  const runAIAnalysis = async () => {
    console.log('🚀 INICIANDO ANÁLISIS DE IA');
    console.log('- Datos recibidos:', { backtestResults, user });
    
    try {
      setLoading(true);
      console.log('⏳ Loading activado');
      
      // Verificar datos
      if (!backtestResults || backtestResults.length === 0) {
        console.log('❌ No hay datos de backtesting');
        alert('No hay datos de backtesting. Ejecuta primero el Motor de Backtesting.');
        setLoading(false);
        return;
      }

      console.log('✅ Datos válidos, procesando...');
      
      // Simular procesamiento
      await new Promise(resolve => {
        console.log('⏱️ Esperando 2 segundos...');
        setTimeout(resolve, 2000);
      });
      
      console.log('🔄 Ejecutando análisis...');
      const analysis = analyzeBacktestData(backtestResults);
      
      if (!analysis) {
        console.log('❌ Error en análisis');
        setAiInsights({ error: 'No hay suficientes datos para análisis' });
        setLoading(false);
        return;
      }

      console.log('🎯 Generando recomendaciones...');
      const generatedRecommendations = generateRecommendations(analysis);
      
      console.log('📊 Calculando scores...');
      const dynamicScores = calculateDynamicScores(backtestResults);

      // Guardar resultados
      console.log('💾 Guardando resultados...');
      setAiInsights(analysis);
      setRecommendations(generatedRecommendations);
      setPerformanceScores(dynamicScores);

      console.log('✅ ANÁLISIS COMPLETADO EXITOSAMENTE');
      
    } catch (error) {
      console.error('💥 ERROR EN ANÁLISIS:', error);
      setAiInsights({ error: error.message });
      alert('Error en análisis: ' + error.message);
    } finally {
      setLoading(false);
      console.log('🏁 Loading desactivado');
    }
  };

  // 🐛 DEBUG: Función para probar el botón
  const testButton = () => {
    console.log('🧪 TEST BUTTON CLICKED!');
    alert('¡Botón funcionando! El problema no es el onClick.');
  };

  return (
    <div style={{
      padding: '25px',
      background: 'var(--bg-secondary)',
      borderRadius: '15px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginTop: '30px',
      border: '1px solid var(--border-color)'
    }}>
      
      {/* HEADER CON DEBUG INFO */}
      <h2 style={{ 
        margin: '0 0 20px 0', 
        color: 'var(--text-primary)', 
        textAlign: 'center',
        fontSize: '1.8em'
      }}>
        🤖 Sistema de IA y Recomendaciones (DEBUG MODE)
      </h2>

      {/* INFORMACIÓN DE DEBUG */}
      <div style={{
        background: '#f8f9fa',
        padding: '15px',
        borderRadius: '8px',
        marginBottom: '20px',
        fontSize: '14px',
        fontFamily: 'monospace'
      }}>
        <h4 style={{ margin: '0 0 10px 0', color: '#333' }}>🔍 Debug Info:</h4>
        <div><strong>backtestResults:</strong> {backtestResults ? `${backtestResults.length} items` : 'null/undefined'}</div>
        <div><strong>user:</strong> {user ? 'authenticated' : 'no user'}</div>
        <div><strong>loading:</strong> {loading ? 'true' : 'false'}</div>
        <div><strong>aiInsights:</strong> {aiInsights ? 'has data' : 'no data'}</div>
        <div><strong>recommendations:</strong> {recommendations.length} items</div>
      </div>

      {/* BOTONES DE TEST */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        gap: '15px',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        {/* BOTÓN TEST */}
        <button
          onClick={testButton}
          style={{
            padding: '12px 20px',
            background: '#28a745',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: 'bold'
          }}
        >
          🧪 Test Button (debe funcionar)
        </button>

        {/* BOTÓN PRINCIPAL CON DEBUG */}
        <button
          onClick={() => {
            console.log('🔘 BOTÓN CLICKEADO - Estado actual:', {
              backtestResults: backtestResults?.length,
              loading,
              disabled: loading || !backtestResults || backtestResults.length === 0
            });
            runAIAnalysis();
          }}
          disabled={loading || !backtestResults || backtestResults.length === 0}
          style={{
            padding: '15px 30px',
            background: loading ? '#6c757d' : 
                      (!backtestResults || backtestResults.length === 0) ? '#dc3545' : 
                      'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: loading || (!backtestResults || backtestResults.length === 0) ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            minWidth: '250px'
          }}
        >
          {loading ? '⏳ Analizando...' : 
           (!backtestResults || backtestResults.length === 0) ? '❌ Sin datos' :
           '🧠 Ejecutar Análisis IA'}
        </button>
      </div>

      {/* ESTADO CONDICIONAL */}
      {!backtestResults || backtestResults.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: '#fff3cd',
          borderRadius: '10px',
          border: '1px solid #ffeaa7'
        }}>
          <h3 style={{ color: '#856404' }}>⚠️ No hay datos de backtesting</h3>
          <p style={{ color: '#856404' }}>
            Para usar el Sistema de IA, primero ejecuta el <strong>Motor de Backtesting</strong> 
            y genera algunos resultados.
          </p>
        </div>
      ) : (
        <div style={{
          background: '#d1ecf1',
          padding: '15px',
          borderRadius: '8px',
          textAlign: 'center'
        }}>
          <h4 style={{ margin: '0 0 10px 0', color: '#0c5460' }}>
            ✅ Datos disponibles: {backtestResults.length} resultados
          </h4>
          <p style={{ margin: 0, color: '#0c5460' }}>
            El Sistema de IA está listo para analizar tus datos.
          </p>
        </div>
      )}

      {/* RESULTADOS */}
      {aiInsights && !aiInsights.error && (
        <div style={{ marginTop: '30px' }}>
          <h3 style={{ color: 'var(--text-primary)' }}>✅ Análisis Completado</h3>
          
          {recommendations.length > 0 && (
            <div style={{ marginBottom: '20px' }}>
              <h4 style={{ color: 'var(--text-primary)' }}>💡 Recomendaciones:</h4>
              {recommendations.map((rec, index) => (
                <div key={index} style={{
                  padding: '15px',
                  background: 'var(--bg-primary)',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  border: '1px solid var(--border-color)'
                }}>
                  <h5 style={{ margin: '0 0 8px 0', color: 'var(--primary-color)' }}>
                    {rec.title}
                  </h5>
                  <p style={{ margin: '0 0 8px 0', fontSize: '14px' }}>
                    {rec.description}
                  </p>
                  <div style={{
                    padding: '8px',
                    background: 'rgba(99, 102, 241, 0.1)',
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: 'var(--primary-color)'
                  }}>
                    <strong>Acción:</strong> {rec.action}
                  </div>
                </div>
              ))}
            </div>
          )}

          {performanceScores.length > 0 && (
            <div>
              <h4 style={{ color: 'var(--text-primary)' }}>🏆 Top 3 Estrategias:</h4>
              {performanceScores.slice(0, 3).map((strategy, index) => (
                <div key={index} style={{
                  padding: '10px',
                  background: 'var(--bg-primary)',
                  borderRadius: '6px',
                  marginBottom: '8px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span style={{ fontWeight: 'bold' }}>
                    #{index + 1} - {strategy.configName?.substring(0, 30)}...
                  </span>
                  <span style={{
                    padding: '4px 8px',
                    background: strategy.aiScore >= 80 ? '#28a745' : 
                               strategy.aiScore >= 60 ? '#ffc107' : '#dc3545',
                    color: 'white',
                    borderRadius: '15px',
                    fontSize: '12px'
                  }}>
                    Score: {strategy.aiScore.toFixed(0)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ERROR */}
      {aiInsights?.error && (
        <div style={{
          padding: '20px',
          background: '#f8d7da',
          borderRadius: '8px',
          color: '#721c24',
          marginTop: '20px'
        }}>
          <h4 style={{ margin: '0 0 10px 0' }}>❌ Error en análisis:</h4>
          <p style={{ margin: 0 }}>{aiInsights.error}</p>
        </div>
      )}

    </div>
  );
};

export default AIRecommendationEngine;
