import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const MassiveGenerator = ({ user }) => {
  const [config, setConfig] = useState({
    nombre_base: 'Bot_Masivo',
    activos: ['EURUSD'],
    temporalidades: [],
    direcciones: [],
    tipos_entrada: [],
    oss_configs: [],
    tecnicas: {
      SPP: { enabled: false, min: 100, max: 1000 },
      WFM: { enabled: false, min: 100, max: 800 },
      'MC Trade': { enabled: false, min: 50, max: 500 },
      'Retest MC': { enabled: false, min: 100, max: 300 }
    },
    parametros_avanzados: {
      atr_min: 5,
      atr_max: 20,
      periodo_min: 2,
      periodo_max: 100,
      global_min: 2,
      global_max: 130
    },
    horario: {
      inicio: '14:00',
      fin: '20:00'
    }
  });

  const [preview, setPreview] = useState({
    totalCombinaciones: 0,
    ejemplos: []
  });
  
  const [generating, setGenerating] = useState(false);

  // Opciones disponibles
  const opciones = {
    temporalidades: ['M1', 'M5', 'M15', 'M30', 'H1', 'H4', 'D1'],
    direcciones: ['Long', 'Short', 'Both'],
    tipos_entrada: ['Market', 'Limit', 'Stop'],
    oss_configs: ['Sin OSS', 'OSS Final', 'OSS Invertido', 'OSS Intermedio'],
    activos: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'GOLD', 'SILVER']
  };

  // Función para calcular preview de combinaciones
  useEffect(() => {
    const calcularCombinaciones = () => {
      const totalActivos = config.activos.length;
      const totalTemporalidades = config.temporalidades.length || 1;
      const totalDirecciones = config.direcciones.length || 1;
      const totalTiposEntrada = config.tipos_entrada.length || 1;
      const totalOSS = config.oss_configs.length || 1;
      const totalTecnicas = Object.values(config.tecnicas).filter(t => t.enabled).length || 1;

      const total = totalActivos * totalTemporalidades * totalDirecciones * 
                   totalTiposEntrada * totalOSS * totalTecnicas;

      // Generar ejemplos de combinaciones
      const ejemplos = [];
      if (config.activos.length > 0 && config.temporalidades.length > 0) {
        for (let i = 0; i < Math.min(5, total); i++) {
          const activo = config.activos[i % config.activos.length];
          const temporalidad = config.temporalidades[i % config.temporalidades.length];
          const direccion = config.direcciones[i % (config.direcciones.length || 1)] || 'Long';
          const tipoEntrada = config.tipos_entrada[i % (config.tipos_entrada.length || 1)] || 'Market';
          const ossConfig = config.oss_configs[i % (config.oss_configs.length || 1)] || 'Sin OSS';
          
          const tecnicasEnabled = Object.keys(config.tecnicas).filter(t => config.tecnicas[t].enabled);
          const tecnica = tecnicasEnabled[i % (tecnicasEnabled.length || 1)] || 'SPP';

          ejemplos.push(`${config.nombre_base}_${activo}_${temporalidad}_${direccion}_${tipoEntrada}_${tecnica}_${ossConfig}`);
        }
      }

      setPreview({
        totalCombinaciones: total,
        ejemplos: ejemplos
      });
    };

    calcularCombinaciones();
  }, [config]);

  // Manejar cambios en checkboxes múltiples
  const handleMultipleChange = (categoria, valor, checked) => {
    setConfig(prev => ({
      ...prev,
      [categoria]: checked 
        ? [...prev[categoria], valor]
        : prev[categoria].filter(item => item !== valor)
    }));
  };

  // Manejar cambios en técnicas
  const handleTecnicaChange = (tecnica, field, value) => {
    setConfig(prev => ({
      ...prev,
      tecnicas: {
        ...prev.tecnicas,
        [tecnica]: {
          ...prev.tecnicas[tecnica],
          [field]: field === 'enabled' ? value : parseInt(value)
        }
      }
    }));
  };

  // Generar configuraciones masivas
  const generarConfiguraciones = async () => {
    if (!user) {
      alert('Debes iniciar sesión para generar configuraciones');
      return;
    }

    if (preview.totalCombinaciones === 0) {
      alert('Selecciona al menos una opción en cada categoría');
      return;
    }

    if (preview.totalCombinaciones > 1000) {
      if (!window.confirm(`Esto generará ${preview.totalCombinaciones} configuraciones. ¿Continuar?`)) {
        return;
      }
    }

    setGenerating(true);
    try {
      // Obtener próximo magic number base
      const { data: maxMagic } = await supabase
        .from('bot_configurations')
        .select('magic_number')
        .eq('user_id', user.id)
        .order('magic_number', { ascending: false })
        .limit(1);

      let magicNumberBase = (maxMagic?.[0]?.magic_number || 1000) + 1;

      // Generar todas las combinaciones
      const configuraciones = [];
      
      for (const activo of config.activos) {
        for (const temporalidad of (config.temporalidades.length ? config.temporalidades : ['M15'])) {
          for (const direccion of (config.direcciones.length ? config.direcciones : ['Long'])) {
            for (const tipoEntrada of (config.tipos_entrada.length ? config.tipos_entrada : ['Market'])) {
              for (const ossConfig of (config.oss_configs.length ? config.oss_configs : ['Sin OSS'])) {
                
                const tecnicasEnabled = Object.keys(config.tecnicas).filter(t => config.tecnicas[t].enabled);
                const tecnicasToUse = tecnicasEnabled.length ? tecnicasEnabled : ['SPP'];
                
                for (const tecnica of tecnicasToUse) {
                  const tecnicaConfig = config.tecnicas[tecnica] || { min: 100, max: 500 };
                  const simulaciones = Math.floor(Math.random() * (tecnicaConfig.max - tecnicaConfig.min + 1)) + tecnicaConfig.min;
                  
                  const nombreCompleto = `${config.nombre_base}_${activo}_${temporalidad}_${direccion}_${tipoEntrada}_${tecnica}_${ossConfig}_${magicNumberBase}`;
                  
                  configuraciones.push({
                    user_id: user.id,
                    nombre_base: config.nombre_base,
                    nombre_completo: nombreCompleto,
                    magic_number: magicNumberBase++,
                    activo: activo,
                    temporalidad: temporalidad,
                    direccion: direccion,
                    tipo_entrada: tipoEntrada,
                    oss_config: ossConfig,
                    tecnicas_simulaciones: { [tecnica]: simulaciones },
                    atr_min: config.parametros_avanzados.atr_min,
                    atr_max: config.parametros_avanzados.atr_max,
                    periodo_min: config.parametros_avanzados.periodo_min,
                    periodo_max: config.parametros_avanzados.periodo_max,
                    global_min: config.parametros_avanzados.global_min,
                    global_max: config.parametros_avanzados.global_max,
                    horario_inicio: config.horario.inicio,
                    horario_fin: config.horario.fin,
                    estado: 'Generado'
                  });
                }
              }
            }
          }
        }
      }

      // Insertar en lotes de 100 para evitar límites
      const batchSize = 100;
      for (let i = 0; i < configuraciones.length; i += batchSize) {
        const batch = configuraciones.slice(i, i + batchSize);
        const { error } = await supabase
          .from('bot_configurations')
          .insert(batch);
        
        if (error) {
          console.error('Error insertando lote:', error);
          throw error;
        }
      }

      alert(`¡${configuraciones.length} configuraciones creadas exitosamente!`);
      
      // Reset formulario
      setConfig({
        ...config,
        temporalidades: [],
        direcciones: [],
        tipos_entrada: [],
        oss_configs: []
      });

    } catch (error) {
      console.error('Error generando configuraciones:', error);
      alert('Error generando configuraciones: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  return (
    <div style={{
      background: 'white',
      padding: '30px',
      borderRadius: '15px',
      boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
      maxWidth: '1200px',
      margin: '0 auto'
    }}>
      <header style={{
        textAlign: 'center',
        marginBottom: '30px'
      }}>
        <h1 style={{
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          margin: '0 0 20px 0',
          padding: '20px',
          borderRadius: '10px',
          fontSize: '2em'
        }}>
          🎛️ Generador Masivo de Configuraciones
        </h1>
        <p style={{ color: '#666', fontSize: '16px', lineHeight: '1.6' }}>
          Crea múltiples configuraciones de bots usando checkboxes exclusivos, técnicas avanzadas SPP/WFM/MC Trade, 
          y parámetros OSS optimizados. La evolución de tu sistema Streamlit en formato web.
        </p>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '30px' }}>
        
        {/* Panel de Configuración */}
        <div>
          
          {/* Configuración Básica */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#f8f9fa', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#333' }}>⚙️ Configuración Básica</h3>
            
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Nombre Base:
              </label>
              <input
                type="text"
                value={config.nombre_base}
                onChange={(e) => setConfig(prev => ({ ...prev, nombre_base: e.target.value }))}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px'
                }}
                placeholder="Bot_Masivo"
              />
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>
                Activos:
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px' }}>
                {opciones.activos.map(activo => (
                  <label key={activo} style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <input
                      type="checkbox"
                      checked={config.activos.includes(activo)}
                      onChange={(e) => handleMultipleChange('activos', activo, e.target.checked)}
                    />
                    <span style={{ fontSize: '14px' }}>{activo}</span>
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Checkboxes Exclusivos - Temporalidades */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#e3f2fd', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>⏰ Temporalidades (Checkboxes Exclusivos)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px' }}>
              {opciones.temporalidades.map(temp => (
                <label key={temp} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  padding: '8px',
                  background: config.temporalidades.includes(temp) ? '#1976d2' : 'white',
                  color: config.temporalidades.includes(temp) ? 'white' : '#333',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  border: '2px solid #1976d2',
                  justifyContent: 'center'
                }}>
                  <input
                    type="checkbox"
                    checked={config.temporalidades.includes(temp)}
                    onChange={(e) => handleMultipleChange('temporalidades', temp, e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{temp}</span>
                </label>
              ))}
            </div>
            <p style={{ fontSize: '12px', color: '#666', marginTop: '10px', margin: '10px 0 0 0' }}>
              Seleccionadas: {config.temporalidades.length} | 
              Combina múltiples temporalidades para diversificar estrategias
            </p>
          </div>

          {/* Checkboxes Exclusivos - Direcciones */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#f3e5f5', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#7b1fa2' }}>📈 Direcciones de Trading</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {opciones.direcciones.map(dir => (
                <label key={dir} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  padding: '12px',
                  background: config.direcciones.includes(dir) ? '#7b1fa2' : 'white',
                  color: config.direcciones.includes(dir) ? 'white' : '#333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '2px solid #7b1fa2',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  <input
                    type="checkbox"
                    checked={config.direcciones.includes(dir)}
                    onChange={(e) => handleMultipleChange('direcciones', dir, e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <span>{dir === 'Long' ? '📈 Long' : dir === 'Short' ? '📉 Short' : '🔄 Both'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Checkboxes Exclusivos - Tipos de Entrada */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#e8f5e8', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#388e3c' }}>🎯 Tipos de Entrada</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {opciones.tipos_entrada.map(tipo => (
                <label key={tipo} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  padding: '12px',
                  background: config.tipos_entrada.includes(tipo) ? '#388e3c' : 'white',
                  color: config.tipos_entrada.includes(tipo) ? 'white' : '#333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '2px solid #388e3c',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  <input
                    type="checkbox"
                    checked={config.tipos_entrada.includes(tipo)}
                    onChange={(e) => handleMultipleChange('tipos_entrada', tipo, e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <span>{tipo}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Checkboxes Exclusivos - OSS */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#fff3e0', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#f57c00' }}>🔧 Configuraciones OSS</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {opciones.oss_configs.map(oss => (
                <label key={oss} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  padding: '12px',
                  background: config.oss_configs.includes(oss) ? '#f57c00' : 'white',
                  color: config.oss_configs.includes(oss) ? 'white' : '#333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '2px solid #f57c00',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  <input
                    type="checkbox"
                    checked={config.oss_configs.includes(oss)}
                    onChange={(e) => handleMultipleChange('oss_configs', oss, e.target.checked)}
                    style={{ display: 'none' }}
                  />
                  <span>{oss}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Técnicas Avanzadas SPP/WFM/MC Trade */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#fce4ec', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#c2185b' }}>🧠 Técnicas de Minería Avanzadas</h3>
            {Object.keys(config.tecnicas).map(tecnica => (
              <div key={tecnica} style={{ 
                marginBottom: '15px', 
                padding: '15px', 
                background: config.tecnicas[tecnica].enabled ? '#c2185b' : 'white',
                color: config.tecnicas[tecnica].enabled ? 'white' : '#333',
                borderRadius: '8px',
                border: '2px solid #c2185b'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', marginBottom: '10px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                    <input
                      type="checkbox"
                      checked={config.tecnicas[tecnica].enabled}
                      onChange={(e) => handleTecnicaChange(tecnica, 'enabled', e.target.checked)}
                    />
                    <span style={{ fontWeight: 'bold', fontSize: '16px' }}>{tecnica}</span>
                  </label>
                </div>
                
                {config.tecnicas[tecnica].enabled && (
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
                        Simulaciones Mín:
                      </label>
                      <input
                        type="number"
                        value={config.tecnicas[tecnica].min}
                        onChange={(e) => handleTecnicaChange(tecnica, 'min', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '5px',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '3px',
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white'
                        }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '12px', marginBottom: '5px' }}>
                        Simulaciones Máx:
                      </label>
                      <input
                        type="number"
                        value={config.tecnicas[tecnica].max}
                        onChange={(e) => handleTecnicaChange(tecnica, 'max', e.target.value)}
                        style={{
                          width: '100%',
                          padding: '5px',
                          border: '1px solid rgba(255,255,255,0.3)',
                          borderRadius: '3px',
                          background: 'rgba(255,255,255,0.2)',
                          color: 'white'
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

        </div>

        {/* Panel de Preview y Generación */}
        <div>
          
          {/* Preview de Combinaciones */}
          <div style={{
            position: 'sticky',
            top: '20px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            padding: '25px',
            borderRadius: '15px',
            marginBottom: '20px'
          }}>
            <h3 style={{ margin: '0 0 20px 0' }}>📊 Preview de Generación</h3>
            
            <div style={{ 
              background: 'rgba(255,255,255,0.2)', 
              padding: '15px', 
              borderRadius: '10px',
              marginBottom: '15px'
            }}>
              <div style={{ fontSize: '2.5em', fontWeight: 'bold', textAlign: 'center' }}>
                {preview.totalCombinaciones.toLocaleString()}
              </div>
              <div style={{ textAlign: 'center', fontSize: '14px', opacity: 0.9 }}>
                Configuraciones a generar
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Distribución:</strong>
              <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '5px' }}>
                • {config.activos.length} Activo{config.activos.length !== 1 ? 's' : ''}<br/>
                • {config.temporalidades.length || 1} Temporalidad{(config.temporalidades.length || 1) !== 1 ? 'es' : ''}<br/>
                • {config.direcciones.length || 1} Direcci{(config.direcciones.length || 1) !== 1 ? 'ones' : 'ón'}<br/>
                • {config.tipos_entrada.length || 1} Tipo{(config.tipos_entrada.length || 1) !== 1 ? 's' : ''} Entrada<br/>
                • {config.oss_configs.length || 1} Config{(config.oss_configs.length || 1) !== 1 ? 's' : ''} OSS<br/>
                • {Object.values(config.tecnicas).filter(t => t.enabled).length || 1} Técnica{(Object.values(config.tecnicas).filter(t => t.enabled).length || 1) !== 1 ? 's' : ''}
              </div>
            </div>

            {preview.ejemplos.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <strong>Ejemplos:</strong>
                <div style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '10px', 
                  borderRadius: '5px',
                  marginTop: '5px',
                  fontSize: '12px',
                  fontFamily: 'monospace'
                }}>
                  {preview.ejemplos.map((ejemplo, index) => (
                    <div key={index}>{ejemplo}</div>
                  ))}
                  {preview.totalCombinaciones > 5 && (
                    <div style={{ opacity: 0.7, marginTop: '5px' }}>
                      ... y {preview.totalCombinaciones - 5} más
                    </div>
                  )}
                </div>
              </div>
            )}

            <button
              onClick={generarConfiguraciones}
              disabled={generating || preview.totalCombinaciones === 0 || !user}
              style={{
                width: '100%',
                padding: '15px',
                background: generating ? '#6c757d' : (preview.totalCombinaciones === 0 || !user) ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: generating || preview.totalCombinaciones === 0 || !user ? 'not-allowed' : 'pointer'
              }}
            >
              {generating 
                ? '⏳ Generando...' 
                : !user 
                  ? '🔐 Inicia Sesión' 
                  : preview.totalCombinaciones === 0 
                    ? '❌ Selecciona Opciones'
                    : `🚀 Generar ${preview.totalCombinaciones.toLocaleString()} Configuraciones`
              }
            </button>

            {preview.totalCombinaciones > 500 && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: 'rgba(255,193,7,0.3)',
                borderRadius: '5px',
                fontSize: '12px',
                textAlign: 'center'
              }}>
                ⚠️ Gran cantidad de configuraciones. El proceso puede tomar varios minutos.
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default MassiveGenerator;
