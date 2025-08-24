import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

function App() {
  const [user, setUser] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Verificar usuario actual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
    };

    // Obtener estadísticas globales
    const fetchGlobalStats = async () => {
      try {
        const { data } = await supabase
          .from('global_mining_patterns')
          .select('*')
          .order('indice_exito', { ascending: false })
          .limit(10);
        setGlobalStats(data || []);
      } catch (error) {
        console.log('Info: Creando datos iniciales...', error);
        setGlobalStats([]);
      }
      setLoading(false);
    };

    getUser();
    fetchGlobalStats();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const handleLogin = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin
      }
    });
    if (error) console.error('Error logging in:', error);
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

    try {
      const sampleBot = {
        user_id: user.id,
        nombre_base: 'Bot_Ejemplo',
        nombre_completo: 'Bot_Ejemplo_EURUSD_M15_Long_Limit_SPP',
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
        .insert([sampleBot]);

      if (error) {
        console.error('Error creando bot:', error);
        alert('Error creando bot de ejemplo');
      } else {
        alert('¡Bot de ejemplo creado exitosamente!');
      }
    } catch (error) {
      console.error('Error:', error);
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

      {/* Authentication */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '30px',
        padding: '20px',
        background: '#f8f9fa',
        borderRadius: '10px'
      }}>
        {user ? (
          <>
            <div>
              <span style={{ fontSize: '16px', color: '#28a745' }}>
                ✅ Conectado como: <strong>{user.email}</strong>
              </span>
            </div>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={createSampleBot}
                style={{
                  padding: '10px 20px',
                  background: '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
                }}
              >
                Crear Bot Ejemplo
              </button>
              <button
                onClick={handleLogout}
                style={{
                  padding: '10px 20px',
                  background: '#dc3545',
                  color: 'white',
                  border: 'none',
                  borderRadius: '5px',
                  cursor: 'pointer'
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
                padding: '10px 20px',
                background: '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: 'pointer'
              }}
            >
              Iniciar Sesión con GitHub
            </button>
          </>
        )}
      </div>

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
        
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 1fr', gap: '15px', marginBottom: '20px' }}>
          <div style={{ textAlign: 'center', padding: '15px', background: '#e8f4fd', borderRadius: '10px' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#007bff' }}>
              {user ? '1+' : '0'}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Usuarios Activos</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: '#fff3cd', borderRadius: '10px' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#856404' }}>
              {globalStats ? globalStats.length : '0'}
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Patrones Identificados</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: '#d1ecf1', borderRadius: '10px' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#0c5460' }}>
              🚀
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Sistema Operacional</div>
          </div>
          <div style={{ textAlign: 'center', padding: '15px', background: '#d4edda', borderRadius: '10px' }}>
            <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#155724' }}>
              ✅
            </div>
            <div style={{ color: '#666', fontSize: '14px' }}>Base de Datos Lista</div>
          </div>
        </div>

        {/* Patrones Exitosos o Mensaje de Bienvenida */}
        {globalStats && globalStats.length > 0 ? (
          <div>
            <h3 style={{ margin: '20px 0 15px 0', color: '#333' }}>🔍 Patrones Exitosos</h3>
            <div style={{ display: 'grid', gap: '15px' }}>
              {globalStats.map((pattern, index) => (
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
              🎉 ¡Bienvenido a tu Sistema de Inteligencia Colectiva!
            </h3>
            <p style={{ color: '#666', marginBottom: '20px', lineHeight: '1.6' }}>
              Tu plataforma de <strong>"Wikipedia del Trading Algorítmico"</strong> está lista y funcionando. 
              Los patrones exitosos de la comunidad aparecerán aquí cuando los usuarios evalúen sus estrategias.
            </p>
            {user && (
              <div style={{
                background: '#e3f2fd',
                padding: '20px',
                borderRadius: '10px',
                marginTop: '20px'
              }}>
                <p style={{ margin: '0 0 10px 0', color: '#1976d2', fontWeight: 'bold' }}>
                  🚀 Prueba crear tu primer bot de ejemplo
                </p>
                <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
                  Usa el botón "Crear Bot Ejemplo" para probar el sistema y ver cómo funciona la inteligencia colectiva.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Funcionalidades Próximas */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          🚀 Funcionalidades del Sistema
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', background: '#e3f2fd', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>🎛️ Generador Masivo</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Checkboxes exclusivos, técnicas SPP/WFM/MC Trade, configuración OSS, gestión de órdenes
            </p>
          </div>
          
          <div style={{ padding: '15px', background: '#f3e5f5', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#7b1fa2' }}>📊 Dashboard Global</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Comparación personal vs global, benchmarking, patrones de éxito
            </p>
          </div>
          
          <div style={{ padding: '15px', background: '#e8f5e8', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#388e3c' }}>🧠 IA Recomendaciones</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Sugerencias basadas en patrones exitosos de la comunidad
            </p>
          </div>
          
          <div style={{ padding: '15px', background: '#fff3e0', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#f57c00' }}>⚡ Evaluaciones</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Sistema de calificaciones mensuales y análisis de rendimiento
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
          ✅ Sistema funcionando con Supabase + React + Netlify - Completamente gratis
        </p>
      </footer>
    </div>
  );
}

export default App;
