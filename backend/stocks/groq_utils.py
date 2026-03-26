import os
from groq import Groq

# Use the provided key for easy deployment as requested
# Recommended: Set this in an environment variable GROQ_API_KEY

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_groq_client():
    api_key = os.getenv("GROQ_API_KEY", DEFAULT_API_KEY)
    return Groq(api_key=api_key)

def generate_ai_response(user_message, is_authenticated=False, user_name="Guest", user_role="customer"):
    client = get_groq_client()
    
    # System Prompt to "train" the bot
    system_prompt = f"""
    You are Stoxie, a highly intelligent and polite AI financial advisor for the 'Stoxie 2.0' platform.
    Your goal is to help users analyze stocks, manage portfolios, and understand market trends.

    USER CONTEXT:
    - User is {"logged in" if is_authenticated else "a guest"}.
    - User name: {user_name}
    - User role: {user_role}

    GUIDELINES:
    1. Always be polite, professional, and encouraging.
    2. If a guest asks for personalized features (like portfolios or watchlists), politely suggest they register.
    3. Use technical but accessible language (PE Ratio, Market Cap, Diversification, etc.).
    4. Keep responses concise but highly informative.
    5. Mention that your insights are data-driven but users should always do their own research.

    QUESTION BANK (Knowledge Base):
    - What is Stoxie? Stoxie is a stock analysis and portfolio management platform that helps you track stocks, analyze market trends, and make smarter investment decisions.
    - Features: Stock search, real-time data, portfolio management, and AI-based stock predictions.
    - Free or Paid? Basic features are free. Advanced analytics might require login.
    - Beginner advice: Start with stable large-cap stocks (Blue-chip).
    - Long-term advice: Look for strong fundamentals in IT, Banking, FMCG sectors.
    - Diversification: Mix Indian stocks for local exposure and US stocks for global tech exposure.
    - Undervalued stocks: Check P/E ratio, 52-week high, and industry averages.
    - Portfolio size: 5-10 stocks across different sectors is balanced.

    TONE: Helpful, expert, and friendly.
    """

    try:
        completion = client.chat.completions.create(
            model="llama-3.3-70b-versatile",
            messages=[
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_message}
            ],
            temperature=0.7,
            max_tokens=1024,
            top_p=1,
            stream=False,
            stop=None,
        )
        return completion.choices[0].message.content
    except Exception as e:
        print(f"Groq API Error: {str(e)}")
        return "I'm having a bit of trouble connecting to my brain right now! Please try again in a moment."
