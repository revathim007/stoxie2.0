
import React, { useState, useEffect } from 'react';
import { BarChart3, Briefcase, Search, TrendingUp, TrendingDown, Info } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import axios from 'axios';

const SentimentAnalysis = () => {
  const location = useLocation();
  const [symbol, setSymbol] = useState('');
  const [sentimentData, setSentimentData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);

  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [portfolioSentimentData, setPortfolioSentimentData] = useState(null);
  const [portfolioLoading, setPortfolioLoading] = useState(false);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch('http://localhost:8000/api/stocks/');
        const result = await response.json();
        setStocks(result);
      } catch (err) {
        console.error('Failed to fetch stocks:', err);
      }
    };

    const fetchPortfolios = async () => {
      try {
        const userData = JSON.parse(localStorage.getItem('user'));
        if (userData && userData.id) {
          const response = await axios.get(`http://localhost:8000/api/stocks/portfolios/?user_id=${userData.id}`);
          setPortfolios(response.data);
        }
      } catch (error) {
        console.error('Error fetching portfolios:', error);
      }
    };

    fetchStocks();
    fetchPortfolios();
  }, []);

  useEffect(() => {
    if (location.state && location.state.symbol && stocks.length > 0) {
      const stock = stocks.find(s => s.symbol === location.state.symbol);
      if (stock) {
        handleSuggestionClick(stock);
      }
    } else if (location.state && location.state.portfolio) {
      setSelectedPortfolio(location.state.portfolio);
      handlePortfolioSearch(location.state.portfolio);
    }
  }, [location.state, stocks]);

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSymbol(value);
    setSelectedStock(null);
    setSentimentData(null);
    setSelectedPortfolio(null);
    if (value) {
      const filtered = stocks.filter(stock =>
        stock.name.toLowerCase().includes(value.toLowerCase()) ||
        stock.symbol.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(filtered);
    } else {
      setSuggestions([]);
    }
  };

  const handlePortfolioChange = (e) => {
    const portfolioId = e.target.value;
    const portfolio = portfolios.find(p => p.id.toString() === portfolioId);
    setSelectedPortfolio(portfolio);
    setSymbol('');
    setSelectedStock(null);
    setSentimentData(null);
    setSuggestions([]);
    
    if (portfolio) {
      handlePortfolioSearch(portfolio);
    }
  };

  const handlePortfolioSearch = async (portfolio) => {
    if (!portfolio || !portfolio.items || portfolio.items.length === 0) return;
    setPortfolioLoading(true);
    setPortfolioSentimentData(null);

    try {
      const promises = portfolio.items.map(item =>
        axios.get(`http://localhost:8000/api/stocks/sentiment/${item.stock.symbol}/`).then(res => ({
          ...res.data,
          symbol: item.stock.symbol,
          name: item.stock.name
        }))
      );

      const results = await Promise.all(promises);
      setPortfolioSentimentData(results);
    } catch (err) {
      console.error('Error fetching portfolio sentiment:', err);
    } finally {
      setPortfolioLoading(false);
    }
  };

  const handleSuggestionClick = (stock) => {
    setSymbol(stock.name);
    setSelectedStock(stock);
    setSuggestions([]);
    setSelectedPortfolio(null);
    handleSearch(stock.symbol);
  };

  const handleSearch = async (searchSymbol) => {
    if (!searchSymbol) return;
    setLoading(true);
    setError(null);
    setSentimentData(null);

    try {
      const response = await fetch(`http://localhost:8000/api/stocks/sentiment/${searchSymbol}/`);
      if (!response.ok) {
        throw new Error('Could not fetch sentiment data.');
      }
      const result = await response.json();
      setSentimentData(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSentimentColor = (sentiment) => {
    if (sentiment.includes('Positive')) return 'text-green-400';
    if (sentiment.includes('Negative')) return 'text-red-400';
    return 'text-gray-400';
  };

  const getScoreColor = (score) => {
    if (score >= 7) return 'text-green-400';
    if (score >= 4) return 'text-yellow-400';
    return 'text-red-400';
  };

  const portfolioColors = [
    '#38bdf8', '#818cf8', '#c084fc', '#fb7185', '#fb923c', 
    '#facc15', '#4ade80', '#2dd4bf', '#22d3ee', '#60a5fa'
  ];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold">Sentiment Analysis</h1>
        <p className="text-gray-400 mt-2 font-semibold italic">Analyze market sentiment using AI-driven news processing.</p>
      </header>

      <div className="flex flex-col md:flex-row gap-6 mb-8">
        {/* Left Column - Stock Search */}
        <div className="w-full md:w-1/2">
          <div className="glass-panel p-6 border border-white/5 h-full relative z-20">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <Search size={14} className="mr-2 text-light-accent" /> Stock Search
            </h2>
            <div className="relative">
              <input
                type="text"
                value={symbol}
                onChange={handleInputChange}
                placeholder="Search by Symbol (e.g. RELIANCE, AAPL) or Company Name..."
                className="glass-input px-4 py-4 w-full font-semibold text-lg"
              />
              {suggestions.length > 0 && (
                <div className="absolute z-50 w-full mt-2 bg-secondary-dark/90 backdrop-blur-xl border border-white/10 rounded-2xl shadow-2xl max-h-60 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                  {suggestions.map((stock) => (
                    <div 
                      key={stock.id}
                      onClick={() => handleSuggestionClick(stock)}
                      className="p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0 flex justify-between items-center group"
                    >
                      <div className="flex flex-col">
                        <span className="font-black text-white group-hover:text-light-accent text-lg">{stock.symbol.split('.')[0]}</span>
                        <span className="text-xs text-gray-400 font-bold uppercase">{stock.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="text-sm font-black text-white">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: stock.currency || 'INR' }).format(stock.current_price)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Select Portfolio */}
        <div className="w-full md:w-1/2">
          <div className="glass-panel p-6 border border-white/5 h-full relative z-10">
            <h2 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <Briefcase size={14} className="mr-2 text-light-accent" /> Select Portfolio
            </h2>
            <div className="relative">
              <select
                value={selectedPortfolio ? selectedPortfolio.id : ''}
                onChange={handlePortfolioChange}
                className="glass-input px-4 py-4 w-full appearance-none cursor-pointer font-semibold text-lg pr-10"
              >
                <option value="" disabled className="bg-secondary-dark">Choose a portfolio...</option>
                {portfolios.map(p => (
                  <option key={p.id} value={p.id} className="bg-secondary-dark">
                    {p.name}
                  </option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-gray-400">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Unified Display Area */}
      <div className="mb-8">
        {selectedPortfolio && (
          <div className="flex flex-col space-y-8">
            {/* Portfolio Summary Bar Chart */}
            <div className="glass-panel p-8 border border-white/5">
              <div className="flex justify-between items-center mb-8">
                <div>
                  <h3 className="text-2xl font-black text-white">{selectedPortfolio.name} Sentiment Overview</h3>
                  <p className="text-sm text-gray-400 font-bold uppercase tracking-widest mt-1">Comparing Stock Confidence Scores</p>
                </div>
                {portfolioSentimentData && (
                  <div className="flex space-x-4">
                    <div className="px-4 py-2 bg-green-500/10 border border-green-500/20 rounded-xl text-center">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Avg Score</p>
                      <p className="text-xl font-black text-green-400">
                        {(portfolioSentimentData.reduce((acc, curr) => acc + curr.score, 0) / portfolioSentimentData.length).toFixed(1)}
                      </p>
                    </div>
                  </div>
                )}
              </div>

              {portfolioLoading ? (
                <div className="h-[300px] flex flex-col items-center justify-center space-y-4">
                  <div className="w-10 h-10 border-4 border-white/10 border-t-light-accent rounded-full animate-spin"></div>
                  <p className="text-xs font-black text-gray-500 uppercase tracking-widest">Analyzing Portfolio...</p>
                </div>
              ) : portfolioSentimentData ? (
                <div className="min-h-[400px] w-full">
                  <ResponsiveContainer width="100%" height={Math.max(350, portfolioSentimentData.length * 50)}>
                    <BarChart 
                      data={portfolioSentimentData} 
                      layout="vertical"
                      margin={{ top: 20, right: 40, left: 60, bottom: 20 }}
                    >
                      <defs>
                        <filter id="barGlow" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="2" result="blur" />
                          <feFlood floodColor="white" floodOpacity="0.2" result="color" />
                          <feComposite in="color" in2="blur" operator="in" result="glow" />
                          <feMerge>
                            <feMergeNode in="glow" />
                            <feMergeNode in="SourceGraphic" />
                          </feMerge>
                        </filter>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" horizontal={true} vertical={false} />
                      <XAxis 
                        type="number"
                        domain={[0, 10]} 
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9CA3AF', fontWeight: 'bold', fontSize: 12 }}
                        ticks={[0, 2, 4, 6, 8, 10]}
                        orientation="top"
                      />
                      <YAxis 
                        dataKey="symbol" 
                        type="category"
                        axisLine={false}
                        tickLine={false}
                        tick={(props) => {
                          const { x, y, payload } = props;
                          const index = portfolioSentimentData.findIndex(s => s.symbol === payload.value);
                          const color = portfolioColors[index % portfolioColors.length];
                          return (
                            <text 
                              x={x} 
                              y={y} 
                              dy={4} 
                              fill={color} 
                              textAnchor="end" 
                              style={{ fontSize: '13px', fontWeight: '900', letterSpacing: '-0.025em', fontFamily: 'Inter, sans-serif' }}
                            >
                              {payload.value.split('.')[0]}
                            </text>
                          );
                        }}
                        width={90}
                      />
                      <Tooltip 
                        cursor={{ fill: 'rgba(255, 255, 255, 0.05)' }}
                        content={({ active, payload }) => {
                          if (active && payload && payload.length) {
                            const data = payload[0].payload;
                            return (
                              <div className="bg-secondary-dark/95 backdrop-blur-xl p-4 border border-white/10 shadow-2xl rounded-2xl border-l-4" style={{ borderColor: portfolioColors[portfolioSentimentData.indexOf(data) % portfolioColors.length] }}>
                                <p className="text-xs font-black text-gray-400 uppercase tracking-widest mb-1">{data.name}</p>
                                <div className="flex items-center space-x-3">
                                  <span className={`text-2xl font-black ${getScoreColor(data.score)}`}>{data.score}</span>
                                  <span className={`text-xs font-bold px-2 py-0.5 rounded-lg bg-white/5 ${getSentimentColor(data.sentiment)}`}>
                                    {data.sentiment}
                                  </span>
                                </div>
                              </div>
                            );
                          }
                          return null;
                        }}
                      />
                      <Bar 
                        dataKey="score" 
                        radius={[0, 6, 6, 0]} 
                        barSize={24}
                        filter="url(#barGlow)"
                      >
                        {portfolioSentimentData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={portfolioColors[index % portfolioColors.length]}
                            fillOpacity={0.9}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-[300px] flex items-center justify-center text-gray-500 italic">
                  Select a portfolio to start analysis
                </div>
              )}
            </div>

            {/* Portfolio Details List */}
            <div className="glass-panel p-6 border border-white/5">
              <h3 className="text-xl font-bold text-white mb-4 flex items-center">
                <Briefcase size={18} className="mr-2 text-light-accent" /> Portfolio Assets
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {selectedPortfolio.items.map((item, index) => {
                  const sentiment = portfolioSentimentData?.find(s => s.symbol === item.stock.symbol);
                  const color = portfolioColors[index % portfolioColors.length];
                  return (
                    <div key={item.stock.id} className="p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-white/10 transition-all group">
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <p className="text-xl font-black transition-all group-hover:scale-105" style={{ color: color, letterSpacing: '-0.025em', fontFamily: 'Inter, sans-serif' }}>
                            {item.stock.symbol.split('.')[0]}
                          </p>
                          <p className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[120px]">{item.stock.name}</p>
                        </div>
                        {sentiment ? (
                          <div className="text-right">
                            <p className={`text-lg font-black ${getScoreColor(sentiment.score)}`}>{sentiment.score}</p>
                            <p className={`text-[8px] font-bold uppercase tracking-tighter ${getSentimentColor(sentiment.sentiment)}`}>{sentiment.sentiment}</p>
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-lg bg-white/5 animate-pulse"></div>
                        )}
                      </div>
                      <div className="flex justify-between items-end mt-2">
                        <p className="text-[10px] text-gray-500 font-bold">Qty: {item.quantity}</p>
                        <p className="text-xs font-black text-white">
                          {new Intl.NumberFormat('en-IN', { style: 'currency', currency: item.stock.currency || 'INR' }).format(item.stock.current_price)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
        {selectedStock && !selectedPortfolio && sentimentData && (
          <div className="glass-panel p-8 border border-white/5 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="flex-1">
              <p className="text-sm font-bold text-gray-400 uppercase tracking-widest">Active Stock Analysis</p>
              <h3 className="text-4xl font-black text-white mt-1">
                {selectedStock.name} <span className="text-xl opacity-40 ml-2">({selectedStock.symbol})</span>
              </h3>
              <div className="flex items-center mt-4 space-x-6">
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Market Sentiment</span>
                  <span className={`text-2xl font-black ${getSentimentColor(sentimentData.sentiment)}`}>
                    {sentimentData.sentiment}
                  </span>
                </div>
                <div className="w-px h-10 bg-white/10"></div>
                <div className="flex flex-col">
                  <span className="text-xs font-bold text-gray-500 uppercase tracking-tighter">Confidence Score</span>
                  <div className="flex items-baseline space-x-1">
                    <span className={`text-4xl font-black ${getScoreColor(sentimentData.score)}`}>
                      {sentimentData.score}
                    </span>
                    <span className="text-sm font-bold text-gray-600">/ 10</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="w-full md:w-64 bg-white/5 rounded-3xl p-6 border border-white/5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Sentiment Gauge</span>
                <span className={`text-xs font-black ${getScoreColor(sentimentData.score)}`}>{Math.round(sentimentData.score * 10)}%</span>
              </div>
              <div className="w-full h-3 bg-white/5 rounded-full overflow-hidden">
                <div 
                  className={`h-full transition-all duration-1000 ease-out rounded-full ${
                    sentimentData.score >= 7 ? 'bg-green-400' : sentimentData.score >= 4 ? 'bg-yellow-400' : 'bg-red-400'
                  }`}
                  style={{ width: `${sentimentData.score * 10}%` }}
                ></div>
              </div>
              <div className="flex justify-between mt-4 text-[10px] font-bold text-gray-500 items-center uppercase tracking-widest">
                <span className="flex items-center">
                  {sentimentData.score < 5 && <span className="text-3xl mr-3 animate-pulse">🐻</span>}
                  BEARISH
                </span>
                <span className="flex items-center">
                  BULLISH
                  {sentimentData.score >= 5 && <span className="text-3xl ml-3 animate-pulse">🐂</span>}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {!selectedPortfolio && (
        <div className="glass-panel p-8 border border-white/5 min-h-[400px] flex flex-col">
          {loading && (
            <div className="flex-1 flex flex-col items-center justify-center space-y-4">
              <div className="w-12 h-12 border-4 border-white/10 border-t-light-accent rounded-full animate-spin"></div>
              <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Analyzing Sentiment...</p>
            </div>
          )}
          {error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <p className="text-lg font-bold text-red-400 mb-2">Analysis Failed</p>
              <p className="text-sm text-gray-400 max-w-xs">{error}</p>
            </div>
          )}
          {sentimentData && sentimentData.articles && (
            <div>
              <h3 className="text-2xl font-bold text-white mb-6 border-b border-white/5 pb-4">Recent News & Articles</h3>
              <ul className="space-y-4">
                {sentimentData.articles.map((article, index) => (
                  <li key={index} className="pb-6 border-b border-white/5 last:border-b-0 group">
                    <div className="flex justify-between items-start mb-2">
                      <span className="text-[10px] font-black text-light-accent uppercase tracking-widest bg-light-accent/10 px-2 py-1 rounded-md">
                        {article.source || 'Market News'}
                      </span>
                    </div>
                    <a href={article.link} target="_blank" rel="noopener noreferrer" className="text-xl font-bold text-white group-hover:text-light-accent transition-all duration-200 block leading-tight">
                      {article.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {!sentimentData && !loading && !error && (
            <div className="flex-1 flex flex-col items-center justify-center text-center h-full space-y-6">
              <div className="bg-orange-500/10 p-6 rounded-full text-orange-400 border border-orange-500/20 animate-pulse">
                <BarChart3 size={48} />
              </div>
              <div className="max-w-xs">
                <h2 className="text-2xl font-black text-white mb-2">Sentiment Analysis</h2>
                <p className="text-sm font-medium text-gray-400 leading-relaxed">
                  Enter a stock name or symbol to see the latest news and aggregate market sentiment.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default SentimentAnalysis;
