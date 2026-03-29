"use client";

import { useState, useRef, useEffect } from 'react';
import { FakeFileSystem } from '../lib/filesystem';

interface TerminalLine {
  type: 'input' | 'output' | 'error';
  content: string;
  commandPrompt?: string;
}

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  createdAt: string;
}

interface TerminalProps {
  setupData: GameSetup | null;
}

export default function Terminal({ setupData }: TerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: `Welcome to Linux Sim Game, ${setupData?.playerName || 'User'}!` },
    { type: 'output', content: `Connected to ${setupData?.computerName || 'linux-sim'}` },
    { type: 'output', content: 'Type "help" for available commands or "cat README.txt" for more information.' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fs] = useState(() => new FakeFileSystem(setupData));
  const [currentPrompt, setCurrentPrompt] = useState<string>('');
  const inputRef = useRef<HTMLInputElement>(null);
  const terminalRef = useRef<HTMLDivElement>(null);

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

  const executeCommand = (command: string) => {
    if (!fs) return;

    const trimmedCommand = command.trim();
    if (!trimmedCommand) return;

    // Add command to history
    setCommandHistory(prev => [...prev, trimmedCommand]);
    setHistoryIndex(-1);

    const parts = trimmedCommand.split(' ');
    const cmd = parts[0];
    const args = parts.slice(1);

    let output: string = '';
    let error: string = '';

    // Check if command binary exists (except for built-in commands)
    const builtinCommands = ['cd', 'pwd', 'help', 'clear', 'debug'];
    if (!builtinCommands.includes(cmd)) {
      const binaryPath = `/bin/${cmd}.bin`;
      if (!fs.readFile(binaryPath)) {
        error = `${cmd}: command not found`;
        // Add the command line and error to output
        setLines(prev => [...prev, { type: 'input', content: command, commandPrompt: currentPrompt }]);
        if (error) {
          setLines(prev => [...prev, { type: 'error', content: error }]);
        }
        // Update prompt
        setCurrentPrompt(`${setupData?.playerName?.toLowerCase() || 'user'}@${setupData?.computerName || 'linux-sim'}:${fs.getAbsolutePath()}$ `);
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
          ['ls [opts] [dir]', 'List directory contents (-l long format, -a show hidden)'],
          ['cd <dir>', 'Change directory (~ for home)'],
          ['pwd', 'Print working directory'],
          ['mkdir <dir>', 'Create directory'],
          ['rmdir <dir>', 'Remove empty directory'],
          ['touch <file>', 'Create empty file'],
          ['rm <file>', 'Remove file'],
          ['cat <file>', 'Display file contents'],
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
          ['clear', 'Clear terminal']
        ];

        const maxCmdLength = Math.max(...commands.map(([cmd]) => cmd.length));
        output = 'Available commands:\n' + commands.map(([cmd, desc]) =>
          `  ${cmd.padEnd(maxCmdLength)} - ${desc}`
        ).join('\n');
        break;

      case 'ls': {
        let showHidden = false;
        let longFormat = false;
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
          if (arg === '-la' || arg === '-al') {
            showHidden = true;
            longFormat = true;
            return false;
          }
          return true;
        });

        if (filteredArgs.length > 0) {
          targetPath = filteredArgs[0];
        }

        const files = fs.listDirectory(targetPath, showHidden);
        if (files.length === 0) {
          output = '';
        } else if (longFormat) {
          // Calculate column widths for better alignment
          const ownerNames = files.map(file => fs.getUserByName(file.uid.toString())?.name || file.uid.toString());
          const groupNames = files.map(file => fs.getGroupByName(file.gid.toString())?.name || file.gid.toString());
          const maxOwnerWidth = Math.max(...ownerNames.map(name => name.length), 8); // minimum 8 chars
          const maxGroupWidth = Math.max(...groupNames.map(name => name.length), 8); // minimum 8 chars

          output = files.map(file => {
            const type = file.type === 'directory' ? 'd' : '-';
            const perms = file.permissions.substring(1);
            const links = '1'; // simplified
            const owner = (fs.getUserByName(file.uid.toString())?.name || file.uid.toString()).padEnd(maxOwnerWidth);
            const group = (fs.getGroupByName(file.gid.toString())?.name || file.gid.toString()).padEnd(maxGroupWidth);
            const size = file.size.toString().padStart(8);
            const date = file.modified.toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
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

      case 'cd': {
        const path = args[0] || '~';
        let targetPath = path;

        // Handle ~ expansion
        if (path === '~' || path.startsWith('~/')) {
          const home = fs.getCurrentUser().home;
          targetPath = path === '~' ? home : home + path.substring(1);
        }

        if (fs.changeDirectory(targetPath)) {
          // Directory changed successfully, prompt will update
        } else {
          error = `cd: ${path}: No such file or directory`;
        }
        break;
      }

      case 'pwd':
        output = fs.getWorkingDirectory();
        break;

      case 'mkdir': {
        if (args.length === 0) {
          error = 'mkdir: missing operand\nUsage: mkdir <directory>';
        } else {
          const failedDirs: string[] = [];
          args.forEach(dir => {
            if (!fs.createNewDirectory(dir)) {
              failedDirs.push(dir);
            }
          });
          if (failedDirs.length > 0) {
            error = `mkdir: cannot create directory '${failedDirs[0]}': File exists`;
          }
        }
        break;
      }

      case 'rmdir': {
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
        if (args.length === 0) {
          error = 'touch: missing file operand';
        } else {
          const failedFiles: string[] = [];
          args.forEach(file => {
            if (!fs.createNewFile(file)) {
              failedFiles.push(file);
            }
          });
          if (failedFiles.length > 0) {
            error = `touch: cannot touch '${failedFiles[0]}': File exists or invalid path`;
          }
        }
        break;
      }

      case 'rm': {
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
            error = `cat: ${failedFiles[0]}: No such file or directory`;
          } else {
            output = contents.join('\n');
          }
        }
        break;
      }

      case 'cp': {
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

      case 'chmod': {
        if (args.length < 2) {
          error = 'chmod: missing operand\nUsage: chmod <mode> <file>';
        } else {
          const [mode, file] = args;
          if (!fs.changePermissions(file, mode)) {
            error = `chmod: invalid mode '${mode}' or file '${file}' not found`;
          }
        }
        break;
      }

      case 'whoami': {
        output = fs.getCurrentUser().name;
        break;
      }

      case 'id': {
        const user = fs.getCurrentUser();
        const group = fs.getGroupByName(user.gid.toString());
        output = `uid=${user.uid}(${user.name}) gid=${user.gid}(${group?.name || user.gid}) groups=${user.gid}(${group?.name || user.gid})`;
        break;
      }

      case 'echo': {
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
            const startDir = fs.getNode(path);
            if (!startDir || startDir.type !== 'directory') {
              error = `find: '${path}': No such file or directory`;
            } else {
              const results: string[] = [];
              findFiles(startDir, pattern, path, results);
              output = results.join('\n');
            }
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

      case 'debug': {
        const manDir = fs.getNode('/usr/share/man/man1');
        if (manDir) {
          const files = fs.listDirectory('/usr/share/man/man1', true);
          const fileList = files.map(f => f.name).join('\n');
          output = `Man pages directory: ${files.length} files found\n${fileList}`;
        } else {
          output = 'Error: Man pages directory not found';
        }
        break;
      }

      case 'reset':
        fs.clearLocalStorage();
        output = 'Filesystem reset. Refresh the page to start fresh.';
        break;

      case 'man': {
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

      case 'clear':
        setLines([]);
        return; // Don't add any lines

      default:
        error = `${cmd}: command not found`;
    }

    // Add the command line
    setLines(prev => [...prev, { type: 'input', content: command, commandPrompt: currentPrompt }]);

    // Add output if any
    if (output) {
      setLines(prev => [...prev, { type: 'output', content: output }]);
    }

    // Add error if any
    if (error) {
      setLines(prev => [...prev, { type: 'error', content: error }]);
    }

    // Update prompt after directory changes
    setCurrentPrompt(`${setupData?.playerName?.toLowerCase() || 'user'}@${setupData?.computerName || 'linux-sim'}:${fs.getAbsolutePath()}$ `);

    // Save filesystem state after each command
    fs.saveToLocalStorage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
      setCurrentInput('');
    } else if (e.key === 'Tab') {
      e.preventDefault();
      handleTabCompletion();
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (commandHistory.length > 0) {
        const newIndex = historyIndex === -1 ? commandHistory.length - 1 : Math.max(0, historyIndex - 1);
        setHistoryIndex(newIndex);
        setCurrentInput(commandHistory[newIndex]);
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

    // If we're at the beginning (command completion)
    if (parts.length === 1 && !input.includes(' ')) {
      const completions = getCommandCompletions(currentPart);
      if (completions.length === 1) {
        setCurrentInput(completions[0]);
      } else if (completions.length > 1) {
        // Show possible completions
        const commonPrefix = getCommonPrefix(completions);
        if (commonPrefix.length > currentPart.length) {
          setCurrentInput(commonPrefix);
        } else {
          // Show all completions
          setLines(prev => [...prev, { type: 'output', content: completions.join('  ') }]);
        }
      }
    } else {
      // Path completion
      const completions = getPathCompletions(currentPart);
      if (completions.length === 1) {
        const completedPath = completions[0];
        const newInput = [...prevParts, completedPath].join(' ');
        setCurrentInput(newInput);
      } else if (completions.length > 1) {
        const commonPrefix = getCommonPrefix(completions);
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
      'cat', 'cp', 'mv', 'chmod', 'whoami', 'id', 'echo', 'grep', 'find',
      'save', 'reset', 'debug', 'clear'
    ];

    return allCommands.filter(cmd => cmd.startsWith(prefix));
  };

  const getPathCompletions = (prefix: string): string[] => {
    // Handle absolute vs relative paths
    let basePath = '';
    let searchPrefix = prefix;

    if (prefix.includes('/')) {
      const lastSlashIndex = prefix.lastIndexOf('/');
      basePath = prefix.substring(0, lastSlashIndex);
      searchPrefix = prefix.substring(lastSlashIndex + 1);
    }

    // Get the directory to search in
    const searchDir = basePath ? basePath : '.';
    const files = fs.listDirectory(searchDir, true);

    // Filter by prefix
    const matches = files
      .map(file => file.name)
      .filter(name => name.startsWith(searchPrefix));

    // Add path prefix back
    const fullBasePath = basePath ? (basePath === '/' ? '/' : basePath + '/') : '';
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

  const getCommonPrefix = (strings: string[]): string => {
    if (strings.length === 0) return '';
    if (strings.length === 1) return strings[0];

    let prefix = strings[0];
    for (let i = 1; i < strings.length; i++) {
      while (strings[i].indexOf(prefix) !== 0) {
        prefix = prefix.substring(0, prefix.length - 1);
        if (prefix === '') return '';
      }
    }
    return prefix;
  };

  useEffect(() => {
    if (terminalRef.current) {
      terminalRef.current.scrollTop = terminalRef.current.scrollHeight;
    }
  }, [lines]);

  useEffect(() => {
    // Initialize prompt based on filesystem's current directory
    setCurrentPrompt(`user@linux-sim:${fs.getWorkingDirectory()}$ `);
  }, [fs]);

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
        <div className="flex">
          <span className="text-green-400 mr-2">{currentPrompt}</span>
          <input
            ref={inputRef}
            type="text"
            value={currentInput}
            onChange={(e) => setCurrentInput(e.target.value)}
            onKeyDown={handleKeyDown}
            className="flex-1 bg-transparent border-none outline-none text-white caret-green-400"
            autoFocus
            disabled={!fs}
          />
        </div>
      </div>
    </div>
  );
}