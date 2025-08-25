import React, { useState, useEffect } from 'react';

const AIRecommendationEngine = ({ user, supabase, backtestResults = [], userBots = [] }) => {
  const [aiInsights, setAiInsights] = useState(null);
  const [recommendations, setRecommendations] = useState([]);
  const [performanceScores, setPerformanceScores] = useState([]);
  const [loading, setLoading] = useState(false);
  const [patterns, setPatterns] = useState([]);

  // 🧠 MOTOR DE ANÁLISIS INTELIGENTE COMPLETO
  const analyzeBacktestData = (results) => {
    if (!results || results.length === 0) return null;

    // Análisis de performance por técnica
    const techniquePerformance = {};
    const assetPerformance = {};
    const timeframePerformance = {};
    const correlationMatrix = {};
    const volatilityAnalysis = {};
    
    results.forEach(result => {
      // Performance por técnica
      const mainTechnique = Object.keys(result.tecnicas || {})[0] || 'Unknown';
      if (!techniquePerformance[mainTechnique]) {
        techniquePerformance[mainTechnique] = {
          count: 0,
          totalSharpe: 0,
          totalWinRate: 0,
          totalProfitFactor: 0,
          totalReturn: 0,
          maxDrawdowns: [],
          tradeCounts: [],
          consistency: 0
        };
      }
      
      techniquePerformance[mainTechnique].count++;
      techniquePerformance[mainTechnique].totalSharpe += parseFloat(result.sharpeRatio || 0);
      techniquePerformance[mainTechnique].totalWinRate += parseFloat(result.winRate || 0);
      techniquePerformance[mainTechnique].totalProfitFactor += parseFloat(result.profitFactor || 0);
      techniquePerformance[mainTechnique].totalReturn += parseFloat(result.totalReturn || 0);
      techniquePerformance[mainTechnique].maxDrawdowns.push(parseFloat(result.maxDrawdown || 0));
      techniquePerformance[mainTechnique].tradeCounts.push(parseInt(result.totalTrades || 0));

      // Performance por activo
      const asset = result.activo || 'Unknown';
      if (!assetPerformance[asset]) {
        assetPerformance[asset] = {
          count: 0,
          totalSharpe: 0,
          avgWinRate: 0,
          bestConfig: null,
          worstConfig: null,
          volatility: 0,
          consistency: 0
        };
      }
      
      assetPerformance[asset].count++;
      assetPerformance[asset].totalSharpe += parseFloat(result.sharpeRatio || 0);
      assetPerformance[asset].avgWinRate += parseFloat(result.winRate || 0);
      
      if (!assetPerformance[asset].bestConfig || 
          parseFloat(result.sharpeRatio) > parseFloat(assetPerformance[asset].bestConfig.sharpeRatio)) {
        assetPerformance[asset].bestConfig = result;
      }

      if (!assetPerformance[asset].worstConfig || 
          parseFloat(result.sharpeRatio) < parseFloat(assetPerformance[asset].worstConfig.sharpeRatio)) {
        assetPerformance[asset].worstConfig = result;
      }

      // Performance por temporalidad
      const timeframe = result.temporalidad || 'Unknown';
      if (!timeframePerformance[timeframe]) {
        timeframePerformance[timeframe] = { 
          count: 0, 
          avgSharpe: 0, 
          avgWinRate: 0,
          avgTrades: 0,
          reliability: 0
        };
      }
      timeframePerformance[timeframe].count++;
      timeframePerformance[timeframe].avgSharpe += parseFloat(result.sharpeRatio || 0);
      timeframePerformance[timeframe].avgWinRate += parseFloat(result.winRate || 0);
      timeframePerformance[timeframe].avgTrades += parseInt(result.totalTrades || 0);

      // Análisis de correlaciones
      const key = `${mainTechnique}-${asset}`;
      if (!correlationMatrix[key]) {
        correlationMatrix[key] = {
          performance: [],
          count: 0,
          avgSharpe: 0,
          synergy: 0
        };
      }
      correlationMatrix[key].performance.push(parseFloat(result.sharpeRatio || 0));
      correlationMatrix[key].count++;
      correlationMatrix[key].avgSharpe += parseFloat(result.sharpeRatio || 0);
    });

    // Calcular promedios y métricas avanzadas
    Object.keys(techniquePerformance).forEach(technique => {
      const data = techniquePerformance[technique];
      data.avgSharpe = data.totalSharpe / data.count;
      data.avgWinRate = data.totalWinRate / data.count;
      data.avgProfitFactor = data.totalProfitFactor / data.count;
      data.avgReturn = data.totalReturn / data.count;
      
      // Calcular consistencia (desviación estándar inversa)
      const sharpeVariance = data.maxDrawdowns.reduce((sum, val, _, arr) => {
        const mean = data.avgSharpe;
        return sum + Math.pow(val - mean, 2);
      }, 0) / data.count;
      data.consistency = sharpeVariance > 0 ? 1 / Math.sqrt(sharpeVariance) : 1;
      
      // Calcular reliability score
      data.reliability = (data.avgSharpe * 0.4) + (data.avgWinRate * 0.003) + (data.consistency * 0.3) + (data.avgProfitFactor * 0.3);
    });

    Object.keys(assetPerformance).forEach(asset => {
      const data = assetPerformance[asset];
      data.avgSharpe = data.totalSharpe / data.count;
      data.avgWinRate = data.avgWinRate / data.count;
      
      // Calcular volatilidad del activo
      if (data.bestConfig && data.worstConfig) {
        data.volatility = Math.abs(
          parseFloat(data.bestConfig.sharpeRatio) - parseFloat(data.worstConfig.sharpeRatio)
        );
      }
      
      data.consistency = data.volatility > 0 ? 1 / data.volatility : 1;
    });

    Object.keys(timeframePerformance).forEach(timeframe => {
      const data = timeframePerformance[timeframe];
      data.avgSharpe = data.avgSharpe / data.count;
      data.avgWinRate = data.avgWinRate / data.count;
      data.avgTrades = data.avgTrades / data.count;
      data.reliability = (data.avgSharpe * 0.5) + (data.avgWinRate * 0.002) + (data.avgTrades * 0.01);
    });

    // Calcular sinergias en correlationMatrix
    Object.keys(correlationMatrix).forEach(key => {
      const data = correlationMatrix[key];
      data.avgSharpe = data.avgSharpe / data.count;
      
      // Calcular sinergia (si está por encima de la media individual)
      const [technique, asset] = key.split('-');
      const techniqueAvg = techniquePerformance[technique]?.avgSharpe || 0;
      const assetAvg = assetPerformance[asset]?.avgSharpe || 0;
      const expectedPerformance = (techniqueAvg + assetAvg) / 2;
      
      data.synergy = data.avgSharpe - expectedPerformance;
    });

    return {
      techniquePerformance,
      assetPerformance,
      timeframePerformance,
      correlationMatrix,
      totalConfigs: results.length,
      avgPerformance: {
        sharpe: results.reduce((sum, r) => sum + parseFloat(r.sharpeRatio || 0), 0) / results.length,
        winRate: results.reduce((sum, r) => sum + parseFloat(r.winRate || 0), 0) / results.length,
        profitFactor: results.reduce((sum, r) => sum + parseFloat(r.profitFactor || 0), 0) / results.length,
        avgTrades: results.reduce((sum, r) => sum + parseInt(r.totalTrades || 0), 0) / results.length
      },
      marketConditions: analyzeMarketConditions(results),
      riskMetrics: calculateRiskMetrics(results)
    };
  };

  // 📊 ANÁLISIS DE CONDICIONES DE MERCADO
  const analyzeMarketConditions = (results) => {
    const conditions = {
      highVolatility: 0,
      lowVolatility: 0,
      trending: 0,
      ranging: 0,
      bullish: 0,
      bearish: 0
    };

    results.forEach(result => {
      const maxDD = parseFloat(result.maxDrawdown || 0);
      const totalReturn = parseFloat(result.totalReturn || 0);
      
      // Clasificar volatilidad
      if (maxDD > 15) conditions.highVolatility++;
      else conditions.lowVolatility++;
      
      // Clasificar tendencia
      if (Math.abs(totalReturn) > 10) conditions.trending++;
      else conditions.ranging++;
      
      // Clasificar dirección
      if (totalReturn > 0) conditions.bullish++;
      else conditions.bearish++;
    });

    return conditions;
  };

  // ⚖️ CÁLCULO DE MÉTRICAS DE RIESGO
  const calculateRiskMetrics = (results) => {
    const returns = results.map(r => parseFloat(r.totalReturn || 0));
    const sharpes = results.map(r => parseFloat(r.sharpeRatio || 0));
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const returnStd = Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    );
    
    const avgSharpe = sharpes.reduce((sum, s) => sum + s, 0) / sharpes.length;
    const sharpeStd = Math.sqrt(
      sharpes.reduce((sum, s) => sum + Math.pow(s - avgSharpe, 2), 0) / sharpes.length
    );

    return {
      portfolioVolatility: returnStd,
      sharpeConsistency: sharpeStd,
      riskAdjustedReturn: returnStd > 0 ? avgReturn / returnStd : 0,
      stabilityScore: sharpeStd > 0 ? avgSharpe / sharpeStd : 0
    };
  };

  // 🎯 GENERADOR DE RECOMENDACIONES INTELIGENTES AVANZADO
  const generateRecommendations = (analysis) => {
    if (!analysis) return [];

    const recommendations = [];

    // Recomendación de mejor técnica
    const bestTechnique = Object.entries(analysis.techniquePerformance)
      .sort((a, b) => b[1].reliability - a[1].reliability)[0];
    
    if (bestTechnique) {
      recommendations.push({
        type: 'technique',
        priority: 'high',
        title: `🧠 Tu mejor técnica: ${bestTechnique[0]}`,
        description: `Reliability Score: ${bestTechnique[1].reliability.toFixed(2)} | Sharpe: ${bestTechnique[1].avgSharpe.toFixed(2)} | Win Rate: ${bestTechnique[1].avgWinRate.toFixed(1)}%`,
        action: `Considera enfocar más configuraciones en ${bestTechnique[0]}`,
        confidence: calculateConfidence(bestTechnique[1].count, bestTechnique[1].reliability),
        category: 'strategy',
        impact: 'high',
        timeframe: 'immediate'
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
        description: `Sharpe promedio: ${bestAsset[1].avgSharpe.toFixed(2)} | Consistencia: ${bestAsset[1].consistency.toFixed(2)}`,
        action: `Aumenta allocation en ${bestAsset[0]} (volatilidad: ${bestAsset[1].volatility.toFixed(2)})`,
        confidence: calculateConfidence(bestAsset[1].count, bestAsset[1].avgSharpe),
        category: 'asset',
        impact: 'high',
        timeframe: 'short-term'
      });
    }

    // Recomendación de combinación óptima con sinergia
    const bestCombination = findBestCombination(analysis);
    if (bestCombination && bestCombination.synergy > 0) {
      recommendations.push({
        type: 'combination',
        priority: 'high',
        title: `⚡ Sinergia detectada: ${bestCombination.technique} + ${bestCombination.asset}`,
        description: `Rendimiento combinado supera expectativa individual en ${bestCombination.synergy.toFixed(2)} puntos`,
        action: `Crear más configuraciones con esta combinación ganadora`,
        confidence: calculateConfidence(bestCombination.count, bestCombination.avgSharpe),
        category: 'optimization',
        impact: 'very-high',
        timeframe: 'immediate'
      });
    }

    // Recomendación de temporalidad óptima
    const bestTimeframe = Object.entries(analysis.timeframePerformance)
      .sort((a, b) => b[1].reliability - a[1].reliability)[0];
    
    if (bestTimeframe) {
      recommendations.push({
        type: 'timeframe',
        priority: 'medium',
        title: `⏰ Temporalidad más efectiva: ${bestTimeframe[0]}`,
        description: `Reliability: ${bestTimeframe[1].reliability.toFixed(2)} | Avg Trades: ${bestTimeframe[1].avgTrades.toFixed(0)}`,
        action: `Enfocar estrategias en timeframe ${bestTimeframe[0]}`,
        confidence: calculateConfidence(bestTimeframe[1].count, bestTimeframe[1].reliability),
        category: 'timing',
        impact: 'medium',
        timeframe: 'medium-term'
      });
    }

    // Recomendación de diversificación
    const diversificationAdvice = analyzeDiversification(analysis);
    if (diversificationAdvice) {
      recommendations.push({
        type: 'diversification',
        priority: 'medium',
        title: `🎯 ${diversificationAdvice.title}`,
        description: diversificationAdvice.description,
        action: diversificationAdvice.action,
        confidence: diversificationAdvice.confidence,
        category: 'risk',
        impact: 'medium',
        timeframe: 'long-term'
      });
    }

    // Recomendación de optimización de riesgo
    const riskOptimization = generateRiskOptimizationTip(analysis);
    if (riskOptimization) {
      recommendations.push(riskOptimization);
    }

    // Recomendación de condiciones de mercado
    const marketAdvice = generateMarketConditionAdvice(analysis);
    if (marketAdvice) {
      recommendations.push(marketAdvice);
    }

    // Recomendación de técnicas de bajo rendimiento
    const optimizationTip = generateOptimizationTip(analysis);
    if (optimizationTip) {
      recommendations.push(optimizationTip);
    }

    return recommendations.sort((a, b) => {
      const priorityOrder = { high: 3, medium: 2, low: 1 };
      const impactOrder = { 'very-high': 4, high: 3, medium: 2, low: 1 };
      
      if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
        return priorityOrder[b.priority] - priorityOrder[a.priority];
      }
      
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  };

  // 📊 CALCULADORA DE CONFIANZA MEJORADA
  const calculateConfidence = (sampleSize, performance) => {
    const baseLine = 40;
    const sampleBonus = Math.min(sampleSize * 3, 35);
    const performanceBonus = Math.max(0, (performance - 1) * 25);
    const consistencyBonus = sampleSize > 5 ? 10 : 0;
    
    return Math.min(98, Math.max(10, baseLine + sampleBonus + performanceBonus + consistencyBonus));
  };

  // 🔍 DETECTOR DE MEJORES COMBINACIONES CON SINERGIA
  const findBestCombination = (analysis) => {
    let bestCombination = null;
    let maxSynergy = -Infinity;

    Object.entries(analysis.correlationMatrix).forEach(([key, data]) => {
      if (data.synergy > maxSynergy && data.count >= 2) {
        const [technique, asset] = key.split('-');
        maxSynergy = data.synergy;
        bestCombination = {
          technique,
          asset,
          avgSharpe: data.avgSharpe,
          synergy: data.synergy,
          count: data.count,
          confidence: calculateConfidence(data.count, data.avgSharpe)
        };
      }
    });

    return bestCombination;
  };

  // 🎨 ANALIZADOR DE DIVERSIFICACIÓN AVANZADO
  const analyzeDiversification = (analysis) => {
    const techniques = Object.keys(analysis.techniquePerformance).length;
    const assets = Object.keys(analysis.assetPerformance).length;
    const timeframes = Object.keys(analysis.timeframePerformance).length;
    
    const totalConfigs = analysis.totalConfigs;
    const avgConfigsPerTechnique = totalConfigs / techniques;
    const avgConfigsPerAsset = totalConfigs / assets;

    if (techniques < 3) {
      return {
        title: `Oportunidad de diversificación en técnicas`,
        description: `Solo usas ${techniques} técnica(s). Portfolio concentrado puede aumentar riesgo`,
        action: `Experimenta con técnicas como WFM, MC Trade, Secuencial, o High Back Test Precision`,
        confidence: 85
      };
    }

    if (assets < 4) {
      return {
        title: `Diversificación de activos recomendada`,
        description: `${assets} activos en portfolio. Diversificar puede mejorar ratio riesgo-retorno`,
        action: `Considera añadir GOLD, BTC, ETH, o índices como SPX500 para mayor estabilidad`,
        confidence: 80
      };
    }

    if (avgConfigsPerTechnique > 10) {
      return {
        title: `Over-concentración detectada`,
        description: `Promedio ${avgConfigsPerTechnique.toFixed(1)} configs por técnica. Distribución desbalanceada`,
        action: `Rebalancea portfolio entre técnicas para reducir exposición específica`,
        confidence: 75
      };
    }

    if (totalConfigs > 20 && timeframes < 3) {
      return {
        title: `Diversificación temporal insuficiente`,
        description: `${timeframes} timeframes para ${totalConfigs} configuraciones. Riesgo temporal concentrado`,
        action: `Distribuye estrategias entre M15, H1, H4, y D1 para capturar diferentes ciclos`,
        confidence: 70
      };
    }

    return null;
  };

  // 🔧 GENERADOR DE TIPS DE OPTIMIZACIÓN DE RIESGO
  const generateRiskOptimizationTip = (analysis) => {
    const { riskMetrics } = analysis;
    
    if (riskMetrics.portfolioVolatility > 25) {
      return {
        type: 'risk',
        priority: 'high',
        title: `⚠️ Alta volatilidad del portfolio detectada`,
        description: `Volatilidad: ${riskMetrics.portfolioVolatility.toFixed(1)}%. Risk-adjusted return: ${riskMetrics.riskAdjustedReturn.toFixed(2)}`,
        action: `Reduce exposición en estrategias de alto drawdown. Considera técnicas más conservadoras`,
        confidence: 90,
        category: 'risk',
        impact: 'high',
        timeframe: 'immediate'
      };
    }

    if (riskMetrics.sharpeConsistency > 1.5) {
      return {
        type: 'consistency',
        priority: 'medium',
        title: `📊 Inconsistencia en Sharpe Ratios detectada`,
        description: `Desv. estándar Sharpe: ${riskMetrics.sharpeConsistency.toFixed(2)}. Score estabilidad: ${riskMetrics.stabilityScore.toFixed(2)}`,
        action: `Enfoca en estrategias con performance más estable. Revisa outliers`,
        confidence: 85,
        category: 'optimization',
        impact: 'medium',
        timeframe: 'medium-term'
      };
    }

    if (riskMetrics.stabilityScore < 1.0) {
      return {
        type: 'stability',
        priority: 'low',
        title: `🎯 Oportunidad de mejorar estabilidad`,
        description: `Score estabilidad: ${riskMetrics.stabilityScore.toFixed(2)}. Portfolio necesita más consistencia`,
        action: `Incrementa peso en estrategias con Sharpe ratios estables y predecibles`,
        confidence: 75,
        category: 'optimization',
        impact: 'medium',
        timeframe: 'long-term'
      };
    }

    return null;
  };

  // 🌍 GENERADOR DE CONSEJOS BASADOS EN CONDICIONES DE MERCADO
  const generateMarketConditionAdvice = (analysis) => {
    const { marketConditions } = analysis;
    const total = analysis.totalConfigs;
    
    const highVolPercent = (marketConditions.highVolatility / total) * 100;
    const trendingPercent = (marketConditions.trending / total) * 100;
    const bullishPercent = (marketConditions.bullish / total) * 100;

    if (highVolPercent > 60) {
      return {
        type: 'market',
        priority: 'medium',
        title: `📈 Portfolio adaptado a alta volatilidad`,
        description: `${highVolPercent.toFixed(1)}% de estrategias en condiciones de alta volatilidad`,
        action: `Considera estrategias de momentum y breakout. Ajusta gestión de riesgo`,
        confidence: 80,
        category: 'market',
        impact: 'medium',
        timeframe: 'short-term'
      };
    }

    if (trendingPercent > 70) {
      return {
        type: 'trend',
        priority: 'low',
        title: `📊 Sesgo hacia mercados trending`,
        description: `${trendingPercent.toFixed(1)}% de configuraciones optimizadas para tendencias`,
        action: `Balancear con estrategias para mercados ranging. Diversifica estilos`,
        confidence: 75,
        category: 'diversification',
        impact: 'low',
        timeframe: 'long-term'
      };
    }

    if (Math.abs(bullishPercent - 50) > 25) {
      const bias = bullishPercent > 50 ? 'alcista' : 'bajista';
      return {
        type: 'bias',
        priority: 'low',
        title: `⚖️ Sesgo direccional ${bias} detectado`,
        description: `${bullishPercent.toFixed(1)}% de strategies con sesgo ${bias}`,
        action: `Considera estrategias market-neutral para balancear exposición direccional`,
        confidence: 70,
        category: 'balance',
        impact: 'medium',
        timeframe: 'medium-term'
      };
    }

    return null;
  };

  // 💡 GENERADOR DE TIPS DE OPTIMIZACIÓN TÉCNICA
  const generateOptimizationTip = (analysis) => {
    const lowPerformers = Object.entries(analysis.techniquePerformance)
      .filter(([_, data]) => data.avgSharpe < 0.5 || data.reliability < 1.0)
      .map(([technique, data]) => ({ technique, ...data }));

    if (lowPerformers.length > 0) {
      const worstTechnique = lowPerformers.sort((a, b) => a.reliability - b.reliability)[0];
      
      return {
        type: 'optimization',
        priority: 'low',
        title: `🔧 Técnicas con bajo rendimiento detectadas`,
        description: `${worstTechnique.technique}: Sharpe ${worstTechnique.avgSharpe.toFixed(2)}, Reliability ${worstTechnique.reliability.toFixed(2)}`,
        action: `Revisa parámetros de ${worstTechnique.technique} o considera reemplazarla`,
        confidence: 85,
        category: 'optimization',
        impact: 'medium',
        timeframe: 'medium-term'
      };
    }

    // Detectar técnicas sobrevaloradas (bajo número de trades pero buen sharpe)
    const potentiallyOverfitted = Object.entries(analysis.techniquePerformance)
      .filter(([_, data]) => data.avgSharpe > 2.0 && data.tradeCounts.every(count => count < 10))
      .map(([technique, _]) => technique);

    if (potentiallyOverfitted.length > 0) {
      return {
        type: 'overfitting',
        priority: 'medium',
        title: `⚠️ Posible overfitting detectado`,
        description: `${potentiallyOverfitted.join(', ')}: Alto Sharpe con pocos trades puede indicar overfitting`,
        action: `Valida estas técnicas con más datos o períodos fuera de muestra`,
        confidence: 75,
        category: 'validation',
        impact: 'high',
        timeframe: 'immediate'
      };
    }

    return null;
  };

  // 📈 CALCULADORA DE SCORING DINÁMICO AVANZADO
  const calculateDynamicScores = (results) => {
    return results.map(result => {
      let score = 40; // Base score reducido para ser más estricto

      // Factor Sharpe Ratio (35% del score)
      const sharpe = parseFloat(result.sharpeRatio || 0);
      if (sharpe > 3) score += 35;
      else if (sharpe > 2) score += 30;
      else if (sharpe > 1.5) score += 25;
      else if (sharpe > 1) score += 20;
      else if (sharpe > 0.5) score += 10;
      else if (sharpe > 0) score += 5;

      // Factor Win Rate (25% del score)
      const winRate = parseFloat(result.winRate || 0);
      if (winRate > 80) score += 25;
      else if (winRate > 70) score += 22;
      else if (winRate > 60) score += 20;
      else if (winRate > 50) score += 15;
      else if (winRate > 40) score += 10;
      else score += 5;

      // Factor Profit Factor (20% del score)
      const profitFactor = parseFloat(result.profitFactor || 0);
      if (profitFactor > 3) score += 20;
      else if (profitFactor > 2) score += 17;
      else if (profitFactor > 1.5) score += 15;
      else if (profitFactor > 1) score += 10;
      else if (profitFactor > 0.8) score += 5;

      // Factor Max Drawdown (15% del score)
      const maxDD = parseFloat(result.maxDrawdown || 100);
      if (maxDD < 3) score += 15;
      else if (maxDD < 5) score += 13;
      else if (maxDD < 8) score += 11;
      else if (maxDD < 12) score += 8;
      else if (maxDD < 20) score += 5;
      else if (maxDD < 30) score += 2;

      // Factor Número de Trades (5% del score) - Ajustado para ser más balanceado
      const totalTrades = parseInt(result.totalTrades || 0);
      if (totalTrades >= 100) score += 5;
      else if (totalTrades >= 50) score += 4;
      else if (totalTrades >= 30) score += 3;
      else if (totalTrades >= 15) score += 2;
      else if (totalTrades >= 5) score += 1;

      // Bonus por consistencia (combinar múltiples métricas positivas)
      let consistencyBonus = 0;
      if (sharpe > 1 && winRate > 60 && profitFactor > 1.5 && maxDD < 10) {
        consistencyBonus = 5;
      }

      // Penalty por configuraciones sospechosas
      let suspiciousPenalty = 0;
      if (sharpe > 3 && totalTrades < 5) suspiciousPenalty = -10; // Posible overfitting
      if (winRate > 90 && totalTrades < 10) suspiciousPenalty = -15; // Demasiado perfecto
      if (maxDD === 0 && totalTrades > 0) suspiciousPenalty = -5; // Sin drawdown es sospechoso

      const finalScore = score + consistencyBonus + suspiciousPenalty;

      return {
        ...result,
        aiScore: Math.min(100, Math.max(0, finalScore)),
        scoreBreakdown: {
          sharpe: sharpe > 1.5 ? 'Excelente' : sharpe > 1 ? 'Muy Bueno' : sharpe > 0.5 ? 'Bueno' : 'Mejorable',
          winRate: winRate > 70 ? 'Excelente' : winRate > 60 ? 'Muy Bueno' : winRate > 50 ? 'Bueno' : winRate > 40 ? 'Regular' : 'Bajo',
          profitFactor: profitFactor > 2 ? 'Excelente' : profitFactor > 1.5 ? 'Muy Bueno' : profitFactor > 1 ? 'Bueno' : 'Mejorable',
          drawdown: maxDD < 5 ? 'Excelente' : maxDD < 10 ? 'Muy Bueno' : maxDD < 15 ? 'Bueno' : maxDD < 25 ? 'Regular' : 'Alto',
          trades: totalTrades > 50 ? 'Abundantes' : totalTrades > 20 ? 'Suficientes' : totalTrades > 10 ? 'Moderadas' : 'Pocas',
          consistency: consistencyBonus > 0 ? 'Alta' : 'Variable',
          reliability: suspiciousPenalty === 0 ? 'Confiable' : 'Revisar'
        }
      };
    }).sort((a, b) => b.aiScore - a.aiScore);
  };

  // 🔮 DETECTOR DE PATRONES OCULTOS AVANZADO
  const detectHiddenPatterns = (analysis) => {
    const patterns = [];

    // Patrón de consistencia temporal
    const timeframeEntries = Object.entries(analysis.timeframePerformance);
    const bestTimeframe = timeframeEntries.sort((a, b) => b[1].reliability - a[1].reliability)[0];
    
    if (bestTimeframe && bestTimeframe[1].reliability > 1.5) {
      patterns.push({
        type: 'temporal',
        title: `⏰ Patrón temporal dominante detectado`,
        description: `${bestTimeframe[0]} muestra superior reliability (${bestTimeframe[1].reliability.toFixed(2)})`,
        insight: `Avg Sharpe: ${bestTimeframe[1].avgSharpe.toFixed(2)}, Avg Trades: ${bestTimeframe[1].avgTrades.toFixed(0)}`,
        actionable: `Concentrate el 60-70% de nuevas estrategias en ${bestTimeframe[0]}`,
        confidence: 88,
        impact: 'high'
      });
    }

    // Patrón de sinergia técnica-activo
    const bestSynergies = Object.entries(analysis.correlationMatrix)
      .filter(([_, data]) => data.synergy > 0.3 && data.count >= 3)
      .sort((a, b) => b[1].synergy - a[1].synergy);

    if (bestSynergies.length > 0) {
      const [key, data] = bestSynergies[0];
      const [technique, asset] = key.split('-');
      
      patterns.push({
        type: 'synergy',
        title: `🎯 Sinergia poderosa: ${technique} × ${asset}`,
        description: `Esta combinación supera performance individual en ${data.synergy.toFixed(2)} puntos`,
        insight: `Sharpe combinado: ${data.avgSharpe.toFixed(2)} vs esperado: ${(data.avgSharpe - data.synergy).toFixed(2)}`,
        actionable: `Prioriza configuraciones ${technique} en ${asset}. Crea al menos 3 variaciones más`,
        confidence: 92,
        impact: 'very-high'
      });
    }

    // Patrón de eficiencia de técnicas
    const techniqueEfficiency = Object.entries(analysis.techniquePerformance)
      .map(([technique, data]) => ({
        technique,
        efficiency: data.reliability / data.count, // Reliability per configuration
        ...data
      }))
      .sort((a, b) => b.efficiency - a.efficiency);

    if (techniqueEfficiency.length > 1 && techniqueEfficiency[0].efficiency > techniqueEfficiency[1].efficiency * 1.5) {
      const best = techniqueEfficiency[0];
      patterns.push({
        type: 'efficiency',
        title: `⚡ Técnica de alta eficiencia: ${best.technique}`,
        description: `Genera ${best.efficiency.toFixed(2)} puntos de reliability por configuración`,
        insight: `Con solo ${best.count} configs logra reliability ${best.reliability.toFixed(2)}`,
        actionable: `${best.technique} es muy eficiente. Aumenta su peso en el portfolio`,
        confidence: 85,
        impact: 'high'
      });
    }

    // Patrón de condiciones de mercado preferidas
    const { marketConditions } = analysis;
    const total = analysis.totalConfigs;
    const preferences = {
      volatility: marketConditions.highVolatility / total > 0.6 ? 'alta' : 'baja',
      trend: marketConditions.trending / total > 0.7 ? 'trending' : 'ranging',
      direction: marketConditions.bullish / total > 0.6 ? 'alcista' : 
                 marketConditions.bearish / total > 0.6 ? 'bajista' : 'neutral'
    };

    if (preferences.volatility === 'alta' && preferences.trend === 'trending') {
      patterns.push({
        type: 'market-preference',
        title: `🌊 Especialización en mercados volátiles trending`,
        description: `Tu portfolio está optimizado para volatilidad alta (${((marketConditions.highVolatility/total)*100).toFixed(1)}%) y mercados trending`,
        insight: `Performance superior en condiciones de momentum fuerte`,
        actionable: `Mantén esta especialización. Añade indicadores de volatilidad para timing`,
        confidence: 80,
        impact: 'medium'
      });
    }

    // Patrón de concentración de performance
    const topPerformers = Object.entries(analysis.techniquePerformance)
      .sort((a, b) => b[1].reliability - a[1].reliability);
    
    if (topPerformers.length >= 2) {
      const top2Reliability = topPerformers[0][1].reliability + topPerformers[1][1].reliability;
      const totalReliability = topPerformers.reduce((sum, [_, data]) => sum + data.reliability, 0);
      const concentration = (top2Reliability / totalReliability) * 100;
      
      if (concentration > 70) {
        patterns.push({
          type: 'concentration',
          title: `🎯 Concentración de performance detectada`,
          description: `Top 2 técnicas (${topPerformers[0][0]}, ${topPerformers[1][0]}) generan ${concentration.toFixed(1)}% del reliability total`,
          insight: `Portfolio highly concentrated puede ser tanto fortaleza como riesgo`,
          actionable: `Considera rebalancear o validar estas técnicas en diferentes períodos`,
          confidence: 75,
          impact: 'medium'
        });
      }
    }

    return patterns.sort((a, b) => {
      const impactOrder = { 'very-high': 4, high: 3, medium: 2, low: 1 };
      return impactOrder[b.impact] - impactOrder[a.impact];
    });
  };

  // 🚀 EJECUTAR ANÁLISIS DE IA COMPLETO
  const runAIAnalysis = async () => {
    setLoading(true);
    
    try {
      // Simular procesamiento de IA con más tiempo para análisis complejo
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      const analysis = analyzeBacktestData(backtestResults);
      if (!analysis) {
        setAiInsights({ error: 'No hay suficientes datos para análisis completo' });
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
      
      {/* HEADER COMPLETO */}
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
        Sistema de IA y Recomendaciones Avanzado
      </h2>

      {/* BOTÓN DE ANÁLISIS MEJORADO */}
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
            minWidth: '300px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px'
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
                width: '20px',
                height: '20px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid white',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }} />
              Ejecutando Análisis Profundo de IA...
            </>
          ) : (
            <>🧠 Ejecutar Análisis Inteligente Completo</>
          )}
        </button>
      </div>

      {/* ESTADO SIN DATOS MEJORADO */}
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
            Sistema de IA Avanzado Listo
          </h3>
          <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', maxWidth: '600px', margin: '0 auto 25px' }}>
            Ejecuta primero el <strong>Motor de Backtesting</strong> para generar datos. 
            El sistema de IA necesita resultados de backtesting para crear recomendaciones inteligentes, 
            detectar patrones ocultos y optimizar tu portfolio.
          </p>
          
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 10%, #8b5cf6 90%)',
            padding: '25px',
            borderRadius: '15px',
            marginTop: '25px',
            color: 'white'
          }}>
            <h4 style={{ margin: '0 0 15px 0' }}>🎯 Análisis Avanzado que Recibirás:</h4>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', 
              gap: '20px', 
              fontSize: '14px', 
              textAlign: 'left'
            }}>
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: '#fbbf24' }}>💡 Recomendaciones Inteligentes</h5>
                <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.9 }}>
                  <li>Mejores técnicas por reliability score</li>
                  <li>Activos más rentables y consistentes</li>
                  <li>Combinaciones con sinergia detectada</li>
                  <li>Timeframes óptimos por condiciones</li>
                </ul>
              </div>
              
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: '#10b981' }}>🏆 Scoring Dinámico AI</h5>
                <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.9 }}>
                  <li>Ranking de 0-100 por múltiples métricas</li>
                  <li>Detección de overfitting automática</li>
                  <li>Análisis de consistencia y reliability</li>
                  <li>Penalties por configuraciones sospechosas</li>
                </ul>
              </div>
              
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: '#f59e0b' }}>🔍 Patrones Ocultos</h5>
                <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.9 }}>
                  <li>Sinergias entre técnicas y activos</li>
                  <li>Preferencias de condiciones de mercado</li>
                  <li>Concentración de performance</li>
                  <li>Eficiencia por configuración</li>
                </ul>
              </div>
              
              <div>
                <h5 style={{ margin: '0 0 8px 0', color: '#ef4444' }}>⚖️ Gestión de Riesgo</h5>
                <ul style={{ margin: 0, paddingLeft: '20px', opacity: 0.9 }}>
                  <li>Análisis de volatilidad del portfolio</li>
                  <li>Recomendaciones de diversificación</li>
                  <li>Detección de over-concentración</li>
                  <li>Risk-adjusted performance scoring</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {/* RESULTADOS DE IA COMPLETOS */}
      {aiInsights && !aiInsights.error && (
        <div>
          {/* RECOMENDACIONES PRINCIPALES EXPANDIDAS */}
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
                Recomendaciones Inteligentes Avanzadas
              </h3>
              
              <div style={{ display: 'grid', gap: '15px' }}>
                {recommendations.slice(0, 6).map((rec, index) => (
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
                        fontWeight: 'bold',
                        flex: 1
                      }}>
                        {rec.title}
                      </h4>
                      <div style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap'
                      }}>
                        <span style={{
                          padding: '4px 8px',
                          background: rec.priority === 'high' ? '#10b981' : 
                                     rec.priority === 'medium' ? '#f59e0b' : '#6b7280',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {rec.priority.toUpperCase()}
                        </span>
                        <span style={{
                          padding: '4px 8px',
                          background: rec.impact === 'very-high' ? '#dc2626' : 
                                     rec.impact === 'high' ? '#ea580c' : 
                                     rec.impact === 'medium' ? '#ca8a04' : '#65a30d',
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '11px',
                          fontWeight: 'bold'
                        }}>
                          {rec.impact.toUpperCase().replace('-', ' ')}
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
                      padding: '12px',
                      background: 'rgba(99, 102, 241, 0.1)',
                      borderRadius: '8px',
                      fontSize: '14px',
                      color: 'var(--primary-color)',
                      fontWeight: '500',
                      marginBottom: '8px'
                    }}>
                      💡 <strong>Acción:</strong> {rec.action}
                    </div>

                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: '12px',
                      color: 'var(--text-secondary)'
                    }}>
                      <span><strong>Categoría:</strong> {rec.category}</span>
                      <span><strong>Timeframe:</strong> {rec.timeframe}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SCORING DINÁMICO MEJORADO */}
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
                Ranking AI Avanzado - Top Performers
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
                      <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>AI Score</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Sharpe</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Win Rate</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Reliability</th>
                      <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {performanceScores.slice(0, 8).map((strategy, index) => (
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
                            <span style={{ fontSize: '18px' }}>
                              {index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}`}
                            </span>
                            {strategy.aiScore >= 90 && <span style={{ fontSize: '12px' }}>🌟</span>}
                          </div>
                        </td>
                        <td style={{ padding: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {strategy.configName?.substring(0, 30)}...
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {strategy.activo} • {strategy.temporalidad} • {strategy.scoreBreakdown?.reliability}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center' }}>
                          <div style={{
                            padding: '6px 10px',
                            background: strategy.aiScore >= 90 ? '#059669' : 
                                       strategy.aiScore >= 80 ? '#10b981' : 
                                       strategy.aiScore >= 70 ? '#f59e0b' : 
                                       strategy.aiScore >= 60 ? '#f97316' : '#ef4444',
                            color: 'white',
                            borderRadius: '20px',
                            fontSize: '12px',
                            fontWeight: 'bold',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '4px'
                          }}>
                            {strategy.aiScore >= 90 && '⭐'}
                            {strategy.aiScore.toFixed(0)}
                          </div>
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'center',
                          color: parseFloat(strategy.sharpeRatio) > 1.5 ? '#059669' : 
                                 parseFloat(strategy.sharpeRatio) > 1 ? '#10b981' : '#6b7280',
                          fontWeight: 'bold'
                        }}>
                          {strategy.sharpeRatio}
                          <div style={{ fontSize: '10px', opacity: 0.7 }}>
                            {strategy.scoreBreakdown?.sharpe}
                          </div>
                        </td>
                        <td style={{ 
                          padding: '12px', 
                          textAlign: 'center',
                          color: parseFloat(strategy.winRate) > 70 ? '#059669' : 
                                 parseFloat(strategy.winRate) > 60 ? '#10b981' : '#6b7280',
                          fontWeight: 'bold'
                        }}>
                          {strategy.winRate}%
                          <div style={{ fontSize: '10px', opacity: 0.7 }}>
                            {strategy.scoreBreakdown?.winRate}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>
                          <div style={{ color: 'var(--text-primary)', fontWeight: 'bold' }}>
                            {strategy.scoreBreakdown?.consistency}
                          </div>
                          <div style={{ color: 'var(--text-secondary)', fontSize: '10px' }}>
                            {strategy.scoreBreakdown?.reliability}
                          </div>
                        </td>
                        <td style={{ padding: '12px', textAlign: 'center', fontSize: '12px' }}>
                          {strategy.aiScore >= 85 ? '🚀 Maximizar' : 
                           strategy.aiScore >= 75 ? '✅ Usar más' :
                           strategy.aiScore >= 65 ? '➡️ Mantener' :
                           strategy.aiScore >= 50 ? '⚠️ Revisar' : '❌ Optimizar'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* TIER BREAKDOWN */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '15px',
                marginTop: '20px'
              }}>
                {[
                  { tier: 'S+', min: 90, color: '#059669', label: 'Elite' },
                  { tier: 'S', min: 80, color: '#10b981', label: 'Excellent' },
                  { tier: 'A', min: 70, color: '#f59e0b', label: 'Good' },
                  { tier: 'B', min: 60, color: '#f97316', label: 'Average' },
                  { tier: 'C', min: 0, color: '#ef4444', label: 'Poor' }
                ].map(tierInfo => {
                  const count = performanceScores.filter(s => 
                    s.aiScore >= tierInfo.min && (tierInfo.min === 0 || s.aiScore < tierInfo.min + 10)
                  ).length;
                  
                  return (
                    <div key={tierInfo.tier} style={{
                      padding: '12px',
                      background: tierInfo.color,
                      color: 'white',
                      borderRadius: '8px',
                      textAlign: 'center'
                    }}>
                      <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                        {count}
                      </div>
                      <div style={{ fontSize: '12px', opacity: 0.9 }}>
                        Tier {tierInfo.tier} - {tierInfo.label}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* PATRONES OCULTOS EXPANDIDOS */}
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
                Patrones Ocultos y Insights Avanzados
              </h3>
              
              <div style={{ display: 'grid', gap: '20px' }}>
                {patterns.map((pattern, index) => (
                  <div key={index} style={{
                    padding: '25px',
                    background: `linear-gradient(135deg, ${
                      pattern.impact === 'very-high' ? 'rgba(220, 38, 38, 0.1)' :
                      pattern.impact === 'high' ? 'rgba(99, 102, 241, 0.1)' :
                      'rgba(16, 185, 129, 0.1)'
                    } 0%, rgba(255,255,255,0) 100%)`,
                    borderRadius: '15px',
                    border: `2px solid ${
                      pattern.impact === 'very-high' ? '#dc2626' :
                      pattern.impact === 'high' ? '#6366f1' :
                      '#10b981'
                    }`,
                    position: 'relative'
                  }}>
                    <div style={{
                      position: 'absolute',
                      top: '15px',
                      right: '15px',
                      display: 'flex',
                      gap: '8px'
                    }}>
                      <span style={{
                        padding: '4px 8px',
                        background: pattern.impact === 'very-high' ? '#dc2626' :
                                   pattern.impact === 'high' ? '#6366f1' : '#10b981',
                        color: 'white',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {pattern.impact.toUpperCase().replace('-', ' ')}
                      </span>
                      <span style={{
                        padding: '4px 8px',
                        background: 'rgba(0,0,0,0.1)',
                        color: 'var(--text-primary)',
                        borderRadius: '12px',
                        fontSize: '10px',
                        fontWeight: 'bold'
                      }}>
                        {pattern.confidence}%
                      </span>
                    </div>

                    <h4 style={{ 
                      margin: '0 0 12px 0', 
                      color: pattern.impact === 'very-high' ? '#dc2626' :
                             pattern.impact === 'high' ? '#6366f1' : '#10b981',
                      fontWeight: 'bold',
                      fontSize: '18px',
                      paddingRight: '120px'
                    }}>
                      {pattern.title}
                    </h4>
                    
                    <p style={{ 
                      margin: '0 0 12px 0', 
                      color: 'var(--text-primary)',
                      fontSize: '15px',
                      lineHeight: '1.6',
                      fontWeight: '500'
                    }}>
                      {pattern.description}
                    </p>
                    
                    <p style={{ 
                      margin: '0 0 15px 0', 
                      color: 'var(--text-secondary)',
                      fontSize: '14px',
                      fontStyle: 'italic',
                      paddingLeft: '20px',
                      borderLeft: '3px solid var(--border-color)'
                    }}>
                      💡 <strong>Insight:</strong> {pattern.insight}
                    </p>
                    
                    <div style={{
                      padding: '15px',
                      background: pattern.impact === 'very-high' ? '#dc2626' :
                                 pattern.impact === 'high' ? '#6366f1' : '#10b981',
                      color: 'white',
                      borderRadius: '10px',
                      fontSize: '14px',
                      fontWeight: '500'
                    }}>
                      🎯 <strong>Acción Recomendada:</strong> {pattern.actionable}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* MÉTRICAS GLOBALES DE IA EXPANDIDAS */}
          <div style={{
            background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
            padding: '30px',
            borderRadius: '20px',
            color: 'white'
          }}>
            <h3 style={{ margin: '0 0 25px 0', color: 'white', textAlign: 'center' }}>
              📊 Análisis Completo del Portfolio
            </h3>
            
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: '25px',
              marginBottom: '25px'
            }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '8px' }}>
                  {aiInsights.totalConfigs}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px', lineHeight: '1.4' }}>
                  Configuraciones
                  <br />Analizadas
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '8px' }}>
                  {aiInsights.avgPerformance?.sharpe?.toFixed(2)}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px', lineHeight: '1.4' }}>
                  Sharpe Ratio
                  <br />Promedio
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '8px' }}>
                  {recommendations.filter(r => r.priority === 'high').length}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px', lineHeight: '1.4' }}>
                  Recomendaciones
                  <br />Alta Prioridad
                </div>
              </div>
              
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '8px' }}>
                  {performanceScores.filter(s => s.aiScore >= 80).length}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px', lineHeight: '1.4' }}>
                  Estrategias
                  <br />Tier S (Score ≥80)
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '8px' }}>
                  {patterns.length}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px', lineHeight: '1.4' }}>
                  Patrones Ocultos
                  <br />Detectados
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', marginBottom: '8px' }}>
                  {aiInsights.riskMetrics?.stabilityScore?.toFixed(2)}
                </div>
                <div style={{ opacity: 0.9, fontSize: '14px', lineHeight: '1.4' }}>
                  Stability
                  <br />Score
                </div>
              </div>
            </div>

            {/* DISTRIBUCIÓN DE PERFORMANCE */}
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              padding: '20px',
              borderRadius: '15px',
              marginTop: '25px'
            }}>
              <h4 style={{ margin: '0 0 15px 0', textAlign: 'center' }}>📈 Distribución de Performance</h4>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: '15px',
                textAlign: 'center'
              }}>
                <div>
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                    {Object.keys(aiInsights.techniquePerformance).length}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Técnicas Activas</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                    {Object.keys(aiInsights.assetPerformance).length}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Activos Traded</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                    {Object.keys(aiInsights.timeframePerformance).length}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Timeframes</div>
                </div>
                <div>
                  <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                    {aiInsights.avgPerformance?.avgTrades?.toFixed(0)}
                  </div>
                  <div style={{ fontSize: '12px', opacity: 0.9 }}>Avg Trades/Config</div>
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
          <h3 style={{ margin: '0 0 10px 0' }}>Error en Análisis IA Avanzado</h3>
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

        @keyframes fadeIn {
          0% { opacity: 0; transform: translateY(20px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .touch-target:hover {
          transform: translateY(-2px);
          transition: all 0.3s ease;
        }
      `}</style>

    </div>
  );
};

export default AIRecommendationEngine;
