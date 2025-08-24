from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from mangum import Mangum
import os
from datetime import datetime

# FastAPI app
app = FastAPI(
    title="Mining Intelligence API",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Endpoints básicos
@app.get("/")
async def root():
    return {
        "message": "🤖 Mining Intelligence API funcionando!",
        "status": "operational",
        "timestamp": datetime.now().isoformat()
    }

@app.get("/health")
async def health():
    return {"status": "healthy"}

@app.get("/test")  
async def test():
    return {"message": "Test endpoint working", "success": True}

# CRÍTICO: Handler para Vercel serverless
handler = Mangum(app, lifespan="off")

# Para desarrollo local
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
