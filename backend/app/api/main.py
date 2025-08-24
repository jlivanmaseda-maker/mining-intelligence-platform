"""
Mining Intelligence Platform - Backend API
Sistema de inteligencia colectiva para trading algorítmico
"""
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from supabase import create_client, Client
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import os
import jwt
import json
from datetime import datetime
import logging

# Configuración de logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Inicializar FastAPI
app = FastAPI(
    title="Mining Intelligence Platform API",
    description="Sistema de inteligencia colectiva para encontrar las mejores estrategias de trading",
    version="1.0.0"
)

# Configurar CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://controlmineriasqx.netlify.app", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuración Supabase
SUPABASE_URL = os.getenv("SUPABASE_URL")
SUPABASE_ANON_KEY = os.getenv("SUPABASE_ANON_KEY")
SUPABASE_SERVICE_KEY = os.getenv("SUPABASE_SERVICE_KEY")

if not all([SUPABASE_URL, SUPABASE_ANON_KEY]):
    raise ValueError("Missing Supabase environment variables")

# Cliente Supabase
supabase: Client = create_client(SUPABASE_URL, SUPABASE_ANON_KEY)
supabase_admin: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Security
security = HTTPBearer()

# ============================================
# MODELOS PYDANTIC
# ============================================

class BotConfigurationCreate(BaseModel):
    nombre_base: str
    activo: str
    temporalidad: str
    direccion: str
    tipo_entrada: str
    oss_config: str = "Sin OSS"
    tecnicas_simulaciones: Dict[str, int] = {}
    atr_min: int = 5
    atr_max: int = 20
    periodo_min: int = 2
    periodo_max: int = 100
    global_min: int = 2
    global_max: int = 130
    horario_inicio: str = "14:00"
    horario_fin: str = "20:00"
    salir_final_rango: bool = False
    tipo_cierre_ordenes: Optional[str] = None

class BotEvaluationCreate(BaseModel):
    bot_configuration_id: str
    periodo_evaluacion: str  # YYYY-MM
    calificacion: str
    ganancias_reales: float
    operaciones_totales: int
    porcentaje_acierto: float
    drawdown_maximo: float
    comentarios: Optional[str] = None

class GlobalStatsResponse(BaseModel):
    total_usuarios: int
    total_bots: int
    total_evaluaciones: int
    mejores_patrones: List[Dict[str, Any]]
    insights_destacados: List[Dict[str, Any]]

# ============================================
# FUNCIONES AUXILIARES
# ============================================

def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """
    Extraer usuario actual del JWT token
    """
    try:
        token = credentials.credentials
        payload = jwt.decode(token, options={"verify_signature": False})
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        return user_id
    except Exception as e:
        logger.error(f"Error decoding token: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token"
        )

def generate_bot_name(config: BotConfigurationCreate) -> str:
    """
    Generar nombre completo del bot basado en configuración
    """
    tecnicas_str = "_".join(config.tecnicas_simulaciones.keys()) if config.tecnicas_simulaciones else "NoTech"
    return f"{config.nombre_base}_{config.activo}_{config.temporalidad}_{config.direccion}_{config.tipo_entrada}_{tecnicas_str}"

# ============================================
# ENDPOINTS DE SALUD Y INFO
# ============================================

