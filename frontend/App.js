import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

// Configuración Supabase
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'https://tu-proyecto.supabase.co';
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'tu-anon-key';

const supabase = createClient(supabaseUrl, supabaseAnonKey);

function App() {
  const [user, setUser] = useState(null);
  const [globalStats, setGlobalStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Obtener usuario actual
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    };

    // Obtener estadísticas globales
    const getGlobalStats = async () => {
      try {
        const response = await fetch('/api/global-stats');
        const stats = await response.json();
        setGlobalStats(stats);
      } catch (error) {
        console.error('Error fetching global stats:', error);
      }
    };

    getUser();
    getGlobalStats();

    // Escuchar cambios de autenticación
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
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
        display: 'grid',
        gridTemplateColumns: user ? '1fr 1fr' : '1fr',
        gap: '30px',
        marginBottom: '30px'
      }}>
        {/* Estadísticas Globales */}
        <div style={{
          background: 'white',
          padding: '25px',
          borderRadius: '15px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
            📊 Estadísticas Globales de la Comunidad
          </h2>
          
          {globalStats ? (
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '20px' }}>
              <div style={{ textAlign: 'center', padding: '15px', background: '#e8f4fd', borderRadius: '10px' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#007bff' }}>
                  {globalStats.total_usuarios || 0}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>Usuarios Activos</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', background: '#fff3cd', borderRadius: '10px' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#856404' }}>
                  {globalStats.total_bots || 0}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>Bots Creados</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', background: '#d1ecf1', borderRadius: '10px' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#0c5460' }}>
                  {globalStats.total_evaluaciones || 0}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>Evaluaciones</div>
              </div>
              <div style={{ textAlign: 'center', padding: '15px', background: '#d4edda', borderRadius: '10px' }}>
                <div style={{ fontSize: '2em', fontWeight: 'bold', color: '#155724' }}>
                  {globalStats.mejores_patrones?.length || 0}
                </div>
                <div style={{ color: '#666', fontSize: '14px' }}>Patrones Exitosos</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '20px', color: '#666' }}>
              Cargando estadísticas globales...
            </div>
          )}

          {/* Insights Destacados */}
          {globalStats?.insights_destacados?.length > 0 && (
            <>
              <h3 style={{ margin: '20px 0 15px 0', color: '#333' }}>🔍 Insights de la Comunidad</h3>
              {globalStats.insights_destacados.slice(0, 3).map((insight, index) => (
                <div key={index} style={{
                  padding: '15px',
                  background: '#f8f9fa',
                  borderRadius: '8px',
                  marginBottom: '10px',
                  borderLeft: '4px solid #28a745'
                }}>
                  <strong style={{ color: '#333' }}>{insight.titulo}</strong>
                  <p style={{ margin: '5px 0 0 0', color: '#666', fontSize: '14px' }}>
                    {insight.descripcion}
                  </p>
                  <div style={{ fontSize: '12px', color: '#999', marginTop: '5px' }}>
                    Confianza: {insight.confianza}%
                  </div>
                </div>
              ))}
            </>
          )}
        </div>

        {/* Panel Personal (solo si está logueado) */}
        {user && (
          <div style={{
            background: 'white',
            padding: '25px',
            borderRadius: '15px',
            boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
              👤 Tu Dashboard Personal
            </h2>
            
            <div style={{ marginBottom: '20px' }}>
              <p style={{ color: '#666', marginBottom: '15px' }}>
                Bienvenido a tu panel personal. Desde aquí podrás:
              </p>
              
              <ul style={{ color: '#666', lineHeight: '1.8' }}>
                <li>🤖 <strong>Generar configuraciones masivas</strong> de bots</li>
                <li>📊 <strong>Evaluar el rendimiento</strong> de tus estrategias</li>
                <li>📈 <strong>Comparar tus resultados</strong> con la comunidad</li>
                <li>🧠 <strong>Recibir recomendaciones</strong> basadas en patrones exitosos</li>
              </ul>
            </div>

            <div style={{
              padding: '20px',
              background: '#e3f2fd',
              borderRadius: '10px',
              textAlign: 'center'
            }}>
              <h3 style={{ margin: '0 0 10px 0', color: '#1976d2' }}>
                🔄 Migración desde Streamlit
              </h3>
              <p style={{ margin: '0', color: '#666' }}>
                Todas las funcionalidades de tu sistema Streamlit estarán disponibles aquí:
                generador masivo, checkboxes exclusivos, técnicas SPP/WFM/OSS, evaluaciones mensuales.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Próximas Funcionalidades */}
      <div style={{
        background: 'white',
        padding: '25px',
        borderRadius: '15px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
      }}>
        <h2 style={{ margin: '0 0 20px 0', color: '#333' }}>
          🚀 Funcionalidades en Desarrollo
        </h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '15px' }}>
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🎛️ Generador Masivo</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Checkboxes exclusivos, técnicas SPP/WFM/MC Trade, configuración OSS, gestión de órdenes
            </p>
          </div>
          
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>📊 Dashboard Avanzado</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Comparación personal vs global, benchmarking, patrones de éxito
            </p>
          </div>
          
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>🧠 IA Recomendaciones</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Sugerencias basadas en patrones exitosos de la comunidad
            </p>
          </div>
          
          <div style={{ padding: '15px', background: '#f8f9fa', borderRadius: '8px' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#495057' }}>⚡ Tiempo Real</h4>
            <p style={{ margin: 0, color: '#666', fontSize: '14px' }}>
              Updates live de estadísticas globales y nuevos insights
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
          Desarrollado con ❤️ usando Supabase + Vercel + React
        </p>
      </footer>
    </div>
  );
}

export default App;
