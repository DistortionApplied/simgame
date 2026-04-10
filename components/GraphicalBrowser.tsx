"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MockInternet, Website } from '../lib/internet';
import { GoogoSearchPage, generateSearchResults } from './Googo';
import ChasteBank from './ChasteBank';
import Spamazon from './Spamazon';
import Slickipedia from './Slickipedia';
import Glitchub from './Glitchub';
import ViewTube from './ViewTube';
import { getBrowserBookmarksKey, getBrowserHomeKey, getBrowserHistoryKey, getFromStorage, setInStorage } from '../lib/storage';


interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

interface GraphicalBrowserProps {
  initialUrl: string;
  onClose: () => void;
  mockInternet: MockInternet;
  setupData: GameSetup | null;
}

interface BrowserTab {
  url: string;
  title: string;
}

export default function GraphicalBrowser({ initialUrl, onClose, mockInternet, setupData }: GraphicalBrowserProps) {
  const [currentUrl, setCurrentUrl] = useState(initialUrl);
  const [urlInput, setUrlInput] = useState(initialUrl);
  const [currentWebsite, setCurrentWebsite] = useState<Website | null>(null);
  const [tabHistories, setTabHistories] = useState<string[][]>([[initialUrl]]);
  const [tabHistoryIndices, setTabHistoryIndices] = useState<number[]>([0]);
  const [tabs, setTabs] = useState<BrowserTab[]>([{ url: initialUrl, title: 'New Tab' }]);
  const [activeTab, setActiveTab] = useState(0);
  const [windowPosition, setWindowPosition] = useState({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [bookmarks, setBookmarks] = useState<string[]>(() => {
    const key = getBrowserBookmarksKey(setupData?.playerName || 'user');
    return getFromStorage<string[]>(key, []);
  });
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [homeUrl, setHomeUrl] = useState(() => {
    const key = getBrowserHomeKey(setupData?.playerName || 'user');
    return getFromStorage<string>(key, 'http://googo.com');
  });
  const dragOffsetRef = useRef(dragOffset);
  const contentRef = useRef<HTMLDivElement>(null);
 const [searchQuery, setSearchQuery] = useState<string | null>(null);
  const [contentKey, setContentKey] = useState(0);

  // Helpers for current tab's history
  const currentHistory = React.useMemo(() => tabHistories[activeTab] || [], [tabHistories, activeTab]);
  const currentHistoryIndex = React.useMemo(() => tabHistoryIndices[activeTab] || 0, [tabHistoryIndices, activeTab]);

  // Determine if the current website should be rendered in light mode
  const isLightTheme = currentWebsite?.domain === 'googo.com' || currentWebsite?.domain === 'slickipedia.org';

  // Load bookmarks, history, and home URL from localStorage
  const loadBookmarks = useCallback(() => {
    const key = `browser-bookmarks-${setupData?.playerName || 'user'}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setBookmarks(JSON.parse(stored));
    }
  }, [setupData]);

  const saveBookmarks = useCallback((newBookmarks: string[]) => {
    const key = getBrowserBookmarksKey(setupData?.playerName || 'user');
    if (setInStorage(key, newBookmarks)) {
      setBookmarks(newBookmarks);
    }
  }, [setupData]);

  const saveHomeUrl = useCallback((newHomeUrl: string) => {
    const key = getBrowserHomeKey(setupData?.playerName || 'user');
    if (setInStorage(key, newHomeUrl)) {
      setHomeUrl(newHomeUrl);
    }
  }, [setupData]);

  const loadHistory = useCallback(() => {
    const key = getBrowserHistoryKey(setupData?.playerName || 'user');
    const stored = getFromStorage<{ histories: string[][], indices: number[] } | null>(key, null);
    if (stored) {
      setTabHistories(stored.histories || [[initialUrl]]);
      setTabHistoryIndices(stored.indices || [0]);
    }
  }, [setupData, initialUrl]);

  const saveHistory = useCallback((newHistories: string[][], newIndices: number[]) => {
    const key = getBrowserHistoryKey(setupData?.playerName || 'user');
    setInStorage(key, { histories: newHistories, indices: newIndices });
  }, [setupData]);

  // Load website content when URL changes or refresh is triggered
  useEffect(() => {
    let urlObj: URL;
    try {
      urlObj = new URL(currentUrl.startsWith('http') ? currentUrl : 'http://' + currentUrl);
    } catch (error) {
      // Invalid URL
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentWebsite({
        domain: currentUrl,
        ip: '',
        content: `<html><body><h1>Error</h1><p>Invalid URL: '${currentUrl}'</p></body></html>`,
        type: 'static',
        title: 'Error'
      });
      setUrlInput(currentUrl);
      return;
    }

    const domain = urlObj.hostname;
    const path = urlObj.pathname;
    const searchParams = urlObj.searchParams;

    // Handle Googo search
    if (domain === 'googo.com' && path === '/search') {
      const query = searchParams.get('q') || '';
      const isLucky = searchParams.has('lucky');
      const searchResults = generateSearchResults(query, isLucky, mockInternet);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentWebsite({
        domain: 'googo.com',
        ip: mockInternet.resolveDomain('googo.com') || '',
        content: searchResults,
        type: 'static',
        title: `Googo Search${query ? ` - ${query}` : ''}`
      });
      setUrlInput(currentUrl);
      return;
    }

    // Reset search query if not on googo.com or not searching on googo.com
    if (domain !== 'googo.com' || path !== '/search') {
      setSearchQuery(null);
    }

    // Try to resolve domain
    const ip = mockInternet.resolveDomain(domain);
    if (!ip) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentWebsite({
        domain,
        ip: '',
        content: `<html><body><h1>Error</h1><p>Unable to resolve host '${domain}'</p></body></html>`,
        type: 'static',
        title: 'Error'
      });
      setUrlInput(currentUrl);
      return;
    }

    const website = mockInternet.getWebsiteByDomain(domain);
    if (!website) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentWebsite({
        domain,
        ip,
        content: `<html><body><h1>404 Not Found</h1><p>Page not found for '${domain}'</p></body></html>`,
        type: 'static',
        title: '404 Not Found'
      });
      setUrlInput(currentUrl);
      return;
    }

    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCurrentWebsite(website);
    setUrlInput(currentUrl);
  }, [currentUrl, mockInternet]);

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    navigateTo(urlInput);
  };

  const navigateTo = React.useCallback((url: string) => {
    setCurrentUrl(url);
    // Add to current tab's history if different from current
    if (currentHistory[currentHistoryIndex] !== url) {
      const newHistory = currentHistory.slice(0, currentHistoryIndex + 1);
      newHistory.push(url);
      const newHistories = [...tabHistories];
      newHistories[activeTab] = newHistory;
      const newIndices = [...tabHistoryIndices];
      newIndices[activeTab] = newHistory.length - 1;
      setTabHistories(newHistories);
      setTabHistoryIndices(newIndices);
      saveHistory(newHistories, newIndices);
    }
    // Update active tab
    const newTabs = [...tabs];
    newTabs[activeTab] = { ...newTabs[activeTab], url, title: currentWebsite?.title || url };
    setTabs(newTabs);
  }, [currentHistory, currentHistoryIndex, tabHistories, tabHistoryIndices, activeTab, tabs, currentWebsite, saveHistory]);

  const goBack = () => {
    if (currentHistoryIndex > 0) {
      const newIndices = [...tabHistoryIndices];
      newIndices[activeTab] = currentHistoryIndex - 1;
      setTabHistoryIndices(newIndices);
      setCurrentUrl(currentHistory[currentHistoryIndex - 1]);
      saveHistory(tabHistories, newIndices);
    }
  };

  const goForward = () => {
    if (currentHistoryIndex < currentHistory.length - 1) {
      const newIndices = [...tabHistoryIndices];
      newIndices[activeTab] = currentHistoryIndex + 1;
      setTabHistoryIndices(newIndices);
      setCurrentUrl(currentHistory[currentHistoryIndex + 1]);
      saveHistory(tabHistories, newIndices);
    }
  };

  const refresh = () => {
    // Force re-render of content by changing the key
    setContentKey(prev => prev + 1);
  };

  const addBookmark = () => {
    if (!bookmarks.includes(currentUrl)) {
      const newBookmarks = [...bookmarks, currentUrl];
      saveBookmarks(newBookmarks);
    }
  };

  const removeBookmark = (url: string) => {
    const newBookmarks = bookmarks.filter(b => b !== url);
    saveBookmarks(newBookmarks);
  };

  const navigateToBookmark = (url: string) => {
    navigateTo(url);
    setShowBookmarks(false);
    setShowHistory(false);
  };

  const navigateToHistory = (url: string) => {
    navigateTo(url);
    setShowBookmarks(false);
    setShowHistory(false);
  };

  const addTab = () => {
    const newTab = { url: 'about:blank', title: 'New Tab' };
    setTabs([...tabs, newTab]);
    setTabHistories([...tabHistories, ['about:blank']]);
    setTabHistoryIndices([...tabHistoryIndices, 0]);
    setActiveTab(tabs.length);
  };

  const closeTab = (index: number) => {
    if (tabs.length > 1) {
      const newTabs = tabs.filter((_, i) => i !== index);
      const newHistories = tabHistories.filter((_, i) => i !== index);
      const newIndices = tabHistoryIndices.filter((_, i) => i !== index);
      setTabs(newTabs);
      setTabHistories(newHistories);
      setTabHistoryIndices(newIndices);
      if (activeTab >= index && activeTab > 0) {
        setActiveTab(activeTab - 1);
      } else if (activeTab === index) {
        setActiveTab(Math.min(activeTab, newTabs.length - 1));
      }
    }
  };

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    setIsDragging(true);
    setDragOffset({
      x: e.clientX - windowPosition.x,
      y: e.clientY - windowPosition.y,
    });
  }, [windowPosition]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (isDragging) {
      setWindowPosition({
        x: e.clientX - dragOffsetRef.current.x,
        y: e.clientY - dragOffsetRef.current.y,
      });
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  // Handle link clicks in content
  React.useEffect(() => {
    const handleContentClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (target.tagName === 'A' && target.getAttribute('href')) {
        e.preventDefault();
        const href = target.getAttribute('href')!;
        navigateTo(href);
      }
    };

    const contentDiv = contentRef.current;
    if (contentDiv) {
      contentDiv.addEventListener('click', handleContentClick);
      return () => contentDiv.removeEventListener('click', handleContentClick);
    }
  }, [currentWebsite]);

  // Listen for navigation messages from embedded content
  React.useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data.type === 'navigate') {
        navigateTo(event.data.url);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [navigateTo]);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 z-50">
      <div
        className="bg-gray-900 w-full max-w-6xl h-5/6 rounded-lg shadow-2xl flex flex-col absolute border border-gray-700"
        style={{
          left: `${windowPosition.x}px`,
          top: `${windowPosition.y}px`,
          transform: isDragging ? 'rotate(1deg)' : 'none',
          transition: isDragging ? 'none' : 'transform 0.1s',
        }}
      >
        {/* Title bar */}
        <div
          className="bg-gray-800 text-white px-4 py-2 rounded-t-lg flex justify-between items-center cursor-move"
          onMouseDown={handleMouseDown}
        >
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full"></div>
            <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
            <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            <span className="ml-4 font-semibold">SimWeb Browser</span>
          </div>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            className="text-white hover:text-gray-300"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div className="bg-gray-800 px-2 py-1 flex items-center border-b border-gray-700">
          {tabs.map((tab, index) => (
            <div
              key={index}
              className={`px-3 py-1 mr-1 rounded-t cursor-pointer flex items-center text-white ${
                activeTab === index ? 'bg-gray-900 border-t border-l border-r border-gray-600' : 'bg-gray-700 hover:bg-gray-600'
              }`}
              onClick={() => { setActiveTab(index); setCurrentUrl(tabs[index].url); }}
            >
              <span className="text-sm mr-2">{tab.title}</span>
              {tabs.length > 1 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    closeTab(index);
                  }}
                  className="text-gray-400 hover:text-white ml-2"
                >
                  ✕
                </button>
              )}
            </div>
          ))}
          <button onClick={addTab} className="px-2 py-1 text-gray-400 hover:text-white">+</button>
        </div>

        {/* Navigation bar */}
        <div className="bg-gray-800 px-4 py-2 flex items-center space-x-2 border-b border-gray-700">
          <button
            onClick={goBack}
            disabled={currentHistoryIndex <= 0}
            className="px-2 py-1 bg-gray-600 text-white rounded disabled:opacity-50 hover:bg-gray-500"
          >
            ←
          </button>
          <button
            onClick={goForward}
            disabled={currentHistoryIndex >= currentHistory.length - 1}
            className="px-2 py-1 bg-gray-600 text-white rounded disabled:opacity-50 hover:bg-gray-500"
          >
            →
          </button>
          <button onClick={refresh} className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500">
            ↻
          </button>
          <button
            onClick={() => navigateTo(homeUrl)}
            className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
          >
            🏠
          </button>
          <div className="relative">
            <button
              onClick={() => setShowBookmarks(!showBookmarks)}
              className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              ⭐
            </button>
            {showBookmarks && (
              <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-10 min-w-48">
                <div className="p-2 border-b border-gray-600">
                  <button
                    onClick={addBookmark}
                    className="w-full text-left px-2 py-1 text-white hover:bg-gray-600 rounded text-sm"
                  >
                    Add Bookmark
                  </button>
                  <button
                    onClick={() => { saveHomeUrl(currentUrl); setShowBookmarks(false); }}
                    className="w-full text-left px-2 py-1 text-white hover:bg-gray-600 rounded text-sm mt-1"
                  >
                    Set as Home
                  </button>
                </div>
                {bookmarks.length > 0 && (
                  <div className="max-h-48 overflow-y-auto">
                    {bookmarks.map((bookmark, index) => (
                      <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-600">
                        <button
                          onClick={() => navigateToBookmark(bookmark)}
                          className="text-left text-white text-sm flex-1 truncate"
                        >
                          {bookmark}
                        </button>
                        <button
                          onClick={() => removeBookmark(bookmark)}
                          className="text-gray-400 hover:text-red-400 ml-2"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {bookmarks.length === 0 && (
                  <div className="p-2 text-gray-400 text-sm">No bookmarks</div>
                )}
              </div>
            )}
          </div>
          <div className="relative">
            <button
              onClick={() => setShowHistory(!showHistory)}
              className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500"
            >
              🕒
            </button>
            {showHistory && (
              <div className="absolute top-full left-0 mt-1 bg-gray-700 border border-gray-600 rounded shadow-lg z-10 min-w-48">
                <div className="max-h-48 overflow-y-auto">
                  {currentHistory.slice().reverse().map((url, index) => (
                    <button
                      key={index}
                      onClick={() => navigateToHistory(url)}
                      className="w-full text-left px-2 py-1 text-white hover:bg-gray-600 text-sm truncate"
                    >
                      {url}
                    </button>
                  ))}
                </div>
                {history.length === 0 && (
                  <div className="p-2 text-gray-400 text-sm">No history</div>
                )}
              </div>
            )}
          </div>
          <form onSubmit={handleUrlSubmit} className="flex-1 flex">
            <input
              type="text"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
              className="flex-1 px-3 py-1 bg-gray-700 text-white border border-gray-600 rounded-l focus:outline-none focus:ring-1 focus:ring-blue-500"
              placeholder="Enter URL..."
            />
            <button type="submit" className="px-3 py-1 bg-blue-600 text-white rounded-r hover:bg-blue-700">
              Go
            </button>
          </form>
        </div>

        {/* Content area */}
        <div key={contentKey} className={`flex-1 overflow-auto ${isLightTheme ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>
          {currentWebsite?.domain === 'googo.com' ? (
            searchQuery ? (
              <div className="max-w-4xl mx-auto p-4">
                <div
                  ref={contentRef}
                  dangerouslySetInnerHTML={{ __html: generateSearchResults(searchQuery, false, mockInternet) }}
                  onClick={(e) => {
                    const target = e.target as HTMLElement;
                    const link = target.closest('a');
                    if (link && link.href) {
                      e.preventDefault();
                      navigateTo(link.href);
                    }
                  }}
                />
              </div>
            ) : (
              <GoogoSearchPage onSearch={(q, lucky) => {
                if (lucky) {
                  const results = generateSearchResults(q, true, mockInternet);
                  const match = results.match(/url=(http[^"]*)/);
                  if (match) {
                    navigateTo(match[1]);
                  }
                } else {
                  setSearchQuery(q);
                }
              }} />
            )
          ) : currentWebsite?.domain === 'chastebank.com' ? (
            <ChasteBank setupData={setupData} mockInternet={mockInternet} />
          ) : currentWebsite?.domain === 'spamazon.com' ? (
            <Spamazon playerName={setupData?.playerName || 'user'} mockInternet={mockInternet} />
          ) : currentWebsite?.domain === 'slickipedia.org' ? (
            <Slickipedia setupData={setupData} mockInternet={mockInternet} initialUrl={currentUrl} />
          ) : currentWebsite?.domain === 'glitchub.com' ? (
            <Glitchub setupData={setupData} />
          ) : currentWebsite?.domain === 'viewtube.com' ? (
            <ViewTube setupData={setupData} />
          ) : currentWebsite ? (
            <div className="max-w-4xl mx-auto p-4">
              <div ref={contentRef} dangerouslySetInnerHTML={{ __html: currentWebsite.content }} />
            </div>
          ) : (
            <div className="flex items-center justify-center h-full text-gray-400">
              Loading...
            </div>
          )}
        </div>
      </div>
    </div>
  );
}