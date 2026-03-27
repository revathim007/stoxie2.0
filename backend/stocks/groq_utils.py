import os
from groq import Groq

# Use the provided key for easy deployment as requested
# Recommended: Set this in an environment variable GROQ_API_KEY

GROQ_API_KEY = os.getenv("GROQ_API_KEY")

def get_groq_client():
    return Groq(api_key=GROQ_API_KEY)

def generate_ai_response(user_message, is_authenticated=False, user_name="Guest", user_role="customer", stock_data=None):
    client = get_groq_client()
    
    # Format stock data for the prompt if available
    stock_context = ""
    if stock_data:
        stock_context = f"\nREAL-TIME STOCK DATA:\n- Symbol: {stock_data.get('symbol')}\n- Name: {stock_data.get('name')}\n- Current Price: {stock_data.get('currency', '₹')}{stock_data.get('price')}\n- Sector: {stock_data.get('sector')}\n"

    # System Prompt to "train" the bot
    system_prompt = f"""
    You are Stoxie, a highly intelligent and polite AI financial advisor for the 'Stoxie 2.0' platform.
    Your goal is to help users analyze stocks, manage portfolios, and understand market trends.

    USER CONTEXT:
    - User is {"logged in" if is_authenticated else "a guest"}.
    - User name: {user_name}
    - User role: {user_role}
    {stock_context}

    GUIDELINES:
    1. Always be extremely polite, professional, and friendly. Use words like "certainly", "absolutely", "happy to help".
    2. Keep responses very short and concise (maximum 2-3 sentences).
    3. Structure your response in a single, well-organized paragraph that is easy on the eyes. Avoid long blocks of text.
    4. If the user asks for a stock price and stock data is provided in context, explicitly mention the current price.
    5. If a guest asks for personalized features (like portfolios or watchlists), politely suggest they register.
    6. Use technical but accessible language.
    7. Mention that your insights are data-driven but users should always do their own research.

    RESPONSE FORMAT:
    - Single, short paragraph.
    - Max 40-50 words.
    - Polite, direct, and helpful.

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
