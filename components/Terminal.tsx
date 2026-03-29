"use client";


import { useState, useRef, useEffect } from 'react';
import { FakeFileSystem } from '../lib/filesystem';

interface TerminalLine {
  type: 'input' | 'output' | 'error';
  content: string;
  commandPrompt?: string;
}

export default function Terminal() {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'output', content: 'Welcome to Linux Sim Game!' },
    { type: 'output', content: 'Type "help" for available commands.' },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [fs] = useState(() => new FakeFileSystem());
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

    switch (cmd) {
      case 'help':
        output = `Available commands:
  help           - Show this help
  ls [opts] [dir]- List directory contents (-l long format, -a show hidden)
  cd <dir>       - Change directory (~ for home)
  pwd            - Print working directory
  mkdir <dir>    - Create directory
  touch <file>   - Create empty file
  rm <file>      - Remove file
  cat <file>     - Display file contents
  cp <src> <dst> - Copy file
  mv <src> <dst> - Move/rename file
  chmod <mode> <file> - Change permissions (octal)
  whoami         - Show current user
  id             - Show user/group IDs
  echo <text>    - Display text
  grep <pat> <file> - Search for pattern in file
  find <path> -name <pat> - Find files by name
  save           - Manually save filesystem state
  reset          - Reset filesystem to initial state
  clear          - Clear terminal`;
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
          output = files.map(file => {
            const type = file.type === 'directory' ? 'd' : '-';
            const perms = file.permissions.substring(1);
            const links = '1'; // simplified
            const owner = fs.getUserByName(file.uid.toString())?.name || file.uid.toString();
            const group = fs.getGroupByName(file.gid.toString())?.name || file.gid.toString();
            const size = file.size.toString().padStart(8);
            const date = file.modified.toLocaleDateString('en-US', {
              month: 'short',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit'
            });
            return `${type}${perms} ${links} ${owner} ${group} ${size} ${date} ${file.name}`;
          }).join('\n');
        } else {
          output = files.map(file => file.name).join('  ');
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
          error = 'mkdir: missing operand';
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

      case 'reset':
        fs.clearLocalStorage();
        output = 'Filesystem reset. Refresh the page to start fresh.';
        break;

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
    setCurrentPrompt(`user@linux-sim:${fs.getAbsolutePath()}$ `);

    // Save filesystem state after each command
    fs.saveToLocalStorage();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      executeCommand(currentInput);
      setCurrentInput('');
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