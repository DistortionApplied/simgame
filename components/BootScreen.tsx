"use client";

import { useState, useEffect } from 'react';

interface BootScreenProps {
  onBootComplete: () => void;
}

export default function BootScreen({ onBootComplete }: BootScreenProps) {
  const [bootLines, setBootLines] = useState<string[]>([]);

  useEffect(() => {
    const messages = [
      '',
      'BIOS Information',
      'Vendor: Linux Sim BIOS',
      'Version: 1.0',
      'Release Date: ' + new Date().toISOString().split('T')[0],
      '',
      'CPU: Linux Sim Processor (1 cores, 1 threads)',
      'Memory: 512 MB',
      'Memory Test: Passed',
      '',
      'Loading Linux 5.15.0-91-generic...',
      'Loading initial ramdisk...',
      '',
      'Begin: Loading essential drivers ... [    0.09] done.',
      'Begin: Running /scripts/init-premount ... [    0.09] done.',
      'Begin: Mounting root file system ... [    0.10] done.',
      'Begin: Running /scripts/local-bottom ... [    0.10] done.',
      'Begin: Running /scripts/init-bottom ... [    0.10] done.',
      '',
      '[    1.234567] systemd[1]: systemd 249.11-0ubuntu3.9 running in system mode',
      '[    1.234567] systemd[1]: Detected virtualization container.',
      '[    1.234567] systemd[1]: Detected architecture x86-64.',
      '',
      'Welcome to Linux Sim!',
      '',
      'Linux Sim login: '
    ];

    let index = 0;
    const interval = setInterval(() => {
      if (index < messages.length) {
        setBootLines(prev => [...prev, messages[index]]);
        index++;
      } else {
        clearInterval(interval);
        setTimeout(onBootComplete, 1000); // Wait a bit after last message
      }
    }, 200); // Faster than reboot for boot sequence

    return () => clearInterval(interval);
  }, [onBootComplete]);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4 overflow-hidden">
      <div className="whitespace-pre-wrap">
        {bootLines.map((line, index) => (
          <div key={index}>{line}</div>
        ))}
        {bootLines.length > 0 && bootLines[bootLines.length - 1] === 'Linux Sim login: ' && (
          <span className="animate-pulse">|</span>
        )}
      </div>
    </div>
  );
}