"""FastAPI app factory — wires routes, middleware, and CORS."""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .routes import auth, contracts, health


def create_app() -> FastAPI:
    app = FastAPI(
        title="Rostr Contracts API",
        version="1.0.0",
        description="AI-powered contract agent backend for the music industry",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(health.router, tags=["health"])
    app.include_router(auth.router, prefix="/auth", tags=["auth"])
    app.include_router(contracts.router, prefix="/contracts", tags=["contracts"])

    return app
