import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useLocation } from 'react-router-dom';
import { Briefcase, Search, Plus, X, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, IndianRupee } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, Cell } from 'recharts';

const CreatePortfolioForm = ({ existingPortfolios, onPortfolioCreated, shouldHighlight }) => {
  const [portfolioName, setPortfolioName] = useState('');
  const [portfolioDescription, setPortfolioDescription] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!portfolioName.trim()) {
      alert('Please enter a portfolio name.');
      return;
    }

    const nameExists = existingPortfolios.some(
      (p) => p.name.toLowerCase() === portfolioName.trim().toLowerCase()
    );

    if (nameExists) {
      alert('same portfolio already exists');
      return;
    }

    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const payload = {
        name: portfolioName,
        description: portfolioDescription,
        user_id: userData.id
      };
      
      await axios.post('http://localhost:8000/api/stocks/portfolios/', payload);
      alert(`Portfolio "${portfolioName}" created successfully!`);
      
      setPortfolioName('');
      setPortfolioDescription('');
      onPortfolioCreated();
    } catch (error) {
      console.error('Error creating portfolio:', error);
      alert('Failed to create portfolio. Please try again.');
    }
  };

  return (
    <div className={`glass-panel p-6 transition-all duration-500 ${shouldHighlight ? 'form-highlight' : ''}`}>
      <h3 className="text-xl font-bold text-white mb-6 flex items-center">
        <Briefcase className="text-light-accent mr-2" size={24} />
        Create Portfolio
      </h3>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Portfolio Name</label>
          <input 
            type="text" 
            value={portfolioName}
            onChange={(e) => setPortfolioName(e.target.value)}
            placeholder="e.g. Retirement Fund" 
            className="glass-input w-full px-4 py-3"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-bold text-gray-300 mb-2">Portfolio Description</label>
          <textarea 
            value={portfolioDescription}
            onChange={(e) => setPortfolioDescription(e.target.value)}
            placeholder="e.g. Long-term growth stocks and high-dividend yields." 
            className="glass-input w-full px-4 py-3 min-h-[120px] resize-none"
          />
        </div>

        <button 
          type="submit"
          className="w-full glass-button py-4 font-extrabold uppercase tracking-wider hover:glass-button-active active:scale-95 mt-4"
        >
          Create Portfolio
        </button>
      </form>
    </div>
  );
};

