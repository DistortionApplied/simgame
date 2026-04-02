import { MockInternet } from './internet';

export function executeNmap(
  args: string[],
  setupData: any,
  isPackageInstalled: (name: string) => boolean,
  AVAILABLE_PACKAGES: any,
  mockInternet: MockInternet | null
): { output?: string; error?: string } {
  if (args.includes('-h') || args.includes('--help')) {
    return {
      output: `Nmap 7.91 ( https://nmap.org )
Usage: nmap [Scan Type(s)] [Options] {target specification}
TARGET SPECIFICATION:
  Can pass hostnames, IP addresses, networks, etc.
  Ex: scanme.nmap.org, microsoft.com/24, 192.168.0.1; 10.0.0-255.1-254
  -iL <inputfilename>: Input from list of hosts/networks
  -iR <num hosts>: Choose random targets
  --exclude <host1[,host2][,host3],...>: Exclude hosts/networks
  --excludefile <exclude_file>: Exclude list from file
HOST DISCOVERY:
  -sL: List Scan - simply list targets to scan
  -sn: Ping Scan - disable port scan
  -Pn: Treat all hosts as online -- skip host discovery
  -PS/PA/PU/PY[portlist]: TCP SYN/ACK, UDP or SCTP discovery to given ports
  -PE/PP/PM: ICMP echo, timestamp, and netmask request discovery probes
  -PO[protocol list]: IP Protocol Ping
  -n/-R: Never do DNS resolution/Always resolve [default: sometimes]
  --dns-servers <serv1[,serv2],...>: Specify custom DNS servers
  --system-dns: Use OS's DNS resolver
  --traceroute: Trace hop path to each host
SCAN TECHNIQUES:
  -sS/sT/sA/sW/sM: TCP SYN/Connect()/ACK/Window/Maimon scans
  -sU: UDP Scan
  -sN/sF/sX: TCP Null, FIN, and Xmas scans
  --scanflags <flags>: Customize TCP scan flags
  -sI <zombie host[:probeport]>: Idle scan
  -sY/sZ: SCTP INIT/COOKIE-ECHO scans
  -sO: IP protocol scan
  -b <FTP relay host>: FTP bounce scan
PORT SPECIFICATION AND SCAN ORDER:
  -p <port ranges>: Only scan specified ports
    Ex: -p22; -p1-65535; -p U:53,111,137,T:21-25,80,139,8080,S:9
  --exclude-ports <port ranges>: Exclude the specified ports from scanning
  -F: Fast mode - Scan fewer ports than the default scan
  -r: Scan ports consecutively - don't randomize
  --top-ports <number>: Scan <number> most common ports
  --port-ratio <ratio>: Scan ports more common than <ratio>
SERVICE/VERSION DETECTION:
  -sV: Probe open ports to determine service/version info
  --version-intensity <level>: Set from 0 (light) to 9 (try all probes)
  --version-light: Limit to most likely probes (intensity 2)
  --version-all: Try every single probe (intensity 9)
  --version-trace: Show detailed version scan activity (for debugging)
SCRIPT SCAN:
  -sC: equivalent to --script=default
  --script=<Lua scripts>: <Lua scripts> is a comma separated list of
           directories, script-files or script-categories
  --script-args=<n1=v1,[n2=v2,...]>: provide arguments to scripts
  --script-args-file=filename: provide NSE script args in a file
  --script-trace: Show all data sent and received
  --script-updatedb: Update the script database
  --script-help=<Lua scripts>: Show help about scripts.
           <Lua scripts> is a comma separated list of script-files or
           script-categories.
OS DETECTION:
  -O: Enable OS detection
  --osscan-limit: Limit OS detection to promising targets
  --osscan-guess: Guess OS more aggressively
TIMING AND PERFORMANCE:
  Options which take <time> are in seconds, or append 'ms' (milliseconds),
  's' (seconds), 'm' (minutes), or 'h' (hours) to the value (e.g. 30m).
  -T<0-5>: Set timing template (higher is faster)
  --min-hostgroup/max-hostgroup <size>: Parallel host scan group sizes
  --min-parallelism/max-parallelism <numprobes>: Probe parallelization
  --min-rtt-timeout/max-rtt-timeout/initial-rtt-timeout <time>: Specifies
      probe round trip time.
  --max-retries <tries>: Caps number of port scan probe retransmissions.
  --host-timeout <time>: Give up on target after this long
  --scan-delay/--max-scan-delay <time>: Adjust delay between probes
  --min-rate <number>: Send packets no slower than <number> per second
  --max-rate <number>: Send packets no faster than <number> per second
FIREWALL/IDS EVASION AND SPOOFING:
  -f; --mtu <val>: fragment packets (optionally w/given MTU)
  -D <decoy1,decoy2[,ME],...>: Cloak a scan with decoys
  -S <IP_Address>: Spoak source address
  -e <iface>: Use specified interface
  -g/--source-port <portnum>: Use given port number
  --proxies <url1,[url2],...>: Relay connections through HTTP/SOCKS4 proxies
  --data <hex string>: Append a custom payload to sent packets
  --data-string <string>: Append a custom ASCII string to sent packets
  --data-length <num>: Append random data to sent packets
  --ip-options <options>: Send packets with specified ip options
  --ttl <val>: Set IP time-to-live field
  --spoof-mac <mac address/prefix/vendor name>: Spoof your MAC address
  --badsum: Send packets with a bogus TCP/UDP/SCTP checksum
OUTPUT:
  -oN/-oX/-oS/-oG <file>: Output scan in normal, XML, s|<rIpt kIddi3,
     and Grepable format, respectively, to the given filename.
  -oA <basename>: Output in the three major formats at once
  -v: Increase verbosity level (use -vv or more for greater effect)
  -d: Increase debugging level (use -dd or more for greater effect)
  -oN/-oX/-oS/-oG <file>: Output scan in normal, XML, s|<rIpt kIddi3,
     and Grepable format, respectively, to the given filename.
  -oA <basename>: Output in the three major formats at once
  -v: Increase verbosity level (use -vv or more for greater effect)
  -d: Increase debugging level (use -dd or more for greater effect)
  --reason: Display the reason a port is in a particular state
  --open: Only show open (or possibly open) ports
  --packet-trace: Show all packets sent and received
  --iflist: Print host interfaces and routes (for debugging)
  --append-output: Append to rather than clobber specified output files
  --resume <filename>: Resume an aborted scan
  --stylesheet <path/URL>: XSL stylesheet to transform XML output to HTML
  --webxml: Reference stylesheet from Nmap.Org for more portable XML
  --no-stylesheet: Prevent associating of XSL stylesheet w/XML output
MISC:
  -6: Enable IPv6 scanning
  -A: Enable OS detection, version detection, script scanning, and traceroute
  --datadir <dirname>: Specify custom Nmap data file location
  --send-eth/--send-ip: Send using raw ethernet frames or IP packets
  --privileged: Assume that the user is fully privileged
  --unprivileged: Assume that the user lacks raw socket privileges
  -V: Print version number
  -h: Print this help summary page.
EXAMPLES:
  nmap -v -A scanme.nmap.org
  nmap -v -sn 192.168.0.0/16 10.0.0.0/8
  nmap -v -iR 10000 -Pn -p 80
SEE THE MAN PAGE (https://nmap.org/book/man.html) FOR MORE OPTIONS AND EXAMPLES`
    };
  } else if (!isPackageInstalled('nmap')) {
    return { error: 'nmap: command not found\nTry: apt install nmap' };
  } else {
    // Parse nmap arguments
    let targets: string[] = [];
    let scanType = 'syn'; // Default scan type
    let portRange = '1-1000'; // Default port range
    let timingTemplate = 3; // Default timing
    let verbose = false;
    let osDetection = false;
    let versionDetection = false;
    let scriptScan = false;

    // Simple argument parsing
    for (let i = 0; i < args.length; i++) {
      const arg = args[i];
      if (arg === '-sn' || arg === '-sP') {
        scanType = 'ping';
      } else if (arg === '-sS') {
        scanType = 'syn';
      } else if (arg === '-sT') {
        scanType = 'connect';
      } else if (arg === '-sU') {
        scanType = 'udp';
      } else if (arg === '-sV') {
        versionDetection = true;
      } else if (arg === '-O') {
        osDetection = true;
      } else if (arg === '-sC') {
        scriptScan = true;
      } else if (arg === '-A') {
        osDetection = true;
        versionDetection = true;
        scriptScan = true;
      } else if (arg === '-p') {
        portRange = args[i + 1] || portRange;
        i++; // Skip next arg
      } else if (arg.startsWith('-T')) {
        timingTemplate = parseInt(arg.substring(2)) || 3;
      } else if (arg === '-v' || arg === '-vv') {
        verbose = true;
      } else if (!arg.startsWith('-')) {
        targets.push(arg);
      }
    }

    if (targets.length === 0) {
      return { error: 'nmap: missing target specification\nTry: nmap --help' };
    }

    // Simulate nmap scan results using mock internet
    const simulateNmapScan = (target: string, type: string) => {
      const lines: string[] = [];

      lines.push(`Starting Nmap ${AVAILABLE_PACKAGES.nmap.version} ( https://nmap.org ) at ${new Date().toISOString().split('T')[0].replace(/-/g, '/')} ${new Date().toTimeString().split(' ')[0]} EDT`);

      // Resolve target to IP
      let ip = target;
      if (!/^\d+\.\d+\.\d+\.\d+$/.test(target)) {
        if (mockInternet) {
          ip = mockInternet.resolveDomain(target) || target;
        } else {
          ip = `192.168.1.${Math.floor(Math.random() * 254) + 1}`;
        }
      }

      // Check if host exists in mock internet
      const server = mockInternet ? mockInternet.getServerByIP(ip) : null;
      const website = mockInternet ? mockInternet.getWebsiteByIP(ip) : null;
      const isReachable = mockInternet ? mockInternet.isHostReachable(ip) : true;

      if (!isReachable) {
        lines.push(`Nmap scan report for ${target} (${ip})`);
        lines.push(`Host is down.`);
        lines.push(`Nmap done: 1 IP address (0 hosts up) scanned in ${Math.random().toFixed(2)} seconds`);
        return lines.join('\n');
      }

      if (type === 'ping') {
        // Ping scan
        lines.push(`Nmap scan report for ${target} (${ip})`);
        lines.push(`Host is up (${(Math.random() * 5 + 0.1).toFixed(2)}s latency).`);
        lines.push(`Nmap done: 1 IP address (1 host up) scanned in ${Math.random().toFixed(2)} seconds`);
      } else {
        // Port scan
        lines.push(`Nmap scan report for ${target} (${ip})`);
        lines.push(`Host is up (${(Math.random() * 5 + 0.1).toFixed(2)}s latency).`);

        if (type !== 'ping') {
          if (server && server.ports.size > 0) {
            lines.push('PORT      STATE    SERVICE');
            const portsArray = Array.from(server.ports.entries());
            portsArray.forEach(([port, service]) => {
              let state = 'open';
              if (server.firewall && Math.random() < 0.7) { // Firewall blocks some ports
                state = 'filtered';
              }
              let versionInfo = '';
              if (versionDetection) {
                versionInfo = ` ${service.version}`;
              }
              lines.push(`${port}/tcp   ${state}    ${service.name}${versionInfo}`);
            });
          } else if (website) {
            // Websites typically have HTTP/HTTPS
            lines.push('PORT      STATE    SERVICE');
            const webPorts = [
              { port: 80, service: 'http', version: 'Apache httpd 2.4.41' },
              { port: 443, service: 'https', version: 'Apache httpd 2.4.41' }
            ];
            webPorts.forEach(({ port, service, version }) => {
              let versionInfo = '';
              if (versionDetection) {
                versionInfo = ` ${version}`;
              }
              lines.push(`${port}/tcp   open    ${service}${versionInfo}`);
            });
          } else {
            // Fallback to random ports if no server data
            lines.push('Not shown: 997 closed ports');
            lines.push('PORT      STATE    SERVICE');
            const commonPorts = [
              { port: 22, service: 'ssh', version: 'OpenSSH 8.2p1 Ubuntu 4ubuntu0.3' },
              { port: 80, service: 'http', version: 'Apache httpd 2.4.41' },
              { port: 443, service: 'https', version: 'Apache httpd 2.4.41' }
            ];
            const openPorts = commonPorts.filter(() => Math.random() < 0.3);
            openPorts.forEach(({ port, service, version }) => {
              let versionInfo = '';
              if (versionDetection) {
                versionInfo = ` ${version}`;
              }
              lines.push(`${port}/tcp   open    ${service}${versionInfo}`);
            });
          }
        }

        if (osDetection && server?.os) {
          lines.push('');
          lines.push('OS detection performed. Please report any incorrect results at https://nmap.org/submit/ .');
          lines.push(`Nmap scan report for ${target} (${ip})`);
          lines.push(`OS details: ${server.os}`);
          // Add some variation
          const similarOS = [
            server.os,
            server.os.replace(/\d+/g, (match) => (parseInt(match) + Math.floor(Math.random() * 3) - 1).toString()),
            server.os.replace(/Linux|Windows|FreeBSD/gi, (match) => match === 'Linux' ? 'Ubuntu' : match === 'Ubuntu' ? 'Linux' : match)
          ].filter((os, index, arr) => arr.indexOf(os) === index);
          similarOS.forEach((os, index) => {
            lines.push(`${index + 1}. ${os}`);
          });
        }

        lines.push(`Nmap done: 1 IP address (1 host up) scanned in ${(Math.random() * 10 + 1).toFixed(2)} seconds`);
      }

      return lines.join('\n');
    };

    return { output: targets.map(target => simulateNmapScan(target, scanType)).join('\n\n') };
  }
}