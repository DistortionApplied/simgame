export interface Website {
  domain: string;
  ip: string;
  content: string;
  type: 'static' | 'dynamic';
  title?: string;
  lastModified?: string;
}

export interface Service {
  name: string;
  version: string;
  requiresAuth: boolean;
  port: number;
  description?: string;
}

export interface Server {
  ip: string;
  hostname?: string;
  ports: Map<number, Service>;
  owner?: string;
  firewall?: boolean;
  os?: string;
  services?: string[];
}

export interface MockInternetData {
  websites: Website[];
  servers: Server[];
  dns: Map<string, string>;
  playerIP: string;
  gatewayIP: string;
  createdAt: string;
  version: string;
}

export class MockInternet {
  private data: MockInternetData;
  private setupData: any;

  constructor(setupData: any) {
    this.setupData = setupData;
    this.data = this.loadFromLocalStorage() || this.generateNewInternet();
    this.saveToLocalStorage();
  }

  private getStorageKey(): string {
    return `linux-sim-internet-${this.setupData?.playerName || 'user'}`;
  }

  private loadFromLocalStorage(): MockInternetData | null {
    try {
      const stored = localStorage.getItem(this.getStorageKey());
      if (stored) {
        const parsed = JSON.parse(stored);
        // Check version - regenerate if outdated
        if (!parsed.version || parsed.version !== '4.0') {
          console.log('Internet data version outdated, regenerating...', parsed.version, '-> 4.0');
          return null;
        }
        // Convert Maps back from objects
        parsed.dns = new Map(Object.entries(parsed.dns || {}));
        parsed.servers.forEach((server: any) => {
          server.ports = new Map(Object.entries(server.ports || {}));
        });
        return parsed;
      }
    } catch (error) {
      console.error('Failed to load internet data:', error);
    }
    return null;
  }

  private saveToLocalStorage(): void {
    try {
      const dataToSave = {
        ...this.data,
        dns: Object.fromEntries(this.data.dns),
        servers: this.data.servers.map(server => ({
          ...server,
          ports: Object.fromEntries(server.ports)
        }))
      };
      localStorage.setItem(this.getStorageKey(), JSON.stringify(dataToSave));
    } catch (error) {
      console.error('Failed to save internet data:', error);
    }
  }

  private generateNewInternet(): MockInternetData {
    const playerIP = this.generateRandomIP();
    const gatewayIP = this.generateGatewayIP(playerIP);

    // Generate DNS records
    const dns = new Map<string, string>();

    // Generate websites
    const websites: Website[] = this.generateWebsites();

    // Add website domains to DNS
    websites.forEach(website => {
      dns.set(website.domain, website.ip);
    });

    // Generate servers
    const servers: Server[] = this.generateServers();

    // Add server hostnames to DNS if they have them
    servers.forEach(server => {
      if (server.hostname) {
        dns.set(server.hostname, server.ip);
      }
    });

    return {
      websites,
      servers,
      dns,
      playerIP,
      gatewayIP,
      createdAt: new Date().toISOString(),
     version: '5.0' // Increment when templates change
    };
  }

  private generateRandomIP(): string {
    // Generate a random private IP (192.168.x.x or 10.x.x.x)
    const networks = ['192.168', '10.0'];
    const network = networks[Math.floor(Math.random() * networks.length)];
    const subnet = Math.floor(Math.random() * 254) + 1;
    const host = Math.floor(Math.random() * 254) + 1;
    return `${network}.${subnet}.${host}`;
  }

  private generateGatewayIP(playerIP: string): string {
    // Gateway is typically .1 in the same subnet
    const parts = playerIP.split('.');
    parts[3] = '1';
    return parts.join('.');
  }

