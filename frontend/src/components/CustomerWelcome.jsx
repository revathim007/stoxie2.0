import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  TrendingUp, 
  User as UserIcon, 
  LogOut, 
  LayoutDashboard, 
  Briefcase, 
  LineChart, 
  BarChart3,
  Sparkles
} from 'lucide-react';

const CustomerWelcome = () => {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const savedUser = JSON.parse(localStorage.getItem('user'));
    if (!savedUser || savedUser.role !== 'customer') {
      navigate('/login');
    } else {
      setUser(savedUser);
    }
  }, [navigate]);

  const handleLogout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  const navItems = [
    { name: 'Dashboard', path: '/customer-welcome', icon: <LayoutDashboard size={20} /> },
    { name: 'Stock', path: '/customer-welcome/stock', icon: <TrendingUp size={20} /> },
    { name: 'Portfolios', path: '/customer-welcome/my-portfolio-msg', icon: <Briefcase size={20} /> },
    { name: 'Forecast', path: '/customer-welcome/forecast', icon: <LineChart size={20} /> },
    { name: 'Sentiment Analysis', path: '/customer-welcome/sentiment', icon: <BarChart3 size={20} /> },
  ];

  const activePath = location.pathname;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-primary-dark flex flex-col font-sans text-white">
      {/* Top Navbar */}
      <nav className="glass-navbar px-6 py-4 flex justify-between items-center sticky top-0 z-30 shadow-lg">
        {/* Top Left Branding & Welcome */}
        <div className="flex flex-col">
          <div className="flex items-center">
            <TrendingUp className="text-light-accent mr-2" size={28} />
            <h1 className="text-2xl font-black tracking-tight text-white leading-none">
              Stock<span className="text-light-accent">Verse</span>
            </h1>
          </div>
          <div className="ml-9 mt-0.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em]">
              Welcome, <span className="text-light-accent font-black">{user.username}</span>
            </p>
          </div>
        </div>

        {/* Center Navigation Links */}
        <div className="hidden lg:flex items-center bg-secondary-dark/40 backdrop-blur-md p-1 rounded-full border border-white/5">
          {navItems.map((item) => (
            <button
              key={item.name}
              onClick={() => navigate(item.path)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-full transition-all duration-300 font-bold text-xs ${
                activePath === item.path 
                  ? 'glass-button-active text-primary-dark shadow-lg' 
                  : 'text-gray-300 hover:text-white hover:bg-white/5'
              }`}
            >
              {item.icon}
              <span>{item.name}</span>
            </button>
          ))}
          <button
            onClick={() => navigate('/customer-welcome/portfolio')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all duration-300 font-black text-sm ml-2 ${
              activePath === '/customer-welcome/portfolio'
                ? 'bg-emerald-400 text-primary-dark shadow-[0_0_20px_rgba(52,211,153,0.4)] scale-105'
                : 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 hover:scale-105 border border-emerald-500/20'
            }`}
          >
            <Briefcase size={20} />
            <span>My Portfolios</span>
          </button>
          <button
            onClick={() => navigate('/customer-welcome/recommend')}
            className={`flex items-center space-x-2 px-6 py-2.5 rounded-full transition-all duration-300 font-black text-sm ml-2 ${
              activePath === '/customer-welcome/recommend'
                ? 'bg-cyan-400 text-primary-dark shadow-[0_0_20px_rgba(34,211,238,0.4)] scale-105'
                : 'bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20 hover:scale-105 border border-cyan-500/20'
            }`}
          >
            <Sparkles size={20} className="animate-pulse" />
            <span>Recommend</span>
          </button>
        </div>

        {/* Top Right Profile Section */}
        <div className="flex items-center space-x-6">
          <div 
            onClick={() => navigate('/customer-welcome/profile')}
            className="flex items-center space-x-3 bg-secondary-dark/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/5 cursor-pointer hover:bg-secondary-dark/80 transition-all group"
          >
            <span className="text-gray-200 font-bold group-hover:text-light-accent transition-colors">{user.username}</span>
            <div className="bg-light-accent p-1.5 rounded-full text-primary-dark group-hover:scale-110 transition-transform">
              <UserIcon size={18} />
            </div>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center space-x-2 bg-red-900/20 text-red-400 hover:bg-red-600 hover:text-white px-4 py-2 rounded-xl transition-all duration-200 font-bold border border-red-500/20"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </nav>

      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Main Dashboard Content */}
        <main className="flex-1 overflow-y-auto p-8 bg-primary-dark relative">
          {/* Background decoration with Mesh Gradient & Grid overlay */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
            <div className="absolute -top-40 -right-40 w-[600px] h-[600px] bg-indigo-500/15 rounded-full blur-[120px] animate-pulse"></div>
            <div className="absolute -bottom-40 -left-40 w-[600px] h-[600px] bg-fuchsia-500/15 rounded-full blur-[120px] animate-pulse delay-1000"></div>
            <div className="absolute top-[30%] left-[20%] w-[350px] h-[350px] bg-cyan-500/10 rounded-full blur-[90px] animate-pulse delay-500"></div>

            <div 
              className="absolute inset-0 opacity-[0.12]" 
              style={{
                backgroundImage: 'radial-gradient(circle at center, rgba(255,255,255,0.3) 1px, transparent 1.5px)',
                backgroundSize: '24px 24px'
              }}
            ></div>
            
            <div className="absolute top-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
            <div className="absolute bottom-1/4 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-white/5 to-transparent"></div>
          </div>

          <div className="max-w-6xl mx-auto relative z-10">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CustomerWelcome;
