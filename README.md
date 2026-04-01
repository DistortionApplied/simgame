"#simgame"

Currently, this is a linux terminal simulator. It will be more... I have many things I will be wanting to work on, but I welcome first, your insight.

The simgame is a web-based Linux terminal simulator built with Next.js and TypeScript. It provides an interactive experience mimicking a Linux command-line environment for educational or entertainment purposes.

Expected Behavior
-Boot Sequence: Starts with a simulated boot screen displaying system initialization messages.

-Authentication: Users log in with a username and password. New users go through a setup wizard to create their account, set a root password, and configure basic system details.

-Terminal Interface: After login, users enter a terminal emulator where they can execute Linux commands. The interface displays:

-A prompt showing username, hostname, and current directory (e.g., user@linux-sim:/home/user$)
-Command history and output
-Support for basic editing (backspace, etc.)
-Filesystem Simulation: Uses a virtual filesystem stored in localStorage with:

-Full directory structure (/bin, /home, /etc, etc.)
-User accounts and permissions (root and regular users)
-File operations (create, read, write, delete)
-Realistic file metadata (permissions, ownership, timestamps)
-Command Support: Implements numerous Linux commands including:

-File management: ls, cd, pwd, mkdir, rmdir, touch, rm, cp, mv
-User management: adduser, userdel, passwd, su, sudo
-Permissions: chmod
-Text processing: cat, grep, echo
-System info: whoami, id
-Network simulation: ping, ifconfig
-Package management: apt for installing simulated packages like nano, nmap
-Utilities: clear, help, man, reboot, save, reset
-Text Editor: nano command opens a built-in editor for file modification.

-Persistence: Game state (filesystem, users, packages) persists across sessions via localStorage.

-Error Handling: Commands validate permissions, file existence, and provide appropriate error messages.


To be done: 

I want to make the monolithic files shorter by adding new files, but last time I tried to refactor everything went terribly wrong, so this time we will go slow and steady. Let's make another file and use it for the (synopsis of all the commands), that way we can get some code out of the Terminal.tsx file to shorten it.  Make sure that any changes you make absolutely do NOT effect the functioning of the game that has already been built. if you need any clarification, ask me for clarification. Make absolutely sure that none of your changes effect the functionaluty of what has already been built.


1.2 revisions and improvements
    - implemented man
    - added rmdir
    - populated bin folder
    - worked on terminal output
    - fixed output alignment bug
    - Updated virtual README.txt
    - implemented title screen and setup
    - implemented auto complete
    - implemented filetypes
1.3 revisions and improvements
    - Implemented root and permissions
    - NANO txt editor
    - populated boot folder
    - added reboot procedure
    - su and sudo commands
    - arrow up for last commands
    - touch bug fixed X
    - player begins in the proper directory.
    - Initial prompt bug fixed
1.4 revisions and improvements
    - faux reboot improved.
    - Permissions improved
    - LOTS of testing
    - solved some fuckery with the command prompt
    - sudo tested preliminarily
    - directory navigation function tested correctly.
    - autocomplete bug addressed
    - permissions testing done. preliminarily
    - adduser and userdel added
    - ***ADDRESSING NEWLY ADDED USER PASSWORD PRONLEM***
1.5 rev & imp
    - Addressed password problem.
    - ignored browser spellcheck
    - fixed autocomplete issue
1.6 rev & imp
    - revamped game start.
        - changed to mimic booting
        - added finctionality back to new login screen
        - squashed bugs
        - improved delete save system
        - fixed bug allowing creation of used user names users used.
    - Attempting to make chmod more understandable.
        - added more info to man page and added a --help to chmod command.
    - Addressing --help on all commands. got about half so far.
1.7 rev & imp
    - --help or -h available on all commands.
    - made char creation backdoor for testing.
    1.7.5 - mid version push
    - implemented apt
    - more testing
    - sorted out created user permissions.
    1.7.6 - mid version push
    - addressed autocomplete bug
    - Improved Nano
    - put passwords in /etc/passwd -- for now...
        - make sure it is not wide open access
1.8 rev & imp
    mid version push
    next bot push. I think the last one may have helped with something.
    - implemented ping command as built-in
        - supports -c (count), -t (timeout), -i (interval) options
        - simulates ICMP echo requests with realistic output format
        - ready for future mock internet integration
            * fake output will have to be replaced when I figure out the in game internet.
    - implemented nmap as APT package
        - supports various scan types (-sn ping scan, -sS SYN scan, -sT connect scan, -sU UDP scan)
        - service version detection (-sV)
        - OS detection (-O)
        - script scanning (-sC, -A for comprehensive scan)
        - realistic output with open ports, service versions, and OS fingerprints
        - ready for integration with mock internet system
            *BS will have to be removed when actual info is available.
        - implemented ifconfig as built-in command
            - displays network interface information (IP, MAC, netmask, status)
            - shows realistic interface details (eth0, lo, wlan0)
            - includes packet statistics (RX/TX packets, errors, etc.)
            - supports interface-specific queries
            - ready for future network configuration and mock internet features
1.9 rev & imp
    - moved man pages to different file to try to shorten the main files a little bit.
    - moved nmap to shorten Terminal.tsx
    - moved apt to shorten Terminal.tsx
    mid version push
    - merged branch back to main
    -
    -
    x figure out email, browser, etcetera


    testing:

          
