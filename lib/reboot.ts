import { TerminalLine } from '../components/Terminal';

export function executeReboot(
  setLines: React.Dispatch<React.SetStateAction<TerminalLine[]>>,
  setIsRebooting: (value: boolean) => void,
  onReboot: () => void,
  currentPrompt: string,
  command: string,
  setCurrentInput: (value: string) => void
): void {
  setIsRebooting(true);
  setCurrentInput('');

  // Show initial reboot message
  setLines(prev => [...prev,
    { type: 'input', content: command, commandPrompt: currentPrompt },
    { type: 'output', content: 'System is going down for reboot...' }
  ]);

  // Simulate shutdown sequence with realistic delays
  setTimeout(() => {
    setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped target Multi-User System.' }]);
  }, 300);

  setTimeout(() => {
    setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped target Graphical Interface.' }]);
  }, 600);

  setTimeout(() => {
    setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped OpenSSH Daemon.' }]);
  }, 900);

  setTimeout(() => {
    setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped Apache HTTP Server.' }]);
  }, 1200);

  setTimeout(() => {
    setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped MySQL Database Server.' }]);
  }, 1500);

  setTimeout(() => {
    setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped target Network.' }]);
  }, 1800);

  setTimeout(() => {
    setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped target Timers.' }]);
  }, 2100);

  setTimeout(() => {
    setLines(prev => [...prev, { type: 'output', content: '[  OK  ] Stopped target Basic System.' }]);
  }, 2400);

  setTimeout(() => {
    setLines(prev => [...prev, { type: 'output', content: 'Rebooting...' }]);
  }, 2700);

  // Clear screen and show BIOS boot sequence
  setTimeout(() => {
    setLines([
      { type: 'output', content: '' },
      { type: 'output', content: 'BIOS Information' },
      { type: 'output', content: 'Vendor: Linux Sim BIOS' },
      { type: 'output', content: 'Version: 1.0' },
      { type: 'output', content: 'Release Date: ' + new Date().toISOString().split('T')[0] },
      { type: 'output', content: '' }
    ]);
  }, 3200);

  // Show more boot messages
  setTimeout(() => {
    setLines(prev => [...prev,
      { type: 'output', content: 'CPU: Linux Sim Processor (1 cores, 1 threads)' },
      { type: 'output', content: 'Memory: 512 MB' },
      { type: 'output', content: 'Memory Test: Passed' },
      { type: 'output', content: '' },
      { type: 'output', content: 'Loading Linux 5.15.0-91-generic...' },
      { type: 'output', content: 'Loading initial ramdisk...' }
    ]);
  }, 3600);

  // Show kernel messages
  setTimeout(() => {
    setLines(prev => [...prev,
      { type: 'output', content: '' },
      { type: 'output', content: '[    0.000000] Linux version 5.15.0-91-generic (buildd@lcy02-amd64-001) (gcc (Ubuntu 11.4.0-1ubuntu1~22.04) 11.4.0, GNU ld (GNU Binutils for Ubuntu) 2.38) #101-Ubuntu SMP Tue Nov 14 13:30:33 UTC 2023 (Ubuntu 5.15.0-91.101-generic 5.15.122)' },
      { type: 'output', content: '[    0.000000] Command line: BOOT_IMAGE=/boot/vmlinuz-5.15.0-91-generic root=UUID=xxxx ro quiet splash' },
      { type: 'output', content: '[    0.000000] KERNEL supported cpus:' },
      { type: 'output', content: '[    0.000000]   Intel GenuineIntel' },
      { type: 'output', content: '[    0.000000]   AMD AuthenticAMD' },
      { type: 'output', content: '[    0.000000] x86/fpu: Supporting XSAVE feature 0x001: \'x87 floating point registers\'' },
      { type: 'output', content: '[    0.000000] BIOS-provided physical RAM map:' },
      { type: 'output', content: '[    0.000000] BIOS-e820: [mem 0x0000000000000000-0x000000000009fbff] usable' },
      { type: 'output', content: '[    0.000000] BIOS-e820: [mem 0x0000000000100000-0x000000001fffffff] usable' },
      { type: 'output', content: '[    0.010000] Mount-cache hash table entries: 2048 (order: 2, 16384 bytes, linear)' },
      { type: 'output', content: '[    0.020000] CPU: Physical Processor ID: 0' },
      { type: 'output', content: '[    0.030000] devtmpfs: initialized' },
      { type: 'output', content: '[    0.040000] NET: Registered protocol family 16' }
    ]);
  }, 4000);

  // Show service startup messages
  setTimeout(() => {
    setLines(prev => [...prev,
      { type: 'output', content: '' },
      { type: 'output', content: 'Loading, please wait...' },
      { type: 'output', content: '' },
      { type: 'output', content: 'Begin: Loading essential drivers ... [    0.09] done.' },
      { type: 'output', content: 'Begin: Running /scripts/init-premount ... [    0.09] done.' },
      { type: 'output', content: 'Begin: Mounting root file system ... [    0.10] done.' },
      { type: 'output', content: 'Begin: Running /scripts/local-bottom ... [    0.10] done.' },
      { type: 'output', content: 'Begin: Running /scripts/init-bottom ... [    0.10] done.' },
      { type: 'output', content: '' },
      { type: 'output', content: '[    1.234567] systemd[1]: systemd 249.11-0ubuntu3.9 running in system mode (+PAM +AUDIT +SELINUX +APPARMOR +IMA +SMACK +SECCOMP +GCRYPT +GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +IPTC +KMOD +LIBCRYPTSETUP +LIBFDISK +PCRE2 -PWQUALITY -P11KIT -QRENCODE -BZIP2 +LZ4 +XZ +ZLIB +ZSTD -XKBCOMMON +UTEMPTER +SYSTEMD_GROUP +SYSTEMD_RESOLVE +SYSTEMD_CREDS +SYSTEMD_HOME +SYSTEMD_XZ -GNOME_KEYRING)' },
      { type: 'output', content: '[    1.234567] systemd[1]: systemd 249.11-0ubuntu3.9 running in system mode (+PAM +AUDIT +SELINUX +APPARMOR +IMA +SMACK +SECCOMP +GCRYPT +GNUTLS +OPENSSL +ACL +BLKID +CURL +ELFUTILS +FIDO2 +IDN2 -IDN +IPTC +KMOD +LIBCRYPTSETUP +LIBFDISK +PCRE2 -PWQUALITY -P11KIT -QRENCODE -BZIP2 +LZ4 +XZ +ZLIB +ZSTD -XKBCOMMON +UTEMPTER +SYSTEMD_GROUP +SYSTEMD_RESOLVE +SYSTEMD_CREDS +SYSTEMD_HOME +SYSTEMD_XZ -GNOME_KEYRING)' },
      { type: 'output', content: '[    1.345678] systemd[1]: No hostname configured.' },
      { type: 'output', content: '[    1.345678] systemd[1]: Set hostname to <linux-sim>.' }
    ]);
  }, 4800);

  // Transition back to the real login screen
  setTimeout(() => {
    setIsRebooting(false);
    onReboot();
  }, 6000);
}