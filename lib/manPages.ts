export const manPages: Record<string, string> = {
  ls: `LS(1)                        User Commands                       LS(1)

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
`,

  cd: `CD(1)                        User Commands                       CD(1)

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
`,

  pwd: `PWD(1)                       User Commands                      PWD(1)

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
`,

  mkdir: `MKDIR(1)                     User Commands                    MKDIR(1)

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
`,

  rmdir: `RMDIR(1)                     User Commands                    RMDIR(1)
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
`,

  touch: `TOUCH(1)                     User Commands                    TOUCH(1)

NAME
        touch - change file timestamps

SYNOPSIS
        touch [OPTION]... FILE...

DESCRIPTION
        Update the access and modification times of each FILE to the current time.

        A FILE argument that does not exist is created empty, unless -c or -h is supplied.

OPTIONS
        -a     change only the access time

        -c, --no-create
                do not create any files

        -d, --date=STRING
                parse STRING and use it instead of current time

        -m     change only the modification time

        -r, --reference=FILE
                use this file's times instead of current time

        -t STAMP
                use [[CC]YY]MMDDhhmm[.ss] instead of current time

EXAMPLES
        touch file.txt
                Create file.txt if it doesn't exist, or update its timestamp.

SEE ALSO
        ls(1), stat(1)
`,

  rm: `RM(1)                        User Commands                       RM(1)

NAME
        rm - remove files or directories

SYNOPSIS
        rm [OPTION]... [FILE]...

DESCRIPTION
        This manual page documents the GNU version of rm. rm removes each specified file.
        By default, it does not remove directories.

        If the -I or --interactive=once option is given, and there are more than three files
        or the -r, -R, or --recursive are given, then rm prompts the user for whether to
        proceed with the entire operation. If the response is not affirmative, the entire
        command is aborted.

        Otherwise, if a file is unwritable, standard input is a terminal, and the -f or
        --force option is not given, or the -i or --interactive=always option is given,
        rm prompts the user to confirm the deletion.

OPTIONS
        -f, --force
                ignore nonexistent files and arguments, never prompt

        -i     prompt before every removal

        -I     prompt once before removing more than three files, or when removing
                recursively; less intrusive than -i, while still giving protection
                against most mistakes

        -r, -R, --recursive
                remove directories and their contents recursively

        --preserve-root
                do not remove '/' (default)

EXAMPLES
        rm file.txt
                Remove file.txt.

        rm -r directory/
                Remove directory and all its contents.

SEE ALSO
        unlink(1), rmdir(1), mkdir(1)
`,

  cat: `CAT(1)                       User Commands                      CAT(1)

NAME
        cat - concatenate files and print on the standard output

SYNOPSIS
        cat [OPTION]... [FILE]...

DESCRIPTION
        Concatenate FILE(s) to standard output.

        With no FILE, or when FILE is -, read standard input.

OPTIONS
        -A, --show-all
                equivalent to -vET

        -b, --number-nonblank
                number nonempty output lines, overrides -n

        -E, --show-ends
                display $ at end of each line

        -n, --number
                number all output lines

        -s, --squeeze-blank
                suppress repeated empty output lines

        -T, --show-tabs
                display TAB characters as ^I

        -u     (ignored)

        -v, --show-nonprinting
                use ^ and M- notation, except for LFD and TAB

EXAMPLES
        cat file.txt
                Display the contents of file.txt.

        cat file1.txt file2.txt
                Concatenate and display file1.txt and file2.txt.

SEE ALSO
        tac(1), less(1), more(1)
`,

  cp: `CP(1)                        User Commands                       CP(1)

NAME
        cp - copy files and directories

SYNOPSIS
        cp [OPTION]... [-T] SOURCE DEST
        cp [OPTION]... SOURCE... DIRECTORY
        cp [OPTION]... -t DIRECTORY SOURCE...

DESCRIPTION
        Copy SOURCE to DEST, or multiple SOURCE(s) to DIRECTORY.

OPTIONS
        -a, --archive
                same as -dR --preserve=all

        -b     make a backup of each existing destination file

        -d     same as --no-dereference --preserve=links

        -f, --force
                if an existing destination file cannot be opened, remove it and try again

        -i, --interactive
                prompt before overwrite

        -l, --link
                hard link files instead of copying

        -p     same as --preserve=mode,ownership,timestamps

        -r     copy directories recursively

        -s, --symbolic-link
                make symbolic links instead of copying

        -u, --update
                copy only when the SOURCE file is newer than the destination file or
                when the destination file is missing

        -v, --verbose
                explain what is being done

EXAMPLES
        cp file1.txt file2.txt
                Copy file1.txt to file2.txt.

        cp file.txt /tmp/
                Copy file.txt to the /tmp directory.

SEE ALSO
        mv(1), install(1), ln(1)
`,

  mv: `MV(1)                        User Commands                       MV(1)

NAME
        mv - move (rename) files

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

EXAMPLES
        mv file1.txt file2.txt
                Rename file1.txt to file2.txt.

        mv file.txt /tmp/
                Move file.txt to the /tmp directory.

SEE ALSO
        cp(1), ln(1), rename(1)
`,

  chmod: `CHMOD(1)                     User Commands                    CHMOD(1)

NAME
        chmod - change file mode bits

SYNOPSIS
        chmod [OPTION]... MODE[,MODE]... FILE...
        chmod [OPTION]... OCTAL-MODE FILE...
        chmod [OPTION]... --reference=RFILE FILE...

DESCRIPTION
        This manual page documents the GNU version of chmod. chmod changes the file
        mode bits of each given file according to mode, which can be either a symbolic
        representation of changes to make, or an octal number representing the bit
        pattern for the new mode bits.

        In this game, only octal modes are supported for simplicity.

PERMISSIONS STRUCTURE
        Permissions are represented as 3 or 4 octal digits:
        - Owner permissions (first digit)
        - Group permissions (second digit)
        - Others permissions (third digit)
        - Optional: Special permissions (fourth digit)

        Each digit is the sum of:
        4 = read (r)
        2 = write (w)
        1 = execute (x)

        ASCII Art:
          ┌───┬───┬───┐
          │ r │ w │ x │ Owner
          ├───┼───┼───┤
          │ r │ w │ x │ Group
          ├───┼───┼───┤
          │ r │ w │ x │ Others
          └───┴───┴───┘

EXAMPLES
        chmod 755 file
                Set file permissions to rwxr-xr-x (755 = 7+5+5).

        chmod 644 file
                Set file permissions to rw-r--r-- (644 = 6+4+4).

        chmod 600 file
                Private file: rw------- (600 = 6+0+0).

SEE ALSO
        chown(1), chgrp(1), chmod(2)
`,

  whoami: `WHOAMI(1)                    User Commands                   WHOAMI(1)

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
        id(1), who(1), getuid(2)
`,

  id: `ID(1)                        User Commands                       ID(1)

NAME
        id - print real and effective user and group IDs

SYNOPSIS
        id [OPTION]... [USER]

DESCRIPTION
        Print user and group information for the specified USER, or (when USER omitted)
        for the current user.

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

EXAMPLES
        id
                Print information about the current user.

        id username
                Print information about the specified user.

SEE ALSO
        whoami(1), who(1), getuid(2), getgid(2)
`,

  echo: `ECHO(1)                      User Commands                     ECHO(1)

NAME
        echo - display a line of text

SYNOPSIS
        echo [SHORT-OPTION]... [STRING]...
        echo LONG-OPTION

DESCRIPTION
        Echo the STRING(s) to standard output.

OPTIONS
        -n     do not output the trailing newline

        -e     enable interpretation of backslash escapes

        -E     disable interpretation of backslash escapes (default)

EXAMPLES
        echo hello world
                Display "hello world" followed by a newline.

        echo -n hello world
                Display "hello world" without a trailing newline.

SEE ALSO
        printf(1)
`,

  grep: `GREP(1)                      User Commands                     GREP(1)

NAME
        grep - print lines that match patterns

SYNOPSIS
        grep [OPTION...] PATTERNS [FILE...]

DESCRIPTION
        grep searches for PATTERNS in each FILE. PATTERNS is one or more patterns
        separated by newline characters, and grep prints each line that matches
        a pattern.

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

EXAMPLES
        grep pattern file.txt
                Search for "pattern" in file.txt.

        grep -r pattern /home
                Recursively search for "pattern" in /home.

SEE ALSO
        sed(1), awk(1)
`,

  find: `FIND(1)                      User Commands                     FIND(1)

NAME
        find - search for files in a directory hierarchy

SYNOPSIS
        find [-H] [-L] [-P] [-D debugopts] [-Olevel] [starting-point...]
              [expression]

DESCRIPTION
        find searches the directory tree rooted at each given starting-point by
        evaluating the given expression from left to right, according to the rules
        of precedence, until the outcome is known.

EXPRESSIONS
        -name pattern
                Base of file name matches shell pattern pattern.

        -type c
                File is of type c: b block, c character, d directory, f regular file,
                l symbolic link, p FIFO, s socket.

        -exec command ;
                Execute command; true if 0 status is returned.

        -print
                Print the full file name on the standard output, followed by a newline.

EXAMPLES
        find /home -name "*.txt"
                Find all .txt files in /home.

        find . -type f -exec grep "pattern" {} \;
                Find all regular files and search for "pattern" in them.

SEE ALSO
        locate(1), xargs(1)
`,

  man: `MAN(1)                       User Commands                      MAN(1)

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

OPTIONS
        -f, --whatis
                Equivalent to whatis.

        -k, --apropos
                Equivalent to apropos.

EXAMPLES
        man ls
                Display the manual page for ls.

        man -k printf
                Search for manual pages containing "printf".

SEE ALSO
        whatis(1), apropos(1), manpath(1)
`,

  help: `HELP(1)                      Linux Sim Commands               HELP(1)

NAME
        help - display help information

SYNOPSIS
        help [command]

DESCRIPTION
        Display help information for commands. If no command is specified,
        display a list of all available commands.

EXAMPLES
        help
                Display all available commands.

        help ls
                Display help for the ls command.

SEE ALSO
        man(1)
`,

  save: `SAVE(1)                      Linux Sim Commands               SAVE(1)

NAME
        save - save filesystem state

SYNOPSIS
        save

DESCRIPTION
        Save the current filesystem state to localStorage for persistence
        across browser sessions.

EXAMPLES
        save
                Save the current filesystem state.

SEE ALSO
        reset(1)
`,

  reset: `RESET(1)                     Linux Sim Commands               RESET(1)

NAME
        reset - reset filesystem to initial state

SYNOPSIS
        reset

DESCRIPTION
        Reset the filesystem to its initial state, removing all user-created
        files and directories. This also clears the saved state.

EXAMPLES
        reset
                Reset the filesystem to initial state.

SEE ALSO
        save(1)
`,

  clear: `CLEAR(1)                     User Commands                    CLEAR(1)

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
`,

  passwd: `PASSWD(1)                    Linux Sim Commands               PASSWD(1)

NAME
        passwd - change user password

SYNOPSIS
        passwd [USER]

DESCRIPTION
        passwd changes passwords for user accounts. A normal user may only
        change the password for their own account, while the superuser may
        change the password for any account.

        For users with existing passwords, you will be prompted for the current
        password, then the new password, and to confirm it.

        For new users without passwords, only the new password is required.

        The superuser can change any user's password without knowing the old one.

OPTIONS
        None currently supported.

EXAMPLES
        passwd
                 Change your own password.

        sudo passwd john
                 Change john's password as root.
`,

  adduser: `ADDUSER(1)                   Linux Sim Commands               ADDUSER(1)

NAME
        adduser - add a user to the system

SYNOPSIS
        adduser username

DESCRIPTION
        adduser creates a new user account. It will prompt for a password
        during the creation process. The user will be assigned the next
        available UID starting from 1000.

        A home directory /home/username will be created, and the user will
        be added to the system.

        This command must be run as root.

OPTIONS
        None currently supported.

EXAMPLES
        sudo adduser john
                 Create a user named john and prompt for password.
`,

  userdel: `USERDEL(1)                   Linux Sim Commands               USERDEL(1)

NAME
        userdel - delete a user account and related files

SYNOPSIS
        userdel username

DESCRIPTION
        userdel deletes a user account, the user's home directory, and all
        related files.

        The userdel command must be run as root.

        It will refuse to delete the currently logged-in user.

OPTIONS
        None currently supported.

EXAMPLES
        sudo userdel john
                 Delete the user john and their home directory.
`,

  sudo: `SUDO(1)                       Linux Sim Commands                SUDO(1)

NAME
        sudo - execute a command as another user

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

  debug: `DEBUG(1)                      Linux Sim Commands               DEBUG(1)

NAME
        debug - show filesystem debug information

SYNOPSIS
        debug

DESCRIPTION
        Display debugging information about the current filesystem state,
        including current user details, working directory, and counts of
        users and groups in the system.

        This command is useful for developers and administrators to inspect
        the internal state of the simulation.

EXAMPLES
        debug
                 Show current filesystem debug information.

SEE ALSO
        whoami(1), pwd(1), id(1)
`,

  reboot: `REBOOT(1)                     User Commands                    REBOOT(1)

NAME
        reboot - reboot the system

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

  apt: `APT(1)                         APT                          APT(1)

NAME
        apt - command-line package manager

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
        apt-get(8), apt-cache(8), sources.list(5)
`,

  ping: `PING(1)                        User Commands                       PING(1)

NAME
        ping - send ICMP ECHO_REQUEST to network hosts

SYNOPSIS
        ping [OPTIONS] destination

DESCRIPTION
        ping uses the ICMP protocol's mandatory ECHO_REQUEST datagram to
        elicit an ICMP ECHO_RESPONSE from a host or gateway. ECHO_REQUEST
        datagrams (pings) have an IP and ICMP header, followed by a struct
        time stamp, and then an arbitrary number of pad bytes used to fill
        out the packet.

OPTIONS
        -c, --count COUNT
                 Stop after sending COUNT ECHO_REQUEST packets. With deadline
                 option, ping waits for COUNT ECHO_REPLY packets, until the
                 timeout expires.

        -i, --interval INTERVAL
                 Wait INTERVAL seconds between sending each packet. The default
                 is to wait for one second between each packet normally, or not
                 to wait in flood mode. Only super-user may set interval to
                 values less than 0.2 seconds.

        -t, --timeout TIMEOUT
                 Specify a timeout, in seconds, before ping exits regardless
                 of how many packets have been sent or received. In this case
                 ping does not stop after count packet are sent, it waits
                 either for deadline expire or until count probes are answered
                 or for some error notification from network.

        -h, --help
                 Display help message and exit.

EXAMPLES
        ping googo.com
                 Ping the host googo.com.

        ping -c 4 googo.com
                 Ping the host googo.com 4 times.

        ping -i 0.5 192.168.1.1
                 Ping with 0.5 second intervals.

SEE ALSO
        traceroute(1), nslookup(1), netstat(1)
`,

  nmap: `NMAP(1)                          Nmap Reference Guide                        NMAP(1)

NAME
        nmap - Network exploration tool and security / port scanner

SYNOPSIS
        nmap [Scan Type(s)] [Options] {target specification}

DESCRIPTION
        Nmap ("Network Mapper") is an open source tool for network exploration
        and security auditing. It was designed to rapidly scan large networks,
        although it works fine against single hosts. Nmap uses raw IP packets
        in novel ways to determine what hosts are available on the network,
        what services (application name and version) those hosts are offering,
        what operating systems (and OS versions) they are running, what type of
        packet filters/firewalls are in use, and dozens of other
        characteristics. While Nmap is commonly used for security audits, many
        systems and network administrators find it useful for routine tasks
        such as network inventory, managing service upgrade schedules, and
        monitoring host or service uptime.

TARGET SPECIFICATION:
        Everything on the Nmap command-line that isn't an option (or option
        argument) is treated as a target host specification. The simplest case
        is to specify a target IP address or hostname for scanning.

HOST DISCOVERY:
        One of the very first steps in any network reconnaissance mission is to
        reduce a (sometimes huge) set of IP ranges into a list of active or
        interesting hosts. Scanning every port of every single IP address is
        slow and usually unnecessary. What makes a host interesting depends
        greatly on the scan purposes. Network administrators may only be
        interested in hosts running a certain service, while security auditors
        may care about every single device with an IP address. System
        administrators often consider hosts simply being up enough
        information.

SCAN TECHNIQUES:
        -sS (TCP SYN scan)
                 SYN scan is the default and most popular scan option for good
                 reasons. It can be performed quickly, scanning thousands of
                 ports per second on a fast network not hampered by restrictive
                 firewalls. SYN scan is relatively unobtrusive and stealthy,
                 since it never completes TCP connections.

        -sT (TCP connect scan)
                 TCP connect scan is the default TCP scan type when SYN scan is
                 not an option. This is the case when a user does not have raw
                 packet privileges or is scanning IPv6 networks.

        -sU (UDP scans)
                 While most popular services on the Internet run over the TCP
                 protocol, UDP services are widely deployed. DNS, SNMP, and DHCP
                 (registered ports 53, 161/162, and 67/68) are three of the most
                 common. Because UDP scanning is generally slower and more
                 difficult than TCP, some security auditors ignore these ports.

PORT SPECIFICATION:
        -p <port ranges> (Only scan specified ports)
                 This option specifies which ports you want to scan and
                 overrides the default. Individual port numbers are OK, as are
                 ranges separated by a hyphen (e.g. 1-1023). The beginning and/or
                 end values of a range may be omitted, causing Nmap to use 1 and
                 65535, respectively.

SERVICE DETECTION:
        -sV (Version detection)
                 Enables version detection, as discussed above. Alternatively,
                 you can use -A, which enables version detection among other
                 things.

        --version-light (Limit to most likely probes)
                 Makes version scanning much faster by limiting probes to the
                 most likely ones for each port.

OS DETECTION:
        -O (Enable OS detection)
                 Enables OS detection, as discussed above. Alternatively, you
                 can use -A, which enables OS detection among other things.

TIMING:
        -T<0-5> (Set timing template)
                 These are convenience options that set multiple timing options
                 at once. Timing template 4 is recommended for decent broadband,
                 while template 5 is good for very fast networks or when you
                 don't mind sacrificing accuracy for speed.

OUTPUT:
        -oN <filespec> (Output scan in normal format to the given filename)

        -oX <filespec> (Output scan in XML format to the given filename)

        -oG <filespec> (Output scan in Grepable format to the given filename)

        -oA <basename> (Output in the three major formats at once)

EXAMPLES
        nmap -v -A scanme.nmap.org
                 This is a comprehensive scan that will attempt to determine the
                 OS type, all open ports, and versions of programs running on
                 them.

        nmap -sn 192.168.0.0/16 10.0.0.0/8
                 This will ping scan all addresses in the 192.168.0.0/16 and
                 10.0.0.0/8 subnets.

        nmap -iR 10000 -Pn -p 80
                 This will randomly select 10,000 hosts and scan them for web
                 servers (port 80).

BUGS
        Like its author, Nmap isn't perfect. But you can help make it better by
        sending bug reports or even writing patches. If Nmap doesn't behave
        the way you expect, first upgrade to the latest version available from
        https://nmap.org. If the problem persists, do some research to
        determine whether it has already been discovered and addressed. Try
        searching the nmap-dev archives at http://seclists.org/ or browsing
        the Nmap bug database at https://nmap.org/book/man-bugs.html.

AUTHOR
        Gordon Lyon (Fyodor) <fyodor@nmap.org>
        (https://nmap.org/book/credits.html lists other contributors)

LEGAL NOTICES
        When using Nmap for illegal purposes, nothing in this license prevents
        you from going to jail. Don't do anything I would disapprove of.

SEE ALSO
        The Nmap documentation is available at https://nmap.org/docs.html
`,

  ifconfig: `IFCONFIG(1)                Linux Programmer's Manual                IFCONFIG(1)

NAME
        ifconfig - configure a network interface

SYNOPSIS
        ifconfig [INTERFACE]
        ifconfig INTERFACE [OPTIONS | ADDRESS]

DESCRIPTION
        Ifconfig is used to configure the kernel-resident network interfaces.
        It is used at boot time to set up interfaces as necessary. After that,
        it is usually only needed when debugging or when system tuning is
        needed.

        If no arguments are given, ifconfig displays the status of the
        currently active interfaces. If a single interface argument is given,
        it displays the status of the given interface only.

OPTIONS
        interface
                 The name of the interface. This is usually a driver name
                 followed by a unit number, for example eth0 for the first
                 Ethernet interface. If the driver module is not loaded then
                 the interface will not exist and ifconfig will display an
                 error.

        up         This flag causes the interface to be activated. It is
                    implicitly specified if an address is assigned to the
                    interface.

        down       This flag causes the driver for this interface to be shut
                    down.

        [-]arp     Enable or disable the use of the ARP protocol on this
                    interface.

        [-]promisc
                    Enable or disable the promiscuous mode of the interface.
                    If selected, all packets on the network will be received
                    by the interface.

        [-]allmulti
                    Enable or disable all-multicast mode. If selected, all
                    multicast packets on the network will be received by the
                    interface.

        mtu N      This parameter sets the Maximum Transfer Unit of an
                    interface.

        dstaddr addr
                    Set the remote IP address for a point-to-point link
                    (such as PPP). This keyword is now obsolete; use the
                    pointopoint keyword instead.

        netmask addr
                    Set the IP network mask for this interface. This value
                    defaults to the usual class A, B or C network mask (as
                    derived from the interface IP address), but it can be set
                    to any value.

        add addr/prefixlen
                    Add an IPv6 address to an interface.

        del addr/prefixlen
                    Remove an IPv6 address from an interface.

        [-]broadcast [addr]
                    If the address argument is given, set the protocol broadcast
                    address for this interface. Otherwise, set (or clear) the
                    IFF_BROADCAST flag for the interface.

        [-]pointopoint [addr]
                    This keyword enables the point-to-point mode of an interface,
                    meaning that it is a direct link between two machines with
                    nobody else listening on it.

        hw class address
                    Set the hardware address of this interface, if the device
                    driver supports this operation. The keyword must be followed
                    by the name of the hardware class and the printable ASCII
                    equivalent of the hardware address. Hardware classes
                    currently supported include ether (Ethernet), ax25 (AMPR
                    AX.25), ARCnet and netrom (AMPR NET/ROM).

        multicast  Set the multicast flag on the interface. This should not
                    normally be needed as the drivers set the flag correctly
                    themselves.

        address    The IP address to be assigned to this interface.

        txqueuelen length
                    Set the transmit queue length of the device. This is
                    useful to set to small values for slower devices with a
                    high latency (modem links, ISDN) to prevent fast bulk
                    transfers from deteriorating interactivity of telnet, etc.

NOTES
        Since kernel release 2.2, ifconfig is obsolete and unmaintained. For
        replacement check ip addr and ip link. For statistics use ip -s link.

SEE ALSO
        ip(8), route(8), netstat(8)

AUTHOR
        Fred N. van Kempen, <waltje@uwalt.nl.mugnet.org>
        Alan Cox, <Alan.Cox@linux.org>
        Phil Blundell, <Philip.Blundell@pobox.com>
        Andi Kleen
`,

  browser: `BROWSER(1)                    User Commands                   BROWSER(1)

NAME
        browser - simple terminal-based web browser

SYNOPSIS
        browser [DOMAIN]

DESCRIPTION
        Browser is a simple terminal-based web browser for viewing simulated
        websites in the mock internet environment.

        DOMAIN specifies the domain name to browse (e.g., googo.com).

OPTIONS
        -h, --help
                Display help information.

EXAMPLES
        browser googo.com
                View the Googo homepage.

        browser --help
                Display this help message.

NOTES
        This browser displays website content in a formatted text interface.
        It is designed for the simulated Linux environment.

SEE ALSO
        ping(1), nmap(1)
`,

  whois: `WHOIS(1)                      User Commands                      WHOIS(1)

NAME
        whois - client for the whois directory service

SYNOPSIS
        whois [OPTIONS] domain

DESCRIPTION
        whois searches for an object in a WHOIS database. WHOIS is a query and
        response protocol that is widely used for querying databases that store
        the registered users or assignees of an Internet resource, such as a
        domain name, an IP address block, or an autonomous system.

        This implementation queries the mock internet WHOIS database for domain
        registration information in the simulated network environment.

OPTIONS
        -h, --help
                 Display help message and exit.

EXAMPLES
        whois googo.com
                 Query WHOIS information for googo.com domain.

        whois glitchub.com
                 Query WHOIS information for glitchub.com domain.

        whois spamazon.com
                 Query WHOIS information for spamazon.com domain.

EXIT STATUS
        0      Success
        1      Domain not found or network error

NOTES
        This command operates within the simulated internet environment and
        returns mock WHOIS data for educational purposes.

SEE ALSO
        ping(1), nmap(1), browser(1)
`
};