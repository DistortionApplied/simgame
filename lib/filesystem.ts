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
  extension?: string; // file extension (e.g., 'txt', 'bin', 'exe')
}

export interface User {
  uid: number;
  name: string;
  gid: number;
  home: string;
  shell: string;
  password?: string; // hashed password
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

interface GameSetup {
  playerName: string;
  computerName: string;
  rootPassword: string;
  userPassword: string;
  createdAt: string;
}

import { manPages } from './manPages';

type FileSystemResult = { success: boolean; error?: string };

export class FakeFileSystem {
  private root!: FileNode; // Using definite assignment assertion
  private currentDirectory!: FileNode;
  private currentUser!: User;
  private users: Map<string, User>;
  private groups: Map<string, Group>;
  private STORAGE_KEY!: string;

  private setupData: GameSetup | null = null;

  constructor(setupData?: GameSetup | null) {
    this.setupData = setupData || null;
    this.users = new Map();
    this.groups = new Map();
    this.STORAGE_KEY = `linux-sim-filesystem-${this.setupData?.playerName || 'user'}`;

    // Try to load from localStorage first
    if (!this.loadFromLocalStorage()) {
      // If no saved state or loading failed, create fresh filesystem
      this.createUsersAndGroups();
      this.ensureEssentialUsersAndGroups();
      const userName = this.setupData?.playerName?.toLowerCase().replace(/\s+/g, '') || 'user';
      this.currentUser = this.users.get(userName) || this.users.get('user')!;
      this.root = this.createInitialFileSystem();
      this.currentDirectory = this.root;
    }

    // Ensure properties are initialized (TypeScript requirement)
    if (!this.root) {
      this.createUsersAndGroups();
      this.ensureEssentialUsersAndGroups();
      const userName = this.setupData?.playerName?.toLowerCase().replace(/\s+/g, '') || 'user';
      this.currentUser = this.users.get(userName) || this.users.get('user')!;
      this.root = this.createInitialFileSystem();
      this.currentDirectory = this.root;
    }

    // Ensure man pages exist (in case they weren't created during load)
    this.ensureManPagesExist();

    // Ensure binary files exist
    this.ensureBinariesExist();
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

    // Create basic directory structure (system directories owned by root)
    this.createDirectoryAsRoot('bin', root);
    // Make /bin writable for package installations (game simplification)
    const binDir = root.children!.get('bin')!;
    binDir.permissions = 'drwxrwxrwx'; // 777 permissions for /bin in game
    this.createDirectoryAsRoot('boot', root);
    this.createDirectoryAsRoot('dev', root);
    this.createDirectoryAsRoot('etc', root);
    this.createDirectoryAsRoot('home', root);
    this.createDirectoryAsRoot('lib', root);
    this.createDirectoryAsRoot('media', root);
    this.createDirectoryAsRoot('mnt', root);
    this.createDirectoryAsRoot('opt', root);
    this.createDirectoryAsRoot('proc', root);
    this.createDirectoryAsRoot('root', root);
    this.createDirectoryAsRoot('run', root);
    this.createDirectoryAsRoot('sbin', root);
    this.createDirectoryAsRoot('srv', root);
    this.createDirectoryAsRoot('sys', root);
    // /tmp should be world-writable
    const tmpDir = this.createDirectoryAsRoot('tmp', root);
    tmpDir.permissions = 'drwxrwxrwx'; // 777 permissions for /tmp
    this.createDirectoryAsRoot('usr', root);
    this.createDirectoryAsRoot('var', root);

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
    const userName = this.setupData?.playerName?.toLowerCase().replace(/\s+/g, '') || 'user';
    const userHome = this.createDirectory(userName, home);

    // Create man pages directory structure
    const usrDir = root.children!.get('usr')!;
    const share = this.createDirectory('share', usrDir);
    const man = this.createDirectory('man', share);
    this.createDirectory('man1', man);

    // Populate directories with realistic files
    this.populateSystemFiles();

    // Manual pages are created by ensureManPagesExist

    return root;
  }

