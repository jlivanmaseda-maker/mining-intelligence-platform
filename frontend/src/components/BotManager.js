import React, { useState, useEffect } from 'react';

const BotManager = ({ user, supabase }) => {
  const [bots, setBots] = useState([]);
  const [monthlyBatches, setMonthlyBatches] = useState([]);
  const [selectedMonth, setSelectedMonth] = useState('');
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('overview');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedBots, setSelectedBots] = useState([]); // ← Para selección múltiple
  const [bulkActionLoading, setBulkActionLoading] = useState(false);

  // 📅 OBTENER MESES DISPONIBLES
  const getAvailableMonths = () => {
    const months = [];
    const currentDate = new Date();
    for (let i = 0; i < 12; i++) {
      const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      months.push(date.toISOString().slice(0, 7));
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
      setSelectedBots([]); // Limpiar selección
      
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

    } catch (error) {
      console.error('Error marcando bot:', error);
      alert('Error al marcar bot: ' + error.message);
    }
  };

  // 🗑️ ELIMINAR BOTS (NUEVA FUNCIONALIDAD)
  const deleteBots = async (botIds = selectedBots) => {
    if (!botIds || botIds.length === 0) {
      alert('Por favor, selecciona bots para eliminar');
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

  // 🔄 MARCAR MÚLTIPLES BOTS
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

  // 🔄 FUNCIONES DE SELECCIÓN
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
      setSelectedMonth(new Date().toISOString().slice(0, 7));
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
        🤖 Gestión Avanzada de Bots de Trading
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
          { key: 'bots', label: '🤖 Gestión de Bots', color: '#10b981' }
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

      {/* CONTENIDO */}
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
              { label: 'Total Bots', value: bots.length, icon: '🤖', color: '#3b82f6' },
              { label: 'Bots Buenos', value: bots.filter(b => b.status === 'good').length, icon: '✅', color: '#10b981' },
              { label: 'Bots Malos', value: bots.filter(b => b.status === 'bad').length, icon: '❌', color: '#ef4444' },
              { label: 'Pendientes', value: bots.filter(b => b.status === 'pending').length, icon: '⏳', color: '#f59e0b' }
            ].map((stat, index) => (
              <div key={index} style={{
                background: 'var(--bg-primary)',
                padding: '20px',
                borderRadius: '12px',
                textAlign: 'center',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ fontSize: '2em', marginBottom: '8px' }}>{stat.icon}</div>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: stat.color, marginBottom: '5px' }}>
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

            <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginLeft: 'auto' }}>
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
                  ☑️ Seleccionar Todo
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
                  🔄 Limpiar Selección
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
                    🗑️ Eliminar Seleccionados
                  </button>
                </div>
              )}
            </div>
          )}

          {/* LISTA DE BOTS CON OPCIÓN DE ELIMINAR */}
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
                              ✅
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
                              ❌
                            </button>
                          )}

                          {/* BOTÓN ELIMINAR INDIVIDUAL */}
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
                            title="Eliminar este bot"
                          >
                            🗑️
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
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
            <div>{bulkActionLoading ? 'Eliminando bots...' : 'Cargando bots...'}</div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BotManager;
