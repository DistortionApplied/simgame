"use client";

import { useState, useEffect } from 'react';

interface LoginScreenProps {
  onStartNewGame: () => void;
  onLoadExistingGame: () => void;
  onDeleteExistingGame: () => void;
  hasExistingGame: boolean;
}

export default function LoginScreen({ onStartNewGame, onLoadExistingGame, onDeleteExistingGame, hasExistingGame }: LoginScreenProps) {
  const [showWelcome, setShowWelcome] = useState(true);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  useEffect(() => {
    // Show welcome animation for a few seconds
    const timer = setTimeout(() => setShowWelcome(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showWelcome) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl font-bold text-white mb-4 animate-pulse">
            Linux Sim Game
          </div>
          <div className="text-xl text-blue-200 mb-8">
            Master the command line • Build your system • Conquer challenges
          </div>
          <div className="text-green-400 text-lg font-mono">
            Initializing terminal environment...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-black/80 border border-green-400 rounded-lg p-8 shadow-2xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-green-400 mb-2">Linux Sim Game</h1>
          <p className="text-gray-400 text-sm">Version 1.0 - Terminal Mastery</p>
        </div>

        <div className="space-y-4">
          <button
            onClick={onStartNewGame}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
          >
            🖥️  Start New Game
          </button>

          {hasExistingGame && (
            <>
              <button
                onClick={onLoadExistingGame}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
              >
                📁 Load Existing Game
              </button>

              <button
                onClick={() => setShowDeleteConfirm(true)}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-bold py-3 px-6 rounded-lg transition-colors duration-200 shadow-lg"
              >
                🗑️ Delete Existing Game
              </button>
            </>
          )}

          <div className="text-center mt-8">
            <p className="text-gray-500 text-xs">
              Learn Linux commands • Build file systems • Solve challenges
            </p>
          </div>
        </div>

        {/* Delete Confirmation Dialog */}
        {showDeleteConfirm && (
          <div className="mt-6 p-4 bg-red-900/20 border border-red-600/50 rounded-lg">
            <div className="text-center">
              <div className="text-red-400 font-semibold mb-2">⚠️ Delete Game Data</div>
              <p className="text-gray-300 text-sm mb-4">
                This will permanently delete your saved game, including all files, settings, and progress. This action cannot be undone.
              </p>
              <div className="flex space-x-3 justify-center">
                <button
                  onClick={() => {
                    onDeleteExistingGame();
                    setShowDeleteConfirm(false);
                  }}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded transition-colors duration-200"
                >
                  Delete Game
                </button>
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded transition-colors duration-200"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Terminal-style border */}
        <div className="mt-6 pt-4 border-t border-green-400/30">
          <div className="text-green-400 text-xs font-mono text-center">
            user@linux-sim:~$ _
          </div>
        </div>
      </div>
    </div>
  );
}