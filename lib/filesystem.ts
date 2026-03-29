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
  createdAt: string;
}

export class FakeFileSystem {
  private root!: FileNode; // Using definite assignment assertion
  private currentDirectory!: FileNode;
  private currentUser!: User;
  private users: Map<string, User>;
  private groups: Map<string, Group>;
  private readonly STORAGE_KEY = 'linux-sim-filesystem';
  private setupData: GameSetup | null = null;

  constructor(setupData?: GameSetup | null) {
    this.setupData = setupData || null;
    this.users = new Map();
    this.groups = new Map();

    // Try to load from localStorage first
    if (!this.loadFromLocalStorage()) {
      // If no saved state or loading failed, create fresh filesystem

      // Create a temporary currentUser for filesystem creation
      const tempUserName = this.setupData?.playerName?.toLowerCase().replace(/\s+/g, '') || 'user';
      this.currentUser = {
        uid: 1000,
        name: tempUserName,
        gid: 1000,
        home: `/home/${tempUserName}`,
        shell: '/bin/bash'
      };

      this.root = this.createInitialFileSystem();
      this.createUsersAndGroups();
      this.currentUser = this.users.get(tempUserName)!;
      this.currentDirectory = this.root;
    }

    // Ensure properties are initialized (TypeScript requirement)
    if (!this.root) {
      // Create a temporary currentUser for filesystem creation
      const tempUserName = this.setupData?.playerName?.toLowerCase().replace(/\s+/g, '') || 'user';
      this.currentUser = {
        uid: 1000,
        name: tempUserName,
        gid: 1000,
        home: `/home/${tempUserName}`,
        shell: '/bin/bash'
      };

      this.root = this.createInitialFileSystem();
      this.createUsersAndGroups();
      this.currentUser = this.users.get(tempUserName)!;
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
    const userName = this.setupData?.playerName?.toLowerCase().replace(/\s+/g, '') || 'user';
    const userHome = this.createDirectory(userName, home);

    // Create man pages directory structure
    const usrDir = root.children!.get('usr')!;
    const share = this.createDirectory('share', usrDir);
    const man = this.createDirectory('man', share);
    this.createDirectory('man1', man);

    // Populate directories with realistic files
    this.populateSystemFiles();

    // Create manual pages
    this.createManPages();

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

    // Create regular user based on setup data
    const userName = this.setupData?.playerName?.toLowerCase().replace(/\s+/g, '') || 'user';
    const userHome = `/home/${userName}`;

    this.users.set(userName, {
      uid: 1000,
      name: userName,
      gid: 1000,
      home: userHome,
      shell: '/bin/bash'
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

  private populateSystemFiles(): void {
    const userName = this.setupData?.playerName?.toLowerCase().replace(/\s+/g, '') || 'user';

    // /etc files (system config files, no extensions)
    this.createFile('/etc/passwd',
      'root:x:0:0:root:/root:/bin/bash\n' +
      `${userName}:x:1000:1000:${userName}:/home/${userName}:/bin/bash\n` +
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
    const computerName = this.setupData?.computerName || 'linux-sim';

    this.createFile(`/home/${userName}/README.txt`,
      `Welcome to Linux Sim Game, ${this.setupData?.playerName || 'Player'}!\n\n` +
      `You are now connected to ${computerName} in a fully simulated Linux environment.\n` +
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
      'Learning Linux:\n' +
      '  Use "man <command>" to read detailed documentation for any command.\n' +
      '  Example: man ls, man cd, man chmod\n\n' +
      '⚠️  Realistic Consequences:\n' +
      '  This is a REALISTIC Linux simulation! If you delete system files,\n' +
      '  things will break. For example:\n' +
      '    rm /bin/ls.bin    → ls command stops working\n' +
      '    rm /bin/cat.bin   → cat command stops working\n' +
      '    rm README.txt     → Your guide is gone forever\n' +
      '  Use "reset" to start fresh if you break things too badly!\n\n' +
      'Your Setup:\n' +
      `  Computer: ${computerName}\n` +
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
    const binaries = ['ls', 'cd', 'pwd', 'cat', 'mkdir', 'rmdir', 'touch', 'rm', 'cp', 'mv', 'chmod', 'whoami', 'id', 'echo', 'grep', 'find', 'man', 'help', 'save', 'reset', 'clear'];
    binaries.forEach(bin => {
      this.createFile(`/bin/${bin}.bin`, '#!/bin/bash\n# ${bin} command\n');
    });
  }

  private createManPages(): void {
    // ls(1) - list directory contents
    this.createFile('/usr/share/man/man1/ls.1', `LS(1)                        User Commands                       LS(1)

NAME
       ls - list directory contents

SYNOPSIS
       ls [OPTION]... [FILE]...

DESCRIPTION
       List information about the FILEs (the current directory by default).
       Sort entries alphabetically if none of -cftuvSUX nor --sort is specified.

       Mandatory arguments to long options are mandatory for short options too.

OPTIONS
       -a, --all
              do not ignore entries starting with .

       -l     use a long listing format

EXAMPLES
       ls
              List the contents of the current directory.

       ls -l
              List the contents of the current directory in long format.

       ls -a
              List all files, including hidden ones.

SEE ALSO
       dir(1), vdir(1)
`);

    // cd(1) - change directory
    this.createFile('/usr/share/man/man1/cd.1', `CD(1)                        User Commands                       CD(1)

NAME
       cd - change the working directory

SYNOPSIS
       cd [DIRECTORY]

DESCRIPTION
       Change the current directory to DIRECTORY. The default DIRECTORY is the
       value of the HOME shell variable.

       CD can also be entered as CHDIR. If DIRECTORY begins with a slash, it
       is interpreted as an absolute path. Otherwise, it is interpreted as a
       relative path to the current directory.

EXAMPLES
       cd
              Change to the user's home directory.

       cd /tmp
              Change to the /tmp directory.

       cd ..
              Change to the parent directory.

SEE ALSO
       pwd(1), bash(1)
`);

    // pwd(1) - print working directory
    this.createFile('/usr/share/man/man1/pwd.1', `PWD(1)                       User Commands                      PWD(1)

NAME
       pwd - print name of current/working directory

SYNOPSIS
       pwd [OPTION]...

DESCRIPTION
       Print the full filename of the current working directory.

OPTIONS
       -L, --logical
              use PWD from environment, even if it contains symlinks

       -P, --physical
              avoid all symlinks

EXAMPLES
       pwd
              Print the current working directory.

SEE ALSO
        getcwd(3), cd(1)
`);

    // mkdir(1) - make directories
    this.createFile('/usr/share/man/man1/mkdir.1', `MKDIR(1)                     User Commands                    MKDIR(1)

NAME
       mkdir - make directories

SYNOPSIS
       mkdir [OPTION]... DIRECTORY...

DESCRIPTION
       Create the DIRECTORY(ies), if they do not already exist.

OPTIONS
       -p, --parents
              no error if existing, make parent directories as needed

EXAMPLES
       mkdir test
              Create a directory called 'test'.

       mkdir -p a/b/c
              Create nested directories.

SEE ALSO
       rmdir(1), mkdir(2)
`);

    // rm(1) - remove files or directories
    this.createFile('/usr/share/man/man1/rm.1', `RM(1)                        User Commands                       RM(1)

NAME
       rm - remove files or directories

SYNOPSIS
       rm [OPTION]... FILE...

DESCRIPTION
       This manual page documents the GNU version of rm. rm removes each
       specified file. By default, it does not remove directories.

       If the -I or --interactive=once option is given, and there are more
       than three files or the -r, -R, or --recursive are given, then rm
       prompts the user for whether to proceed.

OPTIONS
       -f, --force
              ignore nonexistent files and arguments, never prompt

       -i     prompt before every removal

       -I     prompt once before removing more than three files

       -r, -R, --recursive
              remove directories and their contents recursively

EXAMPLES
       rm file.txt
              Remove a file.

       rm -r directory
              Remove a directory and all its contents.

SEE ALSO
       unlink(2), rmdir(2), chattr(1)
`);

    // touch(1) - change file timestamps
    this.createFile('/usr/share/man/man1/touch.1', `TOUCH(1)                     User Commands                    TOUCH(1)

NAME
       touch - change file timestamps

SYNOPSIS
       touch [OPTION]... FILE...

DESCRIPTION
       Update the access and modification times of each FILE to the current
       time. A FILE argument that does not exist is created empty, unless -c
       or -h is supplied.

       A FILE argument string of - is handled specially and causes touch to
       change the times of the file associated with standard output.

OPTIONS
       -c, --no-create
              do not create any files

EXAMPLES
       touch file.txt
              Create file.txt if it doesn't exist, or update its timestamp.

SEE ALSO
        stat(2), utime(2)
`);

    // cat(1) - concatenate files and print on the standard output
    this.createFile('/usr/share/man/man1/cat.1', `CAT(1)                       User Commands                      CAT(1)

NAME
       cat - concatenate files and print on the standard output

SYNOPSIS
       cat [OPTION]... [FILE]...

DESCRIPTION
       Concatenate FILE(s) to standard output.

       With no FILE, or when FILE is -, read standard input.

OPTIONS
       -n, --number
              number all output lines

       -b, --number-nonblank
              number nonempty output lines

       -s, --squeeze-blank
              suppress repeated empty output lines

EXAMPLES
       cat file.txt
              Display the contents of file.txt.

       cat file1.txt file2.txt
              Display the contents of multiple files.

SEE ALSO
       tac(1), more(1), less(1)
`);

    // cp(1) - copy files and directories
    this.createFile('/usr/share/man/man1/cp.1', `CP(1)                        User Commands                       CP(1)

NAME
       cp - copy files and directories

SYNOPSIS
       cp [OPTION]... SOURCE DEST
       cp [OPTION]... SOURCE... DIRECTORY

DESCRIPTION
       Copy SOURCE to DEST, or multiple SOURCE(s) to DIRECTORY.

OPTIONS
       -f, --force
              if an existing destination file cannot be opened, remove it

       -i, --interactive
              prompt before overwrite

       -r, -R, --recursive
              copy directories recursively

EXAMPLES
       cp file1 file2
              Copy file1 to file2.

       cp file1 file2 dir/
              Copy multiple files to a directory.

SEE ALSO
       mv(1), install(1)
`);

    // mv(1) - move (rename) files
    this.createFile('/usr/share/man/man1/mv.1', `MV(1)                        User Commands                       MV(1)

NAME
       mv - move (rename) files

SYNOPSIS
       mv [OPTION]... SOURCE DEST
       mv [OPTION]... SOURCE... DIRECTORY

DESCRIPTION
       Rename SOURCE to DEST, or move SOURCE(s) to DIRECTORY.

       Mandatory arguments to long options are mandatory for short options too.

OPTIONS
       -f, --force
              do not prompt before overwriting

       -i, --interactive
              prompt before overwrite

EXAMPLES
       mv file1 file2
              Rename file1 to file2.

       mv file1 file2 dir/
              Move multiple files to a directory.

SEE ALSO
       cp(1), rename(2)
`);

    // chmod(1) - change file mode bits
    this.createFile('/usr/share/man/man1/chmod.1', `CHMOD(1)                     User Commands                    CHMOD(1)

NAME
       chmod - change file mode bits

SYNOPSIS
       chmod [OPTION]... MODE[,MODE]... FILE...
       chmod [OPTION]... OCTAL-MODE FILE...

DESCRIPTION
       This manual page documents the GNU version of chmod. chmod changes the
       file mode bits of each given file according to mode, which can be
       either a symbolic representation of changes to make, or an octal
       number representing the bit pattern for the new mode bits.

EXAMPLES
       chmod 755 file
              Set file permissions to rwxr-xr-x.

       chmod +x script.sh
              Make script.sh executable.

SEE ALSO
       chown(1), chgrp(1), chmod(2)
`);

    // whoami(1) - print effective userid
    this.createFile('/usr/share/man/man1/whoami.1', `WHOAMI(1)                    User Commands                   WHOAMI(1)

NAME
        whoami - print effective userid

SYNOPSIS
        whoami [OPTION]...

DESCRIPTION
        Print the user name associated with the current effective user ID.
        Same as id -un.

OPTIONS
        --help display this help and exit

        --version
               output version information and exit

EXAMPLES
        whoami
               Print the current user name.

SEE ALSO
        id(1), who(1)
`);

    // id(1) - print real and effective user and group IDs
    this.createFile('/usr/share/man/man1/id.1', `ID(1)                        User Commands                       ID(1)

NAME
        id - print real and effective user and group IDs

SYNOPSIS
        id [OPTION]... [USER]

DESCRIPTION
        Print user and group information for the specified USER, or (when USER
        omitted) for the current user.

OPTIONS
        -u, --user
               print only the effective user ID

        -g, --group
               print only the effective group ID

        -n, --name
               print a name instead of a number, for -ugG

EXAMPLES
        id
               Print information about the current user.

SEE ALSO
        whoami(1), groups(1)
`);

    // echo(1) - display a line of text
    this.createFile('/usr/share/man/man1/echo.1', `ECHO(1)                      User Commands                     ECHO(1)

NAME
        echo - display a line of text

SYNOPSIS
        echo [SHORT-OPTION]... [STRING]...
        echo LONG-OPTION

DESCRIPTION
        Echo the STRING(s) to standard output.

        -n     do not output the trailing newline

        -e     enable interpretation of backslash escapes

        -E     disable interpretation of backslash escapes (default)

EXAMPLES
        echo hello world
               Print "hello world" followed by a newline.

        echo -n hello world
               Print "hello world" without a trailing newline.

SEE ALSO
        printf(1)
`);

    // grep(1) - print lines that match patterns
    this.createFile('/usr/share/man/man1/grep.1', `GREP(1)                      User Commands                     GREP(1)

NAME
        grep - print lines that match patterns

SYNOPSIS
        grep [OPTION...] PATTERNS [FILE...]

DESCRIPTION
        grep searches for PATTERNS in each FILE. PATTERNS is one or more
        patterns separated by newline characters, and grep prints each line
        that matches a pattern.

OPTIONS
        -i, --ignore-case
               ignore case distinctions

        -v, --invert-match
               select non-matching lines

        -n, --line-number
               print line number with output lines

EXAMPLES
        grep "hello" file.txt
               Print lines containing "hello".

        grep -i "HELLO" file.txt
               Case-insensitive search.

SEE ALSO
        sed(1), awk(1)
`);

    // find(1) - search for files in a directory hierarchy
    this.createFile('/usr/share/man/man1/find.1', `FIND(1)                      User Commands                     FIND(1)

NAME
        find - search for files in a directory hierarchy

SYNOPSIS
        find [path...] [expression]

DESCRIPTION
        find searches the directory tree rooted at each given file name by
        evaluating the given expression from left to right, according to the
        rules of precedence, until the outcome is known.

EXPRESSIONS
        -name pattern
               Base of file name matches shell pattern pattern.

        -type c
               File is of type c: f=regular file, d=directory

EXAMPLES
        find /home -name "*.txt"
               Find all .txt files in /home.

        find . -name "test*"
               Find all files starting with "test" in current directory.

SEE ALSO
        locate(1), xargs(1)
`);

    // man(1) - an interface to the system reference manuals
    this.createFile('/usr/share/man/man1/man.1', `MAN(1)                       User Commands                      MAN(1)

NAME
        man - an interface to the system reference manuals

SYNOPSIS
        man [man options] [[section] page ...] ...
        man -k [apropos options] regexp ...
        man -K [man options] [section] term ...
        man -f [whatis options] page ...
        man -l [man options] file ...
        man -w|-W [man options] page ...

DESCRIPTION
        man is the system's manual pager. Each page argument given to man is
        normally the name of a program, utility or function. The manual page
        associated with each of these arguments is then found and displayed.

EXAMPLES
        man ls
               Display the manual page for ls.

        man -k printf
               Search for manual pages containing "printf".

SEE ALSO
        apropos(1), whatis(1), less(1)
`);

    // help(1) - display help information
    this.createFile('/usr/share/man/man1/help.1', `HELP(1)                      User Commands                     HELP(1)

NAME
        help - display help information

SYNOPSIS
        help [command]

DESCRIPTION
        Display helpful information about builtin commands. If COMMAND is
        specified, display help for that command. Otherwise, display a list
        of all available commands.

EXAMPLES
        help
               Display a list of all available commands.

        help ls
               Display help for the ls command.

SEE ALSO
        man(1)
`);

    // save(1) - save filesystem state
    this.createFile('/usr/share/man/man1/save.1', `SAVE(1)                      Linux Sim Commands               SAVE(1)

NAME
        save - save filesystem state to local storage

SYNOPSIS
        save

DESCRIPTION
        Save the current state of the filesystem to the browser's local storage.
        This allows the filesystem state to persist between browser sessions.

        The save operation includes all files, directories, permissions, and
        current directory location.

EXAMPLES
        save
               Save the current filesystem state.

SEE ALSO
        reset(1)
`);

    // reset(1) - reset filesystem to initial state
    this.createFile('/usr/share/man/man1/reset.1', `RESET(1)                     Linux Sim Commands               RESET(1)

NAME
        reset - reset filesystem to initial state

SYNOPSIS
        reset

DESCRIPTION
        Clear the saved filesystem state from local storage and reset the
        filesystem to its initial state. This will remove all user-created
        files and directories.

        Note: This command only clears the saved state. You must refresh the
        page to see the reset filesystem.

EXAMPLES
        reset
               Clear saved filesystem state.

SEE ALSO
        save(1)
`);

    // clear(1) - clear the terminal screen
    this.createFile('/usr/share/man/man1/clear.1', `CLEAR(1)                     User Commands                    CLEAR(1)

NAME
        clear - clear the terminal screen

SYNOPSIS
        clear

DESCRIPTION
        Clear the terminal screen, removing all previous output and positioning
        the cursor at the top of the screen.

EXAMPLES
        clear
               Clear the terminal screen.

SEE ALSO
        reset(1)
`);

    // rmdir(1) - remove empty directories
    this.createFile('/usr/share/man/man1/rmdir.1', `RMDIR(1)                     User Commands                    RMDIR(1)

NAME
       rmdir - remove empty directories

SYNOPSIS
       rmdir [OPTION]... DIRECTORY...

DESCRIPTION
       Remove the DIRECTORY(ies), if they are empty.

       Mandatory arguments to long options are mandatory for short options too.

OPTIONS
       --ignore-fail-on-non-empty
              ignore each failure that is solely because a directory is non-empty

       -p, --parents
              remove DIRECTORY and its ancestors; e.g., 'rmdir -p a/b/c' is
              similar to 'rmdir a/b/c a/b a'

EXAMPLES
       rmdir test
              Remove the directory 'test' if it is empty.

       rmdir -p a/b/c
              Remove directory 'a/b/c' and then 'a/b' and 'a' if they become empty.

SEE ALSO
       rm(1), mkdir(1)
`);
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
      'ls', 'cd', 'pwd', 'mkdir', 'rmdir', 'touch', 'rm', 'cat',
      'cp', 'mv', 'chmod', 'whoami', 'id', 'echo', 'grep', 'find',
      'man', 'help', 'save', 'reset', 'clear'
    ];

    for (const cmd of requiredManPages) {
      if (!man1Dir.children!.has(`${cmd}.1`)) {
        this.createIndividualManPage(cmd);
      }
    }
  }

  private createIndividualManPage(command: string): void {
    switch (command) {
      case 'ls':
        this.createFile('/usr/share/man/man1/ls.1', `LS(1)                        User Commands                       LS(1)

NAME
       ls - list directory contents

SYNOPSIS
       ls [OPTION]... [FILE]...

DESCRIPTION
       List information about the FILEs (the current directory by default).
       Sort entries alphabetically if none of -cftuvSUX nor --sort is specified.

       Mandatory arguments to long options are mandatory for short options too.

OPTIONS
       -a, --all
              do not ignore entries starting with .

       -l     use a long listing format

EXAMPLES
       ls
              List the contents of the current directory.

       ls -l
              List the contents of the current directory in long format.

       ls -a
              List all files, including hidden ones.

SEE ALSO
       dir(1), vdir(1)
`);
        break;

      case 'cd':
        this.createFile('/usr/share/man/man1/cd.1', `CD(1)                        User Commands                       CD(1)

NAME
       cd - change the working directory

SYNOPSIS
       cd [DIRECTORY]

DESCRIPTION
       Change the current directory to DIRECTORY. The default DIRECTORY is the
       value of the HOME shell variable.

       CD can also be entered as CHDIR. If DIRECTORY begins with a slash, it
       is interpreted as an absolute path. Otherwise, it is interpreted as a
       relative path to the current directory.

EXAMPLES
       cd
              Change to the user's home directory.

       cd /tmp
              Change to the /tmp directory.

       cd ..
              Change to the parent directory.

SEE ALSO
       pwd(1), bash(1)
`);
        break;

      case 'pwd':
        this.createFile('/usr/share/man/man1/pwd.1', `PWD(1)                       User Commands                      PWD(1)

NAME
       pwd - print name of current/working directory

SYNOPSIS
       pwd [OPTION]...

DESCRIPTION
       Print the full filename of the current working directory.

OPTIONS
       -L, --logical
              use PWD from environment, even if it contains symlinks

       -P, --physical
              avoid all symlinks

EXAMPLES
       pwd
              Print the current working directory.

SEE ALSO
        getcwd(3), cd(1)
`);
        break;

      case 'mkdir':
        this.createFile('/usr/share/man/man1/mkdir.1', `MKDIR(1)                     User Commands                    MKDIR(1)

NAME
       mkdir - make directories

SYNOPSIS
       mkdir [OPTION]... DIRECTORY...

DESCRIPTION
       Create the DIRECTORY(ies), if they do not already exist.

OPTIONS
       -p, --parents
              no error if existing, make parent directories as needed

EXAMPLES
       mkdir test
              Create a directory called 'test'.

       mkdir -p a/b/c
              Create nested directories.

SEE ALSO
       rmdir(1), mkdir(2)
`);
        break;

      case 'rmdir':
        this.createFile('/usr/share/man/man1/rmdir.1', `RMDIR(1)                     User Commands                    RMDIR(1)

NAME
       rmdir - remove empty directories

SYNOPSIS
       rmdir [OPTION]... DIRECTORY...

DESCRIPTION
       Remove the DIRECTORY(ies), if they are empty.

       Mandatory arguments to long options are mandatory for short options too.

OPTIONS
       --ignore-fail-on-non-empty
              ignore each failure that is solely because a directory is non-empty

       -p, --parents
              remove DIRECTORY and its ancestors; e.g., 'rmdir -p a/b/c' is
              similar to 'rmdir a/b/c a/b a'

EXAMPLES
       rmdir test
              Remove the directory 'test' if it is empty.

       rmdir -p a/b/c
              Remove directory 'a/b/c' and then 'a/b' and 'a' if they become empty.

SEE ALSO
       rm(1), mkdir(1)
`);
        break;

      // Add other man pages as needed...
      default:
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
      'ls', 'cd', 'pwd', 'cat', 'mkdir', 'rmdir', 'touch', 'rm',
      'cp', 'mv', 'chmod', 'whoami', 'id', 'echo', 'grep', 'find',
      'man', 'help', 'save', 'reset', 'clear'
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