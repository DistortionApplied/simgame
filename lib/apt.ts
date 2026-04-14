import { FakeFileSystem } from './filesystem';
import { TerminalLine } from '../components/Terminal';

export interface PackageInfo {
  name: string;
  version: string;
  description: string;
  maintainer: string;
  size: string;
  dependencies: string[];
  provides: string[];
}

// Package database for apt simulation
export const AVAILABLE_PACKAGES: Record<string, PackageInfo> = {
  'nano': {
    name: 'nano',
    version: '6.2-1',
    description: 'small, friendly text editor inspired by Pico',
    maintainer: 'Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>',
    size: '548 kB',
    dependencies: [],
    provides: ['editor']
  },
  'nmap': {
    name: 'nmap',
    version: '7.91+dfsg1+really7.80+dfsg1-2',
    description: 'Nmap - The Network Mapper',
    maintainer: 'Debian Security Tools <team+pkg-security@tracker.debian.org>',
    size: '1,234 kB',
    dependencies: [],
    provides: ['network-scanner']
  },
  'snake': {
    name: 'snake',
    version: '1.0-1',
    description: 'Classic Snake game for the terminal',
    maintainer: 'Game Developers <games@ubuntu.com>',
    size: '256 kB',
    dependencies: [],
    provides: ['game']
  },
  'browser': {
    name: 'browser',
    version: '1.0-1',
    description: 'Simple terminal-based web browser for viewing simulated websites',
    maintainer: 'Web Developers <web@ubuntu.com>',
    size: '512 kB',
    dependencies: [],
    provides: ['web-browser']
  },
  'geemail': {
    name: 'geemail',
    version: '1.0-1',
    description: 'GeeMail email client for sending and receiving virtual emails',
    maintainer: 'GeeMail Team <geemail@ubuntu.com>',
    size: '1,024 kB',
    dependencies: [],
    provides: ['email-client']
  }
};

export function createIsPackageInstalled(setupData: any) {
  return (packageName: string): boolean => {
    const installedKey = `linux-sim-installed-packages-${setupData?.playerName || 'user'}`;
    const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');
    return !!installed[packageName];
  };
}

