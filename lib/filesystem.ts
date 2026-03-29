export interface FileNode {
  name: string;
  type: 'file' | 'directory';
  permissions: string; // like 'rw-r--r--' or 'drwxr-xr-x'
  uid: number; // user id
  gid: number; // group id
  size: number;
  modified: Date;
  parent?: FileNode; // parent directory reference
  children?: Map<string, FileNode>; // only for directories
  content?: string; // only for files
  link?: string; // for symbolic links (future feature)
}

export interface User {
  uid: number;
  name: string;
  gid: number;
  home: string;
  shell: string;
}

export interface Group {
  gid: number;
  name: string;
  members: string[];
}

interface SerializedFileNode {
  name: string;
  type: 'file' | 'directory';
  permissions: string;
  uid: number;
  gid: number;
  size: number;
  modified: string; // ISO string
  children?: Record<string, SerializedFileNode>;
  content?: string;
  link?: string;
}

interface SerializedFileSystem {
  root: SerializedFileNode;
  currentDirectory: string; // path string
  currentUser: string; // username
  users: Record<string, User>;
  groups: Record<string, Group>;
  version: string; // for future compatibility
}

export class FakeFileSystem {
  private root!: FileNode; // Using definite assignment assertion
  private currentDirectory!: FileNode;
  private currentUser!: User;
  private users: Map<string, User>;
  private groups: Map<string, Group>;
  private readonly STORAGE_KEY = 'linux-sim-filesystem';

  constructor() {
    this.users = new Map();
    this.groups = new Map();

    // Try to load from localStorage first
    if (!this.loadFromLocalStorage()) {
      // If no saved state or loading failed, create fresh filesystem
      this.createUsersAndGroups();
      this.currentUser = this.users.get('user')!;
      this.root = this.createInitialFileSystem();
      this.currentDirectory = this.root;
    }

    // Ensure properties are initialized (TypeScript requirement)
    if (!this.root) {
      this.createUsersAndGroups();
      this.currentUser = this.users.get('user')!;
      this.root = this.createInitialFileSystem();
      this.currentDirectory = this.root;
    }
  }

  private createInitialFileSystem(): FileNode {
    // Create root directory
    const root: FileNode = {
      name: '',
      type: 'directory',
      permissions: 'drwxr-xr-x',
      uid: 0,
      gid: 0,
      size: 4096,
      modified: new Date(),
      children: new Map()
    };

    // Set root early so methods can access it
    this.root = root;

    // Create basic directory structure
    this.createDirectory('bin', root);
    this.createDirectory('boot', root);
    this.createDirectory('dev', root);
    this.createDirectory('etc', root);
    this.createDirectory('home', root);
    this.createDirectory('lib', root);
    this.createDirectory('media', root);
    this.createDirectory('mnt', root);
    this.createDirectory('opt', root);
    this.createDirectory('proc', root);
    this.createDirectory('root', root);
    this.createDirectory('run', root);
    this.createDirectory('sbin', root);
    this.createDirectory('srv', root);
    this.createDirectory('sys', root);
    this.createDirectory('tmp', root);
    this.createDirectory('usr', root);
    this.createDirectory('var', root);

    // Create /usr subdirectories
    const usr = root.children!.get('usr')!;
    this.createDirectory('bin', usr);
    this.createDirectory('lib', usr);
    this.createDirectory('local', usr);
    this.createDirectory('share', usr);
    this.createDirectory('src', usr);

    // Create /var subdirectories
    const vari = root.children!.get('var')!;
    this.createDirectory('cache', vari);
    this.createDirectory('lib', vari);
    this.createDirectory('log', vari);
    this.createDirectory('mail', vari);
    this.createDirectory('run', vari);
    this.createDirectory('spool', vari);
    this.createDirectory('tmp', vari);

    // Create user home directory
    const home = root.children!.get('home')!;
    const userHome = this.createDirectory('user', home);

    // Populate directories with realistic files
    this.populateSystemFiles();

    return root;
  }

