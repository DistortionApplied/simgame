"use client";

import { useState } from 'react';

interface SetupData {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
}

interface SetupWizardProps {
  onComplete: (data: SetupData) => void;
  onBack: () => void;
}

export default function SetupWizard({ onComplete, onBack }: SetupWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [setupData, setSetupData] = useState<SetupData>({
    playerName: '',
    computerName: '',
    rootPassword: '',
    userPassword: ''
  });

  const steps = [
    { title: 'Player Name', description: 'Enter your name for this session' },
    { title: 'Computer Setup', description: 'Configure your Linux system' },
    { title: 'Security', description: 'Set up system security' },
    { title: 'User Account', description: 'Set up your user password' },
    { title: 'Confirmation', description: 'Review your setup' }
  ];

  const updateSetupData = (field: keyof SetupData, value: string) => {
    setSetupData(prev => ({ ...prev, [field]: value }));
  };

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(setupData);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    } else {
      onBack();
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 0: // Player Name
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-green-400 font-semibold mb-2">Your Name</label>
              <input
                type="text"
                value={setupData.playerName}
                onChange={(e) => updateSetupData('playerName', e.target.value)}
                className="w-full bg-gray-800 border border-green-400/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
                placeholder="Enter your name"
                autoFocus
              />
              <p className="text-gray-400 text-sm mt-2">
                This will be used to identify you in the game.
              </p>
            </div>
          </div>
        );

      case 1: // Computer Setup
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-green-400 font-semibold mb-2">Computer Name</label>
              <input
                type="text"
                value={setupData.computerName}
                onChange={(e) => updateSetupData('computerName', e.target.value)}
                className="w-full bg-gray-800 border border-green-400/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
                placeholder="e.g., myserver, workstation"
                autoFocus
              />
              <p className="text-gray-400 text-sm mt-2">
                Choose a hostname for your Linux system (no spaces, lowercase preferred).
              </p>
            </div>
          </div>
        );

      case 2: // Security
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-green-400 font-semibold mb-2">Root Password</label>
              <input
                type="password"
                value={setupData.rootPassword}
                onChange={(e) => updateSetupData('rootPassword', e.target.value)}
                className="w-full bg-gray-800 border border-green-400/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
                placeholder="Enter root password"
                autoFocus
              />
              <p className="text-gray-400 text-sm mt-2">
                The root password is used for system administration. Make it secure!
              </p>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded p-3">
              <p className="text-yellow-400 text-sm">
                ⚠️ Remember this password! You&apos;ll need it to perform administrative tasks in the game.
              </p>
            </div>
          </div>
        );

      case 3: // User Account
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-green-400 font-semibold mb-2">Your Password</label>
              <input
                type="password"
                value={setupData.userPassword}
                onChange={(e) => updateSetupData('userPassword', e.target.value)}
                className="w-full bg-gray-800 border border-green-400/50 rounded px-3 py-2 text-white placeholder-gray-400 focus:border-green-400 focus:outline-none"
                placeholder="Enter your user password"
                autoFocus
              />
              <p className="text-gray-400 text-sm mt-2">
                This password will be used to switch between user accounts with the &apos;su&apos; command.
              </p>
            </div>
            <div className="bg-yellow-900/30 border border-yellow-600/50 rounded p-3">
              <p className="text-yellow-400 text-sm">
                🔑 Remember both passwords! You&apos;ll need them for sudo (root password) and su (user password) commands.
              </p>
            </div>
          </div>
        );

      case 4: // Confirmation
        return (
          <div className="space-y-6">
            <div className="bg-gray-800/50 rounded p-4">
              <h3 className="text-green-400 font-semibold mb-4">Setup Summary</h3>
              <div className="space-y-2 text-sm">
                <div><span className="text-gray-400">Player Name:</span> <span className="text-white">{setupData.playerName}</span></div>
                <div><span className="text-gray-400">Computer Name:</span> <span className="text-white">{setupData.computerName}</span></div>
                <div><span className="text-gray-400">Root Password:</span> <span className="text-white">{'*'.repeat(setupData.rootPassword.length)}</span></div>
                <div><span className="text-gray-400">User Password:</span> <span className="text-white">{'*'.repeat(setupData.userPassword.length)}</span></div>
              </div>
            </div>
            <div className="bg-blue-900/30 border border-blue-600/50 rounded p-3">
              <p className="text-blue-400 text-sm">
                🎮 Ready to start your Linux adventure? Your system is configured and ready to go!
              </p>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0: return setupData.playerName.trim().length > 0;
      case 1: return setupData.computerName.trim().length > 0 && /^[a-zA-Z0-9_-]+$/.test(setupData.computerName);
      case 2: return setupData.rootPassword.length >= 4;
      case 3: return setupData.userPassword.length >= 4;
      case 4: return true; // confirmation step
      default: return false;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-slate-800 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full bg-black/90 border border-green-400 rounded-lg p-8 shadow-2xl">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-green-400">System Setup</h2>
            <span className="text-gray-400 text-sm">Step {currentStep + 1} of {steps.length}</span>
          </div>
          <div className="w-full bg-gray-700 rounded-full h-2">
            <div
              className="bg-green-400 h-2 rounded-full transition-all duration-300"
              style={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
            />
          </div>
          <div className="flex justify-between mt-2">
            {steps.map((step, index) => (
              <div key={index} className={`text-xs ${index <= currentStep ? 'text-green-400' : 'text-gray-600'}`}>
                {step.title}
              </div>
            ))}
          </div>
        </div>

        {/* Current Step Content */}
        <div className="mb-8">
          <h3 className="text-xl font-semibold text-white mb-2">{steps[currentStep].title}</h3>
          <p className="text-gray-400 mb-6">{steps[currentStep].description}</p>
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={prevStep}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors duration-200"
          >
            {currentStep === 0 ? 'Back to Menu' : 'Previous'}
          </button>
          <button
            onClick={nextStep}
            disabled={!canProceed()}
            className={`px-6 py-2 rounded-lg transition-colors duration-200 ${
              canProceed()
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-600 text-gray-400 cursor-not-allowed'
            }`}
          >
            {currentStep === steps.length - 1 ? 'Start Game' : 'Next'}
          </button>
        </div>
      </div>
    </div>
  );
}