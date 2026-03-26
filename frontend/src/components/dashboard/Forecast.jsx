import React, { useState, useEffect } from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, ReferenceLine, ScatterChart, Scatter, Cell } from 'recharts';
import { LineChart as LucideLineChart, Search, Clock, Plus, X, TrendingUp, TrendingDown, Info, Briefcase, LayoutGrid } from 'lucide-react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const Forecast = () => {
  const location = useLocation();
  const [symbol, setSymbol] = useState('');
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [stocks, setStocks] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStock, setSelectedStock] = useState(null);
  const [predictionDays, setPredictionDays] = useState(7);
  const [kmeansData, setKmeansData] = useState(null);
  const [kmeansLoading, setKmeansLoading] = useState(false);
  const [kmeansError, setKmeansError] = useState(null);

  const [portfolios, setPortfolios] = useState([]);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);

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

  const handleInputChange = (e) => {
    const value = e.target.value;
    setSymbol(value);
    setSelectedStock(null);
    setData(null);
    setSelectedPortfolio(null);
    setKmeansData(null);
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
    if (!portfolioId) {
      setSelectedPortfolio(null);
      setData(null);
      return;
    }
    const portfolio = portfolios.find(p => p.id.toString() === portfolioId);
    setSelectedPortfolio(portfolio);
    setSymbol('');
    setSelectedStock(null);
    setData(null);
    setKmeansData(null);
    setSuggestions([]);
    handlePortfolioSearch(portfolio, predictionDays);
  };

  const handleKMeansSearch = async (searchSymbol, days) => {
    if (!searchSymbol) return;
    setKmeansLoading(true);
    setKmeansError(null);
    try {
      const response = await fetch(`http://localhost:8000/api/stocks/kmeans/${searchSymbol}/?days=${days}`);
      if (response.ok) {
        const result = await response.json();
        setKmeansData(result);
      } else {
        const errResult = await response.json();
        setKmeansError(errResult.error || 'Clustering failed');
      }
    } catch (err) {
      console.error('K-Means fetch error:', err);
      setKmeansError('Connection error to ML service');
    } finally {
      setKmeansLoading(false);
    }
  };

  const handlePortfolioSearch = async (portfolio, days) => {
    if (!portfolio || !portfolio.items || portfolio.items.length === 0) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const promises = portfolio.items.map(item =>
        fetch(`http://localhost:8000/api/stocks/forecast/${item.stock.symbol}/?days=${days}`).then(res => res.json())
      );

      const results = await Promise.all(promises);

      // Check if any failed
      if (results.some(r => r.error)) {
        throw new Error('Failed to fetch forecast for one or more stocks in the portfolio');
      }

      // Aggregate historical and forecast data
      const aggregate = (dataKey) => {
        const aggregatedMap = {};

        results.forEach((res, idx) => {
          const quantity = portfolio.items[idx].quantity;
          res[dataKey].forEach(point => {
            if (!aggregatedMap[point.date]) {
              aggregatedMap[point.date] = 0;
            }
            aggregatedMap[point.date] += point.price * quantity;
          });
        });

        return Object.entries(aggregatedMap)
          .sort((a, b) => new Date(a[0]) - new Date(b[0]))
          .map(([date, price]) => ({
            date,
            price,
            isForecast: dataKey === 'forecast'
          }));
      };

      const historicalAgg = aggregate('historical');
      const forecastAgg = aggregate('forecast');

      const lastHistorical = historicalAgg[historicalAgg.length - 1];
      const combined = [
        ...historicalAgg.map(d => ({ ...d, type: 'Historical' })),
        { ...lastHistorical, type: 'Forecast' },
        ...forecastAgg.map(d => ({ ...d, type: 'Forecast' }))
      ];

      setData({
        combined,
        splitDate: lastHistorical.date,
        historical: historicalAgg,
        forecast: forecastAgg,
        isPortfolio: true
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSuggestionClick = (stock) => {
    setSymbol(stock.name);
    setSelectedStock(stock);
    setSuggestions([]);
    setSelectedPortfolio(null);
    setKmeansData(null); // Clear previous data
    handleSearch(stock.symbol, predictionDays);
    handleKMeansSearch(stock.symbol, predictionDays);
  };

  useEffect(() => {
    if (location.state && location.state.symbol && stocks.length > 0) {
      const stock = stocks.find(s => s.symbol === location.state.symbol);
      if (stock) {
        handleSuggestionClick(stock);
      }
    } else if (location.state && location.state.portfolio) {
      setSelectedPortfolio(location.state.portfolio);
      handlePortfolioSearch(location.state.portfolio, predictionDays);
    }
  }, [location.state, stocks]);

  const handleSearch = async (searchSymbol, days) => {
    if (!searchSymbol) return;
    setLoading(true);
    setError(null);
    setData(null);

    try {
      const response = await fetch(`http://localhost:8000/api/stocks/forecast/${searchSymbol}/?days=${days}`);
      if (!response.ok) {
        throw new Error('Stock not found or prediction failed');
      }
      const result = await response.json();

      // Combine historical and forecast for the chart
      const lastHistorical = result.historical[result.historical.length - 1];
      const combined = [
        ...result.historical.map(d => ({ ...d, type: 'Historical' })),
        // Add a connector point
        { ...lastHistorical, type: 'Forecast' },
        ...result.forecast.map(d => ({ ...d, type: 'Forecast' }))
      ];

      setData({
        combined,
        splitDate: lastHistorical.date,
        historical: result.historical,
        forecast: result.forecast
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDurationChange = (e) => {
    const days = parseInt(e.target.value);
    setPredictionDays(days);
    if (selectedStock) {
      setData(null); // Clear forecast data
      setKmeansData(null); // Clear kmeans data
      handleSearch(selectedStock.symbol, days);
      handleKMeansSearch(selectedStock.symbol, days);
    } else if (selectedPortfolio) {
      handlePortfolioSearch(selectedPortfolio, days);
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      const item = payload[0].payload;
      const dateObj = new Date(label);
      const formattedDate = dateObj.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });

      return (
        <div className="bg-secondary-dark/95 p-4 border border-white/10 shadow-2xl rounded-2xl text-white">
          <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">
            {formattedDate}
          </p>
          <div className="flex items-baseline space-x-2">
            <p className={`text-2xl font-black ${item.isForecast ? 'text-[#facc15]' : 'text-white'}`}>
              ${Number(item.price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
          <div className="mt-2 flex items-center">
            <div className={`w-2.5 h-2.5 rounded-full mr-2 ${item.isForecast ? 'bg-[#facc15] animate-pulse' : 'bg-white'}`}></div>
            <p className="text-[10px] font-black uppercase tracking-tighter text-gray-400">
              {item.isForecast ? 'AI Prediction' : 'Market Price'}
            </p>
          </div>
        </div>
      );
    }
    return null;
  };

  const calculateChange = () => {
    if (!data || !data.forecast || !data.historical) return null;
    const currentPrice = data.historical[data.historical.length - 1].price;
    const predictedPrice = data.forecast[data.forecast.length - 1].price;
    const change = ((predictedPrice - currentPrice) / currentPrice) * 100;
    return {
      value: Math.abs(change).toFixed(2),
      isPositive: change >= 0
    };
  };

  const changeStats = calculateChange();

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
      <header className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-extrabold">Forecast</h1>
          <p className="text-gray-400 mt-2 font-semibold italic">Welcome to Forecasting! Predict the future of your favorite stocks with AI.</p>
        </div>
      </header>

      <div className="flex flex-col lg:flex-row gap-8 mb-8">
        {/* Search and Filters */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div className="glass-panel p-6 border border-white/5">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <Briefcase size={14} className="mr-2" /> Select Portfolio
            </h2>
            <select
              value={selectedPortfolio ? selectedPortfolio.id : ''}
              onChange={handlePortfolioChange}
              className="w-full glass-input px-5 py-4 text-sm font-bold appearance-none cursor-pointer"
            >
              <option value="">Choose a portfolio...</option>
              {portfolios.map(portfolio => (
                <option key={portfolio.id} value={portfolio.id}>
                  {portfolio.name}
                </option>
              ))}
            </select>
          </div>

          <div className="glass-panel p-6 border border-white/5 relative z-10">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <Search size={14} className="mr-2" /> Stock Search
            </h2>
            <div className="relative">
              <input
                type="text"
                value={symbol}
                onChange={handleInputChange}
                disabled={!!selectedPortfolio}
                placeholder={selectedPortfolio ? "Clear portfolio to search" : "Enter stock name or symbol..."}
                className={`w-full glass-input px-5 py-4 text-sm font-bold transition-all ${selectedPortfolio ? 'opacity-50 cursor-not-allowed' : ''}`}
              />
              {suggestions.length > 0 && (
                <ul className="absolute z-20 w-full bg-secondary-dark border border-white/10 rounded-2xl mt-2 shadow-2xl max-h-60 overflow-y-auto custom-scrollbar">
                  {suggestions.map(stock => (
                    <li
                      key={stock.id}
                      onClick={() => handleSuggestionClick(stock)}
                      className="px-5 py-3 cursor-pointer hover:bg-white/5 transition-colors flex justify-between items-center group border-b border-white/5 last:border-0"
                    >
                      <div>
                        <p className="text-sm font-bold text-white group-hover:text-light-accent">{stock.name}</p>
                        <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">{stock.symbol}</p>
                      </div>
                      <Plus size={14} className="text-gray-300 group-hover:text-purple-500" />
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="glass-panel p-6 border border-white/5">
            <h2 className="text-sm font-black text-gray-400 uppercase tracking-widest mb-4 flex items-center">
              <Clock size={14} className="mr-2" /> Prediction Period
            </h2>
            <select
              value={predictionDays}
              onChange={handleDurationChange}
              className="w-full glass-input px-5 py-4 text-sm font-bold appearance-none cursor-pointer"
            >
              <option value={7}>7 Days (Next Week)</option>
              <option value={30}>1 Month</option>
              <option value={180}>6 Months</option>
              <option value={365}>1 Year</option>
            </select>
          </div>

          {selectedStock && (
            <div className="glass-panel p-8 rounded-[2.5rem] text-white shadow-xl bg-purple-900/30 border border-purple-500/20">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80 text-white">Active Analysis</p>
              <h3 className="text-3xl font-black mb-1">{selectedStock.symbol}</h3>
              <p className="text-sm font-bold opacity-90 mb-6">{selectedStock.name}</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black">${Number(selectedStock.current_price).toFixed(2)}</span>
                <span className="text-xs font-bold opacity-80 uppercase tracking-widest">{selectedStock.currency}</span>
              </div>
            </div>
          )}

          {selectedPortfolio && (
            <div className="glass-panel p-8 rounded-[2.5rem] text-white shadow-xl bg-white/5 border border-white/10">
              <p className="text-[10px] font-black uppercase tracking-[0.2em] mb-2 opacity-80 text-white">Portfolio Analysis</p>
              <h3 className="text-3xl font-black mb-1">{selectedPortfolio.name}</h3>
              <p className="text-sm font-bold opacity-90 mb-6">{selectedPortfolio.items.length} Assets in Portfolio</p>
              <div className="flex items-baseline space-x-2">
                <span className="text-4xl font-black">
                  ${data?.historical ? Number(data.historical[data.historical.length - 1].price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '...'}
                </span>
                <span className="text-xs font-bold opacity-80 uppercase tracking-widest">Total Value</span>
              </div>
            </div>
          )}
        </div>

        {/* Chart Area */}
        <div className="w-full lg:w-2/3">
          <div className="glass-panel p-8 min-h-[500px] flex flex-col border border-white/5">
            {loading ? (
              <div className="flex-1 flex flex-col items-center justify-center space-y-4">
                <div className="w-12 h-12 border-4 border-purple-100 border-t-purple-600 rounded-full animate-spin"></div>
                <p className="text-sm font-black text-gray-400 uppercase tracking-widest">Training AI Model...</p>
              </div>
            ) : error ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <div className="bg-red-50 text-red-500 p-4 rounded-full mb-4">
                  <X size={32} />
                </div>
                <p className="text-lg font-bold text-gray-900 mb-2">Prediction Failed</p>
                <p className="text-sm text-gray-500 max-w-xs">{error}</p>
              </div>
            ) : data ? (
              <>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h3 className="text-xl font-black text-white">
                      {selectedPortfolio ? `${selectedPortfolio.name} Forecast` : 'Price Prediction Chart'}
                    </h3>
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                      {selectedPortfolio ? 'Aggregate Portfolio Value Projection' : 'Historical vs AI Forecasted Prices'}
                    </p>
                  </div>
                  {changeStats && (
                    <div className={`px-5 py-2.5 rounded-2xl flex items-center space-x-2 shadow-sm border ${changeStats.isPositive ? 'bg-green-500/10 text-green-400 border-green-500/20' : 'bg-red-500/10 text-red-400 border-red-500/20'}`}>
                      {changeStats.isPositive ? <TrendingUp size={18} /> : <TrendingDown size={18} />}
                      <span className="text-base font-black uppercase tracking-tighter">
                        {changeStats.isPositive ? '+' : '-'}{changeStats.value}% Predicted
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <ResponsiveContainer width="100%" height={400}>
                    <AreaChart data={data.combined}>
                      <defs>
                        <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#535C91" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#1B1A55" stopOpacity={0} />
                        </linearGradient>
                        <linearGradient id="colorForecast" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#facc15" stopOpacity={0.4} />
                          <stop offset="95%" stopColor="#1B1A55" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                      <XAxis
                        dataKey="date"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9290C3', fontSize: 11, fontWeight: 700, opacity: 0.7 }}
                        minTickGap={30}
                        tickFormatter={(str) => {
                          const date = new Date(str);
                          return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fill: '#9290C3', fontSize: 11, fontWeight: 700, opacity: 0.7 }}
                        domain={['auto', 'auto']}
                        tickFormatter={(val) => `$${val}`}
                      />
                      <Tooltip content={<CustomTooltip />} />
                      <ReferenceLine
                        x={data.splitDate}
                        stroke="#9290C3"
                        strokeWidth={2}
                        strokeDasharray="4 4"
                        opacity={0.5}
                        label={{ value: 'NOW', position: 'top', fill: '#9290C3', fontSize: 10, fontWeight: 900, opacity: 0.8 }}
                      />

                      {/* Glow effects (duplicate lines rendered underneath) */}
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#535C91"
                        strokeWidth={12}
                        fill="none"
                        opacity={0.15}
                        dot={false}
                        data={data.combined.filter(d => !d.isForecast)}
                        isAnimationActive={true}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#facc15"
                        strokeWidth={12}
                        fill="none"
                        opacity={0.15}
                        dot={false}
                        data={data.combined.filter(d => d.isForecast)}
                        isAnimationActive={true}
                      />

                      {/* Main lines and areas */}
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#535C91"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorPrice)"
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 0, fill: '#535C91' }}
                        data={data.combined.filter(d => !d.isForecast)}
                        isAnimationActive={true}
                      />
                      <Area
                        type="monotone"
                        dataKey="price"
                        stroke="#facc15"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorForecast)"
                        dot={false}
                        activeDot={{ r: 6, strokeWidth: 2, stroke: '#1B1A55', fill: '#facc15' }}
                        data={data.combined.filter(d => d.isForecast)}
                        isAnimationActive={true}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {kmeansLoading ? (
                  <div className="mt-8 flex flex-col items-center justify-center space-y-4 p-8 glass-panel border border-white/5">
                    <div className="w-8 h-8 border-3 border-green-100 border-t-green-500 rounded-full animate-spin"></div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Running K-Means Clustering...</p>
                  </div>
                ) : kmeansError ? (
                  <div className="mt-8 p-6 glass-panel border border-red-500/20 bg-red-500/5 text-center">
                    <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Pattern Analysis Unavailable</p>
                    <p className="text-[10px] text-gray-400">{kmeansError}</p>
                  </div>
                ) : kmeansData && (
                  <div className="mt-8">
                    <div className="flex justify-between items-center mb-6">
                      <div>
                        <h3 className="text-xl font-black text-white flex items-center">
                          <LayoutGrid size={20} className="mr-2 text-[#4ade80]" />
                          K-Means Price Clustering
                        </h3>
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                          Identifying price patterns using unsupervised learning
                        </p>
                      </div>
                      <div className="flex space-x-4">
                        {[
                          { label: 'Stable', color: '#4ade80' },
                          { label: 'Volatile', color: '#f87171' },
                          { label: 'Growth', color: '#60a5fa' }
                        ].map((cluster, i) => (
                          <div key={i} className="flex items-center space-x-1">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cluster.color }}></div>
                            <span className="text-[10px] font-bold text-gray-400 uppercase">{cluster.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div className="glass-panel p-6 bg-white/5 border border-white/5 h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                          <XAxis 
                            dataKey="date" 
                            name="Date" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9290C3', fontSize: 10, fontWeight: 700, opacity: 0.6 }}
                            tickFormatter={(str) => {
                              const date = new Date(str);
                              return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                            }}
                          />
                          <YAxis 
                            dataKey="price" 
                            name="Price" 
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#9290C3', fontSize: 10, fontWeight: 700, opacity: 0.6 }}
                            domain={['auto', 'auto']}
                            tickFormatter={(val) => `$${val}`}
                          />
                          <Tooltip 
                            cursor={{ strokeDasharray: '3 3' }}
                            content={({ active, payload }) => {
                              if (active && payload && payload.length) {
                                const data = payload[0].payload;
                                const colors = ['#4ade80', '#f87171', '#60a5fa'];
                                return (
                                  <div className="bg-secondary-dark/95 p-3 border border-white/10 shadow-2xl rounded-xl text-white">
                                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">
                                      {new Date(data.date).toLocaleDateString()}
                                    </p>
                                    <p className="text-lg font-black" style={{ color: colors[data.cluster % 3] }}>
                                      ${data.price.toFixed(2)}
                                    </p>
                                    <p className="text-[10px] font-bold opacity-60 uppercase">Cluster {data.cluster + 1}</p>
                                  </div>
                                );
                              }
                              return null;
                            }}
                          />
                          <Scatter name="Price Points" data={kmeansData.clusters}>
                            {kmeansData.clusters.map((entry, index) => {
                              const colors = ['#4ade80', '#f87171', '#60a5fa'];
                              return <Cell key={`cell-${index}`} fill={colors[entry.cluster % 3]} />;
                            })}
                          </Scatter>
                        </ScatterChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                )}

                <div className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="glass-panel p-6 bg-white/5 border border-white/5 flex items-start space-x-4">
                    <div className="bg-secondary-dark p-3 rounded-2xl text-[#facc15] shadow-sm border border-white/10">
                      <LucideLineChart size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-[#facc15] uppercase tracking-widest">AI Forecast Insight</h4>
                      <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                        {data.isPortfolio ? 'Predicted Portfolio Value: ' : 'Predicted price: '}
                        <span className="font-bold text-white">${Number(data.forecast[data.forecast.length - 1].price).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                        <br />
                        Target Date: <span className="font-bold text-white">{new Date(data.forecast[data.forecast.length - 1].date).toLocaleDateString()}</span>
                      </p>
                    </div>
                  </div>

                  <div className="glass-panel p-6 bg-white/5 border border-white/5 flex items-start space-x-4">
                    <div className="bg-secondary-dark p-3 rounded-2xl text-gray-400 shadow-sm border border-white/10">
                      <Info size={20} />
                    </div>
                    <div>
                      <h4 className="text-sm font-black text-white uppercase tracking-widest">Confidence Analysis</h4>
                      <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                        Model using Monte Carlo simulation with historical volatility.
                        Expected move of <span className="font-bold text-[#facc15]">{changeStats.value}%</span> over the next {predictionDays} days.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center h-full space-y-6">
                <div className="w-32 h-32 bg-secondary-dark/80 rounded-full flex items-center justify-center text-[#facc15] relative animate-pulse border border-white/5">
                  <LucideLineChart size={64} />
                  <div className="absolute inset-0 border-2 border-[#facc15]/30 rounded-full animate-ping"></div>
                </div>
                <div className="max-w-xs">
                  <h2 className="text-2xl font-black text-white mb-2">Ready to Forecast?</h2>
                  <p className="text-sm font-medium text-gray-400 leading-relaxed">
                    Search for a stock on the left and select your desired prediction window to generate an AI-driven price forecast.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Forecast;
