import { API_URL } from '../config.js';
import { useState } from 'react';
import { SearchIcon, Activity, MapPin, Tag, Video, Play, Clock, Sparkles } from 'lucide-react';
import { MediaDetailModal } from '../components/MediaDetailModal';

export const Search = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [selectedAsset, setSelectedAsset] = useState(null);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setIsSearching(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/api/search/semantic`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query, limit: 12 }),
      });

      if (!response.ok) throw new Error('Search failed');
      const data = await response.json();
      setResults(data);
    } catch (err) {
      setError(err.message);
      setResults([]);
    } finally {
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-in fade-in duration-500">
      <div className="text-center max-w-2xl mx-auto space-y-4 mb-12 mt-8">
        <h1 className="text-4xl font-bold tracking-tight text-gray-800 font-semibold">
          Semantic Evidence Search
        </h1>
        <p className="text-gray-600 text-lg">
          Search across all project photos & videos using natural language to find specific activities, environments, and timestamped scenes.
        </p>
      </div>

      <div className="bw-card-white rounded-3xl p-2 max-w-3xl mx-auto neo-glow-container">
        <form onSubmit={handleSearch} className="flex items-center">
          <div className="pl-6 pr-2 text-gray-400">
            <SearchIcon size={24} />
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder='Try "Show me community participation in environmental cleanup"'
            className="flex-1 bg-transparent border-none outline-none text-lg text-gray-800 font-semibold placeholder-zinc-400 py-6"
          />
          <button
            type="submit"
            disabled={isSearching || !query}
            className="bw-btn-black px-8 py-4 mr-2 rounded-3xl text-gray-800 font-semibold font-medium disabled:opacity-50"
          >
            {isSearching ? 'Searching...' : 'Search'}
          </button>
        </form>
      </div>

      {/* Results Section */}
      {results.length > 0 && (
        <div className="mt-12 space-y-6">
          {error ? (
            <p className="text-red-500">{error}</p>
          ) : (
            <h2 className="text-xl font-bold text-slate-700">Results for "{query}"</h2>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((result) => {
              const thumbUrl =
                result.thumbnailUrl ||
                result.matchedFrameUrl ||
                result.cloudinary?.secureUrl;

              return (
                <div
                  key={result._id}
                  onClick={() => setSelectedAsset(result)}
                  className="bw-card-white rounded-3xl overflow-hidden flex flex-col hover:border-cyan-500/30 transition-all duration-300 cursor-pointer group"
                >
                  <div className="h-48 bg-gray-900 relative overflow-hidden">
                    <img
                      src={thumbUrl}
                      alt={result.originalFilename || 'Search result'}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />

                    {result.mediaType === 'video' && (
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
                        <div className="w-10 h-10 rounded-full bg-white/90 text-slate-900 flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                          <Play size={18} className="ml-0.5 text-slate-900" />
                        </div>
                      </div>
                    )}

                    <div className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-700 rounded-md shadow-sm uppercase tracking-wider">
                      Match: {Math.round((result.relevanceScore || 0) * 100)}%
                    </div>

                    {result.matchedTimestamp && (
                      <div className="absolute bottom-3 left-3 px-2.5 py-1 text-[10px] font-bold bg-purple-600/90 backdrop-blur-md text-white rounded-md shadow flex items-center space-x-1">
                        <Clock size={11} />
                        <span>
                          Timestamp: {result.matchedTimestamp.start}s – {result.matchedTimestamp.end}s
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="p-5 flex-1 flex flex-col">
                    <p className="text-slate-800 font-bold mb-2 line-clamp-2">
                      {result.aiAnalysis?.description || result.matchedSnippet || result.originalFilename}
                    </p>

                    {result.matchedSnippet && (
                      <p className="text-xs text-purple-700 bg-purple-50 p-2 rounded-lg mb-3 italic">
                        "{result.matchedSnippet}"
                      </p>
                    )}

                    <div className="mt-auto space-y-3">
                      {result.aiAnalysis?.inferredLocation && (
                        <div className="flex items-center space-x-2 text-xs text-gray-700">
                          <MapPin size={14} className="text-cyan-400" />
                          <span>{result.aiAnalysis.inferredLocation.name}</span>
                        </div>
                      )}

                      <div className="flex flex-wrap gap-1.5">
                        {(result.aiAnalysis?.tags || []).map((tag, i) => (
                          <span
                            key={i}
                            className="px-2 py-0.5 bg-gray-100 text-[10px] text-gray-600 font-semibold uppercase tracking-wider rounded"
                          >
                            {tag}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Modal Inspector */}
      {selectedAsset && (
        <MediaDetailModal
          asset={selectedAsset}
          onClose={() => setSelectedAsset(null)}
        />
      )}
    </div>
  );
};
