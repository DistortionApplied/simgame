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
  const [passwordPrompt, setPasswordPrompt] = useState('');
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

    // Check if command binary exists (except for built-in commands)
    const builtinCommands = ['cd', 'pwd', 'help', 'clear', 'debug', 'nano', 'sudo', 'su', 'reboot', 'ls', 'touch', 'cat', 'mkdir', 'rmdir', 'rm', 'cp', 'mv', 'chmod', 'whoami', 'id', 'echo', 'grep', 'find', 'man', 'save', 'reset', 'adduser', 'userdel', 'passwd'];
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
        if (args.includes('--help')) {
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
        const filteredArgs = args.filter(arg => {
          if (arg === '-a' || arg === '--all') {
            showHidden = true;
            return false;
          }
          if (arg === '-l') {
            longFormat = true;
            return false;
          }
          if (arg === '-d' || arg === '--directory') {
            directoryOnly = true;
            return false;
          }
          if (arg === '-la' || arg === '-al') {
            showHidden = true;
            longFormat = true;
            return false;
          }
          if (arg === '-ld') {
            longFormat = true;
            directoryOnly = true;
            return false;
          }
          return true;
        });

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
        if (args.length === 1 && args[0] === '--help') {
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

          // Validate octal mode (3 or 4 digits)
          if (!/^[0-7]{3,4}$/.test(mode)) {
            error = `chmod: invalid mode '${mode}'\nTry: chmod --help`;
          } else if (!fs.changePermissions(fullPath, mode)) {
            error = `chmod: cannot access '${filePath}': No such file or directory`;
          } else {
            // Success - no output needed
          }
        }
        break;
      }

      case 'adduser': {
        if (args.length === 0) {
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
          setLines(prev => [...prev,
            { type: 'input', content: command, commandPrompt: currentPrompt },
            { type: 'output', content: `adduser: user '${username}' added successfully` }
          ]);
        });
        return; // Don't process further since we're prompting for password
      }

      case 'userdel': {
        if (args.length === 0) {
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

        output = `userdel: user '${username}' removed successfully`;
        break;
      }

      case 'passwd': {
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
                    setLines(prev => [...prev, { type: 'output', content: `passwd: password updated successfully` }]);
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
                  setLines(prev => [...prev, { type: 'output', content: `passwd: password for ${targetUsername} updated successfully` }]);
                }
              });
            });
          }
        }
        return; // Don't process further since we're using password prompts
      }

      case 'whoami': {
        if (args.includes('--help')) {
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
        if (args.includes('--help')) {
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

        if (fs.changeDirectory(targetPath)) {
          // Directory changed successfully
          setWorkingDirectory(fs.getWorkingDirectory());
        } else {
          error = `cd: ${path}: No such file or directory`;
        }
        break;
      }

      case 'pwd':
        if (args.includes('--help')) {
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
        if (args.includes('--help')) {
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
          const failedDirs: string[] = [];
          args.forEach(dir => {
            // Handle ~ expansion
            let expandedDir = dir;
            if (dir === '~' || dir.startsWith('~/')) {
              const home = fs.getCurrentUser().home;
              expandedDir = dir === '~' ? home : home + dir.substring(1);
            }

            if (!fs.createNewDirectory(expandedDir)) {
              failedDirs.push(dir); // Use original dir name in error
            }
          });
          if (failedDirs.length > 0) {
            error = `mkdir: cannot create directory '${failedDirs[0]}': File exists or permission denied`;
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
        if (args.includes('--help')) {
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
          const failedFiles: string[] = [];
          args.forEach(file => {
            // Handle ~ expansion
            let expandedFile = file;
            if (file === '~' || file.startsWith('~/')) {
              const home = fs.getCurrentUser().home;
              expandedFile = file === '~' ? home : home + file.substring(1);
            }

            if (!fs.createNewFile(expandedFile)) {
              failedFiles.push(file); // Use original file name in error
            }
          });
          if (failedFiles.length > 0) {
            error = `touch: cannot touch '${failedFiles[0]}': File exists or invalid path`;
          }
        }
        break;
      }

      case 'rm': {
        if (args.includes('--help')) {
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
          const failedFiles: string[] = [];
          args.forEach(file => {
            if (!fs.remove(file)) {
              failedFiles.push(file);
            }
          });
          if (failedFiles.length > 0) {
            error = `rm: cannot remove '${failedFiles[0]}': No such file or directory`;
          }
        }
        break;
      }

      case 'cat': {
        if (args.includes('--help')) {
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
            error = `cat: ${failedFiles[0]}': No such file or directory`;
          } else {
            output = contents.join('\n');
          }
        }
        break;
      }

      case 'cp': {
        if (args.includes('--help')) {
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
          if (!fs.copyFile(src, dst)) {
            error = `cp: cannot copy '${src}' to '${dst}': No such file or directory`;
          }
        }
        break;
      }

      case 'mv': {
        if (args.length < 2) {
          error = 'mv: missing file operand\nUsage: mv <source> <destination>';
        } else {
          const [src, dst] = args;
          if (!fs.moveFile(src, dst)) {
            error = `mv: cannot move '${src}' to '${dst}': No such file or directory`;
          }
        }
        break;
      }

      case 'echo': {
        if (args.includes('--help')) {
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
        if (fs.saveToLocalStorage()) {
          output = 'Filesystem state saved successfully.';
        } else {
          error = 'Failed to save filesystem state.';
        }
        break;

      case 'reset':
        fs.clearLocalStorage();
        output = 'Filesystem reset. Refresh the page to start fresh.';
        break;

      case 'debug': {
        const user = fs.getCurrentUser();
        output = `Current user: ${user.name} (uid: ${user.uid}, gid: ${user.gid})\n` +
                `Current directory: ${fs.getWorkingDirectory()}\n` +
                `Total users: ${fs.getUsers().size}\n` +
                `Total groups: ${fs.getGroups().size}`;
        break;
      }

      case 'man': {
        if (args.includes('--help')) {
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
        if (args.length === 0) {
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

      case 'sudo': {
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
        if (args.includes('--help')) {
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
    const isPathCompletion = currentPart.includes('/') || currentPart.startsWith('.');

    if (!isPathCompletion) {
      // Command completion
      const completions: string[] = getCommandCompletions(currentPart);
      if (completions.length === 1) {
        const newInput = [...prevParts, completions[0]].join(' ');
        setCurrentInput(newInput);
      } else if (completions.length > 1) {
        // Show possible completions
        const commonPrefix: string = getCommonPrefix(completions);
        if (commonPrefix.length > currentPart.length) {
          const newInput = [...prevParts, commonPrefix].join(' ');
          setCurrentInput(newInput);
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
      } else if (completions.length > 1) {
        const commonPrefix: string = getCommonPrefix(completions);
        if (commonPrefix.length > currentPart.length) {
          const newInput = [...prevParts, commonPrefix].join(' ');
          setCurrentInput(newInput);
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
      'cat', 'nano', 'sudo', 'su', 'cp', 'mv', 'chmod', 'whoami', 'id', 'echo', 'grep', 'find',
      'save', 'reset', 'debug', 'clear', 'reboot', 'adduser', 'userdel', 'passwd'
    ];

    return allCommands.filter(cmd => cmd.startsWith(prefix));
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