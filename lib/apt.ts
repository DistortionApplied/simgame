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
      return {
        lines: [
          { type: 'input', content: command, commandPrompt: currentPrompt },
          { type: 'output', content: 'Get:1 http://archive.ubuntu.com/ubuntu focal InRelease [265 kB]' },
          { type: 'output', content: 'Get:2 http://archive.ubuntu.com/ubuntu focal-updates InRelease [114 kB]' },
          { type: 'output', content: 'Fetched 379 kB in 1s (379 kB/s)' },
          { type: 'output', content: 'Reading package lists... Done' }
        ]
      };
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
        return { output: `${packageName} is already the newest version (${pkg.version}).` };
      }

      // Simulate installation
      const lines: TerminalLine[] = [
        { type: 'input', content: command, commandPrompt: currentPrompt },
        { type: 'output', content: `Reading package lists... Done` },
        { type: 'output', content: `Building dependency tree... Done` },
        { type: 'output', content: `Reading state information... Done` },
        { type: 'output', content: `The following NEW packages will be installed:` },
        { type: 'output', content: `  ${packageName}` },
        { type: 'output', content: `0 upgraded, 1 newly installed, 0 to remove and 0 not upgraded.` },
        { type: 'output', content: `Need to get ${pkg.size} of archives.` },
        { type: 'output', content: `After this operation, ${pkg.size} of additional disk space will be used.` },
        { type: 'output', content: `Get:1 http://archive.ubuntu.com/ubuntu focal/universe ${packageName} ${pkg.version} [${pkg.size}]` },
        { type: 'output', content: `Fetched ${pkg.size} in 1s (500 kB/s)` },
        { type: 'output', content: `Selecting previously unselected package ${packageName}.` },
        { type: 'output', content: `(Reading database ... 1000 files and directories currently installed.)` },
        { type: 'output', content: `Unpacking ${packageName} (${pkg.version}) ...` },
        { type: 'output', content: `Setting up ${packageName} (${pkg.version}) ...` },
        { type: 'output', content: '' }
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
      }

      return { lines };
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
      const lines: TerminalLine[] = [
        { type: 'input', content: command, commandPrompt: currentPrompt },
        { type: 'output', content: `Reading package lists... Done` },
        { type: 'output', content: `Building dependency tree... Done` },
        { type: 'output', content: `Reading state information... Done` },
        { type: 'output', content: `The following packages will be REMOVED:` },
        { type: 'output', content: `  ${packageName}` },
        { type: 'output', content: `0 upgraded, 0 newly installed, 1 to remove and 0 not upgraded.` },
        { type: 'output', content: `(Reading database ... 1000 files and directories currently installed.)` },
        { type: 'output', content: `Removing ${packageName} (${installed[packageName].version}) ...` }
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
      }

      // Remove placeholder files
      fs.remove(`/usr/share/${packageName}/version.txt`);
      fs.removeDirectory(`/usr/share/${packageName}`);

      return { lines };
    }

    case 'search': {
      if (subArgs.length === 0) {
        return { error: 'apt search: missing search pattern' };
      }
      const pattern = subArgs[0].toLowerCase();
      const results = Object.values(AVAILABLE_PACKAGES)
        .filter(pkg => pkg.name.includes(pattern) || pkg.description.toLowerCase().includes(pattern))
        .map(pkg => `${pkg.name}/focal ${pkg.version} amd64\n  ${pkg.description}`);

      return { output: results.length === 0 ? '' : results.join('\n\n') };
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

      return {
        output: `Package: ${pkg.name}
Version: ${pkg.version}
Maintainer: ${pkg.maintainer}
Description: ${pkg.description}
Homepage: https://packages.ubuntu.com/focal/${pkg.name}
Download-Size: ${pkg.size}
APT-Manual-Installed: no
APT-Sources: http://archive.ubuntu.com/ubuntu focal/universe amd64 Packages
Description: ${pkg.description}`
      };
    }

    case 'list': {
      const installedKey = `linux-sim-installed-packages-${setupData?.playerName || 'user'}`;
      const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');

      if (subArgs.includes('--installed')) {
        const installedList = Object.keys(installed).map(name => `${name}/focal ${installed[name].version} amd64 [installed]`);
        return { output: installedList.join('\n') };
      } else {
        // List all available packages
        const allPackages = Object.values(AVAILABLE_PACKAGES).map(pkg => {
          const isInstalled = installed[pkg.name];
          return `${pkg.name}/focal ${pkg.version} amd64${isInstalled ? ' [installed]' : ''}`;
        });
        return { output: allPackages.join('\n') };
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
        return { output: 'All packages are up to date.' };
      } else {
        const lines: TerminalLine[] = [
          { type: 'input', content: command, commandPrompt: currentPrompt },
          { type: 'output', content: `Reading package lists... Done` },
          { type: 'output', content: `Building dependency tree... Done` },
          { type: 'output', content: `Reading state information... Done` },
          { type: 'output', content: `Calculating upgrade... Done` },
          { type: 'output', content: `The following packages will be upgraded:` },
          { type: 'output', content: `  ${upgradable.join(' ')}` },
          { type: 'output', content: `${upgradable.length} upgraded, 0 newly installed, 0 to remove and 0 not upgraded.` },
          { type: 'output', content: `Need to get 0 B of archives.` },
          { type: 'output', content: `After this operation, 0 B of additional disk space will be used.` },
          { type: 'output', content: `Reading changelogs... Done` },
          { type: 'output', content: `(Reading database ... 1000 files and directories currently installed.)` },
          ...upgradable.map(pkg => ({ type: 'output' as const, content: `Preparing to unpack .../${pkg} ...` })),
          ...upgradable.map(pkg => ({ type: 'output' as const, content: `Unpacking ${pkg} (${AVAILABLE_PACKAGES[pkg].version}) over (${installed[pkg].version}) ...` })),
          ...upgradable.map(pkg => ({ type: 'output' as const, content: `Setting up ${pkg} (${AVAILABLE_PACKAGES[pkg].version}) ...` }))
        ];

        // Update versions
        const updatedInstalled = { ...installed };
        upgradable.forEach(pkg => {
          updatedInstalled[pkg] = { ...AVAILABLE_PACKAGES[pkg], installedAt: new Date().toISOString() };
        });
        localStorage.setItem(installedKey, JSON.stringify(updatedInstalled));

        return { lines };
      }
    }

    default:
      return { error: `apt: invalid operation ${subcommand}\nTry: apt --help` };
  }
}