  private createUsersAndGroups(): void {
    // Create root user
    this.users.set('root', {
      uid: 0,
      name: 'root',
      gid: 0,
      home: '/root',
      shell: '/bin/bash',
      password: this.setupData?.rootPassword || 'root'
    });

    // Create regular user based on setup data
    const userName = this.setupData?.playerName?.toLowerCase().replace(/\s+/g, '') || 'user';
    const userHome = `/home/${userName}`;

    this.users.set(userName, {
      uid: 1000,
      name: userName,
      gid: 1000,
      home: userHome,
      shell: '/bin/bash',
      password: this.setupData?.userPassword || 'user' // Password from setup or default
    });

    // Create groups
    this.groups.set('root', {
      gid: 0,
      name: 'root',
      members: ['root']
    });

    this.groups.set(userName, {
      gid: 1000,
      name: userName,
      members: [userName]
    });
  }

  private ensureEssentialUsersAndGroups(): void {
    // Ensure root user exists
    if (!this.users.has('root')) {
      this.users.set('root', {
        uid: 0,
        name: 'root',
        gid: 0,
        home: '/root',
        shell: '/bin/bash',
        password: this.setupData?.rootPassword || 'root'
      });
    }

    // Ensure root group exists
    if (!Array.from(this.groups.values()).some(g => g.gid === 0)) {
      this.groups.set('root', {
        gid: 0,
        name: 'root',
        members: ['root']
      });
    }

    // Ensure current user exists (based on setup data)
    const userName = this.setupData?.playerName?.toLowerCase().replace(/\s+/g, '') || 'user';
    if (!this.users.has(userName)) {
      const userHome = `/home/${userName}`;
      this.users.set(userName, {
        uid: 1000,
        name: userName,
        gid: 1000,
        home: userHome,
        shell: '/bin/bash',
        password: this.setupData?.userPassword || 'user'
      });
    }

    // Ensure current user's group exists
    if (!Array.from(this.groups.values()).some(g => g.gid === 1000)) {
      this.groups.set(userName, {
        gid: 1000,
        name: userName,
        members: [userName]
      });
    }

    // Ensure currentUser is set correctly
    if (!this.currentUser || !this.users.has(this.currentUser.name)) {
      this.currentUser = this.users.get(userName) || this.users.get('user')!;
    }
  }

