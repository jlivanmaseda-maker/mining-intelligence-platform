import React, { useState, useRef } from 'react';

const ImportExport = ({ user, supabase, onDataChange }) => {
  const [loading, setLoading] = useState(false);
  const [templates, setTemplates] = useState([]);
  const fileInputRef = useRef(null);

  // 📤 EXPORTAR CONFIGURACIONES
  const exportConfigurations = async (format = 'json') => {
    if (!user) {
      alert('Debes iniciar sesión para exportar configuraciones');
      return;
    }

    setLoading(true);
    try {
      // Obtener todas las configuraciones del usuario
      const { data: bots, error } = await supabase
        .from('bot_configurations')
        .select('*')
        .eq('user_id', user.id)
        .order('fecha_creacion', { ascending: false });

      if (error) throw error;

      if (bots.length === 0) {
        alert('No tienes configuraciones para exportar. Crea algunos bots primero.');
        return;
      }

      const exportData = {
        export_info: {
          user_email: user.email,
          export_date: new Date().toISOString(),
          total_configurations: bots.length,
          version: "1.0"
        },
        configurations: bots.map(bot => ({
          nombre_base: bot.nombre_base,
          activo: bot.activo,
          temporalidad: bot.temporalidad,
          direccion: bot.direccion,
          tipo_entrada: bot.tipo_entrada,
          oss_config: bot.oss_config,
          horario_avanzado: bot.horario_avanzado,
          trading_option: bot.trading_option,
          tecnicas_simulaciones: bot.tecnicas_simulaciones,
          total_simulaciones: bot.total_simulaciones,
          atr_based: bot.atr_based,
          atr_periodo_min: bot.atr_periodo_min,
          atr_periodo_max: bot.atr_periodo_max,
          atr_multiplicador_min: bot.atr_multiplicador_min,
          atr_multiplicador_max: bot.atr_multiplicador_max,
          global_indicador_min: bot.global_indicador_min,
          global_indicador_max: bot.global_indicador_max,
          spread_minado: bot.spread_minado,
          estado: bot.estado,
          fecha_creacion: bot.fecha_creacion
        }))
      };

      if (format === 'json') {
        downloadJSON(exportData);
      } else if (format === 'csv') {
        downloadCSV(bots);
      }

      alert(`✅ ${bots.length} configuraciones exportadas exitosamente en formato ${format.toUpperCase()}`);

    } catch (error) {
      console.error('Error exportando configuraciones:', error);
      alert('Error al exportar configuraciones: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 📋 DESCARGAR JSON
  const downloadJSON = (data) => {
    const dataStr = JSON.stringify(data, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    
    const exportFileDefaultName = `mining_intelligence_export_${new Date().toISOString().split('T')[0]}.json`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 📊 DESCARGAR CSV
  const downloadCSV = (bots) => {
    const headers = [
      'Nombre Base', 'Activo', 'Temporalidad', 'Direccion', 'Tipo Entrada', 
      'OSS Config', 'Estado', 'Total Simulaciones', 'Fecha Creacion'
    ];

    const csvContent = [
      headers.join(','),
      ...bots.map(bot => [
        bot.nombre_base,
        bot.activo,
        bot.temporalidad,
        bot.direccion,
        bot.tipo_entrada,
        bot.oss_config || 'Sin OSS',
        bot.estado,
        bot.total_simulaciones || 0,
        new Date(bot.fecha_creacion).toLocaleDateString()
      ].join(','))
    ].join('\n');

    const dataUri = 'data:text/csv;charset=utf-8,' + encodeURIComponent(csvContent);
    const exportFileDefaultName = `mining_intelligence_export_${new Date().toISOString().split('T')[0]}.csv`;
    
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  // 📥 IMPORTAR CONFIGURACIONES
  const importConfigurations = async (file) => {
    if (!user) {
      alert('Debes iniciar sesión para importar configuraciones');
      return;
    }

    setLoading(true);
    try {
      const text = await file.text();
      let importData;

      try {
        importData = JSON.parse(text);
      } catch (parseError) {
        throw new Error('Archivo JSON inválido. Por favor, verifica el formato.');
      }

      // Validar estructura del archivo
      if (!importData.configurations || !Array.isArray(importData.configurations)) {
        throw new Error('Estructura de archivo inválida. Debe contener un array de configuraciones.');
      }

      const configurations = importData.configurations;
      let importedCount = 0;

      // Obtener el último magic number
      const { data: maxMagic } = await supabase
        .from('bot_configurations')
        .select('magic_number')
        .eq('user_id', user.id)
        .order('magic_number', { ascending: false })
        .limit(1);

      let magicNumberBase = (maxMagic?.[0]?.magic_number || 1000) + 1;

      // Importar cada configuración
      for (const config of configurations) {
        const newConfig = {
          user_id: user.id,
          nombre_base: config.nombre_base + '_imported',
          nombre_completo: `${config.nombre_base}_imported_${config.activo}_${config.temporalidad}_${magicNumberBase}`,
          magic_number: magicNumberBase++,
          activo: config.activo,
          temporalidad: config.temporalidad,
          direccion: config.direccion,
          tipo_entrada: config.tipo_entrada,
          oss_config: config.oss_config || 'Sin OSS',
          horario_avanzado: config.horario_avanzado || {},
          trading_option: config.trading_option || {},
          tecnicas_simulaciones: config.tecnicas_simulaciones || { 'SPP': 500 },
          total_simulaciones: config.total_simulaciones || 500,
          atr_based: config.atr_based || false,
          atr_periodo_min: config.atr_periodo_min || 14,
          atr_periodo_max: config.atr_periodo_max || 20,
          atr_multiplicador_min: config.atr_multiplicador_min || 1.5,
          atr_multiplicador_max: config.atr_multiplicador_max || 3.0,
          global_indicador_min: config.global_indicador_min || 5,
          global_indicador_max: config.global_indicador_max || 200,
          spread_minado: config.spread_minado || 1.0,
          estado: 'Generado'
        };

        const { error } = await supabase
          .from('bot_configurations')
          .insert([newConfig]);

        if (error) {
          console.error('Error importando configuración:', error);
        } else {
          importedCount++;
        }
      }

      alert(`✅ ${importedCount} de ${configurations.length} configuraciones importadas exitosamente`);
      
      if (onDataChange) {
        await onDataChange();
      }

    } catch (error) {
      console.error('Error importando configuraciones:', error);
      alert('Error al importar configuraciones: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 📋 TEMPLATES PREDEFINIDOS
  const loadTemplate = async (templateName) => {
    setLoading(true);
    try {
      const templates = {
        'scalping_forex': {
          nombre_base: 'Scalping_FOREX_Pro',
          activo: 'EURUSD',
          temporalidad: 'M1',
          direccion: 'Both',
          tipo_entrada: 'Market',
          oss_config: 'OSS Final',
          tecnicas_simulaciones: { 'SPP': 1000, 'WFM': 500 },
          
        },
        'swing_crypto': {
          nombre_base: 'Swing_CRYPTO_Master',
          activo: 'BTC',
          temporalidad: 'H4',
          direccion: 'Long',
          tipo_entrada: 'Limit',
          oss_config: 'OSS Intermedio',
          tecnicas_simulaciones: { 'MC Trade': 800, 'High Back Test Precision': 300 },
       
        },
        'conservative_gold': {
          nombre_base: 'Conservative_GOLD_Safe',
          activo: 'GOLD',
          temporalidad: 'H1',
          direccion: 'Both',
          tipo_entrada: 'Limit',
          oss_config: 'OSS Final',
          tecnicas_simulaciones: { 'MC Lento': 600, 'Secuencial': 400 },
          
        }
      };

      const template = templates[templateName];
      if (!template) {
        throw new Error('Template no encontrado');
      }

      // Obtener el último magic number
      const { data: maxMagic } = await supabase
        .from('bot_configurations')
        .select('magic_number')
        .eq('user_id', user.id)
        .order('magic_number', { ascending: false })
        .limit(1);

      let magicNumber = (maxMagic?.[0]?.magic_number || 1000) + 1;

      const newConfig = {
        user_id: user.id,
        ...template,
        nombre_completo: `${template.nombre_base}_${template.activo}_${template.temporalidad}_${magicNumber}`,
        magic_number: magicNumber,
        total_simulaciones: Object.values(template.tecnicas_simulaciones).reduce((sum, val) => sum + val, 0),
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
        atr_periodo_min: template.atr_periodo_min || 14,
        atr_periodo_max: template.atr_periodo_max || 20,
        atr_multiplicador_min: template.atr_multiplicador_min || 1.5,
        atr_multiplicador_max: template.atr_multiplicador_max || 3.0,
        global_indicador_min: template.global_indicador_min || 5,
        global_indicador_max: template.global_indicador_max || 200,
        spread_minado: template.spread_minado || 1.0,
        estado: 'Generado'
      };

      const { error } = await supabase
        .from('bot_configurations')
        .insert([newConfig]);

      if (error) throw error;

      alert(`✅ Template "${templateName}" cargado exitosamente como "${template.nombre_base}"`);
      
      if (onDataChange) {
        await onDataChange();
      }

    } catch (error) {
      console.error('Error cargando template:', error);
      alert('Error al cargar template: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  // 📂 MANEJAR SELECCIÓN DE ARCHIVO
  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (file.type === 'application/json' || file.name.endsWith('.json')) {
        importConfigurations(file);
      } else {
        alert('Por favor, selecciona un archivo JSON válido');
      }
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
      
      {/* TÍTULO */}
      <h2 style={{ 
        margin: '0 0 30px 0', 
        color: '#333', 
        textAlign: 'center',
        fontSize: '1.8em'
      }}>
        📁 Sistema de Importación/Exportación
      </h2>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '25px' }}>
        
        {/* EXPORTAR CONFIGURACIONES */}
        <div style={{
          padding: '20px',
          background: '#e8f5e8',
          borderRadius: '10px',
          border: '2px solid #28a745'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#28a745' }}>📤 Exportar Configuraciones</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
            Exporta todas tus configuraciones de bots en diferentes formatos para respaldo o compartir.
          </p>
          
          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
            <button
              onClick={() => exportConfigurations('json')}
              disabled={loading}
              style={{
                padding: '10px 15px',
                background: loading ? '#6c757d' : '#28a745',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? '⏳ Exportando...' : '📋 JSON'}
            </button>
            
            <button
              onClick={() => exportConfigurations('csv')}
              disabled={loading}
              style={{
                padding: '10px 15px',
                background: loading ? '#6c757d' : '#17a2b8',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '14px',
                fontWeight: 'bold'
              }}
            >
              {loading ? '⏳ Exportando...' : '📊 CSV'}
            </button>
          </div>
        </div>

        {/* IMPORTAR CONFIGURACIONES */}
        <div style={{
          padding: '20px',
          background: '#e3f2fd',
          borderRadius: '10px',
          border: '2px solid #2196f3'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#2196f3' }}>📥 Importar Configuraciones</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
            Importa configuraciones previamente exportadas desde archivos JSON.
          </p>
          
          <input
            type="file"
            accept=".json"
            onChange={handleFileSelect}
            ref={fileInputRef}
            style={{ display: 'none' }}
          />
          
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={loading}
            style={{
              padding: '10px 15px',
              background: loading ? '#6c757d' : '#2196f3',
              color: 'white',
              border: 'none',
              borderRadius: '5px',
              cursor: loading ? 'not-allowed' : 'pointer',
              fontSize: '14px',
              fontWeight: 'bold'
            }}
          >
            {loading ? '⏳ Importando...' : '📂 Seleccionar Archivo JSON'}
          </button>
        </div>

        {/* TEMPLATES PREDEFINIDOS */}
        <div style={{
          padding: '20px',
          background: '#fff3e0',
          borderRadius: '10px',
          border: '2px solid #ff9800'
        }}>
          <h3 style={{ margin: '0 0 15px 0', color: '#ff9800' }}>📋 Templates Predefinidos</h3>
          <p style={{ color: '#666', fontSize: '14px', marginBottom: '15px' }}>
            Carga estrategias prediseñadas y optimizadas para diferentes mercados.
          </p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <button
              onClick={() => loadTemplate('scalping_forex')}
              disabled={loading}
              style={{
                padding: '8px 12px',
                background: loading ? '#6c757d' : '#ff9800',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                textAlign: 'left'
              }}
            >
              💱 Scalping FOREX (M1)
            </button>
            
            <button
              onClick={() => loadTemplate('swing_crypto')}
              disabled={loading}
              style={{
                padding: '8px 12px',
                background: loading ? '#6c757d' : '#9c27b0',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                textAlign: 'left'
              }}
            >
              ₿ Swing CRYPTO (H4)
            </button>
            
            <button
              onClick={() => loadTemplate('conservative_gold')}
              disabled={loading}
              style={{
                padding: '8px 12px',
                background: loading ? '#6c757d' : '#795548',
                color: 'white',
                border: 'none',
                borderRadius: '5px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontSize: '13px',
                textAlign: 'left'
              }}
            >
              🥇 Conservative GOLD (H1)
            </button>
          </div>
        </div>

      </div>

      {/* INFORMACIÓN ADICIONAL */}
      <div style={{
        marginTop: '25px',
        padding: '15px',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        borderRadius: '10px',
        textAlign: 'center'
      }}>
        <h4 style={{ margin: '0 0 10px 0' }}>💡 Consejos de Uso</h4>
        <div style={{ fontSize: '14px', opacity: 0.9}}>
          • Exporta regularmente para crear respaldos • Los archivos JSON mantienen toda la información • 
          Los templates son configuraciones optimizadas • Puedes compartir configuraciones entre cuentas
        </div>
      </div>
    </div>
  );
};

export default ImportExport;
