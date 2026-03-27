import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Home from './components/Home';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import AdminWelcome from './components/AdminWelcome';
import CustomerWelcome from './components/CustomerWelcome';
import DashboardHome from './components/dashboard/DashboardHome';
import Stock from './components/dashboard/Stock';
import Portfolio from './components/dashboard/Portfolio';
import Forecast from './components/dashboard/Forecast';
import SentimentAnalysis from './components/dashboard/SentimentAnalysis';
import Recommend from './components/dashboard/Recommend';
import Profile from './components/dashboard/Profile';
import Settings from './components/dashboard/Settings';
import MyCollections from './components/dashboard/MyCollections';
import MyPurchases from './components/dashboard/MyPurchases';
import OrderHistory from './components/dashboard/OrderHistory';
import MyPortfolioMsg from './components/dashboard/MyPortfolioMsg';
import PortfolioDetail from './components/dashboard/PortfolioDetail';
import ErrorBoundary from './components/ErrorBoundary';
import Chatbot from './components/Chatbot';

function App() {
  return (
    <Router>
      <div className="min-h-screen bg-gray-100 font-sans">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/register" element={<Register />} />
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/admin-welcome" element={<AdminWelcome />} />
          <Route path="/customer-welcome" element={<CustomerWelcome />}>
            <Route index element={<DashboardHome />} />
            <Route path="stock" element={<ErrorBoundary><Stock /></ErrorBoundary>} />
            <Route path="portfolio" element={<Portfolio />} />
            <Route path="forecast" element={<Forecast />} />
            <Route path="sentiment" element={<SentimentAnalysis />} />
            <Route path="recommend" element={<Recommend />} />
            <Route path="profile" element={<Profile />} />
            <Route path="settings" element={<Settings />} />
            <Route path="collections" element={<MyCollections />} />
            <Route path="purchases" element={<MyPurchases />} />
            <Route path="orders" element={<OrderHistory />} />
            <Route path="my-portfolio-msg" element={<MyPortfolioMsg />} />
            <Route path="portfolio-detail/:name" element={<PortfolioDetail />} />
          </Route>
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
        
        {/* Persistent Chatbot */}
        <Chatbot />
      </div>
    </Router>
  );
}

export default App;
