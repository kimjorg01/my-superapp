import React, { useState, useEffect } from 'react';

type ViewState = 'series' | 'sets' | 'cards';

export default function PokemonPage() {
  const [view, setView] = useState<ViewState>('series');
  const [loading, setLoading] = useState(false);
  
  // Data
  const [seriesList, setSeriesList] = useState<any[]>([]);
  const [setsList, setSetsList] = useState<any[]>([]);
  const [cardList, setCardList] = useState<any[]>([]);

  // Selection History
  const [selectedSeries, setSelectedSeries] = useState<any>(null);
  const [selectedSet, setSelectedSet] = useState<any>(null);

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

  // ... (loadSeries, openSeries, openSet, toggleCard) ...

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

  const toggleCard = async (cardId) => {
    setCardList(cardList.map(c => c.id === cardId ? { ...c, isOwned: !c.isOwned } : c));
    // @ts-ignore
    await window.api.toggleCardOwned(cardId);
  };

  // --- RENDER HELPERS ---
  
  // LEVEL 1: SERIES
  if (view === 'series') {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-6">Select Series</h2>
        {loading && <p>Loading Series...</p>}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {seriesList.map(s => (
            <button key={s.id} onClick={() => openSeries(s)} className="bg-white p-4 rounded-lg shadow hover:shadow-md border border-gray-200 flex flex-col items-center gap-3 transition">
               {s.logo ? <img src={`${s.logo}.png`} className="h-12 object-contain" /> : <div className="h-12 w-12 bg-gray-200 rounded-full" />}
               <span className="font-bold text-gray-700">{s.name}</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // LEVEL 2: SETS
  if (view === 'sets') {
    return (
      <div className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <button onClick={() => setView('series')} className="text-blue-500 hover:underline">← Back to Series</button>
          <h2 className="text-2xl font-bold">{selectedSeries.name} Sets</h2>
        </div>
        {loading && <p>Loading Sets...</p>}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {setsList.map(set => (
            <button key={set.id} onClick={() => openSet(set)} className="bg-gray-50 p-4 rounded-lg border border-gray-200 flex flex-col items-center gap-2 hover:bg-blue-50 transition">
              {set.logo ? <img src={`${set.logo}.png`} className="h-16 object-contain" /> : <div className="h-16 w-16 bg-gray-200 rounded-full" />}
              <span className="text-sm font-bold text-center">{set.name}</span>
              <span className="text-xs text-gray-400">{set.cardCount} cards</span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  // LEVEL 3: CARDS
  return (
    <div className="p-6 h-full flex flex-col">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <button onClick={() => setView('sets')} className="text-blue-500 hover:underline">← Back to {selectedSeries.name}</button>
          <h2 className="text-2xl font-bold">{selectedSet.name}</h2>
        </div>

        {/* Toolbar */}
        <div className="flex items-center gap-4 bg-white p-2 rounded-lg shadow-sm border border-gray-200 flex-wrap">
          {/* Search */}
          <input 
            type="text" 
            placeholder="Search..." 
            className="border border-gray-200 rounded px-2 py-1 text-sm outline-none focus:border-blue-400"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />

          {/* Filter */}
          <select 
            className="border-r border-gray-200 pr-2 outline-none text-sm text-gray-600"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="all">Show All</option>
            <option value="owned">Owned Only</option>
            <option value="missing">Missing Only</option>
          </select>

          {/* Sort */}
          <div className="flex items-center border-r border-gray-200 pr-2 gap-1">
            <select 
              className="outline-none text-sm text-gray-600"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
            >
              <option value="id">Number</option>
              <option value="name">Name</option>
              <option value="rarity">Rarity</option>
            </select>
            <button 
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="text-gray-500 hover:text-blue-600 px-1 font-bold"
              title={sortOrder === 'asc' ? "Ascending" : "Descending"}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>

          {/* Zoom */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400">Zoom:</span>
            <input 
              type="range" 
              min="3" 
              max="10" 
              value={zoomLevel} 
              onChange={(e) => setZoomLevel(parseInt(e.target.value))}
              className="w-24"
            />
          </div>
        </div>
      </div>
      
      {loading ? <p>Loading Cards...</p> : (
        <div 
          className="grid gap-4 overflow-y-auto pb-10"
          style={{ gridTemplateColumns: `repeat(${zoomLevel}, minmax(0, 1fr))` }}
        >
          {processedCards.map(card => (
            <div key={card.id} onClick={() => toggleCard(card.id)} className={`cursor-pointer transition relative ${card.isOwned ? 'opacity-100' : 'opacity-40 grayscale hover:grayscale-0'}`}>
              <img src={card.image} className="rounded-lg shadow w-full" loading="lazy" />
              {card.isOwned && <div className="absolute top-1 right-1 bg-green-500 w-3 h-3 rounded-full shadow" />}
              <div className="mt-1 text-center">
                <span className="text-xs font-bold text-gray-500">#{card.localId}</span>
              </div>
            </div>
          ))}
          {processedCards.length === 0 && (
            <div className="col-span-full text-center py-10 text-gray-400">
              No cards match your filter.
            </div>
          )}
        </div>
      )}
    </div>
  );
}