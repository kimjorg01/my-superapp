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
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto flex flex-col md:flex-row overflow-hidden">
        
        {/* Left: Image */}
        <div className="p-8 flex justify-center items-center bg-gray-100 dark:bg-gray-900 md:w-2/5">
          <img 
            src={details?.image ? `${details.image}/high.webp` : card.image.replace('/low.png', '/high.webp')} 
            alt={card.name} 
            className="max-w-full max-h-[60vh] rounded-lg shadow-lg object-contain"
          />
        </div>

        {/* Right: Details */}
        <div className="p-6 flex-1 flex flex-col overflow-y-auto">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white flex items-center gap-3">
                {card.name}
                <button 
                  onClick={handleToggleFavorite}
                  className={`p-1.5 rounded-full transition-colors ${isFavorite ? 'text-yellow-400 bg-yellow-400/10' : 'text-gray-300 hover:text-yellow-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                  title={isFavorite ? "Remove from Favorites" : "Add to Favorites"}
                >
                  <svg className="w-6 h-6" fill={isFavorite ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                  </svg>
                </button>
              </h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="px-2 py-1 bg-gray-200 dark:bg-gray-700 rounded text-xs font-medium text-gray-700 dark:text-gray-300">
                  {card.rarity}
                </span>
                <span className="text-gray-500 dark:text-gray-400 text-sm">#{card.localId}</span>
                {card.set && (
                  <span className="text-gray-500 dark:text-gray-400 text-sm border-l border-gray-300 dark:border-gray-600 pl-2 ml-1">
                    {card.set.name}
                  </span>
                )}
              </div>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-500 transition-colors">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
            </button>
          </div>

          {/* Collection Management */}
          <div className="mb-8 bg-blue-50 dark:bg-blue-900/20 p-5 rounded-xl border border-blue-100 dark:border-blue-800">
            <h3 className="text-lg font-semibold mb-4 text-gray-800 dark:text-gray-200 flex items-center gap-2">
              <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
              My Collection
            </h3>
            <div className="grid grid-cols-3 gap-6">
              {/* Normal */}
              <div className={`flex flex-col items-center ${!hasVariant('normal') ? 'opacity-50 grayscale' : ''}`}>
                <label className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Normal</label>
                <div className="flex items-center w-full">
                  <button 
                    disabled={!hasVariant('normal') || counts.normal <= 0}
                    onClick={() => setCounts({...counts, normal: Math.max(0, counts.normal - 1)})}
                    className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-l-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-gray-600 dark:text-gray-300 font-bold"
                  >-</button>
                  <input 
                    type="number" 
                    min="0"
                    disabled={!hasVariant('normal')}
                    value={counts.normal}
                    onChange={(e) => setCounts({...counts, normal: parseInt(e.target.value) || 0})}
                    className="w-full h-10 border-y border-gray-200 dark:border-gray-700 text-center text-lg font-bold dark:bg-gray-800 focus:ring-0 outline-none"
                  />
                  <button 
                    disabled={!hasVariant('normal')}
                    onClick={() => setCounts({...counts, normal: counts.normal + 1})}
                    className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-r-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-gray-600 dark:text-gray-300 font-bold"
                  >+</button>
                </div>
              </div>
              
              {/* Holo */}
              <div className={`flex flex-col items-center ${!hasVariant('holo') ? 'opacity-50 grayscale' : ''}`}>
                <label className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Holo</label>
                <div className="flex items-center w-full">
                  <button 
                    disabled={!hasVariant('holo') || counts.holo <= 0}
                    onClick={() => setCounts({...counts, holo: Math.max(0, counts.holo - 1)})}
                    className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-l-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-gray-600 dark:text-gray-300 font-bold"
                  >-</button>
                  <input 
                    type="number" 
                    min="0"
                    disabled={!hasVariant('holo')}
                    value={counts.holo}
                    onChange={(e) => setCounts({...counts, holo: parseInt(e.target.value) || 0})}
                    className="w-full h-10 border-y border-gray-200 dark:border-gray-700 text-center text-lg font-bold dark:bg-gray-800 focus:ring-0 outline-none"
                  />
                  <button 
                    disabled={!hasVariant('holo')}
                    onClick={() => setCounts({...counts, holo: counts.holo + 1})}
                    className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-r-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-gray-600 dark:text-gray-300 font-bold"
                  >+</button>
                </div>
              </div>

              {/* Reverse Holo */}
              <div className={`flex flex-col items-center ${!hasVariant('reverse') ? 'opacity-50 grayscale' : ''}`}>
                <label className="mb-2 text-sm font-medium text-gray-600 dark:text-gray-400">Reverse</label>
                <div className="flex items-center w-full">
                  <button 
                    disabled={!hasVariant('reverse') || counts.reverseHolo <= 0}
                    onClick={() => setCounts({...counts, reverseHolo: Math.max(0, counts.reverseHolo - 1)})}
                    className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-l-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-gray-600 dark:text-gray-300 font-bold"
                  >-</button>
                  <input 
                    type="number" 
                    min="0"
                    disabled={!hasVariant('reverse')}
                    value={counts.reverseHolo}
                    onChange={(e) => setCounts({...counts, reverseHolo: parseInt(e.target.value) || 0})}
                    className="w-full h-10 border-y border-gray-200 dark:border-gray-700 text-center text-lg font-bold dark:bg-gray-800 focus:ring-0 outline-none"
                  />
                  <button 
                    disabled={!hasVariant('reverse')}
                    onClick={() => setCounts({...counts, reverseHolo: counts.reverseHolo + 1})}
                    className="w-10 h-10 bg-gray-200 dark:bg-gray-700 rounded-r-lg flex items-center justify-center hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 transition-colors text-gray-600 dark:text-gray-300 font-bold"
                  >+</button>
                </div>
              </div>
            </div>
            <div className="mt-6 flex justify-end">
              <button 
                onClick={handleSave}
                className="px-6 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
              >
                Save Changes
              </button>
            </div>
          </div>

          {/* Prices */}
          <div className="flex-1">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                <svg className="w-5 h-5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                Market Statistics
              </h3>
              <button 
                onClick={fetchDetails} 
                disabled={loading}
                className="text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 disabled:opacity-50 transition-colors"
              >
                <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
                Refresh Prices
              </button>
            </div>
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Cardmarket */}
                {details?.pricing?.cardmarket && (
                  <div className="border dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                    <div className="bg-blue-50 dark:bg-blue-900/20 px-4 py-3 border-b border-blue-100 dark:border-blue-800 flex justify-between items-center">
                      <h4 className="font-bold text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        Cardmarket
                        <span className="text-[10px] bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-1.5 py-0.5 rounded">EUR</span>
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Updated: {new Date(details.pricing.cardmarket.updated).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="p-4 grid grid-cols-2 gap-8">
                      {/* Non-Foil Column */}
                      <div>
                        <h5 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wider">Normal</h5>
                        <div className="space-y-2 text-sm">
                          <PriceRow label="Trend" value={details.pricing.cardmarket.trend} currency="€" />
                          <PriceRow label="Low" value={details.pricing.cardmarket.low} currency="€" />
                          <PriceRow label="Avg" value={details.pricing.cardmarket.avg} currency="€" />
                          <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>
                          <PriceRow label="Avg 1 Day" value={details.pricing.cardmarket.avg1} currency="€" />
                          <PriceRow label="Avg 7 Days" value={details.pricing.cardmarket.avg7} currency="€" />
                          <PriceRow label="Avg 30 Days" value={details.pricing.cardmarket.avg30} currency="€" />
                        </div>
                      </div>

                      {/* Foil Column */}
                      <div>
                        <h5 className="text-xs font-bold uppercase text-gray-500 mb-3 tracking-wider">Holo / Foil</h5>
                        <div className="space-y-2 text-sm">
                          <PriceRow label="Trend" value={details.pricing.cardmarket['trend-holo']} currency="€" />
                          <PriceRow label="Low" value={details.pricing.cardmarket['low-holo']} currency="€" />
                          <PriceRow label="Avg" value={details.pricing.cardmarket['avg-holo']} currency="€" />
                          <div className="my-2 border-t border-gray-100 dark:border-gray-700"></div>
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
                  <div className="border dark:border-gray-700 rounded-xl overflow-hidden bg-white dark:bg-gray-800 shadow-sm">
                    <div className="bg-green-50 dark:bg-green-900/20 px-4 py-3 border-b border-green-100 dark:border-green-800 flex justify-between items-center">
                      <h4 className="font-bold text-green-700 dark:text-green-300 flex items-center gap-2">
                        TCGPlayer
                        <span className="text-[10px] bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 px-1.5 py-0.5 rounded">USD</span>
                      </h4>
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        Updated: {details.pricing.tcgplayer.updated ? new Date(details.pricing.tcgplayer.updated).toLocaleDateString() : 'N/A'}
                      </span>
                    </div>
                    
                    <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {Object.entries(details.pricing.tcgplayer).map(([key, data]: [string, any]) => {
                        if (['updated', 'unit', 'url'].includes(key) || !data) return null;
                        return (
                          <div key={key} className="bg-gray-50 dark:bg-gray-700/30 rounded-lg p-3">
                            <h5 className="text-xs font-bold uppercase text-gray-600 dark:text-gray-300 mb-2 tracking-wider border-b border-gray-200 dark:border-gray-600 pb-1">
                              {key.replace(/-/g, ' ')}
                            </h5>
                            <div className="space-y-1.5 text-xs">
                              <PriceRow label="Market" value={data.marketPrice} currency="$" />
                              <PriceRow label="Low" value={data.lowPrice} currency="$" />
                              <PriceRow label="Mid" value={data.midPrice} currency="$" />
                              <PriceRow label="High" value={data.highPrice} currency="$" />
                              {data.directLowPrice && (
                                <PriceRow label="Direct Low" value={data.directLowPrice} currency="$" highlight />
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 border border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-center text-gray-500 dark:text-gray-400">
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