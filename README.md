# simgame

A single-player Linux terminal simulator with a fully simulated mock internet, inspired by *Grey Hack*.

Built with Next.js and TypeScript. All networking, websites, and services are 100% simulated — no real internet connections.

## Features

### Core Linux Terminal
- Realistic boot sequence and login flow
- Full virtual filesystem with permissions, users, and persistence (localStorage)
- Dozens of implemented commands: `ls`, `cd`, `mkdir`, `rm`, `cat`, `nano`, `apt`, `ping`, `nmap`, `ifconfig`, `whois`, `su`, `sudo`, `chmod`, and many more
- Command history, autocomplete, and `--help` / `man` support

### Mock Internet (Grey Hack Style)
- In-game browser with realistic navigation, history, back/refresh/home buttons
- Procedurally generated websites (Googo, Geemail, Spamazon, ViewTube, Glitchub, Slikipedia, Readdit, Skitter, etc.)
- DNS resolution, IP addresses, and server simulation
- `nmap`, `ping`, `whois`, and `ifconfig` integrate with the mock internet
- All content and services are fully simulated

### Persistence & Polish
- Game state (filesystem, users, packages, internet data) saved across sessions
- Old save data is automatically cleaned up
- Nano text editor, package management, and user permission system

## Getting Started

```bash
git clone https://github.com/DistortionApplied/simgame.git
cd simgame
npm install
npm run dev
```

Open http://localhost:3000 in your browser.

## Development

- `npm run dev` — Start development server
- `npm run build` — Production build
- `npm run lint` — Run ESLint
- `npm run typecheck` — TypeScript type checking (if configured)

## Roadmap & Focus Areas

**Current Priorities**
- Improve documentation and code clarity
- Enhance mock internet realism (apt update/upgrade, dynamic websites, loading states)
- Make browser and websites feel more like Grey Hack single-player

**Future Goals**
- More interactive websites (search, email, shopping, forums)
- Better nmap/port scanning and firewall simulation
- Additional Grey Hack-inspired mechanics

All networking remains 100% simulated. We maintain strict backward compatibility with existing saves and terminal behavior.

## Contributing

Contributions are welcome! Please keep changes compatible with the existing terminal and persistence systems. Open an issue or pull request to discuss larger changes.

## License

GPL-3.0

---

*Inspired by Grey Hack. All systems are simulated for single-player fun.*