import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Sparkles, TrendingUp, TrendingDown, ShieldCheck, Zap, BrainCircuit, User, Target, CheckCircle2, RefreshCw, ArrowUpRight, ArrowDownRight, Info, ChevronUp, ChevronDown, Filter } from 'lucide-react';

const Recommend = () => {
  const navigate = useNavigate();
  const [aiProfile, setAiProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sortConfig, setSortConfig] = useState({ key: 'change_percent', direction: 'desc' });
  const [timeframe, setTimeframe] = useState('1mo'); // '1mo', '3mo', '6mo', '1yr'

  const fetchAIProfile = async () => {
    setLoading(true);
    setError(null);
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) {
        setError('User data not found. Please log in again.');
        return;
      }
      
      const response = await axios.get(`http://localhost:8000/api/stocks/recommendation-analysis/${userData.id}/`);
      setAiProfile(response.data);
    } catch (error) {
      console.error('Error fetching AI profile:', error);
      setError('Failed to load personalized strategy. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAIProfile();
  }, []);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedStocks = (stocks) => {
    if (!sortConfig.key) return stocks;

    return [...stocks].sort((a, b) => {
      let aValue, bValue;

      // Handle nested prediction sorting with defensive checks
      if (sortConfig.key === 'prediction_price') {
        aValue = a.predictions?.[timeframe]?.price || 0;
        bValue = b.predictions?.[timeframe]?.price || 0;
      } else if (sortConfig.key === 'change_percent') {
        aValue = a.predictions?.[timeframe]?.change || 0;
        bValue = b.predictions?.[timeframe]?.change || 0;
      } else {
        aValue = a[sortConfig.key] || 0;
        bValue = b[sortConfig.key] || 0;
      }

      if (aValue < bValue) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aValue > bValue) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  };

  const recommendations = [
    { 
      symbol: 'AAPL', 
      name: 'Apple Inc.', 
      reason: 'Strong quarterly earnings and new product announcements.', 
      confidence: 'High', 
      type: 'Growth' 
    },
    { 
      symbol: 'MSFT', 
      name: 'Microsoft Corporation', 
      reason: 'Expansion in AI and cloud infrastructure.', 
      confidence: 'Very High', 
      type: 'Stability' 
    },
    { 
      symbol: 'TSLA', 
      name: 'Tesla, Inc.', 
      reason: 'Increased production capacity and market expansion.', 
      confidence: 'Medium', 
      type: 'High Risk' 
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-6">
        <div className="relative">
          <div className="w-20 h-20 border-4 border-cyan-500/20 rounded-full animate-spin border-t-cyan-400"></div>
          <Sparkles className="absolute inset-0 m-auto text-cyan-400 animate-pulse" size={32} />
        </div>
        <div className="text-center">
          <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Analyzing Strategy</h3>
          <p className="text-sm text-gray-500 font-bold uppercase tracking-widest animate-pulse">Syncing with AI Engine...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 p-12 glass-panel text-center">
        <div className="bg-red-500/10 p-6 rounded-3xl border border-red-500/20">
          <Info size={48} className="text-red-400" />
        </div>
        <div className="max-w-md">
          <h3 className="text-2xl font-black text-white mb-4">{error}</h3>
          <button 
            onClick={() => fetchAIProfile()}
            className="glass-button bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 px-8 py-4 rounded-2xl text-xs font-black uppercase tracking-[0.2em] hover:bg-cyan-500/30 active:scale-95 transition-all"
          >
            <RefreshCw size={16} className="mr-3" />
            Try Re-Syncing
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
      <header className="mb-10 border-b border-white/5 pb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Personalized Strategy</h1>
        <p className="text-gray-400 mt-2 font-medium">
          {aiProfile ? aiProfile.personality_statement : "Analyzing your profile to provide custom investment suggestions..."}
        </p>
      </header>

      {/* AI Investor Profile Section */}
      {!loading && aiProfile && (
        <div className="glass-panel p-10 mb-12 border-cyan-500/20 bg-gradient-to-br from-cyan-500/5 to-transparent relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
            <Sparkles size={120} className="text-cyan-400" />
          </div>
          
          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-3 gap-12 items-center">
            <div className="lg:col-span-2">
              <div className="flex items-center space-x-4 mb-6">
                <div className="bg-cyan-500 p-3 rounded-2xl shadow-[0_0_20px_rgba(34,211,238,0.4)]">
                  <User size={28} className="text-primary-dark" />
                </div>
                <div>
                  <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.2em]">Investor Persona</span>
                  <h2 className="text-3xl font-black text-white mt-1">{aiProfile.investor_type}</h2>
                </div>
              </div>
              
              <p className="text-lg text-gray-300 leading-relaxed font-medium mb-8 italic">
                "{aiProfile.personality_statement}"
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {aiProfile.actionable_advice.map((advice, idx) => (
                  <div key={idx} className="flex items-start space-x-3 bg-white/5 p-4 rounded-2xl border border-white/5 hover:border-cyan-500/30 transition-colors">
                    <CheckCircle2 size={18} className="text-cyan-400 mt-0.5 shrink-0" />
                    <span className="text-xs text-gray-300 font-bold leading-tight">{advice}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-secondary-dark/50 p-8 rounded-[32px] border border-white/5 flex flex-col items-center text-center">
              <div className="w-32 h-32 rounded-full border-4 border-cyan-500/20 flex items-center justify-center relative mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-cyan-400"></div>
                <div className="text-4xl font-black text-white">{aiProfile.sentiment_score}%</div>
              </div>
              <h4 className="text-sm font-black text-white uppercase tracking-widest mb-2">Portfolio Alignment</h4>
              <p className="text-[10px] text-gray-500 font-bold uppercase leading-relaxed">
                Based on sector weightage and risk appetite analysis
              </p>
              <button 
                onClick={() => fetchAIProfile()}
                className="mt-8 text-[10px] font-black text-cyan-400 uppercase tracking-[0.2em] flex items-center hover:text-white transition-colors"
              >
                <RefreshCw size={12} className="mr-2" />
                Re-Sync Analysis
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tailored Recommendations List */}
      {!loading && aiProfile && aiProfile.recommended_stocks && (
        <div className="mb-16 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
            <div className="flex items-center space-x-3">
              <div className="bg-emerald-500/20 p-2.5 rounded-2xl border border-emerald-500/30">
                <Sparkles className="text-emerald-400" size={24} />
              </div>
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">Top 10 Picks For You</h2>
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">Based on your investor persona and history</p>
              </div>
            </div>

            {/* Timeframe Selector */}
            <div className="flex bg-secondary-dark/50 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
              {[
                { id: '1mo', label: '1 Month' },
                { id: '3mo', label: '3 Months' },
                { id: '6mo', label: '6 Months' },
                { id: '1yr', label: '1 Year' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeframe(t.id)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                    timeframe === t.id 
                      ? 'bg-emerald-500 text-primary-dark shadow-lg shadow-emerald-500/20' 
                      : 'text-gray-400 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          <div className="glass-panel overflow-hidden border border-white/5 relative">
            {/* Animated Background Decoration */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
            
            <div className="overflow-x-auto custom-scrollbar">
              <table className="w-full text-left border-collapse relative z-10">
                <thead>
                  <tr className="bg-white/5 border-b border-white/5">
                    <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">
                      <div className="flex items-center space-x-2">
                        <span>Stock Details</span>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('current_price')}
                      className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors group"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>Current Price</span>
                        <div className="flex flex-col">
                          <ChevronUp size={10} className={`${sortConfig.key === 'current_price' && sortConfig.direction === 'asc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                          <ChevronDown size={10} className={`${sortConfig.key === 'current_price' && sortConfig.direction === 'desc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                        </div>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('pe_ratio')}
                      className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>PE Ratio</span>
                        <div className="flex flex-col">
                          <ChevronUp size={10} className={`${sortConfig.key === 'pe_ratio' && sortConfig.direction === 'asc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                          <ChevronDown size={10} className={`${sortConfig.key === 'pe_ratio' && sortConfig.direction === 'desc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                        </div>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('discount_ratio')}
                      className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>Discount Ratio</span>
                        <div className="flex flex-col">
                          <ChevronUp size={10} className={`${sortConfig.key === 'discount_ratio' && sortConfig.direction === 'asc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                          <ChevronDown size={10} className={`${sortConfig.key === 'discount_ratio' && sortConfig.direction === 'desc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                        </div>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('prediction_price')}
                      className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>Prediction ({timeframe})</span>
                        <div className="flex flex-col">
                          <ChevronUp size={10} className={`${sortConfig.key === 'prediction_price' && sortConfig.direction === 'asc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                          <ChevronDown size={10} className={`${sortConfig.key === 'prediction_price' && sortConfig.direction === 'desc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                        </div>
                      </div>
                    </th>
                    <th 
                      onClick={() => handleSort('change_percent')}
                      className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center cursor-pointer hover:text-white transition-colors"
                    >
                      <div className="flex items-center justify-center space-x-2">
                        <span>Expected Change</span>
                        <div className="flex flex-col">
                          <ChevronUp size={10} className={`${sortConfig.key === 'change_percent' && sortConfig.direction === 'asc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                          <ChevronDown size={10} className={`${sortConfig.key === 'change_percent' && sortConfig.direction === 'desc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                        </div>
                      </div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {getSortedStocks(aiProfile.recommended_stocks).map((stock, index) => {
                    const predData = stock.predictions?.[timeframe] || { price: 0, change: 0 };
                    const isUp = predData.change >= 0;
                    return (
                      <tr key={index} className="hover:bg-white/[0.04] transition-all duration-300 group">
                        <td className="px-6 py-6">
                          <div className="flex items-center space-x-4">
                            <div className={`p-3 rounded-2xl ${isUp ? 'bg-emerald-500/10' : 'bg-red-500/10'} border ${isUp ? 'border-emerald-500/20' : 'border-red-500/20'} group-hover:scale-110 transition-transform`}>
                              {isUp ? <TrendingUp size={18} className="text-emerald-400" /> : <TrendingDown size={18} className="text-red-400" />}
                            </div>
                            <div className="flex flex-col">
                              <span className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors tracking-tight">{stock.symbol}</span>
                              <span className="text-[10px] font-bold text-gray-500 uppercase truncate max-w-[120px]">{stock.name}</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="text-sm font-black text-white">₹{stock.current_price.toLocaleString()}</div>
                          <div className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Live Price</div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className="inline-block px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-black text-gray-300">
                            {stock.pe_ratio || 'N/A'}
                          </div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className={`text-sm font-black ${stock.discount_ratio > 20 ? 'text-emerald-400' : 'text-gray-400'}`}>
                            {stock.discount_ratio.toFixed(2)}%
                          </div>
                        </td>
                        <td className={`px-6 py-6 text-center transition-colors duration-500 ${isUp ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                          <div className={`text-lg font-black tracking-tight ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>₹{predData.price.toLocaleString()}</div>
                          <div className={`text-[9px] font-bold uppercase mt-0.5 ${isUp ? 'text-emerald-400/50' : 'text-red-400/50'}`}>Target Price</div>
                        </td>
                        <td className="px-6 py-6 text-center">
                          <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl font-black text-xs transition-all duration-500 ${isUp ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]' : 'bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.1)]'}`}>
                            {isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                            <span className="text-sm">{Math.abs(predData.change)}%</span>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      <div className="flex items-center space-x-3 mb-8">
        <Target size={24} className="text-cyan-400" />
        <h2 className="text-2xl font-black text-white uppercase tracking-tight">Market Opportunities</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {recommendations.map((stock) => (
          <div key={stock.symbol} className="glass-panel p-8 group hover:bg-white/10 transition-all duration-300">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="px-3 py-1 bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-[10px] font-black rounded-lg uppercase tracking-widest block w-fit mb-2">
                  {stock.type}
                </span>
                <h3 className="text-2xl font-black text-white group-hover:text-cyan-400 transition-colors">
                  {stock.symbol}
                </h3>
                <p className="text-gray-400 font-bold text-sm mt-1">{stock.name}</p>
              </div>
              <div className="bg-cyan-500/10 p-3 rounded-2xl text-cyan-400 border border-cyan-500/20">
                <Sparkles size={24} />
              </div>
            </div>

            <div className="bg-white/5 border border-white/5 p-4 rounded-2xl mb-6">
              <span className="text-gray-500 text-[10px] font-black uppercase tracking-widest block mb-2">Analysis Rationale</span>
              <p className="text-xs text-gray-300 leading-relaxed font-medium">
                {stock.reason}
              </p>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ShieldCheck size={14} className="text-cyan-400" />
                <span className="text-[10px] font-black text-gray-400 uppercase">Confidence</span>
              </div>
              <span className="text-xs font-black text-white px-2 py-0.5 bg-white/10 rounded-md">
                {stock.confidence}
              </span>
            </div>

            <button 
              onClick={() => navigate('/customer-welcome/forecast', { state: { symbol: stock.symbol } })}
              className="mt-8 w-full glass-button bg-cyan-500/20 border border-cyan-500/30 hover:bg-cyan-500/30 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-cyan-400 flex items-center justify-center group-hover:scale-[1.02] transition-all"
            >
              <Zap size={14} className="mr-2" />
              Analyze Deeply
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Recommend;