  private populateSystemFiles(): void {
    const userName = this.setupData?.playerName?.toLowerCase().replace(/\s+/g, '') || 'user';

    // /etc files (system config files, no extensions)
    this.createFile('/etc/passwd',
      `root:${this.setupData?.rootPassword || 'root'}:0:0:root:/root:/bin/bash\n` +
      `${userName}:${this.setupData?.userPassword || 'user'}:1000:1000:${userName}:/home/${userName}:/bin/bash\n` +
      'daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin\n' +
      'bin:x:2:2:bin:/bin:/usr/sbin/nologin\n'
    );
    let passwdNode = this.getNode('/etc/passwd');
    if (passwdNode) {
      passwdNode.permissions = '600';
      passwdNode.uid = 0;
      passwdNode.gid = 0;
    }

    this.createFile('/etc/group',
      'root:x:0:\n' +
      `${userName}:x:1000:\n` +
      'daemon:x:1:\n' +
      'bin:x:2:\n'
    );
    let groupNode = this.getNode('/etc/group');
    if (groupNode) {
      groupNode.permissions = '600';
      groupNode.uid = 0;
      groupNode.gid = 0;
    }

    // /etc/sudoers - sudo configuration
    this.createFile('/etc/sudoers',
      '# sudoers file\n' +
      '# This file controls who can run what commands as what users\n' +
      '#\n' +
      '# User privilege specification\n' +
      'root    ALL=(ALL:ALL) ALL\n' +
      userName + '    ALL=(ALL:ALL) ALL\n' +
      '#\n' +
      '# Allow members of group sudo to execute any command\n' +
      '# %sudo   ALL=(ALL:ALL) ALL\n'
    );
    let sudoersNode = this.getNode('/etc/sudoers');
    if (sudoersNode) {
      sudoersNode.permissions = '600';
      sudoersNode.uid = 0;
      sudoersNode.gid = 0;
    }

    this.createFile('/etc/hostname', 'linux-sim');
    let hostnameNode = this.getNode('/etc/hostname');
    if (hostnameNode) {
      hostnameNode.permissions = '600';
      hostnameNode.uid = 0;
      hostnameNode.gid = 0;
    }

    this.createFile('/etc/hosts', '127.0.0.1\tlocalhost\n::1\tlocalhost\n');
    let hostsNode = this.getNode('/etc/hosts');
    if (hostsNode) {
      hostsNode.permissions = '600';
      hostsNode.uid = 0;
      hostsNode.gid = 0;
    }

    this.createFile('/etc/os-release',
      'NAME="Linux Sim"\n' +
      'VERSION="1.0"\n' +
      'ID=linux-sim\n' +
      'PRETTY_NAME="Linux Sim 1.0"\n'
    );
    let osReleaseNode = this.getNode('/etc/os-release');
    if (osReleaseNode) {
      osReleaseNode.permissions = '600';
      osReleaseNode.uid = 0;
      osReleaseNode.gid = 0;
    }

    // Set /etc directory permissions to restrict access
    let etcNode = this.getNode('/etc');
    if (etcNode) {
      etcNode.permissions = '700';
      etcNode.uid = 0;
      etcNode.gid = 0;
    }

    // /home/user files
    this.createFile(`/home/${userName}/.bashrc`,
      '# ~/.bashrc: executed by bash(1) for non-login shells.\n' +
      'export PS1="\\u@\\h:\\w\\$ "\n' +
      'export PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin\n' +
      'alias ll="ls -alF"\n' +
      'alias la="ls -A"\n' +
      'alias l="ls -CF"\n'
    );

    this.createFile(`/home/${userName}/.profile`,
      '# ~/.profile: executed by the command interpreter for login shells.\n' +
      'if [ -n "$BASH_VERSION" ]; then\n' +
      '    if [ -f "$HOME/.bashrc" ]; then\n' +
      '        . "$HOME/.bashrc"\n' +
      '    fi\n' +
      'fi\n'
    );

    // /home/user files
    this.createFile(`/home/${userName}/README.txt`,
      `Welcome to Linux Sim Game, ${this.setupData?.playerName || 'Player'}!\n\n` +
      `You are now connected to ${this.setupData?.computerName || 'linux-sim'} in a fully simulated Linux environment.\n` +
      'Explore, create, and manage files just like on a real system!\n\n' +
      'Key Features:\n' +
      '  • Realistic directory structure (/usr, /var, /etc, /home, etc.)\n' +
      '  • Proper file permissions and user management\n' +
      '  • Absolute and relative path navigation\n' +
      '  • Advanced command options and flags\n' +
      '  • Manual pages for all commands (man <command>)\n' +
      '  • Persistent filesystem state\n' +
      '  • Tab completion for commands and file paths\n' +
      '  • File extensions (.bin, .txt, .log, etc.)\n' +
      '  • Realistic consequences - delete /bin/ls.bin and ls stops working!\n\n' +
      'Available Commands:\n' +
      '  help                     - Show this help\n' +
      '  man <cmd>                - Display manual page for command\n' +
      '  ls [opts] [dir]          - List directory contents (-l long format, -a show hidden)\n' +
      '  cd <dir>                 - Change directory (~ for home)\n' +
      '  pwd                      - Print working directory\n' +
      '  mkdir <dir>              - Create directory\n' +
      '  rmdir <dir>              - Remove empty directory\n' +
      '  touch <file>             - Create empty file\n' +
      '  rm <file>                - Remove file\n' +
      '  cat <file>               - Display file contents\n' +
      '  apt <cmd>                - Package management (install, remove, search)\n' +
      '  sudo <cmd>               - Execute command as root\n' +
      '  su [user]                - Switch to another user account\n' +
      '  cp <src> <dst>           - Copy file\n' +
      '  mv <src> <dst>           - Move/rename file\n' +
      '  chmod <mode> <file>      - Change permissions (octal)\n' +
      '  whoami                   - Show current user\n' +
      '  id                       - Show user/group IDs\n' +
      '  echo <text>              - Display text\n' +
      '  grep <pat> <file>        - Search for pattern in file\n' +
      '  find <path> -name <pat>  - Find files by name\n' +
      '  save                     - Manually save filesystem state\n' +
      '  reset                    - Reset filesystem to initial state\n' +
      '  debug                    - Show filesystem debug info\n' +
      '  clear                    - Clear terminal\n\n' +
      'Persistence:\n' +
      '  Your filesystem state is automatically saved after each command.\n' +
      '  Use "save" to manually save, "reset" to start fresh.\n\n' +
      'Package Management:\n' +
      '  Install additional software with apt: apt install <package>\n' +
      '  Available packages: nano (text editor), browser (web browser), nmap (network scanner), snake (game), geemail (email client)\n' +
      '  Examples: apt install nano (then use nano <file> to edit)\n' +
      '            apt install browser (then use browser <domain> to browse)\n' +
      '  Remove with: apt remove <package>\n\n' +
      'Learning Linux:\n' +
      '  Use "man <command>" to read detailed documentation for any command.\n' +
      '  Example: man ls, man cd, man chmod, man apt\n\n' +
      '⚠️  Realistic Consequences:\n' +
      '  This is a REALISTIC Linux simulation! If you delete system files,\n' +
      '  things will break. For example:\n' +
      '    rm /bin/ls.bin    → ls command stops working\n' +
      '    rm /bin/cat.bin   → cat command stops working\n' +
      '    rm README.txt     → Your guide is gone forever\n' +
      '  Use "reset" to start fresh if you break things too badly!\n\n' +
      'Your Setup:\n' +
      `  Computer: ${this.setupData?.computerName || 'linux-sim'}\n` +
      `  User: ${userName}\n\n` +
      'Getting Started:\n' +
      '  Try these commands:\n' +
      '    man ls\n' +
      '    ls -la\n' +
      '    cd /etc\n' +
      '    cat passwd\n' +
      '    cd ~\n' +
      '    help\n\n' +
      '  Pro Tips:\n' +
      '    • Press Tab for auto-completion of commands and paths\n' +
      '    • Use arrow keys to navigate command history\n' +
      '    • Be careful deleting system files - things will break!\n\n' +
      'Enjoy exploring your Linux simulation!\n'
    );

    // /var/log files
    this.createFile('/var/log/syslog.log',
      '[INFO] System started at ' + new Date().toISOString() + '\n' +
      '[INFO] File system initialized\n' +
      '[INFO] User session started\n'
    );

    // Create some basic binaries (just placeholder files)
    const binaries = ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'rmdir', 'touch', 'rm', 'cp', 'mv', 'chmod', 'whoami', 'id', 'echo', 'grep', 'find', 'man', 'help', 'save', 'reset', 'clear', 'reboot'];
    binaries.forEach(bin => {
      this.createFile(`/bin/${bin}.bin`, '#!/bin/bash\n# ${bin} command\n');
    });

