"""Pydantic request/response models for the Contracts API."""

from __future__ import annotations

from typing import Any, Optional
from pydantic import BaseModel, EmailStr


# ─── Auth ────────────────────────────────────────────

class SignUpRequest(BaseModel):
    email: str
    password: str
    name: str
    stage_name: Optional[str] = None
    artist_type: Optional[str] = None
    genre: Optional[str] = None
    goals: list[str] = []


class SignUpResponse(BaseModel):
    user_id: str
    email: str
    message: str


class LoginRequest(BaseModel):
    email: str
    password: str


class LoginResponse(BaseModel):
    access_token: str
    refresh_token: str
    expires_in: int
    user_id: str


# ─── Contracts ───────────────────────────────────────

class ContractGenerateRequest(BaseModel):
    template_slug: str
    fields: dict[str, Any] = {}
    chat_input: Optional[str] = None
    agent_type: str = "contracts"


class ContractGenerateResponse(BaseModel):
    contract_id: str
    title: str
    content: str
    pdf_url: Optional[str] = None
    fields_used: list[str]


class ContractTemplateResponse(BaseModel):
    slug: str
    name: str
    category: str
    description: str
    field_count: int


class SaveContractRequest(BaseModel):
    title: str
    template_slug: str
    fields: dict[str, Any]
    content: str


class SaveContractResponse(BaseModel):
    contract_id: str
    message: str


# ─── Agent Chat ──────────────────────────────────────

class AgentChatRequest(BaseModel):
    message: str
    agent_type: str = "contracts"
    context: Optional[dict[str, Any]] = None


class AgentChatResponse(BaseModel):
    reply: str
    contract_ready: bool = False
    suggested_template: Optional[str] = None
    extracted_fields: dict[str, Any] = {}