  private generateWebsites(): Website[] {
    const domains = [
      'google.com',
      'github.com',
      'stackoverflow.com',
      'wikipedia.org',
      'reddit.com',
      'youtube.com',
      'amazon.com',
      'netflix.com',
      'facebook.com',
      'twitter.com',
      'example.com',
      'test.com',
      'localhost'
    ];

    const websites: Website[] = [];

    domains.forEach(domain => {
      const ip = this.generateRandomIP();
      websites.push({
        domain,
        ip,
        content: this.generateWebsiteContent(domain),
        type: 'static',
        title: domain.charAt(0).toUpperCase() + domain.slice(1),
        lastModified: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    });

    return websites;
  }

 private generateWebsiteContent(domain: string): string {
    // Generate simple HTML-like content for websites
    const templates = {
      'google.com': `
        <h1>Google</h1>
        <input placeholder="Search Google or type a URL">
        <button>Google Search</button>
        <button>I'm Feeling Lucky</button>
        <p>Google offered in: <a>Français</a> <a>Español</a></p>
        <div>
        <a>About</a> <a>Advertising</a> <a>Business</a> <a>How Search works</a>
        <a>Privacy</a> <a>Terms</a> <a>Settings</a>
        </div>
      `,
      'github.com': `
        <html>
        <head><title>GitHub</title></head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Helvetica, Arial, sans-serif; margin: 0; padding: 0; background: #0d1117; color: #f0f6fc;">
        <div style="border-bottom: 1px solid #30363d; padding: 16px 32px; display: flex; align-items: center; justify-content: space-between;">
        <div style="display: flex; align-items: center; gap: 16px;">
        <h1 style="color: #f0f6fc; font-size: 24px; font-weight: 600; margin: 0;">GitHub</h1>
        <nav style="display: flex; gap: 16px; font-size: 14px;">
        <a href="#" style="color: #f0f6fc; text-decoration: none;">Product</a>
        <a href="#" style="color: #f0f6fc; text-decoration: none;">Solutions</a>
        <a href="#" style="color: #f0f6fc; text-decoration: none;">Open Source</a>
        <a href="#" style="color: #f0f6fc; text-decoration: none;">Pricing</a>
        </nav>
        </div>
        <div style="display: flex; gap: 8px;">
        <input type="text" placeholder="Search or jump to..." style="background: #21262d; border: 1px solid #30363d; border-radius: 6px; padding: 8px 12px; color: #f0f6fc; width: 200px;">
        <button style="background: #238636; color: #f0f6fc; border: none; border-radius: 6px; padding: 8px 16px; font-weight: 500;">Sign in</button>
        </div>
        </div>

        <div style="padding: 80px 32px; text-align: center;">
        <h1 style="font-size: 48px; font-weight: 600; color: #f0f6fc; margin-bottom: 24px;">Where the world builds software</h1>
        <p style="font-size: 20px; color: #c9d1d9; margin-bottom: 32px; max-width: 600px; margin-left: auto; margin-right: auto;">Millions of developers and companies build, ship, and maintain their software on GitHub—the largest and most advanced development platform in the world.</p>
        <div style="display: flex; justify-content: center; gap: 16px;">
        <button style="background: #238636; color: #f0f6fc; border: none; border-radius: 6px; padding: 12px 24px; font-size: 16px; font-weight: 500;">Get started for free</button>
        <button style="background: #21262d; color: #f0f6fc; border: 1px solid #30363d; border-radius: 6px; padding: 12px 24px; font-size: 16px;">Start a free trial</button>
        </div>
        </div>

        <div style="background: #161b22; border-top: 1px solid #30363d; padding: 40px 32px; margin-top: 80px;">
        <div style="max-width: 1200px; margin: 0 auto; display: flex; justify-content: space-between;">
        <div>
        <h3 style="color: #f0f6fc; margin-bottom: 16px;">Product</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Features</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Security</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Team</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Enterprise</a>
        </div>
        </div>
        <div>
        <h3 style="color: #f0f6fc; margin-bottom: 16px;">Platform</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Developer API</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Partners</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Atom</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Electron</a>
        </div>
        </div>
        <div>
        <h3 style="color: #f0f6fc; margin-bottom: 16px;">Support</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Help</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Community Forum</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Professional Services</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Status</a>
        </div>
        </div>
        <div>
        <h3 style="color: #f0f6fc; margin-bottom: 16px;">Company</h3>
        <div style="display: flex; flex-direction: column; gap: 8px;">
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">About</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Blog</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Careers</a>
        <a href="#" style="color: #c9d1d9; text-decoration: none; font-size: 14px;">Press</a>
        </div>
        </div>
        </div>
        </div>
        </body>
        </html>
      `,
      'stackoverflow.com': `
        <html>
        <head><title>Stack Overflow</title></head>
        <body>
        <h1>Stack Overflow</h1>
        <p>Where developers learn, share, & build careers</p>
        </body>
        </html>
      `,
      'wikipedia.org': `
        <html>
        <head><title>Wikipedia</title></head>
        <body>
        <h1>Wikipedia</h1>
        <p>The Free Encyclopedia</p>
        <p>Wikipedia is a multilingual free online encyclopedia written and maintained by a community of volunteers.</p>
        </body>
        </html>
      `,
      'default': `
        <html>
        <head><title>${domain}</title></head>
        <body>
        <h1>Welcome to ${domain}</h1>
        <p>This is a simulated website in the mock internet.</p>
        <p>Domain: ${domain}</p>
        </body>
        </html>
      `
    };

    return templates[domain as keyof typeof templates] || templates.default.replace('${domain}', domain);
  }

  private generateServers(): Server[] {
    const servers: Server[] = [];

    // Generate some random servers
    for (let i = 0; i < 10; i++) {
      const ip = this.generateRandomIP();
      const ports = new Map<number, Service>();

      // Add common services
      const services = [
        { port: 22, name: 'ssh', version: 'OpenSSH 8.2p1', requiresAuth: true },
        { port: 80, name: 'http', version: 'Apache 2.4.41', requiresAuth: false },
        { port: 443, name: 'https', version: 'Apache 2.4.41', requiresAuth: false },
        { port: 21, name: 'ftp', version: 'vsftpd 3.0.3', requiresAuth: true },
        { port: 23, name: 'telnet', version: 'telnetd', requiresAuth: true },
        { port: 25, name: 'smtp', version: 'Postfix', requiresAuth: false },
        { port: 53, name: 'domain', version: 'BIND 9.16.1', requiresAuth: false },
        { port: 110, name: 'pop3', version: 'Dovecot', requiresAuth: true },
        { port: 143, name: 'imap', version: 'Dovecot', requiresAuth: true }
      ];

      // Randomly assign some services to this server
      const numServices = Math.floor(Math.random() * 5) + 1;
      const shuffledServices = services.sort(() => 0.5 - Math.random());
      shuffledServices.slice(0, numServices).forEach(service => {
        ports.set(service.port, {
          name: service.name,
          version: service.version,
          requiresAuth: service.requiresAuth,
          port: service.port
        });
      });

      servers.push({
        ip,
        ports,
        firewall: Math.random() < 0.3, // 30% chance of firewall
        os: this.randomOS(),
        services: Array.from(ports.values()).map(s => s.name)
      });
    }

    return servers;
  }

 private randomOS(): string {
    const os = [
      'Ubuntu 20.04',
      'CentOS 7',
      'Debian 10',
      'Fedora 33',
      'Arch Linux',
      'Windows Server 2019',
      'FreeBSD 12',
      'OpenBSD 6.8'
    ];
    return os[Math.floor(Math.random() * os.length)];
  }

  // Public API methods
  resolveDomain(domain: string): string | null {
    return this.data.dns.get(domain.toLowerCase()) || null;
  }

  getWebsiteByDomain(domain: string): Website | null {
    return this.data.websites.find(w => w.domain.toLowerCase() === domain.toLowerCase()) || null;
  }

  getWebsiteByIP(ip: string): Website | null {
    return this.data.websites.find(w => w.ip === ip) || null;
  }

  getServerByIP(ip: string): Server | null {
    return this.data.servers.find(s => s.ip === ip) || null;
  }

  getAllWebsites(): Website[] {
    return [...this.data.websites];
  }

  getAllServers(): Server[] {
    return [...this.data.servers];
  }

  getPlayerIP(): string {
    return this.data.playerIP;
  }

  getGatewayIP(): string {
    return this.data.gatewayIP;
  }

  isHostReachable(ip: string): boolean {
    // Check if IP exists in our mock internet
    return this.data.servers.some(s => s.ip === ip) ||
           this.data.websites.some(w => w.ip === ip) ||
           ip === this.data.playerIP ||
           ip === this.data.gatewayIP;
  }

  getDNSEntries(): Array<[string, string]> {
    return Array.from(this.data.dns.entries());
  }
}