    // /boot files (kernel and boot loader files)
    // Kernel images
    this.createFile('/boot/vmlinuz-5.15.0-91-generic', '[Linux kernel image - compressed]');
    this.createFile('/boot/vmlinuz-5.15.0-89-generic', '[Linux kernel image - compressed]');

    // Initial RAM disk images
    this.createFile('/boot/initrd.img-5.15.0-91-generic', '[Initial RAM disk image]');
    this.createFile('/boot/initrd.img-5.15.0-89-generic', '[Initial RAM disk image]');
    this.createFile('/boot/initramfs-5.15.0-91-generic.img', '[Initial RAM filesystem image]');
    this.createFile('/boot/initramfs-5.15.0-89-generic.img', '[Initial RAM filesystem image]');

    // Kernel symbol tables
    this.createFile('/boot/System.map-5.15.0-91-generic', '[Kernel symbol table]');
    this.createFile('/boot/System.map-5.15.0-89-generic', '[Kernel symbol table]');

    // Kernel configuration files
    this.createFile('/boot/config-5.15.0-91-generic', '# Linux kernel configuration\nCONFIG_DEFAULT_HOSTNAME="linux-sim"\nCONFIG_LOCALVERSION="-generic"');
    this.createFile('/boot/config-5.15.0-89-generic', '# Linux kernel configuration\nCONFIG_DEFAULT_HOSTNAME="linux-sim"\nCONFIG_LOCALVERSION="-generic"');

