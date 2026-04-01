"#simgame"

Currently, this is a linux terminal simulator. It will be more... I have many things I will be wanting to work on, but I welcome first, your insight.


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
    x figure out email, browser, etcetera


    testing:

          
