"use client";

import { useState, useRef, useEffect, useMemo } from 'react';
import { FakeFileSystem, User } from '../lib/filesystem';

interface TerminalLine {
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
}

export default function Terminal({ setupData, onOpenEditor }: TerminalProps) {
  // Game-specific commands that are always available (don't require binaries)
  const builtinCommands = ['cd', 'pwd', 'help', 'sudo', 'su', 'reboot', 'clear', 'debug', 'save', 'reset', 'adduser', 'userdel', 'passwd'];

  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: `Welcome to Linux Sim Game, ${setupData?.playerName || 'User'}!` },
    { type: 'output', content: `Connected to ${setupData?.computerName || 'linux-sim'}` },
    { type: 'output', content: 'Type "help" for available commands or "cat README.txt" for more information.' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fs] = useState(() => new FakeFileSystem(setupData));
  const [currentUser, setCurrentUser] = useState(() => fs.getCurrentUser());
  const [sessionUser, setSessionUser] = useState(() => fs.getCurrentUser());
  const [workingDirectory, setWorkingDirectory] = useState(fs.getWorkingDirectory());
  const currentPrompt = useMemo(() =>
    `${currentUser.name}@${setupData?.computerName || 'linux-sim'}:${workingDirectory}$ `,
    [currentUser, setupData, workingDirectory]
  );

  // Change to user's home directory on startup and initialize prompt
  useEffect(() => {
    if (fs && setupData) {
      const homeDir = fs.getCurrentUser().home;
      fs.changeDirectory(homeDir);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentUser(fs.getCurrentUser());
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionUser(fs.getCurrentUser());
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkingDirectory(fs.getWorkingDirectory());
    } else if (fs) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setCurrentUser(fs.getCurrentUser());
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSessionUser(fs.getCurrentUser());
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setWorkingDirectory(fs.getWorkingDirectory());
    }
  }, [fs, setupData]);
  const [awaitingPassword, setAwaitingPassword] = useState(false);
  const [passwordCallback, setPasswordCallback] = useState<((password: string) => void) | null>(null);

  // Package interface
  interface PackageInfo {
    name: string;
    version: string;
    description: string;
    maintainer: string;
    size: string;
    dependencies: string[];
    provides: string[];
  }

  // Package database for apt simulation
  const AVAILABLE_PACKAGES: Record<string, PackageInfo> = {
    'nano': {
      name: 'nano',
      version: '6.2-1',
      description: 'small, friendly text editor inspired by Pico',
      maintainer: 'Ubuntu Developers <ubuntu-devel-discuss@lists.ubuntu.com>',
      size: '548 kB',
      dependencies: [],
      provides: ['editor']
    }
  };

  // Helper function to check if a package is installed
  const isPackageInstalled = (packageName: string): boolean => {
    const installedKey = `linux-sim-installed-packages-${setupData?.playerName || 'user'}`;
    const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');
    return !!installed[packageName];
  };

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
    const redirectIndex = trimmedCommand.indexOf(' >');
    const appendIndex = trimmedCommand.indexOf(' >>');
    const inputIndex = trimmedCommand.indexOf(' <');

    let commandPart = trimmedCommand;

    // Handle output redirection (overwrite)
    if (redirectIndex !== -1) {
      const parts = trimmedCommand.split(' >', 2);
      commandPart = parts[0].trim();
      redirectOutput = parts[1].trim();
      appendOutput = false;
    }
    // Handle output redirection (append) - check this first since >> contains >
    else if (appendIndex !== -1) {
      const parts = trimmedCommand.split(' >>', 2);
      commandPart = parts[0].trim();
      redirectOutput = parts[1].trim();
      appendOutput = true;
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
        const commands = [
          ['help', 'Show this help'],
          ['man <cmd>', 'Display manual page for command'],
          ['ls [opts] [dir]', 'List directory contents (-l long format, -a show hidden, -d directory info)'],
          ['cd <dir>', 'Change directory (~ for home)'],
          ['pwd', 'Print working directory'],
          ['mkdir <dir>', 'Create directory'],
          ['rmdir <dir>', 'Remove empty directory'],
          ['touch <file>', 'Create empty file'],
          ['rm <file>', 'Remove file'],
          ['cat <file>', 'Display file contents'],
          ['nano <file>', 'Edit file with nano text editor'],
          ['adduser <user>', 'Add a user to the system (root only)'],
          ['userdel <user>', 'Delete a user from the system (root only)'],
          ['passwd [user]', 'Change password (root can change any user\'s password)'],
          ['sudo <cmd>', 'Execute command as root'],
          ['su [user]', 'Switch to another user account'],
          ['cp <src> <dst>', 'Copy file'],
          ['mv <src> <dst>', 'Move/rename file'],
          ['chmod <mode> <file>', 'Change permissions (octal)'],
          ['whoami', 'Show current user'],
          ['id', 'Show user/group IDs'],
          ['echo <text>', 'Display text'],
          ['grep <pat> <file>', 'Search for pattern in file'],
          ['find <path> -name <pat>', 'Find files by name'],
          ['save', 'Manually save filesystem state'],
          ['reset', 'Reset filesystem to initial state'],
          ['debug', 'Show filesystem debug info'],
          ['clear', 'Clear terminal'],
          ['reboot', 'Restart the system']
        ];

        const maxCmdLength = Math.max(...commands.map(([cmd]) => cmd.length));
        output = 'Available commands:\n' + commands.map(([cmd, desc]) =>
          `  ${cmd.padEnd(maxCmdLength)} - ${desc}`
        ).join('\n');
        break;

      case 'ls': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = `ls: list directory contents

Usage: ls [OPTION]... [FILE]...

List information about the FILEs (the current directory by default).

Options:
  -a, --all          do not ignore entries starting with .
  -d, --directory    list directories themselves, not their contents
  -l                 use a long listing format
      --help         display this help and exit

Examples:
  ls                 List current directory
  ls -l              Long listing format
  ls -a              Show hidden files
  ls -la             Show all files in long format
`;
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
          output = `chmod: change file mode bits

Usage: chmod OCTAL-MODE FILE

Change the mode of each FILE to the specified OCTAL-MODE.

This game supports octal permissions only (e.g., 755, 644).

Permission bits:
  4 = read (r)
  2 = write (w)
  1 = execute (x)
  0 = no permission

Structure: Owner(3) Group(3) Others(3)

ASCII Art:
  ┌───┬───┬───┐
  │ r │ w │ x │ Owner
  ├───┼───┼───┤
  │ r │ w │ x │ Group
  ├───┼───┼───┤
  │ r │ w │ x │ Others
  └───┴───┴───┘

Examples:
  chmod 755 script.sh    - rwxr-xr-x (executable script)
  chmod 644 document.txt - rw-r--r-- (readable document)
  chmod 600 private.txt  - rw------- (private file)
  chmod 777 public.txt   - rwxrwxrwx (world writable)

Interactive Examples:
  755: Full access for owner, read/execute for others (scripts)
  644: Read/write for owner, read-only for others (files)
  600: Private file, owner only (secrets)
  400: Read-only for owner (logs)
`;
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
          output = `adduser - add a user to the system

SYNOPSIS
        adduser [OPTIONS] username

DESCRIPTION
        adduser creates a new user account. It will prompt for a password
        during the creation process. The user will be assigned the next
        available UID starting from 1000.

        A home directory /home/username will be created, and the user will
        be added to the system.

        This command must be run as root.

OPTIONS
        -h, --help
                Show this help message and exit.

EXAMPLES
        sudo adduser john
                Create a user named john and prompt for password.

SEE ALSO
        userdel(8), usermod(8)
`;
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
          output = `userdel - delete a user account and related files

SYNOPSIS
        userdel [OPTIONS] username

DESCRIPTION
        userdel deletes a user account, the user's home directory, and all
        related files.

        The userdel command must be run as root.

        It will refuse to delete the currently logged-in user.

OPTIONS
        -h, --help
                Show this help message and exit.

EXAMPLES
        sudo userdel john
                Delete the user john and their home directory.

SEE ALSO
        adduser(8), usermod(8)
`;
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
          output = `passwd - change user password

SYNOPSIS
        passwd [OPTIONS] [USER]

DESCRIPTION
        passwd changes passwords for user accounts. A normal user may only
        change the password for their own account, while the superuser may
        change the password for any account.

        passwd also aborts if running non-interactively.

OPTIONS
        -h, --help
                Show this help message and exit.

EXAMPLES
        passwd
                Change the current user's password.

        sudo passwd john
                Change john's password as root.

SEE ALSO
        adduser(8), userdel(8)
`;
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

      case 'whoami': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = `whoami: print effective userid

Usage: whoami

Print the user name associated with the current effective user ID.

Examples:
  whoami     Display current username
`;
          break;
        }
        const user = fs.getCurrentUser();
        output = user.name;
        break;
      }

      case 'id': {
        if (args.includes('--help') || args.includes('-h')) {
          output = `id - print real and effective user and group IDs

SYNOPSIS
        id [OPTION]... [USER]

DESCRIPTION
        Print user and group information for the specified USER, or (when USER
        omitted) for the current user.

OPTIONS
        -a     ignore, for compatibility with other versions
        -Z, --context
                print only the security context of the process
        -g, --group
                print only the effective group ID
        -G, --groups
                print all group IDs
        -n, --name
                print a name instead of a number, for -ugG
        -r, --real
                print the real ID instead of the effective ID, with -ugG
        -u, --user
                print only the effective user ID
        -h, --help
                display this help and exit

EXAMPLES
        id
                Print information about the current user.

        id username
                Print information about the specified user.

SEE ALSO
        whoami(1), who(1), getuid(2), getgid(2)
`;
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
          output = `cd: change the working directory

Usage: cd [DIRECTORY]

Change the current directory to DIRECTORY. The default DIRECTORY is the
value of the HOME shell variable.

Arguments:
  DIRECTORY    The directory to change to
  ~            Shortcut for home directory
  ..           Parent directory
  .            Current directory

Examples:
  cd /tmp      Change to /tmp directory
  cd ..        Go up one directory level
  cd           Go to home directory
  cd ~/docs    Go to docs in home directory
`;
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
          output = `pwd: print name of current/working directory

Usage: pwd

Print the full filename of the current working directory.

Examples:
  pwd         Display current directory path
`;
          break;
        }
        output = fs.getWorkingDirectory();
        break;

      case 'mkdir': {
        if (args.includes('--help')|| args.includes('-h')) {
          output = `mkdir: make directories

Usage: mkdir DIRECTORY...

Create the DIRECTORY(ies), if they do not already exist.

Examples:
  mkdir newdir        Create a directory called newdir
  mkdir dir1 dir2     Create multiple directories
`;
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
          output = `rmdir: remove empty directories

Usage: rmdir DIRECTORY...

Remove the DIRECTORY(ies), if they are empty.

Examples:
  rmdir emptydir     Remove an empty directory
  rmdir dir1 dir2    Remove multiple empty directories
`;
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
          output = `touch: change file timestamps

Usage: touch FILE...

Update the access and modification times of each FILE to the current time.

Examples:
  touch file.txt      Create file.txt if it doesn't exist
  touch file1 file2   Update timestamps for multiple files
`;
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
          output = `rm: remove files or directories

Usage: rm FILE...

Remove (unlink) the FILE(s).

Examples:
  rm file.txt      Remove a file
  rm file1 file2   Remove multiple files
`;
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
          output = `cat: concatenate files and print on the standard output

Usage: cat [FILE]...

Concatenate FILE(s) to standard output.

Examples:
  cat file.txt        Display contents of file.txt
  cat file1 file2     Display contents of multiple files
`;
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
          output = `cp: copy files and directories

Usage: cp SOURCE DEST
  or:  cp SOURCE... DIRECTORY

Copy SOURCE to DEST, or multiple SOURCE(s) to DIRECTORY.

Examples:
  cp file1 file2      Copy file1 to file2
  cp file1 file2 dir  Copy file1 and file2 to dir/
`;
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
          output = `mv - move (rename) files

SYNOPSIS
        mv [OPTION]... [-T] SOURCE DEST
        mv [OPTION]... SOURCE... DIRECTORY
        mv [OPTION]... -t DIRECTORY SOURCE...

DESCRIPTION
        Rename SOURCE to DEST, or move SOURCE(s) to DIRECTORY.

        Mandatory arguments to long options are mandatory for short options too.

OPTIONS
        -b     make a backup of each existing destination file
        -f, --force
                do not prompt before overwriting
        -i, --interactive
                prompt before overwrite
        -n, --no-clobber
                do not overwrite an existing file
        -T, --no-target-directory
                treat DEST as a normal file
        -u, --update
                move only when the SOURCE file is newer than the destination file or
                when the destination file is missing
        -v, --verbose
                explain what is being done
        -h, --help
                display this help and exit

EXAMPLES
        mv file1.txt file2.txt
                Rename file1.txt to file2.txt.

        mv file.txt /tmp/
                Move file.txt to the /tmp directory.

SEE ALSO
        cp(1), ln(1), rename(1)
`;
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
          output = `echo: display a line of text

Usage: echo [STRING]...

Display the STRING(s), separated by single blank spaces.

Examples:
  echo hello world    Display "hello world"
  echo "hello world"  Display "hello world" with quotes
`;
          break;
        }
        output = args.join(' ');
        break;
      }

      case 'grep': {
        if (args.includes('--help') || args.includes('-h')) {
          output = `grep - print lines that match patterns

SYNOPSIS
        grep [OPTION...] PATTERNS [FILE...]

DESCRIPTION
        grep searches for PATTERNS in each FILE. PATTERNS is one or more
        patterns separated by newline characters, and grep prints each line
        that matches a pattern.

        In this simulation, only basic string matching is supported.

OPTIONS
        -E, --extended-regexp
                PATTERNS are extended regular expressions
        -F, --fixed-strings
                PATTERNS are strings
        -G, --basic-regexp
                PATTERNS are basic regular expressions
        -i, --ignore-case
                ignore case distinctions in patterns and input data
        -n, --line-number
                print line number with output lines
        -r, --recursive
                read all files under each directory, recursively
        -v, --invert-match
                select non-matching lines
        -h, --help
                display this help and exit

EXAMPLES
        grep pattern file.txt
                Search for "pattern" in file.txt.

        grep -i Pattern file.txt
                Case-insensitive search.

SEE ALSO
        sed(1), awk(1)
`;
          break;
        }

        if (args.length < 2) {
          error = 'grep: usage: grep <pattern> <file>';
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
          output = `find - search for files in a directory hierarchy

SYNOPSIS
        find [-H] [-L] [-P] [-D debugopts] [-Olevel] [starting-point...]
              [expression]

DESCRIPTION
        find searches the directory tree rooted at each given starting-point
        by evaluating the given expression from left to right, according to
        the rules of precedence, until the outcome is known.

        In this simulation, only basic -name searches are supported.

EXPRESSIONS
        -name pattern
                Base of file name matches shell pattern pattern.

        -type c
                File is of type c: d directory, f regular file.

OPTIONS
        -h, --help
                display this help and exit

EXAMPLES
        find /home -name "*.txt"
                Find all .txt files in /home.

        find . -name "test"
                Find files named "test" in current directory.

SEE ALSO
        locate(1), xargs(1)
`;
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
          output = `save - save filesystem state

SYNOPSIS
        save

DESCRIPTION
        Save the current filesystem state to localStorage for persistence
        across browser sessions.

OPTIONS
        -h, --help
                Show this help message.

EXAMPLES
        save
                Save the current filesystem state.

SEE ALSO
        reset(1)
`;
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
          output = `reset - reset filesystem to initial state

SYNOPSIS
        reset

DESCRIPTION
        Reset the filesystem to its initial state, removing all user-created
        files and directories. This also clears the saved state.

        Note: This only clears the filesystem data. To fully reset the
        simulation, refresh the page.

OPTIONS
        -h, --help
                Show this help message.

EXAMPLES
        reset
                Reset the filesystem to initial state.

SEE ALSO
        save(1)
`;
          break;
        }

        fs.clearLocalStorage();
        output = 'Filesystem reset. Refresh the page to start fresh.';
        break;

      case 'debug': {
        if (args.includes('--help') || args.includes('-h')) {
          output = `debug - show filesystem debug information

SYNOPSIS
        debug

DESCRIPTION
        Display debugging information about the current filesystem state,
        including current user details, working directory, and counts of
        users and groups in the system.

        This command is useful for developers and administrators to inspect
        the internal state of the simulation.

OPTIONS
        -h, --help
                Show this help message.

EXAMPLES
        debug
                Show current filesystem debug information.

SEE ALSO
        whoami(1), pwd(1), id(1)
`;
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
          output = `man: an interface to the system reference manuals

Usage: man [COMMAND]

Display the manual page for COMMAND.

Examples:
  man ls      Display manual for ls command
  man chmod   Display manual for chmod command
`;
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
          output = `nano - Nano's ANOther editor, an enhanced free Pico clone

SYNOPSIS
        nano [OPTIONS] [[+LINE[,COLUMN]] FILE]...

DESCRIPTION
        nano is a small and friendly editor. It copies the look and feel of
        Pico, but is free software, and implements several features that Pico
        lacks.

OPTIONS
        -h, --help
                Show this help text and exit.

        +LINE[,COLUMN]
                Start at line number LINE, column number COLUMN (column
                numbers start at 1). If COLUMN is not specified, start at
                the beginning of the line.

EXAMPLES
        nano
                Start nano with an empty buffer.

        nano /etc/profile
                Edit the file /etc/profile.

        nano +10,5 /etc/profile
                Edit the file /etc/profile, starting at line 10, column 5.

SEE ALSO
        pico(1), vi(1), emacs(1)
`;
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

      case 'apt': {
        if (args.includes('--help') || args.includes('-h')) {
          output = `apt - command-line package manager

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
`;
          break;
        }

        if (args.length === 0) {
          error = 'apt: missing command\nTry: apt --help';
          break;
        }

        const subcommand = args[0];
        const subArgs = args.slice(1);

        switch (subcommand) {
          case 'update': {
            // Simulate package list update
            setLines(prev => [...prev,
              { type: 'input', content: command, commandPrompt: currentPrompt },
              { type: 'output', content: 'Get:1 http://archive.ubuntu.com/ubuntu focal InRelease [265 kB]' },
              { type: 'output', content: 'Get:2 http://archive.ubuntu.com/ubuntu focal-updates InRelease [114 kB]' },
              { type: 'output', content: 'Fetched 379 kB in 1s (379 kB/s)' },
              { type: 'output', content: 'Reading package lists... Done' }
            ]);
            break;
          }

          case 'install': {
            if (subArgs.length === 0) {
              error = 'apt install: missing package name';
              break;
            }
            const packageName = subArgs[0];
            const pkg = AVAILABLE_PACKAGES[packageName];

            if (!pkg) {
              error = `E: Unable to locate package ${packageName}`;
              break;
            }

            // Get installed packages from localStorage
            const installedKey = `linux-sim-installed-packages-${setupData?.playerName || 'user'}`;
            const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');

            if (installed[packageName]) {
              output = `${packageName} is already the newest version (${pkg.version}).`;
              break;
            }

            // Simulate installation
            setLines(prev => [...prev,
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
            ]);

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
            }
            break;
          }

          case 'remove': {
            if (subArgs.length === 0) {
              error = 'apt remove: missing package name';
              break;
            }
            const packageName = subArgs[0];

            // Get installed packages
            const installedKey = `linux-sim-installed-packages-${setupData?.playerName || 'user'}`;
            const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');

            if (!installed[packageName]) {
              error = `Package '${packageName}' is not installed, so not removed`;
              break;
            }

            // Simulate removal
            setLines(prev => [...prev,
              { type: 'input', content: command, commandPrompt: currentPrompt },
              { type: 'output', content: `Reading package lists... Done` },
              { type: 'output', content: `Building dependency tree... Done` },
              { type: 'output', content: `Reading state information... Done` },
              { type: 'output', content: `The following packages will be REMOVED:` },
              { type: 'output', content: `  ${packageName}` },
              { type: 'output', content: `0 upgraded, 0 newly installed, 1 to remove and 0 not upgraded.` },
              { type: 'output', content: `(Reading database ... 1000 files and directories currently installed.)` },
              { type: 'output', content: `Removing ${packageName} (${installed[packageName].version}) ...` }
            ]);

            // Remove from installed
            const updatedInstalled = { ...installed };
            delete updatedInstalled[packageName];
            localStorage.setItem(installedKey, JSON.stringify(updatedInstalled));

            // Remove binary for the package if needed
            if (packageName === 'nano') {
              fs.remove(`/bin/nano.bin`);
            }

            // Remove placeholder files
            fs.remove(`/usr/share/${packageName}/version.txt`);
            fs.removeDirectory(`/usr/share/${packageName}`);
            break;
          }

          case 'search': {
            if (subArgs.length === 0) {
              error = 'apt search: missing search pattern';
              break;
            }
            const pattern = subArgs[0].toLowerCase();
            const results = Object.values(AVAILABLE_PACKAGES)
              .filter(pkg => pkg.name.includes(pattern) || pkg.description.toLowerCase().includes(pattern))
              .map(pkg => `${pkg.name}/focal ${pkg.version} amd64\n  ${pkg.description}`);

            if (results.length === 0) {
              output = '';
            } else {
              output = results.join('\n\n');
            }
            break;
          }

          case 'show': {
            if (subArgs.length === 0) {
              error = 'apt show: missing package name';
              break;
            }
            const packageName = subArgs[0];
            const pkg = AVAILABLE_PACKAGES[packageName];

            if (!pkg) {
              error = `E: Unable to locate package ${packageName}`;
              break;
            }

            output = `Package: ${pkg.name}
Version: ${pkg.version}
Maintainer: ${pkg.maintainer}
Description: ${pkg.description}
Homepage: https://packages.ubuntu.com/focal/${pkg.name}
Download-Size: ${pkg.size}
APT-Manual-Installed: no
APT-Sources: http://archive.ubuntu.com/ubuntu focal/universe amd64 Packages
Description: ${pkg.description}`;
            break;
          }

          case 'list': {
            const installedKey = `linux-sim-installed-packages-${setupData?.playerName || 'user'}`;
            const installed = JSON.parse(localStorage.getItem(installedKey) || '{}');

            if (subArgs.includes('--installed')) {
              const installedList = Object.keys(installed).map(name => `${name}/focal ${installed[name].version} amd64 [installed]`);
              output = installedList.join('\n');
            } else {
              // List all available packages
              const allPackages = Object.values(AVAILABLE_PACKAGES).map(pkg => {
                const isInstalled = installed[pkg.name];
                return `${pkg.name}/focal ${pkg.version} amd64${isInstalled ? ' [installed]' : ''}`;
              });
              output = allPackages.join('\n');
            }
            break;
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
              output = 'All packages are up to date.';
            } else {
              setLines(prev => [...prev,
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
              ]);

              // Update versions
              const updatedInstalled = { ...installed };
              upgradable.forEach(pkg => {
                updatedInstalled[pkg] = { ...AVAILABLE_PACKAGES[pkg], installedAt: new Date().toISOString() };
              });
              localStorage.setItem(installedKey, JSON.stringify(updatedInstalled));
            }
            break;
          }

          default:
            error = `apt: invalid operation ${subcommand}\nTry: apt --help`;
        }
        break;
      }

      case 'sudo': {
        if (args.includes('--help') || args.includes('-h')) {
          output = `sudo - execute a command as another user

SYNOPSIS
        sudo [OPTIONS] command

DESCRIPTION
        sudo allows a permitted user to execute a command as the superuser
        or another user, as specified by the security policy.

        By default, sudo requires that users authenticate themselves with a
        password (which is the root password in this simulation).

        Once a user has been authenticated, a timestamp is updated and the
        user may then use sudo without a password for a short period of time
        (not implemented in this simulation).

        The command is executed with the privileges of the target user (root
        by default).

OPTIONS
        -u user    Run the command as the specified user instead of root.
                    (Not fully implemented - always uses root)
        -h, --help
                Show this help message.

EXAMPLES
        sudo cat /etc/passwd
                Read the passwd file as root.

        sudo adduser john
                Add a user as root.

        sudo userdel john
                Delete a user as root.

SEE ALSO
        su(1), whoami(1)
`;
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
          output = `su - run a command with substitute user and group ID

SYNOPSIS
        su [OPTIONS] [username]

DESCRIPTION
        su allows commands to be run with a substitute user and group ID.

        When called without arguments, su defaults to running an interactive
        shell as root.

        In this simulation, su switches the current user context to the
        specified user (or root if none specified).

OPTIONS
        -h, --help
                Show this help message.

EXAMPLES
        su
                Switch to root user.

        su john
                Switch to user john.

SEE ALSO
        sudo(1), whoami(1)
`;
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
          output = `reboot - reboot the system

SYNOPSIS
        reboot

DESCRIPTION
        Reboot the system by restarting the simulation from the boot screen.
        This will reset the terminal session and return to the initial boot
        sequence.

        Note: This performs a soft reboot within the simulation.

OPTIONS
        -h, --help
                Show this help message.

EXAMPLES
        reboot
                Reboot the system.

SEE ALSO
        clear(1), reset(1)
`;
          break;
        }

        setIsRebooting(true);
        // Clear any current input
        setCurrentInput('');

        // Show initial reboot message
        setLines(prev => [...prev,
          { type: 'input', content: command, commandPrompt: currentPrompt },
          { type: 'output', content: 'System is going down for reboot...' }
        ]);

        // Simulate shutdown sequence with realistic delays
        setTimeout(() => {
          setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped target Multi-User System.' }]);
        }, 300);

        setTimeout(() => {
          setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped target Graphical Interface.' }]);
        }, 600);

        setTimeout(() => {
          setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped OpenSSH Daemon.' }]);
        }, 900);

        setTimeout(() => {
          setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped Apache HTTP Server.' }]);
        }, 1200);

        setTimeout(() => {
          setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped MySQL Database Server.' }]);
        }, 1500);

        setTimeout(() => {
          setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped target Network.' }]);
        }, 1800);

        setTimeout(() => {
          setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped target Timers.' }]);
        }, 2100);

        setTimeout(() => {
          setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped target Basic System.' }]);
        }, 2400);

        setTimeout(() => {
          setLines(prev => [...prev, { type: 'output', content: 'Rebooting...' }]);
        }, 2700);

        // Clear screen and show BIOS boot sequence
        setTimeout(() => {
          setLines([
            { type: 'output', content: '' },
            { type: 'output', content: 'BIOS Information' },
            { type: 'output', content: 'Vendor: Linux Sim BIOS' },
            { type: 'output', content: 'Version: 1.0' },
            { type: 'output', content: 'Release Date: ' + new Date().toISOString().split('T')[0] },
            { type: 'output', content: '' }
          ]);
        }, 3200);

        // Show more boot messages
        setTimeout(() => {
          setLines(prev => [...prev,
            { type: 'output', content: 'CPU: Linux Sim Processor (1 cores, 1 threads)' },
            { type: 'output', content: 'Memory: 512 MB' },
            { type: 'output', content: 'Memory Test: Passed' },
            { type: 'output', content: '' },
            { type: 'output', content: 'Loading Linux 5.15.0-91-generic...' },
            { type: 'output', content: 'Loading initial ramdisk...' }
          ]);
        }, 3600);

        // Show kernel messages
        setTimeout(() => {
          setLines(prev => [...prev,
            { type: 'output', content: '' },
            { type: 'output', content: '[    0.000000] Linux version 5.15.0-91-generic (buildd@lcy02-amd64-001) (gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0, GNU ld (GNU Binutils for Ubuntu) 2.38) #101-Ubuntu SMP Tue Nov 14 13:30:33 UTC 2023 (Ubuntu 5.15.0-91.101-generic 5.15.122)' },
            { type: 'output', content: '[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-5.15.0-91-generic root=UUID=xxxx ro quiet splash' },
            { type: 'output', content: '[    0.000000] KERNEL supported cpus:' },
            { type: 'output', content: '[    0.000000]   Intel GenuineIntel' },
            { type: 'output', content: '[    0.000000]   AMD AuthenticAMD' },
            { type: 'output', content: '[    0.000000] x86/fpu: Supporting XSAVE feature 0x001: \'x87 floating point registers\'' },
            { type: 'output', content: '[    0.000000] BIOS-provided physical RAM map:' },
            { type: 'output', content: '[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable' },
            { type: 'output', content: '[    0.000000] BIOS-e820: [mem 0x0000000000100000-0x000000001fffffff] usable' },
            { type: 'output', content: '[    0.010000] Mount-cache hash table entries: 2048 (order: 2, 16384 bytes, linear)' },
            { type: 'output', content: '[    0.020000] CPU: Physical Processor ID: 0' },
            { type: 'output', content: '[    0.030000] devtmpfs: initialized' },
            { type: 'output', content: '[    0.040000] NET: Registered protocol family 16' }
          ]);
        }, 4000);

        // Show service startup messages
        setTimeout(() => {
          setLines(prev => [...prev,
            { type: 'output', content: '' },
            { type: 'output', content: 'Loading, please wait...' },
            { type: 'output', content: '' },
            { type: 'output', content: 'Begin: Loading essential drivers ... [    0.09] done.' },
            { type: 'output', content: 'Begin: Running /scripts/init-premount ... [    0.09] done.' },
            { type: 'output', content: 'Begin: Mounting root file system ... [    0.10] done.' },
            { type: 'output', content: 'Begin: Running /scripts/local-bottom ... [    0.10] done.' },
            { type: 'output', content: 'Begin: Running /scripts/init-bottom ... [    0.10] done.' },
            { type: 'output', content: '' },
            { type: 'output', content: '[    1.234567] systemd[1]: systemd 249.11-0ubuntu3.9 running in system mode (+PAM +AUDIT +SELINUX +APPARMOR +IMA +SMACK +SECCOMP +GCRYPT +GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +IPTC +KMOD +LIBCRYPTSETUP +LIBFDISK +PCRE2 -PWQUALITY -P11KIT -QRENCODE -BZIP2 +LZ4 +XZ +ZLIB +ZSTD -XKBCOMMON +UTEMPTER +SYSTEMD_GROUP +SYSTEMD_RESOLVE +SYSTEMD_CREDS +SYSTEMD_HOME +SYSTEMD_XZ -GNOME_KEYRING)' },
            { type: 'output', content: '[    1.234567] systemd[1]: systemd 249.11-0ubuntu3.9 running in system mode (+PAM +AUDIT +SELINUX +APPARMOR +IMA +SMACK +SECCOMP +GCRYPT +GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +IPTC +KMOD +LIBCRYPTSETUP +LIBFDISK +PCRE2 -PWQUALITY -P11KIT -QRENCODE -BZIP2 +LZ4 +XZ +ZLIB +ZSTD -XKBCOMMON +UTEMPTER +SYSTEMD_GROUP +SYSTEMD_RESOLVE +SYSTEMD_CREDS +SYSTEMD_HOME +SYSTEMD_XZ -GNOME_KEYRING)' },
            { type: 'output', content: '[    1.345678] systemd[1]: No hostname configured.' },
            { type: 'output', content: '[    1.345678] systemd[1]: Set hostname to <linux-sim>.' }
          ]);
        }, 4800);

        // Show welcome message and login prompt
        setTimeout(() => {
          setLines(prev => [...prev,
            { type: 'output', content: '' },
            { type: 'output', content: 'Welcome to Linux Sim!' },
            { type: 'output', content: ' * Documentation:  https://help.ubuntu.com' },
            { type: 'output', content: ' * Management:     https://landscape.canonical.com' },
            { type: 'output', content: ' * Support:        https://ubuntu.com/advantage' },
            { type: 'output', content: '' },
            { type: 'output', content: ' System information as of ' + new Date().toLocaleString() },
            { type: 'output', content: '' },
            { type: 'output', content: ' System load:  0.0               Processes:             1' },
            { type: 'output', content: ' Usage of /:   10.0% of 9.78GB    Users logged in:       0' },
            { type: 'output', content: ' Memory usage: 15%               IPv4 address for eth0: 10.0.2.15' },
            { type: 'output', content: ' Swap usage:   0%' },
            { type: 'output', content: '' },
            { type: 'output', content: '0 updates can be applied immediately.' },
            { type: 'output', content: '0 of these updates are standard security updates.' },
            { type: 'output', content: 'To see these additional updates run: apt list --upgradable' },
            { type: 'output', content: '' },
            { type: 'output', content: 'The programs included with the Ubuntu system are free software;' },
            { type: 'output', content: 'the exact distribution terms for each program are described in the' },
            { type: 'output', content: 'individual files in /usr/share/doc/*/copyright.' },
            { type: 'output', content: '' },
            { type: 'output', content: 'Ubuntu comes with ABSOLUTELY NO WARRANTY, to the extent permitted by' },
            { type: 'output', content: 'applicable law.' },
            { type: 'output', content: '' },
            { type: 'output', content: 'Linux Sim ' + (setupData?.computerName || 'linux-sim') + ' tty1' },
            { type: 'output', content: '' },
            { type: 'output', content: (setupData?.computerName || 'linux-sim') + ' login: ' }
          ]);

          // Reset rebooting state and allow input again
          setIsRebooting(false);
          // Reset to initial state - user would need to login again
          setCommandHistory([]);
          setCurrentInput('');
        }, 6000);

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
      'cat', 'nano', 'apt', 'sudo', 'su', 'cp', 'mv', 'chmod', 'whoami', 'id', 'echo', 'grep', 'find',
      'save', 'reset', 'debug', 'clear', 'reboot', 'adduser', 'userdel', 'passwd'
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