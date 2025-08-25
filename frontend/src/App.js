import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import MassiveGenerator from './components/MassiveGenerator';
import Dashboard from './components/Dashboard';
import { ThemeProvider } from './components/ThemeProvider';
import ThemeToggle from './components/ThemeToggle';
import './styles/responsive.css';

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
  const [showDashboard, setShowDashboard] = useState(false);
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
            setShowDashboard(false);
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

  // PANTALLA DE CARGA CON TEMA
  if (loading) {
    return (
      <ThemeProvider>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '100vh',
          fontSize: '18px',
          flexDirection: 'column',
          gap: '20px',
          background: 'var(--bg-primary)',
          color: 'var(--text-primary)'
        }}>
          <div style={{ 
            fontSize: '48px', 
            animation: 'spin 2s linear infinite',
            background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            backgroundClip: 'text'
          }}>
            🤖
          </div>
          <div>Cargando Mining Intelligence Platform...</div>
          {authError && (
            <div style={{ 
              color: 'var(--danger-color)', 
              fontSize: '14px', 
              textAlign: 'center',
              background: 'var(--bg-secondary)',
              padding: '10px',
              borderRadius: '5px',
              maxWidth: '400px',
              border: '1px solid var(--border-color)'
            }}>
              Error: {authError}
            </div>
          )}
        </div>
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <div style={{
        background: 'var(--bg-primary)',
        color: 'var(--text-primary)',
        minHeight: '100vh',
        transition: 'var(--transition)'
      }}>

        {/* RENDERIZAR DASHBOARD ANALYTICS SI ESTÁ ACTIVO */}
        {showDashboard && (
          <div>
            <div style={{ 
              position: 'fixed', 
              top: '20px', 
              right: '20px', 
              zIndex: 1000,
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <ThemeToggle />
              <button
                onClick={() => setShowDashboard(false)}
                className="touch-target"
                style={{
                  padding: '10px 20px',
                  background: 'var(--info-color)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: 'bold',
                  transition: 'var(--transition)'
                }}
              >
                📊 Volver al Dashboard Principal
              </button>
              {user && (
                <button
                  onClick={handleLogout}
                  className="touch-target"
                  style={{
                    padding: '10px 20px',
                    background: 'var(--danger-color)',
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
                gap: '20px',
                background: 'var(--bg-primary)',
                color: 'var(--text-primary)'
              }}>
                <div>🔐 Debes iniciar sesión para acceder al Dashboard Analytics</div>
                <button
                  onClick={handleLogin}
                  className="touch-target"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
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
        )}

        {/* RENDERIZAR GENERADOR MASIVO SI ESTÁ ACTIVO */}
        {showGenerator && (
          <div>
            <div style={{ 
              position: 'fixed', 
              top: '20px', 
              right: '20px', 
              zIndex: 1000,
              display: 'flex',
              gap: '10px',
              flexWrap: 'wrap'
            }}>
              <ThemeToggle />
              <button
                onClick={() => setShowGenerator(false)}
                className="touch-target"
                style={{
                  padding: '10px 20px',
                  background: 'var(--info-color)',
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
                  className="touch-target"
                  style={{
                    padding: '10px 20px',
                    background: 'var(--danger-color)',
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
                  className="touch-target"
                  style={{
                    padding: '12px 24px',
                    background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
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
        )}

        {/* DASHBOARD PRINCIPAL - Solo se muestra si no está en otras vistas */}
        {!showDashboard && !showGenerator && (
          <div className="dashboard-container" style={{
            padding: '20px',
            maxWidth: '1200px',
            margin: '0 auto',
            fontFamily: 'Arial, sans-serif'
          }}>
            
            {/* Header con ThemeToggle */}
            <header style={{
              background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
              color: 'white',
              padding: '30px',
              borderRadius: '15px',
              marginBottom: '30px',
              textAlign: 'center',
              position: 'relative'
            }}>
              <div style={{
                position: 'absolute',
                top: '15px',
                right: '15px'
              }}>
                <ThemeToggle />
              </div>
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
              background: user ? 'var(--success-color)' : 'var(--bg-secondary)',
              borderRadius: '10px',
              border: user ? '2px solid var(--success-color)' : '1px solid var(--border-color)',
              opacity: user ? 0.9 : 1,
              flexWrap: 'wrap',
              gap: '15px'
            }}>
              {user ? (
                <>
                  <div>
                    <span style={{ fontSize: '16px', color: 'white', fontWeight: 'bold' }}>
                      ✅ ¡Sistema Funcionando Perfectamente!
                    </span>
                    <div style={{ fontSize: '14px', color: 'white', marginTop: '5px', opacity: 0.9 }}>
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
                          verticalAlign: 'middle',
                          border: '2px solid white'
                        }}
                      />
                    )}
                  </div>
                  <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                    <button
                      onClick={() => setShowDashboard(true)}
                      className="touch-target"
                      style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'var(--transition)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      📊 Dashboard Analytics
                    </button>
                    
                    <button
                      onClick={() => setShowGenerator(true)}
                      className="touch-target"
                      style={{
                        padding: '12px 24px',
                        background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '16px',
                        fontWeight: 'bold',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        transition: 'var(--transition)'
                      }}
                      onMouseOver={(e) => {
                        e.target.style.transform = 'translateY(-2px)';
                      }}
                      onMouseOut={(e) => {
                        e.target.style.transform = 'translateY(0)';
                      }}
                    >
                      🎛️ Generador Masivo
                    </button>
                    <button
                      onClick={createSampleBot}
                      disabled={creating}
                      className="touch-target"
                      style={{
                        padding: '10px 20px',
                        background: creating ? 'var(--text-secondary)' : 'var(--success-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: creating ? 'not-allowed' : 'pointer',
                        fontSize: '14px',
                        transition: 'var(--transition)'
                      }}
                    >
                      {creating ? '⏳ Creando...' : '🤖 Crear Bot Ejemplo'}
                    </button>
                    <button
                      onClick={handleLogout}
                      className="touch-target"
                      style={{
                        padding: '10px 20px',
                        background: 'var(--danger-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '14px',
                        transition: 'var(--transition)'
                      }}
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <span style={{ fontSize: '16px', color: 'var(--text-primary)' }}>
                      🔐 Inicia sesión para acceder a todas las funcionalidades
                    </span>
                    <div style={{ fontSize: '12px', color: 'var(--text-secondary)', marginTop: '5px' }}>
                      Usa tu cuenta GitHub para autenticarte de forma segura
                    </div>
                    {authError && (
                      <div style={{ 
                        fontSize: '12px', 
                        color: 'var(--danger-color)', 
                        marginTop: '5px',
                        background: 'var(--bg-primary)',
                        padding: '5px',
                        borderRadius: '3px'
                      }}>
                        Error: {authError}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={handleLogin}
                    className="touch-target"
                    style={{
                      padding: '12px 24px',
                      background: 'linear-gradient(135deg, var(--primary-color) 0%, var(--secondary-color) 100%)',
                      color: 'white',
                      border: 'none',
                      borderRadius: '8px',
                      cursor: 'pointer',
                      fontSize: '16px',
                      fontWeight: 'bold',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '8px',
                      transition: 'var(--transition)'
                    }}
                    onMouseOver={(e) => {
                      e.target.style.transform = 'translateY(-2px)';
                      e.target.style.boxShadow = '0 6px 12px rgba(0,0,0,0.15)';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.transform = 'translateY(0)';
                      e.target.style.boxShadow = '0 4px 6px rgba(0,0,0,0.1)';
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
                background: 'var(--bg-secondary)',
                padding: '25px',
                borderRadius: '15px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                marginBottom: '30px',
                border: '1px solid var(--border-color)'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '15px' }}>
                  <h2 style={{ margin: 0, color: 'var(--text-primary)' }}>
                    👤 Tu Dashboard Personal
                  </h2>
                  {userBots.length > 0 && (
                    <button
                      onClick={eliminarTodosLosBots}
                      disabled={deleting === 'all'}
                      className="touch-target"
                      style={{
                        padding: '8px 16px',
                        background: deleting === 'all' ? 'var(--text-secondary)' : 'var(--danger-color)',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: deleting === 'all' ? 'not-allowed' : 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        transition: 'var(--transition)'
                      }}
                    >
                      {deleting === 'all' ? '⏳ Eliminando...' : '🗑️ Eliminar Todos los Bots'}
                    </button>
                  )}
                </div>
                
                {/* Estadísticas Personales */}
                <div className="kpi-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '15px', marginBottom: '20px' }}>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '15px', 
                    background: 'var(--primary-color)', 
                    borderRadius: '10px',
                    color: 'white',
                    opacity: 0.9
                  }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
                      {globalStats?.total_bots || 0}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: '14px' }}>Total Bots</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '15px', 
                    background: 'var(--success-color)', 
                    borderRadius: '10px',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
                      {globalStats?.generated_bots || 0}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: '14px' }}>Bots Generados</div>
                  </div>
                  <div style={{ 
                    textAlign: 'center', 
                    padding: '15px', 
                    background: 'var(--warning-color)', 
                    borderRadius: '10px',
                    color: 'white'
                  }}>
                    <div style={{ fontSize: '2em', fontWeight: 'bold' }}>
                      {globalStats?.active_bots || 0}
                    </div>
                    <div style={{ opacity: 0.9, fontSize: '14px' }}>Bots Activos</div>
                  </div>
                </div>

                {/* Lista de Bots CON BOTONES DE ELIMINAR */}
                {userBots.length > 0 ? (
                  <div>
                    <h3 style={{ margin: '20px 0 15px 0', color: 'var(--text-primary)' }}>🤖 Tus Bots Creados</h3>
                    <div style={{ display: 'grid', gap: '10px' }}>
                      {userBots.slice(0, 10).map((bot) => (
                        <div key={bot.id} style={{
                          padding: '15px',
                          background: 'var(--bg-primary)',
                          borderRadius: '8px',
                          borderLeft: '4px solid var(--primary-color)',
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid var(--border-color)',
                          flexWrap: 'wrap',
                          gap: '10px'
                        }}>
                          <div style={{ flex: 1, minWidth: '250px' }}>
                            <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-primary)' }}>
                              {bot.nombre_base}
                            </h4>
                            <p style={{ margin: '0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                              {bot.activo} - {bot.temporalidad} - {bot.direccion} - {bot.tipo_entrada}
                              {bot.oss_config !== 'Sin OSS' && ` - ${bot.oss_config}`}
                            </p>
                            <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: 'var(--text-secondary)' }}>
                              Magic Number: {bot.magic_number} | Estado: {bot.estado}
                              {bot.total_simulaciones && ` | Total Simulaciones: ${bot.total_simulaciones}`}
                            </p>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{
                              padding: '5px 10px',
                              background: bot.estado === 'Activo' ? 'var(--success-color)' : 'var(--warning-color)',
                              color: 'white',
                              borderRadius: '15px',
                              fontSize: '12px',
                              fontWeight: 'bold'
                            }}>
                              {bot.estado}
                            </div>
                            <button
                              onClick={() => eliminarBot(bot.id, bot.nombre_base)}
                              disabled={deleting === bot.id}
                              className="touch-target"
                              style={{
                                padding: '5px 10px',
                                background: deleting === bot.id ? 'var(--text-secondary)' : 'var(--danger-color)',
                                color: 'white',
                                border: 'none',
                                borderRadius: '5px',
                                cursor: deleting === bot.id ? 'not-allowed' : 'pointer',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                transition: 'var(--transition)'
                              }}
                              title={`Eliminar bot ${bot.nombre_base}`}
                            >
                              {deleting === bot.id ? '⏳' : '🗑️'}
                            </button>
                          </div>
                        </div>
                      ))}
                      {userBots.length > 10 && (
                        <div style={{ textAlign: 'center', padding: '10px', color: 'var(--text-secondary)' }}>
                          ... y {userBots.length - 10} bots más
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px',
                    background: 'linear-gradient(135deg, var(--primary-color) 10%, var(--secondary-color) 90%)',
                    borderRadius: '15px',
                    color: 'white',
                    opacity: 0.9
                  }}>
                    <h3 style={{ color: 'white', marginBottom: '15px' }}>
                      🚀 ¡Comienza Creando tu Primer Bot!
                    </h3>
                    <p style={{ color: 'white', marginBottom: '20px', lineHeight: '1.6', opacity: 0.9 }}>
                      Usa el botón <strong>"Crear Bot Ejemplo"</strong> para probar el sistema, o 
                      el <strong>"Generador Masivo"</strong> para crear múltiples configuraciones avanzadas. 
                    </p>
                    <div style={{
                      background: 'rgba(255,255,255,0.1)',
                      padding: '15px',
                      borderRadius: '10px',
                      marginTop: '15px',
                      border: '1px solid rgba(255,255,255,0.2)'
                    }}>
                      <p style={{ margin: '0 0 10px 0', color: 'white', fontWeight: 'bold' }}>
                        🎛️ Generador Masivo Disponible
                      </p>
                      <p style={{ margin: 0, color: 'white', fontSize: '14px', opacity: 0.9 }}>
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
              background: 'var(--bg-secondary)',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              marginBottom: '30px',
              border: '1px solid var(--border-color)'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>
                📊 Estadísticas Globales de la Comunidad
              </h2>
              
              {globalPatterns && globalPatterns.length > 0 ? (
                <div>
                  <h3 style={{ margin: '0 0 15px 0', color: 'var(--text-primary)' }}>🔍 Patrones Exitosos Identificados</h3>
                  <div style={{ display: 'grid', gap: '15px' }}>
                    {globalPatterns.map((pattern, index) => (
                      <div key={index} style={{
                        padding: '15px',
                        background: 'var(--bg-primary)',
                        borderRadius: '8px',
                        borderLeft: '4px solid var(--success-color)',
                        border: '1px solid var(--border-color)'
                      }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-primary)' }}>
                          {pattern.activo} - {pattern.temporalidad} - {pattern.direccion}
                        </h4>
                        <p style={{ margin: '5px 0', fontSize: '14px', color: 'var(--text-secondary)' }}>
                          <strong>Tipo Entrada:</strong> {pattern.tipo_entrada} | 
                          <strong> OSS:</strong> {pattern.oss_config}
                        </p>
                        <p style={{ margin: '5px 0', fontSize: '14px', color: 'var(--success-color)' }}>
                          <strong>Índice de Éxito:</strong> {pattern.indice_exito}% 
                          <span style={{ color: 'var(--text-secondary)' }}>
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
                  background: 'linear-gradient(135deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)',
                  borderRadius: '15px',
                  border: '1px solid var(--border-color)'
                }}>
                  <h3 style={{ color: 'var(--text-primary)', marginBottom: '15px' }}>
                    🎯 Tu "Wikipedia del Trading Algorítmico" Está Lista
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: '20px', lineHeight: '1.6' }}>
                    Los patrones exitosos de la comunidad aparecerán aquí cuando los usuarios evalúen sus estrategias.
                    ¡Sé el primero en contribuir!
                  </p>
                  {user && (
                    <div style={{
                      background: 'var(--primary-color)',
                      padding: '20px',
                      borderRadius: '10px',
                      marginTop: '20px',
                      color: 'white',
                      opacity: 0.9
                    }}>
                      <p style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                        🎛️ Genera Múltiples Configuraciones
                      </p>
                      <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
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
              background: 'var(--bg-secondary)',
              padding: '25px',
              borderRadius: '15px',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              border: '1px solid var(--border-color)'
            }}>
              <h2 style={{ margin: '0 0 20px 0', color: 'var(--text-primary)' }}>
                🚀 Tu Plataforma de Inteligencia Colectiva
              </h2>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
                {/* DASHBOARD ANALYTICS */}
                <div style={{ 
                  padding: '15px', 
                  background: user ? 'var(--success-color)' : 'var(--bg-primary)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  color: user ? 'white' : 'var(--text-primary)'
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>
                    📊 Dashboard Analytics {user ? '✅' : '🔒'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                    Métricas de performance, gráficos interactivos, análisis por técnicas y activos
                  </p>
                  {user && (
                    <button
                      onClick={() => setShowDashboard(true)}
                      className="touch-target"
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        transition: 'var(--transition)'
                      }}
                    >
                      Ver Analytics
                    </button>
                  )}
                </div>

                <div style={{ 
                  padding: '15px', 
                  background: user ? 'var(--primary-color)' : 'var(--bg-primary)', 
                  borderRadius: '8px',
                  border: '1px solid var(--border-color)',
                  color: user ? 'white' : 'var(--text-primary)'
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>
                    🎛️ Generador Masivo {user ? '✅' : '🔒'}
                  </h4>
                  <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                    Checkboxes exclusivos, técnicas SPP/WFM/MC Trade/Secuencial/High Back Test Precision, configuración OSS
                  </p>
                  {user && (
                    <button
                      onClick={() => setShowGenerator(true)}
                      className="touch-target"
                      style={{
                        marginTop: '10px',
                        padding: '8px 16px',
                        background: 'rgba(255,255,255,0.2)',
                        color: 'white',
                        border: '1px solid rgba(255,255,255,0.3)',
                        borderRadius: '5px',
                        cursor: 'pointer',
                        fontSize: '12px',
                        fontWeight: 'bold',
                        transition: 'var(--transition)'
                      }}
                    >
                      Abrir Generador
                    </button>
                  )}
                </div>
                
                <div style={{ 
                  padding: '15px', 
                  background: 'var(--info-color)', 
                  borderRadius: '8px',
                  color: 'white'
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>📊 Dashboard Global</h4>
                  <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                    Comparación personal vs global, benchmarking automático
                  </p>
                </div>
                
                <div style={{ 
                  padding: '15px', 
                  background: 'var(--warning-color)', 
                  borderRadius: '8px',
                  color: 'white'
                }}>
                  <h4 style={{ margin: '0 0 10px 0' }}>⚡ Sistema Real-time</h4>
                  <p style={{ margin: 0, fontSize: '14px', opacity: 0.9 }}>
                    Updates automáticos de estadísticas y nuevos insights
                  </p>
                </div>
              </div>
            </div>

            {/* Footer */}
            <footer style={{
              textAlign: 'center',
              padding: '30px 20px',
              color: 'var(--text-secondary)',
              borderTop: '1px solid var(--border-color)',
              marginTop: '40px',
              background: 'var(--bg-secondary)',
              borderRadius: '10px'
            }}>
              <p style={{ margin: 0 }}>
                🤖 <strong style={{ color: 'var(--text-primary)' }}>Mining Intelligence Platform</strong> - 
                La primera plataforma colaborativa para encontrar las mejores estrategias de trading algorítmico
              </p>
              <p style={{ margin: '10px 0 0 0', fontSize: '14px' }}>
                ✅ Sistema funcionando: Supabase + React + GitHub OAuth + Netlify + PWA + Dark Mode - {user ? 'Autenticado' : 'Listo para autenticar'}
              </p>
              {user && (
                <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: 'var(--success-color)', fontWeight: 'bold' }}>
                  🎛️ Generador Masivo + 📊 Dashboard Analytics + 🧪 Motor Backtesting + 📁 Import/Export + 🌙 Dark Mode - Plataforma Completa
                </p>
              )}
            </footer>

          </div>
        )}

        {/* Estilos CSS adicionales */}
        <style jsx>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          /* Custom scrollbar */
          ::-webkit-scrollbar {
            width: 8px;
          }
          
          ::-webkit-scrollbar-track {
            background: var(--bg-secondary);
          }
          
          ::-webkit-scrollbar-thumb {
            background: var(--primary-color);
            border-radius: 4px;
          }
          
          ::-webkit-scrollbar-thumb:hover {
            background: var(--secondary-color);
          }
        `}</style>

      </div>
    </ThemeProvider>
  );
}

export default App;
