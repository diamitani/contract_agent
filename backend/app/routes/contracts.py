"""Contracts routes — generate, templates, save, chat."""

from typing import Any
from fastapi import APIRouter, HTTPException, Depends
from .. import contracts as contracts_agent
from ..models import (
    ContractGenerateRequest,
    ContractGenerateResponse,
    ContractTemplateResponse,
    SaveContractRequest,
    SaveContractResponse,
    AgentChatRequest,
    AgentChatResponse,
)
from .auth import get_current_user
import uuid

router = APIRouter()


# Pre-registered templates (matches frontend contractTemplates)
TEMPLATES = {
    "influencer-agreement": {"name": "Artist Influencer Agreement", "category": "Marketing", "fields": 16},
    "production-agreement": {"name": "Music Production Agreement", "category": "Production", "fields": 16},
    "artist-management-agreement": {"name": "Artist Management Agreement", "category": "Management", "fields": 12},
    "artist-label-agreement": {"name": "Artist Recording Contract", "category": "Recording", "fields": 12},
    "sponsorship-agreement": {"name": "Sponsorship Agreement", "category": "Sponsorship", "fields": 14},
    "band-booking-agreement": {"name": "Band Booking Agreement", "category": "Performance", "fields": 13},
    "artist-venue-agreement": {"name": "Artist/Venue Agreement", "category": "Performance", "fields": 14},
    "dj-booking-agreement": {"name": "DJ Booking Agreement", "category": "Performance", "fields": 17},
    "artist-agent-agreement": {"name": "Artist-Agent Agreement", "category": "Representation", "fields": 11},
    "licensing-agreement": {"name": "Music Licensing Agreement", "category": "Licensing", "fields": 13},
    "collaboration-agreement": {"name": "Artist Collaboration Agreement", "category": "Collaboration", "fields": 12},
    "work-for-hire": {"name": "Work for Hire Agreement", "category": "Production", "fields": 12},
    "producer-talent-agreement": {"name": "Master Producer-Talent Agreement", "category": "Production", "fields": 16},
    "studio-time": {"name": "Studio Time Contract", "category": "Production", "fields": 17},
}


@router.get("/templates")
def list_templates() -> list[ContractTemplateResponse]:
    """List all available contract templates."""
    return [
        ContractTemplateResponse(
            slug=slug,
            name=t["name"],
            category=t["category"],
            description=f"Industry-standard {t['category'].lower()} agreement",
            field_count=t["fields"],
        )
        for slug, t in TEMPLATES.items()
    ]


@router.post("/generate", response_model=ContractGenerateResponse)
def generate(body: ContractGenerateRequest, user: dict = Depends(get_current_user)):
    """Generate a contract using AI."""
    if body.template_slug not in TEMPLATES:
        raise HTTPException(status_code=404, detail=f"Template '{body.template_slug}' not found")

    result = contracts_agent.generate_contract(
        template_slug=body.template_slug,
        fields=body.fields,
        chat_input=body.chat_input,
    )

    contract_id = str(uuid.uuid4())[:12]
    template = TEMPLATES[body.template_slug]

    return ContractGenerateResponse(
        contract_id=contract_id,
        title=template["name"],
        content=result["content"],
        fields_used=list(body.fields.keys()),
    )


@router.post("/save", response_model=SaveContractResponse)
def save_contract(body: SaveContractRequest, user: dict = Depends(get_current_user)):
    """Save a generated contract."""
    contract_id = str(uuid.uuid4())[:12]
    # In production: save to RDS PostgreSQL
    return SaveContractResponse(
        contract_id=contract_id,
        message="Contract saved successfully",
    )


@router.post("/chat", response_model=AgentChatResponse)
def agent_chat(body: AgentChatRequest, user: dict = Depends(get_current_user)):
    """Chat with the AI contract agent."""
    result = contracts_agent.chat(body.message, body.context)
    return AgentChatResponse(
        reply=result["reply"],
        contract_ready=False,
    )
