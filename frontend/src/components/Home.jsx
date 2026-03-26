import React from 'react';
import { useNavigate } from 'react-router-dom';
import { TrendingUp } from 'lucide-react';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-primary-dark flex flex-col items-center justify-center text-white relative overflow-hidden">
      {/* Background decoration */}
      {/* Background image covering full screen */}
      <div className="absolute inset-0 w-full h-full group">
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-[1]"></div>
        <img
          src="/bull_hero_8k.png"
          alt="Futuristic Bull Background"
          className="w-full h-full object-cover transition-transform duration-[10s] hover:scale-105"
        />
        {/* Animated Glowing Effects */}
        <div className="absolute inset-0 z-[2] overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-light-accent/10 rounded-full blur-[120px] animate-pulse duration-[4000ms]"></div>
          <div className="absolute bottom-1/4 right-1/4 w-[600px] h-[600px] bg-purple-500/5 rounded-full blur-[150px] animate-pulse duration-[6000ms] delay-1000"></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-gradient-to-tr from-light-accent/5 via-transparent to-purple-500/5 mix-blend-overlay animate-pulse duration-[8000ms]"></div>
        </div>
      </div>

      {/* Main Content Floated to Bottom Left Corner */}
      <div className="z-10 absolute bottom-16 left-12 text-left max-w-sm px-4">
        <div className="flex items-center mb-5 drop-shadow-xl">
          <TrendingUp size={40} className="text-light-accent mr-3" />
          <h1 className="text-4xl font-extrabold tracking-tighter text-white">
            Stock<span className="text-light-accent">Verse</span>
          </h1>
        </div>
        <p className="text-sm text-gray-200 font-medium drop-shadow-md leading-relaxed">
          Navigate the financial universe with precision. Real-time insights, advanced tracking, and professional tools for everyone.
        </p>

        {/* Actions Button */}
        <button
          onClick={() => navigate('/register')}
          className="mt-6 glass-button py-2.5 px-8 text-base font-extrabold tracking-wide uppercase hover:glass-button-active shadow-2xl w-full sm:w-auto"
        >
          Get Started
        </button>
      </div>

      {/* Footer Branding */}
      <div className="absolute bottom-8 text-gray-500 text-sm">
        © 2026 StockVerse. All rights reserved.
      </div>
    </div>
  );
};

export default Home;
