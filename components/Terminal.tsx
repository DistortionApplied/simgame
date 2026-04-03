"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { FakeFileSystem, User } from '../lib/filesystem';
import { executeNmap } from '../lib/nmap';
import { executeApt, AVAILABLE_PACKAGES, createIsPackageInstalled } from '../lib/apt';
import { getCommandHelp } from '../lib/commandHelp';
import { executeReboot } from '../lib/reboot';
import { MockInternet } from '../lib/internet';

export interface TerminalLine {
  type: 'input' | 'output' | 'error';
  content: string;
  commandPrompt?: string;
}

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

interface TerminalProps {
  setupData: GameSetup | null;
  onOpenEditor: (filePath: string, content: string) => void;
  onOpenSnake: () => void;
  onOpenBrowser: (url: string) => void;
  onReboot: () => void;
}

export default function Terminal({ setupData, onOpenEditor, onOpenSnake, onOpenBrowser, onReboot }: TerminalProps) {
  // Game-specific commands that are always available (don't require binaries)
  const builtinCommands = ['cd', 'pwd', 'help', 'sudo', 'su', 'reboot', 'clear', 'debug', 'save', 'reset', 'adduser', 'userdel', 'passwd', 'ping', 'ifconfig', 'browser'];

  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: `Welcome to Linux Sim Game, ${setupData?.playerName || 'User'}!` },
    { type: 'output', content: `Connected to ${setupData?.computerName || 'linux-sim'}` },
    { type: 'output', content: 'Type "help" for available commands or "cat README.txt" for more information.' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fs] = useState(() => {
    const filesystem = new FakeFileSystem(setupData);
    if (setupData) {
      const homeDir = filesystem.getCurrentUser().home;
      filesystem.changeDirectory(homeDir);
    }
    return filesystem;
  });
  const [mockInternet] = useState(() => setupData ? new MockInternet(setupData) : null);
  const [currentUser, setCurrentUser] = useState(() => fs.getCurrentUser());
  const [sessionUser, setSessionUser] = useState(() => fs.getCurrentUser());
  const [workingDirectory, setWorkingDirectory] = useState(fs.getWorkingDirectory());
  const currentPrompt = useMemo(() =>
    `${currentUser.name}@${setupData?.computerName || 'linux-sim'}:${workingDirectory}$ `,
    [currentUser, setupData, workingDirectory]
  );
  const isPackageInstalled = useMemo(() => createIsPackageInstalled(setupData), [setupData]);
  const [awaitingPassword, setAwaitingPassword] = useState(false);
  const [passwordCallback, setPasswordCallback] = useState<((password: string) => void) | null>(null);

  // Helper function to get installed packages
  const getInstalledPackages = () => {
    const installedKey = `linux-sim-installed-packages-${setupData?.playerName || 'user'}`;
    return JSON.parse(localStorage.getItem(installedKey) || '{}');
  };  const [passwordPrompt, setPasswordPrompt] = useState('');
  const [isRebooting, setIsRebooting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);
  const isPasswordHandledRef = useRef(false);

  // Helper method for find command
  const findFiles = (dir: any, pattern: string, currentPath: string, results: string[]) => {
    if (!dir.children) return;

    for (const [name, node] of dir.children) {
      const fullPath = currentPath === '/' ? `/${name}` : `${currentPath}/${name}`;

      if (name.includes(pattern.replace('*', ''))) {
        results.push(fullPath);
      }

      if (node.type === 'directory') {
        findFiles(node, pattern, fullPath, results);
      }
    }
  };

  // Helper method for recursive directory removal
  const removeDirectoryRecursive = (path: string) => {
    const node = fs.getNode(path);
    if (!node || node.type !== 'directory') return;

    if (node.children) {
      for (const [name, childNode] of Array.from(node.children)) {
        const childPath = path === '/' ? `/${name}` : `${path}/${name}`;
        if (childNode.type === 'directory') {
          removeDirectoryRecursive(childPath);
        } else {
          fs.remove(childPath);
        }
      }
    }

    // Now remove the directory itself from its parent
    if (node.parent && node.parent.children) {
      node.parent.children.delete(node.name);
    }
  };

  const executeCommand = (command: string) => {
    if (!fs) return;

    // Handle password input
    if (awaitingPassword && passwordCallback) {
      isPasswordHandledRef.current = false;
      passwordCallback(command);
      if (!isPasswordHandledRef.current) {
        setAwaitingPassword(false);
        setPasswordCallback(null);
        setPasswordPrompt('');
        setCurrentInput('');
      }
      return;
    }

    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add command to history
    setCommandHistory(prev => [...prev, trimmedCommand]);
    setHistoryIndex(-1);

    // Parse redirection operators
    let redirectOutput: string | null = null;
    let redirectInput: string | null = null;
    let appendOutput = false;

    // Simple redirection parsing (basic support)
    // Check >> before > since >> contains >
    const appendIndex = trimmedCommand.indexOf(' >>');
    const redirectIndex = trimmedCommand.indexOf(' >');
    const inputIndex = trimmedCommand.indexOf(' <');

    let commandPart = trimmedCommand;

    // Handle output redirection (append) - must check >> before > since >> contains >
    if (appendIndex !== -1) {
      const parts = trimmedCommand.split(' >>', 2);
      commandPart = parts[0].trim();
      redirectOutput = parts[1].trim();
      appendOutput = true;
    }
    // Handle output redirection (overwrite)
    else if (redirectIndex !== -1) {
      const parts = trimmedCommand.split(' >', 2);
      commandPart = parts[0].trim();
      redirectOutput = parts[1].trim();
      appendOutput = false;
    }

    // Handle input redirection
    if (inputIndex !== -1) {
      const parts = commandPart.split(' <', 2);
      commandPart = parts[0].trim();
      redirectInput = parts[1].trim();
    }

    const parts = commandPart.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    let output: string = '';
    let error: string = '';
    let stdinContent: string | null = null;

    // Handle input redirection
    if (redirectInput) {
      const inputContent = fs.readFile(redirectInput);
      if (inputContent === null) {
        error = `bash: ${redirectInput}: No such file or directory`;
        // Add the command line and error to output
        setLines(prev => [...prev, { type: 'input', content: command, commandPrompt: currentPrompt }]);
        if (error) {
          setLines(prev => [...prev, { type: 'error', content: error }]);
        }
        // Save filesystem state
        fs.saveToLocalStorage();
        return;
      }
      stdinContent = inputContent;
    }

    // Check if command binary exists (game-specific commands are builtins)
    if (!builtinCommands.includes(cmd)) {
      const binaryPath = `/bin/${cmd}.bin`;
      if (!fs.readFile(binaryPath)) {
        error = `${cmd}: command not found`;
        // Add the command line and error to output
        setLines(prev => [...prev, { type: 'input', content: command, commandPrompt: currentPrompt }]);
        if (error) {
          setLines(prev => [...prev, { type: 'error', content: error }]);
        }
        // Save filesystem state
        fs.saveToLocalStorage();
        return;
      }
    }

    switch (cmd) {
      case 'help':
        output = getCommandHelp('help');
        break;

      case 'ls': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = getCommandHelp('ls') || '';
          break;
        }

        let showHidden = false;
        let longFormat = false;
        let directoryOnly = false;
        let targetPath = '.';

        // Parse options
        const filteredArgs = [];
        for (const arg of args) {
          if (arg === '-a' || arg === '--all') {
            showHidden = true;
          } else if (arg === '-l') {
            longFormat = true;
          } else if (arg === '-d' || arg === '--directory') {
            directoryOnly = true;
          } else if (arg === '-la' || arg === '-al') {
            showHidden = true;
            longFormat = true;
          } else if (arg === '-ld') {
            longFormat = true;
            directoryOnly = true;
          } else if (arg.startsWith('-')) {
            error = `ls: invalid option '${arg}'\nTry 'ls --help' for more information.`;
            break;
          } else {
            filteredArgs.push(arg);
          }
        }

        if (filteredArgs.length > 0) {
          targetPath = filteredArgs[0];
        }

        let files: any[];
        if (directoryOnly) {
          // Show information about the directory itself, not its contents
          const dirNode = fs.getNode(targetPath);
          files = dirNode ? [dirNode] : [];
        } else {
          // Check if targetPath is a file
          const targetNode = fs.getNode(targetPath);
          if (targetNode && targetNode.type === 'file') {
            // If it's a specific file, show info about that file only
            files = [targetNode];
          } else {
            // Otherwise, list the directory contents
            files = fs.listDirectory(targetPath, showHidden);
          }
        }
        if (files.length === 0) {
          output = '';
        } else if (longFormat) {
          // Calculate column widths for better alignment
          const ownerNames = files.map(file => fs.getUserById(file.uid)?.name || file.uid.toString());
          const groupNames = files.map(file => fs.getGroupById(file.gid)?.name || file.gid.toString());
          const maxOwnerWidth = Math.max(...ownerNames.map(name => name.length), 8); // minimum 8 chars
          const maxGroupWidth = Math.max(...groupNames.map(name => name.length), 8); // minimum 8 chars

          output = files.map(file => {
            const type = file.type === 'directory' ? 'd' : '-';
            const perms = file.permissions.substring(1);
            const links = '1'; // simplified
            const owner = (fs.getUserById(file.uid)?.name || file.uid.toString()).padEnd(maxOwnerWidth);
            const group = (fs.getGroupById(file.gid)?.name || file.gid.toString()).padEnd(maxGroupWidth);
            const size = file.size.toString().padStart(8);
            const date = file.modified.toLocaleString('en-US', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              hour12: false
            }).replace(',', '');
            const fileName = file.type === 'directory' ? `${file.name}/` : file.name;
            return `${type}${perms} ${links} ${owner} ${group} ${size} ${date} ${fileName}`;
          }).join('\n');
        } else {
          // Display files one per line with directory indicators for better readability
          output = files.map(file => {
            if (file.type === 'directory') {
              return `${file.name}/`;
            } else {
              return file.name;
            }
          }).join('\n');
        }
        break;
      }

      case 'chmod': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('chmod');
          break;
        } else if (args.length < 2) {
          error = 'chmod: missing operand\nUsage: chmod <mode> <file>\nTry: chmod --help';
        } else {
          const [mode, filePath] = args;
          const fullPath = fs.getAbsolutePath(filePath);

          // Check if file exists
          const fileNode = fs.getNode(fullPath);
          if (!fileNode) {
            error = `chmod: cannot access '${filePath}': No such file or directory`;
          } else {
            // Check if current user can change permissions (owner or root only)
            const currentUser = fs.getCurrentUser();
            if (fileNode.uid !== currentUser.uid && currentUser.uid !== 0) {
              error = `chmod: ${filePath}: Operation not permitted`;
            } else {
              // Validate octal mode (3 or 4 digits)
              if (!/^[0-7]{3,4}$/.test(mode)) {
                error = `chmod: invalid mode '${mode}'\nTry: chmod --help`;
              } else {
                fs.changePermissions(fullPath, mode);
              }
            }
          }
        }
        break;
      }

      case 'adduser': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('adduser');
          break;
        } else if (args.length === 0) {
          error = 'adduser: missing operand\nUsage: adduser <username>';
          break;
        }

        const username = args[0];

        // Check if current user is root
        if (fs.getCurrentUser().uid !== 0) {
          error = 'adduser: Only root may add a user or group to the system.';
          break;
        }

        // Validate username (basic validation)
        if (!/^[a-zA-Z_][a-zA-Z0-9_-]*$/.test(username)) {
          error = `adduser: invalid username '${username}'`;
          break;
        }

        // Check if user already exists
        const existingUser = fs.getUsers().get(username);
        if (existingUser) {
          error = `adduser: The user '${username}' already exists.`;
          break;
        }

        // Create the user
        const newUser: User = {
          uid: Math.max(...Array.from(fs.getUsers().values()).map(u => u.uid)) + 1,
          name: username,
          gid: 1000, // Default users group
          home: `/home/${username}`,
          shell: '/bin/bash'
        };

        // Add user to filesystem
        fs.getUsers().set(username, newUser);

        // Create home directory
        fs.createNewDirectory(newUser.home);
        // Set ownership of home directory to the new user
        const homeNode = fs.getNode(newUser.home);
        if (homeNode) {
          homeNode.uid = newUser.uid;
          homeNode.gid = newUser.gid;
        }

        // Prompt for password
        promptForPassword(`New password for ${username}: `, (newPassword) => {
          if (!newPassword.trim()) {
            // Password cannot be empty, remove the user
            fs.getUsers().delete(username);
            removeDirectoryRecursive(newUser.home);
            setLines(prev => [...prev,
              { type: 'input', content: command, commandPrompt: currentPrompt },
              { type: 'error', content: 'adduser: Password cannot be empty' }
            ]);
            return;
          }
          newUser.password = newPassword;

          // Update /etc/passwd
          const passwdContent = fs.readFile('/etc/passwd') || '';
          const newPasswdContent = passwdContent + `${username}:${newPassword}:${newUser.uid}:${newUser.gid}:${username}:/home/${username}:/bin/bash\n`;
          fs.writeFile('/etc/passwd', newPasswdContent);

          setLines(prev => [...prev,
            { type: 'input', content: command, commandPrompt: currentPrompt },
            { type: 'output', content: `adduser: user '${username}' added successfully` }
          ]);
        });
        return; // Don't process further since we're prompting for password
      }

      case 'userdel': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('userdel');
          break;
        } else if (args.length === 0) {
          error = 'userdel: missing operand\nUsage: userdel <username>';
          break;
        }

        const username = args[0];

        // Check if current user is root (only root can delete users)
        const currentUser = fs.getCurrentUser();
        if (currentUser.uid !== 0) {
          error = 'userdel: Only root may remove a user or group from the system.';
          break;
        }

        // Cannot delete root user
        if (username === 'root') {
          error = 'userdel: cannot remove root user';
          break;
        }

        // Check if user exists
        const userToDelete = fs.getUsers().get(username);
        if (!userToDelete) {
          error = `userdel: user '${username}' does not exist`;
          break;
        }

        // Cannot delete current user (check session user)
        if (userToDelete.uid === sessionUser.uid || userToDelete.name === sessionUser.name) {
          error = 'userdel: cannot remove current user';
          break;
        }

        // Remove user's home directory and all contents
        const homeDir = userToDelete.home;
        removeDirectoryRecursive(homeDir);

        // Remove user from filesystem
        fs.getUsers().delete(username);

        // Update /etc/passwd
        const passwdContent = fs.readFile('/etc/passwd') || '';
        const newPasswdContent = passwdContent.split('\n').filter(line => !line.startsWith(username + ':')).join('\n');
        fs.writeFile('/etc/passwd', newPasswdContent);

        output = `userdel: user '${username}' removed successfully`;
        break;
      }

      case 'passwd': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('passwd');
          break;
        }

        const targetUsername = args[0] || fs.getCurrentUser().name;
        const currentUser = fs.getCurrentUser();
        const targetUser = fs.getUsers().get(targetUsername);

        if (!targetUser) {
          error = `passwd: user '${targetUsername}' does not exist`;
          break;
        }

        // Only root can change other users' passwords
        if (targetUsername !== currentUser.name && currentUser.uid !== 0) {
          error = 'passwd: You may not view or modify password information for ' + targetUsername;
          break;
        }

        // If user has no password (freshly created), they can set one without old password
        if (!targetUser.password) {
          // Set new password without requiring old password
          promptForPassword('New password: ', (newPassword) => {
            if (!newPassword.trim()) {
              setLines(prev => [...prev, { type: 'error', content: 'passwd: Password cannot be empty' }]);
              return;
            }
            promptForPassword('Retype new password: ', (confirmPassword) => {
              if (newPassword !== confirmPassword) {
                setLines(prev => [...prev, { type: 'error', content: 'passwd: passwords do not match' }]);
              } else {
                      targetUser.password = newPassword;

                      // Update /etc/passwd
                      const passwdContent = fs.readFile('/etc/passwd') || '';
                      const lines = passwdContent.split('\n');
                      const newLines = lines.map(line => {
                        if (line.startsWith(targetUsername + ':')) {
                          const parts = line.split(':');
                          parts[1] = newPassword;
                          return parts.join(':');
                        }
                        return line;
                      });
                      fs.writeFile('/etc/passwd', newLines.join('\n'));

                      setLines(prev => [...prev, { type: 'output', content: `passwd: password updated successfully` }]);
                    }
            });
          });
        } else {
          // Require current password for password changes
          const isChangingOwnPassword = targetUsername === currentUser.name;

          if (isChangingOwnPassword) {
            // Changing own password - require current password
            promptForPassword('Current password: ', (currentPassword) => {
              if (!fs.authenticateUser(currentUser.name, currentPassword)) {
                setLines(prev => [...prev, { type: 'error', content: 'passwd: Authentication failure' }]);
                return;
              }

              promptForPassword('New password: ', (newPassword) => {
                if (!newPassword.trim()) {
                  setLines(prev => [...prev, { type: 'error', content: 'passwd: Password cannot be empty' }]);
                  return;
                }
                promptForPassword('Retype new password: ', (confirmPassword) => {
                  if (newPassword !== confirmPassword) {
                    setLines(prev => [...prev, { type: 'error', content: 'passwd: passwords do not match' }]);
                  } else {
                    targetUser.password = newPassword;

                    // Update /etc/passwd
                    const passwdContent = fs.readFile('/etc/passwd') || '';
                    const lines = passwdContent.split('\n');
                    const newLines = lines.map(line => {
                      if (line.startsWith(targetUsername + ':')) {
                        const parts = line.split(':');
                        parts[1] = newPassword;
                        return parts.join(':');
                      }
                      return line;
                    });
                    fs.writeFile('/etc/passwd', newLines.join('\n'));

                    setLines(prev => [...prev, { type: 'output', content: `passwd: password for ${targetUsername} updated successfully` }]);
                  }
                });
              });
            });
          } else {
            // Root changing another user's password - no current password required
            promptForPassword(`New password for ${targetUsername}: `, (newPassword) => {
              if (!newPassword.trim()) {
                setLines(prev => [...prev, { type: 'error', content: 'passwd: Password cannot be empty' }]);
                return;
              }
              promptForPassword('Retype new password: ', (confirmPassword) => {
                if (newPassword !== confirmPassword) {
                  setLines(prev => [...prev, { type: 'error', content: 'passwd: passwords do not match' }]);
                } else {
                  targetUser.password = newPassword;

                  // Update /etc/passwd
                  const passwdContent = fs.readFile('/etc/passwd') || '';
                  const lines = passwdContent.split('\n');
                  const newLines = lines.map(line => {
                    if (line.startsWith(targetUsername + ':')) {
                      const parts = line.split(':');
                      parts[1] = newPassword;
                      return parts.join(':');
                    }
                    return line;
                  });
                  fs.writeFile('/etc/passwd', newLines.join('\n'));

                  setLines(prev => [...prev, { type: 'output', content: `passwd: password updated successfully` }]);
                }
              });
            });
          }
        }
        return; // Don't process further since we're using password prompts
      }

      case 'ping': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('ping');
          break;
        }

        if (args.length === 0) {
          error = 'ping: usage error: Destination address required';
          break;
        }

        let count = Infinity; // Ping continuously by default
        let timeout = 0; // No timeout by default
        let interval = 1; // 1 second between packets
        let destination = '';

        // Parse arguments
        for (let i = 0; i < args.length; i++) {
          const arg = args[i];
          if (arg === '-c' || arg === '--count') {
            const countStr = args[i + 1];
            if (!countStr || isNaN(Number(countStr))) {
              error = 'ping: invalid count value';
              break;
            }
            count = parseInt(countStr);
            i++; // Skip next arg
          } else if (arg === '-t' || arg === '--timeout') {
            const timeoutStr = args[i + 1];
            if (!timeoutStr || isNaN(Number(timeoutStr))) {
              error = 'ping: invalid timeout value';
              break;
            }
            timeout = parseInt(timeoutStr);
            i++; // Skip next arg
          } else if (arg === '-i' || arg === '--interval') {
            const intervalStr = args[i + 1];
            if (!intervalStr || isNaN(Number(intervalStr))) {
              error = 'ping: invalid interval value';
              break;
            }
            interval = parseFloat(intervalStr);
            if (interval < 0.2) {
              error = 'ping: interval too short: minimum 0.2 seconds';
              break;
            }
            i++; // Skip next arg
          } else if (!arg.startsWith('-')) {
            destination = arg;
          } else {
            error = `ping: invalid option '${arg}'`;
            break;
          }
        }

        if (error) break;

        if (!destination) {
          error = 'ping: usage error: Destination address required';
          break;
        }

        // Use mock internet for ping if available
        if (!mockInternet) {
          // Fallback to old simulation
          const simulatePing = (host: string, packetCount: number) => {
            const lines: string[] = [];

            let ip = host;
            if (!/^\d+\.\d+\.\d+\.\d+$/.test(host)) {
              ip = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
              lines.push(`PING ${host} (${ip}) 56(84) bytes of data.`);
            } else {
              lines.push(`PING ${host} (${host}) 56(84) bytes of data.`);
            }

            // Simulate packets
            for (let i = 1; i <= packetCount; i++) {
              const seq = i;
              const ttl = 64; // Typical TTL
              const time = (Math.random() * 50 + 1).toFixed(3); // Random time 1-51ms

              if (Math.random() < 0.05) { // 5% chance of timeout
                lines.push(`From ${ip} icmp_seq=${seq} Destination Host Unreachable`);
              } else {
                lines.push(`64 bytes from ${ip}: icmp_seq=${seq} ttl=${ttl} time=${time} ms`);
              }
            }

            // Add summary
            const loss = Math.floor(Math.random() * 3); // 0-2 packets lost randomly
            const received = packetCount - loss;
            lines.push('');
            lines.push(`--- ${host} ping statistics ---`);
            lines.push(`${packetCount} packets transmitted, ${received} received, ${loss > 0 ? Math.round((loss / packetCount) * 100) + '%' : '0%'} packet loss`);

            return lines.join('\n');
          };

          const actualCount = count === Infinity ? 4 : Math.min(count, 20); // Max 20 packets for UI
          output = simulatePing(destination, actualCount);
          break;
        }

        // Resolve hostname to IP using mock internet DNS
        let ip = destination;
        if (!/^\d+\.\d+\.\d+\.\d+$/.test(destination)) {
          ip = mockInternet.resolveDomain(destination) || '';
          if (!ip) {
            error = `ping: ${destination}: Name or service not known`;
            break;
          }
        }

        // Check if host is reachable
        if (!mockInternet.isHostReachable(ip)) {
          error = `ping: ${destination}: Host is unreachable`;
          break;
        }

        const simulatePing = (host: string, resolvedIP: string, packetCount: number) => {
          const lines: string[] = [];

          lines.push(`PING ${host} (${resolvedIP}) 56(84) bytes of data.`);

          // Simulate packets
          for (let i = 1; i <= packetCount; i++) {
            const seq = i;
            const ttl = 64; // Typical TTL
            const time = (Math.random() * 50 + 1).toFixed(3); // Random time 1-51ms

            if (Math.random() < 0.05) { // 5% chance of timeout
              lines.push(`From ${resolvedIP} icmp_seq=${seq} Destination Host Unreachable`);
            } else {
              lines.push(`64 bytes from ${resolvedIP}: icmp_seq=${seq} ttl=${ttl} time=${time} ms`);
            }
          }

          // Add summary
          const loss = Math.floor(Math.random() * 3); // 0-2 packets lost randomly
          const received = packetCount - loss;
          lines.push('');
          lines.push(`--- ${host} ping statistics ---`);
          lines.push(`${packetCount} packets transmitted, ${received} received, ${loss > 0 ? Math.round((loss / packetCount) * 100) + '%' : '0%'} packet loss`);

          return lines.join('\n');
        };

        // Set a reasonable default count if infinite
        const actualCount = count === Infinity ? 4 : Math.min(count, 20); // Max 20 packets for UI
        output = simulatePing(destination, ip, actualCount);

        break;
      }

      case 'ifconfig': {
        if (args.includes('-h') || args.includes('--help')) {
          output = getCommandHelp('ifconfig');
        } else {
          const interfaceName = args[0];

          // Get network info from mock internet
          const playerIP = mockInternet?.getPlayerIP();
          const gatewayIP = mockInternet?.getGatewayIP();

          // Simulate network interfaces using mock internet data
          const interfaces = {
            lo: {
              name: 'lo',
              flags: 'LOOPBACK,UP,LOWER_UP',
              mtu: 65536,
              inet: '127.0.0.1',
              netmask: '255.0.0.0',
              inet6: '::1/128',
              scope: 'host',
              rx: { packets: 1234, bytes: 56789, errors: 0, dropped: 0, overruns: 0, frame: 0 },
              tx: { packets: 1234, bytes: 56789, errors: 0, dropped: 0, overruns: 0, carrier: 0, collisions: 0 }
            },
            eth0: {
              name: 'eth0',
              flags: 'UP,BROADCAST,RUNNING,MULTICAST',
              mtu: 1500,
              inet: playerIP || '192.168.1.100',
              netmask: '255.255.255.0',
              broadcast: playerIP ? playerIP.replace(/\d+$/, '255') : '192.168.1.255',
              inet6: 'fe80::a00:27ff:fe4e:66a1/64',
              ether: '08:00:27:4e:66:a1',
              scope: 'link',
              rx: { packets: 34567, bytes: 23456789, errors: 12, dropped: 0, overruns: 0, frame: 0 },
              tx: { packets: 23456, bytes: 12345678, errors: 0, dropped: 0, overruns: 0, carrier: 0, collisions: 0 }
            },
            wlan0: {
              name: 'wlan0',
              flags: 'BROADCAST,MULTICAST',
              mtu: 1500,
              ether: '00:1b:63:84:45:e6',
              inet6: 'fe80::21b:63ff:fe84:45e6/64',
              scope: 'link',
              rx: { packets: 0, bytes: 0, errors: 0, dropped: 0, overruns: 0, frame: 0 },
              tx: { packets: 0, bytes: 0, errors: 0, dropped: 0, overruns: 0, carrier: 0, collisions: 0 }
            }
          };

          if (interfaceName) {
            // Show specific interface
            const iface = interfaces[interfaceName as keyof typeof interfaces];
            if (!iface) {
              error = `ifconfig: error fetching interface information: Device not found`;
            } else {
              output = formatInterface(iface);
            }
          } else {
            // Show all interfaces
            const activeInterfaces = Object.values(interfaces).filter(iface =>
              iface.flags.includes('UP') || iface.name === 'lo'
            );
            output = activeInterfaces.map(iface => formatInterface(iface)).join('\n\n');
          }
        }

        function formatInterface(iface: any): string {
          let result = `${iface.name}: flags=${iface.flags} mtu ${iface.mtu}\n`;

          if (iface.inet) {
            result += `        inet ${iface.inet}  netmask ${iface.netmask}`;
            if (iface.broadcast) {
              result += `  broadcast ${iface.broadcast}`;
            }
            result += '\n';
          }

          if (iface.inet6) {
            result += `        inet6 ${iface.inet6}  scope ${iface.scope}\n`;
          }

          if (iface.ether) {
            result += `        ether ${iface.ether}  txqueuelen 1000  (Ethernet)\n`;
          }

          result += `        RX packets ${iface.rx.packets}  bytes ${iface.rx.bytes}\n`;
          result += `        RX errors ${iface.rx.errors}  dropped ${iface.rx.dropped}  overruns ${iface.rx.overruns}  frame ${iface.rx.frame}\n`;
          result += `        TX packets ${iface.tx.packets}  bytes ${iface.tx.bytes}\n`;
          result += `        TX errors ${iface.tx.errors}  dropped ${iface.tx.dropped}  overruns ${iface.tx.overruns}  carrier ${iface.tx.carrier}  collisions ${iface.tx.collisions}\n`;

          return result.trim();
        }

        break;
      }

      case 'browser': {
        if (!isPackageInstalled('browser')) {
          error = 'browser: command not found\nTry: apt install browser';
          break;
        }
        if (args.length === 0) {
          error = 'browser: missing target domain\nTry: browser google.com';
          break;
        }
        const domain = args[0];
        if (!mockInternet) {
          error = 'browser: Network not available';
          break;
        }
        const ip = mockInternet.resolveDomain(domain);
        if (!ip) {
          error = `browser: Unable to resolve host '${domain}'`;
          break;
        }
        const website = mockInternet.getWebsiteByDomain(domain);
        if (!website) {
          error = `browser: Page not found for '${domain}'`;
          break;
        }
        // Open graphical browser instead of text output
        onOpenBrowser(`http://${domain}`);
        break;
      }

      case 'whoami': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = getCommandHelp('whoami');
          break;
        }
        const user = fs.getCurrentUser();
        output = user.name;
        break;
      }

      case 'id': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('id');
          break;
        }

        if (args.length === 0) {
          // Show current user's ID info
          const user = fs.getCurrentUser();
          const group = fs.getGroupById(user.gid);
          output = `uid=${user.uid}(${user.name}) gid=${user.gid}(${group?.name || user.gid}) groups=${user.gid}(${group?.name || user.gid})`;
        } else {
          // Show info for specified user
          const targetUser = fs.getUsers().get(args[0]);
          if (!targetUser) {
            error = `id: '${args[0]}': no such user`;
          } else {
            const group = fs.getGroupById(targetUser.gid);
            output = `uid=${targetUser.uid}(${targetUser.name}) gid=${targetUser.gid}(${group?.name || targetUser.gid}) groups=${targetUser.gid}(${group?.name || targetUser.gid})`;
          }
        }
        break;
      }

      case 'cd': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = getCommandHelp('cd');
          break;
        }

        const path = args[0] || '~';

        let targetPath = path;

        // Handle ~ expansion
        if (path === '~' || path.startsWith('~/')) {
          const home = fs.getCurrentUser().home;
          targetPath = path === '~' ? home : home + path.substring(1);
        }

        const result = fs.changeDirectory(targetPath);
        if (result.success) {
          // Directory changed successfully
          setWorkingDirectory(fs.getWorkingDirectory());
        } else {
          error = `cd: ${path}: ${result.error}`;
        }
        break;
      }

      case 'pwd':
        if (args.includes('--help')|| args.includes('-h')) {
          output = getCommandHelp('pwd');
          break;
        }
        output = fs.getWorkingDirectory();
        break;

      case 'mkdir': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = getCommandHelp('mkdir');
          break;
        }

        if (args.length === 0) {
          error = 'mkdir: missing operand\nUsage: mkdir <directory>';
        } else {
          const failedDirs: { dir: string; error: string }[] = [];
          args.forEach(dir => {
            // Handle ~ expansion
            let expandedDir = dir;
            if (dir === '~' || dir.startsWith('~/')) {
              const home = fs.getCurrentUser().home;
              expandedDir = dir === '~' ? home : home + dir.substring(1);
            }

            const result = fs.createNewDirectory(expandedDir);
            if (!result.success) {
              failedDirs.push({ dir, error: result.error! });
            }
          });
          if (failedDirs.length > 0) {
            error = `mkdir: cannot create directory '${failedDirs[0].dir}': ${failedDirs[0].error}`;
          }
        }
        break;
      }

      case 'rmdir': {
        if (args.includes('--help')) {
          output = getCommandHelp('rmdir');
          break;
        }

        if (args.length === 0) {
          error = 'rmdir: missing operand\nUsage: rmdir <directory>';
        } else {
          const failedDirs: string[] = [];
          args.forEach(dir => {
            if (!fs.removeDirectory(dir)) {
              failedDirs.push(dir);
            }
          });
          if (failedDirs.length > 0) {
            error = `rmdir: failed to remove '${failedDirs[0]}': Directory not empty or does not exist`;
          }
        }
        break;
      }

      case 'touch': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = getCommandHelp('touch');
          break;
        }

        if (args.length === 0) {
          error = 'touch: missing file operand';
        } else {
          const failedFiles: { file: string; error: string }[] = [];
          args.forEach(file => {
            // Handle ~ expansion
            let expandedFile = file;
            if (file === '~' || file.startsWith('~/')) {
              const home = fs.getCurrentUser().home;
              expandedFile = file === '~' ? home : home + file.substring(1);
            }

            const result = fs.createNewFile(expandedFile);
            if (!result.success) {
              failedFiles.push({ file, error: result.error! });
            }
          });
          if (failedFiles.length > 0) {
            error = `touch: cannot touch '${failedFiles[0].file}': ${failedFiles[0].error}`;
          }
        }
        break;
      }

      case 'rm': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = getCommandHelp('rm');
          break;
        }

        if (args.length === 0) {
          error = 'rm: missing operand';
        } else {
          const failedFiles: { file: string; error: string }[] = [];
          args.forEach(file => {
            const result = fs.remove(file);
            if (!result.success) {
              failedFiles.push({ file, error: result.error! });
            }
          });
          if (failedFiles.length > 0) {
            error = `rm: cannot remove '${failedFiles[0].file}': ${failedFiles[0].error}`;
          }
        }
        break;
      }

      case 'cat': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = getCommandHelp('cat');
          break;
        }

        if (args.length === 0) {
          error = 'cat: missing file operand';
        } else {
          const contents: string[] = [];
          const failedFiles: string[] = [];
          args.forEach(file => {
            const content = fs.readFile(file);
            if (content !== null) {
              contents.push(content);
            } else {
              failedFiles.push(file);
            }
          });

          if (failedFiles.length > 0) {
            error = `cat: '${failedFiles[0]}': No such file or directory`;
          } else {
            output = contents.join('\n');
          }
        }
        break;
      }

      case 'cp': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = getCommandHelp('cp');
          break;
        }

        if (args.length < 2) {
          error = 'cp: missing file operand\nUsage: cp <source> <destination>';
        } else {
          const [src, dst] = args;
          const result = fs.copyFile(src, dst);
          if (!result.success) {
            error = `cp: cannot copy '${src}' to '${dst}': ${result.error}`;
          }
        }
        break;
      }

      case 'mv': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('mv');
          break;
        }

        if (args.length < 2) {
          error = 'mv: missing file operand\nUsage: mv <source> <destination>';
        } else {
          const [src, dst] = args;
          const result = fs.moveFile(src, dst);
          if (!result.success) {
            error = `mv: cannot move '${src}' to '${dst}': ${result.error}`;
          }
        }
        break;
      }

      case 'echo': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = getCommandHelp('echo');
          break;
        }
        output = args.join(' ');
        break;
      }

      case 'grep': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('grep');
          break;
        }

        if (args.length === 0) {
          error = 'grep: usage: grep <pattern> [file]';
        } else if (args.length === 1) {
          // No file specified - read from stdin
          const [pattern] = args;
          if (stdinContent !== null) {
            const lines = stdinContent.split('\n');
            const matches = lines.filter(line => line.includes(pattern));
            output = matches.join('\n');
          } else {
            error = 'grep: missing input (use grep <pattern> <file> or provide input via redirection)';
          }
        } else {
          const [pattern, file] = args;
          const content = fs.readFile(file);
          if (content === null) {
            error = `grep: ${file}: No such file or directory`;
          } else {
            const lines = content.split('\n');
            const matches = lines.filter(line => line.includes(pattern));
            output = matches.join('\n');
          }
        }
        break;
      }

      case 'find': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('find');
          break;
        }

        if (args.length < 3) {
          error = 'find: usage: find <path> -name <pattern>';
        } else {
          const [path, flag, pattern] = args;
          if (flag !== '-name') {
            error = 'find: only -name flag supported';
          } else {
            // Simple find implementation - just search current directory
            const files = fs.listDirectory(path, true);
            const matches = files.filter(file =>
              file.name.includes(pattern.replace('*', ''))
            );
            output = matches.map(file => `${path}/${file.name}`).join('\n');
          }
        }
        break;
      }

      case 'save':
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('save');
          break;
        }

        if (fs.saveToLocalStorage()) {
          output = 'Filesystem state saved successfully.';
        } else {
          error = 'Failed to save filesystem state.';
        }
        break;

      case 'reset':
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('reset');
          break;
        }

        fs.clearLocalStorage();
        output = 'Filesystem reset. Refresh the page to start fresh.';
        break;

      case 'debug': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('debug');
          break;
        }

        const user = fs.getCurrentUser();
        output = `Current user: ${user.name} (uid: ${user.uid}, gid: ${user.gid})\n` +
                `Current directory: ${fs.getWorkingDirectory()}\n` +
                `Total users: ${fs.getUsers().size}\n` +
                `Total groups: ${fs.getGroups().size}`;
        break;
      }

      case 'man': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = getCommandHelp('man');
          break;
        }

        if (args.length === 0) {
          error = 'What manual page do you want?\nUsage: man <command>';
        } else {
          const command = args[0];
          const manPagePath = `/usr/share/man/man1/${command}.1`;
          const content = fs.readFile(manPagePath);

          if (content !== null) {
            output = content;
          } else {
            error = `man: No manual entry for ${command}\nTry 'help' to see available commands.`;
          }
        }
        break;
      }

      case 'nano': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('nano');
        } else if (!isPackageInstalled('nano')) {
          error = 'nano: command not found\nTry: apt install nano';
        } else if (args.length === 0) {
          error = 'nano: missing file operand\nUsage: nano <file>';
        } else {
          const filePath = args[0];
          const fullPath = fs.getAbsolutePath(filePath);
          const content = fs.readFile(fullPath) || '';
          onOpenEditor(fullPath, content);
          return; // Don't add any lines to terminal when opening editor
        }
        break;
      }

      case 'snake': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('snake');
        } else if (!isPackageInstalled('snake')) {
          error = 'snake: command not found\nTry: apt install snake';
        } else {
          onOpenSnake();
          return; // Don't add any lines to terminal when opening game
        }
        break;
      }

      case 'nmap': {
        const result = executeNmap(args, setupData, isPackageInstalled, AVAILABLE_PACKAGES, mockInternet);
        output = result.output || '';
        error = result.error || '';
        break;
      }

      case 'apt': {
        const result = executeApt(args, command, currentPrompt, setupData, fs, AVAILABLE_PACKAGES, isPackageInstalled);
        const linesToAdd = result.lines;
        if (linesToAdd) {
          setLines(prev => [...prev, ...linesToAdd]);
        } else {
          output = result.output || '';
          error = result.error || '';
        }
        break;
      }

      case 'sudo': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('sudo');
          break;
        }

        if (args.length === 0) {
          error = 'sudo: missing command\nUsage: sudo <command>';
          break;
        }

        const originalUser = fs.getCurrentUser();
        const rootUser = fs.getUsers().get('root');
        if (!rootUser) {
          error = 'sudo: root user not found';
          break;
        }

        // Prompt for password
        promptForPassword(`[sudo] password for ${originalUser.name}: `, (password) => {
          if (fs.authenticateUser('root', password)) {
            // Switch to root temporarily
            fs.switchUser(rootUser);

            // Execute the command as root
            const sudoCommand = args.join(' ');
            executeCommand(sudoCommand);

            // Switch back to original user
            fs.switchUser(originalUser);
          } else {
            setLines(prev => [...prev, { type: 'error', content: 'sudo: authentication failure' }]);
          }
          // Update prompt after user switch
          setCurrentUser(fs.getCurrentUser());
          setWorkingDirectory(fs.getWorkingDirectory());
        });
        return; // Don't add command line to output when prompting for password
      }

      case 'su': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('su');
          break;
        }

        const targetUserName = args[0] || 'root';
        const targetUser = fs.getUsers().get(targetUserName);

        if (!targetUser) {
          error = `su: user '${targetUserName}' does not exist`;
          break;
        }

        if (targetUser.uid === fs.getCurrentUser().uid) {
          // Already this user
          break;
        }

        // Prompt for password
        promptForPassword(`Password for ${targetUserName}: `, (password) => {
          if (fs.authenticateUser(targetUserName, password)) {
            fs.switchUser(targetUser);
            setLines(prev => [...prev, { type: 'output', content: `Switched to user ${targetUserName}` }]);
            setCurrentUser(targetUser);
            setSessionUser(targetUser);
            setWorkingDirectory(fs.getWorkingDirectory());
          } else {
            setLines(prev => [...prev, { type: 'error', content: 'su: Authentication failure' }]);
          }
        });
        return; // Don't add command line to output when prompting for password
      }

      case 'reboot': {
        if (args.includes('--help') || args.includes('-h')) {
          output = getCommandHelp('reboot');
          break;
        }

        executeReboot(setLines, setIsRebooting, onReboot, currentPrompt, command, setCurrentInput);
        return; // Don't add the reboot command to history
      }

      case 'clear':
        if (args.includes('--help')|| args.includes('-h')) {
          output = `clear: clear the terminal screen

Usage: clear

Clear the terminal screen.

Examples:
  clear       Clear the screen
`;
          break;
        }
        setLines([]);
        return; // Don't add any lines

      default:
        error = `${cmd}: command not found`;
    }

    // Prepare lines to add
    const newLines: TerminalLine[] = [];

    // Always add the command line first
    newLines.push({ type: 'input', content: command, commandPrompt: currentPrompt });

    // Handle output redirection
    if (output && redirectOutput) {
      const redirectPath = fs.getAbsolutePath(redirectOutput);
      const existingFile = fs.getNode(redirectPath);

      if (existingFile && existingFile.type === 'directory') {
        error = `bash: ${redirectOutput}: Is a directory`;
      } else {
        try {
          // Create or update the file with the output
          if (existingFile) {
            // If appending, append to existing content
            if (appendOutput) {
              const existingContent = fs.readFile(redirectPath) || '';
              fs.writeFile(redirectPath, existingContent + output);
            } else {
              fs.writeFile(redirectPath, output);
            }
          } else {
            // Create new file
            fs.createNewFile(redirectPath);
            fs.writeFile(redirectPath, output);
          }
        } catch (e) {
          error = `bash: ${redirectOutput}: Permission denied`;
        }
      }
    } else if (output) {
      // Normal output display
      newLines.push({ type: 'output', content: output });
    }

    // Add error if any
    if (error) {
      newLines.push({ type: 'error', content: error });
    }

    // Add all lines at once to ensure correct order
    setLines(prev => [...prev, ...newLines]);

    // Save filesystem state after each command
    fs.saveToLocalStorage();
  };

  const getCommonPrefix = (strings: string[]): string => {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let prefix: string = strings[0];
    for (let i = 1; i < strings.length; i++) {
      while (strings[i].indexOf(prefix) !== 0) {
        prefix = prefix.substring(0, prefix.length - 1);
        if (prefix === '') return '';
      }
    }
    return prefix;
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (isRebooting) return; // Ignore input during reboot

    if (e.key === 'Enter') {
      executeCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex < 0 ? commandHistory.length - 1 : historyIndex - 1;
        if (newIndex < 0) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    } else if (e.key === 'ArrowDown') {

      e.preventDefault();
      if (historyIndex >= 0) {
        const newIndex = historyIndex + 1;
        if (newIndex >= commandHistory.length) {
          setHistoryIndex(-1);
          setCurrentInput('');
        } else {
          setHistoryIndex(newIndex);
          setCurrentInput(commandHistory[newIndex]);
        }
      }
    }
  };

  const handleTabCompletion = () => {
    const input = currentInput;
    const parts = input.split(' ');
    const currentPart = parts[parts.length - 1];
    const prevParts = parts.slice(0, -1);

    // Determine if this is command completion or path completion
    const isPathCompletion = prevParts.length > 0 || currentPart.includes('/') || currentPart.startsWith('.');

    if (!isPathCompletion) {
      // Command completion
      const completions: string[] = getCommandCompletions(currentPart);
      if (completions.length === 1) {
        const newInput = [...prevParts, completions[0]].join(' ');
        setCurrentInput(newInput);
        inputRef.current?.setSelectionRange(newInput.length, newInput.length);
      } else if (completions.length > 1) {
        // Show possible completions
        const commonPrefix: string = getCommonPrefix(completions);
        if (commonPrefix.length > currentPart.length) {
          const newInput = [...prevParts, commonPrefix].join(' ');
          setCurrentInput(newInput);
          inputRef.current?.setSelectionRange(newInput.length, newInput.length);
        } else {
          // Show all completions
          setLines(prev => [...prev, { type: 'output', content: completions.join('  ') }]);
        }
      }
    } else {
      // Path completion
      const completions: string[] = getPathCompletions(currentPart);
      if (completions.length === 1) {
        const completedPath = completions[0];
        const newInput = [...prevParts, completedPath].join(' ');
        setCurrentInput(newInput);
        inputRef.current?.setSelectionRange(newInput.length, newInput.length);
      } else if (completions.length > 1) {
        const commonPrefix: string = getCommonPrefix(completions);
        if (commonPrefix.length > currentPart.length) {
          const newInput = [...prevParts, commonPrefix].join(' ');
          setCurrentInput(newInput);
          inputRef.current?.setSelectionRange(newInput.length, newInput.length);
        } else {
          // Show all completions
          setLines(prev => [...prev, { type: 'output', content: completions.join('  ') }]);
        }
      }
    }
  };

  const getCommandCompletions = (prefix: string): string[] => {
    const allCommands = [
      'help', 'man', 'ls', 'cd', 'pwd', 'mkdir', 'rmdir', 'touch', 'rm',
      'cat', 'nano', 'nmap', 'snake', 'apt', 'sudo', 'su', 'cp', 'mv', 'chmod', 'whoami', 'id', 'echo', 'grep', 'find',
      'save', 'reset', 'debug', 'clear', 'reboot', 'adduser', 'userdel', 'passwd', 'ping', 'ifconfig', 'browser'
    ];

    // Only include commands that are builtin or have binaries
    const availableCommands = allCommands.filter(cmd => {
      if (builtinCommands.includes(cmd)) return true;
      const binaryPath = `/bin/${cmd}.bin`;
      return fs.readFile(binaryPath) !== null;
    });

    return availableCommands.filter(cmd => cmd.startsWith(prefix));
  };

  const getPathCompletions = (prefix: string): string[] => {
    // Handle absolute vs relative paths
    let basePath = '';
    let searchPrefix = prefix;

    if (prefix.includes('/')) {
      const lastSlashIndex = prefix.lastIndexOf('/');
      basePath = prefix.substring(0, lastSlashIndex) || '/'; // Ensure at least '/' for absolute paths
      searchPrefix = prefix.substring(lastSlashIndex + 1);
    }

    // Get the directory to search in
    const searchDir = basePath || '.';
    const files = fs.listDirectory(searchDir, true);

    // Filter by prefix
    const matches = files
      .map(file => file.name)
      .filter(name => name.startsWith(searchPrefix));

    // Add path prefix back
    const fullBasePath = basePath && basePath !== '.' ? (basePath === '/' ? '/' : basePath + '/') : '';
    return matches.map(name => {
      const file = files.find(f => f.name === name);
      const isDir = file?.type === 'directory';
      if (isDir) {
        return fullBasePath + name + '/';
      } else {
        // For files, name already includes extension, so just return as-is
        return fullBasePath + name;
      }
    });
  };

  const promptForPassword = (promptText: string, callback: (password: string) => void) => {
    isPasswordHandledRef.current = true;
    setPasswordPrompt(promptText);
    setAwaitingPassword(true);
    setPasswordCallback(() => callback);
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);



  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  return (
    <div className="min-h-screen bg-black text-green-400 font-mono p-4">
      <div
        ref={terminalRef}
        className="h-[calc(100vh-2rem)] overflow-y-auto"
      >
        {lines.map((line, index) => (
          <div key={index} className="mb-1">
            {line.type === 'input' && (
              <div className="flex">
                <span className="text-green-400 mr-2">{line.commandPrompt}</span>
                <span className="text-white">{line.content}</span>
              </div>
            )}
            {line.type === 'output' && (
              <div className="text-green-400 whitespace-pre-wrap">{line.content}</div>
            )}
            {line.type === 'error' && (
              <div className="text-red-400">{line.content}</div>
            )}
          </div>
        ))}

        {/* Current input line */}
        {!isRebooting && (
          <div className="flex">
            <span className="text-green-400 mr-2">
              {awaitingPassword ? passwordPrompt : currentPrompt}
            </span>
            <input
              ref={inputRef}
              type={awaitingPassword ? "password" : "text"}
              value={currentInput}
              onChange={(e) => setCurrentInput(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 bg-transparent border-none outline-none text-white caret-green-400"
              autoFocus
              disabled={!fs}
              placeholder={awaitingPassword ? "" : ""}
              spellCheck="false"
              autoCorrect="off"
              autoComplete="off"
            />
          </div>
        )}
        {isRebooting && (
          <div className="text-green-400 animate-pulse">
            System rebooting... Please wait.
          </div>
        )}
      </div>
    </div>
  );
}