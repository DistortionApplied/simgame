// lib/commandHelp.ts
// Contains help texts and synopses for all commands

export function getCommandHelp(command: string): string {
  if (command === 'help') {
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
      ['cat [file]', 'Display file contents or stdin'],
      ['nano <file>', 'Edit file with nano text editor'],
      ['adduser <user>', 'Add a user to the system (root only)'],
      ['userdel <user>', 'Delete a user from the system (root only)'],
      ['passwd [user]', 'Change password (root can change any user\'s password)'],
      ['sudo <cmd>', 'Execute command as root'],
      ['su [user]', 'Switch to another user account'],
      ['cp <src> <dst>', 'Copy file'],
      ['mv <src> <dst>', 'Move/rename file'],
      ['chmod <mode> <file>', 'Change permissions (octal)'],
      ['cmd < file', 'Input redirection from file'],
      ['cmd > file', 'Output redirection to file'],
      ['cmd >> file', 'Output append redirection to file'],
      ['ping [opts] <host>', 'Send ICMP echo requests to network host'],
      ['nmap [opts] <target>', 'Network exploration tool and security scanner'],
      ['snake', 'Play the classic Snake game'],
      ['ifconfig [iface]', 'Configure network interfaces'],
      ['whoami', 'Show current user'],
      ['id', 'Show user/group IDs'],
      ['echo <text>', 'Display text'],
      ['grep <pat> [file]', 'Search for pattern in file or stdin'],
      ['find <path> -name <pat>', 'Find files by name'],
      ['save', 'Manually save filesystem state'],
      ['reset', 'Reset filesystem to initial state'],
      ['debug', 'Show filesystem debug info'],
      ['clear', 'Clear terminal'],
      ['reboot', 'Restart the system']
    ];

    const maxCmdLength = Math.max(...commands.map(([cmd]) => cmd.length));
    return 'Available commands:\n' + commands.map(([cmd, desc]) =>
      `  ${cmd.padEnd(maxCmdLength)} - ${desc}`
    ).join('\n');
  }

  const helpTexts: Record<string, string> = {
    ls: `ls: list directory contents

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
`,
    cd: `cd: change the working directory

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
`,
    pwd: `pwd: print name of current/working directory

Usage: pwd

Print the full filename of the current working directory.

Examples:
  pwd         Display current directory path
`,
    mkdir: `mkdir: make directories

Usage: mkdir DIRECTORY...

Create the DIRECTORY(ies), if they do not already exist.

Examples:
  mkdir newdir        Create a directory called newdir
  mkdir dir1 dir2     Create multiple directories
`,
    rmdir: `rmdir: remove empty directories

Usage: rmdir DIRECTORY...

Remove the DIRECTORY(ies), if they are empty.

Examples:
  rmdir emptydir     Remove an empty directory
  rmdir dir1 dir2    Remove multiple empty directories
`,
    touch: `touch: change file timestamps

Usage: touch FILE...

Update the access and modification times of each FILE to the current time.

Examples:
  touch file.txt      Create file.txt if it doesn't exist
  touch file1 file2   Update timestamps for multiple files
`,
    rm: `rm: remove files or directories

Usage: rm FILE...

Remove (unlink) the FILE(s).

Examples:
  rm file.txt      Remove a file
  rm file1 file2   Remove multiple files
`,
    cat: `cat: concatenate files and print on the standard output

Usage: cat [FILE]...

Concatenate FILE(s) to standard output.

Examples:
  cat file.txt        Display contents of file.txt
  cat file1 file2     Display contents of multiple files
`,
    nano: `nano - Nano's ANOther editor, an enhanced free Pico clone

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
`,
    adduser: `adduser - add a user to the system

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
`,
    userdel: `userdel - delete a user account and related files

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
`,
    passwd: `passwd - change user password

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
`,
    sudo: `sudo - execute a command as another user

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
`,
    su: `su - run a command with substitute user and group ID

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
`,
    cp: `cp: copy files and directories

Usage: cp SOURCE DEST
  or:  cp SOURCE... DIRECTORY

Copy SOURCE to DEST, or multiple SOURCE(s) to DIRECTORY.

Examples:
  cp file1 file2      Copy file1 to file2
  cp file1 file2 dir  Copy file1 and file2 to dir/
`,
    mv: `mv - move (rename) files

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
`,
    chmod: `chmod: change file mode bits

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
`,
    ping: `ping: send ICMP ECHO_REQUEST to network hosts

SYNOPSIS
        ping [OPTIONS] destination

DESCRIPTION
        ping uses the ICMP protocol's mandatory ECHO_REQUEST datagram to
        elicit an ICMP ECHO_RESPONSE from a host or gateway.

OPTIONS
        -c, --count COUNT
                Stop after sending COUNT ECHO_REQUEST packets.

        -t, --timeout TIMEOUT
                Specify a timeout, in seconds, before ping exits.

        -i, --interval INTERVAL
                Wait INTERVAL seconds between sending each packet.

        -h, --help
                Display this help message.

EXAMPLES
        ping googo.com
                Ping googo.com continuously.

        ping -c 4 googo.com
                Ping googo.com 4 times.

        ping -t 10 192.168.1.1
                Ping with 10 second timeout.

SEE ALSO
        traceroute(1), nslookup(1)
`,
    ifconfig: `ifconfig - configure a network interface

SYNOPSIS
        ifconfig [INTERFACE]
        ifconfig INTERFACE [OPTIONS]

DESCRIPTION
        Ifconfig is used to configure the kernel-resident network interfaces.
        It is used at boot time to set up interfaces as necessary. After that,
        it is usually only needed when debugging or when system tuning is
        needed.

        If no arguments are given, ifconfig displays the status of the
        currently active interfaces. If a single interface argument is given,
        it displays the status of the given interface only.

        Ifconfig uses the ioctl access method to get the full address
        information, which limits hardware addresses to 8 bytes.

OPTIONS
        INTERFACE
                The name of the interface. This is usually a driver name
                followed by a unit number, for example eth0 for the first
                Ethernet interface.

        up         This flag causes the interface to be activated.

        down       This flag causes the driver for this interface to be shut
                   down.

        [-]arp     Enable or disable the use of the ARP protocol on this
                   interface.

        [-]promisc
                   Enable or disable the promiscuous mode of the interface.

        [-]allmulti
                   Enable or disable all-multicast mode.

        mtu N      This parameter sets the Maximum Transfer Unit of an
                   interface.

        dstaddr addr
                   Set the remote IP address for a point-to-point link.

        netmask addr
                   Set the IP network mask for this interface.

        add addr/prefixlen
                   Add an IPv6 address to an interface.

        del addr/prefixlen
                   Remove an IPv6 address from an interface.

        [-]broadcast [addr]
                   If the address argument is given, set the protocol broadcast
                   address for this interface. Otherwise, set (or clear) the
                   IFF_BROADCAST flag for the interface.

        [-]pointopoint [addr]
                   This keyword enables the point-to-point mode of an
                   interface, meaning that it is a direct link between two
                   machines with nobody else listening on it.

EXAMPLES
        ifconfig
                Display info about all network interfaces.

        ifconfig eth0
                Display info about eth0 interface only.

        ifconfig eth0 up
                Activate the eth0 interface.

        ifconfig eth0 down
                Deactivate the eth0 interface.

SEE ALSO
        ip(8), route(8), netstat(8)
`,
    whoami: `whoami: print effective userid

Usage: whoami

Print the user name associated with the current effective user ID.

Examples:
  whoami     Display current username
`,
    id: `id - print real and effective user and group IDs

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
`,
    echo: `echo: display a line of text

Usage: echo [STRING]...

Display the STRING(s), separated by single blank spaces.

Examples:
  echo hello world    Display "hello world"
  echo "hello world"  Display "hello world" with quotes
`,
    grep: `grep - print lines that match patterns

SYNOPSIS
        grep [OPTION...] PATTERNS [FILE...]

DESCRIPTION
        grep searches for PATTERNS in each FILE. PATTERNS is one or more
        patterns separated by newline characters, and grep prints each line
        that matches a pattern.

        With no FILE, or when FILE is -, read standard input.

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

        grep pattern
                Search for "pattern" in standard input.

SEE ALSO
        sed(1), awk(1)
`,
    find: `find - search for files in a directory hierarchy

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
`,
    man: `man: an interface to the system reference manuals

Usage: man [COMMAND]

Display the manual page for COMMAND.

Examples:
  man ls      Display manual for ls command
  man chmod   Display manual for chmod command
`,
    save: `save - save filesystem state

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
`,
    reset: `reset - reset filesystem to initial state

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
`,
    debug: `debug - show filesystem debug information

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
`,
    reboot: `reboot - reboot the system

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
`,
    snake: `snake - Classic Snake game

SYNOPSIS
        snake

DESCRIPTION
        Play the classic Snake game in the terminal. Control the snake using
        arrow keys to eat food and grow longer. Avoid hitting walls or yourself.

        The game ends when the snake collides with a wall or its own body.

CONTROLS
        Arrow Keys    Move the snake (Up, Down, Left, Right)
        q or ESC      Quit the game

GAMEPLAY
        - Eat the food (@) to grow and increase your score
        - The snake moves continuously in the current direction
        - Game speed increases as your score grows
        - Score is displayed at the top of the screen

EXAMPLES
        snake
                Start a new game of Snake

SEE ALSO
        No related commands in this simulation
`,
    // nmap and apt have their own help in lib files, so not included here
  };

  return helpTexts[command] || '';
}