"""
Groq-powered treatment recommendation generator for plant diseases.
Replaces the hardcoded DISEASE_TREATMENTS dictionary with real AI-generated advice.
"""
import os
import json
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))

# Hardcoded fallback treatments (used when Groq API is unavailable)
FALLBACK_TREATMENTS = {
    "diseased": {
        "organic": [
            "Apply neem oil spray (2-3ml per liter of water)",
            "Use compost tea as foliar spray weekly",
            "Remove and destroy infected plant parts immediately",
            "Improve air circulation around plants",
        ],
        "chemical": [
            "Consult local agricultural extension for specific fungicide recommendations",
            "Apply broad-spectrum fungicide at first sign of symptoms",
            "Use copper-based fungicide as per label instructions",
        ],
        "preventive": [
            "Practice crop rotation every 2-3 years",
            "Maintain proper plant spacing for air circulation",
            "Water at the base of plants to keep foliage dry",
            "Monitor plants regularly for early signs of infection",
        ],
    },
    "healthy": {
        "organic": [
            "Continue current care practices",
            "Apply organic compost for nutrition",
            "Use neem oil as preventive spray bi-weekly",
        ],
        "chemical": ["No chemical treatment needed for healthy plants"],
        "preventive": [
            "Maintain regular watering schedule",
            "Monitor for early signs of disease",
            "Ensure proper nutrition and soil health",
            "Practice crop rotation each season",
        ],
    },
}


def get_groq_client():
    """Initialize the Groq client. Returns None if API key is missing."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("⚠️ GROQ_API_KEY not set. Using fallback treatments.")
        return None
    try:
        from groq import Groq
        return Groq(api_key=api_key)
    except ImportError:
        print("⚠️ groq package not installed. Using fallback treatments.")
        return None


async def generate_treatments(
    crop_name: str,
    disease_name: str,
    status: str,
    confidence: float,
) -> Dict[str, Any]:
    """
    Generate treatment recommendations using Groq LLM.
    Falls back to hardcoded treatments if the API call fails.
    """
    if status == "healthy":
        # For healthy plants, use a simpler prompt
        return await _generate_healthy_treatments(crop_name)

    return await _generate_disease_treatments(crop_name, disease_name, confidence)


async def _generate_disease_treatments(
    crop_name: str, disease_name: str, confidence: float
) -> Dict[str, Any]:
    """Generate treatments for a diseased plant via Groq."""
    client = get_groq_client()
    if not client:
        return FALLBACK_TREATMENTS["diseased"]

    prompt = f"""You are an expert agricultural scientist and plant pathologist. 
A farmer's {crop_name} plant has been diagnosed with **{disease_name}** (AI confidence: {confidence:.1f}%).

Provide practical, actionable treatment recommendations in exactly this JSON format:
{{
  "organic": ["treatment 1", "treatment 2", "treatment 3", "treatment 4"],
  "chemical": ["treatment 1", "treatment 2", "treatment 3"],
  "preventive": ["measure 1", "measure 2", "measure 3", "measure 4"]
}}

Rules:
- "organic" must have 3-5 specific organic/natural treatment steps
- "chemical" must have 2-4 specific chemical treatments with product names and dosage where applicable
- "preventive" must have 3-5 preventive measures to avoid future outbreaks
- Each item should be a concise, actionable sentence (max 15 words)
- Use treatments that are widely available and appropriate for smallholder farmers
- Be specific (e.g., "Apply neem oil spray 2-3ml per liter weekly" not just "Use neem oil")

Return ONLY the JSON object, no other text."""

    try:
        import asyncio
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a plant disease treatment expert. Always respond with valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=500,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content.strip()
        treatments = json.loads(content)

        # Validate structure
        if _validate_treatments(treatments):
            print(f"✅ Groq generated treatments for {crop_name} - {disease_name}")
            return treatments
        else:
            print(f"⚠️ Groq returned invalid treatment structure. Using fallback.")
            return FALLBACK_TREATMENTS["diseased"]

    except Exception as e:
        print(f"⚠️ Groq API error: {e}. Using fallback treatments.")
        return FALLBACK_TREATMENTS["diseased"]


async def _generate_healthy_treatments(crop_name: str) -> Dict[str, Any]:
    """Generate preventive care for a healthy plant via Groq."""
    client = get_groq_client()
    if not client:
        return FALLBACK_TREATMENTS["healthy"]

    prompt = f"""You are an expert agricultural scientist. 
A farmer's {crop_name} plant has been diagnosed as **healthy**.

Provide preventive care recommendations in exactly this JSON format:
{{
  "organic": ["care tip 1", "care tip 2", "care tip 3"],
  "chemical": ["No chemical treatment needed for healthy plants"],
  "preventive": ["measure 1", "measure 2", "measure 3", "measure 4"]
}}

Rules:
- "organic" must have 2-3 organic care and nutrition tips specific to {crop_name}
- "chemical" should be ["No chemical treatment needed for healthy plants"]
- "preventive" must have 3-5 specific preventive measures for {crop_name}
- Each item should be a concise, actionable sentence (max 15 words)
- Be specific to {crop_name} growing conditions

Return ONLY the JSON object, no other text."""

    try:
        import asyncio
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model="llama-3.3-70b-versatile",
            messages=[
                {
                    "role": "system",
                    "content": "You are a plant care expert. Always respond with valid JSON only.",
                },
                {"role": "user", "content": prompt},
            ],
            temperature=0.3,
            max_tokens=300,
            response_format={"type": "json_object"},
        )

        content = response.choices[0].message.content.strip()
        treatments = json.loads(content)

        if _validate_treatments(treatments):
            print(f"✅ Groq generated healthy care tips for {crop_name}")
            return treatments
        else:
            print(f"⚠️ Groq returned invalid structure for healthy plant. Using fallback.")
            return FALLBACK_TREATMENTS["healthy"]

    except Exception as e:
        print(f"⚠️ Groq API error for healthy plant: {e}. Using fallback.")
        return FALLBACK_TREATMENTS["healthy"]


def _validate_treatments(treatments: dict) -> bool:
    """Validate that the treatments dict has the correct structure."""
    required_keys = {"organic", "chemical", "preventive"}
    if not isinstance(treatments, dict):
        return False
    if not required_keys.issubset(treatments.keys()):
        return False
    for key in required_keys:
        if not isinstance(treatments[key], list):
            return False
        if len(treatments[key]) == 0:
            return False
        if not all(isinstance(item, str) for item in treatments[key]):
            return False
    return True