export function executeApt(
  args: string[],
  command: string,
  currentPrompt: string,
  setupData: any,
  fs: FakeFileSystem,
  AVAILABLE_PACKAGES: Record<string, PackageInfo>,
  isPackageInstalled: (name: string) => boolean
): { lines?: TerminalLine[]; output?: string; error?: string } {
  if (args.includes('--help') || args.includes('-h')) {
    return {
      output: `apt - command-line package manager

SYNOPSIS
    apt [OPTIONS] COMMAND

DESCRIPTION
    apt provides a high-level command-line interface for the package management
    system. It is intended as an end user interface and enables some options
    better suited for interactive usage by default compared to more specialized
    APT tools like apt-get(8) and apt-cache(8).

COMMANDS
    install    Install packages
    remove     Remove packages
    search     Search for packages
    show       Show package details
    list       List packages
    update     Update package list
    upgrade    Upgrade all packages

OPTIONS
    -h, --help
            Show this help message.

EXAMPLES
    apt update
            Update package list

    apt install nano
            Install nano text editor

    apt search editor
            Search for text editors

SEE ALSO
    apt-get(8), apt-cache(8)
`
    };
  }

  if (args.length === 0) {
    return { error: 'apt: missing command\nTry: apt --help' };
  }

  const subcommand = args[0];
  const subArgs = args.slice(1);

  switch (subcommand) {
    case 'update': {
      // Simulate package list update
      const output = `Ign:1 http://archive.ubuntu.com/ubuntu focal InRelease
Get:2 http://security.ubuntu.com/ubuntu focal-security InRelease [114 kB]
Hit:3 http://archive.ubuntu.com/ubuntu focal-updates InRelease
Get:4 http://archive.ubuntu.com/ubuntu focal-backports InRelease [108 kB]
Get:5 http://archive.ubuntu.com/ubuntu focal/universe InRelease [234 kB]
Hit:6 http://archive.ubuntu.com/ubuntu focal/multiverse InRelease
Get:7 http://deb.debian.org/debian stable/main InRelease [118 kB]
Ign:8 http://deb.debian.org/debian stable/contrib InRelease
Get:9 http://deb.debian.org/debian stable/non-free InRelease [132 kB]
Hit:10 http://archive.debian.org/debian-security stable-security/updates InRelease
Get:11 http://archive.debian.org/debian-backports stable-backports/main InRelease [89 kB]
Fetched 689 kB in 2s (344 kB/s)
Reading package lists... Done`;
      return { lines: output.split('\n').map(line => ({ type: 'output', content: line })) };
    }


    case 'install': {
      if (subArgs.length === 0) {
        return { error: 'apt install: missing package name' };
      }
      const packageName = subArgs[0];
      const pkg = AVAILABLE_PACKAGES[packageName];

      if (!pkg) {
        return { error: `E: Unable to locate package ${packageName}` };
      }

      // Get installed packages from localStorage
      const installedKey = `linux-sim-installed-packages-${setupData?.playerName || 'user'}`;
      const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');

      if (installed[packageName]) {
        return { lines: [{ type: 'output', content: `${packageName} is already the newest version (${pkg.version}).` }] };
      }

      // Simulate installation
      const outputLines = [
        `Reading package lists... Done`,
        `Building dependency tree... Done`,
        `Reading state information... Done`,
        `The following NEW packages will be installed:`,
        `  ${packageName}`,
        `0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.`,
        `Need to get ${pkg.size} of archives.`,
        `After this operation, ${pkg.size} of additional disk space will be used.`,
        `Get:1 http://archive.ubuntu.com/ubuntu focal/universe ${packageName} ${pkg.version} [${pkg.size}]`,
        `Fetched ${pkg.size} in 1s (500 kB/s)`,
        `Selecting previously unselected package ${packageName}.`,
        `(Reading database ... 1000 files and directories currently installed.)`,
        `Package ${packageName} installed.`,
        ''
      ];

      // Mark as installed
      installed[packageName] = { ...pkg, installedAt: new Date().toISOString() };
      localStorage.setItem(installedKey, JSON.stringify(installed));

      // Create some placeholder files for the package
      fs.createNewDirectory(`/usr/share/${packageName}`);
      fs.createNewFile(`/usr/share/${packageName}/version.txt`);
      fs.writeFile(`/usr/share/${packageName}/version.txt`, pkg.version);

      // Create binary for the package if needed
      if (packageName === 'nano') {
        fs.createNewFile(`/bin/nano.bin`);
        fs.writeFile(`/bin/nano.bin`, '#!/bin/bash\n# nano text editor binary\n');
      } else if (packageName === 'nmap') {
        fs.createNewFile(`/bin/nmap.bin`);
        fs.writeFile(`/bin/nmap.bin`, '#!/bin/bash\n# nmap network scanner binary\n');
      } else if (packageName === 'snake') {
        fs.createNewFile(`/bin/snake.bin`);
        fs.writeFile(`/bin/snake.bin`, '#!/bin/bash\n# snake game binary\n');
      }

      return { lines: [{ type: 'input' as const, content: command, commandPrompt: currentPrompt }, ...outputLines.map(content => ({ type: 'output' as const, content }))] };
    }

    case 'remove': {
      if (subArgs.length === 0) {
        return { error: 'apt remove: missing package name' };
      }
      const packageName = subArgs[0];

      // Get installed packages
      const installedKey = `linux-sim-installed-packages-${setupData?.playerName || 'user'}`;
      const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');

      if (!installed[packageName]) {
        return { error: `Package '${packageName}' is not installed, so not removed` };
      }

      // Simulate removal
      const outputLines = [
        `Reading package lists... Done`,
        `Building dependency tree... Done`,
        `Reading state information... Done`,
        `The following packages will be REMOVED:`,
        `  ${packageName}`,
        `0 upgraded, 0 newly installed, 1 to remove and 0 not upgraded.`,
        `(Reading database ... 1000 files and directories currently installed.)`,
        `Removing ${packageName} (${installed[packageName].version}) ...`
      ];

      // Remove from installed
      const updatedInstalled = { ...installed };
      delete updatedInstalled[packageName];
      localStorage.setItem(installedKey, JSON.stringify(updatedInstalled));

      // Remove binary for the package if needed
      if (packageName === 'nano') {
        fs.remove(`/bin/nano.bin`);
      } else if (packageName === 'nmap') {
        fs.remove(`/bin/nmap.bin`);
      } else if (packageName === 'snake') {
        fs.remove(`/bin/snake.bin`);
      }

      // Remove placeholder files
      fs.remove(`/usr/share/${packageName}/version.txt`);
      fs.removeDirectory(`/usr/share/${packageName}`);

      return { lines: [{ type: 'input' as const, content: command, commandPrompt: currentPrompt }, ...outputLines.map(content => ({ type: 'output' as const, content }))] };
    }

    case 'search': {
      if (subArgs.length === 0) {
        return { error: 'apt search: missing search pattern' };
      }
      const pattern = subArgs[0].toLowerCase();
      const results = Object.values(AVAILABLE_PACKAGES)
        .filter(pkg => pkg.name.includes(pattern) || pkg.description.toLowerCase().includes(pattern))
        .map(pkg => `${pkg.name}/focal ${pkg.version} amd64\n  ${pkg.description}`);

      return { lines: results.length === 0 ? [] : results.join('\n\n').split('\n').map(line => ({ type: 'output', content: line })) };
    }

    case 'show': {
      if (subArgs.length === 0) {
        return { error: 'apt show: missing package name' };
      }
      const packageName = subArgs[0];
      const pkg = AVAILABLE_PACKAGES[packageName];

      if (!pkg) {
        return { error: `E: Unable to locate package ${packageName}` };
      }

      const output = `Package: ${pkg.name}
Version: ${pkg.version}
Maintainer: ${pkg.maintainer}
Description: ${pkg.description}
Homepage: https://packages.ubuntu.com/focal/${pkg.name}
Download-Size: ${pkg.size}
APT-Manual-Installed: no
APT-Sources: http://archive.ubuntu.com/ubuntu focal/universe amd64 Packages
Description: ${pkg.description}`;
      return { lines: output.split('\n').map(line => ({ type: 'output', content: line })) };
    }

    case 'list': {
      const installedKey = `linux-sim-installed-packages-${setupData?.playerName || 'user'}`;
      const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');

      if (subArgs.includes('--installed')) {
        const installedList = Object.keys(installed).map(name => `${name}/focal ${installed[name].version} amd64 [installed]`);
        return { lines: installedList.map(line => ({ type: 'output', content: line })) };
      } else {
        // List all available packages
        const allPackages = Object.values(AVAILABLE_PACKAGES).map(pkg => {
          const isInstalled = installed[pkg.name];
          return `${pkg.name}/focal ${pkg.version} amd64${isInstalled ? ' [installed]' : ''}`;
        });
        return { lines: allPackages.map(line => ({ type: 'output', content: line })) };
      }
    }

    case 'upgrade': {
      const installedKey = `linux-sim-installed-packages-${setupData?.playerName || 'user'}`;
      const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');

      const upgradable = Object.keys(installed).filter(name => {
        const current = installed[name];
        const available = AVAILABLE_PACKAGES[name];
        return available && available.version !== current.version;
      });

      if (upgradable.length === 0) {
        return { lines: [{ type: 'output', content: 'All packages are up to date.' }] };
      } else {
        const outputLines = [
          `Reading package lists... Done`,
          `Building dependency tree... Done`,
          `Reading state information... Done`,
          `Calculating upgrade... Done`,
          `The following packages will be upgraded:`,
          `  ${upgradable.join(' ')}`,
          `${upgradable.length} upgraded, 0 newly installed, 0 to remove and 0 not upgraded.`,
          `Need to get 0 B of archives.`,
          `After this operation, 0 B of additional disk space will be used.`,
          `Reading changelogs... Done`,
          `(Reading database ... 1000 files and directories currently installed.)`,
          ...upgradable.map(pkg => `Preparing to unpack .../${pkg} ...`),
          ...upgradable.map(pkg => `Unpacking ${pkg} (${AVAILABLE_PACKAGES[pkg].version}) over (${installed[pkg].version}) ...`),
          ...upgradable.map(pkg => `Setting up ${pkg} (${AVAILABLE_PACKAGES[pkg].version}) ...`)
        ];

        // Update versions
        const updatedInstalled = { ...installed };
        upgradable.forEach(pkg => {
          updatedInstalled[pkg] = { ...AVAILABLE_PACKAGES[pkg], installedAt: new Date().toISOString() };
        });
        localStorage.setItem(installedKey, JSON.stringify(updatedInstalled));

        return { output: outputLines.join('\n') };
      }
    }

    default:
      return { error: `apt: invalid operation ${subcommand}\nTry: apt --help` };
  }
}