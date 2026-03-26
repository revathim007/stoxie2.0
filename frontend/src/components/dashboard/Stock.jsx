
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Search, ArrowUpRight, TrendingUp, RefreshCw, BarChart3, Percent, DollarSign, IndianRupee, Plus, Check, Download } from 'lucide-react';
import { AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

const Stock = () => {
  const [loading, setLoading] = useState(false);
  const [addingToCollection, setAddingToCollection] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [historyData, setHistoryData] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState(null);
  const [isInCollection, setIsInCollection] = useState(false);
  const [period, setPeriod] = useState('1y');

  const checkIfInCollection = async (stockId) => {
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const response = await axios.get(`http://localhost:8000/api/stocks/collections/?user_id=${userData.id}`);
      const alreadyAdded = response.data.some(item => item.stock.id === stockId);
      setIsInCollection(alreadyAdded);
    } catch (error) {
      console.error('Error checking collection:', error);
    }
  };

  const handleAddToCollection = async () => {
    if (!selectedStock || isInCollection) return;
    
    setAddingToCollection(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      await axios.post('http://localhost:8000/api/stocks/collections/', {
        user_id: userData.id,
        stock_id: selectedStock.id
      });
      setIsInCollection(true);
      alert(`${selectedStock.symbol} added to your collections!`);
    } catch (error) {
      console.error('Error adding to collection:', error);
      alert('Failed to add stock to collection.');
    } finally {
      setAddingToCollection(false);
    }
  };

  const fetchStockDetails = async (stock, selectedPeriod) => {
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const historyRes = await axios.get(`http://localhost:8000/api/stocks/history/${stock.symbol}/?period=${selectedPeriod}`);
      setHistoryData(historyRes.data);
      
      // Fallback for live price display if DB value is missing
      if (historyRes.data.length > 0 && (!stock.current_price || stock.current_price === null)) {
        const latestRow = historyRes.data[historyRes.data.length - 1];
        setSelectedStock(prev => prev ? { ...prev, current_price: latestRow.close } : prev);
      }

      await checkIfInCollection(stock.id);
    } catch (error) {
      console.error('Error fetching stock history:', error);
      setHistoryError('Could not load chart data. Please try a different stock or period.');
    } finally {
      setHistoryLoading(false);
    }
  };

  useEffect(() => {
    if (selectedStock) {
      fetchStockDetails(selectedStock, period);
    }
  }, [selectedStock, period]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (searchQuery.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await axios.get(`http://localhost:8000/api/stocks/?search=${searchQuery}`);
        setSuggestions(response.data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    const timer = setTimeout(() => {
      if (showSuggestions) {
        fetchSuggestions();
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, showSuggestions]);

  const executeSearch = async (query) => {
    if (!query.trim()) return;

    setLoading(true);
    setShowSuggestions(false);
    setHistoryData([]); // Reset history for new search
    try {
      const response = await axios.get(`http://localhost:8000/api/stocks/?search=${query}`);
      if (response.data.length > 0) {
        const stock = response.data[0];
        setSelectedStock(stock);
      } else {
        setSelectedStock(null);
        setIsInCollection(false);
        alert('Stock not found in our database');
      }
    } catch (error) {
      console.error('Search error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    executeSearch(searchQuery);
  };

  const handleSuggestionClick = (stock) => {
    setSearchQuery(stock.name); // Update input to reflect selection
    executeSearch(stock.symbol); // Search by symbol for accuracy
  };

  const getCurrencyIcon = (currency) => {
    if (currency === 'USD') return <DollarSign size={20} className="mr-1" />;
    return <IndianRupee size={20} className="mr-1" />;
  };

  const formatCurrency = (value, currency) => {
    const symbol = currency === 'USD' ? '$' : '₹';
    return `${symbol}${parseFloat(value).toLocaleString(currency === 'USD' ? 'en-US' : 'en-IN')}`;
  };

  const handleDownloadReport = async () => {
    const element = document.getElementById('stock-report-content');
    if (!element) return;
    
    try {
      // 1. Define the PDF generation with onclone to handle unsupported CSS
      const canvas = await html2canvas(element, {
        scale: 2,
        backgroundColor: '#0B0F19',
        useCORS: true,
        logging: false,
        onclone: (clonedDoc) => {
          const clonedElement = clonedDoc.getElementById('stock-report-content');
          if (!clonedElement) return;

          // Force a dark background on the cloned container
          clonedElement.style.backgroundColor = '#0B0F19';
          clonedElement.style.padding = '20px';

          // Fix for "oklab" / "oklch" error in html2canvas
          // We recursively find and replace these modern colors with fallbacks in the cloned DOM
          const allElements = clonedElement.querySelectorAll('*');
          allElements.forEach(el => {
            const style = window.getComputedStyle(el);
            
            // Helper to check if a value contains modern color functions
            const isModernColor = (val) => val && (val.includes('oklch') || val.includes('oklab'));

            if (isModernColor(style.color)) {
              el.style.setProperty('color', 'white', 'important');
            }
            if (isModernColor(style.backgroundColor)) {
              el.style.setProperty('background-color', 'transparent', 'important');
            }
            if (isModernColor(style.borderColor)) {
              el.style.setProperty('border-color', 'rgba(255,255,255,0.1)', 'important');
            }
            if (isModernColor(style.fill)) {
              el.style.setProperty('fill', 'white', 'important');
            }
            if (isModernColor(style.stroke)) {
              el.style.setProperty('stroke', 'white', 'important');
            }
          });
        }
      });
      
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;
      
      let heightLeft = pdfHeight;
      let position = 0;
      const pageHeight = pdf.internal.pageSize.getHeight();
      
      pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
      heightLeft -= pageHeight;
      
      while (heightLeft >= 0) {
        position = heightLeft - pdfHeight;
        pdf.addPage();
        pdf.addImage(imgData, 'PNG', 0, position, pdfWidth, pdfHeight);
        heightLeft -= pageHeight;
      }
      
      pdf.save(`${selectedStock.symbol}_EDA_Report.pdf`);
    } catch (error) {
      console.error('Error generating PDF:', error);
      alert('Failed to generate PDF report.');
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto text-white">
      <header className="mb-8">
        <h1 className="text-4xl font-extrabold tracking-tight">Market Insights</h1>
        <p className="text-gray-400 mt-2 font-medium">Search for any stock to view its historical data and key metrics.</p>
      </header>

      <div className="flex flex-col space-y-8">
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="w-full flex gap-3 relative">
          <div className="flex-1 relative group">
            <div className="absolute inset-y-0 left-0 pl-5 flex items-center pointer-events-none">
              <Search className="text-gray-400 group-focus-within:text-light-accent transition-colors" size={22} />
            </div>
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
              placeholder="Search by Symbol (e.g. RELIANCE, AAPL) or Company Name..." 
              className="glass-input w-full pl-14 pr-4 py-5 font-semibold text-lg"
            />
            
            {/* Suggestions Dropdown */}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute z-50 w-full mt-2 bg-secondary-dark/90 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl max-h-80 overflow-y-auto animate-in fade-in zoom-in-95 duration-200">
                {suggestions.map((stock) => (
                  <div 
                    key={stock.id}
                    onClick={() => handleSuggestionClick(stock)}
                    className="p-5 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0 flex justify-between items-center group"
                  >
                    <div className="flex flex-col">
                      <span className="font-black text-white group-hover:text-light-accent text-lg">{stock.symbol.split('.')[0]}</span>
                      <span className="text-sm text-gray-400 font-bold uppercase">{stock.name}</span>
                    </div>
                    <div className="flex items-center space-x-4">
                      <span className="text-sm font-black text-white">
                        {formatCurrency(stock.current_price, stock.currency)}
                      </span>
                      <ArrowUpRight size={20} className="text-gray-500 group-hover:text-light-accent transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
          <button 
            type="submit"
            disabled={loading}
            className="glass-button px-10 py-5 font-extrabold uppercase hover:glass-button-active active:scale-95 disabled:opacity-50"
          >
            {loading ? <RefreshCw className="animate-spin" /> : 'SEARCH'}
          </button>
        </form>

        {selectedStock ? (
          <div id="stock-report-content" className="grid grid-cols-1 gap-8 animate-in zoom-in-95 duration-500">
            {/* Top Metrics Row */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {/* Stock Identity & Price */}
              <div className="md:col-span-2 glass-panel p-8 flex flex-col justify-between">
                <div>
                  <div className="flex items-center space-x-3 mb-2">
                    <span className="px-3 py-1 bg-medium-tone/20 text-light-accent text-xs font-black rounded-lg uppercase tracking-widest border border-light-accent/10">{selectedStock.symbol}</span>
                    <span className="text-gray-400 font-bold text-sm">{selectedStock.exchange}</span>
                  </div>
                  <h2 className="text-3xl font-black text-white leading-tight">{selectedStock.name}</h2>
                  <p className="text-gray-400 font-bold mt-1 tracking-tighter">{selectedStock.sector ? selectedStock.sector.toLowerCase() : ''}</p>
                </div>
                <div className="mt-8 flex justify-between items-end">
                  <div>
                    <div className="flex items-baseline">
                      <span className="text-5xl font-black text-white tracking-tighter">
                        {formatCurrency(selectedStock.current_price, selectedStock.currency)}
                      </span>
                    </div>
                    <div className="flex items-center text-green-400 font-bold mt-2">
                      <TrendingUp size={20} className="mr-2" />
                      <span>Live Market Price</span>
                    </div>
                  </div>
                  
                  {/* Add to Collection Button */}
                  <button
                    onClick={handleAddToCollection}
                    disabled={addingToCollection || isInCollection}
                    className={`flex items-center space-x-2 px-6 py-3 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                      isInCollection 
                        ? 'bg-light-accent/10 text-light-accent cursor-default border border-light-accent/20' 
                        : 'glass-button hover:glass-button-active'
                    }`}
                  >
                    {addingToCollection ? (
                      <RefreshCw size={16} className="animate-spin" />
                    ) : isInCollection ? (
                      <>
                        <Check size={16} />
                        <span>Added</span>
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        <span>Add</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* PE Ratio */}
              <div className="glass-panel p-8 flex flex-col items-center justify-center text-center">
                <div className="bg-blue-900/30 text-blue-400 p-4 rounded-2xl mb-4 border border-blue-500/20">
                  <BarChart3 size={32} />
                </div>
                <h4 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">PE Ratio</h4>
                <div className="text-4xl font-black text-white">
                  {selectedStock.pe_ratio ? parseFloat(selectedStock.pe_ratio).toFixed(2) : 'N/A'}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-bold px-4">Price-to-Earnings Multiplier</p>
              </div>

              {/* Discount Ratio */}
              <div className="glass-panel p-8 flex flex-col items-center justify-center text-center">
                <div className="bg-purple-900/30 text-purple-400 p-4 rounded-2xl mb-4 border border-purple-500/20">
                  <Percent size={32} />
                </div>
                <h4 className="text-gray-400 text-xs font-black uppercase tracking-widest mb-2">Discount Ratio</h4>
                <div className={`text-4xl font-black ${selectedStock.discount_ratio > 0 ? 'text-green-400' : 'text-red-400'}`}>
                  {selectedStock.discount_ratio ? `${parseFloat(selectedStock.discount_ratio).toFixed(2)}%` : 'N/A'}
                </div>
                <p className="text-[10px] text-gray-500 mt-2 font-bold px-4">Difference from Target Price</p>
              </div>
            </div>

            {/* EDA Charts */}
            <div className="glass-panel p-10">
              <div className="flex justify-between items-center mb-10">
                <div>
                  <h3 className="text-2xl font-black text-white">Exploratory Data Analysis</h3>
                  <p className="text-gray-400 font-medium text-sm">Historical data for {selectedStock.symbol}</p>
                </div>
                <div className="flex items-center space-x-4" data-html2canvas-ignore="true">
                  <button
                    onClick={handleDownloadReport}
                    className="flex items-center space-x-2 px-6 py-2 rounded-xl font-bold text-xs uppercase tracking-widest glass-button hover:glass-button-active transition-all"
                  >
                    <Download size={16} />
                    <span>Download Report</span>
                  </button>
                  <select
                    value={period}
                    onChange={(e) => setPeriod(e.target.value)}
                    className="glass-input px-4 py-2"
                  >
                    <option value="7d" className="bg-secondary-dark">7 Days</option>
                    <option value="1mo" className="bg-secondary-dark">1 Month</option>
                    <option value="6mo" className="bg-secondary-dark">6 Months</option>
                    <option value="1y" className="bg-secondary-dark">1 Year</option>
                    <option value="5y" className="bg-secondary-dark">5 Years</option>
                  </select>
                </div>
              </div>
              
              <div className="h-[600px] w-full">
                {historyLoading ? (
                  <div className="h-full flex flex-col items-center justify-center text-gray-400 font-bold space-y-4">
                    <RefreshCw className="animate-spin text-light-accent" size={40} />
                    <span className="animate-pulse">Analyzing Market Trends...</span>
                  </div>
                ) : historyError ? (
                  <div className="h-full flex flex-col items-center justify-center text-red-400 font-bold space-y-2">
                    <BarChart3 size={48} />
                    <span>{historyError}</span>
                  </div>
                ) : historyData.length > 0 ? (
                  <>
                    <ResponsiveContainer width="100%" height="70%">
                      <LineChart data={historyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#9ca3af', fontSize: 10, fontStyle: 'normal'}} 
                          dy={15}
                          interval={Math.ceil(historyData.length / 7)}
                        />
                        <YAxis 
                          hide={true} 
                          domain={['dataMin * 0.95', 'dataMax * 1.05']} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: '#1B1A55',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px', 
                            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                            padding: '16px',
                            fontWeight: '800',
                            color: '#FFFFFF'
                          }}
                        />
                        <Legend />
                        <Line type="monotone" dataKey="close" stroke="#10b981" name="Close" strokeWidth={2} dot={false} />
                        <Line type="monotone" dataKey="ma20" stroke="#3b82f6" name="20-Day MA" strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="ma50" stroke="#8b5cf6" name="50-Day MA" strokeDasharray="5 5" dot={false} />
                        <Line type="monotone" dataKey="ma200" stroke="#f59e0b" name="200-Day MA" strokeDasharray="5 5" dot={false} />
                      </LineChart>
                    </ResponsiveContainer>
                    <ResponsiveContainer width="100%" height="30%">
                      <BarChart data={historyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.05)" />
                        <XAxis 
                          dataKey="date" 
                          axisLine={false} 
                          tickLine={false} 
                          tick={{fill: '#9ca3af', fontSize: 10}} 
                          dy={15}
                          interval={Math.ceil(historyData.length / 7)}
                        />
                        <YAxis 
                          hide={true} 
                          domain={['dataMin', 'dataMax * 2']} 
                        />
                        <Tooltip 
                          contentStyle={{ 
                            background: '#1B1A55',
                            border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '16px', 
                            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.25)',
                            padding: '16px',
                            fontWeight: '800',
                            color: '#FFFFFF'
                          }}
                        />
                        <Legend />
                        <Bar dataKey="volume" fill="rgba(146, 144, 195, 0.4)" name="Volume" />
                      </BarChart>
                    </ResponsiveContainer>
                  </>
                ) : (
                  <div className="h-full flex flex-col items-center justify-center text-gray-500 font-bold space-y-2">
                    <BarChart3 size={48} className="opacity-40" />
                    <span>No historical data available for this period.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div className="glass-panel p-20 flex flex-col items-center justify-center text-center">
            <div className="bg-secondary-dark/50 p-8 rounded-full mb-6 border border-white/5">
              <Search size={64} className="text-light-accent/60" />
            </div>
            <h3 className="text-2xl font-black text-white mb-2">Start Your Analysis</h3>
            <p className="text-gray-400 max-w-xs mt-2 font-medium">Enter a stock ticker or name above to see detailed insights and historical data.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Stock;
