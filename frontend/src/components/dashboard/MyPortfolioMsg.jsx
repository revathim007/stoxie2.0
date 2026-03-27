import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Briefcase, ChevronDown, Plus, TrendingUp, TrendingDown, Sparkles, LineChart, BarChart3, Layers } from 'lucide-react';

const MyPortfolioMsg = () => {
  const navigate = useNavigate();
  const [stocks, setStocks] = useState([]);
  const [userPortfolios, setUserPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        const [stocksRes, portfoliosRes] = await Promise.all([
          axios.get('http://localhost:8000/api/stocks/'),
          axios.get(`http://localhost:8000/api/stocks/portfolios/?user_id=${userData.id}`)
        ]);
        setStocks(stocksRes.data);
        setUserPortfolios(portfoliosRes.data);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSelectedStock(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getInBuiltPortfolios = () => {
    const sectors = {};
    stocks.forEach(stock => {
      const sector = stock.sector || 'Others';
      if (!sectors[sector]) {
        sectors[sector] = [];
      }
      sectors[sector].push(stock);
    });

    return Object.entries(sectors).map(([name, items]) => ({
      name: `${name} Leaders`,
      items: items // Show all stocks in each
    }));
  };

  const handleAddToUserPortfolio = async (portfolioId, stockId) => {
    try {
      await axios.patch(`http://localhost:8000/api/stocks/portfolios/${portfolioId}/`, {
        stocks_data: [{ stock_id: stockId, quantity: 1 }]
      });
      alert('Stock added to your portfolio!');
      setSelectedStock(null);
    } catch (error) {
      console.error('Error adding stock:', error);
      alert('Failed to add stock to portfolio.');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
    </div>
  );

  const inBuiltPortfolios = getInBuiltPortfolios();

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="mb-12">
        <div className="glass-panel inline-block p-6 animate-in fade-in slide-in-from-left-4 duration-700 relative overflow-hidden group">
          {/* Animated background glow */}
          <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500/10 to-cyan-500/10 rounded-2xl blur-lg opacity-50 group-hover:opacity-100 transition-opacity duration-700"></div>
          
          <h1 className="text-3xl font-black text-white relative z-10 flex items-center">
            <div className="bg-emerald-400/20 p-2 rounded-xl mr-4">
              <Layers className="text-emerald-400" size={24} />
            </div>
            Built in Sector Wise portfolios
          </h1>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {inBuiltPortfolios.map((portfolio, idx) => (
          <div 
            key={idx} 
            onClick={() => navigate(`/customer-welcome/portfolio-detail/${encodeURIComponent(portfolio.name)}`)}
            className="glass-panel p-6 hover:border-emerald-500/30 transition-all flex flex-col max-h-[600px] hover:shadow-[0_0_40px_rgba(52,211,153,0.1)] cursor-pointer group/card"
          >
            <div className="flex flex-col mb-6 shrink-0">
              <div className="flex items-center justify-between mb-4">
                <div className="text-xl font-bold text-white flex items-center group-hover/card:text-emerald-400 transition-colors">
                  <div className="bg-emerald-400/10 p-2 rounded-lg mr-3 group-hover/card:bg-emerald-400/20 transition-colors">
                    <Briefcase className="text-emerald-400" size={20} />
                  </div>
                  {portfolio.name}
                </div>
              </div>
              
              <div className="flex gap-3">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/customer-welcome/forecast', { 
                      state: { 
                        portfolio: { 
                          name: portfolio.name, 
                          items: portfolio.items.map(s => ({ stock: s, quantity: 1 })) 
                        } 
                      } 
                    });
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-500/30 hover:from-blue-500/30 hover:to-cyan-500/30 text-blue-400 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg z-10"
                >
                  <LineChart size={14} />
                  <span>Forecast</span>
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    navigate('/customer-welcome/sentiment', { 
                      state: { 
                        portfolio: { 
                          name: portfolio.name, 
                          items: portfolio.items.map(s => ({ stock: s, quantity: 1 })) 
                        } 
                      } 
                    });
                  }}
                  className="flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-xl bg-gradient-to-r from-purple-500/20 to-pink-500/20 border border-purple-500/30 hover:from-purple-500/30 hover:to-pink-500/30 text-purple-400 text-[10px] font-black uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 shadow-lg z-10"
                >
                  <BarChart3 size={14} />
                  <span>Sentiment</span>
                </button>
              </div>
            </div>

            <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
              {portfolio.items.map((stock) => {
                const isHighGrowing = parseFloat(stock.discount_ratio || 0) > 25;
                const isSelected = selectedStock?.id === stock.id;

                return (
                  <div key={stock.id} className={`relative ${isSelected ? 'z-[100]' : 'z-20'}`}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedStock(isSelected ? null : stock);
                      }}
                      className={`w-full flex items-center justify-between p-4 rounded-xl transition-all duration-300 border ${
                        isSelected 
                          ? 'bg-gradient-to-r from-indigo-500/30 to-purple-500/30 border-white/30 scale-[1.02] shadow-xl'
                          : isHighGrowing 
                            ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500/20' 
                            : 'bg-red-500/5 border-red-500/10 text-red-400 hover:bg-red-500/10'
                      }`}
                    >
                      <div className="flex flex-col items-start">
                        <span className="font-black text-sm tracking-tight">{stock.symbol}</span>
                        <span className="text-[10px] font-bold opacity-60 truncate max-w-[140px]">{stock.name}</span>
                      </div>
                      <div className="flex items-center space-x-4">
                        <div className="flex items-center space-x-2 mr-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/customer-welcome/forecast', { state: { symbol: stock.symbol } });
                            }}
                            className="p-2 rounded-xl bg-gradient-to-r from-blue-600/20 to-cyan-600/20 hover:from-blue-600/40 hover:to-cyan-600/40 text-blue-300 transition-all hover:scale-110 active:scale-90 border border-blue-500/30 shadow-lg group/btn"
                            title="Forecast Stock"
                          >
                            <LineChart size={14} className="group-hover/btn:animate-bounce" />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              navigate('/customer-welcome/sentiment', { state: { symbol: stock.symbol } });
                            }}
                            className="p-2 rounded-xl bg-gradient-to-r from-purple-600/20 to-pink-600/20 hover:from-purple-600/40 hover:to-pink-600/40 text-purple-300 transition-all hover:scale-110 active:scale-90 border border-purple-500/30 shadow-lg group/btn"
                            title="Sentiment Analysis"
                          >
                            <BarChart3 size={14} className="group-hover/btn:animate-pulse" />
                          </button>
                        </div>
                        <div className="text-right">
                          <div className="text-sm font-black text-white">₹{stock.current_price}</div>
                          <div className={`text-[10px] font-black flex items-center justify-end ${isHighGrowing ? 'text-emerald-400' : 'text-red-400'}`}>
                            {isHighGrowing ? <TrendingUp size={12} className="mr-1" /> : <TrendingDown size={12} className="mr-1" />}
                            {stock.discount_ratio}%
                          </div>
                        </div>
                        <div className={`p-1 rounded-full transition-transform duration-300 ${isSelected ? 'bg-white/20 rotate-180' : 'bg-white/5'}`}>
                          <ChevronDown size={14} className="text-white" />
                        </div>
                      </div>
                    </button>

                    {/* Enhanced Dropdown for User Portfolios */}
                    {isSelected && (
                      <div 
                        ref={dropdownRef}
                        className="absolute z-[100] left-0 right-0 mt-3 p-5 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-300 border-2 border-emerald-500/50 rounded-2xl bg-[#1e1b4b] overflow-hidden"
                      >
                        {/* Decorative background glow - reduced opacity to keep it opaque */}
                        <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full -mr-10 -mt-10 pointer-events-none"></div>
                        
                        <div className="flex items-center space-x-3 mb-4 px-1 relative z-10">
                          <div className="bg-emerald-400/20 p-2 rounded-xl">
                            <Plus size={18} className="text-emerald-400" />
                          </div>
                          <div className="flex flex-col">
                            <p className="text-xs font-black text-white uppercase tracking-[0.2em] leading-none">Add to Portfolio</p>
                            <p className="text-[9px] font-bold text-emerald-400/70 mt-1 uppercase tracking-widest">Select target list</p>
                          </div>
                        </div>
                        
                        <div className="max-h-60 overflow-y-auto custom-scrollbar space-y-2.5 relative z-10 pr-1">
                          {userPortfolios.length > 0 ? (
                            userPortfolios.map(up => (
                              <button
                                key={up.id}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleAddToUserPortfolio(up.id, stock.id);
                                }}
                                className="w-full text-left px-4 py-4 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-emerald-500/30 rounded-xl text-sm font-bold text-white flex items-center justify-between transition-all duration-300 group hover:scale-[1.02] hover:shadow-lg"
                              >
                                <div className="flex items-center">
                                  <div className="bg-white/5 p-1.5 rounded-lg mr-3 group-hover:bg-emerald-500/20 transition-colors">
                                    <Briefcase size={14} className="text-gray-400 group-hover:text-emerald-400 transition-colors" />
                                  </div>
                                  <span className="tracking-tight group-hover:text-emerald-400 transition-colors">{up.name}</span>
                                </div>
                                <div className="bg-emerald-500/0 group-hover:bg-emerald-500/20 p-1.5 rounded-full transition-all scale-75 group-hover:scale-100">
                                  <Plus size={16} className="text-emerald-400 opacity-0 group-hover:opacity-100 transition-all" />
                                </div>
                              </button>
                            ))
                          ) : (
                            <div className="p-8 text-center bg-black/20 rounded-2xl border border-white/5 backdrop-blur-md">
                              <p className="text-xs text-gray-400 font-bold italic mb-4">No portfolios found.</p>
                              <button 
                                onClick={() => navigate('/customer-welcome')}
                                className="w-full py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-[10px] font-black text-emerald-400 uppercase tracking-widest hover:bg-emerald-500/20 transition-all active:scale-95"
                              >
                                Create Portfolio Now
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default MyPortfolioMsg;
