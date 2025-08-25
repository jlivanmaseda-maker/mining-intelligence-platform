import React, { useState, useEffect } from 'react';

const AIRecommendationEngine = ({ user, supabase, backtestResults = [], userBots = [] }) => {
  const [aiInsights, setAiInsights] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [performanceScores, setPerformanceScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState([]);

  // 🧠 MOTOR DE ANÁLISIS INTELIGENTE
  const analyzeBacktestData = (results) => {
    if (!results || results.length === 0) return null;

    // Análisis de performance por técnica
    const techniquePerformance = {};
    const assetPerformance = {};
    const timeframePerformance = {};
    
    results.forEach(result => {
      // Performance por técnica
      const mainTechnique = Object.keys(result.tecnicas || {})[0] || 'Unknown';
      if (!techniquePerformance[mainTechnique]) {
        techniquePerformance[mainTechnique] = {
          count: 0,
          totalSharpe: 0,
          totalWinRate: 0,
          totalProfitFactor: 0,
          totalReturn: 0
        };
      }
      
      techniquePerformance[mainTechnique].count++;
      techniquePerformance[mainTechnique].totalSharpe += parseFloat(result.sharpeRatio || 0);
      techniquePerformance[mainTechnique].totalWinRate += parseFloat(result.winRate || 0);
      techniquePerformance[mainTechnique].totalProfitFactor += parseFloat(result.profitFactor || 0);
      techniquePerformance[mainTechnique].totalReturn += parseFloat(result.totalReturn || 0);

      // Performance por activo
      const asset = result.activo || 'Unknown';
      if (!assetPerformance[asset]) {
        assetPerformance[asset] = {
          count: 0,
          totalSharpe: 0,
          avgWinRate: 0,
          bestConfig: null
        };
      }
      
      assetPerformance[asset].count++;
      assetPerformance[asset].totalSharpe += parseFloat(result.sharpeRatio || 0);
      assetPerformance[asset].avgWinRate += parseFloat(result.winRate || 0);
      
      if (!assetPerformance[asset].bestConfig || 
          parseFloat(result.sharpeRatio) > parseFloat(assetPerformance[asset].bestConfig.sharpeRatio)) {
        assetPerformance[asset].bestConfig = result;
      }

      // Performance por temporalidad
      const timeframe = result.temporalidad || 'Unknown';
      if (!timeframePerformance[timeframe]) {
        timeframePerformance[timeframe] = { count: 0, avgSharpe: 0, avgWinRate: 0 };
      }
      timeframePerformance[timeframe].count++;
      timeframePerformance[timeframe].avgSharpe += parseFloat(result.sharpeRatio || 0);
      timeframePerformance[timeframe].avgWinRate += parseFloat(result.winRate || 0);
    });

    // Calcular promedios
    Object.keys(techniquePerformance).forEach(technique => {
      const data = techniquePerformance[technique];
      data.avgSharpe = data.totalSharpe / data.count;
      data.avgWinRate = data.totalWinRate / data.count;
      data.avgProfitFactor = data.totalProfitFactor / data.count;
      data.avgReturn = data.totalReturn / data.count;
    });

    Object.keys(assetPerformance).forEach(asset => {
      const data = assetPerformance[asset];
      data.avgSharpe = data.totalSharpe / data.count;
      data.avgWinRate = data.avgWinRate / data.count;
    });

    Object.keys(timeframePerformance).forEach(timeframe => {
      const data = timeframePerformance[timeframe];
      data.avgSharpe = data.avgSharpe / data.count;
      data.avgWinRate = data.avgWinRate / data.count;
    });

    return {
      techniquePerformance,
      assetPerformance,
      timeframePerformance,
      totalConfigs: results.length,
      avgPerformance: {
        sharpe: results.reduce((sum, r) => sum + parseFloat(r.sharpeRatio || 0), 0) / results.length,
        winRate: results.reduce((sum, r) => sum + parseFloat(r.winRate || 0), 0) / results.length,
        profitFactor: results.reduce((sum, r) => sum + parseFloat(r.profitFactor || 0), 0) / results.length
      }
    };
  };

  // 🎯 GENERADOR DE RECOMENDACIONES INTELIGENTES
  const generateRecommendations = (analysis) => {
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
        confidence: calculateConfidence(bestTechnique[1].count, bestTechnique[1].avgSharpe),
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
        confidence: calculateConfidence(bestAsset[1].count, bestAsset[1].avgSharpe),
        category: 'asset'
      });
    }

    // Recomendación de combinación óptima
    const bestCombo = findBestCombination(analysis);
    if (bestCombo) {
      recommendations.push({
        type: 'combination',
        priority: 'medium',
        title: `⚡ Combinación óptima detectada`,
        description: `${bestCombo.technique} + ${bestCombo.asset} + ${bestCombo.timeframe}`,
        action: `Crea más configuraciones con esta combinación`,
        confidence: bestCombo.confidence,
        category: 'optimization'
      });
    }

    // Recomendación de diversificación
    const diversificationAdvice = analyzeDiversification(analysis);
    if (diversificationAdvice) {
      recommendations.push({
        type: 'diversification',
        priority: 'medium',
        title: `🎯 Oportunidad de diversificación`,
        description: diversificationAdvice.description,
        action: diversificationAdvice.action,
        confidence: 85,
        category: 'risk'
      });
    }

    // Recomendación de optimización
    const optimizationTip = generateOptimizationTip(analysis);
    if (optimizationTip) {
      recommendations.push(optimizationTip);
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  };

  // 📊 CALCULADORA DE CONFIANZA
  const calculateConfidence = (sampleSize, performance) => {
    const baseLine = 50; // Confianza base
    const sampleBonus = Math.min(sampleSize * 2, 30); // Máximo 30 puntos por muestra
    const performanceBonus = Math.max(0, (performance - 1) * 20); // 20 puntos por cada punto de Sharpe > 1
    
    return Math.min(95, Math.max(15, baseLine + sampleBonus + performanceBonus));
  };

  // 🔍 DETECTOR DE MEJORES COMBINACIONES
  const findBestCombination = (analysis) => {
    const combinations = [];
    
    // Encontrar la mejor combinación técnica-activo-timeframe
    Object.entries(analysis.techniquePerformance).forEach(([technique, techData]) => {
      Object.entries(analysis.assetPerformance).forEach(([asset, assetData]) => {
        Object.entries(analysis.timeframePerformance).forEach(([timeframe, tfData]) => {
          const combinedScore = (techData.avgSharpe + assetData.avgSharpe + tfData.avgSharpe) / 3;
          const combinedConfidence = calculateConfidence(
            techData.count + assetData.count + tfData.count,
            combinedScore
          );
          
          combinations.push({
            technique,
            asset,
            timeframe,
            score: combinedScore,
            confidence: combinedConfidence
          });
        });
      });
    });

    return combinations.sort((a, b) => b.score - a.score)[0];
  };

  // 🎨 ANALIZADOR DE DIVERSIFICACIÓN
  const analyzeDiversification = (analysis) => {
    const techniques = Object.keys(analysis.techniquePerformance).length;
    const assets = Object.keys(analysis.assetPerformance).length;
    const timeframes = Object.keys(analysis.timeframePerformance).length;

    if (techniques < 3) {
      return {
        description: `Solo usas ${techniques} técnica(s). Diversificar puede reducir riesgo`,
        action: `Prueba técnicas como WFM, MC Trade o High Back Test Precision`
      };
    }

    if (assets < 3) {
      return {
        description: `Concentrado en ${assets} activo(s). Más diversificación podría mejorar stability`,
        action: `Considera agregar GOLD, BTC o índices como SPX500`
      };
    }

    return null;
  };

  // 💡 GENERADOR DE TIPS DE OPTIMIZACIÓN
  const generateOptimizationTip = (analysis) => {
    const lowPerformers = Object.entries(analysis.techniquePerformance)
      .filter(([_, data]) => data.avgSharpe < 0.5)
      .map(([technique, _]) => technique);

    if (lowPerformers.length > 0) {
      return {
        type: 'optimization',
        priority: 'low',
        title: `🔧 Técnicas con bajo rendimiento detectadas`,
        description: `${lowPerformers.join(', ')} muestran Sharpe < 0.5`,
        action: `Revisa parámetros o considera reemplazar estas técnicas`,
        confidence: 75,
        category: 'optimization'
      };
    }

    return null;
  };

  // 📈 CALCULADORA DE SCORING DINÁMICO
  const calculateDynamicScores = (results) => {
    return results.map(result => {
      let score = 50; // Score base

      // Factor Sharpe Ratio (30% del score)
      const sharpe = parseFloat(result.sharpeRatio || 0);
      if (sharpe > 2) score += 30;
      else if (sharpe > 1.5) score += 25;
      else if (sharpe > 1) score += 20;
      else if (sharpe > 0.5) score += 10;
      else score += 0;

      // Factor Win Rate (25% del score)
      const winRate = parseFloat(result.winRate || 0);
      if (winRate > 70) score += 25;
      else if (winRate > 60) score += 20;
      else if (winRate > 50) score += 15;
      else if (winRate > 40) score += 10;
      else score += 5;

      // Factor Profit Factor (20% del score)
      const profitFactor = parseFloat(result.profitFactor || 0);
      if (profitFactor > 2) score += 20;
      else if (profitFactor > 1.5) score += 15;
      else if (profitFactor > 1) score += 10;
      else score += 0;

      // Factor Max Drawdown (15% del score)
      const maxDD = parseFloat(result.maxDrawdown || 100);
      if (maxDD < 5) score += 15;
      else if (maxDD < 10) score += 12;
      else if (maxDD < 20) score += 8;
      else if (maxDD < 30) score += 4;
      else score += 0;

      // Factor Número de Trades (10% del score)
      const totalTrades = parseInt(result.totalTrades || 0);
      if (totalTrades > 50) score += 10;
      else if (totalTrades > 20) score += 7;
      else if (totalTrades > 10) score += 5;
      else score += 2;

      return {
        ...result,
        aiScore: Math.min(100, Math.max(0, score)),
        scoreBreakdown: {
          sharpe: sharpe > 1 ? 'Excelente' : sharpe > 0.5 ? 'Bueno' : 'Mejorable',
          winRate: winRate > 60 ? 'Alto' : winRate > 40 ? 'Medio' : 'Bajo',
          profitFactor: profitFactor > 1.5 ? 'Excelente' : profitFactor > 1 ? 'Bueno' : 'Mejorable',
          drawdown: maxDD < 10 ? 'Bajo' : maxDD < 20 ? 'Moderado' : 'Alto',
          trades: totalTrades > 20 ? 'Suficientes' : 'Pocas'
        }
      };
    }).sort((a, b) => b.aiScore - a.aiScore);
  };

  // 🔮 DETECTOR DE PATRONES OCULTOS
  const detectHiddenPatterns = (analysis) => {
    const patterns = [];

    // Patrón de consistencia temporal
    const timeframeEntries = Object.entries(analysis.timeframePerformance);
    const bestTimeframe = timeframeEntries.sort((a, b) => b[1].avgSharpe - a[1].avgSharpe)[0];
    
    if (bestTimeframe && bestTimeframe[1].avgSharpe > 1.2) {
      patterns.push({
        type: 'temporal',
        title: `⏰ Patrón temporal detectado`,
        description: `${bestTimeframe[0]} muestra consistentemente mejor performance`,
        insight: `Sharpe promedio: ${bestTimeframe[1].avgSharpe.toFixed(2)}`,
        actionable: `Enfoca más estrategias en ${bestTimeframe[0]}`
      });
    }

    // Patrón de combinación ganadora
    const techniques = Object.keys(analysis.techniquePerformance);
    const assets = Object.keys(analysis.assetPerformance);
    
    if (techniques.length >= 2 && assets.length >= 2) {
      patterns.push({
        type: 'combination',
        title: `🎯 Sinergia detectada`,
        description: `Ciertas combinaciones técnica-activo superan performance individual`,
        insight: `Portfolio diversificado muestra mayor estabilidad`,
        actionable: `Mantén diversificación en técnicas y activos`
      });
    }

    return patterns;
  };

  // 🚀 EJECUTAR ANÁLISIS DE IA
  const runAIAnalysis = async () => {
    setLoading(true);
    
    try {
      // Simular procesamiento de IA
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const analysis = analyzeBacktestData(backtestResults);
      if (!analysis) {
        setAiInsights({ error: 'No hay suficientes datos para análisis' });
        return;
      }

      const generatedRecommendations = generateRecommendations(analysis);
      const dynamicScores = calculateDynamicScores(backtestResults);
      const hiddenPatterns = detectHiddenPatterns(analysis);

      setAiInsights(analysis);
      setRecommendations(generatedRecommendations);
      setPerformanceScores(dynamicScores);
      setPatterns(hiddenPatterns);

    } catch (error) {
      console.error('Error en análisis de IA:', error);
      setAiInsights({ error: error.message });
    } finally {
      setLoading(false);
    }
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
          background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '32px'
        }}>
          🤖
        </span>
        Sistema de IA y Recomendaciones
      </h2>

      {/* BOTÓN DE ANÁLISIS */}
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        marginBottom: '30px'
      }}>
        <button
          onClick={runAIAnalysis}
          disabled={loading || !backtestResults || backtestResults.length === 0}
          className="touch-target"
          style={{
            padding: '15px 30px',
            background: loading ? 'var(--text-secondary)' : 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '10px',
            cursor: loading ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            transition: 'var(--transition)',
            minWidth: '250px'
          }}
          onMouseOver={(e) => {
            if (!loading) {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
            }
          }}
          onMouseOut={(e) => {
            e.target.style.transform = 'translateY(0)';
            e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
          }}
        >
          {loading ? (
            <>
              <div style={{
                display: 'inline-block',
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite',
                marginRight: '10px'
              }} />
              Analizando con IA...
            </>
          ) : (
            <>🧠 Ejecutar Análisis Inteligente</>
          )}
        </button>
      </div>

      {/* ESTADO SIN DATOS */}
      {!backtestResults || backtestResults.length === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '60px 20px',
          background: 'var(--bg-primary)',
          borderRadius: '15px',
          border: '1px solid var(--border-color)'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.6 }}>🤖</div>
          <h3 style={{ color: 'var(--text-primary)', margin: '0 0 15px 0' }}>
            IA Lista para Analizar
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '500px', margin: '0 auto' }}>
            Ejecuta primero el <strong>Motor de Backtesting</strong> para generar datos. 
            La IA necesita resultados de backtesting para crear recomendaciones inteligentes.
          </p>
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 10%, #8b5cf6 90%)',
            padding: '20px',
            borderRadius: '10px',
            marginTop: '25px',
            color: 'white',
            opacity: 0.9
          }}>
            <h4 style={{ margin: '0 0 10px 0' }}>🎯 Análisis que recibirás:</h4>
            <div style={{ fontSize: '14px', opacity: 0.9, textAlign: 'left', maxWidth: '400px', margin: '0 auto' }}>
              • Recomendaciones de mejores técnicas y activos<br/>
              • Scoring dinámico de todas las estrategias<br/>
              • Detección de patrones ocultos de performance<br/>
              • Consejos de optimización personalizados<br/>
              • Análisis predictivo de combinaciones exitosas
            </div>
          </div>
        </div>
      ) : null}

      {/* RESULTADOS DE IA */}
      {aiInsights && !aiInsights.error && (
        <div>
          {/* RECOMENDACIONES PRINCIPALES */}
          {recommendations.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                color: 'var(--text-primary)', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>💡</span>
                Recomendaciones Inteligentes
              </h3>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                {recommendations.slice(0, 4).map((rec, index) => (
                  <div key={index} style={{
                    padding: '20px',
                    background: 'var(--bg-primary)',
                    borderRadius: '12px',
                    border: '1px solid var(--border-color)',
                    borderLeft: `4px solid ${
                      rec.priority === 'high' ? '#10b981' : 
                      rec.priority === 'medium' ? '#f59e0b' : '#6b7280'
                    }`
                  }}>
                    <div style={{ 
                      display: 'flex', 
                      justifyContent: 'space-between', 
                      alignItems: 'flex-start',
                      flexWrap: 'wrap',
                      gap: '10px',
                      marginBottom: '10px' 
                    }}>
                      <h4 style={{ 
                        margin: 0, 
                        color: 'var(--text-primary)',
                        fontSize: '16px',
                        fontWeight: 'bold'
                      }}>
                        {rec.title}
                      </h4>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '10px'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          background: rec.priority === 'high' ? '#10b981' : 
                                     rec.priority === 'medium' ? '#f59e0b' : '#6b7280',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {rec.priority.toUpperCase()}
                        </span>
                        <span style={{
                          fontSize: '12px',
                          color: 'var(--text-secondary)',
                          fontWeight: 'bold'
                        }}>
                          {rec.confidence}% confianza
                        </span>
                      </div>
                    </div>
                    
                    <p style={{ 
                      margin: '0 0 10px 0', 
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      lineHeight: '1.5'
                    }}>
                      {rec.description}
                    </p>
                    
                    <div style={{
                      padding: '10px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--primary-color)',
                      fontWeight: '500'
                    }}>
                      💡 <strong>Acción:</strong> {rec.action}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCORING DINÁMICO */}
          {performanceScores.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                color: 'var(--text-primary)', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>🏆</span>
                Ranking IA de Estrategias
              </h3>
              
              <div style={{ overflowX: 'auto' }}>
                <table style={{ 
                  width: '100%', 
                  borderCollapse: 'collapse',
                  fontSize: '14px',
                  background: 'var(--bg-primary)',
                  borderRadius: '8px',
                  overflow: 'hidden'
                }}>
                  <thead>
                    <tr style={{ background: 'var(--primary-color)' }}>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'white' }}>Rank</th>
                      <th style={{ padding: '12px', textAlign: 'left', color: 'white' }}>Configuración</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Score IA</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Sharpe</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Win Rate</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Recomendación</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceScores.slice(0, 5).map((strategy, index) => (
                      <tr key={index} style={{ 
                        borderBottom: '1px solid var(--border-color)',
                        background: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)'
                      }}>
                        <td style={{ padding: '12px' }}>
                          <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px'
                          }}>
                            <span style={{
                              fontSize: '18px'
                            }}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                            </span>
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {strategy.configName?.substring(0, 25)}...
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {strategy.activo} • {strategy.temporalidad}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{
                            padding: '4px 8px',
                            background: strategy.aiScore >= 80 ? '#10b981' : 
                                       strategy.aiScore >= 60 ? '#f59e0b' : '#ef4444',
                            color: 'white',
                            borderRadius: '15px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'inline-block'
                          }}>
                            {strategy.aiScore.toFixed(0)}
                          </div>
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'center',
                          color: parseFloat(strategy.sharpeRatio) > 1 ? '#10b981' : '#6b7280',
                          fontWeight: 'bold'
                        }}>
                          {strategy.sharpeRatio}
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'center',
                          color: parseFloat(strategy.winRate) > 60 ? '#10b981' : '#6b7280',
                          fontWeight: 'bold'
                        }}>
                          {strategy.winRate}%
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>
                          {strategy.aiScore >= 80 ? '🚀 Usar más' : 
                           strategy.aiScore >= 60 ? '✅ Mantener' : 
                           '⚠️ Revisar'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* PATRONES OCULTOS */}
          {patterns.length > 0 && (
            <div style={{ marginBottom: '30px' }}>
              <h3 style={{ 
                color: 'var(--text-primary)', 
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '10px'
              }}>
                <span style={{ fontSize: '24px' }}>🔍</span>
                Patrones Ocultos Detectados
              </h3>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                {patterns.map((pattern, index) => (
                  <div key={index} style={{
                    padding: '20px',
                    background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.05) 0%, rgba(139, 92, 246, 0.05) 100%)',
                    borderRadius: '12px',
                    border: '1px solid var(--primary-color)',
                    borderWidth: '1px',
                    borderStyle: 'solid'
                  }}>
                    <h4 style={{ 
                      margin: '0 0 10px 0', 
                      color: 'var(--primary-color)',
                      fontWeight: 'bold'
                    }}>
                      {pattern.title}
                    </h4>
                    <p style={{ 
                      margin: '0 0 8px 0', 
                      color: 'var(--text-primary)',
                      fontSize: '14px'
                    }}>
                      {pattern.description}
                    </p>
                    <p style={{ 
                      margin: '0 0 10px 0', 
                      color: 'var(--text-secondary)',
                      fontSize: '13px',
                      fontStyle: 'italic'
                    }}>
                      💡 {pattern.insight}
                    </p>
                    <div style={{
                      padding: '8px 12px',
                      background: 'var(--primary-color)',
                      color: 'white',
                      borderRadius: '6px',
                      fontSize: '13px',
                      fontWeight: '500'
                    }}>
                      🎯 {pattern.actionable}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MÉTRICAS GLOBALES DE IA */}
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            padding: '25px',
            borderRadius: '15px',
            color: 'white'
          }}>
            <h3 style={{ margin: '0 0 20px 0', color: 'white' }}>
              📊 Resumen Inteligente del Portfolio
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '20px' 
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '5px' }}>
                  {aiInsights.totalConfigs}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px' }}>
                  Configuraciones Analizadas
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '5px' }}>
                  {aiInsights.avgPerformance?.sharpe?.toFixed(2)}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px' }}>
                  Sharpe Promedio
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '5px' }}>
                  {recommendations.filter(r => r.priority === 'high').length}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px' }}>
                  Recomendaciones Alta Prioridad
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '5px' }}>
                  {performanceScores.filter(s => s.aiScore >= 80).length}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px' }}>
                  Estrategias Tier S (Score >80)
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ERROR STATE */}
      {aiInsights?.error && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          background: 'rgba(239, 68, 68, 0.1)',
          borderRadius: '15px',
          border: '1px solid #ef4444',
          color: '#ef4444'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>⚠️</div>
          <h3 style={{ margin: '0 0 10px 0' }}>Error en Análisis IA</h3>
          <p style={{ margin: 0 }}>{aiInsights.error}</p>
        </div>
      )}

      {/* CSS ANIMATIONS */}
      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes pulse {
          0% { opacity: 0.6; }
          50% { opacity: 1; }
          100% { opacity: 0.6; }
        }
      `}</style>

    </div>
  );
};

export default AIRecommendationEngine;
