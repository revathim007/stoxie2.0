# 🚀 Stoxie 2.0 – Smart Stock Analysis & Portfolio Platform

Stoxie 2.0 is a full-stack stock analysis web application that enables users to explore financial markets, analyze stocks, manage their portfolios, and interact with an AI-powered assistant for smarter investment decisions.

The platform is designed with a modern UI and integrates real-time data, analytics, and intelligent insights to simplify stock market understanding for users.

---

## 👩‍💻 Authors
- Revathi Meenakshinathan  
- Maithili Kadam

---

## 🌟 Key Features

### 🔐 Authentication System
- Secure user registration and login  
- Session-based authentication  
- Personalized user experience  

---

### 📊 Stock Analysis
- Search stocks across:
  - Indian Market (e.g., RELIANCE.NS)
  - US Market (e.g., AAPL)
  - Cryptocurrency (e.g., BTC)
- Detailed stock insights:
  - Current Price  
  - P/E Ratio  
  - 52-week High/Low  
  - Moving Averages  
- Visual charts for better understanding  

---

### 💼 Portfolio Management
- Add stocks with quantity  
- Track total investment vs current value  
- Monitor profit and loss  
- Remove or update portfolio items  
- Helps users manage investments in one place  

---

### 🤖 AI Chatbot – Stoxie Assistant
- Smart assistant integrated into the platform  
- Users can ask questions like:
  - “Which stock should I invest in?”  
  - “Analyze this stock”  
- Provides intelligent, AI-driven responses  
- Enhances decision-making experience  

---

### 📈 Dashboard
- Central hub of the application  
- Displays:
  - Stock trends  
  - Key insights  
  - Quick navigation to features  
- Clean and user-friendly interface  

---
User → Register → Login → Dashboard → Search & Analyze Stocks → Add to Portfolio → Track Performance → Interact with Chatbot


---

## 📄 Pages Overview

### 🔐 Authentication Pages
- **Register Page**
  - Allows new users to create an account  
- **Login Page**
  - Enables existing users to access the platform  

---

### 🏠 Dashboard
- Overview of market insights  
- Displays charts and analytics  
- Acts as entry point for all modules  

---

### 📊 Stock Page
- Search and explore stocks  
- Displays:
  - Price details  
  - Financial ratios  
  - Historical trends  

---

### 💼 Portfolio Page
- Add and manage stocks  
- View:
  - Investment value  
  - Profit/Loss  
- Modify or delete entries  

---

### 🤖 Chatbot Interface
- Interactive chat window  
- Helps users with stock-related queries  
- Provides suggestions and explanations  

---

## 🛠️ Tech Stack

### Frontend
- React (Vite)
- Chart.js (for visualization)
- Axios (API calls)

### Backend
- Django
- Django REST Framework (APIs)

### Database
- SQLite (default)

### APIs & Tools
- yfinance (stock data)
- Groq / LLM APIs (chatbot intelligence)

---

## ⚙️ Installation & Setup

### 1️⃣ Clone Repository
```bash
git clone https://github.com/revathim007/stoxie2.0.git
cd stoxie2.0

cd backend
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

cd frontend
npm install
npm run dev

## 🧭 Application Flow
