import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

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

  // Función para cargar todos los datos
  const loadAllData = async () => {
    try {
      // Obtener estadísticas globales
      const { data: patterns } = await supabase
        .from('global_mining_patterns')
        .select('*')
        .order('indice_exito', { ascending: false })
        .limit(10);

      setGlobalPatterns(patterns || []);

      // Si hay usuario, obtener sus bots
      if (user) {
        const { data: bots } = await supabase
          .from('bot_configurations')
          .select('*')
          .eq('user_id', user.id)
          .order('fecha_creacion', { ascending: false });

        setUserBots(bots || []);

        // Calcular estadísticas del usuario
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

  useEffect(() => {
    // Función para obtener la sesión actual
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    getSession();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth event:', event, session?.user?.email);
        setUser(session?.user ?? null);
        setLoading(false);
        
        // Si hay login exitoso, limpiar URL y cargar datos
        if (event === 'SIGNED_IN' && window.location.hash) {
          window.history.replaceState(null, '', window.location.pathname);
        }
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  // Cargar datos cuando cambie el usuario
  useEffect(() => {
    if (!loading) {
      loadAllData();
    }
  }, [user, loading]);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) {
      console.error('Error logging in:', error);
      alert('Error al iniciar sesión. Revisa la configuración de GitHub OAuth.');
    }
  };

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Error logging out:', error);
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
        // IMPORTANTE: Refrescar datos automáticamente
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
        fontSize: '18px'
      }}>
        🤖 Cargando Mining Intelligence Platform...
      </div>
    );
  }

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
            <div style={{ display: 'flex', gap: '10px' }}>
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
                fontWeight: 'bold'
              }}
            >
              📱 Iniciar Sesión con GitHub
            </button>
          </>
        )}
      </div>

      {/* Dashboard Personal (si hay usuario) */}
      {user && (
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '30px'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
            👤 Tu Dashboard Personal
          </h2>
          
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

          {/* Lista de Bots */}
          {userBots.length > 0 ? (
            <div>
              <h3 style={{ margin: '20px 0 15px 0', color: '#333' }}>🤖 Tus Bots Creados</h3>
              <div style={{ display: 'grid', gap: '10px' }}>
                {userBots.slice(0, 5).map((bot) => (
                  <div key={bot.id} style={{
                    padding: '15px',
                    background: '#f8f9fa',
                    borderRadius: '8px',
                    borderLeft: '4px solid #007bff',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center'
                  }}>
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: '#333' }}>
                        {bot.nombre_base}
                      </h4>
                      <p style={{ margin: '0', fontSize: '14px', color: '#666' }}>
                        {bot.activo} - {bot.temporalidad} - {bot.direccion} - {bot.tipo_entrada}
                        {bot.oss_config !== 'Sin OSS' && ` - ${bot.oss_config}`}
                      </p>
                      <p style={{ margin: '5px 0 0 0', fontSize: '12px', color: '#999' }}>
                        Magic Number: {bot.magic_number} | Estado: {bot.estado}
                      </p>
                    </div>
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
                  </div>
                ))}
                {userBots.length > 5 && (
                  <div style={{ textAlign: 'center', padding: '10px', color: '#666' }}>
                    ... y {userBots.length - 5} bots más
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
                Usa el botón <strong>"Crear Bot Ejemplo"</strong> para probar el sistema. 
                Una vez creado, aparecerá aquí y comenzará a contribuir a las estadísticas globales.
              </p>
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
              Los patrones exitosos de la comunidad aparecerán aquí cuando los usuarios evalúen sus estrat
