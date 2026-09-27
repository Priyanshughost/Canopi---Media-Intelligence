import React from 'react';
import {
  Clock,
  Loader2,
  CheckCircle,
  MapPin,
  Video,
} from 'lucide-react';

export const ProjectTimelineTab = ({
  timelineData,
  timelineLoading,
  groupBy,
  setGroupBy,
  verifiedOnly,
  setVerifiedOnly,
  startDate,
  setStartDate,
  endDate,
  setEndDate,
  onSelectAsset,
  assets = [],
}) => {
  return (
    <div className="space-y-6">
      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-gray-50/80 p-3 rounded-2xl border border-gray-200/60">
        <div className="flex items-center space-x-2">
          <span className="text-xs font-bold text-gray-700">Group By:</span>
          <div className="flex items-center bg-white border border-gray-200 p-0.5 rounded-xl shadow-sm">
            {['day', 'week', 'month'].map((g) => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`px-3 py-1 text-xs font-semibold rounded-lg capitalize transition-all ${
                  groupBy === g
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {g}
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={() => setVerifiedOnly(!verifiedOnly)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-semibold flex items-center space-x-1.5 transition-all ${
              verifiedOnly
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800 shadow-sm'
                : 'bg-white border-gray-200 text-gray-600 hover:border-gray-300'
            }`}
          >
            <CheckCircle
              size={13}
              className={verifiedOnly ? 'text-emerald-600' : 'text-gray-400'}
            />
            <span>Verified Evidence Only</span>
          </button>

          <input
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            title="Start Date"
          />
          <span className="text-gray-400 text-xs">to</span>
          <input
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            className="text-xs px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-gray-700 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            title="End Date"
          />
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="text-xs text-red-600 hover:text-red-800 font-medium px-2"
            >
              Clear
            </button>
          )}
        </div>
      </div>

      {/* Timeline Stream */}
      {timelineLoading ? (
        <div className="text-center py-20 text-gray-400 text-sm flex items-center justify-center space-x-2">
          <Loader2 size={18} className="animate-spin text-cyan-600" />
          <span>Building chronological timeline...</span>
        </div>
      ) : timelineData.length === 0 ? (
        <div className="bw-card-white p-12 text-center text-gray-500 rounded-3xl border border-gray-100">
          <Clock size={32} className="mx-auto mb-3 text-gray-400" />
          <p className="font-semibold text-gray-700">No chronological timeline entries found.</p>
          <p className="text-xs text-gray-400 mt-1">Try resetting the verified filter or date range.</p>
        </div>
      ) : (
        <div className="relative border-l-2 border-cyan-200 ml-4 md:ml-8 space-y-10 py-4">
          {timelineData.map((entry, idx) => (
            <div key={idx} className="relative pl-6 md:pl-10">
              {/* Timeline Pulse Node */}
              <div className="absolute -left-[9px] top-1.5 w-4 h-4 rounded-full bg-cyan-500 border-4 border-white shadow-md"></div>

              {/* Date & Metrics Header */}
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center space-x-3">
                  <span className="text-base font-bold text-gray-800 bg-white px-3 py-1 rounded-xl border border-gray-200 shadow-sm">
                    {entry.displayDate || entry.date}
                  </span>
                  <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-100">
                    {entry.assetCount} {entry.assetCount === 1 ? 'Asset' : 'Assets'}
                  </span>
                  {entry.evidenceCount > 0 && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-purple-50 text-purple-800 border border-purple-100">
                      {entry.evidenceCount} Evidence Items
                    </span>
                  )}
                  {entry.verifiedCount > 0 && (
                    <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-100 flex items-center space-x-1">
                      <CheckCircle size={11} />
                      <span>{entry.verifiedCount} Verified</span>
                    </span>
                  )}
                </div>

                {entry.locations?.length > 0 && (
                  <div className="flex items-center space-x-1.5 text-xs text-gray-500">
                    <MapPin size={13} className="text-emerald-500" />
                    <span className="font-medium text-gray-700">
                      {entry.locations.map((l) => l.name).join(', ')}
                    </span>
                  </div>
                )}
              </div>

              {/* Assets Grid for this period */}
              {entry.assets?.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
                  {entry.assets.map((assetItem) => (
                    <div
                      key={assetItem._id}
                      onClick={() => {
                        const fullAsset =
                          assets.find((a) => a._id === assetItem._id) || assetItem;
                        onSelectAsset(fullAsset);
                      }}
                      className="bw-card-white p-3 rounded-2xl hover:shadow-md transition-all cursor-pointer border border-gray-100 flex gap-3 group"
                    >
                      <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 flex-shrink-0 relative">
                        {assetItem.mediaType === 'video' ? (
                          <div className="w-full h-full flex items-center justify-center bg-gray-800 text-white">
                            <Video size={18} />
                          </div>
                        ) : (
                          <img
                            src={assetItem.thumbnailUrl || assetItem.secureUrl}
                            alt={assetItem.originalFilename}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        )}
                        {assetItem.verified && (
                          <span className="absolute bottom-1 right-1 p-0.5 bg-emerald-500 text-white rounded-full">
                            <CheckCircle size={10} />
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0 flex flex-col justify-between">
                        <div>
                          <h5 className="text-xs font-bold text-gray-800 truncate">
                            {assetItem.originalFilename}
                          </h5>
                          {assetItem.location?.lat !== undefined && (
                            <p className="text-[10px] text-emerald-600 flex items-center space-x-1 mt-0.5">
                              <MapPin size={10} />
                              <span>
                                {assetItem.location.lat.toFixed(3)},{' '}
                                {assetItem.location.lng?.toFixed(3)}
                              </span>
                            </p>
                          )}
                        </div>
                        <div className="flex flex-wrap gap-1 mt-1">
                          {(assetItem.aiTags || []).slice(0, 2).map((t, i) => (
                            <span
                              key={i}
                              className="text-[9px] bg-gray-100 text-gray-600 px-1.5 py-0.2 rounded"
                            >
                              #{t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Evidence Items for this period */}
              {entry.evidenceItems?.length > 0 && (
                <div className="p-3.5 bg-purple-50/50 border border-purple-100 rounded-2xl space-y-1.5">
                  <span className="text-[11px] font-bold text-purple-900 uppercase tracking-wider">
                    Generated Evidence & Observations
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {entry.evidenceItems.map((ev) => (
                      <div
                        key={ev._id}
                        className="bg-white border border-purple-200 px-2.5 py-1 rounded-xl text-xs flex items-center space-x-2 text-purple-900 shadow-sm"
                      >
                        <span className="font-semibold">{ev.title}</span>
                        <span className="text-[10px] text-purple-600 bg-purple-50 px-1.5 rounded">
                          {ev.type}
                        </span>
                        {ev.verified && (
                          <CheckCircle size={12} className="text-emerald-500" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
