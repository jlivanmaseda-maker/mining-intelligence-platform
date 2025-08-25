import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import MassiveGenerator from './components/MassiveGenerator';
import Dashboard from './components/Dashboard';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [user, setUser] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [userBots, setUserBots] = useState([]);
  const [globalPatterns, setGlobalPatterns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showDashboard, setShowDashboard] = useState(false); // NUEVO ESTADO
  const [authError, setAuthError] = useState(null);
  const [deleting, setDeleting] = useState(null);

  // Función para cargar todos los datos
  const loadAllData = async () => {
    try {
      const { data: patterns } = await supabase
        .from('global_mining_patterns')
        .select('*')
        .order('indice_exito', { ascending: false })
        .limit(10);

      setGlobalPatterns(patterns || []);

      if (user) {
        const { data: bots } = await supabase
          .from('bot_configurations')
          .select('*')
          .eq('user_id', user.id)
          .order('fecha_creacion', { ascending: false });

        setUserBots(bots || []);

        const userStats = {
          total_bots: bots?.length || 0,
          active_bots: bots?.filter(bot => bot.estado === 'Activo').length || 0,
          generated_bots: bots?.filter(bot => bot.estado === 'Generado').length || 0
        };
        setGlobalStats(userStats);
      } else {
        setUserBots([]);
        setGlobalStats(null);
      }
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  // Función para eliminar bot individual
  const eliminarBot = async (botId, nombreBot) => {
    if (!window.confirm(`¿Estás seguro de que quieres eliminar el bot "${nombreBot}"?\n\nEsta acción no se puede deshacer.`)) {
      return;
    }

    setDeleting(botId);
    try {
      const { error } = await supabase
        .from('bot_configurations')
        .delete()
        .eq('id', botId)
        .eq('user_id', user.id);

      if (error) {
        console.error('Error eliminando bot:', error);
        alert('Error al eliminar el bot: ' + error.message);
      } else {
        alert('Bot eliminado exitosamente');
        await loadAllData();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error inesperado al eliminar el bot');
    } finally {
      setDeleting(null);
    }
  };

  // Función para eliminar todos los bots
  const eliminarTodosLosBots = async () => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar TODOS tus bots?\n\nEsta acción no se puede deshacer y eliminará todos los bots asociados a tu cuenta.')) {
      return;
    }

    if (!window.confirm('⚠️ CONFIRMACIÓN FINAL ⚠️\n\n¿Realmente quieres eliminar TODOS los bots?\n\nEscribe "ELIMINAR" en la siguiente ventana para confirmar.')) {
      return;
    }

    const confirmacion = prompt('Para confirmar la eliminación de TODOS los bots, escribe exactamente: ELIMINAR');
    if (confirmacion !== 'ELIMINAR') {
      alert('Eliminación cancelada. No se escribió la confirmación correcta.');
      return;
    }

    setDeleting('all');
    try {
      const { error } = await supabase
        .from('bot_configurations')
        .delete()
        .eq('user_id', user.id);

      if (error) {
        console.error('Error eliminando todos los bots:', error);
        alert('Error al eliminar los bots: ' + error.message);
      } else {
        alert('Todos los bots han sido eliminados exitosamente');
        await loadAllData();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error inesperado al eliminar los bots');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    const initializeAuth = async () => {
      try {
        setAuthError(null);
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        
        if (sessionError) {
          console.error('Error getting session:', sessionError);
          setAuthError(sessionError.message);
        } else {
          setUser(session?.user ?? null);
        }
      } catch (error) {
        console.error('Error initializing auth:', error);
        setAuthError('Error de conexión con el servicio de autenticación');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email || 'No user');
        
        setUser(session?.user ?? null);
        setAuthError(null);
        
        switch (event) {
          case 'SIGNED_IN':
            console.log('Usuario logueado exitosamente');
            if (window.location.hash.includes('access_token')) {
              window.history.replaceState(null, '', window.location.pathname);
            }
            break;
          case 'SIGNED_OUT':
            console.log('Usuario cerró sesión');
            setUserBots([]);
            setGlobalStats(null);
            setShowGenerator(false);
            setShowDashboard(false); // RESETEAR DASHBOARD
            break;
          case 'TOKEN_REFRESHED':
            console.log('Token refrescado');
            break;
          default:
            break;
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!loading && user) {
      loadAllData();
    }
  }, [user, loading]);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      });
      
      if (error) {
        console.error('Error in login:', error);
        setAuthError(error.message);
        
        if (error.message.includes('provider is not enabled')) {
          alert('El proveedor GitHub no está habilitado. Verifica la configuración en Supabase.');
        } else if (error.message.includes('Invalid login credentials')) {
          alert('Credenciales inválidas. Intenta de nuevo.');
        } else {
          alert(`Error al iniciar sesión: ${error.message}`);
        }
      } else {
        console.log('Login iniciado correctamente, redirigiendo...');
      }
    } catch (error) {
      console.error('Unexpected login error:', error);
      setAuthError('Error inesperado al iniciar sesión');
      alert('Error inesperado. Por favor, recarga la página e intenta de nuevo.');
    }
  };

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Error logging out:', error);
        alert('Error al cerrar sesión');
      } else {
        console.log('Logout exitoso');
      }
    } catch (error) {
      console.error('Unexpected logout error:', error);
    }
  };

  const createSampleBot = async () => {
    if (!user) {
      alert('Debes iniciar sesión primero');
      return;
    }

    setCreating(true);
    try {
      const sampleBot = {
        user_id: user.id,
        nombre_base: `Bot_Ejemplo_${Date.now()}`,
        nombre_completo: `Bot_Ejemplo_EURUSD_M15_Long_Limit_SPP_${Date.now()}`,
        magic_number: Math.floor(Math.random() * 10000) + 1000,
        activo: 'EURUSD',
        temporalidad: 'M15',
        direccion: 'Long',
        tipo_entrada: 'Limit',
        oss_config: 'OSS Final',
        tecnicas_simulaciones: { 'SPP': 500, 'WFM': 300 },
        estado: 'Generado'
      };

      const { data, error } = await supabase
        .from('bot_configurations')
        .insert([sampleBot])
        .select();

      if (error) {
        console.error('Error creando bot:', error);
        alert('Error creando bot de ejemplo: ' + error.message);
      } else {
        alert('¡Bot de ejemplo creado exitosamente!');
        await loadAllData();
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Error inesperado: ' + error.message);
    } finally {
      setCreating(false);
    }
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '18px',
        flexDirection: 'column',
        gap: '20px'
      }}>
        <div>🤖 Cargando Mining Intelligence Platform...</div>
        {authError && (
          <div style={{ 
            color: '#dc3545', 
            fontSize: '14px', 
            textAlign: 'center',
            background: '#f8d7da',
            padding: '10px',
            borderRadius: '5px',
            maxWidth: '400px'
          }}>
            Error: {authError}
          </div>
        )}
      </div>
    );
  }

  // RENDERIZAR DASHBOARD SI ESTÁ ACTIVO
  if (showDashboard) {
    return (
      <div>
        <div style={{ 
          position: 'fixed', 
          top: '20px', 
          right: '20px', 
          zIndex: 1000,
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => setShowDashboard(false)}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            📊 Volver al Dashboard Principal
          </button>
          {user && (
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cerrar Sesión
            </button>
          )}
        </div>
        {user ? (
          <Dashboard user={user} supabase={supabase} loadAllData={loadAllData} />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '18px',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div>🔐 Debes iniciar sesión para acceder al Dashboard Analytics</div>
            <button
              onClick={handleLogin}
              style={{
                padding: '12px 24px',
                background: '#24292e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              📱 Iniciar Sesión con GitHub
            </button>
          </div>
        )}
      </div>
    );
  }

  // RENDERIZAR GENERADOR MASIVO SI ESTÁ ACTIVO
  if (showGenerator) {
    return (
      <div>
        <div style={{ 
          position: 'fixed', 
          top: '20px', 
          right: '20px', 
          zIndex: 1000,
          display: 'flex',
          gap: '10px'
        }}>
          <button
            onClick={() => setShowGenerator(false)}
            style={{
              padding: '10px 20px',
              background: '#6c757d',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            📊 Volver al Dashboard
          </button>
          {user && (
            <button
              onClick={handleLogout}
              style={{
                padding: '10px 20px',
                background: '#dc3545',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '14px'
              }}
            >
              Cerrar Sesión
            </button>
          )}
        </div>
        
        {user ? (
          <MassiveGenerator user={user} onDataChange={loadAllData} />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100vh',
            fontSize: '18px',
            flexDirection: 'column',
            gap: '20px'
          }}>
            <div>🔐 Debes iniciar sesión para acceder al Generador Masivo</div>
            <button
              onClick={handleLogin}
              style={{
                padding: '12px 24px',
                background: '#24292e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold'
              }}
            >
              📱 Iniciar Sesión con GitHub
            </button>
          </div>
        )}
      </div>
    );
  }

  // DASHBOARD PRINCIPAL
  return (
    <div style={{
      padding: '20px',
      maxWidth: '1200px',
      margin: '0 auto',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '30px',
        borderRadius: '15px',
        marginBottom: '30px',
        textAlign: 'center'
      }}>
        <h1 style={{ margin: 0, fontSize: '2.5em' }}>
          🤖 Mining Intelligence Platform
        </h1>
        <p style={{ margin: '10px 0 0 0', fontSize: '1.2em', opacity: 0.9 }}>
          Sistema de Inteligencia Colectiva para Trading Algorítmico
        </p>
      </header>

      {/* Authentication Status */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: user ? '#d4edda' : '#f8f9fa',
        borderRadius: '10px',
        border: user ? '2px solid #28a745' : '1px solid #dee2e6'
      }}>
        {user ? (
          <>
            <div>
              <span style={{ fontSize: '16px', color: '#155724', fontWeight: 'bold' }}>
                ✅ ¡Sistema Funcionando Perfectamente!
              </span>
              <div style={{ fontSize: '14px', color: '#155724', marginTop: '5px' }}>
                Conectado como: <strong>{user.email}</strong>
              </div>
              {user.user_metadata?.avatar_url && (
                <img 
                  src={user.user_metadata.avatar_url} 
                  alt="Avatar"
                  style={{ 
                    width: '32px', 
                    height: '32px', 
                    borderRadius: '50%', 
                    marginLeft: '10px',
                    verticalAlign: 'middle'
                  }}
                />
              )}
            </div>
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {/* BOTÓN DASHBOARD ANALYTICS - NUEVO */}
              <button
                onClick={() => setShowDashboard(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                📊 Dashboard Analytics
              </button>
              
              <button
                onClick={() => setShowGenerator(true)}
                style={{
                  padding: '12px 24px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '16px',
                  fontWeight: 'bold',
                  boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
                }}
              >
                🎛️ Generador Masivo
              </button>
              <button
                onClick={createSampleBot}
                disabled={creating}
                style={{
                  padding: '10px 20px',
                  background: creating ? '#6c757d' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: creating ? 'not-allowed' : 'pointer',
                  fontSize: '14px'
                }}
              >
                {creating ? '⏳ Creando...' : '🤖 Crear Bot Ejemplo'}
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                Cerrar Sesión
              </button>
            </div>
          </>
        ) : (
          <>
            <div>
              <span style={{ fontSize: '16px', color: '#6c757d' }}>
                🔐 Inicia sesión para acceder a todas las funcionalidades
              </span>
              <div style={{ fontSize: '12px', color: '#6c757d', marginTop: '5px' }}>
                Usa tu cuenta GitHub para autenticarte de forma segura
              </div>
              {authError && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#dc3545', 
                  marginTop: '5px',
                  background: '#f8d7da',
                  padding: '5px',
                  borderRadius: '3px'
                }}>
                  Error: {authError}
                </div>
              )}
            </div>
            <button
              onClick={handleLogin}
              style={{
                padding: '12px 24px',
                background: '#24292e',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                cursor: 'pointer',
                fontSize: '16px',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🚀</span>
              Iniciar Sesión con GitHub
            </button>
          </>
        )}
      </div>

      {/* Dashboard Personal CON FUNCIONALIDAD DE ELIMINACIÓN */}
      {user && (
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
            <h2 style={{ margin: 0, color: '#333' }}>
              👤 Tu Dashboard Personal
            </h2>
            {userBots.length > 0 && (
              <button
                onClick={eliminarTodosLosBots}
                disabled={deleting === 'all'}
                style={{
                  padding: '8px 16px',
                  background: deleting === 'all' ? '#6c757d' : '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: deleting === 'all' ? 'not-allowed' : 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {deleting === 'all' ? '⏳ Eliminando...' : '🗑️ Eliminar Todos los Bots'}
              </button>
            )}
          </div>
          
          {/* Estadísticas Personales */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
            <div style={{ textAlign: 'center', padding: '15px', background: '#e8f4fd', borderRadius: '10px' }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#007bff' }}>
                {globalStats?.total_bots || 0}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Total Bots</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#d4edda', borderRadius: '10px' }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#28a745' }}>
                {globalStats?.generated_bots || 0}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Bots Generados</div>
            </div>
            <div style={{ textAlign: 'center', padding: '15px', background: '#fff3cd', borderRadius: '10px' }}>
              <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#856404' }}>
                {globalStats?.active_bots || 0}
              </div>
              <div style={{ color: '#666', fontSize: '14px' }}>Bots Activos</div>
            </div>
          </div>

          {/* Lista de Bots CON BOTONES DE ELIMINAR */}
          {userBots.length > 0 ? (
            <div>
              <h3 style={{ margin: '20px 0 15px 0', color: '#333' }}>🤖 Tus Bots Creados</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {userBots.slice(0, 10).map((bot) => (
                  <div key={bot.id} style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: '4px solid #007bff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                        {bot.nombre_base}
                      </h4>
                      <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                        {bot.activo} - {bot.temporalidad} - {bot.direccion} - {bot.tipo_entrada}
                        {bot.oss_config !== 'Sin OSS' && ` - ${bot.oss_config}`}
                      </p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                        Magic Number: {bot.magic_number} | Estado: {bot.estado}
                        {bot.total_simulaciones && ` | Total Simulaciones: ${bot.total_simulaciones}`}
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{
                        padding: '5px 10px',
                        background: bot.estado === 'Activo' ? '#d4edda' : '#fff3cd',
                        color: bot.estado === 'Activo' ? '#155724' : '#856404',
                        borderRadius: '15px',
                        fontSize: '12px',
                        fontWeight: 'bold'
                      }}>
                        {bot.estado}
                      </div>
                      <button
                        onClick={() => eliminarBot(bot.id, bot.nombre_base)}
                        disabled={deleting === bot.id}
                        style={{
                          padding: '5px 10px',
                          background: deleting === bot.id ? '#6c757d' : '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '5px',
                          cursor: deleting === bot.id ? 'not-allowed' : 'pointer',
                          fontSize: '12px',
                          fontWeight: 'bold'
                        }}
                        title={`Eliminar bot ${bot.nombre_base}`}
                      >
                        {deleting === bot.id ? '⏳' : '🗑️'}
                      </button>
                    </div>
                  </div>
                ))}
                {userBots.length > 10 && (
                  <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
                    ... y {userBots.length - 10} bots más
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div style={{
              textAlign: 'center',
              padding: '40px',
              background: 'linear-gradient(135deg, #e3f2fd 0%, #f3e5f5 100%)',
              borderRadius: '15px'
            }}>
              <h3 style={{ color: '#333', marginBottom: '15px' }}>
                🚀 ¡Comienza Creando tu Primer Bot!
              </h3>
              <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
                Usa el botón <strong>"Crear Bot Ejemplo"</strong> para probar el sistema, o 
                el <strong>"Generador Masivo"</strong> para crear múltiples configuraciones avanzadas. 
              </p>
              <div style={{
                background: 'rgba(255,255,255,0.8)',
                padding: '15px',
                borderRadius: '10px',
                marginTop: '15px'
              }}>
                <p style={{ margin: '0 0 10px 0', color: '#1976d2', fontWeight: 'bold' }}>
                  🎛️ Generador Masivo Disponible
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  Checkboxes exclusivos, técnicas SPP/WFM/MC Trade/Secuencial/High Back Test Precision, 
                  configuración OSS, generación de configuraciones únicas con técnicas combinadas.
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Dashboard Global */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        marginBottom: '30px'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          📊 Estadísticas Globales de la Comunidad
        </h2>
        
        {globalPatterns && globalPatterns.length > 0 ? (
          <div>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>🔍 Patrones Exitosos Identificados</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {globalPatterns.map((pattern, index) => (
                <div key={index} style={{
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  borderLeft: '4px solid #28a745'
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>
                    {pattern.activo} - {pattern.temporalidad} - {pattern.direccion}
                  </h4>
                  <p style={{ margin: '5px 0', fontSize: '14px' }}>
                    <strong>Tipo Entrada:</strong> {pattern.tipo_entrada} | 
                    <strong> OSS:</strong> {pattern.oss_config}
                  </p>
                  <p style={{ margin: '5px 0', fontSize: '14px', color: '#28a745' }}>
                    <strong>Índice de Éxito:</strong> {pattern.indice_exito}% 
                    <span style={{ color: '#666' }}>
                      ({pattern.total_bots_evaluados} evaluaciones)
                    </span>
                  </p>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div style={{
            textAlign: 'center',
            padding: '40px',
            background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
            borderRadius: '15px'
          }}>
            <h3 style={{ color: '#333', marginBottom: '15px' }}>
              🎯 Tu "Wikipedia del Trading Algorítmico" Está Lista
            </h3>
            <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
              Los patrones exitosos de la comunidad aparecerán aquí cuando los usuarios evalúen sus estrategias.
              ¡Sé el primero en contribuir!
            </p>
            {user && (
              <div style={{
                background: 'rgba(102, 126, 234, 0.1)',
                padding: '20px',
                borderRadius: '10px',
                marginTop: '20px'
              }}>
                <p style={{ margin: '0 0 10px 0', color: '#667eea', fontWeight: 'bold' }}>
                  🎛️ Genera Múltiples Configuraciones
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  Usa el Generador Masivo para crear configuraciones con checkboxes exclusivos, 
                  técnicas avanzadas combinadas y parámetros OSS. Contribuye a la inteligencia colectiva.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Funcionalidades del Sistema */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          🚀 Tu Plataforma de Inteligencia Colectiva
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          {/* DASHBOARD ANALYTICS - NUEVO CARD */}
          <div style={{ 
            padding: '15px', 
            background: user ? '#e8f5e8' : '#f8f9fa', 
            borderRadius: '8px',
            border: user ? '2px solid #28a745' : '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: user ? '#28a745' : '#6c757d' }}>
              📊 Dashboard Analytics {user ? '✅' : '🔒'}
            </h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Métricas de performance, gráficos interactivos, análisis por técnicas y activos
            </p>
            {user && (
              <button
                onClick={() => setShowDashboard(true)}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                Ver Analytics
              </button>
            )}
          </div>

          <div style={{ 
            padding: '15px', 
            background: user ? '#e3f2fd' : '#f8f9fa', 
            borderRadius: '8px',
            border: user ? '2px solid #1976d2' : '1px solid #dee2e6'
          }}>
            <h4 style={{ margin: '0 0 10px 0', color: user ? '#1976d2' : '#6c757d' }}>
              🎛️ Generador Masivo {user ? '✅' : '🔒'}
            </h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Checkboxes exclusivos, técnicas SPP/WFM/MC Trade/Secuencial/High Back Test Precision, configuración OSS
            </p>
            {user && (
              <button
                onClick={() => setShowGenerator(true)}
                style={{
                  marginTop: '10px',
                  padding: '8px 16px',
                  background: '#1976d2',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                Abrir Generador
              </button>
            )}
          </div>
          
          <div style={{ padding: '15px', background: '#f3e5f5', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>📊 Dashboard Global</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Comparación personal vs global, benchmarking automático
            </p>
          </div>
          
          <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>⚡ Sistema Real-time</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Updates automáticos de estadísticas y nuevos insights
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer style={{
        textAlign: 'center',
        padding: '30px 20px',
        color: '#666',
        borderTop: '1px solid #eee',
        marginTop: '40px'
      }}>
        <p style={{ margin: 0 }}>
          🤖 <strong>Mining Intelligence Platform</strong> - 
          La primera plataforma colaborativa para encontrar las mejores estrategias de trading algorítmico
        </p>
        <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
          ✅ Sistema funcionando: Supabase + React + GitHub OAuth + Netlify - {user ? 'Autenticado' : 'Listo para autenticar'}
        </p>
        {user && (
          <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#28a745', fontWeight: 'bold' }}>
            🎛️ Generador Masivo + 📊 Dashboard Analytics - Un solo bot con múltiples técnicas combinadas
          </p>
        )}
      </footer>
    </div>
  );
}

export default App;
