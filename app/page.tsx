"use client";

import { useState, useEffect } from 'react';
import Terminal from '../components/Terminal';
import LoginScreen from '../components/LoginScreen';
import SetupWizard from '../components/SetupWizard';
import NanoEditor from '../components/NanoEditor';

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

type GameState = 'login' | 'setup' | 'playing' | 'loading' | 'editing';

interface EditorState {
  filePath: string;
  content: string;
}

export default function Home() {
  const [gameState, setGameState] = useState<GameState>('loading');
  const [setupData, setSetupData] = useState<GameSetup | null>(null);
  const [editorState, setEditorState] = useState<EditorState | null>(null);

  useEffect(() => {
    // Check for existing game setup
    const savedSetup = localStorage.getItem('linux-sim-setup');
    if (savedSetup) {
      try {
        const parsed = JSON.parse(savedSetup);
        setSetupData(parsed);
      } catch (error) {
        console.warn('Invalid saved setup data');
      }
    }
    setGameState('login');
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

    // Save setup data
    localStorage.setItem('linux-sim-setup', JSON.stringify(completeSetup));
    setSetupData(completeSetup);

    // Clear existing filesystem to start fresh
    localStorage.removeItem('linux-sim-filesystem');

    setGameState('playing');
  };

  const handleBackToLogin = () => {
    setGameState('login');
  };

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
      const success = fs.writeFile(editorState!.filePath, content);
      if (success) {
        fs.saveToLocalStorage(); // Save the filesystem state
        console.log(`File saved: ${editorState!.filePath}`);
        return true;
      } else {
        console.error('Failed to save file');
        return false;
      }
    } catch (error) {
      console.error('Error saving file:', error);
      return false;
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

  if (gameState === 'login') {
    return (
      <LoginScreen
        onStartNewGame={handleStartNewGame}
        onLoadExistingGame={handleLoadExistingGame}
        onDeleteExistingGame={handleDeleteExistingGame}
        hasExistingGame={!!setupData}
      />
    );
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