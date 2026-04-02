import { MockInternet } from './internet';

export function executeBrowser(
  args: string[],
  setupData: any,
  mockInternet: MockInternet | null
): { output?: string; error?: string } {
  if (args.includes('-h') || args.includes('--help')) {
    return {
      output: `Browser v1.0 - Simple Terminal Web Browser

Usage: browser <domain>

Examples:
  browser google.com    View the Google homepage
  browser github.com    View the GitHub homepage

Note: This browser displays simulated website content in text format.
`
    };
  }

  if (args.length === 0) {
    return { error: 'browser: missing target domain\nTry: browser --help' };
  }

  const domain = args[0];

  if (!mockInternet) {
    return { error: 'browser: Network not available' };
  }

  // Resolve domain to IP
  const ip = mockInternet.resolveDomain(domain);
  if (!ip) {
    return { error: `browser: Unable to resolve host '${domain}'` };
  }

  // Get website content
  const website = mockInternet.getWebsiteByDomain(domain);
  if (!website) {
    return { error: `browser: Page not found for '${domain}'` };
  }

  // Format the browser output
  const lines: string[] = [];
  lines.push('┌─────────────────────────────────────────────────────────────────────────────┐');
  lines.push('│                          SimWeb Browser v1.0                                │');
  lines.push('├─────────────────────────────────────────────────────────────────────────────┤');
  lines.push(`│ URL: http://${domain}`);
  if (website.title) {
    lines.push(`│ Title: ${website.title}`);
  }
  if (website.lastModified) {
    lines.push(`│ Last Modified: ${new Date(website.lastModified).toLocaleDateString()}`);
  }
  lines.push('├─────────────────────────────────────────────────────────────────────────────┤');
  lines.push('│                                                                             │');
  lines.push('│ Content:                                                                    │');
  lines.push('│                                                                             │');

  // Format the content with some indentation
  const contentLines = website.content.split('\n');
  contentLines.forEach(line => {
    // Truncate long lines and add padding
    const truncated = line.length > 75 ? line.substring(0, 72) + '...' : line;
    lines.push(`│ ${truncated.padEnd(75)} │`);
  });

  // Fill remaining space if content is short
  while (lines.length < 25) {
    lines.push('│                                                                             │');
  }

  lines.push('├─────────────────────────────────────────────────────────────────────────────┤');
  lines.push('│ Use Ctrl+C to exit browser                                                  │');
  lines.push('└─────────────────────────────────────────────────────────────────────────────┘');

  return { output: lines.join('\n') };
}