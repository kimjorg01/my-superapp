import { useState, useEffect } from 'react';
import CardDetailsModal from './components/CardDetailsModal';

type ViewState = 'series' | 'sets' | 'cards' | 'favorites';

export default function PokemonPage() {
  const [view, setView] = useState<ViewState>('series');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [setsList, setSetsList] = useState<any[]>([]);
  const [cardList, setCardList] = useState<any[]>([]);
  const [favoritesList, setFavoritesList] = useState<any[]>([]);
  const [totalValue, setTotalValue] = useState<number | null>(null);
  const [calculatingValue, setCalculatingValue] = useState(false);

  // Selection History
  const [selectedSeries, setSelectedSeries] = useState<any>(null);
  const [selectedSet, setSelectedSet] = useState<any>(null);
  const [selectedCard, setSelectedCard] = useState<any>(null);

  // View Controls
  const [filter, setFilter] = useState<'all' | 'owned' | 'missing'>('all');
  const [sortBy, setSortBy] = useState<'id' | 'name' | 'rarity'>('id');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const [searchQuery, setSearchQuery] = useState('');
  const [zoomLevel, setZoomLevel] = useState(5); // 3 to 8 columns

  // 1. Load Series on startup
  useEffect(() => {
    loadSeries();
  }, []);

  const getProcessedCards = () => {
    let processed = [...cardList];

    // 1. Search Filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      processed = processed.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.localId.toLowerCase().includes(query)
      );
    }

    // 2. Filter (Owned/Missing)
    if (filter === 'owned') {
      processed = processed.filter(c => c.isOwned);
    } else if (filter === 'missing') {
      processed = processed.filter(c => !c.isOwned);
    }

    // 3. Sort
    processed.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'name') {
        comparison = a.name.localeCompare(b.name);
      } else if (sortBy === 'rarity') {
        comparison = (a.rarity || '').localeCompare(b.rarity || '');
      } else {
        // Default: ID (try numeric sort if possible)
        const idA = parseInt(a.localId) || 0;
        const idB = parseInt(b.localId) || 0;
        comparison = idA - idB;
      }
      
      return sortOrder === 'asc' ? comparison : -comparison;
    });

    return processed;
  };

  const processedCards = getProcessedCards();

  const loadSeries = async () => {
    setLoading(true);
    // @ts-ignore
    const data = await window.api.getPokemonSeries();
    setSeriesList(data);
    setLoading(false);
  };

  const openSeries = async (series) => {
    setSelectedSeries(series);
    setView('sets');
    setLoading(true);
    // @ts-ignore
    const data = await window.api.getSetsInSeries(series.id);
    setSetsList(data);
    setLoading(false);
  };

  const openSet = async (set) => {
    setSelectedSet(set);
    setView('cards');
    setLoading(true);
    // @ts-ignore
    const data = await window.api.getCardsInSet(set.id);
    setCardList(data);
    setLoading(false);
  };

  const openFavorites = async () => {
    setView('favorites');
    setLoading(true);
    setTotalValue(null);
    // @ts-ignore
    const data = await window.api.getFavoriteCards();
    setFavoritesList(data);
    setLoading(false);
  };

  const calculateTotalValue = async () => {
    setCalculatingValue(true);
    let total = 0;
    
    // Process in chunks to avoid overwhelming the UI/API
    for (const card of favoritesList) {
      try {
        // @ts-ignore
        const details = await window.api.getCardDetails(card.id);
        if (details?.pricing) {
          // Prioritize Market Price from TCGPlayer, then Cardmarket Trend
          const tcgPrice = details.pricing.tcgplayer?.prices?.normal?.market || 
                           details.pricing.tcgplayer?.prices?.holofoil?.market || 
                           details.pricing.tcgplayer?.prices?.reverseHolofoil?.market;
                           
          const cmPrice = details.pricing.cardmarket?.trend || 
                          details.pricing.cardmarket?.['trend-holo'];

          // Simple conversion 1 EUR = 1.1 USD for estimation if mixing currencies, 
          // but for now let's just sum up raw numbers assuming user prefers one market.
          // Or better: just take TCGPlayer USD if available, else Cardmarket EUR.
          
          if (tcgPrice) {
            total += tcgPrice;
          } else if (cmPrice) {
            total += cmPrice; // Treating EUR as USD 1:1 for simple total, or just "Units"
          }
        }
      } catch (e) {
        console.error(`Failed to get price for ${card.name}`, e);
      }
    }
    
    setTotalValue(total);
    setCalculatingValue(false);
  };

  const openCardDetails = (card) => {
    setSelectedCard(card);
  };

  const handleUpdateCollection = async (cardId, counts) => {
    const isOwned = (counts.normal + counts.holo + counts.reverseHolo) > 0;
    
    // Update in current list
    setCardList(prev => prev.map(c => c.id === cardId ? { 
      ...c, 
      isOwned,
      countNormal: counts.normal,
      countHolo: counts.holo,
      countReverseHolo: counts.reverseHolo
    } : c));

    // Update in favorites list if present
    setFavoritesList(prev => prev.map(c => c.id === cardId ? { 
      ...c, 
      isOwned,
      countNormal: counts.normal,
      countHolo: counts.holo,
      countReverseHolo: counts.reverseHolo
    } : c));

    // @ts-ignore
    await window.api.updateCardCollection({ cardId, counts });
  };

  const handleToggleFavorite = async (cardId) => {
    // Update in current list
    setCardList(prev => prev.map(c => c.id === cardId ? { ...c, isFavorite: !c.isFavorite } : c));
    
    // Update in favorites list (remove if un-favorited while in favorites view)
    if (view === 'favorites') {
      setFavoritesList(prev => prev.filter(c => c.id !== cardId));
    } else {
       // We can't easily add it to favorites list without fetching the full object with set info, 
       // so we'll just let it reload next time openFavorites is called.
    }

    // @ts-ignore
    await window.api.toggleCardFavorite(cardId);
  };

  // --- RENDER HELPERS ---
  
  // LEVEL 1: SERIES
  if (view === 'series') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-white">Select Series</h2>
          <button 
            onClick={openFavorites}
            className="flex items-center gap-2 px-4 py-2 bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-400 rounded-lg transition-colors border border-yellow-500/50"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/></svg>
            My Favorites
          </button>
        </div>
        {loading && <p className="text-white">Loading Series...</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
          {seriesList.map(s => (
            <button key={s.id} onClick={() => openSeries(s)} className="bento-card p-8 flex flex-col items-center gap-4 hover:bg-white/10 transition group">
               {s.logo ? <img src={`${s.logo}.png`} className="h-20 object-contain group-hover:scale-110 transition-transform" /> : <div className="h-20 w-20 bg-white/10 rounded-full" />}
               <span className="font-bold text-xl text-white">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // FAVORITES VIEW
  if (view === 'favorites') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <button onClick={() => setView('series')} className="text-indigo-300 hover:text-white transition flex items-center gap-2">
              <span>←</span> Back to Series
            </button>
            <h2 className="text-3xl font-bold text-white flex items-center gap-3">
              <span className="text-yellow-400">★</span> Favorite Cards
            </h2>
          </div>
          
          <div className="flex items-center gap-4">
            {totalValue !== null && (
              <div className="bg-green-900/50 border border-green-500/30 px-4 py-2 rounded-lg">
                <span className="text-green-400 text-sm uppercase font-bold mr-2">Total Value</span>
                <span className="text-white font-mono text-xl">${totalValue.toFixed(2)}</span>
              </div>
            )}
            <button 
              onClick={calculateTotalValue}
              disabled={calculatingValue || favoritesList.length === 0}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-lg transition-colors flex items-center gap-2"
            >
              {calculatingValue ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Calculating...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  Calculate Value
                </>
              )}
            </button>
          </div>
        </div>

        {loading ? <p className="text-white">Loading Favorites...</p> : (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6 overflow-y-auto pb-10 pr-2 custom-scrollbar">
            {favoritesList.map(card => (
              <div key={card.id} onClick={() => openCardDetails(card)} className="cursor-pointer transition-all duration-300 relative group hover:scale-105 z-10">
                <div className="relative rounded-xl overflow-hidden shadow-lg group-hover:shadow-yellow-500/30 transition-shadow">
                  <img src={card.image.replace('/low.png', '/low.webp')} className="w-full object-cover" loading="lazy" />
                  {card.isOwned && (
                    <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-md bg-opacity-90">
                      OWNED
                    </div>
                  )}
                </div>
                <div className="mt-3 text-center">
                  <div className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-1">{card.set?.name || 'Unknown Set'}</div>
                  <div className="text-sm font-bold text-white">{card.name}</div>
                </div>
              </div>
            ))}
            {favoritesList.length === 0 && (
              <div className="col-span-full text-center py-20 bento-card">
                <p className="text-gray-400 text-lg">No favorite cards yet.</p>
                <p className="text-gray-500 text-sm mt-2">Star cards in the collection view to add them here.</p>
              </div>
            )}
          </div>
        )}

        {selectedCard && (
          <CardDetailsModal 
            card={selectedCard} 
            onClose={() => setSelectedCard(null)} 
            onUpdate={handleUpdateCollection} 
            onToggleFavorite={handleToggleFavorite}
          />
        )}
      </div>
    );
  }

  // LEVEL 2: SETS
  if (view === 'sets') {
    return (
      <div className="h-full flex flex-col">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => setView('series')} className="text-indigo-300 hover:text-white transition flex items-center gap-2">
            <span>←</span> Back to Series
          </button>
          <h2 className="text-3xl font-bold text-white">{selectedSeries.name} Sets</h2>
        </div>
        {loading && <p className="text-white">Loading Sets...</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 overflow-y-auto pr-2 custom-scrollbar">
          {setsList.map(set => (
            <button key={set.id} onClick={() => openSet(set)} className="bento-card p-6 flex flex-col items-center gap-3 hover:bg-white/10 transition group">
              {set.logo ? <img src={`${set.logo}.png`} className="h-24 object-contain group-hover:scale-105 transition-transform" /> : <div className="h-24 w-24 bg-white/10 rounded-full" />}
              <span className="text-lg font-bold text-center text-white">{set.name}</span>
              <span className="text-sm text-gray-400 bg-white/5 px-3 py-1 rounded-full">{set.cardCount} cards</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // LEVEL 3: CARDS
  return (
    <div className="h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('sets')} className="text-indigo-300 hover:text-white transition flex items-center gap-2">
            <span>←</span> Back
          </button>
          <h2 className="text-2xl font-bold text-white">{selectedSet.name}</h2>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 glass-panel px-4 py-2 rounded-xl flex-wrap">
          {/* Search */}
          <input 
            type="text" 
            placeholder="Search..." 
            className="bg-transparent border-b border-white/20 px-2 py-1 text-sm outline-none focus:border-indigo-400 text-white placeholder-gray-500 w-40"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Filter */}
          <select 
            className="bg-transparent border-none outline-none text-sm text-gray-300 cursor-pointer hover:text-white"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all" className="text-black">Show All</option>
            <option value="owned" className="text-black">Owned Only</option>
            <option value="missing" className="text-black">Missing Only</option>
          </select>

          <div className="w-px h-4 bg-white/20 mx-2"></div>

          {/* Sort */}
          <div className="flex items-center gap-2">
            <select 
              className="bg-transparent border-none outline-none text-sm text-gray-300 cursor-pointer hover:text-white"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="id" className="text-black">Number</option>
              <option value="name" className="text-black">Name</option>
              <option value="rarity" className="text-black">Rarity</option>
            </select>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-gray-400 hover:text-indigo-400 px-1 font-bold"
              title={sortOrder === 'asc' ? "Ascending" : "Descending"}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          <div className="w-px h-4 bg-white/20 mx-2"></div>

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-500">Zoom</span>
            <input 
              type="range" 
              min="3" 
              max="10" 
              value={zoomLevel} 
              onChange={(e) => setZoomLevel(parseInt(e.target.value))}
              className="w-20 accent-indigo-500 h-1 bg-white/10 rounded-lg appearance-none cursor-pointer"
            />
          </div>
        </div>
      </div>
      
      {loading ? <p className="text-white">Loading Cards...</p> : (
        <div 
          className="grid gap-6 overflow-y-auto pb-10 pr-2 custom-scrollbar"
          style={{ gridTemplateColumns: `repeat(${zoomLevel}, minmax(0, 1fr))` }}
        >
          {processedCards.map(card => (
            <div key={card.id} onClick={() => openCardDetails(card)} className={`cursor-pointer transition-all duration-300 relative group ${card.isOwned ? 'opacity-100 hover:scale-105 z-10' : 'opacity-40 grayscale hover:grayscale-0 hover:opacity-100 hover:scale-105 z-10'}`}>
              <div className="relative rounded-xl overflow-hidden shadow-lg group-hover:shadow-indigo-500/30 transition-shadow">
                <img src={card.image.replace('/low.png', '/low.webp')} className="w-full object-cover" loading="lazy" />
                {card.isOwned && (
                  <div className="absolute top-2 right-2 bg-green-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-sm backdrop-blur-md bg-opacity-90">
                    OWNED
                  </div>
                )}
              </div>
              <div className="mt-2 text-center opacity-0 group-hover:opacity-100 transition-opacity absolute -bottom-6 left-0 right-0">
                <span className="text-xs font-bold text-white bg-black/50 px-2 py-1 rounded-full">#{card.localId}</span>
              </div>
            </div>
          ))}
          {processedCards.length === 0 && (
            <div className="col-span-full text-center py-20 bento-card">
              <p className="text-gray-400 text-lg">No cards match your filter.</p>
              <button onClick={() => {setSearchQuery(''); setFilter('all');}} className="mt-4 text-indigo-400 hover:text-indigo-300 underline">
                Clear filters
              </button>
            </div>
          )}
        </div>
      )}

      {selectedCard && (
        <CardDetailsModal 
          card={selectedCard} 
          onClose={() => setSelectedCard(null)} 
          onUpdate={handleUpdateCollection} 
          onToggleFavorite={handleToggleFavorite}
        />
      )}
    </div>
  );
}