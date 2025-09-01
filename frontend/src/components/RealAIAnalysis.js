// Nuevo archivo: RealAIAnalysis.js
import React, { useState, useEffect } from 'react';

const RealAIAnalysis = ({ user, supabase, onInsightsGenerated }) => {
  const [realInsights, setRealInsights] = useState(null);
  const [loading, setLoading] = useState(false);

  const analyzeRealData = async () => {
    setLoading(true);
    try {
      // 📊 OBTENER BOTS REALES MARCADOS
      const { data: goodBots, error: goodError } = await supabase
        .from('bots')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'good');

      const { data: badBots, error: badError } = await supabase
        .from('bots')
        .select('*')
        .eq('user_id', user.id)
        .eq('status', 'bad');

      if (goodError || badError) throw goodError || badError;

      if (!goodBots.length && !badBots.length) {
        setRealInsights({
          message: 'No hay suficientes datos reales para análisis de IA',
          recommendation: 'Marca más bots como buenos/malos para obtener insights reales'
        });
        return;
      }

      // 🎯 ANÁLISIS REAL DE TÉCNICAS
      const techniqueAnalysis = analyzeRealTechniques(goodBots, badBots);
      
      // 📊 ANÁLISIS DE PARÁMETROS
      const parameterAnalysis = analyzeRealParameters(goodBots, badBots);
      
      // 🎨 GENERAR INSIGHTS REALES
      const insights = {
        totalGoodBots: goodBots.length,
        totalBadBots: badBots.length,
        bestTechniques: techniqueAnalysis.best,
        worstTechniques: techniqueAnalysis.worst,
        optimalParameters: parameterAnalysis,
        confidence: calculateConfidence(goodBots.length + badBots.length),
        lastUpdated: new Date().toISOString()
      };

      setRealInsights(insights);
      
      if (onInsightsGenerated) {
        onInsightsGenerated(insights);
      }

    } catch (error) {
      console.error('Error en análisis real:', error);
      setRealInsights({
        error: 'Error analizando datos reales',
        message: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const analyzeRealTechniques = (goodBots, badBots) => {
    const techniqueStats = {};

    // Analizar bots buenos
    goodBots.forEach(bot => {
      Object.keys(bot.tecnicas || {}).forEach(technique => {
        if (!techniqueStats[technique]) {
          techniqueStats[technique] = { good: 0, bad: 0, totalSharpe: 0 };
        }
        techniqueStats[technique].good++;
        techniqueStats[technique].totalSharpe += parseFloat(bot.sharpe_ratio || 0);
      });
    });

    // Analizar bots malos
    badBots.forEach(bot => {
      Object.keys(bot.tecnicas || {}).forEach(technique => {
        if (!techniqueStats[technique]) {
          techniqueStats[technique] = { good: 0, bad: 0, totalSharpe: 0 };
        }
        techniqueStats[technique].bad++;
      });
    });

    // Calcular scores reales
    const techniques = Object.entries(techniqueStats).map(([name, stats]) => {
      const total = stats.good + stats.bad;
      const successRate = total > 0 ? (stats.good / total) * 100 : 0;
      const avgSharpe = stats.good > 0 ? stats.totalSharpe / stats.good : 0;
      
      return {
        name,
        successRate: successRate.toFixed(1),
        avgSharpe: avgSharpe.toFixed(2),
        goodCount: stats.good,
        badCount: stats.bad,
        score: successRate * 0.7 + (avgSharpe * 10) * 0.3 // Score combinado real
      };
    });

    const sorted = techniques.sort((a, b) => b.score - a.score);

    return {
      best: sorted.slice(0, 3),
      worst: sorted.slice(-2)
    };
  };

  const calculateConfidence = (totalSamples) => {
    if (totalSamples >= 50) return 'Alta';
    if (totalSamples >= 20) return 'Media';
    if (totalSamples >= 10) return 'Baja';
    return 'Insuficiente';
  };

  useEffect(() => {
    if (user) {
      analyzeRealData();
    }
  }, [user]);

  return (
    <div style={{
      padding: '25px',
      background: 'var(--bg-secondary)',
      borderRadius: '15px',
      marginTop: '30px',
      border: '1px solid var(--border-color)'
    }}>
      <h2 style={{ 
        margin: '0 0 20px 0', 
        color: 'var(--text-primary)', 
        textAlign: 'center',
        fontSize: '1.8em'
      }}>
        🤖 Análisis de IA REAL (Basado en Datos Históricos)
      </h2>

      <button
        onClick={analyzeRealData}
        disabled={loading}
        style={{
          padding: '12px 24px',
          background: loading ? '#6c757d' : 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          cursor: loading ? 'not-allowed' : 'pointer',
          fontSize: '16px',
          fontWeight: 'bold',
          marginBottom: '25px',
          width: '100%'
        }}
      >
        {loading ? '🔄 Analizando Datos Reales...' : '🧠 Ejecutar Análisis de IA Real'}
      </button>

      {realInsights && (
        <div>
          {realInsights.error ? (
            <div style={{
              padding: '20px',
              background: 'rgba(239, 68, 68, 0.1)',
              borderRadius: '10px',
              color: '#ef4444',
              textAlign: 'center'
            }}>
              <h3>{realInsights.error}</h3>
              <p>{realInsights.message}</p>
            </div>
          ) : realInsights.message ? (
            <div style={{
              padding: '20px',
              background: 'rgba(59, 130, 246, 0.1)',
              borderRadius: '10px',
              color: '#3b82f6',
              textAlign: 'center'
            }}>
              <h3>{realInsights.message}</h3>
              <p>{realInsights.recommendation}</p>
            </div>
          ) : (
            <div>
              {/* Resultados del análisis real */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
                gap: '20px',
                marginBottom: '25px'
              }}>
                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: '#10b981',
                  color: 'white',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
                    {realInsights.totalGoodBots}
                  </div>
                  <div>Bots Buenos Analizados</div>
                </div>

                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: '#ef4444',
                  color: 'white',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
                    {realInsights.totalBadBots}
                  </div>
                  <div>Bots Malos Analizados</div>
                </div>

                <div style={{
                  textAlign: 'center',
                  padding: '20px',
                  background: '#8b5cf6',
                  color: 'white',
                  borderRadius: '12px'
                }}>
                  <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
                    {realInsights.confidence}
                  </div>
                  <div>Confianza del Análisis</div>
                </div>
              </div>

              {/* Mejores técnicas REALES */}
              <div style={{
                background: 'var(--bg-primary)',
                padding: '20px',
                borderRadius: '12px',
                marginBottom: '20px'
              }}>
                <h3 style={{ margin: '0 0 15px 0', color: '#10b981' }}>
                  🏆 Mejores Técnicas (Basado en Datos Reales)
                </h3>
                {realInsights.bestTechniques.map((tech, index) => (
                  <div key={tech.name} style={{
                    padding: '12px',
                    background: index === 0 ? 'rgba(16, 185, 129, 0.1)' : 'rgba(107, 114, 128, 0.1)',
                    borderRadius: '8px',
                    marginBottom: '10px'
                  }}>
                    <div style={{ fontWeight: 'bold' }}>{tech.name}</div>
                    <div style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>
                      Tasa de éxito: {tech.successRate}% | Sharpe promedio: {tech.avgSharpe} | 
                      Buenos: {tech.goodCount} | Malos: {tech.badCount}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{
                fontSize: '12px',
                color: 'var(--text-secondary)',
                textAlign: 'center',
                fontStyle: 'italic'
              }}>
                ✅ Análisis basado en {realInsights.totalGoodBots + realInsights.totalBadBots} bots reales marcados manualmente
                <br />
                📊 Última actualización: {new Date(realInsights.lastUpdated).toLocaleString()}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default RealAIAnalysis;
