"use client";

import { useState, useEffect } from 'react';
import Terminal from '../components/Terminal';
import BootScreen from '../components/BootScreen';
import LoginPrompt from '../components/LoginPrompt';
import SetupWizard from '../components/SetupWizard';
import NanoEditor from '../components/NanoEditor';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

type GameState = 'boot' | 'login' | 'setup' | 'playing' | 'loading' | 'editing';

interface EditorState {
  filePath: string;
  content: string;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('boot');
  const [setupData, setSetupData] = useState<GameSetup | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  useEffect(() => {
    // No initial loading, start with boot
  }, []);

  const handleStartNewGame = () => {
    setGameState('setup');
  };

  const handleLoadExistingGame = () => {
    setGameState('playing');
  };

  const handleSetupComplete = (data: Omit<GameSetup, 'createdAt'>) => {
    const completeSetup: GameSetup = {
      ...data,
      createdAt: new Date().toISOString()
    };

    // Save setup data with username
    const key = `linux-sim-setup-${data.playerName}`;
    localStorage.setItem(key, JSON.stringify(completeSetup));
    setSetupData(completeSetup);

    // Clear existing filesystem for this user
    localStorage.removeItem(`linux-sim-filesystem-${data.playerName}`);

    setGameState('playing');
  };

  const handleBootComplete = () => {
    setGameState('login');
  };

  const handleLoginSuccess = (data: GameSetup) => {
    setSetupData(data);
    setGameState('playing');
  };

  const handleBackToLogin = () => {
    setGameState('login');
  }

  const handleDeleteExistingGame = () => {
    // Clear all saved game data
    localStorage.removeItem('linux-sim-setup');
    localStorage.removeItem('linux-sim-filesystem');
    setSetupData(null);
    // Stay on login screen since there's no game to load anymore
  };

  const handleOpenEditor = (filePath: string, content: string) => {
    setEditorState({ filePath, content });
    setGameState('editing');
  };

  const handleSaveFile = async (content: string) => {
    try {
      // Import filesystem dynamically to avoid circular dependencies
      const { FakeFileSystem } = await import('../lib/filesystem');
      const fs = new FakeFileSystem(setupData);
      const result = fs.writeFile(editorState!.filePath, content);
      if (result.success) {
        fs.saveToLocalStorage(); // Save the filesystem state
        return null; // Success
      } else {
        return result.error || 'Failed to save file';
      }
    } catch (error) {
      return 'Error saving file';
    }
  };

  const handleExitEditor = () => {
    setEditorState(null);
    setGameState('playing');
  };

  if (gameState === 'loading') {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-400 text-xl mb-4">Loading Linux Sim...</div>
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400 mx-auto"></div>
        </div>
      </div>
    );
  }

  if (gameState === 'boot') {
    return <BootScreen onBootComplete={handleBootComplete} />;
  }

  if (gameState === 'login') {
    return <LoginPrompt onLoginSuccess={handleLoginSuccess} onStartNewGame={handleStartNewGame} />;
  }

  if (gameState === 'setup') {
    return (
      <SetupWizard
        onComplete={handleSetupComplete}
        onBack={handleBackToLogin}
      />
    );
  }

  if (gameState === 'playing') {
    return <Terminal setupData={setupData} onOpenEditor={handleOpenEditor} />;
  }

  if (gameState === 'editing' && editorState) {
    return (
      <NanoEditor
        filePath={editorState.filePath}
        initialContent={editorState.content}
        onSave={handleSaveFile}
        onExit={handleExitEditor}
      />
    );
  }

  return null;
}