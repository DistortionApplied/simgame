/**
 * Utility functions for localStorage management across the application
 */

export interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

/**
 * Generate storage key for game setup data
 */
export function getGameSetupKey(playerName: string): string {
  return `linux-sim-setup-${playerName}`;
}

/**
 * Generate storage key for filesystem data
 */
export function getFilesystemKey(playerName: string): string {
  return `linux-sim-filesystem-${playerName}`;
}

/**
 * Generate storage key for internet/mock web data
 */
export function getInternetKey(playerName: string): string {
  return `linux-sim-internet-${playerName}`;
}

/**
 * Generate storage key for installed packages
 */
export function getInstalledPackagesKey(playerName: string): string {
  return `linux-sim-installed-packages-${playerName}`;
}

/**
 * Generate storage key for terminal history
 */
export function getTerminalHistoryKey(playerName: string): string {
  return `terminal-history-${playerName}`;
}

/**
 * Generate storage key for browser bookmarks
 */
export function getBrowserBookmarksKey(playerName: string): string {
  return `browser-bookmarks-${playerName}`;
}

/**
 * Generate storage key for browser home URL
 */
export function getBrowserHomeKey(playerName: string): string {
  return `browser-home-${playerName}`;
}

/**
 * Generate storage key for browser history
 */
export function getBrowserHistoryKey(playerName: string): string {
  return `browser-history-${playerName}`;
}

/**
 * Generate storage key for bank account
 */
export function getBankAccountKey(playerName: string): string {
  return `bank-account-${playerName}`;
}

/**
 * Safe localStorage get with JSON parsing
 */
export function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultValue;
  } catch (error) {
    console.error(`Failed to load data from localStorage key "${key}":`, error);
    return defaultValue;
  }
}

/**
 * Safe localStorage set with JSON stringification
 */
export function setInStorage<T>(key: string, value: T): boolean {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.error(`Failed to save data to localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Remove item from localStorage safely
 */
export function removeFromStorage(key: string): boolean {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error(`Failed to remove data from localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Check if localStorage key exists
 */
export function hasStorageKey(key: string): boolean {
  try {
    return localStorage.getItem(key) !== null;
  } catch (error) {
    console.error(`Failed to check localStorage key "${key}":`, error);
    return false;
  }
}

/**
 * Clear all game-related data for a player
 */
export function clearPlayerData(playerName: string): void {
  const keys = [
    getGameSetupKey(playerName),
    getFilesystemKey(playerName),
    getInternetKey(playerName),
    getInstalledPackagesKey(playerName),
    getTerminalHistoryKey(playerName),
    getBrowserBookmarksKey(playerName),
    getBrowserHomeKey(playerName),
    getBrowserHistoryKey(playerName),
    getBankAccountKey(playerName)
  ];

  keys.forEach(key => removeFromStorage(key));
}

/**
 * Get default player name (fallback)
 */
export function getDefaultPlayerName(): string {
  return 'user';
}