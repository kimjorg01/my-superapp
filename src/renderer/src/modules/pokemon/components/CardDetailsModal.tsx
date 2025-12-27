import { useState, useEffect } from 'react';

interface CardDetailsModalProps {
  card: any;
  onClose: () => void;
  onUpdate: (cardId: string, counts: { normal: number, holo: number, reverseHolo: number }) => void;
  onToggleFavorite: (cardId: string) => void;
}

const PriceRow = ({ label, value, currency, highlight = false }: { label: string, value: number | null | undefined, currency: string, highlight?: boolean }) => {
  if (value === null || value === undefined) return null;
  return (
    <div className={`flex justify-between items-center ${highlight ? 'text-green-600 dark:text-green-400 font-medium' : ''}`}>
      <span className="text-gray-500 dark:text-gray-400">{label}</span>
      <span className="font-mono">{currency}{value.toFixed(2)}</span>
    </div>
  );
};

export default function CardDetailsModal({ card, onClose, onUpdate, onToggleFavorite }: CardDetailsModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isFavorite, setIsFavorite] = useState(card.isFavorite || false);
  
  const [counts, setCounts] = useState({
    normal: card.countNormal || 0,
    holo: card.countHolo || 0,
    reverseHolo: card.countReverseHolo || 0
  });

  const fetchDetails = async () => {
    setLoading(true);
    try {
      // @ts-ignore
      const data = await window.api.getCardDetails(card.id);
      setDetails(data);
    } catch (error) {
      console.error("Failed to fetch card details", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetails();
  }, [card.id]);

  const handleSave = () => {
    onUpdate(card.id, counts);
    onClose();
  };

  const handleToggleFavorite = () => {
    setIsFavorite(!isFavorite);
    onToggleFavorite(card.id);
  };

  const hasVariant = (variant: string) => {
    if (!details || !details.variants) return true; 
    return details.variants[variant] === true;
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-md transition-all">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] flex flex-col md:flex-row overflow-hidden border border-gray-200 dark:border-gray-700">
        
        {/* Left: Image */}
        <div className="p-8 flex justify-center items-center bg-gray-50 dark:bg-black/40 md:w-2/5 relative">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-200/50 via-transparent to-transparent dark:from-gray-800/50 pointer-events-none"></div>
          <img 
            src={details?.image ? `${details.image}/high.webp` : card.image.replace('/low.png', '/high.webp')} 
            alt={card.name} 
            className="max-w-full max-h-[60vh] rounded-xl shadow-2xl object-contain z-10 transform transition-transform hover:scale-105 duration-500"
          />
        </div>

        {/* Right: Details */}
        <div className="p-8 flex-1 flex flex-col overflow-y-auto custom-scrollbar bg-white dark:bg-gray-900">
          <div className="flex justify-between items-start mb-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h2 className="text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                  {card.name}
                </h2>
                <button 
                  onClick={handleToggleFavorite}
                  className={`p-2 rounded-full transition-all duration-300 ${isFavorite ? 'text-yellow-400 bg-yellow-400/10 scale-110' : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                  title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <svg className="w-7 h-7" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </div>
              
              <div className="flex flex-wrap items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-gray-100 dark:bg-gray-800 rounded-lg text-xs font-bold uppercase tracking-wider text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700">
                  {card.rarity}
                </span>
                <span className="text-gray-400 dark:text-gray-500 text-sm font-mono">#{card.localId}</span>
                {card.set && (
                  <div className="flex items-center gap-2 pl-3 border-l-2 border-gray-100 dark:border-gray-800">
                    {card.set.logo && <img src={`${card.set.logo}.png`} className="h-5 w-auto opacity-70" alt={card.set.name} />}
                    <span className="text-gray-600 dark:text-gray-300 text-sm font-medium">
                      {card.set.name}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-white transition-all"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Collection Management */}
          <div className="mb-10 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/10 dark:to-indigo-900/10 p-6 rounded-2xl border border-blue-100 dark:border-blue-800/30 shadow-sm">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg text-blue-600 dark:text-blue-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                </div>
                My Collection
              </h3>
              <button 
                onClick={handleSave}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl shadow-lg shadow-blue-500/20 transition-all transform hover:-translate-y-0.5 active:translate-y-0"
              >
                Save Changes
              </button>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
              {/* Normal */}
              <div className={`flex flex-col items-center p-4 rounded-xl transition-colors ${!hasVariant('normal') ? 'opacity-40 grayscale bg-gray-100 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800 shadow-sm'}`}>
                <label className="mb-3 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Normal</label>
                <div className="flex items-center gap-3 w-full justify-center">
                  <button 
                    disabled={!hasVariant('normal') || counts.normal <= 0}
                    onClick={() => setCounts({...counts, normal: Math.max(0, counts.normal - 1)})}
                    className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-gray-600 dark:text-gray-300 font-bold text-2xl"
                  >-</button>
                  <input 
                    type="number" 
                    min="0"
                    disabled={!hasVariant('normal')}
                    value={counts.normal}
                    onChange={(e) => setCounts({...counts, normal: parseInt(e.target.value) || 0})}
                    className="w-16 h-12 text-center text-2xl font-bold bg-transparent text-gray-800 dark:text-white focus:ring-0 outline-none border-b-2 border-transparent focus:border-blue-500 transition-colors"
                  />
                  <button 
                    disabled={!hasVariant('normal')}
                    onClick={() => setCounts({...counts, normal: counts.normal + 1})}
                    className="w-12 h-12 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-800/50 disabled:opacity-50 transition-colors text-blue-600 dark:text-blue-400 font-bold text-2xl"
                  >+</button>
                </div>
              </div>
              
              {/* Holo */}
              <div className={`flex flex-col items-center p-4 rounded-xl transition-colors ${!hasVariant('holo') ? 'opacity-40 grayscale bg-gray-100 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800 shadow-sm ring-1 ring-yellow-400/20'}`}>
                <label className="mb-3 text-sm font-bold uppercase tracking-wider text-yellow-600 dark:text-yellow-500 flex items-center gap-1">
                  <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/></svg>
                  Holo
                </label>
                <div className="flex items-center gap-3 w-full justify-center">
                  <button 
                    disabled={!hasVariant('holo') || counts.holo <= 0}
                    onClick={() => setCounts({...counts, holo: Math.max(0, counts.holo - 1)})}
                    className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-gray-600 dark:text-gray-300 font-bold text-2xl"
                  >-</button>
                  <input 
                    type="number" 
                    min="0"
                    disabled={!hasVariant('holo')}
                    value={counts.holo}
                    onChange={(e) => setCounts({...counts, holo: parseInt(e.target.value) || 0})}
                    className="w-16 h-12 text-center text-2xl font-bold bg-transparent text-gray-800 dark:text-white focus:ring-0 outline-none border-b-2 border-transparent focus:border-yellow-500 transition-colors"
                  />
                  <button 
                    disabled={!hasVariant('holo')}
                    onClick={() => setCounts({...counts, holo: counts.holo + 1})}
                    className="w-12 h-12 rounded-xl bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center hover:bg-yellow-200 dark:hover:bg-yellow-800/50 disabled:opacity-50 transition-colors text-yellow-600 dark:text-yellow-400 font-bold text-2xl"
                  >+</button>
                </div>
              </div>

              {/* Reverse Holo */}
              <div className={`flex flex-col items-center p-4 rounded-xl transition-colors ${!hasVariant('reverse') ? 'opacity-40 grayscale bg-gray-100 dark:bg-gray-800/50' : 'bg-white dark:bg-gray-800 shadow-sm ring-1 ring-indigo-400/20'}`}>
                <label className="mb-3 text-sm font-bold uppercase tracking-wider text-indigo-600 dark:text-indigo-400">Reverse</label>
                <div className="flex items-center gap-3 w-full justify-center">
                  <button 
                    disabled={!hasVariant('reverse') || counts.reverseHolo <= 0}
                    onClick={() => setCounts({...counts, reverseHolo: Math.max(0, counts.reverseHolo - 1)})}
                    className="w-12 h-12 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-gray-600 dark:text-gray-300 font-bold text-2xl"
                  >-</button>
                  <input 
                    type="number" 
                    min="0"
                    disabled={!hasVariant('reverse')}
                    value={counts.reverseHolo}
                    onChange={(e) => setCounts({...counts, reverseHolo: parseInt(e.target.value) || 0})}
                    className="w-16 h-12 text-center text-2xl font-bold bg-transparent text-gray-800 dark:text-white focus:ring-0 outline-none border-b-2 border-transparent focus:border-indigo-500 transition-colors"
                  />
                  <button 
                    disabled={!hasVariant('reverse')}
                    onClick={() => setCounts({...counts, reverseHolo: counts.reverseHolo + 1})}
                    className="w-12 h-12 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center hover:bg-indigo-200 dark:hover:bg-indigo-800/50 disabled:opacity-50 transition-colors text-indigo-600 dark:text-indigo-400 font-bold text-2xl"
                  >+</button>
                </div>
              </div>
            </div>
          </div>

          {/* Prices */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-bold text-gray-800 dark:text-gray-100 flex items-center gap-3">
                <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg text-green-600 dark:text-green-400">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
                Market Statistics
              </h3>
              <button 
                onClick={fetchDetails} 
                disabled={loading}
                className="px-4 py-2 rounded-lg bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-sm font-medium text-gray-600 dark:text-gray-300 flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Refresh Prices
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-8">
                {/* Cardmarket */}
                {details?.pricing?.cardmarket && (
                  <div className="border dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-shadow hover:shadow-md">
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-6 py-4 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center">
                      <h4 className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2 text-lg">
                        Cardmarket
                        <span className="text-[10px] bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-0.5 rounded-full font-bold">EUR</span>
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                        Updated: {new Date(details.pricing.cardmarket.updated).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-10">
                      {/* Non-Foil Column */}
                      <div>
                        <h5 className="text-xs font-bold uppercase text-gray-400 dark:text-gray-500 mb-4 tracking-widest border-b border-gray-100 dark:border-gray-700 pb-2">Normal Prices</h5>
                        <div className="space-y-3 text-sm">
                          <PriceRow label="Trend" value={details.pricing.cardmarket.trend} currency="€" />
                          <PriceRow label="Low" value={details.pricing.cardmarket.low} currency="€" />
                          <PriceRow label="Avg" value={details.pricing.cardmarket.avg} currency="€" />
                          <div className="my-3 border-t border-dashed border-gray-200 dark:border-gray-700"></div>
                          <PriceRow label="Avg 1 Day" value={details.pricing.cardmarket.avg1} currency="€" />
                          <PriceRow label="Avg 7 Days" value={details.pricing.cardmarket.avg7} currency="€" />
                          <PriceRow label="Avg 30 Days" value={details.pricing.cardmarket.avg30} currency="€" />
                        </div>
                      </div>

                      {/* Foil Column */}
                      <div>
                        <h5 className="text-xs font-bold uppercase text-yellow-600 dark:text-yellow-500 mb-4 tracking-widest border-b border-yellow-100 dark:border-yellow-900/30 pb-2">Holo / Foil Prices</h5>
                        <div className="space-y-3 text-sm">
                          <PriceRow label="Trend" value={details.pricing.cardmarket['trend-holo']} currency="€" />
                          <PriceRow label="Low" value={details.pricing.cardmarket['low-holo']} currency="€" />
                          <PriceRow label="Avg" value={details.pricing.cardmarket['avg-holo']} currency="€" />
                          <div className="my-3 border-t border-dashed border-gray-200 dark:border-gray-700"></div>
                          <PriceRow label="Avg 1 Day" value={details.pricing.cardmarket['avg1-holo']} currency="€" />
                          <PriceRow label="Avg 7 Days" value={details.pricing.cardmarket['avg7-holo']} currency="€" />
                          <PriceRow label="Avg 30 Days" value={details.pricing.cardmarket['avg30-holo']} currency="€" />
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* TCGPlayer */}
                {details?.pricing?.tcgplayer ? (
                  <div className="border dark:border-gray-700 rounded-2xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm transition-shadow hover:shadow-md">
                    <div className="bg-green-50 dark:bg-green-900/20 px-6 py-4 border-b border-green-100 dark:border-green-800 flex justify-between items-center">
                      <h4 className="font-bold text-green-700 dark:text-green-300 flex items-center gap-2 text-lg">
                        TCGPlayer
                        <span className="text-[10px] bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-2 py-0.5 rounded-full font-bold">USD</span>
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-700">
                        Updated: {details.pricing.tcgplayer.updated ? new Date(details.pricing.tcgplayer.updated).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {Object.entries(details.pricing.tcgplayer).map(([key, data]: [string, any]) => {
                        if (['updated', 'unit', 'url'].includes(key) || !data) return null;
                        return (
                          <div key={key} className="bg-gray-50 dark:bg-gray-700/30 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
                            <h5 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-3 tracking-wider border-b border-gray-200 dark:border-gray-600 pb-2">
                              {key.replace(/-/g, ' ')}
                            </h5>
                            <div className="space-y-2 text-sm">
                              <PriceRow label="Market" value={data.marketPrice} currency="$" />
                              <PriceRow label="Low" value={data.lowPrice} currency="$" />
                              <PriceRow label="Mid" value={data.midPrice} currency="$" />
                              <PriceRow label="High" value={data.highPrice} currency="$" />
                              {data.directLowPrice && (
                                <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <PriceRow label="Direct Low" value={data.directLowPrice} currency="$" highlight />
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-center text-gray-400 dark:text-gray-500">
                    No TCGPlayer data available for this card.
                  </div>
                )}
              </div>
            )}
            
            {/* Debug Info */}
            {details && (
              <div className="mt-8">
                <details className="group">
                  <summary className="cursor-pointer text-xs font-mono text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 select-none">
                    Debug: Raw API Response
                  </summary>
                  <div className="mt-2 p-4 bg-gray-100 dark:bg-gray-900 rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800">
                    <pre className="text-[10px] overflow-auto max-h-60 text-gray-600 dark:text-gray-400 font-mono whitespace-pre-wrap">
                      {JSON.stringify(details, null, 2)}
                    </pre>
                  </div>
                </details>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}