const DashboardHome = () => {
  const location = useLocation();
  const [shouldHighlight, setShouldHighlight] = useState(false);
  const [stats, setStats] = useState({ 
    totalNetWorth: 0, 
    activePortfolios: 0, 
    totalPurchases: 0,
    profitLoss: 0,
    returnPercentage: 0,
    isProfit: false
  });
  const [existingPortfolios, setExistingPortfolios] = useState([]);
  const [purchaseHistory, setPurchaseData] = useState([]);
  const [barData, setBarData] = useState([]);

  // Animation CSS for the "moving" line
  const animationStyle = `
    @keyframes highlight-pulse {
      0% { box-shadow: 0 0 0 0 rgba(146, 144, 195, 0.4); border-color: rgba(146, 144, 195, 0.3); }
      50% { box-shadow: 0 0 30px 10px rgba(146, 144, 195, 0.6); border-color: rgba(146, 144, 195, 0.8); }
      100% { box-shadow: 0 0 0 0 rgba(146, 144, 195, 0.4); border-color: rgba(146, 144, 195, 0.3); }
    }
    .form-highlight {
      animation: highlight-pulse 2s infinite ease-in-out;
      position: relative;
      z-index: 10;
    }
    @keyframes dash {
      to {
        stroke-dashoffset: 0;
      }
    }
    @keyframes pulse-glow {
      0% { opacity: 0.3; filter: blur(2px); }
      50% { opacity: 0.6; filter: blur(4px); }
      100% { opacity: 0.3; filter: blur(2px); }
    }
    @keyframes grow-bar {
      from { transform: scaleY(0); transform-origin: bottom; }
      to { transform: scaleY(1); transform-origin: bottom; }
    }
  `;

  const fetchStats = async () => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      if (!userData) return;
      
      const [portfoliosRes, collectionsRes, purchasesRes] = await Promise.all([
        axios.get(`http://localhost:8000/api/stocks/portfolios/?user_id=${userData.id}`),
        axios.get(`http://localhost:8000/api/stocks/collections/?user_id=${userData.id}`),
        axios.get(`http://localhost:8000/api/stocks/purchases/?user_id=${userData.id}`)
      ]);

      const portfolios = portfoliosRes.data;
      setExistingPortfolios(portfolios);
      const collections = collectionsRes.data;
      const purchases = purchasesRes.data;
      
      // Total Net Worth = Sum of current prices of all collections
      let totalNetWorth = 0;
      collections.forEach(item => {
        totalNetWorth += parseFloat(item.stock.current_price || 0);
      });

      // Total Purchases = Sum of total_amount of all purchases
      let totalPurchases = 0;
      purchases.forEach(item => {
        totalPurchases += parseFloat(item.total_amount || 0);
      });

      // Calculate Profit/Loss and Return %
      const profitLoss = totalNetWorth - totalPurchases;
      const returnPercentage = totalPurchases > 0 ? (profitLoss / totalPurchases) * 100 : 0;
      const isProfit = profitLoss >= 0;

      // Calculate performance factor: Current Value / Total Invested
      const performanceFactor = totalPurchases > 0 ? (totalNetWorth / totalPurchases) : 1;

      // Prepare Chart Data: Comparison of Invested (Total Purchase Price) vs Net Worth over time
      const sortedPurchases = [...purchases].sort((a, b) => new Date(a.purchased_at) - new Date(b.purchased_at));
      
      let cumulativeInvested = 0;
      const chartData = sortedPurchases.map(p => {
        cumulativeInvested += parseFloat(p.total_amount);
        return {
          date: new Date(p.purchased_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
          invested: cumulativeInvested,
          netWorth: cumulativeInvested * performanceFactor,
          fullDate: new Date(p.purchased_at).toLocaleDateString()
        };
      });

      // Bar Chart Data: Current state comparison
      const currentBarData = [
        { name: 'Invested', value: totalPurchases, color: '#4ade80' },
        { name: 'Net Worth', value: totalNetWorth, color: isProfit ? '#60a5fa' : '#f87171' }
      ];
      setBarData(currentBarData);

      // If no purchases, add a dummy point
      if (chartData.length === 0) {
        chartData.push({ date: 'No Data', invested: 0, netWorth: 0 });
      }
      
      setPurchaseData(chartData);
      
      setStats({
        totalNetWorth,
        totalPurchases,
        activePortfolios: portfolios.length,
        profitLoss,
        returnPercentage,
        isProfit
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  useEffect(() => {
    fetchStats();
    
    // Check if we should highlight the create portfolio form
    if (location.state?.highlightCreatePortfolio) {
      setShouldHighlight(true);
      // Remove the highlight after 5 seconds
      const timer = setTimeout(() => setShouldHighlight(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [location.state]);

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 text-white">
      <style>{animationStyle}</style>
      <header className="mb-10 border-b border-white/5 pb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <h1 className="text-4xl font-extrabold tracking-tight">Dashboard</h1>
        
        <div className="flex flex-wrap gap-4">
          <div className="glass-panel px-6 py-4 flex flex-col min-w-[160px]">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Net worth</span>
            <span className="text-2xl font-black text-white mt-1">
              ₹{stats.totalNetWorth.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="glass-panel px-6 py-4 flex flex-col min-w-[160px]">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Total Purchase Price</span>
            <span className="text-2xl font-black text-white mt-1">
              ₹{stats.totalPurchases.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </span>
          </div>
          <div className="glass-panel px-6 py-4 flex flex-col min-w-[160px]">
            <span className="text-gray-400 text-xs font-bold uppercase tracking-wider">Active Portfolios</span>
            <span className="text-2xl font-black text-white mt-1">{stats.activePortfolios}</span>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-1">
          <CreatePortfolioForm 
            existingPortfolios={existingPortfolios} 
            onPortfolioCreated={fetchStats}
            shouldHighlight={shouldHighlight}
          />
        </div>

        <div className="lg:col-span-2">
          <div className="glass-panel p-8 min-h-[450px] flex flex-col">
            <div className="flex justify-between items-start mb-8">
              <div>
                <h3 className="text-xl font-black text-white flex items-center">
                  <TrendingUp size={20} className={`mr-2 ${stats.isProfit ? 'text-green-400' : 'text-red-400'}`} />
                  Growth Comparison
                </h3>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">
                  Net Worth vs. Total Invested
                </p>
              </div>
              <div className="flex gap-8">
                <div className="text-right">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Profit / Loss</span>
                  <span className={`text-lg font-black flex items-center justify-end ${stats.isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.isProfit ? <ArrowUpRight size={16} className="mr-1" /> : <ArrowDownRight size={16} className="mr-1" />}
                    ₹{Math.abs(stats.profitLoss).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="text-right border-l border-white/5 pl-8">
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest block">Returns</span>
                  <span className={`text-lg font-black ${stats.isProfit ? 'text-green-400' : 'text-red-400'}`}>
                    {stats.isProfit ? '+' : '-'}{Math.abs(stats.returnPercentage).toFixed(2)}%
                  </span>
                </div>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* Bar Chart Column */}
              <div className="md:col-span-1 h-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={barData} margin={{ top: 20, right: 0, left: 0, bottom: 0 }}>
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false}
                      tick={{ fill: '#9290C3', fontSize: 10, fontWeight: 700, opacity: 0.6 }}
                    />
                    <Tooltip 
                      cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      content={({ active, payload }) => {
                        if (active && payload && payload.length) {
                          const value = payload[0].value;
                          const name = payload[0].name;
                          // Heuristic: If value is very large, it's likely INR
                          const symbol = value > 100000 ? '₹' : '₹'; // Default to ₹ for aggregate stats
                          return (
                            <div className="bg-secondary-dark/95 p-3 border border-white/10 shadow-2xl rounded-xl text-white">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">{name}</p>
                              <p className="text-lg font-black" style={{ color: payload[0].payload.color }}>
                                {symbol}{value.toLocaleString()}
                              </p>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={40}>
                      {barData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ animation: 'grow-bar 1s ease-out' }} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>

              {/* Area Chart Column */}
              <div className="md:col-span-2 h-full min-h-[250px]">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={purchaseHistory}>
                    <defs>
                      <linearGradient id="colorNetWorth" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={stats.isProfit ? "#60a5fa" : "#f87171"} stopOpacity={0.3}>
                          <animate attributeName="stopOpacity" values="0.2; 0.4; 0.2" dur="4s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="95%" stopColor={stats.isProfit ? "#60a5fa" : "#f87171"} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="colorInvest" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#4ade80" stopOpacity={0.2}>
                          <animate attributeName="stopOpacity" values="0.1; 0.3; 0.1" dur="3s" repeatCount="indefinite" />
                        </stop>
                        <stop offset="95%" stopColor="#4ade80" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
                    <XAxis 
                      dataKey="date" 
                      axisLine={false}
                      tickLine={false}
                      tick={{ fill: '#9290C3', fontSize: 10, fontWeight: 700, opacity: 0.6 }}
                    />
                    <YAxis 
                      hide={true}
                      domain={['auto', 'auto']}
                    />
                    <Tooltip 
                      content={({ active, payload }) => {
                        if (active && payload && payload.length >= 2) {
                          const invested = payload.find(p => p.dataKey === 'invested');
                          const netWorth = payload.find(p => p.dataKey === 'netWorth');
                          // Default to ₹ for aggregate dashboard stats
                          const symbol = '₹'; 
                          return (
                            <div className="bg-secondary-dark/95 p-4 border border-white/10 shadow-2xl rounded-2xl text-white">
                              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 border-b border-white/5 pb-2">
                                {payload[0].payload.fullDate || 'Date'}
                              </p>
                              <div className="space-y-2">
                                <div className="flex justify-between gap-8 items-center">
                                  <span className="text-[10px] font-bold text-blue-400 uppercase">Net Worth</span>
                                  <span className="text-base font-black">{symbol}{netWorth?.value.toLocaleString() || 0}</span>
                                </div>
                                <div className="flex justify-between gap-8 items-center">
                                  <span className="text-[10px] font-bold text-green-400 uppercase">Invested</span>
                                  <span className="text-base font-black">{symbol}{invested?.value.toLocaleString() || 0}</span>
                                </div>
                              </div>
                            </div>
                          );
                        }
                        return null;
                      }}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="invested" 
                      stroke="#4ade80" 
                      strokeWidth={2}
                      fillOpacity={1} 
                      fill="url(#colorInvest)" 
                      animationDuration={1500}
                      strokeDasharray="5 5"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="netWorth" 
                      stroke={stats.isProfit ? "#60a5fa" : "#f87171"} 
                      strokeWidth={4}
                      fillOpacity={1} 
                      fill="url(#colorNetWorth)" 
                      animationDuration={2000}
                    />
                    {/* Decorative moving lines */}
                    <Area
                      type="monotone"
                      dataKey="netWorth"
                      stroke="#ffffff"
                      strokeWidth={1}
                      strokeDasharray="10 10"
                      fill="none"
                      style={{ 
                        animation: 'dash 15s linear infinite', 
                        strokeDashoffset: 1000,
                        opacity: 0.1
                      }}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
            <div className="mt-6 p-4 bg-white/5 rounded-2xl border border-white/5 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-xl ${stats.isProfit ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
                  {stats.isProfit ? <TrendingUp size={16} /> : <TrendingDown size={16} />}
                </div>
                <p className="text-xs font-medium text-gray-400">
                  {stats.isProfit 
                    ? `Great job! You are currently in profit by ₹${stats.profitLoss.toLocaleString()}.` 
                    : `Your portfolio is down by ₹${Math.abs(stats.profitLoss).toLocaleString()}. Consider diversifying more.`}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-1.5">
                  <div className={`w-2.5 h-2.5 rounded-full ${stats.isProfit ? 'bg-blue-400' : 'bg-red-400'}`}></div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Current Value</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-400"></div>
                  <span className="text-[10px] font-black text-gray-500 uppercase tracking-tighter">Invested Capital</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