@app.get("/")
async def root():
    return {
        "message": "🤖 Mining Intelligence Platform API",
        "status": "operational",
        "version": "1.0.0",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health_check():
    """Endpoint de salud para monitoring"""
    try:
        # Test conexión a Supabase
        result = supabase.table('global_mining_patterns').select("count").execute()
        
        return {
            "status": "healthy",
            "database": "connected",
            "timestamp": datetime.now().isoformat(),
            "services": {
                "supabase": "operational",
                "authentication": "operational"
            }
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "status": "degraded",
            "database": "error",
            "error": str(e),
            "timestamp": datetime.now().isoformat()
        }

# ============================================
# ENDPOINTS DE CONFIGURACIONES DE BOTS
# ============================================

@app.post("/api/bots", response_model=Dict[str, Any])
async def create_bot_configuration(
    config: BotConfigurationCreate,
    user_id: str = Depends(get_current_user)
):
    """
    Crear nueva configuración de bot
    """
    try:
        # Obtener próximo magic number
        magic_result = supabase.rpc('get_next_magic_number', {'user_uuid': user_id}).execute()
        magic_number = magic_result.data if magic_result.data else 1000
        
        # Generar nombre completo
        nombre_completo = generate_bot_name(config)
        
        # Preparar datos para insertar
        bot_data = {
            "user_id": user_id,
            "nombre_completo": nombre_completo,
            "magic_number": magic_number,
            **config.dict()
        }
        
        # Insertar en base de datos
        result = supabase.table('bot_configurations').insert(bot_data).execute()
        
        if result.data:
            logger.info(f"Bot created successfully: {result.data[0]['id']}")
            return {
                "success": True,
                "data": result.data[0],
                "message": f"Bot '{nombre_completo}' creado exitosamente con Magic Number {magic_number}"
            }
        else:
            raise HTTPException(status_code=400, detail="Error creating bot configuration")
            
    except Exception as e:
        logger.error(f"Error creating bot: {e}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}")

@app.get("/api/bots", response_model=List[Dict[str, Any]])
async def get_user_bots(user_id: str = Depends(get_current_user)):
    """
    Obtener todas las configuraciones de bots del usuario
    """
    try:
        result = supabase.table('bot_configurations')\
            .select("*")\
            .eq('user_id', user_id)\
            .order('fecha_creacion', desc=True)\
            .execute()
        
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching user bots: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/bots/{bot_id}", response_model=Dict[str, Any])
async def get_bot_configuration(
    bot_id: str,
    user_id: str = Depends(get_current_user)
):
    """
    Obtener configuración específica de bot
    """
    try:
        result = supabase.table('bot_configurations')\
            .select("*")\
            .eq('id', bot_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not result.data:
            raise HTTPException(status_code=404, detail="Bot configuration not found")
        
        return result.data[0]
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error fetching bot: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ENDPOINTS DE EVALUACIONES
# ============================================

@app.post("/api/evaluations", response_model=Dict[str, Any])
async def create_bot_evaluation(
    evaluation: BotEvaluationCreate,
    user_id: str = Depends(get_current_user)
):
    """
    Crear nueva evaluación de bot
    """
    try:
        # Verificar que el bot pertenece al usuario
        bot_check = supabase.table('bot_configurations')\
            .select("id")\
            .eq('id', evaluation.bot_configuration_id)\
            .eq('user_id', user_id)\
            .execute()
        
        if not bot_check.data:
            raise HTTPException(status_code=404, detail="Bot configuration not found or not owned by user")
        
        # Preparar datos de evaluación
        eval_data = {
            "user_id": user_id,
            **evaluation.dict()
        }
        
        # Insertar evaluación
        result = supabase.table('bot_evaluaciones').insert(eval_data).execute()
        
        if result.data:
            logger.info(f"Evaluation created successfully: {result.data[0]['id']}")
            return {
                "success": True,
                "data": result.data[0],
                "message": "Evaluación creada exitosamente"
            }
        else:
            raise HTTPException(status_code=400, detail="Error creating evaluation")
            
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating evaluation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/evaluations", response_model=List[Dict[str, Any]])
async def get_user_evaluations(user_id: str = Depends(get_current_user)):
    """
    Obtener todas las evaluaciones del usuario con información del bot
    """
    try:
        result = supabase.table('bot_evaluaciones')\
            .select("""
                *,
                bot_configurations (
                    nombre_completo,
                    activo,
                    temporalidad,
                    direccion,
                    tipo_entrada
                )
            """)\
            .eq('user_id', user_id)\
            .order('fecha_evaluacion', desc=True)\
            .execute()
        
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching evaluations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ENDPOINTS DE ESTADÍSTICAS GLOBALES
# ============================================

@app.get("/api/global-stats", response_model=GlobalStatsResponse)
async def get_global_statistics():
    """
    Obtener estadísticas globales del sistema
    """
    try:
        # Contar usuarios únicos (aproximado)
        users_result = supabase_admin.table('bot_configurations')\
            .select("user_id", count="exact")\
            .execute()
        total_usuarios = len(set([row['user_id'] for row in users_result.data])) if users_result.data else 0
        
        # Contar total de bots
        bots_result = supabase.table('bot_configurations')\
            .select("*", count="exact")\
            .execute()
        total_bots = bots_result.count
        
        # Contar total de evaluaciones
        evals_result = supabase.table('bot_evaluaciones')\
            .select("*", count="exact")\
            .execute()
        total_evaluaciones = evals_result.count
        
        # Mejores patrones (top 10 por índice de éxito)
        patterns_result = supabase.table('global_mining_patterns')\
            .select("*")\
            .gte('total_bots_evaluados', 5)\
            .order('indice_exito', desc=True)\
            .limit(10)\
            .execute()
        
        mejores_patrones = patterns_result.data or []
        
        # Insights destacados
        insights_result = supabase.table('global_insights')\
            .select("*")\
            .eq('activo', True)\
            .order('prioridad', desc=False)\
            .order('confianza', desc=True)\
            .limit(5)\
            .execute()
        
        insights_destacados = insights_result.data or []
        
        return GlobalStatsResponse(
            total_usuarios=total_usuarios,
            total_bots=total_bots,
            total_evaluaciones=total_evaluaciones,
            mejores_patrones=mejores_patrones,
            insights_destacados=insights_destacados
        )
        
    except Exception as e:
        logger.error(f"Error fetching global stats: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/global-patterns", response_model=List[Dict[str, Any]])
async def get_global_patterns(
    activo: Optional[str] = None,
    temporalidad: Optional[str] = None,
    direccion: Optional[str] = None,
    min_evaluations: int = 5
):
    """
    Obtener patrones globales con filtros opcionales
    """
    try:
        query = supabase.table('global_mining_patterns')\
            .select("*")\
            .gte('total_bots_evaluados', min_evaluations)\
            .order('indice_exito', desc=True)
        
        if activo:
            query = query.eq('activo', activo)
        if temporalidad:
            query = query.eq('temporalidad', temporalidad)
        if direccion:
            query = query.eq('direccion', direccion)
        
        result = query.execute()
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching global patterns: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/insights", response_model=List[Dict[str, Any]])
async def get_global_insights(tipo: Optional[str] = None):
    """
    Obtener insights y recomendaciones globales
    """
    try:
        query = supabase.table('global_insights')\
            .select("*")\
            .eq('activo', True)\
            .order('prioridad', desc=False)\
            .order('confianza', desc=True)
        
        if tipo:
            query = query.eq('tipo', tipo)
        
        result = query.execute()
        return result.data
        
    except Exception as e:
        logger.error(f"Error fetching insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# ENDPOINTS DE UTILIDAD
# ============================================

@app.get("/api/next-magic-number")
async def get_next_magic_number(user_id: str = Depends(get_current_user)):
    """
    Obtener el próximo magic number disponible para el usuario
    """
    try:
        result = supabase.rpc('get_next_magic_number', {'user_uuid': user_id}).execute()
        magic_number = result.data if result.data else 1000
        
        return {"next_magic_number": magic_number}
        
    except Exception as e:
        logger.error(f"Error getting next magic number: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/activos-disponibles")
async def get_available_assets():
    """
    Obtener lista de activos disponibles basada en configuraciones existentes
    """
    try:
        result = supabase.table('bot_configurations')\
            .select("activo")\
            .execute()
        
        # Extraer activos únicos
        activos = list(set([row['activo'] for row in result.data])) if result.data else []
        
        # Agregar activos comunes si no existen
        activos_comunes = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'USDCAD', 'USDCHF', 'NZDUSD', 'GOLD', 'SILVER']
        for activo in activos_comunes:
            if activo not in activos:
                activos.append(activo)
        
        return {"activos_disponibles": sorted(activos)}
        
    except Exception as e:
        logger.error(f"Error fetching available assets: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ============================================
# MANEJO DE ERRORES GLOBALES
# ============================================

@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    logger.error(f"Global exception: {exc}")
    return {
        "error": "Internal server error",
        "message": "Something went wrong. Please try again later.",
        "timestamp": datetime.now().isoformat()
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
