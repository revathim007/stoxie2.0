import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { ArrowLeft, Briefcase, Sparkles, TrendingUp, ArrowUpRight, ArrowDownRight, Plus, ChevronDown, ChevronUp, Search, Filter, X } from 'lucide-react';

const PortfolioDetail = () => {
  const { name } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const portfolioType = queryParams.get('type'); // 'user' or null (builtin)
  const portfolioId = queryParams.get('id');

  const [portfolioStocks, setPortfolioStocks] = useState([]);
  const [recommendedStocks, setRecommendedStocks] = useState([]);
  const [userPortfolios, setUserPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStock, setSelectedStock] = useState(null);
  const [timeframe, setTimeframe] = useState('1mo'); // '1mo', '3mo', '6mo', '1yr'
  const [sortConfig, setSortConfig] = useState({ key: 'change_percent', direction: 'desc' });
  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: '',
    maxPrice: '',
    minPE: '',
    maxPE: '',
    minDiscount: '',
    maxDiscount: '',
    minChange: '',
    maxChange: ''
  });
  const dropdownRef = useRef(null);

  useEffect(() => {
    const fetchPortfolioData = async () => {
      setLoading(true);
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        const [stocksRes, portfoliosRes] = await Promise.all([
          axios.get('http://localhost:8000/api/stocks/'),
          axios.get(`http://localhost:8000/api/stocks/portfolios/?user_id=${userData.id}`)
        ]);
        
        const allStocks = stocksRes.data;
        setUserPortfolios(portfoliosRes.data);

        let filtered = [];
        if (portfolioType === 'user' && portfolioId) {
          const userPortfolio = portfoliosRes.data.find(p => p.id.toString() === portfolioId);
          if (userPortfolio) {
            filtered = userPortfolio.items.map(item => ({
              ...item.stock,
              quantity: item.quantity
            }));
          }
        } else {
          const sectorName = decodeURIComponent(name).replace(' Leaders', '');
          filtered = allStocks.filter(stock => stock.sector === sectorName);
        }
        setPortfolioStocks(filtered);

        // Identification & Multi-timeframe Simulation
        const topGrowing = [...filtered]
          .sort((a, b) => (parseFloat(b.discount_ratio) || 0) - (parseFloat(a.discount_ratio) || 0))
          .slice(0, 10); // Show up to 10 picks for user portfolios too

        const recommendationsWithPredictions = topGrowing.map(stock => {
          const currPrice = parseFloat(stock.current_price || 0);
          
          // Helper for simulations
          const getSim = (min_pct, max_pct) => {
            const changePct = (parseFloat(stock.discount_ratio || 0) / 100) + (Math.random() * (max_pct - min_pct) + min_pct);
            return {
              price: round(currPrice * (1 + changePct), 2),
              change: round(changePct * 100, 2)
            };
          };

          return {
            ...stock,
            predictions: {
              '1mo': getSim(0.02, 0.08),
              '3mo': getSim(0.05, 0.15),
              '6mo': getSim(0.10, 0.30),
              '1yr': getSim(0.20, 0.60)
            }
          };
        });

        setRecommendedStocks(recommendationsWithPredictions);

      } catch (error) {
        console.error("Error fetching portfolio details:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchPortfolioData();

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setSelectedStock(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [name]);

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getFilteredAndSortedStocks = (stocks) => {
    let filtered = stocks.filter(stock => {
      const matchesSearch = 
        stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
        stock.name.toLowerCase().includes(searchTerm.toLowerCase());
      
      const price = parseFloat(stock.current_price) || 0;
      const pe = parseFloat(stock.pe_ratio) || 0;
      const discount = parseFloat(stock.discount_ratio) || 0;
      const pred = stock.predictions?.[timeframe] || { price: 0, change: 0 };
      
      const matchesPrice = (!filters.minPrice || price >= parseFloat(filters.minPrice)) && 
                          (!filters.maxPrice || price <= parseFloat(filters.maxPrice));
      const matchesPE = (!filters.minPE || pe >= parseFloat(filters.minPE)) && 
                        (!filters.maxPE || pe <= parseFloat(filters.maxPE));
      const matchesDiscount = (!filters.minDiscount || discount >= parseFloat(filters.minDiscount)) && 
                              (!filters.maxDiscount || discount <= parseFloat(filters.maxDiscount));
      const matchesChange = (!filters.minChange || pred.change >= parseFloat(filters.minChange)) && 
                            (!filters.maxChange || pred.change <= parseFloat(filters.maxChange));

      return matchesSearch && matchesPrice && matchesPE && matchesDiscount && matchesChange;
    });

    if (!sortConfig.key) return filtered;

    return [...filtered].sort((a, b) => {
      let aValue, bValue;

      if (sortConfig.key === 'prediction_price') {
        aValue = a.predictions[timeframe].price;
        bValue = b.predictions[timeframe].price;
      } else if (sortConfig.key === 'change_percent') {
        aValue = a.predictions[timeframe].change;
        bValue = b.predictions[timeframe].change;
      } else if (sortConfig.key === 'symbol') {
        aValue = a.symbol;
        bValue = b.symbol;
      } else {
        aValue = parseFloat(a[sortConfig.key]) || 0;
        bValue = parseFloat(b[sortConfig.key]) || 0;
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
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

  const round = (value, decimals) => {
    return Number(Math.round(value + 'e' + decimals) + 'e-' + decimals);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white"></div>
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <button 
        onClick={() => navigate(-1)}
        className="flex items-center text-gray-400 hover:text-white transition-colors mb-8 group"
      >
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" />
        Back to Portfolios
      </button>

      <div className="glass-panel p-8 md:p-12 animate-in fade-in slide-in-from-bottom-4 duration-700 mb-12 relative overflow-hidden">
        {/* Decorative background glow */}
        <div className={`absolute top-0 right-0 w-64 h-64 ${portfolioType === 'user' ? 'bg-cyan-500/10' : 'bg-emerald-500/10'} blur-[100px] rounded-full -mr-32 -mt-32`}></div>
        
        <div className="flex items-center space-x-4 mb-4 relative z-10">
          <div className={`${portfolioType === 'user' ? 'bg-cyan-400/20' : 'bg-emerald-400/20'} p-3 rounded-2xl`}>
            <Briefcase className={portfolioType === 'user' ? 'text-cyan-400' : 'text-emerald-400'} size={32} />
          </div>
          <h1 className="text-3xl md:text-4xl font-black text-white uppercase tracking-tight">
            Quality of {decodeURIComponent(name)}
          </h1>
        </div>
        <p className="text-gray-400 font-bold uppercase tracking-[0.2em] ml-1 text-xs md:text-sm relative z-10">
          {portfolioType === 'user' ? 'Your Custom Collection Analysis' : 'Sector Deep Dive Analysis & Insights'}
        </p>
      </div>

      {/* Recommended Stocks Table */}
      <div className="mb-16">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-6">
          <div className="flex items-center space-x-3">
            <div className={`${portfolioType === 'user' ? 'bg-cyan-500/20 border-cyan-500/30' : 'bg-emerald-500/20 border-emerald-500/30'} p-2.5 rounded-2xl border`}>
              <Sparkles className={portfolioType === 'user' ? 'text-cyan-400' : 'text-emerald-400'} size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                {portfolioType === 'user' ? 'Top Growth Opportunities' : 'Top Growing Stocks'}
              </h2>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
                {portfolioType === 'user' ? 'Highest potential assets in your portfolio' : 'AI-Curated picks from this sector'}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4">
            {/* Search Input */}
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 group-focus-within:text-emerald-400 transition-colors" size={16} />
              <input 
                type="text"
                placeholder="Search stocks..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-secondary-dark/50 border border-white/10 rounded-2xl py-2.5 pl-11 pr-4 text-xs font-bold text-white focus:outline-none focus:border-emerald-500/50 focus:ring-4 focus:ring-emerald-500/10 transition-all w-64"
              />
            </div>

            {/* Filter Toggle */}
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest border transition-all ${
                showFilters 
                  ? 'bg-emerald-500 text-primary-dark border-emerald-500 shadow-lg shadow-emerald-500/20' 
                  : 'bg-white/5 text-gray-400 border-white/10 hover:border-white/20'
              }`}
            >
              <Filter size={14} />
              <span>Filters</span>
            </button>

            {/* Timeframe Selector */}
            <div className="flex bg-secondary-dark/50 p-1 rounded-2xl border border-white/5 backdrop-blur-md">
              {[
                { id: '1mo', label: '1M' },
                { id: '3mo', label: '3M' },
                { id: '6mo', label: '6M' },
                { id: '1yr', label: '1Y' }
              ].map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTimeframe(t.id)}
                  className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
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
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="glass-panel p-6 mb-8 animate-in fade-in slide-in-from-top-4 duration-300 border border-emerald-500/20 bg-emerald-500/5">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-emerald-400" />
                <h3 className="text-xs font-black text-white uppercase tracking-[0.2em]">Advanced Filters</h3>
              </div>
              <button 
                onClick={() => {
                  setFilters({
                    minPrice: '', maxPrice: '',
                    minPE: '', maxPE: '',
                    minDiscount: '', maxDiscount: '',
                    minChange: '', maxChange: ''
                  });
                  setSearchTerm('');
                }}
                className="text-[10px] font-black text-gray-500 hover:text-white uppercase tracking-widest transition-colors flex items-center"
              >
                <X size={12} className="mr-1" />
                Reset All
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* Price Range */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Price Range (₹)</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" placeholder="Min" 
                    value={filters.minPrice}
                    onChange={(e) => setFilters({...filters, minPrice: e.target.value})}
                    className="w-full bg-primary-dark/50 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  <span className="text-gray-600">-</span>
                  <input 
                    type="number" placeholder="Max" 
                    value={filters.maxPrice}
                    onChange={(e) => setFilters({...filters, maxPrice: e.target.value})}
                    className="w-full bg-primary-dark/50 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* PE Ratio Range */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">PE Ratio</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" placeholder="Min" 
                    value={filters.minPE}
                    onChange={(e) => setFilters({...filters, minPE: e.target.value})}
                    className="w-full bg-primary-dark/50 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  <span className="text-gray-600">-</span>
                  <input 
                    type="number" placeholder="Max" 
                    value={filters.maxPE}
                    onChange={(e) => setFilters({...filters, maxPE: e.target.value})}
                    className="w-full bg-primary-dark/50 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Discount Ratio Range */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Discount Ratio (%)</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" placeholder="Min" 
                    value={filters.minDiscount}
                    onChange={(e) => setFilters({...filters, minDiscount: e.target.value})}
                    className="w-full bg-primary-dark/50 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  <span className="text-gray-600">-</span>
                  <input 
                    type="number" placeholder="Max" 
                    value={filters.maxDiscount}
                    onChange={(e) => setFilters({...filters, maxDiscount: e.target.value})}
                    className="w-full bg-primary-dark/50 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>

              {/* Expected Change Range */}
              <div className="space-y-3">
                <label className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Expected Change (%)</label>
                <div className="flex items-center space-x-2">
                  <input 
                    type="number" placeholder="Min" 
                    value={filters.minChange}
                    onChange={(e) => setFilters({...filters, minChange: e.target.value})}
                    className="w-full bg-primary-dark/50 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-emerald-500/50"
                  />
                  <span className="text-gray-600">-</span>
                  <input 
                    type="number" placeholder="Max" 
                    value={filters.maxChange}
                    onChange={(e) => setFilters({...filters, maxChange: e.target.value})}
                    className="w-full bg-primary-dark/50 border border-white/5 rounded-xl px-3 py-2 text-[10px] font-bold text-white focus:outline-none focus:border-emerald-500/50"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="glass-panel overflow-hidden border border-white/5 relative">
          {/* Animated Background Decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none"></div>
          
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse relative z-10">
              <thead>
                <tr className="bg-white/5 border-b border-white/5">
                  <th 
                    onClick={() => handleSort('symbol')}
                    className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest cursor-pointer hover:text-white transition-colors"
                  >
                    <div className="flex items-center space-x-2">
                      <span>Stock Details</span>
                      <div className="flex flex-col">
                        <ChevronUp size={10} className={`${sortConfig.key === 'symbol' && sortConfig.direction === 'asc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                        <ChevronDown size={10} className={`${sortConfig.key === 'symbol' && sortConfig.direction === 'desc' ? 'text-emerald-400' : 'text-gray-600'}`} />
                      </div>
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
                    className="px-6 py-6 text-[10px] font-black text-emerald-400/70 uppercase tracking-widest text-center bg-emerald-500/5 cursor-pointer hover:text-emerald-400 transition-colors"
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
                  <th className="px-6 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest text-center">Add to Portfolio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {getFilteredAndSortedStocks(recommendedStocks).map((stock, index) => {
                  const predData = stock.predictions[timeframe];
                  const isUp = predData.change >= 0;
                  const isSelected = selectedStock?.id === stock.id;
                  return (
                    <tr 
                      key={index} 
                      className={`hover:bg-white/[0.04] transition-all duration-300 group relative ${isSelected ? 'z-50' : 'z-0'}`}
                    >
                      <td className="px-6 py-6">
                        <div className="flex items-center space-x-4">
                          <div className={`p-3 rounded-2xl ${isUp ? 'bg-emerald-500/10' : 'bg-red-500/10'} border ${isUp ? 'border-emerald-500/20' : 'border-red-500/20'} group-hover:scale-110 transition-transform`}>
                            <TrendingUp size={18} className={isUp ? 'text-emerald-400' : 'text-red-400'} />
                          </div>
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-white group-hover:text-emerald-400 transition-colors tracking-tight">{stock.symbol}</span>
                            <span className="text-[10px] font-bold text-gray-500 uppercase truncate max-w-[120px]">{stock.name}</span>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="text-sm font-black text-white">₹{parseFloat(stock.current_price).toLocaleString()}</div>
                        <div className="text-[9px] font-bold text-gray-500 uppercase mt-0.5">Live Price</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className="inline-block px-3 py-1 bg-white/5 rounded-full border border-white/10 text-xs font-black text-gray-300">
                          {stock.pe_ratio || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className={`text-sm font-black ${parseFloat(stock.discount_ratio) > 20 ? 'text-emerald-400' : 'text-gray-400'}`}>
                          {parseFloat(stock.discount_ratio).toFixed(2)}%
                        </div>
                      </td>
                      <td className={`px-6 py-6 text-center transition-colors duration-500 ${isUp ? 'bg-emerald-500/5' : 'bg-red-500/5'}`}>
                        <div className={`text-lg font-black tracking-tight ${isUp ? 'text-emerald-400' : 'text-red-400'}`}>₹{predData.price.toLocaleString()}</div>
                        <div className={`text-[9px] font-bold uppercase mt-0.5 ${isUp ? 'text-emerald-400/50' : 'text-red-400/50'}`}>Target Price</div>
                      </td>
                      <td className="px-6 py-6 text-center">
                        <div className={`inline-flex items-center space-x-2 px-4 py-2 rounded-2xl font-black text-xs transition-all duration-500 ${isUp ? 'bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.1)]' : 'bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(248,113,113,0.1)]'}`}>
                          {isUp ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
                          <span className="text-sm">{Math.abs(predData.change).toFixed(2)}%</span>
                        </div>
                      </td>
                      <td className="px-6 py-6 text-center relative">
                        <button
                          onClick={() => setSelectedStock(isSelected ? null : stock)}
                          className={`inline-flex items-center space-x-2 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                            isSelected 
                              ? 'bg-emerald-500 text-primary-dark shadow-lg' 
                              : 'bg-white/5 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/10'
                          }`}
                        >
                          <Plus size={14} />
                          <span>Add</span>
                          <ChevronDown size={12} className={`ml-1 transition-transform ${isSelected ? 'rotate-180' : ''}`} />
                        </button>

                        {/* Enhanced Dropdown for User Portfolios */}
                        {isSelected && (
                          <div 
                            ref={dropdownRef}
                            className="absolute z-[100] right-6 mt-2 p-4 shadow-[0_20px_50px_rgba(0,0,0,0.8)] animate-in fade-in slide-in-from-top-4 duration-300 border-2 border-emerald-500/50 rounded-2xl bg-[#1e1b4b] overflow-hidden min-w-[200px] text-left"
                          >
                            <div className="flex items-center space-x-2 mb-3 px-1">
                              <Plus size={14} className="text-emerald-400" />
                              <p className="text-[10px] font-black text-white uppercase tracking-widest">Select Portfolio</p>
                            </div>
                            
                            <div className="max-h-48 overflow-y-auto custom-scrollbar space-y-1.5">
                              {userPortfolios.length > 0 ? (
                                userPortfolios.map(up => (
                                  <button
                                    key={up.id}
                                    onClick={() => handleAddToUserPortfolio(up.id, stock.id)}
                                    className="w-full text-left px-3 py-2.5 bg-white/5 hover:bg-emerald-500/20 border border-white/5 hover:border-emerald-500/30 rounded-xl text-[10px] font-bold text-white flex items-center justify-between transition-all"
                                  >
                                    <span>{up.name}</span>
                                    <Plus size={12} className="text-emerald-400" />
                                  </button>
                                ))
                              ) : (
                                <p className="text-[10px] text-gray-400 italic p-2">No portfolios found.</p>
                              )}
                            </div>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* All Stocks in Portfolio */}
      <div>
        <div className="flex items-center space-x-3 mb-8">
          <div className={`${portfolioType === 'user' ? 'bg-cyan-500/10 border-cyan-500/10' : 'bg-gray-500/10 border-white/10'} p-2.5 rounded-2xl border`}>
            <Briefcase className={portfolioType === 'user' ? 'text-cyan-400' : 'text-gray-400'} size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tight">
              {portfolioType === 'user' ? 'Portfolio Holdings' : `All Stocks in ${decodeURIComponent(name)}`}
            </h2>
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mt-1">
              {portfolioType === 'user' ? 'Complete list of assets in your custom collection' : 'Complete list of assets in this sector'}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {portfolioStocks
            .filter(stock => 
              stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) || 
              stock.name.toLowerCase().includes(searchTerm.toLowerCase())
            )
            .map(stock => (
            <div key={stock.id} className="glass-panel p-4 text-center hover:border-white/20 transition-all">
              <p className="font-black text-sm text-white truncate">{stock.symbol}</p>
              <p className="text-[10px] text-gray-400 font-bold uppercase truncate">{stock.name}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default PortfolioDetail;