    // GRUB boot loader directory and files
    const grubDir = this.createDirectory('grub', this.root.children!.get('boot')!);

    // GRUB configuration
    this.createFile('/boot/grub/grub.cfg',
      '# GRUB boot loader configuration\n' +
      'set default=0\n' +
      'set timeout=5\n' +
      '\n' +
      'menuentry "Ubuntu" {\n' +
      '    set root=(hd0,1)\n' +
      '    linux /boot/vmlinuz-5.15.0-91-generic root=/dev/sda1 ro quiet splash\n' +
      '    initrd /boot/initrd.img-5.15.0-91-generic\n' +
      '}\n' +
      '\n' +
      'menuentry "Ubuntu (recovery mode)" {\n' +
      '    set root=(hd0,1)\n' +
      '    linux /boot/vmlinuz-5.15.0-91-generic root=/dev/sda1 ro recovery nomodeset\n' +
      '    initrd /boot/initrd.img-5.15.0-91-generic\n' +
      '}\n' +
      '\n' +
      'menuentry "Previous Linux versions" {\n' +
      '    set root=(hd0,1)\n' +
      '    linux /boot/vmlinuz-5.15.0-89-generic root=/dev/sda1 ro quiet splash\n' +
      '    initrd /boot/initrd.img-5.15.0-89-generic\n' +
      '}'
    );

    // GRUB environment block
    this.createFile('/boot/grub/grubenv', '# GRUB environment block\nsaved_entry=Ubuntu\n');

    // EFI boot files (for systems with EFI)
    const efiDir = this.createDirectory('EFI', this.root.children!.get('boot')!);
    const ubuntuDir = this.createDirectory('ubuntu', efiDir);
    this.createFile('/boot/EFI/ubuntu/grubx64.efi', '[EFI GRUB bootloader]');
    this.createFile('/boot/EFI/ubuntu/shimx64.efi', '[EFI shim bootloader]');

    // Boot partition files
    this.createFile('/boot/.vmlinuz.hmac', '[Kernel HMAC signature]');
  }

  

  private ensureManPagesExist(): void {
    // Ensure man pages directory structure exists
    if (!this.root.children!.has('usr')) {
      this.createDirectory('usr', this.root);
    }
    const usrDir = this.root.children!.get('usr')!;

    if (!usrDir.children!.has('share')) {
      this.createDirectory('share', usrDir);
    }
    const share = usrDir.children!.get('share')!;

    if (!share.children!.has('man')) {
      this.createDirectory('man', share);
    }
    const man = share.children!.get('man')!;

    if (!man.children!.has('man1')) {
      this.createDirectory('man1', man);
    }

    const man1Dir = man.children!.get('man1')!;

    // Check for missing man pages and create them individually
    const requiredManPages = [
      'ls', 'cd', 'pwd', 'mkdir', 'rmdir', 'touch', 'rm', 'cat', 'nano', 'apt', 'sudo', 'su',
      'cp', 'mv', 'chmod', 'whoami', 'id', 'echo', 'grep', 'find',
      'man', 'help', 'save', 'reset', 'debug', 'clear', 'reboot', 'adduser', 'userdel', 'passwd', 'ping', 'nmap', 'ifconfig', 'browser'
    ];

    for (const cmd of requiredManPages) {
      this.createIndividualManPage(cmd);
    }
  }