  private createUsersAndGroups(): void {
    // Create root user
    this.users.set('root', {
      uid: 0,
      name: 'root',
      gid: 0,
      home: '/root',
      shell: '/bin/bash'
    });

    // Create regular user
    this.users.set('user', {
      uid: 1000,
      name: 'user',
      gid: 1000,
      home: '/home/user',
      shell: '/bin/bash'
    });

    // Create groups
    this.groups.set('root', {
      gid: 0,
      name: 'root',
      members: ['root']
    });

    this.groups.set('user', {
      gid: 1000,
      name: 'user',
      members: ['user']
    });
  }

  private populateSystemFiles(): void {
    // /etc files
    this.createFile('/etc/passwd',
      'root:x:0:0:root:/root:/bin/bash\n' +
      'user:x:1000:1000:user:/home/user:/bin/bash\n' +
      'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\n' +
      'bin:x:2:2:bin:/bin:/usr/sbin/nologin\n'
    );

    this.createFile('/etc/group',
      'root:x:0:\n' +
      'user:x:1000:\n' +
      'daemon:x:1:\n' +
      'bin:x:2:\n'
    );

    this.createFile('/etc/hostname', 'linux-sim');
    this.createFile('/etc/hosts', '127.0.0.1\tlocalhost\n::1\tlocalhost\n');
    this.createFile('/etc/os-release',
      'NAME="Linux Sim"\n' +
      'VERSION="1.0"\n' +
      'ID=linux-sim\n' +
      'PRETTY_NAME="Linux Sim 1.0"\n'
    );

    // /home/user files
    this.createFile('/home/user/.bashrc',
      '# ~/.bashrc: executed by bash(1) for non-login shells.\n' +
      'export PS1="\\u@\\h:\\w\\$ "\n' +
      'export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n' +
      'alias ll="ls -alF"\n' +
      'alias la="ls -A"\n' +
      'alias l="ls -CF"\n'
    );

    this.createFile('/home/user/.profile',
      '# ~/.profile: executed by the command interpreter for login shells.\n' +
      'if [ -n "$BASH_VERSION" ]; then\n' +
      '    if [ -f "$HOME/.bashrc" ]; then\n' +
      '        . "$HOME/.bashrc"\n' +
      '    fi\n' +
      'fi\n'
    );

    this.createFile('/home/user/README.txt',
      '🎮 Welcome to Linux Sim Game! 🎮\n\n' +
      'You are now in a fully simulated Linux environment.\n' +
      'Explore, create, and manage files just like on a real system!\n\n' +
      '🌟 Key Features:\n' +
      '  • Realistic directory structure (/usr, /var, /etc, etc.)\n' +
      '  • Proper file permissions and user management\n' +
      '  • Absolute and relative path navigation\n' +
      '  • Advanced command options and flags\n\n' +
      '📚 Available Commands:\n' +
      '  Navigation:\n' +
      '    cd <dir>    - Change directory (~ for home)\n' +
      '    pwd         - Print working directory\n' +
      '    ls [opts]   - List contents (-l long, -a hidden)\n\n' +
      '  File Operations:\n' +
      '    cat <file>  - Display file contents\n' +
      '    touch <file>- Create empty file\n' +
      '    cp <src> <dst> - Copy file\n' +
      '    mv <src> <dst> - Move/rename file\n' +
      '    rm <file>   - Remove file\n' +
      '    mkdir <dir> - Create directory\n\n' +
      '  System Info:\n' +
      '    whoami      - Show current user\n' +
      '    id          - Show user/group IDs\n' +
      '    chmod <mode> <file> - Change permissions\n\n' +
      '  Text Processing:\n' +
      '    grep <pat> <file> - Search for pattern\n' +
      '    find <path> -name <pat> - Locate files\n\n' +
      '  Utilities:\n' +
      '    help        - Show all commands\n' +
      '    echo <text> - Display text\n' +
      '    save        - Save current filesystem state\n' +
      '    reset       - Reset filesystem to initial state\n' +
      '    clear       - Clear terminal\n\n' +
      '💾 Persistence:\n' +
      '  Your filesystem state is automatically saved!\n' +
      '  Use "save" to manually save, "reset" to start fresh.\n\n' +
      '🚀 Getting Started:\n' +
      '  Try: ls -la\n' +
      '       cd /etc\n' +
      '       cat passwd\n' +
      '       cd ~\n' +
      '       help\n\n' +
      'Enjoy exploring your Linux simulation! 🐧\n'
    );

    // /var/log files
    this.createFile('/var/log/syslog',
      '[INFO] System started at ' + new Date().toISOString() + '\n' +
      '[INFO] File system initialized\n' +
      '[INFO] User session started\n'
    );

    // Create some basic binaries (just placeholder files)
    const binaries = ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'touch', 'rm', 'cp', 'mv', 'chmod', 'whoami', 'id', 'grep', 'find'];
    binaries.forEach(bin => {
      this.createFile(`/bin/${bin}`, '#!/bin/bash\n# ${bin} command\n');
    });
  }

  private createDirectory(name: string, parent: FileNode): FileNode {
    const dir: FileNode = {
      name,
      type: 'directory',
      permissions: 'drwxr-xr-x',
      uid: this.currentUser.uid,
      gid: this.currentUser.gid,
      size: 4096,
      modified: new Date(),
      parent,
      children: new Map()
    };

    if (parent.children) {
      parent.children.set(name, dir);
    }

    return dir;
  }

  private createFile(path: string, content: string = ''): FileNode | null {
    const parts = path.split('/').filter(p => p);
    let current = this.root;

    // Navigate to parent directory
    for (let i = 0; i < parts.length - 1; i++) {
      if (!current.children?.has(parts[i])) {
        return null; // Parent directory doesn't exist
      }
      current = current.children!.get(parts[i])!;
      if (current.type !== 'directory') {
        return null; // Not a directory
      }
    }

    const fileName = parts[parts.length - 1];
    if (current.children?.has(fileName)) {
      return null; // Already exists
    }

    const file: FileNode = {
      name: fileName,
      type: 'file',
      permissions: '-rw-r--r--',
      uid: this.currentUser.uid,
      gid: this.currentUser.gid,
      size: content.length,
      modified: new Date(),
      parent: current,
      content
    };

    current.children!.set(fileName, file);
    return file;
  }

  // Path resolution utilities
  private resolvePath(path: string, from?: FileNode): FileNode | null {
    if (!path) return from || this.currentDirectory;

    let current: FileNode;
    let parts: string[];

    if (path.startsWith('/')) {
      // Absolute path
      current = this.root;
      parts = path.split('/').filter(p => p);
    } else {
      // Relative path
      current = from || this.currentDirectory;
      parts = path.split('/').filter(p => p);
    }

    for (const part of parts) {
      if (part === '.') {
        continue;
      } else if (part === '..') {
        if (current.parent) {
          current = current.parent;
        } else {
          // Can't go above root
          continue;
        }
      } else {
        if (!current.children?.has(part)) {
          return null; // Path component doesn't exist
        }
        current = current.children!.get(part)!;
      }
    }

    return current;
  }

  private getPathString(node: FileNode): string {
    if (node === this.root) return '/';

    const parts: string[] = [];
    let current: FileNode | undefined = node;

    while (current && current !== this.root) {
      parts.unshift(current.name);
      current = current.parent;
    }

    return '/' + parts.join('/');
  }

  getNode(path: string): FileNode | null {
    return this.resolvePath(path);
  }

  getCurrentDirectory(): FileNode {
    return this.currentDirectory;
  }

  getWorkingDirectory(): string {
    return this.getPathString(this.currentDirectory);
  }

  changeDirectory(path: string): boolean {
    const target = this.resolvePath(path);
    if (target && target.type === 'directory') {
      this.currentDirectory = target;
      return true;
    }
    return false;
  }

  listDirectory(path?: string, showHidden: boolean = false): FileNode[] {
    const dir = path ? this.resolvePath(path) : this.currentDirectory;
    if (!dir || dir.type !== 'directory' || !dir.children) return [];

    const files = Array.from(dir.children.values());
    if (!showHidden) {
      return files.filter(file => !file.name.startsWith('.'));
    }
    return files;
  }

  readFile(path: string): string | null {
    const file = this.resolvePath(path);
    if (file && file.type === 'file') {
      return file.content || '';
    }
    return null;
  }

  writeFile(path: string, content: string): boolean {
    const file = this.resolvePath(path);
    if (file && file.type === 'file') {
      file.content = content;
      file.size = content.length;
      file.modified = new Date();
      return true;
    }
    return false;
  }

  createNewFile(path: string): boolean {
    if (this.resolvePath(path)) {
      return false; // Already exists
    }

    const parts = path.split('/').filter(p => p);
    const fileName = parts.pop()!;
    const parentPath = parts.length > 0 ? '/' + parts.join('/') : '.';
    const parent = this.resolvePath(parentPath);

    if (!parent || parent.type !== 'directory') {
      return false;
    }

    const file: FileNode = {
      name: fileName,
      type: 'file',
      permissions: '-rw-r--r--',
      uid: this.currentUser.uid,
      gid: this.currentUser.gid,
      size: 0,
      modified: new Date(),
      parent,
      content: ''
    };

    parent.children!.set(fileName, file);
    return true;
  }

  createNewDirectory(path: string): boolean {
    if (this.resolvePath(path)) {
      return false; // Already exists
    }

    const parts = path.split('/').filter(p => p);
    const dirName = parts.pop()!;
    const parentPath = parts.length > 0 ? '/' + parts.join('/') : '.';
    const parent = this.resolvePath(parentPath);

    if (!parent || parent.type !== 'directory') {
      return false;
    }

    this.createDirectory(dirName, parent);
    return true;
  }

  remove(path: string): boolean {
    const node = this.resolvePath(path);
    if (!node || !node.parent || !node.parent.children) {
      return false;
    }

    // Don't allow removing directories with contents (simplified)
    if (node.type === 'directory' && node.children && node.children.size > 0) {
      return false;
    }

    return node.parent.children.delete(node.name);
  }

  copyFile(srcPath: string, dstPath: string): boolean {
    const srcFile = this.resolvePath(srcPath);
    const dstParts = dstPath.split('/').filter(p => p);
    const dstName = dstParts.pop()!;
    const dstParentPath = dstParts.length > 0 ? '/' + dstParts.join('/') : '.';
    const dstParent = this.resolvePath(dstParentPath);

    if (!srcFile || srcFile.type !== 'file' || !dstParent || dstParent.type !== 'directory') {
      return false;
    }

    if (dstParent.children?.has(dstName)) {
      return false; // Destination already exists
    }

    const newFile: FileNode = {
      name: dstName,
      type: 'file',
      permissions: srcFile.permissions,
      uid: this.currentUser.uid,
      gid: this.currentUser.gid,
      size: srcFile.size,
      modified: new Date(),
      parent: dstParent,
      content: srcFile.content
    };

    dstParent.children!.set(dstName, newFile);
    return true;
  }

  moveFile(srcPath: string, dstPath: string): boolean {
    if (!this.copyFile(srcPath, dstPath)) {
      return false;
    }
    return this.remove(srcPath);
  }

  changePermissions(path: string, mode: string): boolean {
    const node = this.resolvePath(path);
    if (!node) return false;

    // Simple permission parsing (just support octal for now)
    const octalMatch = mode.match(/^([0-7]{3,4})$/);
    if (octalMatch) {
      const octal = parseInt(octalMatch[1], 8);
      const perms = this.octalToPermissionString(octal);
      node.permissions = node.type === 'directory' ? 'd' + perms.substring(1) : perms;
      return true;
    }

    return false;
  }

  private octalToPermissionString(octal: number): string {
    const perms = ['---', '--x', '-w-', '-wx', 'r--', 'r-x', 'rw-', 'rwx'];
    const owner = perms[(octal >> 6) & 7];
    const group = perms[(octal >> 3) & 7];
    const other = perms[octal & 7];
    return `-${owner}${group}${other}`;
  }

  getCurrentUser(): User {
    return this.currentUser;
  }

  getUserByName(name: string): User | undefined {
    return this.users.get(name);
  }

  getGroupByName(name: string): Group | undefined {
    return this.groups.get(name);
  }

  getAbsolutePath(path?: string): string {
    if (!path) return this.getWorkingDirectory();

    const node = this.resolvePath(path);
    return node ? this.getPathString(node) : '';
  }

  // Persistence methods
  saveToLocalStorage(): boolean {
    try {
      const serialized = this.serialize();
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(serialized));
      return true;
    } catch (error) {
      console.warn('Failed to save filesystem to localStorage:', error);
      return false;
    }
  }

  loadFromLocalStorage(): boolean {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (!stored) return false;

      const serialized: SerializedFileSystem = JSON.parse(stored);

      // Basic version check (for future compatibility)
      if (!serialized.version || serialized.version !== '1.0') {
        console.warn('Incompatible saved filesystem version, starting fresh');
        return false;
      }

      // Validate the loaded data
      if (!this.isValidSerializedData(serialized)) {
        console.warn('Invalid saved filesystem data, starting fresh');
        this.clearLocalStorage();
        return false;
      }

      this.deserialize(serialized);
      return true;
    } catch (error) {
      console.warn('Failed to load filesystem from localStorage:', error);
      return false;
    }
  }

  private isValidSerializedData(serialized: SerializedFileSystem): boolean {
    try {
      // Check required properties
      if (!serialized.root || !serialized.users || !serialized.groups) {
        return false;
      }

      // Check that root has basic structure
      if (!serialized.root.children || typeof serialized.root.children !== 'object') {
        return false;
      }

      // Check that required directories exist
      const requiredDirs = ['bin', 'etc', 'home', 'usr', 'var'];
      for (const dir of requiredDirs) {
        if (!serialized.root.children[dir]) {
          return false;
        }
      }

      // Check that current user exists and has valid home directory
      const currentUser = serialized.users[serialized.currentUser];
      if (!currentUser || !currentUser.home) {
        return false;
      }

      // Check that current directory path is valid
      if (!serialized.currentDirectory || !serialized.currentDirectory.startsWith('/')) {
        return false;
      }

      return true;
    } catch (error) {
      console.warn('Error validating saved data:', error);
      return false;
    }
  }

  clearLocalStorage(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (error) {
      console.warn('Failed to clear localStorage:', error);
    }
  }

  private serialize(): SerializedFileSystem {
    return {
      root: this.serializeNode(this.root),
      currentDirectory: this.getPathString(this.currentDirectory),
      currentUser: this.currentUser.name,
      users: Object.fromEntries(this.users),
      groups: Object.fromEntries(this.groups),
      version: '1.0'
    };
  }

  private serializeNode(node: FileNode): SerializedFileNode {
    const serialized: SerializedFileNode = {
      name: node.name,
      type: node.type,
      permissions: node.permissions,
      uid: node.uid,
      gid: node.gid,
      size: node.size,
      modified: node.modified.toISOString()
    };

    if (node.type === 'directory' && node.children) {
      serialized.children = {};
      for (const [name, child] of node.children) {
        serialized.children[name] = this.serializeNode(child);
      }
    } else if (node.type === 'file') {
      serialized.content = node.content;
    }

    if (node.link) {
      serialized.link = node.link;
    }

    return serialized;
  }

  private deserialize(serialized: SerializedFileSystem): void {
    // Restore users and groups
    this.users = new Map(Object.entries(serialized.users));
    this.groups = new Map(Object.entries(serialized.groups));

    // Restore current user
    this.currentUser = this.users.get(serialized.currentUser) || this.users.get('user')!;

    // Restore filesystem
    this.root = this.deserializeNode(serialized.root);

    // Restore current directory - validate it exists
    const targetDir = this.resolvePath(serialized.currentDirectory);
    if (targetDir && targetDir.type === 'directory') {
      this.currentDirectory = targetDir;
    } else {
      // Fallback to user's home directory, or root if that fails
      const homeDir = this.resolvePath(this.currentUser.home);
      this.currentDirectory = (homeDir && homeDir.type === 'directory') ? homeDir : this.root;
    }
  }

  private deserializeNode(serialized: SerializedFileNode): FileNode {
    const node: FileNode = {
      name: serialized.name,
      type: serialized.type,
      permissions: serialized.permissions,
      uid: serialized.uid,
      gid: serialized.gid,
      size: serialized.size,
      modified: new Date(serialized.modified)
    };

    if (serialized.type === 'directory' && serialized.children) {
      node.children = new Map();
      for (const [name, child] of Object.entries(serialized.children)) {
        const childNode = this.deserializeNode(child);
        childNode.parent = node;
        node.children.set(name, childNode);
      }
    } else if (serialized.type === 'file') {
      node.content = serialized.content;
    }

    if (serialized.link) {
      node.link = serialized.link;
    }

    return node;
  }
}