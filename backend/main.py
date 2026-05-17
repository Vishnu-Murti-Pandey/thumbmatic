import logging
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager

from database import create_tables
from routes import router


# Why asynccontextmanager? It handles: startup, cleanup, async resources
@asynccontextmanager
# What Is Lifespan? Runs code: when app starts, when app shuts down
async def lifespan(app: FastAPI):
    create_tables()
    yield

app = FastAPI(
    title="Youtube Thumbnail Generator API",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:5174", "https://thumbmatic-ai.vercel.app"],
    allow_credentials=True, 
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)
logging.basicConfig(level=logging.INFO)