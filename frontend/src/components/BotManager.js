import React, { useState, useEffect } from 'react';

const BotManager = ({ user, supabase }) => {
  const [bots, setBots] = useState([]);
  const [monthlyBatches, setMonthlyBatches] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBots, setSelectedBots] = useState([]); // ← NUEVO: Para selección múltiple
  const [bulkActionLoading, setBulkActionLoading] = useState(false); // ← NUEVO: Loading acciones masivas

  // 📅 OBTENER MESES DISPONIBLES
  const getAvailableMonths = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(date.toISOString().slice(0, 7)); // "2025-09"
    }
    return months;
  };

  // 🔄 CARGAR DATOS DESDE SUPABASE
  const loadBots = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('bots')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (selectedMonth) {
        query = query.eq('month_batch', selectedMonth);
      }

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      setBots(data || []);
      
      // Limpiar selección al recargar
      setSelectedBots([]);
      
    } catch (error) {
      console.error('Error cargando bots:', error);
      alert('Error cargando bots: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 📊 CARGAR ESTADÍSTICAS MENSUALES
  const loadMonthlyStats = async () => {
    try {
      const { data, error } = await supabase
        .from('monthly_bot_batches')
        .select('*')
        .eq('user_id', user.id)
        .order('batch_month', { ascending: false });
      
      if (error) throw error;
      setMonthlyBatches(data || []);
    } catch (error) {
      console.error('Error cargando estadísticas mensuales:', error);
    }
  };

  // ✅ MARCAR BOT COMO BUENO/MALO
  const markBot = async (botId, newStatus, notes = '') => {
    try {
      const { error } = await supabase
        .from('bots')
        .update({
          status: newStatus,
          user_notes: notes,
          marked_by: user.id,
          marked_date: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', botId);

      if (error) throw error;

      // Actualizar estado local
      setBots(bots.map(bot => 
        bot.id === botId 
          ? { ...bot, status: newStatus, user_notes: notes }
          : bot
      ));

      // Registrar en histórico
      try {
        await supabase.from('bot_performance_history').insert({
          bot_id: botId,
          review_month: new Date().toISOString().slice(0, 7),
          new_status: newStatus,
          review_notes: notes,
          reviewed_by: user.id
        });
      } catch (historyError) {
        console.warn('No se pudo registrar en histórico:', historyError);
      }

    } catch (error) {
      console.error('Error marcando bot:', error);
      alert('Error al marcar bot: ' + error.message);
    }
  };

  // 🗑️ ELIMINAR BOTS SELECCIONADOS (NUEVO)
  const deleteBots = async (botIds = selectedBots) => {
    if (!botIds || botIds.length === 0) {
      alert('Selecciona bots para eliminar');
      return;
    }

    const confirmed = window.confirm(
      `¿Estás seguro de eliminar ${botIds.length} bot(s)?\n\n` +
      `Esta acción NO se puede deshacer.\n` +
      `Se eliminarán permanentemente de la base de datos.`
    );

    if (!confirmed) return;

    setBulkActionLoading(true);
    try {
      console.log('🗑️ Eliminando bots:', botIds);

      const { error } = await supabase
        .from('bots')
        .delete()
        .in('id', botIds);

      if (error) throw error;

      // Actualizar estado local
      setBots(bots.filter(bot => !botIds.includes(bot.id)));
      setSelectedBots([]);
      
      alert(`✅ ${botIds.length} bot(s) eliminado(s) exitosamente`);
      
      // Recargar estadísticas
      await loadMonthlyStats();

    } catch (error) {
      console.error('Error eliminando bots:', error);
      alert(`❌ Error eliminando bots: ${error.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // 🔄 MARCAR MÚLTIPLES BOTS (NUEVO)
  const markMultipleBots = async (status) => {
    if (selectedBots.length === 0) {
      alert('Selecciona bots para marcar');
      return;
    }

    const statusText = status === 'good' ? 'BUENOS' : 'MALOS';
    const confirmed = window.confirm(
      `¿Marcar ${selectedBots.length} bot(s) como ${statusText}?`
    );

    if (!confirmed) return;

    setBulkActionLoading(true);
    try {
      const updates = selectedBots.map(botId => ({
        id: botId,
        status: status,
        marked_by: user.id,
        marked_date: new Date().toISOString(),
        user_notes: `Marcado masivamente como ${statusText} el ${new Date().toLocaleDateString()}`
      }));

      const { error } = await supabase
        .from('bots')
        .upsert(updates);

      if (error) throw error;

      // Actualizar estado local
      setBots(bots.map(bot => 
        selectedBots.includes(bot.id)
          ? { ...bot, status: status }
          : bot
      ));

      setSelectedBots([]);
      alert(`✅ ${selectedBots.length} bot(s) marcado(s) como ${statusText}`);

    } catch (error) {
      console.error('Error marcando bots masivamente:', error);
      alert(`❌ Error: ${error.message}`);
    } finally {
      setBulkActionLoading(false);
    }
  };

  // 🔄 FUNCIONES DE SELECCIÓN (NUEVAS)
  const toggleSelectBot = (botId) => {
    setSelectedBots(prev => 
      prev.includes(botId) 
        ? prev.filter(id => id !== botId)
        : [...prev, botId]
    );
  };

  const selectAllBots = () => {
    setSelectedBots(bots.map(bot => bot.id));
  };

  const clearSelection = () => {
    setSelectedBots([]);
  };

  // 📥 IMPORTAR BOTS MASIVAMENTE (Mejorado para evitar duplicados)
  const importBotsFromBacktest = async (backtestResults, monthBatch) => {
    if (!backtestResults || backtestResults.length === 0) {
      alert('No hay resultados de backtesting para importar');
      return;
    }

    try {
      setLoading(true);

      const botsToInsert = backtestResults.map(result => ({
        // Clave única para evitar duplicados
        unique_key: `${result.configName}_${monthBatch}_${user.id}_${result.activo}`,
        name: result.configName || `Bot_${Date.now()}`,
        config_name: result.configName,
        created_date: new Date().toISOString().split('T')[0],
        month_batch: monthBatch,
        activo: result.activo || 'EURUSD',
        temporalidad: result.temporalidad || 'M15',
        tecnicas: result.tecnicas || {},
        sharpe_ratio: parseFloat(result.sharpeRatio || 0),
        win_rate: parseFloat(result.winRate || 0),
        profit_factor: parseFloat(result.profitFactor || 1),
        max_drawdown: parseFloat(result.maxDrawdown || 0),
        total_trades: parseInt(result.totalTrades || 0),
        total_return: parseFloat(result.totalReturn || 0),
        status: 'pending',
        data_source: 'backtesting_simulado',
        user_id: user.id
      }));

      // Usar UPSERT para evitar duplicados
      const { error } = await supabase
        .from('bots')
        .upsert(botsToInsert, { 
          onConflict: 'unique_key'
        });

      if (error) throw error;

      // Actualizar estadísticas del batch
      await supabase
        .from('monthly_bot_batches')
        .upsert({
          batch_month: monthBatch,
          total_bots: botsToInsert.length,
          pending_bots: botsToInsert.length,
          user_id: user.id
        });

      alert(`✅ ${botsToInsert.length} bots importados exitosamente para ${monthBatch}`);
      loadBots();
      loadMonthlyStats();

    } catch (error) {
      console.error('Error importando bots:', error);
      alert('Error importando bots: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 🎨 OBTENER COLOR SEGÚN STATUS
  const getStatusColor = (status) => {
    switch (status) {
      case 'good': return '#10b981';
      case 'bad': return '#ef4444';
      case 'pending': return '#f59e0b';
      default: return '#6b7280';
    }
  };

  // 🏆 OBTENER EMOJI SEGÚN STATUS
  const getStatusEmoji = (status) => {
    switch (status) {
      case 'good': return '✅';
      case 'bad': return '❌';
      case 'pending': return '⏳';
      default: return '❓';
    }
  };

  useEffect(() => {
    if (user) {
      setSelectedMonth(new Date().toISOString().slice(0, 7)); // Mes actual
      loadBots();
      loadMonthlyStats();
    }
  }, [user, selectedMonth, filterStatus]);

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
          background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '32px'
        }}>
          🤖
        </span>
        Gestión Avanzada de Bots de Trading
      </h2>

      {/* NAVEGACIÓN */}
      <div style={{
        display: 'flex',
        gap: '10px',
        marginBottom: '25px',
        flexWrap: 'wrap',
        justifyContent: 'center'
      }}>
        {[
          { key: 'overview', label: '📊 Resumen General', color: '#3b82f6' },
          { key: 'bots', label: '🤖 Gestión de Bots', color: '#10b981' },
          { key: 'import', label: '📥 Importar Lote', color: '#f59e0b' },
          { key: 'history', label: '📈 Histórico Mensual', color: '#8b5cf6' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 18px',
              background: activeTab === tab.key ? tab.color : 'var(--bg-primary)',
              color: activeTab === tab.key ? 'white' : 'var(--text-primary)',
              border: `1px solid ${activeTab === tab.key ? tab.color : 'var(--border-color)'}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold',
              transition: 'all 0.3s ease'
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* CONTENIDO POR TABS */}
      {activeTab === 'overview' && (
        <div>
          {/* ESTADÍSTICAS GLOBALES */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '20px',
            marginBottom: '30px'
          }}>
            {[
              { 
                label: 'Total Bots', 
                value: bots.length, 
                icon: '🤖', 
                color: '#3b82f6' 
              },
              { 
                label: 'Bots Buenos', 
                value: bots.filter(b => b.status === 'good').length, 
                icon: '✅', 
                color: '#10b981' 
              },
              { 
                label: 'Bots Malos', 
                value: bots.filter(b => b.status === 'bad').length, 
                icon: '❌', 
                color: '#ef4444' 
              },
              { 
                label: 'Pendientes', 
                value: bots.filter(b => b.status === 'pending').length, 
                icon: '⏳', 
                color: '#f59e0b' 
              }
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
                  fontSize: '2em', 
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
        </div>
      )}

      {activeTab === 'bots' && (
        <div>
          {/* FILTROS */}
          <div style={{
            display: 'flex',
            gap: '15px',
            marginBottom: '25px',
            flexWrap: 'wrap',
            alignItems: 'center'
          }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              style={{
                padding: '8px 15px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="">Todos los meses</option>
              {getAvailableMonths().map(month => (
                <option key={month} value={month}>{month}</option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                padding: '8px 15px',
                borderRadius: '8px',
                border: '1px solid var(--border-color)',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="all">Todos los estados</option>
              <option value="pending">⏳ Pendientes</option>
              <option value="good">✅ Buenos</option>
              <option value="bad">❌ Malos</option>
            </select>

            <div style={{ 
              fontSize: '14px', 
              color: 'var(--text-secondary)',
              marginLeft: 'auto'
            }}>
              {loading ? 'Cargando...' : `${bots.length} bots encontrados`}
            </div>
          </div>

          {/* CONTROLES DE SELECCIÓN MÚLTIPLE */}
          {bots.length > 0 && (
            <div style={{
              display: 'flex',
              gap: '10px',
              marginBottom: '20px',
              padding: '15px',
              background: 'var(--bg-primary)',
              borderRadius: '8px',
              border: '1px solid var(--border-color)',
              alignItems: 'center',
              flexWrap: 'wrap'
            }}>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={selectAllBots}
                  style={{
                    padding: '6px 12px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Seleccionar Todo
                </button>
                <button
                  onClick={clearSelection}
                  style={{
                    padding: '6px 12px',
                    background: '#6b7280',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  Limpiar Selección
                </button>
              </div>

              {selectedBots.length > 0 && (
                <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                  <span style={{ fontSize: '14px', color: 'var(--text-primary)' }}>
                    {selectedBots.length} seleccionado(s):
                  </span>
                  <button
                    onClick={() => markMultipleBots('good')}
                    disabled={bulkActionLoading}
                    style={{
                      padding: '6px 12px',
                      background: bulkActionLoading ? '#9ca3af' : '#10b981',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: bulkActionLoading ? 'not-allowed' : 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ✅ Marcar Buenos
                  </button>
                  <button
                    onClick={() => markMultipleBots('bad')}
                    disabled={bulkActionLoading}
                    style={{
                      padding: '6px 12px',
                      background: bulkActionLoading ? '#9ca3af' : '#ef4444',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: bulkActionLoading ? 'not-allowed' : 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    ❌ Marcar Malos
                  </button>
                  <button
                    onClick={() => deleteBots()}
                    disabled={bulkActionLoading}
                    style={{
                      padding: '6px 12px',
                      background: bulkActionLoading ? '#9ca3af' : '#dc2626',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      cursor: bulkActionLoading ? 'not-allowed' : 'pointer',
                      fontSize: '12px'
                    }}
                  >
                    🗑️ Eliminar
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LISTA DE BOTS */}
          {bots.length > 0 ? (
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
                    <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>
                      <input
                        type="checkbox"
                        checked={selectedBots.length === bots.length && bots.length > 0}
                        onChange={() => selectedBots.length === bots.length ? clearSelection() : selectAllBots()}
                        style={{ transform: 'scale(1.2)' }}
                      />
                    </th>
                    <th style={{ padding: '12px', textAlign: 'left', color: 'white' }}>Bot</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Sharpe*</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Win Rate*</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Trades*</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Estado</th>
                    <th style={{ padding: '12px', textAlign: 'center', color: 'white' }}>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {bots.map((bot, index) => (
                    <tr key={bot.id} style={{
                      borderBottom: '1px solid var(--border-color)',
                      background: index % 2 === 0 ? 'var(--bg-primary)' : 'var(--bg-secondary)',
                      opacity: selectedBots.includes(bot.id) ? 0.8 : 1
                    }}>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <input
                          type="checkbox"
                          checked={selectedBots.includes(bot.id)}
                          onChange={() => toggleSelectBot(bot.id)}
                          style={{ transform: 'scale(1.1)' }}
                        />
                      </td>
                      <td style={{ padding: '12px' }}>
                        <div>
                          <div style={{ fontWeight: 'bold', color: 'var(--text-primary)' }}>
                            {bot.name?.substring(0, 30) || 'Sin nombre'}...
                          </div>
                          <div style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
                            {bot.activo} • {bot.temporalidad} • {bot.month_batch}
                            {bot.data_source === 'backtesting_simulado' && (
                              <span style={{ color: '#f59e0b', fontWeight: 'bold' }}> • Simulado</span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        color: bot.sharpe_ratio > 1 ? '#10b981' : '#6b7280',
                        fontWeight: 'bold'
                      }}>
                        {bot.sharpe_ratio?.toFixed(2) || 'N/A'}
                      </td>
                      <td style={{ 
                        padding: '12px', 
                        textAlign: 'center',
                        color: bot.win_rate > 60 ? '#10b981' : '#6b7280',
                        fontWeight: 'bold'
                      }}>
                        {bot.win_rate?.toFixed(1) || 'N/A'}%
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        {bot.total_trades || 0}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '4px 8px',
                          background: getStatusColor(bot.status),
                          color: 'white',
                          borderRadius: '12px',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}>
                          {getStatusEmoji(bot.status)} {bot.status?.toUpperCase()}
                        </span>
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '5px', justifyContent: 'center' }}>
                          {bot.status !== 'good' && (
                            <button
                              onClick={() => markBot(bot.id, 'good', `Marcado como bueno el ${new Date().toLocaleDateString()}`)}
                              style={{
                                padding: '4px 8px',
                                background: '#10b981',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ✅ Bueno
                            </button>
                          )}
                          
                          {bot.status !== 'bad' && (
                            <button
                              onClick={() => markBot(bot.id, 'bad', `Marcado como malo el ${new Date().toLocaleDateString()}`)}
                              style={{
                                padding: '4px 8px',
                                background: '#ef4444',
                                color: 'white',
                                border: 'none',
                                borderRadius: '4px',
                                cursor: 'pointer',
                                fontSize: '12px'
                              }}
                            >
                              ❌ Malo
                            </button>
                          )}

                          <button
                            onClick={() => deleteBots([bot.id])}
                            style={{
                              padding: '4px 8px',
                              background: '#dc2626',
                              color: 'white',
                              border: 'none',
                              borderRadius: '4px',
                              cursor: 'pointer',
                              fontSize: '12px'
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ fontSize: '12px', color: '#666', marginTop: '10px', textAlign: 'center' }}>
                * Métricas con asterisco provienen de backtesting simulado, no de trading real
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '60px',
              background: 'var(--bg-primary)',
              borderRadius: '15px',
              border: '1px solid var(--border-color)'
            }}>
              <div style={{ fontSize: '64px', marginBottom: '20px', opacity: 0.5 }}>🤖</div>
              <h3 style={{ color: 'var(--text-primary)' }}>No hay bots en este filtro</h3>
              <p style={{ color: 'var(--text-secondary)' }}>
                {selectedMonth ? `No hay bots para ${selectedMonth}` : 'No hay bots registrados'}
              </p>
            </div>
          )}
        </div>
      )}

      {activeTab === 'import' && (
        <div style={{
          background: 'var(--bg-primary)',
          padding: '30px',
          borderRadius: '15px',
          border: '1px solid var(--border-color)',
          textAlign: 'center'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>
            📥 Importar Lote Mensual de Bots
          </h3>
          
          <p style={{ color: 'var(--text-secondary)', marginBottom: '25px' }}>
            Ejecuta primero el backtesting para generar bots, luego impórtalos aquí para su gestión.
          </p>

          <div style={{
            marginTop: '25px',
            padding: '20px',
            background: 'rgba(59, 130, 246, 0.1)',
            borderRadius: '10px',
            textAlign: 'left'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: 'var(--primary-color)' }}>
              💡 Flujo de trabajo recomendado:
            </h4>
            <ol style={{ color: 'var(--text-secondary)', margin: 0, paddingLeft: '20px' }}>
              <li>Ejecutar backtesting masivo (ej: 30 bots en septiembre)</li>
              <li>Usar botón "📥 Importar Bots a Gestión" en BacktestingEngine</li>
              <li>Revisar mensualmente y marcar bots buenos/malos</li>
              <li>Usar solo bots marcados como "buenos" en futuros análisis</li>
              <li>Sistema de IA excluirá automáticamente bots "malos"</li>
              <li>✅ Sistema previene duplicados automáticamente</li>
            </ol>
          </div>
        </div>
      )}

      {activeTab === 'history' && (
        <div style={{
          background: 'var(--bg-primary)',
          padding: '25px',
          borderRadius: '15px',
          border: '1px solid var(--border-color)'
        }}>
          <h3 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>
            📈 Histórico de Revisiones Mensuales
          </h3>
          
          <div style={{
            textAlign: 'center',
            padding: '40px',
            color: 'var(--text-secondary)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '15px', opacity: 0.5 }}>📊</div>
            <p>Funcionalidad en desarrollo...</p>
            <p>Aquí podrás ver el histórico completo de todas las revisiones mensuales.</p>
          </div>
        </div>
      )}

      {/* LOADING OVERLAY */}
      {(loading || bulkActionLoading) && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000
        }}>
          <div style={{
            background: 'white',
            padding: '20px',
            borderRadius: '10px',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '24px', marginBottom: '10px' }}>🔄</div>
            <div>{bulkActionLoading ? 'Procesando acción masiva...' : 'Cargando bots...'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotManager;