  private createIndividualManPage(command: string): void {
    const manPageContent = manPages[command];
    if (manPageContent) {
      this.createFile(`/usr/share/man/man1/${command}.1`, manPageContent);
    } else {
      // For commands without detailed man pages, create a simple one
      this.createFile(`/usr/share/man/man1/${command}.1`, `${command.toUpperCase()}(1)                   Linux Sim Commands                ${command.toUpperCase()}(1)

NAME
        ${command} - ${command} command

SYNOPSIS
        ${command} [OPTIONS]...

DESCRIPTION
        This is the ${command} command for the Linux Sim game.

SEE ALSO
        help(1), man(1)
`);
    }
  }

  private ensureBinariesExist(): void {
    // Ensure /bin directory exists
    if (!this.root.children!.has('bin')) {
      this.createDirectory('bin', this.root);
    }

    const binDir = this.root.children!.get('bin')!;

    // Check for missing binary files and create them
    const requiredBinaries = [
      'ls', 'cd', 'pwd', 'cat', 'mkdir', 'rmdir', 'touch', 'rm', 'cp', 'mv', 'chmod', 'whoami', 'id', 'echo', 'grep', 'find', 'man', 'help', 'apt', 'save', 'reset', 'clear', 'reboot'
    ];

    for (const bin of requiredBinaries) {
      if (!binDir.children!.has(`${bin}.bin`)) {
        this.createFile(`/bin/${bin}.bin`, '#!/bin/bash\n# ${bin} command\n');
      }
    }
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

  private createDirectoryAsRoot(name: string, parent: FileNode): FileNode {
    const dir: FileNode = {
      name,
      type: 'directory',
      permissions: 'drwxr-xr-x',
      uid: 0, // root
      gid: 0, // root
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

    // Determine file extension
    const extension = fileName.includes('.') ? fileName.split('.').pop() : undefined;

    const file: FileNode = {
      name: fileName,
      type: 'file',
      permissions: '-rw-r--r--',
      uid: this.currentUser.uid,
      gid: this.currentUser.gid,
      size: content.length,
      modified: new Date(),
      parent: current,
      content,
      extension
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

  changeDirectory(path: string): FileSystemResult {
    const target = this.resolvePath(path);
    if (!target) {
      return { success: false, error: 'No such file or directory' };
    }
    if (target.type !== 'directory') {
      return { success: false, error: 'Not a directory' };
    }
    // Check execute permission on target directory
    if (!this.isRoot() && !this.checkPermission(target, 'execute')) {
      return { success: false, error: 'Permission denied' };
    }
    this.currentDirectory = target;
    return { success: true };
  }

  listDirectory(path?: string, showHidden: boolean = false): FileNode[] {
    const dir = path ? this.resolvePath(path) : this.currentDirectory;
    if (!dir || dir.type !== 'directory' || !dir.children) return [];

    // Check execute permission on directory (needed to list contents)
    if (!this.isRoot() && !this.checkPermission(dir, 'execute')) {
      return []; // Permission denied - return empty array
    }

    const files = Array.from(dir.children.values());
    if (!showHidden) {
      return files.filter(file => !file.name.startsWith('.'));
    }
    return files;
  }

  readFile(path: string): string | null {
    const file = this.resolvePath(path);
    if (!file) return null;

    if (file.type === 'directory') {
      // Check if we can read directory (execute permission)
      if (!this.isRoot() && !this.checkPermission(file, 'execute')) {
        return null; // Permission denied
      }
      return '[directory contents]'; // Placeholder for directory reading
    }

    if (file.type === 'file') {
      if (!this.isRoot() && !this.checkPermission(file, 'read')) {
        return null; // Permission denied
      }
      return file.content || '';
    }

    return null;
  }

  writeFile(path: string, content: string): FileSystemResult {
    const file = this.resolvePath(path);
    if (!file || file.type !== 'file') {
      // Try to create the file if it doesn't exist
      const result = this.createNewFile(path);
      if (!result.success) return result;
      // Retry
      return this.writeFile(path, content);
    }

    // Check write permission on the file
    if (!this.isRoot() && !this.checkPermission(file, 'write')) {
      return { success: false, error: 'Permission denied' };
    }

    file.content = content;
    file.size = content.length;
    file.modified = new Date();
    return { success: true };
  }

  createNewFile(path: string): FileSystemResult {
    if (this.resolvePath(path)) {
      return { success: false, error: 'File exists' };
    }

    const parts = path.split('/').filter(p => p);
    const fileName = parts.pop()!;
    const parentPath = parts.length > 0 ? '/' + parts.join('/') : '.';
    const parent = this.resolvePath(parentPath);

    if (!parent) {
      return { success: false, error: 'No such file or directory' };
    }
    if (parent.type !== 'directory') {
      return { success: false, error: 'Not a directory' };
    }

    // Check write permission on parent directory
    if (!this.isRoot() && !this.checkPermission(parent, 'write')) {
      return { success: false, error: 'Permission denied' };
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
    return { success: true };
  }

  createNewDirectory(path: string): FileSystemResult {
    if (this.resolvePath(path)) {
      return { success: false, error: 'File exists' };
    }

    const parts = path.split('/').filter(p => p);
    const dirName = parts.pop()!;
    const parentPath = parts.length > 0 ? '/' + parts.join('/') : '.';
    const parent = this.resolvePath(parentPath);

    if (!parent) {
      return { success: false, error: 'No such file or directory' };
    }
    if (parent.type !== 'directory') {
      return { success: false, error: 'Not a directory' };
    }

    // Check write permission on parent directory
    if (!this.isRoot() && !this.checkPermission(parent, 'write')) {
      return { success: false, error: 'Permission denied' };
    }

    this.createDirectory(dirName, parent);
    return { success: true };
  }

  remove(path: string): FileSystemResult {
    const node = this.resolvePath(path);
    if (!node) {
      return { success: false, error: 'No such file or directory' };
    }
    if (!node.parent || !node.parent.children) {
      return { success: false, error: 'No such file or directory' };
    }

    // Check write permission on parent directory
    if (!this.isRoot() && !this.checkPermission(node.parent, 'write')) {
      return { success: false, error: 'Permission denied' };
    }

    // Check write permission on file itself (for sticky bit etc., but simplified)
    if (node.type === 'file' && !this.isRoot() && !this.checkPermission(node, 'write')) {
      return { success: false, error: 'Permission denied' };
    }

    // Don't allow removing directories with contents (simplified)
    if (node.type === 'directory' && node.children && node.children.size > 0) {
      return { success: false, error: 'Directory not empty' };
    }

    node.parent.children.delete(node.name);
    return { success: true };
  }

  removeDirectory(path: string): boolean {
    const node = this.resolvePath(path);
    if (!node || node.type !== 'directory' || !node.parent || !node.parent.children) {
      return false;
    }

    // Check if directory is empty (only . and .. if present)
    if (node.children && node.children.size > 0) {
      return false; // Directory not empty
    }

    return node.parent.children.delete(node.name);
  }

  copyFile(srcPath: string, dstPath: string): FileSystemResult {
    const srcFile = this.resolvePath(srcPath);
    if (!srcFile) {
      return { success: false, error: 'No such file or directory' };
    }
    if (srcFile.type !== 'file') {
      return { success: false, error: 'Not a regular file' };
    }

    const dstParts = dstPath.split('/').filter(p => p);
    const dstName = dstParts.pop()!;
    const dstParentPath = dstParts.length > 0 ? '/' + dstParts.join('/') : '.';
    const dstParent = this.resolvePath(dstParentPath);

    if (!dstParent) {
      return { success: false, error: 'No such file or directory' };
    }
    if (dstParent.type !== 'directory') {
      return { success: false, error: 'Not a directory' };
    }

    if (dstParent.children?.has(dstName)) {
      return { success: false, error: 'File exists' };
    }

    // Check write permission on destination directory
    if (!this.isRoot() && !this.checkPermission(dstParent, 'write')) {
      return { success: false, error: 'Permission denied' };
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
    return { success: true };
  }

  moveFile(srcPath: string, dstPath: string): FileSystemResult {
    const copyResult = this.copyFile(srcPath, dstPath);
    if (!copyResult.success) {
      return copyResult;
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

  getUserById(uid: number): User | undefined {
    for (const user of this.users.values()) {
      if (user.uid === uid) return user;
    }
    return undefined;
  }

  getGroupByName(name: string): Group | undefined {
    return this.groups.get(name);
  }

  getGroupById(gid: number): Group | undefined {
    for (const group of this.groups.values()) {
      if (group.gid === gid) return group;
    }
    return undefined;
  }

  getUsers(): Map<string, User> {
    return this.users;
  }

  getGroups(): Map<string, Group> {
    return this.groups;
  }

  getAbsolutePath(path?: string): string {
    if (!path) return this.getWorkingDirectory();

    const node = this.resolvePath(path);
    return node ? this.getPathString(node) : '';
  }

  // Permission checking methods
  private parsePermissions(permString: string): { owner: number, group: number, other: number } {
    // Parse permissions like 'rw-r--r--' or 'drwxr-xr-x'
    const perms = permString.replace(/^[d-]/, ''); // Remove directory/file indicator
    const owner = this.rwxToNumber(perms.substring(0, 3));
    const group = this.rwxToNumber(perms.substring(3, 6));
    const other = this.rwxToNumber(perms.substring(6, 9));
    return { owner, group, other };
  }

  private rwxToNumber(rwx: string): number {
    let num = 0;
    if (rwx.includes('r')) num += 4;
    if (rwx.includes('w')) num += 2;
    if (rwx.includes('x')) num += 1;
    return num;
  }

  private checkPermission(file: FileNode, operation: 'read' | 'write' | 'execute'): boolean {
    // Root can do anything
    if (this.isRoot()) {
      return true;
    }

    const perms = this.parsePermissions(file.permissions);
    const user = this.currentUser;

    // Owner permissions
    if (user.uid === file.uid) {
      return this.hasPermission(perms.owner, operation);
    }

    // Group permissions
    if (user.gid === file.gid) {
      return this.hasPermission(perms.group, operation);
    }

    // Other permissions
    return this.hasPermission(perms.other, operation);
  }

  private hasPermission(permValue: number, operation: 'read' | 'write' | 'execute'): boolean {
    switch (operation) {
      case 'read':
        return (permValue & 4) !== 0;
      case 'write':
        return (permValue & 2) !== 0;
      case 'execute':
        return (permValue & 1) !== 0;
      default:
        return false;
    }
  }

  private isRoot(): boolean {
    return this.currentUser.uid === 0;
  }

  // Authentication methods
  authenticateUser(username: string, password: string): User | null {
    const user = this.users.get(username);
    if (!user) return null;

    // Allow login for users without passwords (freshly created users)
    if (!user.password) {
      return user;
    }

    // For simplicity, we'll do plain text comparison (in a real system this would be hashed)
    if (user.password === password) {
      return user;
    }
    return null;
  }


  switchUser(user: User): void {
    this.currentUser = user;
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
      // Ensure essential users and groups exist (in case they weren't saved)
      this.ensureEssentialUsersAndGroups();
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
