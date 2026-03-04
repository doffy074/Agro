"""
Groq-powered chatbot for PlantWise AI.
Provides agricultural advice, plant disease Q&A, and general farming guidance.
"""
import os
import asyncio
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv

load_dotenv(os.path.join(os.path.dirname(__file__), "..", ".env"))


SYSTEM_PROMPT = """You are PlantWise AI Assistant — a friendly, knowledgeable agricultural expert chatbot.

Your expertise covers:
- Plant disease identification, symptoms, and causes
- Organic and chemical treatment recommendations
- Crop management and best farming practices
- Soil health, irrigation, and fertilization
- Pest control and integrated pest management (IPM)
- Seasonal planting guides and crop rotation

Guidelines:
- Give concise, practical advice suitable for smallholder farmers
- When discussing treatments, mention both organic and chemical options
- Always recommend consulting a local agricultural extension officer for severe cases
- Be friendly and encouraging — farming is hard work!
- If a question is outside agriculture, politely redirect to plant/farming topics
- Use simple language; avoid overly technical jargon unless asked
- Format responses with bullet points or numbered lists when listing multiple items
- Keep responses under 300 words unless the user asks for detailed information
"""


def _get_groq_client():
    """Initialize the Groq client. Returns None if unavailable."""
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        from groq import Groq  # type: ignore
        return Groq(api_key=api_key)
    except ImportError:
        return None


async def chat(
    messages: List[Dict[str, str]],
    user_name: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Send a conversation to Groq and return the assistant's reply.

    Parameters
    ----------
    messages : list of {"role": "user"|"assistant", "content": str}
        The conversation history (latest message last).
    user_name : optional display name for personalisation.

    Returns
    -------
    dict with keys: reply (str), success (bool), error (str|None)
    """
    client = _get_groq_client()
    if client is None:
        return {
            "reply": "I'm sorry, the AI assistant is currently unavailable. Please try again later or contact support.",
            "success": False,
            "error": "GROQ_API_KEY not configured or groq package missing",
        }

    # Build the message list for the API
    system = SYSTEM_PROMPT
    if user_name:
        system += f"\nThe farmer's name is {user_name}. Address them by name occasionally."

    api_messages = [{"role": "system", "content": system}]

    # Include up to the last 20 messages for context window management
    recent = messages[-20:] if len(messages) > 20 else messages
    for msg in recent:
        role = msg.get("role", "user")
        if role not in ("user", "assistant"):
            role = "user"
        api_messages.append({"role": role, "content": msg["content"]})

    try:
        response = await asyncio.to_thread(
            client.chat.completions.create,
            model="llama-3.3-70b-versatile",
            messages=api_messages,
            temperature=0.6,
            max_tokens=1024,
        )

        reply = response.choices[0].message.content.strip()
        return {"reply": reply, "success": True, "error": None}

    except Exception as e:
        print(f"⚠️ Groq chatbot error: {e}")
        return {
            "reply": "I'm having trouble connecting right now. Please try again in a moment.",
            "success": False,
            "error": str(e),
        }
