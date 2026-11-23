import React, { useState } from 'react';
import {
  Flame,
  Search,
  Clock,
  Plus,
  Check,
  Filter,
  Share2,
  X,
  Bookmark,
  BookmarkCheck,
  ExternalLink,
} from 'lucide-react';
import { NewsArticle, UserProfile } from '../types';
import { isSafeHttpUrl, getCricketDataStatus } from '../services/cricketDataService';

interface NewsFeedViewProps {
  news: NewsArticle[];
  user: UserProfile;
  setUser: React.Dispatch<React.SetStateAction<UserProfile>>;
  selectedArticle: NewsArticle | null;
  setSelectedArticle: (article: NewsArticle | null) => void;
}

export const NewsFeedView: React.FC<NewsFeedViewProps> = ({
  news,
  user,
  setUser,
  selectedArticle,
  setSelectedArticle,
}) => {
  const [category, setCategory] = useState<string>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [showCurateModal, setShowCurateModal] = useState(false);
  const [savedArticleIds, setSavedArticleIds] = useState<string[]>(['n1']);

  const isDark = user.theme === 'dark';

  const teamsList = ['India', 'Australia', 'England', 'Pakistan', 'South Africa', 'New Zealand', 'West Indies'];
  const playersList = ['Virat Kohli', 'Jasprit Bumrah', 'Rohit Sharma', 'Pat Cummins', 'Joe Root', 'Shaheen Afridi'];

  const toggleTeamFollow = (team: string) => {
    setUser((prev) => {
      const exists = prev.favoriteTeams.includes(team);
      return {
        ...prev,
        favoriteTeams: exists
          ? prev.favoriteTeams.filter((t) => t !== team)
          : [...prev.favoriteTeams, team],
      };
    });
  };

  const togglePlayerFollow = (player: string) => {
    setUser((prev) => {
      const exists = prev.favoritePlayers.includes(player);
      return {
        ...prev,
        favoritePlayers: exists
          ? prev.favoritePlayers.filter((p) => p !== player)
          : [...prev.favoritePlayers, player],
      };
    });
  };

  const toggleSaveArticle = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setSavedArticleIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const filteredNews = news.filter((item) => {
    if (category === 'Saved') {
      if (!savedArticleIds.includes(item.id)) return false;
    } else if (category !== 'All' && item.category !== category) {
      if (category === 'For You' && !user.favoriteTeams.some((t) => item.title.includes(t) || item.summary.includes(t))) {
        return true; // Fallback to display relevant items
      }
      if (category !== 'For You') return false;
    }

    if (searchQuery.trim()) {
      return (
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.summary.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    return true;
  });

  return (
    <div className="space-y-6 pb-24 max-w-5xl mx-auto">
      {/* Article Detail Drawer/Modal */}
      {selectedArticle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div
            className={`relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-3xl border shadow-2xl ${
              isDark ? 'bg-[#091b2e] border-slate-700 text-white' : 'bg-white border-slate-200 text-slate-900'
            }`}
          >
            <div className="relative h-64 overflow-hidden rounded-t-3xl bg-slate-800">
              <img
                src={selectedArticle.imageUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80'}
                alt={selectedArticle.title}
                referrerPolicy="no-referrer"
                loading="lazy"
                onError={(e) => {
                  (e.target as HTMLImageElement).src =
                    'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80';
                }}
                className="w-full h-full object-cover"
              />
              <button
                onClick={() => setSelectedArticle(null)}
                className="absolute top-4 right-4 p-2 rounded-full bg-slate-950/70 text-white hover:bg-slate-950 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-mono font-bold text-cyan-400">
                  <span>{selectedArticle.category}</span>
                  <span>•</span>
                  <span>{selectedArticle.source}</span>
                  <span>•</span>
                  <span>{selectedArticle.readTime}</span>
                </div>

                <button
                  onClick={(e) => toggleSaveArticle(e, selectedArticle.id)}
                  className="px-3 py-1.5 rounded-xl bg-slate-800 text-cyan-300 text-xs font-bold flex items-center gap-1.5 border border-slate-700"
                >
                  {savedArticleIds.includes(selectedArticle.id) ? (
                    <>
                      <BookmarkCheck className="w-4 h-4 text-cyan-400" />
                      <span>Bookmarked</span>
                    </>
                  ) : (
                    <>
                      <Bookmark className="w-4 h-4 text-slate-400" />
                      <span>Bookmark Story</span>
                    </>
                  )}
                </button>
              </div>

              <h2 className="text-xl sm:text-2xl font-extrabold">{selectedArticle.title}</h2>
              <p className={`text-xs font-mono ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                Published: {selectedArticle.publishedTime || selectedArticle.timeAgo}
              </p>
              <p className={`text-sm leading-relaxed ${isDark ? 'text-slate-300' : 'text-slate-700'}`}>
                {selectedArticle.summary}
              </p>
              {(isSafeHttpUrl(selectedArticle.url) || isSafeHttpUrl(selectedArticle.sourceUrl)) && (
                <div className="pt-2">
                  <a
                    href={isSafeHttpUrl(selectedArticle.url) ? selectedArticle.url : selectedArticle.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-all"
                  >
                    <span>Read Full Story on {selectedArticle.source}</span>
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className={`flex items-center gap-2 text-xs font-mono font-bold ${isDark ? 'text-cyan-400' : 'text-cyan-700'}`}>
            <Flame className="w-4 h-4" />
            <span>CRICKET NEWS & INSIGHTS</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight">Cricket News Hub</h1>
        </div>

        <button
          onClick={() => setShowCurateModal(true)}
          className="px-4 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md shadow-cyan-500/20"
        >
          <Filter className="w-4 h-4" />
          <span>Curate Followed Teams ({user.favoriteTeams.length + user.favoritePlayers.length})</span>
        </button>
      </div>

      {/* Search & Category Chips */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search news, players, tactics, series..."
            className={`w-full pl-10 pr-4 py-2.5 text-xs rounded-2xl border focus:outline-none focus:ring-2 focus:ring-cyan-400 ${
              isDark ? 'bg-[#091b2e] border-slate-800 text-white placeholder-slate-500' : 'bg-white border-slate-300 text-slate-900 placeholder-slate-500 font-medium shadow-2xs'
            }`}
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
          {['All', 'For You', 'Latest', 'Breaking News', 'Matches', 'Teams', 'Players', 'Tournaments', 'Saved'].map((cat) => (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className={`px-4 py-1.5 rounded-xl text-xs font-bold transition-all border whitespace-nowrap flex items-center gap-1.5 ${
                category === cat
                  ? 'bg-cyan-500 text-slate-950 font-extrabold border-cyan-400'
                  : isDark
                  ? 'bg-slate-800/80 text-slate-300 border-slate-700'
                  : 'bg-white text-slate-800 border-slate-300 hover:bg-slate-100 font-bold shadow-2xs'
              }`}
            >
              {cat === 'Saved' && <Bookmark className="w-3.5 h-3.5" />}
              <span>{cat}</span>
              {cat === 'Saved' && savedArticleIds.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-md bg-slate-950/30 text-[10px]">
                  {savedArticleIds.length}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* News Cards Grid */}
      {filteredNews.length === 0 ? (
        <div className={`p-12 text-center rounded-3xl border space-y-2 ${isDark ? 'border-slate-800 bg-slate-900/30' : 'border-slate-200 bg-white shadow-xs'}`}>
          <p className="font-bold text-sm">
            {news.length === 0
              ? 'External cricket news feeds are currently unavailable'
              : 'No news stories found in this category'}
          </p>
          <p className={`text-xs ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
            {news.length === 0
              ? getCricketDataStatus().lastNewsError ||
                'Configured RSS feeds (ESPNcricinfo, BBC Sport, Cricket Australia, The Guardian) have no articles available right now.'
              : "Try selecting 'All' or clearing your search filter."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredNews.map((item) => {
            const isSaved = savedArticleIds.includes(item.id);

            return (
              <div
                key={item.id}
                onClick={() => setSelectedArticle(item)}
                className={`group rounded-3xl border overflow-hidden cursor-pointer transition-all hover:border-cyan-500/50 hover:shadow-xl ${
                  isDark ? 'bg-[#091b2e] border-slate-800' : 'bg-white border-slate-200 shadow-xs'
                }`}
              >
                <div className="h-48 overflow-hidden relative bg-slate-800">
                  <img
                    src={item.imageUrl || 'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80'}
                    alt={item.title}
                    referrerPolicy="no-referrer"
                    loading="lazy"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src =
                        'https://images.unsplash.com/photo-1540747913346-19e32dc3e97e?auto=format&fit=crop&w=800&q=80';
                    }}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-slate-950/80 backdrop-blur-md text-cyan-400 text-[10px] font-mono font-bold border border-cyan-500/30">
                    {item.category}
                  </span>

                  <button
                    onClick={(e) => toggleSaveArticle(e, item.id)}
                    className={`absolute top-3 right-3 p-2 rounded-full backdrop-blur-md border transition-all ${
                      isSaved
                        ? 'bg-cyan-500 text-slate-950 border-cyan-300'
                        : 'bg-slate-950/70 text-slate-300 border-slate-700 hover:text-white'
                    }`}
                    title={isSaved ? 'Remove Bookmark' : 'Bookmark Article'}
                  >
                    {isSaved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                  </button>
                </div>
                <div className="p-5 space-y-2">
                  <h3 className={`font-bold text-base line-clamp-2 transition-colors ${isDark ? 'group-hover:text-cyan-400' : 'text-slate-950 group-hover:text-cyan-800'}`}>
                    {item.title}
                  </h3>
                  <p className={`text-xs line-clamp-2 ${isDark ? 'text-slate-400' : 'text-slate-600 font-medium'}`}>{item.summary}</p>
                  <div className={`flex items-center justify-between text-[11px] font-mono pt-3 border-t ${isDark ? 'text-slate-500 border-slate-800/50' : 'text-slate-600 border-slate-200 font-medium'}`}>
                    <span>{item.source}</span>
                    <span>
                      {item.timeAgo} • {item.readTime}
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Curate Followed Teams Modal */}
      {showCurateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
          <div
            className={`relative w-full max-w-lg p-6 rounded-3xl border shadow-2xl space-y-6 ${
              isDark ? 'bg-[#091b2e] border-slate-700 text-white' : 'bg-white border-slate-200'
            }`}
          >
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <h3 className="text-lg font-bold">Curate Your Following</h3>
              <button onClick={() => setShowCurateModal(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">
                  Follow Teams:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {teamsList.map((team) => {
                    const isFollowed = user.favoriteTeams.includes(team);
                    return (
                      <button
                        key={team}
                        onClick={() => toggleTeamFollow(team)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                          isFollowed
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isFollowed ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{team}</span>
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <h4 className="text-xs font-mono font-bold text-slate-400 uppercase mb-2">
                  Follow Key Players:
                </h4>
                <div className="flex flex-wrap gap-2">
                  {playersList.map((player) => {
                    const isFollowed = user.favoritePlayers.includes(player);
                    return (
                      <button
                        key={player}
                        onClick={() => togglePlayerFollow(player)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition-all ${
                          isFollowed
                            ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                            : 'bg-slate-800/80 text-slate-300 border-slate-700'
                        }`}
                      >
                        {isFollowed ? <Check className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
                        <span>{player}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            <button
              onClick={() => setShowCurateModal(false)}
              className="w-full py-3 bg-cyan-500 text-slate-950 font-bold text-xs rounded-2xl"
            >
              Save Preferences
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
