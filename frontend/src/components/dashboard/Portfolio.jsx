
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Briefcase, Layers, TrendingUp, Calendar, Trash2, Plus, Search, X } from 'lucide-react';

const Portfolio = () => {
  const [portfolios, setPortfolios] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedPortfolio, setSelectedPortfolio] = useState(null);
  const [stockSearch, setStockSearch] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [selectedStocks, setSelectedStocks] = useState([]);
  const [addingToCollection, setAddingToCollection] = useState({});
  const [portfolioSearch, setPortfolioSearch] = useState('');

  const fetchPortfolios = async () => {
    setLoading(true);
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      const portfoliosRes = await axios.get(`http://localhost:8000/api/stocks/portfolios/?user_id=${userData.id}`);
      setPortfolios(portfoliosRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPortfolios();
  }, []);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (stockSearch.length < 1) {
        setSuggestions([]);
        return;
      }
      try {
        const response = await axios.get(`http://localhost:8000/api/stocks/?search=${stockSearch}`);
        setSuggestions(response.data);
      } catch (error) {
        console.error('Error fetching suggestions:', error);
      }
    };

    const timer = setTimeout(() => {
      fetchSuggestions();
    }, 300);

    return () => clearTimeout(timer);
  }, [stockSearch]);

  const calculateTotalValue = (items) => {
    return items.reduce((sum, item) => sum + (parseFloat(item.stock.current_price || 0) * item.quantity), 0);
  };

  const handleOpenAddModal = (portfolio) => {
    setSelectedPortfolio(portfolio);
    setShowAddModal(true);
    setStockSearch('');
    setSelectedStocks([]);
  };

  const handleCloseAddModal = () => {
    setShowAddModal(false);
    setSelectedPortfolio(null);
    setStockSearch('');
    setSelectedStocks([]);
  };

  const addStockToSelected = (stock) => {
    if (!selectedStocks.find(s => s.id === stock.id)) {
      setSelectedStocks([...selectedStocks, { ...stock, quantity: 1 }]);
    }
    setStockSearch('');
  };

  const updateStockQuantity = (stockId, quantity) => {
    setSelectedStocks(selectedStocks.map(s => 
      s.id === stockId ? { ...s, quantity: parseInt(quantity) || 1 } : s
    ));
  };

  const removeStockFromSelected = (stockId) => {
    setSelectedStocks(selectedStocks.filter(s => s.id !== stockId));
  };

  const handleUpdatePortfolio = async () => {
    if (selectedStocks.length === 0) return;
    
    try {
      await axios.patch(`http://localhost:8000/api/stocks/portfolios/${selectedPortfolio.id}/`, {
        stocks_data: selectedStocks.map(s => ({
          stock_id: s.id,
          quantity: s.quantity
        }))
      });
      alert('Stocks added to portfolio successfully!');
      handleCloseAddModal();
      fetchPortfolios();
    } catch (error) {
      console.error('Error updating portfolio:', error);
      alert('Failed to update portfolio.');
    }
  };

  const handleDeletePortfolio = async (portfolioId, portfolioName) => {
    if (window.confirm(`Are you sure you want to delete the portfolio "${portfolioName}"?`)) {
      try {
        await axios.delete(`http://localhost:8000/api/stocks/portfolios/${portfolioId}/`);
        alert('Portfolio deleted successfully!');
        fetchPortfolios();
      } catch (error) {
        console.error('Error deleting portfolio:', error);
        alert('Failed to delete portfolio.');
      }
    }
  };

  const handleBulkAddToCollection = async (portfolio) => {
    if (!portfolio.items || portfolio.items.length === 0) {
      alert('This portfolio has no stocks to add.');
      return;
    }

    setAddingToCollection(prev => ({ ...prev, [portfolio.id]: true }));
    try {
      const userData = JSON.parse(localStorage.getItem('user'));
      
      // 1. Fetch current collections to find existing items for this portfolio
      const collectionsRes = await axios.get(`http://localhost:8000/api/stocks/collections/?user_id=${userData.id}`);
      const existingCollections = collectionsRes.data;
      
      // Find items that belong to this portfolio (using name as fallback, but ideally portfolio_id if we have it)
      // Note: built-in portfolios use IDs like 'builtin-0', user ones use database numeric IDs.
      const portfolioIdToMatch = portfolio.id.toString();
      const itemsInThisPortfolio = existingCollections.filter(item => 
        item.portfolio_id === portfolioIdToMatch || 
        (!item.portfolio_id && item.portfolio_name === portfolio.name)
      );
      
      const isExisting = itemsInThisPortfolio.length > 0;

      // 2. Identify stocks to remove (those currently in collection for this portfolio but NOT in the new portfolio state)
      const currentStockIds = portfolio.items.map(item => item.stock.id);
      const itemsToRemove = itemsInThisPortfolio.filter(item => !currentStockIds.includes(item.stock.id));
      
      const deletePromises = itemsToRemove.map(item => 
        axios.delete(`http://localhost:8000/api/stocks/collections/delete/?user_id=${userData.id}&stock_id=${item.stock.id}`)
      );

      // 3. Add/Update all current stocks from the portfolio
      const addPromises = portfolio.items.map(item => 
        axios.post('http://localhost:8000/api/stocks/collections/', {
          user_id: userData.id,
          stock_id: item.stock.id,
          portfolio_name: portfolio.name,
          portfolio_id: portfolioIdToMatch
        })
      );
      
      await Promise.all([...deletePromises, ...addPromises]);
      
      if (isExisting) {
        alert('updated');
      } else {
        alert(`${portfolio.name} added to my collection`);
      }
    } catch (error) {
      console.error('Error adding stocks to collection:', error);
      alert('Some stocks might already be in your collection or failed to add.');
    } finally {
      setAddingToCollection(prev => ({ ...prev, [portfolio.id]: false }));
    }
  };

  const groupItemsByCategory = (items) => {
    return items.reduce((groups, item) => {
      const category = item.stock.sector || 'Uncategorized';
      if (!groups[category]) {
        groups[category] = [];
      }
      groups[category].push(item);
      return groups;
    }, {});
  };

  const getPortfolioColor = (index) => {
    const colors = [
      { border: 'border-light-accent/20', glow: 'bg-light-accent/10', text: 'text-light-accent' },
      { border: 'border-medium-tone/20', glow: 'bg-medium-tone/10', text: 'text-medium-tone' },
      { border: 'border-purple-500/20', glow: 'bg-purple-500/10', text: 'text-purple-400' },
      { border: 'border-blue-500/20', glow: 'bg-blue-500/10', text: 'text-blue-400' },
    ];
    return colors[index % colors.length];
  };

  const filteredPortfolios = portfolios.filter(portfolio =>
    portfolio.name.toLowerCase().includes(portfolioSearch.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin text-light-accent">
          <Layers size={48} />
        </div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-6xl mx-auto text-white">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-extrabold tracking-tight">My Portfolios</h1>
          <p className="text-gray-400 mt-2 font-medium">Manage and track your custom stock collections.</p>
        </div>
        <div className="relative">
          <input
            type="text"
            value={portfolioSearch}
            onChange={(e) => setPortfolioSearch(e.target.value)}
            placeholder="Search portfolios..."
            className="glass-input px-4 py-2 w-full max-w-xs"
          />
          <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
            <Search className="text-gray-400" size={18} />
          </div>
        </div>
      </header>

      {/* User Portfolios Section */}
      <div className="flex items-center space-x-3 mb-8">
        <div className="bg-light-accent/20 p-2.5 rounded-2xl border border-light-accent/30 shadow-[0_0_15px_rgba(56,189,248,0.2)]">
          <Briefcase className="text-light-accent" size={24} />
        </div>
        <div>
          <h2 className="text-3xl font-black tracking-tight text-white">Custom Collections</h2>
          <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Your personal investment strategies</p>
        </div>
      </div>

      {filteredPortfolios.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          {filteredPortfolios.map((portfolio, index) => {
            const cardColor = getPortfolioColor(index);
            return (
              <div key={portfolio.id} className="glass-panel overflow-hidden group hover:shadow-[0_20px_50px_rgba(0,0,0,0.3)] transition-all duration-500 flex flex-col border border-white/10 relative">
                {/* Accent Glow */}
                <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-[80px] opacity-20 group-hover:opacity-40 transition-opacity duration-700 ${cardColor.glow}`}></div>
                
                <div className="p-8 flex-1 relative z-10">
                  <div className="flex justify-between items-start mb-6">
                    <span className={`px-4 py-1.5 ${cardColor.glow} ${cardColor.text} text-[10px] font-black rounded-xl uppercase tracking-widest border ${cardColor.border} shadow-sm`}>
                      ID: {portfolio.portfolio_id}
                    </span>
                    <div 
                      onClick={() => handleDeletePortfolio(portfolio.id, portfolio.name)}
                      className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500/10 text-red-400/60 hover:text-red-400 hover:bg-red-500/20 transition-all cursor-pointer border border-red-500/10"
                    >
                      <Trash2 size={16} />
                    </div>
                  </div>
                  
                  <h3 className="text-2xl font-black text-white mb-3 group-hover:text-light-accent transition-colors leading-tight">
                    {portfolio.name}
                  </h3>
                  
                  {portfolio.description && (
                    <p className="text-gray-400 text-sm font-medium mb-6 line-clamp-2 leading-relaxed opacity-80">
                      {portfolio.description}
                    </p>
                  )}
                  
                  <div className="flex items-center text-gray-500 text-[10px] font-black uppercase tracking-wider mb-8">
                    <Calendar size={14} className="mr-2 text-gray-600" />
                    <span>Created {new Date(portfolio.created_at).toLocaleDateString()}</span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Net Worth</span>
                      <span className="text-xl font-black text-white">
                        ₹{calculateTotalValue(portfolio.items).toLocaleString('en-IN')}
                      </span>
                    </div>
                    <div className="p-4 bg-white/5 rounded-2xl border border-white/5 flex flex-col">
                      <span className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Holdings</span>
                      <span className={`text-xl font-black ${cardColor.text}`}>
                        {portfolio.items.length}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                    {Object.entries(groupItemsByCategory(portfolio.items)).map(([category, items]) => (
                      <div key={category} className="space-y-2">
                        <h4 className="text-[10px] font-black text-gray-600 uppercase tracking-widest flex items-center">
                          <span className="w-1.5 h-1.5 rounded-full bg-light-accent mr-2"></span>
                          {category}
                        </h4>
                        <div className="flex flex-wrap gap-2">
                          {items.map((item) => (
                            <div key={item.stock.id} className="flex items-center space-x-1.5 bg-secondary-dark/80 px-3 py-1.5 rounded-xl border border-white/10 hover:border-light-accent/30 transition-colors">
                              <span className="text-[11px] font-black text-white uppercase">
                                {item.stock.symbol.split('.')[0]}
                              </span>
                              <span className={`text-[11px] font-black ${cardColor.text}`}>x{item.quantity}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="px-8 pb-8 space-y-3 relative z-10">
                  <button 
                    onClick={() => handleOpenAddModal(portfolio)}
                    className="w-full glass-button p-4 rounded-2xl text-xs font-black uppercase tracking-widest hover:glass-button-active active:scale-95 flex items-center justify-center group/btn"
                  >
                    <Plus size={18} className="mr-2 group-hover/btn:rotate-90 transition-transform" />
                    Expand Assets
                  </button>
                  <button 
                    onClick={() => handleBulkAddToCollection(portfolio)}
                    disabled={addingToCollection[portfolio.id]}
                    className="w-full bg-white/5 hover:bg-white/10 p-4 rounded-2xl text-xs font-black text-gray-400 uppercase tracking-widest transition-all border border-white/10 flex items-center justify-center hover:text-white"
                  >
                    {addingToCollection[portfolio.id] ? (
                      <span className="flex items-center">
                        <Layers size={14} className="animate-spin mr-2" />
                        Processing...
                      </span>
                    ) : (
                      'Save to Collection'
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="glass-panel p-20 mb-16 flex flex-col items-center justify-center text-center border border-white/5 bg-secondary-dark/30">
          <div className="bg-white/5 p-8 rounded-[40px] mb-6 border border-white/10 shadow-inner">
            <Briefcase size={64} className="text-gray-600" />
          </div>
          <h3 className="text-2xl font-black text-white mb-2">Build Your First Portfolio</h3>
          <p className="text-gray-500 max-w-xs mt-2 font-bold uppercase text-[10px] tracking-widest leading-relaxed">
            Create custom stock groups to track your favorite market trends.
          </p>
        </div>
      )}

      {/* Add Stock Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-secondary-dark/95 border border-white/10 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300 text-white">
            <div className="p-8">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-black flex items-center">
                  <Plus className="text-light-accent mr-2" size={24} />
                  Add to {selectedPortfolio?.name}
                </h3>
                <button onClick={handleCloseAddModal} className="text-gray-400 hover:text-red-500 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <div className="space-y-6">
                <div className="relative">
                  <label className="block text-sm font-bold text-gray-300 mb-2 uppercase tracking-widest">Search Stocks</label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Search className="text-gray-400" size={18} />
                    </div>
                    <input 
                      type="text" 
                      value={stockSearch}
                      onChange={(e) => setStockSearch(e.target.value)}
                      placeholder="Search name or symbol..." 
                      className="glass-input w-full pl-11 pr-4 py-4 font-bold bg-white/5"
                    />
                  </div>

                  {/* Suggestions Dropdown */}
                  {suggestions.length > 0 && (
                    <div className="absolute z-[110] w-full mt-2 bg-secondary-dark border border-white/10 rounded-2xl shadow-2xl max-h-48 overflow-y-auto animate-in slide-in-from-top-2 duration-200">
                      {suggestions.map((stock) => (
                        <div 
                          key={stock.id}
                          onClick={() => addStockToSelected(stock)}
                          className="p-4 hover:bg-white/5 cursor-pointer transition-colors border-b border-white/5 last:border-0 flex justify-between items-center group"
                        >
                          <div className="flex flex-col">
                            <span className="font-black text-white group-hover:text-light-accent">{stock.symbol.split('.')[0]}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase">{stock.name}</span>
                          </div>
                          <Plus size={16} className="text-gray-400 group-hover:text-light-accent" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Selected Stocks tags */}
                {selectedStocks.length > 0 && (
                  <div className="space-y-3">
                    <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block">Stocks to Add</label>
                    <div className="flex flex-col gap-2">
                      {selectedStocks.map((stock) => (
                        <div key={stock.id} className="bg-white/5 border border-white/5 p-3 rounded-xl flex items-center justify-between animate-in zoom-in duration-200">
                          <div className="flex flex-col">
                            <span className="text-xs font-black text-white">{stock.symbol.split('.')[0]}</span>
                            <span className="text-[10px] text-gray-400 font-bold uppercase truncate max-w-[100px]">{stock.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <div className="flex items-center bg-secondary-dark border border-white/5 rounded-lg px-2 py-1">
                              <label className="text-[10px] font-black text-light-accent mr-2 uppercase">Qty:</label>
                              <input 
                                type="number" 
                                min="1"
                                value={stock.quantity}
                                onChange={(e) => updateStockQuantity(stock.id, e.target.value)}
                                className="w-12 text-xs font-black text-white bg-transparent outline-none"
                              />
                            </div>
                            <button onClick={() => removeStockFromSelected(stock.id)} className="text-gray-400 hover:text-red-400 transition-colors">
                              <X size={16} />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <button 
                  onClick={handleUpdatePortfolio}
                  disabled={selectedStocks.length === 0}
                  className="w-full glass-button py-4 font-extrabold uppercase tracking-widest hover:glass-button-active active:scale-95 disabled:opacity-50 mt-4"
                >
                  Update Portfolio
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Portfolio;
