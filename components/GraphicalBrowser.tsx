"use client";

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MockInternet, Website } from '../lib/internet';

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
  const [history, setHistory] = useState<string[]>([initialUrl]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [tabs, setTabs] = useState<BrowserTab[]>([{ url: initialUrl, title: 'New Tab' }]);
  const [activeTab, setActiveTab] = useState(0);
  const [windowPosition, setWindowPosition] = useState({ x: 100, y: 50 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [bookmarks, setBookmarks] = useState<string[]>([]);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const dragOffsetRef = useRef(dragOffset);

  // Determine if the current website should be rendered in light mode
  const isLightTheme = currentWebsite?.domain === 'googo.com' || currentWebsite?.domain === 'wikipedia.org';

  // Load bookmarks and history from localStorage
  const loadBookmarks = useCallback(() => {
    const key = `browser-bookmarks-${setupData?.playerName || 'user'}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      setBookmarks(JSON.parse(stored));
    }
  }, [setupData]);

  const saveBookmarks = useCallback((newBookmarks: string[]) => {
    const key = `browser-bookmarks-${setupData?.playerName || 'user'}`;
    localStorage.setItem(key, JSON.stringify(newBookmarks));
    setBookmarks(newBookmarks);
  }, [setupData]);

  const loadHistory = useCallback(() => {
    const key = `browser-history-${setupData?.playerName || 'user'}`;
    const stored = localStorage.getItem(key);
    if (stored) {
      const parsedHistory = JSON.parse(stored);
      setHistory(parsedHistory.history || [initialUrl]);
      setHistoryIndex(parsedHistory.index || 0);
    }
  }, [setupData, initialUrl]);

  const saveHistory = useCallback((newHistory: string[], newIndex: number) => {
    const key = `browser-history-${setupData?.playerName || 'user'}`;
    localStorage.setItem(key, JSON.stringify({ history: newHistory, index: newIndex }));
  }, [setupData]);

  // Load website content when URL changes
  useEffect(() => {
    dragOffsetRef.current = dragOffset;
  }, [dragOffset]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadBookmarks();
    // eslint-disable-next-line react-hooks/set-state-in-effect
    loadHistory();
  }, [loadBookmarks, loadHistory]);

  useEffect(() => {
    // Remove http:// if present
    const domain = currentUrl.replace(/^https?:\/\//, '');

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

  const navigateTo = (url: string) => {
    setCurrentUrl(url);
    // Add to history if different from current
    if (history[historyIndex] !== url) {
      const newHistory = history.slice(0, historyIndex + 1);
      newHistory.push(url);
      setHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
      saveHistory(newHistory, newHistory.length - 1);
    }
    // Update active tab
    const newTabs = [...tabs];
    newTabs[activeTab] = { ...newTabs[activeTab], url, title: currentWebsite?.title || url };
    setTabs(newTabs);
  };

  const goBack = () => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1);
      setCurrentUrl(history[historyIndex - 1]);
    }
  };

  const goForward = () => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1);
      setCurrentUrl(history[historyIndex + 1]);
    }
  };

  const refresh = () => {
    // Trigger re-load by updating URL (useEffect will handle)
    setCurrentUrl(currentUrl);
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
    setActiveTab(tabs.length);
  };

  const closeTab = (index: number) => {
    if (tabs.length > 1) {
      const newTabs = tabs.filter((_, i) => i !== index);
      setTabs(newTabs);
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
            disabled={historyIndex <= 0}
            className="px-2 py-1 bg-gray-600 text-white rounded disabled:opacity-50 hover:bg-gray-500"
          >
            ←
          </button>
          <button
            onClick={goForward}
            disabled={historyIndex >= history.length - 1}
            className="px-2 py-1 bg-gray-600 text-white rounded disabled:opacity-50 hover:bg-gray-500"
          >
            →
          </button>
          <button onClick={refresh} className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-500">
            ↻
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
                  {history.slice().reverse().map((url, index) => (
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
        <div className={`flex-1 overflow-auto p-4 ${isLightTheme ? 'bg-white text-black' : 'bg-gray-900 text-white'}`}>
          {currentWebsite ? (
            <div className="max-w-4xl mx-auto">
              <div dangerouslySetInnerHTML={{ __html: currentWebsite.content }} />
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