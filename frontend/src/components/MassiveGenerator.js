import React, { useState, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.REACT_APP_SUPABASE_URL,
  process.env.REACT_APP_SUPABASE_ANON_KEY
);

const MassiveGenerator = ({ user, onDataChange }) => {
  const [config, setConfig] = useState({
    nombre_base: 'Bot_Masivo',
    activo: 'EURUSD',
    temporalidad: '',
    direccion: '',
    tipo_entrada: '',
    oss_config: '',
    horario_avanzado: {
      exit_at_end_of_day: true,
      end_of_day_exit_time: '15:00',
      exit_on_friday: true,
      friday_exit_time: '23:00'
    },
    trading_option: {
      time_range_from: '02:00',
      time_range_to: '22:00',
      exit_at_end_of_range: false,
      order_types_to_close: 'All'
    },
    tecnicas: {
      SPP: { enabled: false, min: 100, max: 1000 },
      WFM: { enabled: false, min: 100, max: 800 },
      'MC Trade': { enabled: false, min: 50, max: 500 },
      'MC Lento': { enabled: false, min: 100, max: 300 },
      'Secuencial': { enabled: false, min: 50, max: 200 }, // NUEVA TÉCNICA
      'High Back Test Precision': { enabled: false, min: 200, max: 800 } // NUEVA TÉCNICA
    },
    parametros_avanzados: {
      atr_based: false,
      atr_multiple: { min: 1.5, max: 3.0 },
      atr_periodo: { min: 14, max: 20 },
      periodo_min: 2,
      periodo_max: 100,
      global_min: 2,
      global_max: 130,
      global_indicadores: { min: 1, max: 5 }
    }
  });

  const [customActivo, setCustomActivo] = useState('');
  const [showCustomActivo, setShowCustomActivo] = useState(false);
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
    order_types_to_close: [
      { value: 'All', label: 'Todas las órdenes' },
      { value: 'Pending', label: 'Solo órdenes pendientes' },
      { value: 'Live', label: 'Solo órdenes en vivo' }
    ],
    activos_predefinidos: ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'GOLD', 'SILVER', 'OIL', 'BTC', 'ETH']
  };

  // Función para calcular preview de combinaciones - CORREGIDA
  useEffect(() => {
    const calcularCombinaciones = () => {
      const tecnicasEnabled = Object.keys(config.tecnicas).filter(t => config.tecnicas[t].enabled);
      
      // CORRECCIÓN: Solo 1 bot sin importar cuántas técnicas se seleccionen
      const total = tecnicasEnabled.length > 0 ? 1 : 1;

      const ejemplos = [];
      if (config.activo && config.temporalidad && config.direccion && config.tipo_entrada) {
        if (tecnicasEnabled.length > 0) {
          // Un solo bot con todas las técnicas combinadas
          const tecnicasCombinadas = tecnicasEnabled.join('+');
          const nombre = `${config.nombre_base}_${config.activo}_${config.temporalidad}_${config.direccion}_${config.tipo_entrada}_${tecnicasCombinadas}_${config.oss_config || 'SinOSS'}`;
          ejemplos.push(nombre);
        } else {
          // Bot por defecto con SPP
          const nombre = `${config.nombre_base}_${config.activo}_${config.temporalidad}_${config.direccion}_${config.tipo_entrada}_SPP_${config.oss_config || 'SinOSS'}`;
          ejemplos.push(nombre);
        }
      }

      setPreview({
        totalCombinaciones: total,
        ejemplos: ejemplos
      });
    };

    calcularCombinaciones();
  }, [config]);

  // Manejar cambios en selección única
  const handleSingleChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Manejar cambios en horario avanzado
  const handleHorarioAvanzadoChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      horario_avanzado: {
        ...prev.horario_avanzado,
        [field]: value
      }
    }));
  };

  // Manejar cambios en trading option
  const handleTradingOptionChange = (field, value) => {
    setConfig(prev => ({
      ...prev,
      trading_option: {
        ...prev.trading_option,
        [field]: value
      }
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
          [field]: field === 'enabled' ? value : parseFloat(value)
        }
      }
    }));
  };

  // Manejar cambios en parámetros avanzados
  const handleParametroChange = (parametro, value) => {
    setConfig(prev => ({
      ...prev,
      parametros_avanzados: {
        ...prev.parametros_avanzados,
        [parametro]: isNaN(parseFloat(value)) ? value : parseFloat(value)
      }
    }));
  };

  // Manejar cambios en rangos de parámetros avanzados
  const handleRangeChange = (parametro, tipo, value) => {
    setConfig(prev => ({
      ...prev,
      parametros_avanzados: {
        ...prev.parametros_avanzados,
        [parametro]: {
          ...prev.parametros_avanzados[parametro],
          [tipo]: parseFloat(value)
        }
      }
    }));
  };

  // Agregar activo personalizado
  const agregarActivoPersonalizado = () => {
    if (customActivo.trim() && !opciones.activos_predefinidos.includes(customActivo.toUpperCase())) {
      setConfig(prev => ({ ...prev, activo: customActivo.toUpperCase() }));
      setCustomActivo('');
      setShowCustomActivo(false);
    }
  };

  // Generar configuraciones - LÓGICA CORREGIDA
  const generarConfiguraciones = async () => {
    if (!user) {
      alert('Debes iniciar sesión para generar configuraciones');
      return;
    }

    if (!config.temporalidad || !config.direccion || !config.tipo_entrada) {
      alert('Por favor completa todas las configuraciones básicas');
      return;
    }

    const tecnicasEnabled = Object.keys(config.tecnicas).filter(t => config.tecnicas[t].enabled);
    if (tecnicasEnabled.length === 0) {
      if (!window.confirm('No has seleccionado técnicas específicas. ¿Generar con configuración SPP por defecto?')) {
        return;
      }
    }

    setGenerating(true);
    try {
      const { data: maxMagic } = await supabase
        .from('bot_configurations')
        .select('magic_number')
        .eq('user_id', user.id)
        .order('magic_number', { ascending: false })
        .limit(1);

      let magicNumberBase = (maxMagic?.[0]?.magic_number || 1000) + 1;

      // CORRECCIÓN: Generar UN SOLO BOT con todas las técnicas combinadas
      const tecnicasToUse = tecnicasEnabled.length ? tecnicasEnabled : ['SPP'];
      
      // Combinar todas las técnicas en un solo objeto
      const tecnicasCombinadas = {};
      let totalSimulaciones = 0;
      
      tecnicasToUse.forEach(tecnica => {
        const tecnicaConfig = config.tecnicas[tecnica] || { min: 100, max: 500 };
        const simulaciones = Math.floor(Math.random() * (tecnicaConfig.max - tecnicaConfig.min + 1)) + tecnicaConfig.min;
        tecnicasCombinadas[tecnica] = simulaciones;
        totalSimulaciones += simulaciones;
      });

      // Crear nombre combinado con todas las técnicas
      const tecnicasNombres = tecnicasToUse.join('+');
      const nombreCompleto = `${config.nombre_base}_${config.activo}_${config.temporalidad}_${config.direccion}_${config.tipo_entrada}_${tecnicasNombres}_${config.oss_config || 'SinOSS'}_${magicNumberBase}`;
      
      // UN SOLO BOT con todas las técnicas
      const configuracion = {
        user_id: user.id,
        nombre_base: config.nombre_base,
        nombre_completo: nombreCompleto,
        magic_number: magicNumberBase,
        activo: config.activo,
        temporalidad: config.temporalidad,
        direccion: config.direccion,
        tipo_entrada: config.tipo_entrada,
        oss_config: config.oss_config || 'Sin OSS',
        horario_avanzado: config.horario_avanzado,
        trading_option: config.trading_option,
        tecnicas_simulaciones: tecnicasCombinadas, // TODAS las técnicas en un solo bot
        total_simulaciones: totalSimulaciones,
        atr_based: config.parametros_avanzados.atr_based,
        atr_multiple_min: config.parametros_avanzados.atr_multiple.min,
        atr_multiple_max: config.parametros_avanzados.atr_multiple.max,
        atr_periodo_min: config.parametros_avanzados.atr_periodo.min,
        atr_periodo_max: config.parametros_avanzados.atr_periodo.max,
        periodo_min: config.parametros_avanzados.periodo_min,
        periodo_max: config.parametros_avanzados.periodo_max,
        global_min: config.parametros_avanzados.global_min,
        global_max: config.parametros_avanzados.global_max,
        global_indicadores_min: config.parametros_avanzados.global_indicadores.min,
        global_indicadores_max: config.parametros_avanzados.global_indicadores.max,
        estado: 'Generado'
      };

      const { error } = await supabase
        .from('bot_configurations')
        .insert([configuracion]); // UN SOLO BOT
      
      if (error) {
        console.error('Error insertando configuración:', error);
        throw error;
      }

      // Mensaje más específico
      const mensajeTecnicas = tecnicasToUse.length > 1 
        ? `con ${tecnicasToUse.length} técnicas combinadas (${tecnicasToUse.join(', ')})`
        : `con técnica ${tecnicasToUse[0]}`;
      
      alert(`¡Bot creado exitosamente ${mensajeTecnicas}!\nTotal simulaciones: ${totalSimulaciones}`);
      
      if (onDataChange) {
        await onDataChange();
      }

    } catch (error) {
      console.error('Error generando configuración:', error);
      alert('Error generando configuración: ' + error.message);
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
      maxWidth: '1400px',
      margin: '20px auto'
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
                onChange={(e) => handleSingleChange('nombre_base', e.target.value)}
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
              <label style={{ display: 'block', marginBottom: '10px', fontWeight: 'bold' }}>
                Activo (Selección única):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(100px, 1fr))', gap: '10px', marginBottom: '15px' }}>
                {opciones.activos_predefinidos.map(activo => (
                  <label key={activo} style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '5px',
                    padding: '8px',
                    background: config.activo === activo ? '#007bff' : 'white',
                    color: config.activo === activo ? 'white' : '#333',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    border: '2px solid #007bff',
                    justifyContent: 'center'
                  }}>
                    <input
                      type="radio"
                      name="activo"
                      value={activo}
                      checked={config.activo === activo}
                      onChange={(e) => handleSingleChange('activo', e.target.value)}
                      style={{ display: 'none' }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 'bold' }}>{activo}</span>
                  </label>
                ))}
              </div>
              
              {/* Opción para agregar activo personalizado */}
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <button
                  onClick={() => setShowCustomActivo(!showCustomActivo)}
                  style={{
                    padding: '8px 15px',
                    background: '#28a745',
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '12px'
                  }}
                >
                  + Agregar Activo
                </button>
                {showCustomActivo && (
                  <>
                    <input
                      type="text"
                      value={customActivo}
                      onChange={(e) => setCustomActivo(e.target.value.toUpperCase())}
                      placeholder="BTCUSD"
                      style={{
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '12px',
                        width: '100px'
                      }}
                    />
                    <button
                      onClick={agregarActivoPersonalizado}
                      disabled={!customActivo.trim()}
                      style={{
                        padding: '8px 12px',
                        background: customActivo.trim() ? '#007bff' : '#6c757d',
                        color: 'white',
                        border: 'none',
                        borderRadius: '5px',
                        cursor: customActivo.trim() ? 'pointer' : 'not-allowed',
                        fontSize: '12px'
                      }}
                    >
                      ✓
                    </button>
                  </>
                )}
              </div>
              
              {!opciones.activos_predefinidos.includes(config.activo) && config.activo && (
                <div style={{ 
                  marginTop: '10px', 
                  padding: '8px 12px', 
                  background: '#e3f2fd', 
                  borderRadius: '5px',
                  fontSize: '12px',
                  color: '#1976d2'
                }}>
                  Activo personalizado seleccionado: <strong>{config.activo}</strong>
                </div>
              )}
            </div>
          </div>

          {/* Temporalidades */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#e3f2fd', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#1976d2' }}>⏰ Temporalidad (Selección única)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(80px, 1fr))', gap: '10px' }}>
              {opciones.temporalidades.map(temp => (
                <label key={temp} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  padding: '8px',
                  background: config.temporalidad === temp ? '#1976d2' : 'white',
                  color: config.temporalidad === temp ? 'white' : '#333',
                  borderRadius: '5px',
                  cursor: 'pointer',
                  border: '2px solid #1976d2',
                  justifyContent: 'center'
                }}>
                  <input
                    type="radio"
                    name="temporalidad"
                    value={temp}
                    checked={config.temporalidad === temp}
                    onChange={(e) => handleSingleChange('temporalidad', e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <span style={{ fontSize: '14px', fontWeight: 'bold' }}>{temp}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Direcciones */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#f3e5f5', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#7b1fa2' }}>📈 Dirección de Trading (Selección única)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {opciones.direcciones.map(dir => (
                <label key={dir} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  padding: '12px',
                  background: config.direccion === dir ? '#7b1fa2' : 'white',
                  color: config.direccion === dir ? 'white' : '#333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '2px solid #7b1fa2',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  <input
                    type="radio"
                    name="direccion"
                    value={dir}
                    checked={config.direccion === dir}
                    onChange={(e) => handleSingleChange('direccion', e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <span>{dir === 'Long' ? '📈 Long' : dir === 'Short' ? '📉 Short' : '🔄 Both'}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Tipos de Entrada */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#e8f5e8', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#388e3c' }}>🎯 Tipo de Entrada (Selección única)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
              {opciones.tipos_entrada.map(tipo => (
                <label key={tipo} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  padding: '12px',
                  background: config.tipo_entrada === tipo ? '#388e3c' : 'white',
                  color: config.tipo_entrada === tipo ? 'white' : '#333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '2px solid #388e3c',
                  justifyContent: 'center',
                  fontWeight: 'bold'
                }}>
                  <input
                    type="radio"
                    name="tipo_entrada"
                    value={tipo}
                    checked={config.tipo_entrada === tipo}
                    onChange={(e) => handleSingleChange('tipo_entrada', e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <span>{tipo}</span>
                </label>
              ))}
            </div>
          </div>

          {/* OSS */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#fff3e0', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#f57c00' }}>🔧 Configuración OSS (Selección única)</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '10px' }}>
              {opciones.oss_configs.map(oss => (
                <label key={oss} style={{ 
                  display: 'flex', 
                  alignItems: 'center', 
                  gap: '5px',
                  padding: '12px',
                  background: config.oss_config === oss ? '#f57c00' : 'white',
                  color: config.oss_config === oss ? 'white' : '#333',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  border: '2px solid #f57c00',
                  justifyContent: 'center',
                  fontSize: '14px',
                  fontWeight: 'bold'
                }}>
                  <input
                    type="radio"
                    name="oss_config"
                    value={oss}
                    checked={config.oss_config === oss}
                    onChange={(e) => handleSingleChange('oss_config', e.target.value)}
                    style={{ display: 'none' }}
                  />
                  <span>{oss}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Horario Avanzado */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#e8f5e8', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#388e3c' }}>🕐 Configuración de Horarios</h3>
            
            {/* Exit At End Of Day */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '160px' }}>
                  Exit At End Of Day 🕐:
                </span>
                <div style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '60px',
                  height: '34px'
                }}>
                  <input
                    type="checkbox"
                    checked={config.horario_avanzado.exit_at_end_of_day}
                    onChange={(e) => handleHorarioAvanzadoChange('exit_at_end_of_day', e.target.checked)}
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: config.horario_avanzado.exit_at_end_of_day ? '#007bff' : '#ccc',
                    transition: '0.4s',
                    borderRadius: '34px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '26px',
                      width: '26px',
                      left: config.horario_avanzado.exit_at_end_of_day ? '30px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '0.4s',
                      borderRadius: '50%'
                    }}></span>
                  </span>
                </div>
              </label>
            </div>

            {/* End Of Day Exit Time */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '160px' }}>
                  End Of Day Exit Time 🕐:
                </span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="time"
                    value={config.horario_avanzado.end_of_day_exit_time}
                    onChange={(e) => handleHorarioAvanzadoChange('end_of_day_exit_time', e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                      marginRight: '10px'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>▲</button>
                    <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>▼</button>
                  </div>
                </div>
              </label>
            </div>

            {/* Exit On Friday */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '15px', cursor: 'pointer' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '160px' }}>
                  Exit On Friday 🕐:
                </span>
                <div style={{
                  position: 'relative',
                  display: 'inline-block',
                  width: '60px',
                  height: '34px'
                }}>
                  <input
                    type="checkbox"
                    checked={config.horario_avanzado.exit_on_friday}
                    onChange={(e) => handleHorarioAvanzadoChange('exit_on_friday', e.target.checked)}
                    style={{
                      opacity: 0,
                      width: 0,
                      height: 0
                    }}
                  />
                  <span style={{
                    position: 'absolute',
                    cursor: 'pointer',
                    top: 0,
                    left: 0,
                    right: 0,
                    bottom: 0,
                    backgroundColor: config.horario_avanzado.exit_on_friday ? '#007bff' : '#ccc',
                    transition: '0.4s',
                    borderRadius: '34px'
                  }}>
                    <span style={{
                      position: 'absolute',
                      content: '""',
                      height: '26px',
                      width: '26px',
                      left: config.horario_avanzado.exit_on_friday ? '30px' : '4px',
                      bottom: '4px',
                      backgroundColor: 'white',
                      transition: '0.4s',
                      borderRadius: '50%'
                    }}></span>
                  </span>
                </div>
              </label>
            </div>

            {/* Friday Exit Time */}
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                <span style={{ fontSize: '14px', fontWeight: 'bold', minWidth: '160px' }}>
                  Friday Exit Time 🕐:
                </span>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="time"
                    value={config.horario_avanzado.friday_exit_time}
                    onChange={(e) => handleHorarioAvanzadoChange('friday_exit_time', e.target.value)}
                    style={{
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px',
                      marginRight: '10px'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>▲</button>
                    <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>▼</button>
                  </div>
                </div>
              </label>
            </div>
          </div>

          {/* Trading Option - EN ESPAÑOL */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#e1f5fe', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#0277bd' }}>⚡ Opciones de Trading</h3>
            
            {/* Rango de Tiempo */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', marginBottom: '15px' }}>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Rango de Tiempo Desde 🕐:
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="time"
                    value={config.trading_option.time_range_from}
                    onChange={(e) => handleTradingOptionChange('time_range_from', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '10px' }}>
                    <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>▲</button>
                    <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>▼</button>
                  </div>
                </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Rango de Tiempo Hasta 🕐:
                </label>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  <input
                    type="time"
                    value={config.trading_option.time_range_to}
                    onChange={(e) => handleTradingOptionChange('time_range_to', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column', marginLeft: '10px' }}>
                    <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>▲</button>
                    <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '12px' }}>▼</button>
                  </div>
                </div>
              </div>
            </div>

            {/* Salir al Final del Rango */}
            <div style={{ marginBottom: '15px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.trading_option.exit_at_end_of_range}
                  onChange={(e) => handleTradingOptionChange('exit_at_end_of_range', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ fontSize: '14px', fontWeight: 'bold' }}>Salir al Final del Rango 🕐</span>
              </label>
            </div>

            {/* Tipos de Órdenes a Cerrar */}
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                Tipos de Órdenes a Cerrar 🕐:
              </label>
              <select
                value={config.trading_option.order_types_to_close}
                onChange={(e) => handleTradingOptionChange('order_types_to_close', e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px',
                  border: '1px solid #ddd',
                  borderRadius: '5px',
                  fontSize: '14px',
                  background: 'white'
                }}
              >
                {opciones.order_types_to_close.map(option => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Técnicas Avanzadas - CON NUEVAS TÉCNICAS */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#fce4ec', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#c2185b' }}>🧠 Técnicas de Minería Avanzadas</h3>
            <p style={{ fontSize: '14px', color: '#666', marginBottom: '15px' }}>
              Selecciona múltiples técnicas para combinarlas en un solo bot
            </p>
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

          {/* Parámetros Avanzados */}
          <div style={{ marginBottom: '25px', padding: '20px', background: '#f3e5f5', borderRadius: '10px' }}>
            <h3 style={{ margin: '0 0 15px 0', color: '#7b1fa2' }}>🔬 Parámetros Avanzados</h3>
            
            {/* ATR-based Checkbox */}
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={config.parametros_avanzados.atr_based}
                  onChange={(e) => handleParametroChange('atr_based', e.target.checked)}
                  style={{ transform: 'scale(1.2)' }}
                />
                <span style={{ fontSize: '16px', fontWeight: 'bold' }}>ATR-based</span>
              </label>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
              
              {/* ATR Multiple - Rango */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                  ATR Multiple:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      value={config.parametros_avanzados.atr_multiple.min}
                      onChange={(e) => handleRangeChange('atr_multiple', 'min', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                      min="0.1"
                      max="10.0"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>−</button>
                      <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>+</button>
                    </div>
                  </div>
                  <div>
                    <input
                      type="number"
                      step="0.1"
                      value={config.parametros_avanzados.atr_multiple.max}
                      onChange={(e) => handleRangeChange('atr_multiple', 'max', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                      min="0.1"
                      max="10.0"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>−</button>
                      <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>+</button>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', textAlign: 'center' }}>
                  Mín: {config.parametros_avanzados.atr_multiple.min} - Máx: {config.parametros_avanzados.atr_multiple.max}
                </div>
              </div>

              {/* ATR Period - Rango */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                  ATR Period:
                </label>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                  <div>
                    <input
                      type="number"
                      value={config.parametros_avanzados.atr_periodo.min}
                      onChange={(e) => handleRangeChange('atr_periodo', 'min', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                      min="1"
                      max="100"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>−</button>
                      <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>+</button>
                    </div>
                  </div>
                  <div>
                    <input
                      type="number"
                      value={config.parametros_avanzados.atr_periodo.max}
                      onChange={(e) => handleRangeChange('atr_periodo', 'max', e.target.value)}
                      style={{
                        width: '100%',
                        padding: '8px',
                        border: '1px solid #ddd',
                        borderRadius: '5px',
                        fontSize: '14px'
                      }}
                      min="1"
                      max="100"
                    />
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                      <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>−</button>
                      <button type="button" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: '18px' }}>+</button>
                    </div>
                  </div>
                </div>
                <div style={{ fontSize: '12px', color: '#666', marginTop: '5px', textAlign: 'center' }}>
                  Mín: {config.parametros_avanzados.atr_periodo.min} - Máx: {config.parametros_avanzados.atr_periodo.max}
                </div>
              </div>

              {/* Otros parámetros simples */}
              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Período Mín:
                </label>
                <input
                  type="number"
                  value={config.parametros_avanzados.periodo_min}
                  onChange={(e) => handleParametroChange('periodo_min', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Período Máx:
                </label>
                <input
                  type="number"
                  value={config.parametros_avanzados.periodo_max}
                  onChange={(e) => handleParametroChange('periodo_max', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Global Mín:
                </label>
                <input
                  type="number"
                  value={config.parametros_avanzados.global_min}
                  onChange={(e) => handleParametroChange('global_min', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
              </div>

              <div>
                <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '5px' }}>
                  Global Máx:
                </label>
                <input
                  type="number"
                  value={config.parametros_avanzados.global_max}
                  onChange={(e) => handleParametroChange('global_max', e.target.value)}
                  style={{
                    width: '100%',
                    padding: '8px',
                    border: '1px solid #ddd',
                    borderRadius: '5px',
                    fontSize: '14px'
                  }}
                />
              </div>
            </div>

            {/* Global Indicadores - Rango */}
            <div style={{ marginTop: '20px' }}>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: 'bold', marginBottom: '10px' }}>
                Global Indicadores (Rango):
              </label>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px', maxWidth: '400px' }}>
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>Mínimo:</label>
                  <input
                    type="number"
                    value={config.parametros_avanzados.global_indicadores.min}
                    onChange={(e) => handleRangeChange('global_indicadores', 'min', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                    min="1"
                    max="10"
                  />
                </div>
                <div>
                  <label style={{ fontSize: '12px', color: '#666' }}>Máximo:</label>
                  <input
                    type="number"
                    value={config.parametros_avanzados.global_indicadores.max}
                    onChange={(e) => handleRangeChange('global_indicadores', 'max', e.target.value)}
                    style={{
                      width: '100%',
                      padding: '8px',
                      border: '1px solid #ddd',
                      borderRadius: '5px',
                      fontSize: '14px'
                    }}
                    min="1"
                    max="10"
                  />
                </div>
              </div>
            </div>
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
                1
              </div>
              <div style={{ textAlign: 'center', fontSize: '14px', opacity: 0.9 }}>
                Bot con técnicas combinadas
              </div>
            </div>

            <div style={{ marginBottom: '15px' }}>
              <strong>Configuración:</strong>
              <div style={{ fontSize: '14px', opacity: 0.9, marginTop: '5px' }}>
                • Activo: <strong>{config.activo}</strong><br/>
                • Temporalidad: <strong>{config.temporalidad || 'No seleccionada'}</strong><br/>
                • Dirección: <strong>{config.direccion || 'No seleccionada'}</strong><br/>
                • Tipo Entrada: <strong>{config.tipo_entrada || 'No seleccionado'}</strong><br/>
                • OSS: <strong>{config.oss_config || 'No seleccionado'}</strong><br/>
                • Rango: <strong>{config.trading_option.time_range_from} - {config.trading_option.time_range_to}</strong><br/>
                • Cerrar Órdenes: <strong>{opciones.order_types_to_close.find(opt => opt.value === config.trading_option.order_types_to_close)?.label}</strong><br/>
                • Técnicas: <strong>{Object.keys(config.tecnicas).filter(t => config.tecnicas[t].enabled).length || 'Ninguna'}</strong>
                {Object.keys(config.tecnicas).filter(t => config.tecnicas[t].enabled).length > 0 && (
                  <div style={{ marginTop: '5px', fontSize: '12px' }}>
                    ({Object.keys(config.tecnicas).filter(t => config.tecnicas[t].enabled).join(' + ')})
                  </div>
                )}
              </div>
            </div>

            {preview.ejemplos.length > 0 && (
              <div style={{ marginBottom: '20px' }}>
                <strong>Ejemplo de Bot:</strong>
                <div style={{ 
                  background: 'rgba(0,0,0,0.2)', 
                  padding: '10px', 
                  borderRadius: '5px',
                  marginTop: '5px',
                  fontSize: '11px',
                  fontFamily: 'monospace'
                }}>
                  {preview.ejemplos.map((ejemplo, index) => (
                    <div key={index}>{ejemplo}</div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={generarConfiguraciones}
              disabled={generating || !config.temporalidad || !config.direccion || !config.tipo_entrada || !user}
              style={{
                width: '100%',
                padding: '15px',
                background: generating ? '#6c757d' : (!config.temporalidad || !config.direccion || !config.tipo_entrada || !user) ? '#dc3545' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: 'bold',
                cursor: generating || !config.temporalidad || !config.direccion || !config.tipo_entrada || !user ? 'not-allowed' : 'pointer'
              }}
            >
              {generating 
                ? '⏳ Generando...' 
                : !user 
                  ? '🔐 Inicia Sesión' 
                  : (!config.temporalidad || !config.direccion || !config.tipo_entrada)
                    ? '❌ Completa: Temporalidad, Direcciones y Tipo de Entrada'
                    : `🚀 Generar 1 Bot${Object.keys(config.tecnicas).filter(t => config.tecnicas[t].enabled).length > 1 ? ' (Técnicas Combinadas)' : ''}`
              }
            </button>

            {(!config.temporalidad || !config.direccion || !config.tipo_entrada) && (
              <div style={{
                marginTop: '10px',
                padding: '10px',
                background: 'rgba(255,193,7,0.3)',
                borderRadius: '5px',
                fontSize: '12px',
                textAlign: 'center'
              }}>
                ⚠️ Completa: Temporalidad, Direcciones y Tipo de Entrada
              </div>
            )}
          </div>

        </div>

      </div>
    </div>
  );
};

export default MassiveGenerator;
