import { SLICKIPEDIA_HTML } from './slickipedia-template';

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

export interface EmailAccount {
  email: string;
  password: string;
  displayName: string;
  createdAt: string;
}

export interface Attachment {
  name: string;
  content: string;
  type: string;
}

export interface Email {
  id: string;
  from: string;
  to: string;
  cc?: string[];
  bcc?: string[];
  subject: string;
  body: string;
  timestamp: string;
  read: boolean;
  starred: boolean;
  labels: string[];
  threadId: string;
  attachments?: Attachment[];
  replyTo?: string;
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

export interface BankAccount {
  accountNumber: string;
  balance: number;
  transactions: BankTransaction[];
  createdAt: string;
}

export interface BankTransaction {
  id: string;
  type: 'deposit' | 'withdrawal' | 'transfer';
  amount: number;
  description: string;
  timestamp: string;
}

export interface MockInternetData {
  websites: Website[];
  servers: Server[];
  dns: Map<string, string>;
  emails: Email[];
  emailAccounts: EmailAccount[];
  bankAccount?: BankAccount;
  websiteVisits: Set<string>;
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
        if (!parsed.version || parsed.version !== '21.0') {
          console.log('Internet data version outdated, regenerating...', parsed.version, '-> 21.0');
          return null;
        }
        // Convert Maps back from objects
        parsed.dns = new Map(Object.entries(parsed.dns || {}));
        parsed.servers.forEach((server: any) => {
          server.ports = new Map(Object.entries(server.ports || {}));
        });
        // Ensure new fields exist for backward compatibility
        parsed.emails = (parsed.emails || []).map((email: any) => ({
          ...email,
          starred: email.starred ?? false,
          labels: email.labels ?? ['inbox'],
          threadId: email.threadId ?? email.id,
          cc: email.cc ?? [],
          bcc: email.bcc ?? [],
          attachments: email.attachments ?? []
        }));
        parsed.emailAccounts = parsed.emailAccounts || [];
        parsed.bankAccount = parsed.bankAccount || undefined;
        parsed.websiteVisits = new Set(parsed.websiteVisits || []);
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
        })),
        websiteVisits: Array.from(this.data.websiteVisits)
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
      emails: [],
      emailAccounts: [],
      bankAccount: undefined,
      websiteVisits: new Set(),
      playerIP,
      gatewayIP,
      createdAt: new Date().toISOString(),
      version: '21.0' // Increment when templates change
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
      'googo.com',
      'glitchub.com',
      'slickipedia.org',
      'readdit.com',
      'viewtube.com',
      'spamazon.com',
      'facespace.com',
      'skitter.com',
      'geemail.com',
      'chastebank.com',
      'example.com',
      'test.com',
      'localhost'
    ];

    const websites: Website[] = [];

    domains.forEach(domain => {
      const ip = this.generateRandomIP();
      let title = domain.charAt(0).toUpperCase() + domain.slice(1);

      // Give better titles for specific sites
      const titleMap: Record<string, string> = {
        'googo.com': 'Googo',
        'glitchub.com': 'GlitChub',
        'slickipedia.org': 'Slickipedia',
        'readdit.com': 'Readdit',
        'viewtube.com': 'ViewTube',
        'spamazon.com': 'Spamazon',
        'facespace.com': 'FaceSpace',
        'skitter.com': 'Skitter',
        'geemail.com': 'GeeMail',
        'chastebank.com': 'Chaste Bank'
      };

      if (titleMap[domain]) {
        title = titleMap[domain];
      }

      websites.push({
        domain,
        ip,
        content: this.generateWebsiteContent(domain),
        type: 'static',
        title,
        lastModified: new Date(Date.now() - Math.random() * 365 * 24 * 60 * 60 * 1000).toISOString()
      });
    });

    return websites;
  }

 private generateWebsiteContent(domain: string): string {
    // Generate simple HTML-like content for websites
    const templates = {
      'slickipedia.org': SLICKIPEDIA_HTML,
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

  whois(domain: string): string | null {
    const website = this.getWebsiteByDomain(domain);
    if (!website) {
      return null;
    }

    // Use actual website data for consistency
    const createdDate = new Date(website.lastModified || Date.now() - 365 * 24 * 60 * 60 * 1000);
    const updatedDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);
    const expiryDate = new Date(createdDate.getTime() + 365 * 24 * 60 * 60 * 1000); // 1 year expiry

    // Simple registrar assignment based on domain for consistency
    const registrarMap: Record<string, string> = {
      'googo.com': 'GoDaddy LLC',
      'glitchub.com': 'GlitChub Inc.',
      'slickipedia.org': 'Slickipedia Foundation',
      'readdit.com': 'Readdit Corp.',
      'viewtube.com': 'ViewTube LLC',
      'spamazon.com': 'Spamazon Inc.',
      'facespace.com': 'FaceSpace Ltd.',
      'skitter.com': 'Skitter Media',
      'default': 'Network Solutions LLC'
    };
    const registrar = registrarMap[domain] || registrarMap.default;

    return `Domain Name: ${website.domain}
IP Address: ${website.ip}
Registrar: ${registrar}
Creation Date: ${createdDate.toISOString().split('T')[0]}
Updated Date: ${updatedDate.toISOString().split('T')[0]}
Expiry Date: ${expiryDate.toISOString().split('T')[0]}
Name Server: ns1.${domain.split('.').slice(-2).join('.')}
Name Server: ns2.${domain.split('.').slice(-2).join('.')}
Status: Active

>>> Last update of WHOIS database: ${new Date().toISOString().split('T')[0]} <<<`;
  }

  // Email methods
  getEmails(): Email[] {
    return [...this.data.emails];
  }

  addEmail(email: Email): void {
    this.data.emails.push(email);
    this.saveToLocalStorage();
  }

  getEmailAccounts(): EmailAccount[] {
    return [...this.data.emailAccounts];
  }

  createEmailAccount(account: EmailAccount): boolean {
    // Check if account already exists
    if (this.data.emailAccounts.some(acc => acc.email === account.email)) {
      return false;
    }
    this.data.emailAccounts.push(account);
    this.saveToLocalStorage();
    return true;
  }

  getEmailAccount(email: string): EmailAccount | null {
    return this.data.emailAccounts.find(acc => acc.email === email) || null;
  }

  authenticateEmailAccount(email: string, password: string): boolean {
    const account = this.getEmailAccount(email);
    return account ? account.password === password : false;
  }

  // Website visit tracking
  recordWebsiteVisit(domain: string, setupData: any): void {
    this.data.websiteVisits.add(domain);
    this.saveToLocalStorage();

    // Special handling for geemail.com - create account on first visit
    if (domain === 'geemail.com' && setupData?.playerName) {
      const playerEmail = `${setupData.playerName}@geemail.com`;
      if (!this.getEmailAccount(playerEmail)) {
        this.createEmailAccount({
          email: playerEmail,
          password: setupData.userPassword,
          displayName: setupData.playerName,
          createdAt: new Date().toISOString()
        });
      }
    }
  }

  hasVisitedWebsite(domain: string): boolean {
    return this.data.websiteVisits.has(domain);
  }

  // Enhanced email management methods
  markEmailAsRead(emailId: string, read: boolean = true): void {
    const email = this.data.emails.find(e => e.id === emailId);
    if (email) {
      email.read = read;
      this.saveToLocalStorage();
    }
  }

  starEmail(emailId: string, starred: boolean = true): void {
    const email = this.data.emails.find(e => e.id === emailId);
    if (email) {
      email.starred = starred;
      this.saveToLocalStorage();
    }
  }

  addLabelToEmail(emailId: string, label: string): void {
    const email = this.data.emails.find(e => e.id === emailId);
    if (email && !email.labels.includes(label)) {
      email.labels.push(label);
      this.saveToLocalStorage();
    }
  }

  removeLabelFromEmail(emailId: string, label: string): void {
    const email = this.data.emails.find(e => e.id === emailId);
    if (email) {
      email.labels = email.labels.filter(l => l !== label);
      this.saveToLocalStorage();
    }
  }

  moveEmailToTrash(emailId: string): void {
    this.addLabelToEmail(emailId, 'trash');
    this.removeLabelFromEmail(emailId, 'inbox');
  }

  archiveEmail(emailId: string): void {
    this.addLabelToEmail(emailId, 'archive');
    this.removeLabelFromEmail(emailId, 'inbox');
  }

  deleteEmail(emailId: string): void {
    this.data.emails = this.data.emails.filter(e => e.id !== emailId);
    this.saveToLocalStorage();
  }

  getEmailsByLabel(label: string): Email[] {
    return this.data.emails.filter(email => email.labels.includes(label));
  }

  getThreadEmails(threadId: string): Email[] {
    return this.data.emails.filter(email => email.threadId === threadId)
      .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());
  }

  createReplyEmail(originalEmail: Email, replyBody: string, playerEmail: string): Email {
    const replyEmail: Email = {
      id: Date.now().toString(),
      from: playerEmail,
      to: originalEmail.from,
      subject: originalEmail.subject.startsWith('Re: ') ? originalEmail.subject : `Re: ${originalEmail.subject}`,
      body: replyBody,
      timestamp: new Date().toISOString(),
      read: true,
      starred: false,
      labels: ['sent'],
      threadId: originalEmail.threadId,
      replyTo: originalEmail.id
    };
    return replyEmail;
  }

  searchEmails(query: string, currentUserEmail?: string): Email[] {
    const lowerQuery = query.toLowerCase();
    return this.data.emails.filter(email => {
      // Only search in inbox, sent, archive for current user, unless no currentUserEmail specified
      const userEmails = currentUserEmail ? [currentUserEmail] : [];
      const isRelevant = !currentUserEmail ||
        email.from === currentUserEmail ||
        email.to === currentUserEmail ||
        (email.cc && email.cc.includes(currentUserEmail)) ||
        (email.bcc && email.bcc.includes(currentUserEmail));

      if (!isRelevant) return false;

      return email.from.toLowerCase().includes(lowerQuery) ||
             email.to.toLowerCase().includes(lowerQuery) ||
             email.subject.toLowerCase().includes(lowerQuery) ||
             email.body.toLowerCase().includes(lowerQuery);
    });
  }

  // Banking methods
  getBankAccount(): BankAccount | null {
    return this.data.bankAccount || null;
  }

  createBankAccount(): BankAccount {
    if (this.data.bankAccount) {
      return this.data.bankAccount;
    }

    const newAccount: BankAccount = {
      accountNumber: this.generateAccountNumber(),
      balance: 420, // Starting balance
      transactions: [{
        id: this.generateTransactionId(),
        type: 'deposit',
        amount: 420,
        description: 'Welcome bonus - Account opening',
        timestamp: new Date().toISOString()
      }],
      createdAt: new Date().toISOString()
    };

    this.data.bankAccount = newAccount;
    this.saveToLocalStorage();
    return newAccount;
  }

  addBankTransaction(type: 'deposit' | 'withdrawal' | 'transfer', amount: number, description: string): boolean {
    if (!this.data.bankAccount) {
      this.createBankAccount();
    }

    const account = this.data.bankAccount!;
    const transaction: BankTransaction = {
      id: this.generateTransactionId(),
      type,
      amount,
      description,
      timestamp: new Date().toISOString()
    };

    const newBalance = type === 'deposit' ? account.balance + amount :
                      type === 'withdrawal' ? account.balance - amount :
                      account.balance - amount; // transfer out

    if (newBalance < 0 && type === 'withdrawal') {
      return false; // Insufficient funds
    }

    account.balance = newBalance;
    account.transactions = [transaction, ...account.transactions];
    this.saveToLocalStorage();
    return true;
  }

  getBankBalance(): number {
    return this.data.bankAccount?.balance || 0;
  }

  private generateAccountNumber(): string {
    return 'CB' + Math.random().toString().substr(2, 10);
  }

  private generateTransactionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }
}