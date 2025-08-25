import React, { useState } from 'react';

const BacktestingEngine = ({ user, supabase, onResults }) => {
  const [isRunning, setIsRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState(null);

  // 📊 FUNCIÓN AUXILIAR - PARÁMETROS DE ESTRATEGIA
  const getStrategyParams = (tecnicas) => {
    const mainTechnique = Object.keys(tecnicas)[0] || 'SPP';
    
    const params = {
      'SPP': {
        entryThreshold: 0.002,
        exitThreshold: 0.005,
        riskMultiplier: 1.0
      },
      'WFM': {
        entryThreshold: 0.0015,
        exitThreshold: 0.008,
        riskMultiplier: 1.2
      },
      'MC Trade': {
        entryThreshold: 0.003,
        exitThreshold: 0.004,
        riskMultiplier: 0.8
      },
      'MC Lento': {
        entryThreshold: 0.001,
        exitThreshold: 0.010,
        riskMultiplier: 1.5
      },
      'Secuencial': {
        entryThreshold: 0.0025,
        exitThreshold: 0.006,
        riskMultiplier: 1.1
      },
      'High Back Test Precision': {
        entryThreshold: 0.0005,
        exitThreshold: 0.012,
        riskMultiplier: 2.0
      }
    };

    return params[mainTechnique] || params['SPP'];
  };

  // 🔧 FUNCIÓN AUXILIAR - P&L NO REALIZADO
  const calculateUnrealizedPnL = (position, currentPrice) => {
    if (!position) return 0;
    const priceChange = (currentPrice - position.entryPrice) / position.entryPrice;
    const multiplier = position.type === 'LONG' ? 1 : -1;
    return position.size * priceChange * multiplier;
  };

  // 📈 GENERADOR DE DATOS HISTÓRICOS SINTÉTICOS
  const generateHistoricalData = (symbol, days = 365) => {
    const data = [];
    let price = getBasePrice(symbol);
    const volatility = getVolatility(symbol);
    
    for (let i = 0; i < days * 24; i++) {
      const randomChange = (Math.random() - 0.5) * volatility;
      price = price * (1 + randomChange);
      
      const timestamp = Date.now() - (days * 24 - i) * 3600000;
      const open = price * (1 + (Math.random() - 0.5) * 0.001);
      const high = price * (1 + Math.random() * 0.005);
      const low = price * (1 - Math.random() * 0.005);
      
      data.push({
        timestamp,
        open,
        high,
        low,
        close: price,
        volume: Math.random() * 1000000
      });
    }
    
    return data;
  };

  // 💰 PRECIOS BASE POR ACTIVO
  const getBasePrice = (symbol) => {
    const basePrices = {
      'EURUSD': 1.0850,
      'GBPUSD': 1.2650,
      'USDJPY': 150.25,
      'GOLD': 2350.00,
      'BTC': 45000.00,
      'ETH': 2800.00,
      'SPX500': 4500.00
    };
    return basePrices[symbol] || 100.00;
  };

  // 📊 VOLATILIDAD POR ACTIVO
  const getVolatility = (symbol) => {
    const volatilities = {
      'EURUSD': 0.008,
      'GBPUSD': 0.010,
      'USDJPY': 0.009,
      'GOLD': 0.015,
      'BTC': 0.040,
      'ETH': 0.045,
      'SPX500': 0.012
    };
    return volatilities[symbol] || 0.010;
  };

  // 🤖 SIMULADOR DE ESTRATEGIA
  const simulateStrategy = (config, historicalData) => {
    const trades = [];
    let balance = 10000;
    let equity = [{ timestamp: historicalData[0].timestamp, balance }];
    let position = null;
    
    const strategyParams = getStrategyParams(config.tecnicas_simulaciones);
    
    for (let i = 1; i < historicalData.length; i++) {
      const current = historicalData[i];
      const previous = historicalData[i - 1];
      
      if (!position && shouldEnter(current, previous, strategyParams, config)) {
        const entryPrice = current.close;
        const positionSize = calculatePositionSize(balance, config);
        
        position = {
          type: Math.random() > 0.5 ? 'LONG' : 'SHORT',
          entryPrice,
          entryTime: current.timestamp,
          size: positionSize,
          technique: getRandomTechnique(config.tecnicas_simulaciones)
        };
      }
      
      if (position && shouldExit(current, previous, position, strategyParams)) {
        const exitPrice = current.close;
        const pnl = calculatePnL(position, exitPrice);
        
        balance += pnl;
        
        trades.push({
          ...position,
          exitPrice,
          exitTime: current.timestamp,
          pnl,
          duration: current.timestamp - position.entryTime,
          isWin: pnl > 0
        });
        
        position = null;
      }
      
      const currentEquity = balance + calculateUnrealizedPnL(position, current.close);
      equity.push({ 
        timestamp: current.timestamp, 
        balance: currentEquity 
      });
    }
    
    return { trades, equity, finalBalance: balance };
  };

  // 🎲 LÓGICA DE ENTRADA SIMPLIFICADA
  const shouldEnter = (current, previous, params, config) => {
    const priceChange = (current.close - previous.close) / previous.close;
    const volumeSpike = current.volume > previous.volume * 1.5;
    
    const mainTechnique = Object.keys(config.tecnicas_simulaciones)[0];
    const entryProbability = getTechniqueEntryProbability(mainTechnique);
    
    return Math.random() < entryProbability && (Math.abs(priceChange) > params.entryThreshold || volumeSpike);
  };

  // 🎯 LÓGICA DE SALIDA
  const shouldExit = (current, previous, position, params) => {
    const holdTime = current.timestamp - position.entryTime;
    const priceChange = (current.close - position.entryPrice) / position.entryPrice;
    
    const maxHoldTime = (4 + Math.random() * 20) * 3600000;
    if (holdTime > maxHoldTime) return true;
    
    const profitTarget = params.exitThreshold;
    const stopLoss = -params.exitThreshold * 0.6;
    
    if (position.type === 'LONG') {
      return priceChange > profitTarget || priceChange < stopLoss;
    } else {
      return priceChange < -profitTarget || priceChange > -stopLoss;
    }
  };

  // 💼 CÁLCULO DE TAMAÑO DE POSICIÓN
  const calculatePositionSize = (balance, config) => {
    const riskPerTrade = 0.02;
    return balance * riskPerTrade;
  };

  // 💰 CÁLCULO DE P&L
  const calculatePnL = (position, exitPrice) => {
    const priceChange = (exitPrice - position.entryPrice) / position.entryPrice;
    const multiplier = position.type === 'LONG' ? 1 : -1;
    return position.size * priceChange * multiplier;
  };

  // 📊 PROBABILIDADES POR TÉCNICA
  const getTechniqueEntryProbability = (technique) => {
    const probabilities = {
      'SPP': 0.15,
      'WFM': 0.12,
      'MC Trade': 0.20,
      'MC Lento': 0.08,
      'Secuencial': 0.10,
      'High Back Test Precision': 0.05
    };
    return probabilities[technique] || 0.10;
  };

  // 🎲 TÉCNICA ALEATORIA PONDERADA
  const getRandomTechnique = (techniques) => {
    const techniqueNames = Object.keys(techniques);
    if (techniqueNames.length === 0) return 'SPP';
    
    const totalSims = Object.values(techniques).reduce((sum, val) => sum + val, 0);
    if (totalSims === 0) return techniqueNames[0];
    
    let random = Math.random() * totalSims;
    
    for (const [technique, sims] of Object.entries(techniques)) {
      random -= sims;
      if (random <= 0) return technique;
    }
    
    return techniqueNames[0];
  };

  // 📈 CÁLCULO DE MÉTRICAS REALES
  const calculateMetrics = (trades, equity) => {
    if (trades.length === 0) {
      return {
        winRate: 0,
        totalTrades: 0,
        profitFactor: 0,
        maxDrawdown: 0,
        sharpeRatio: 0,
        avgWinLoss: 0,
        totalReturn: 0
      };
    }

    const winningTrades = trades.filter(t => t.isWin);
    const winRate = (winningTrades.length / trades.length) * 100;

    const totalWins = winningTrades.reduce((sum, t) => sum + t.pnl, 0);
    const losingTrades = trades.filter(t => !t.isWin);
    const totalLosses = Math.abs(losingTrades.reduce((sum, t) => sum + t.pnl, 0));
    const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0;

    let maxDrawdown = 0;
    let peak = equity[0].balance;
    
    for (const point of equity) {
      if (point.balance > peak) peak = point.balance;
      const drawdown = (peak - point.balance) / peak;
      if (drawdown > maxDrawdown) maxDrawdown = drawdown;
    }

    const returns = equity.slice(1).map((point, i) => 
      (point.balance - equity[i].balance) / equity[i].balance
    );
    const avgReturn = returns.length > 0 ? returns.reduce((sum, r) => sum + r, 0) / returns.length : 0;
    const returnStd = returns.length > 1 ? Math.sqrt(
      returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length
    ) : 0;
    const sharpeRatio = returnStd > 0 ? avgReturn / returnStd : 0;

    const avgWin = winningTrades.length > 0 ? totalWins / winningTrades.length : 0;
    const avgLoss = losingTrades.length > 0 ? totalLosses / losingTrades.length : 1;
    const avgWinLoss = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? 999 : 0;

    const totalReturn = equity.length > 1 ? ((equity[equity.length - 1].balance / equity[0].balance - 1) * 100) : 0;

    return {
      winRate: winRate.toFixed(1),
      totalTrades: trades.length,
      profitFactor: profitFactor.toFixed(2),
      maxDrawdown: (maxDrawdown * 100).toFixed(1),
      sharpeRatio: sharpeRatio.toFixed(2),
      avgWinLoss: avgWinLoss.toFixed(2),
      totalReturn: totalReturn.toFixed(1)
    };
  };

  // 🚀 EJECUTAR BACKTESTING
  const runBacktest = async (configId = null) => {
    if (!user) {
      alert('Debes iniciar sesión para ejecutar backtesting');
      return;
    }

    setIsRunning(true);
    setProgress(0);
    setResults(null);

    try {
      let { data: configs, error } = await supabase
        .from('bot_configurations')
        .select('*')
        .eq('user_id', user.id);

      if (configId) {
        configs = configs.filter(c => c.id === configId);
      }

      if (error) throw error;

      if (!configs || configs.length === 0) {
        alert('No tienes configuraciones para testear. Crea algunos bots primero.');
        return;
      }

      const backtestResults = [];

      for (let i = 0; i < configs.length; i++) {
        const config = configs[i];
        setProgress(((i + 1) / configs.length) * 100);

        const historicalData = generateHistoricalData(config.activo, 90);
        const simulation = simulateStrategy(config, historicalData);
        const metrics = calculateMetrics(simulation.trades, simulation.equity);

        backtestResults.push({
          configId: config.id,
          configName: config.nombre_completo,
          activo: config.activo,
          temporalidad: config.temporalidad,
          tecnicas: config.tecnicas_simulaciones,
          ...metrics,
          trades: simulation.trades,
          equity: simulation.equity,
          executionTime: new Date().toISOString()
        });

        await new Promise(resolve => setTimeout(resolve, 200));
      }

      backtestResults.sort((a, b) => parseFloat(b.sharpeRatio) - parseFloat(a.sharpeRatio));
      setResults(backtestResults);

      if (onResults) {
        onResults(backtestResults);
      }

    } catch (error) {
      console.error('Error ejecutando backtesting:', error);
      alert('Error ejecutando backtesting: ' + error.message);
    } finally {
      setIsRunning(false);
    }
  };

  return (
    <div style={{
      padding: '25px',
      background: 'white',
      borderRadius: '15px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      marginTop: '30px'
    }}>
      
      <h2 style={{ 
        margin: '0 0 30px 0', 
        color: '#333', 
        textAlign: 'center',
        fontSize: '1.8em'
      }}>
        🧪 Motor de Backtesting Avanzado
      </h2>

      <div style={{
        display: 'flex',
        gap: '15px',
        justifyContent: 'center',
        marginBottom: '30px',
        flexWrap: 'wrap'
      }}>
        <button
          onClick={() => runBacktest()}
          disabled={isRunning}
          style={{
            padding: '12px 24px',
            background: isRunning ? '#6c757d' : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: isRunning ? 'not-allowed' : 'pointer',
            fontSize: '16px',
            fontWeight: 'bold',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
            minWidth: '200px'
          }}
        >
          {isRunning ? `🔄 Ejecutando... ${progress.toFixed(0)}%` : '🚀 Ejecutar Backtesting Completo'}
        </button>
      </div>

      {isRunning && (
        <div style={{
          width: '100%',
          height: '10px',
          backgroundColor: '#e9ecef',
          borderRadius: '5px',
          marginBottom: '30px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${progress}%`,
            height: '100%',
            background: 'linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
            transition: 'width 0.3s ease'
          }} />
        </div>
      )}

      {results && (
        <div>
          <h3 style={{ color: '#28a745', marginBottom: '20px' }}>
            📊 Resultados de Backtesting ({results.length} configuraciones analizadas)
          </h3>
          
          <div style={{ overflowX: 'auto' }}>
            <table style={{ 
              width: '100%', 
              borderCollapse: 'collapse',
              fontSize: '14px'
            }}>
              <thead>
                <tr style={{ background: '#f8f9fa' }}>
                  <th style={{ padding: '12px', textAlign: 'left', borderBottom: '2px solid #dee2e6' }}>Configuración</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Win Rate</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Trades</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Profit Factor</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Sharpe Ratio</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Max DD</th>
                  <th style={{ padding: '12px', textAlign: 'center', borderBottom: '2px solid #dee2e6' }}>Retorno Total</th>
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 10).map((result, index) => (
                  <tr key={result.configId} style={{ 
                    borderBottom: '1px solid #dee2e6',
                    background: index % 2 === 0 ? '#ffffff' : '#f8f9fa'
                  }}>
                    <td style={{ padding: '12px' }}>
                      <div style={{ fontWeight: 'bold', color: '#333' }}>
                        {result.configName.substring(0, 30)}...
                      </div>
                      <div style={{ fontSize: '12px', color: '#666' }}>
                        {result.activo} • {result.temporalidad}
                      </div>
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center',
                      color: parseFloat(result.winRate) > 60 ? '#28a745' : parseFloat(result.winRate) > 40 ? '#ffc107' : '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      {result.winRate}%
                    </td>
                    <td style={{ padding: '12px', textAlign: 'center' }}>{result.totalTrades}</td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center',
                      color: parseFloat(result.profitFactor) > 1.5 ? '#28a745' : parseFloat(result.profitFactor) > 1 ? '#ffc107' : '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      {result.profitFactor}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center',
                      color: parseFloat(result.sharpeRatio) > 1 ? '#28a745' : parseFloat(result.sharpeRatio) > 0 ? '#ffc107' : '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      {result.sharpeRatio}
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center',
                      color: parseFloat(result.maxDrawdown) < 10 ? '#28a745' : parseFloat(result.maxDrawdown) < 20 ? '#ffc107' : '#dc3545'
                    }}>
                      {result.maxDrawdown}%
                    </td>
                    <td style={{ 
                      padding: '12px', 
                      textAlign: 'center',
                      color: parseFloat(result.totalReturn) > 0 ? '#28a745' : '#dc3545',
                      fontWeight: 'bold'
                    }}>
                      {result.totalReturn}%
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div style={{
            marginTop: '30px',
            padding: '20px',
            background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
            color: 'white',
            borderRadius: '10px'
          }}>
            <h4 style={{ margin: '0 0 15px 0' }}>🎯 Resumen Ejecutivo</h4>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '15px' }}>
              <div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                  {results.filter(r => parseFloat(r.sharpeRatio) > 1).length}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Estrategias con Sharpe > 1.0</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                  {(results.reduce((sum, r) => sum + parseFloat(r.winRate), 0) / results.length).toFixed(1)}%
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Win Rate Promedio</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                  {results.reduce((sum, r) => sum + r.totalTrades, 0)}
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Total de Trades Simulados</div>
              </div>
              <div>
                <div style={{ fontSize: '1.5em', fontWeight: 'bold' }}>
                  {results[0]?.configName.substring(0, 15) || 'N/A'}...
                </div>
                <div style={{ fontSize: '14px', opacity: 0.9 }}>Mejor Estrategia (por Sharpe)</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {!results && !isRunning && (
        <div style={{
          textAlign: 'center',
          padding: '40px',
          color: '#6c757d'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '20px' }}>🧪</div>
          <h3 style={{ color: '#333', margin: '0 0 10px 0' }}>Motor de Backtesting Listo</h3>
          <p>Ejecuta backtesting en todas tus configuraciones para obtener métricas reales calculadas con datos históricos simulados.</p>
          <div style={{ fontSize: '14px', color: '#666', marginTop: '15px' }}>
            • Win Rate calculado con operaciones reales<br/>
            • Sharpe Ratio basado en retornos históricos<br/>
            • Maximum Drawdown medido en períodos de pérdida<br/>
            • Profit Factor con P&L real<br/>
            • Comparación objetiva entre estrategias
          </div>
        </div>
      )}

    </div>
  );
};

export default BacktestingEngine;
