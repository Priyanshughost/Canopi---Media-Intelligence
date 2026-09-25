import { API_URL } from '../config.js';
import { useState } from 'react';
import { SearchIcon, Activity, MapPin, Tag } from 'lucide-react';

export const Search = () => {
  const [query, setQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
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
        body: JSON.stringify({ query, limit: 12 })
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
        <h1 className="text-4xl font-bold tracking-tight text-gray-800 font-semibold">Semantic Evidence Search</h1>
        <p className="text-gray-600 text-lg">
          Search across all project media using natural language to find specific activities, environments, and evidence.
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
          ) : results.length === 0 ? (
            <p className="text-gray-500">No matching evidence found.</p>
          ) : (
            <h2 className="text-xl font-bold text-slate-700">Results for "{query}"</h2>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {results.map((result) => (
              <div key={result._id} className="bw-card-white rounded-3xl overflow-hidden flex flex-col hover:border-cyan-500/30 transition-all duration-300">
                <div className="h-48 bg-gray-100 relative">
                  {result.mediaType === 'image' && result.cloudinary?.secureUrl ? (
                    <img src={result.cloudinary.secureUrl} alt="Search result" className="w-full h-full object-cover" />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-gray-500">
                      <span className="text-xs">[{result.mediaType || 'Media'} Preview]</span>
                    </div>
                  )}
                  <div className="absolute top-3 right-3 px-2 py-1 text-[10px] font-bold bg-white/90 backdrop-blur-md text-slate-700 rounded-md shadow-sm uppercase tracking-wider">
                    Match: {Math.round((result.relevanceScore || 0) * 100)}%
                  </div>
                </div>
                <div className="p-5 flex-1 flex flex-col">
                  <p className="text-slate-700 font-bold mb-4">{result.aiAnalysis.description}</p>

                  <div className="mt-auto space-y-3">
                    {result.aiAnalysis.inferredLocation && (
                      <div className="flex items-center space-x-2 text-xs text-gray-700">
                        <MapPin size={14} className="text-cyan-400" />
                        <span>{result.aiAnalysis.inferredLocation.name}</span>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-1.5">
                      {(result.aiAnalysis?.tags || []).map((tag, i) => (
                        <span key={i} className="px-2 py-0.5 bg-gray-100 border-none text-[10px] text-gray-600 font-semibold uppercase tracking-wider rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
