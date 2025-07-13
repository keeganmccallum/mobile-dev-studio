import * as FileSystem from 'expo-file-system';

export interface TerminalConfig {
  workingDirectory: string;
  environment: Record<string, string>;
  shell: string;
}

export interface TerminalProcess {
  id: string;
  command: string;
  args: string[];
  cwd: string;
  status: 'running' | 'stopped' | 'error';
  output: string[];
  pid?: number;
}

export class TerminalService {
  private processes: Map<string, TerminalProcess> = new Map();
  private alpineRootPath: string;
  private isInitialized: boolean = false;

  constructor() {
    this.alpineRootPath = `${FileSystem.documentDirectory}alpine-root/`;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log('Initializing Terminal Service...');
      
      // Check if Alpine root directory exists
      const dirInfo = await FileSystem.getInfoAsync(this.alpineRootPath);
      if (!dirInfo.exists) {
        await this.setupAlpineEnvironment();
      }

      // Verify critical files exist
      const criticalFiles = [
        'bin/sh',
        'etc/passwd',
        'etc/hosts',
        'usr/bin/node'
      ];

      for (const file of criticalFiles) {
        const filePath = `${this.alpineRootPath}${file}`;
        const fileInfo = await FileSystem.getInfoAsync(filePath);
        if (!fileInfo.exists) {
          console.warn(`Critical file missing: ${file}`);
        }
      }

      this.isInitialized = true;
      console.log('Terminal Service initialized successfully');
      return true;
    } catch (error) {
      console.error('Failed to initialize Terminal Service:', error);
      return false;
    }
  }

  private async setupAlpineEnvironment(): Promise<void> {
    console.log('Setting up Alpine Linux environment...');
    
    // Create directory structure
    const directories = [
      'bin', 'sbin', 'usr/bin', 'usr/sbin', 'usr/local/bin',
      'etc', 'var', 'tmp', 'home/user', 'root', 'dev', 'proc', 'sys',
      'opt', 'usr/lib', 'usr/share', 'usr/include'
    ];

    for (const dir of directories) {
      const dirPath = `${this.alpineRootPath}${dir}/`;
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }

    // Create essential files
    await this.createEssentialFiles();
    
    console.log('Alpine environment setup complete');
  }

  private async createEssentialFiles(): Promise<void> {
    // Create /etc/passwd
    const passwdContent = `root:x:0:0:root:/root:/bin/sh
user:x:1000:1000:Mobile Dev User:/home/user:/bin/sh
`;
    await FileSystem.writeAsStringAsync(
      `${this.alpineRootPath}etc/passwd`,
      passwdContent
    );

    // Create /etc/hosts
    const hostsContent = `127.0.0.1 localhost
::1 localhost ip6-localhost ip6-loopback
`;
    await FileSystem.writeAsStringAsync(
      `${this.alpineRootPath}etc/hosts`,
      hostsContent
    );

    // Create /etc/environment
    const envContent = `PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin
HOME=/home/user
USER=user
SHELL=/bin/sh
TERM=xterm-256color
`;
    await FileSystem.writeAsStringAsync(
      `${this.alpineRootPath}etc/environment`,
      envContent
    );

    // Create a simple shell script
    const shellScript = `#!/bin/sh
# Mobile Dev Studio Shell
echo "Welcome to Mobile Dev Studio Terminal!"
echo "Alpine Linux environment ready"
echo ""
echo "Available commands:"
echo "  ls - list files"
echo "  cd - change directory"
echo "  pwd - print working directory"
echo "  node - Node.js runtime"
echo "  npm - Node package manager"
echo ""
cd /home/user
exec /bin/sh "$@"
`;
    await FileSystem.writeAsStringAsync(
      `${this.alpineRootPath}bin/mobile-shell`,
      shellScript
    );
  }

  async createProcess(command: string, args: string[] = [], cwd: string = '/home/user'): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const processId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const process: TerminalProcess = {
      id: processId,
      command,
      args,
      cwd,
      status: 'running',
      output: []
    };

    this.processes.set(processId, process);
    
    // Simulate command execution
    this.simulateCommandExecution(process);
    
    return processId;
  }

  private async simulateCommandExecution(process: TerminalProcess): Promise<void> {
    const { command, args, cwd } = process;
    const fullCommand = `${command} ${args.join(' ')}`.trim();

    try {
      // Add command to output
      process.output.push(`$ ${fullCommand}`);

      // Simulate different commands
      switch (command) {
        case 'ls':
          process.output.push('bin  etc  home  opt  root  tmp  usr  var');
          break;
          
        case 'pwd':
          process.output.push(cwd);
          break;
          
        case 'whoami':
          process.output.push('user');
          break;
          
        case 'uname':
          if (args.includes('-a')) {
            process.output.push('Linux mobile-dev-studio 5.4.0 #1 SMP Mobile Dev Studio aarch64 GNU/Linux');
          } else {
            process.output.push('Linux');
          }
          break;
          
        case 'node':
          if (args.includes('--version')) {
            process.output.push('v24.4.0');
          } else {
            process.output.push('Node.js interactive shell - use Ctrl+C to exit');
          }
          break;
          
        case 'npm':
          if (args.includes('--version')) {
            process.output.push('11.3.0');
          } else if (args.includes('start')) {
            process.output.push('Starting development server...');
            process.output.push('Server running on http://localhost:3000');
          } else {
            process.output.push('npm <command>');
            process.output.push('');
            process.output.push('Usage:');
            process.output.push('npm start    Start development server');
            process.output.push('npm test     Run tests');
            process.output.push('npm install  Install dependencies');
          }
          break;
          
        case 'cd':
          if (args.length > 0) {
            // Update working directory for future commands
            process.cwd = args[0].startsWith('/') ? args[0] : `${cwd}/${args[0]}`;
          }
          break;
          
        case 'echo':
          process.output.push(args.join(' '));
          break;
          
        case 'cat':
          if (args.includes('/etc/os-release')) {
            process.output.push('NAME="Alpine Linux"');
            process.output.push('ID=alpine');
            process.output.push('VERSION_ID=3.23.0_alpha');
            process.output.push('PRETTY_NAME="Alpine Linux (Mobile Dev Studio)"');
          } else {
            process.output.push(`cat: ${args[0] || 'file'}: No such file or directory`);
          }
          break;
          
        case 'help':
        case '--help':
          process.output.push('Mobile Dev Studio Terminal Commands:');
          process.output.push('  ls, pwd, cd, whoami, uname');
          process.output.push('  node, npm - Node.js development');
          process.output.push('  cat, echo - File operations');
          process.output.push('  clear - Clear terminal');
          break;
          
        default:
          process.output.push(`${command}: command not found`);
          process.output.push('Type "help" for available commands');
      }

      process.status = 'stopped';
    } catch (error) {
      process.output.push(`Error: ${error}`);
      process.status = 'error';
    }
  }

  getProcess(processId: string): TerminalProcess | undefined {
    return this.processes.get(processId);
  }

  getAllProcesses(): TerminalProcess[] {
    return Array.from(this.processes.values());
  }

  killProcess(processId: string): boolean {
    const process = this.processes.get(processId);
    if (process) {
      process.status = 'stopped';
      return true;
    }
    return false;
  }

  clearProcesses(): void {
    this.processes.clear();
  }

  async getDirectoryListing(path: string = '/home/user'): Promise<string[]> {
    try {
      const fullPath = `${this.alpineRootPath}${path.replace(/^\//, '')}`;
      const dirInfo = await FileSystem.getInfoAsync(fullPath);
      
      if (dirInfo.exists && dirInfo.isDirectory) {
        return await FileSystem.readDirectoryAsync(fullPath);
      }
      
      return [];
    } catch (error) {
      console.error('Error reading directory:', error);
      return [];
    }
  }

  async readFile(path: string): Promise<string | null> {
    try {
      const fullPath = `${this.alpineRootPath}${path.replace(/^\//, '')}`;
      const fileInfo = await FileSystem.getInfoAsync(fullPath);
      
      if (fileInfo.exists && !fileInfo.isDirectory) {
        return await FileSystem.readAsStringAsync(fullPath);
      }
      
      return null;
    } catch (error) {
      console.error('Error reading file:', error);
      return null;
    }
  }

  async writeFile(path: string, content: string): Promise<boolean> {
    try {
      const fullPath = `${this.alpineRootPath}${path.replace(/^\//, '')}`;
      await FileSystem.writeAsStringAsync(fullPath, content);
      return true;
    } catch (error) {
      console.error('Error writing file:', error);
      return false;
    }
  }

  getStatus(): {
    initialized: boolean;
    processCount: number;
    runningProcesses: number;
    alpineRootPath: string;
  } {
    const processes = this.getAllProcesses();
    const runningProcesses = processes.filter(p => p.status === 'running').length;

    return {
      initialized: this.isInitialized,
      processCount: processes.length,
      runningProcesses,
      alpineRootPath: this.alpineRootPath
    };
  }
}

// Singleton instance
export const terminalService = new TerminalService();