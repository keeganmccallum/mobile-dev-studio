import * as FileSystem from "expo-file-system";
import { TermuxCore, TermuxSession } from "termux-core";

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
  status: "running" | "stopped" | "error";
  output: string[];
  pid?: number;
}

export class TerminalService {
  private processes: Map<string, TerminalProcess> = new Map();
  private sessions: Map<string, TermuxSession> = new Map();
  private alpineRootPath: string;
  private isInitialized: boolean = false;
  private serverStatus: {
    status: "stopped" | "running" | "error";
    url?: string;
  } = { status: "stopped" };
  private listeners: ((event: { type: string; data: any }) => void)[] = [];

  constructor() {
    this.alpineRootPath = `${FileSystem.documentDirectory}alpine-root/`;
  }

  async initialize(): Promise<boolean> {
    try {
      console.log("Initializing Real Termux Service...");

      // Check if Termux bootstrap is installed
      const bootstrapInfo = await TermuxCore.getBootstrapInfo();
      if (!bootstrapInfo.installed) {
        console.log("Installing Termux bootstrap...");
        const success = await TermuxCore.installBootstrap();
        if (!success) {
          throw new Error("Failed to install Termux bootstrap");
        }
      }

      // Set up the root path from Termux
      this.alpineRootPath = bootstrapInfo.prefixPath;

      // Verify bootstrap installation
      const verifyInfo = await TermuxCore.getBootstrapInfo();
      if (!verifyInfo.installed) {
        throw new Error("Bootstrap verification failed");
      }

      this.isInitialized = true;
      console.log("Real Termux Service initialized successfully");
      return true;
    } catch (error) {
      console.error("Failed to initialize Terminal Service:", error);
      return false;
    }
  }

  private async setupAlpineEnvironment(): Promise<void> {
    console.log("Setting up Alpine Linux environment...");

    // Create directory structure
    const directories = [
      "bin",
      "sbin",
      "usr/bin",
      "usr/sbin",
      "usr/local/bin",
      "etc",
      "var",
      "tmp",
      "home/user",
      "root",
      "dev",
      "proc",
      "sys",
      "opt",
      "usr/lib",
      "usr/share",
      "usr/include",
    ];

    for (const dir of directories) {
      const dirPath = `${this.alpineRootPath}${dir}/`;
      await FileSystem.makeDirectoryAsync(dirPath, { intermediates: true });
    }

    // Create essential files
    await this.createEssentialFiles();

    console.log("Alpine environment setup complete");
  }

  private async createEssentialFiles(): Promise<void> {
    // Create /etc/passwd
    const passwdContent = `root:x:0:0:root:/root:/bin/sh
user:x:1000:1000:Mobile Dev User:/home/user:/bin/sh
`;
    await FileSystem.writeAsStringAsync(
      `${this.alpineRootPath}etc/passwd`,
      passwdContent,
    );

    // Create /etc/hosts
    const hostsContent = `127.0.0.1 localhost
::1 localhost ip6-localhost ip6-loopback
`;
    await FileSystem.writeAsStringAsync(
      `${this.alpineRootPath}etc/hosts`,
      hostsContent,
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
      envContent,
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
      shellScript,
    );
  }

  async createProcess(
    command: string,
    args: string[] = [],
    cwd: string = "/data/data/com.termux/files/usr",
  ): Promise<string> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    const processId = `proc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      // Create real Termux session
      const environment = {
        PATH: "/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets",
        HOME: "/data/data/com.termux/files/home",
        PREFIX: "/data/data/com.termux/files/usr",
        TMPDIR: "/data/data/com.termux/files/usr/tmp",
        ANDROID_DATA: "/data",
        ANDROID_ROOT: "/system",
        TERM: "xterm-256color",
        LANG: "en_US.UTF-8",
      };

      const session = await TermuxCore.createSession(
        command,
        args,
        cwd,
        environment,
      );

      this.sessions.set(processId, session);

      const process: TerminalProcess = {
        id: processId,
        command,
        args,
        cwd,
        status: "running",
        output: [],
        pid: session.pid,
      };

      this.processes.set(processId, process);

      // Set up session event listeners
      this.setupSessionListeners(processId, session);

      return processId;
    } catch (error) {
      console.error("Failed to create real terminal session:", error);
      throw error;
    }
  }

  private setupSessionListeners(
    processId: string,
    session: TermuxSession,
  ): void {
    // Set up real-time data listeners for the Termux session
    TermuxCore.onSessionOutput(session.id, (data: string) => {
      const process = this.processes.get(processId);
      if (process) {
        // Add output to process buffer
        process.output.push(data);

        // Check for special server start patterns
        if (
          data.includes("Server running") ||
          data.includes("localhost:3000")
        ) {
          this.notifyServerStatus("running", "http://localhost:3000");
        }
      }
    });

    TermuxCore.onSessionExit(session.id, (exitCode: number) => {
      const process = this.processes.get(processId);
      if (process) {
        process.status = exitCode === 0 ? "stopped" : "error";
      }
    });
  }

  private async simulateCommandExecution(
    process: TerminalProcess,
  ): Promise<void> {
    const { command, args, cwd } = process;
    const fullCommand = `${command} ${args.join(" ")}`.trim();

    try {
      // Add command to output
      process.output.push(`$ ${fullCommand}`);

      // Simulate different commands
      switch (command) {
        case "ls":
          process.output.push("bin  etc  home  opt  root  tmp  usr  var");
          break;

        case "pwd":
          process.output.push(cwd);
          break;

        case "whoami":
          process.output.push("user");
          break;

        case "uname":
          if (args.includes("-a")) {
            process.output.push(
              "Linux mobile-dev-studio 5.4.0 #1 SMP Mobile Dev Studio aarch64 GNU/Linux",
            );
          } else {
            process.output.push("Linux");
          }
          break;

        case "node":
          if (args.includes("--version")) {
            process.output.push("v24.4.0");
          } else {
            process.output.push(
              "Node.js interactive shell - use Ctrl+C to exit",
            );
          }
          break;

        case "npm":
          if (args.includes("--version")) {
            process.output.push("11.3.0");
          } else if (args.includes("start")) {
            process.output.push("Starting development server...");
            process.output.push("> notion-editor@1.0.0 start");
            process.output.push("> next dev");
            process.output.push("");
            process.output.push("  ▲ Next.js 14.2.0");
            process.output.push("  - Local:        http://localhost:3000");
            process.output.push("  - Network:      http://192.168.1.100:3000");
            process.output.push("");
            process.output.push("✓ Ready in 2.3s");
            process.output.push("○ Compiling / ...");
            process.output.push("✓ Compiled successfully");

            // Notify other tabs that server is running
            this.notifyServerStatus("running", "http://localhost:3000");
          } else if (args.includes("install")) {
            process.output.push("npm install");
            process.output.push("");
            process.output.push("added 1247 packages in 15s");
            process.output.push("");
            process.output.push("135 packages are looking for funding");
            process.output.push("  run `npm fund` for details");
          } else if (args.includes("run") && args.includes("build")) {
            process.output.push("> notion-editor@1.0.0 build");
            process.output.push("> next build");
            process.output.push("");
            process.output.push("  ▲ Next.js 14.2.0");
            process.output.push("");
            process.output.push(
              "   Creating an optimized production build ...",
            );
            process.output.push("✓ Compiled successfully");
            process.output.push("   Collecting page data ...");
            process.output.push("✓ Generating static pages (4/4)");
            process.output.push("✓ Finalizing page optimization ...");
          } else if (args.includes("test")) {
            process.output.push("> notion-editor@1.0.0 test");
            process.output.push("> jest");
            process.output.push("");
            process.output.push("PASS  src/components/NotionEditor.test.tsx");
            process.output.push("PASS  src/components/MDXRenderer.test.tsx");
            process.output.push("");
            process.output.push("Test Suites: 2 passed, 2 total");
            process.output.push("Tests:       8 passed, 8 total");
            process.output.push("Snapshots:   0 total");
            process.output.push("Time:        2.456 s");
          } else {
            process.output.push("npm <command>");
            process.output.push("");
            process.output.push("Usage:");
            process.output.push("npm install           Install dependencies");
            process.output.push(
              "npm start            Start development server",
            );
            process.output.push("npm run build        Build for production");
            process.output.push("npm test             Run tests");
            process.output.push("npm run lint         Run ESLint");
          }
          break;

        case "cd":
          if (args.length > 0) {
            // Update working directory for future commands
            process.cwd = args[0].startsWith("/")
              ? args[0]
              : `${cwd}/${args[0]}`;
          }
          break;

        case "echo":
          process.output.push(args.join(" "));
          break;

        case "cat":
          if (args.includes("/etc/os-release")) {
            process.output.push('NAME="Alpine Linux"');
            process.output.push("ID=alpine");
            process.output.push("VERSION_ID=3.23.0_alpha");
            process.output.push(
              'PRETTY_NAME="Alpine Linux (Mobile Dev Studio)"',
            );
          } else {
            process.output.push(
              `cat: ${args[0] || "file"}: No such file or directory`,
            );
          }
          break;

        case "git":
          if (args.includes("status")) {
            process.output.push(
              "On branch feature/terminal-preview-integration",
            );
            process.output.push("Changes not staged for commit:");
            process.output.push(
              "  modified:   src/components/NotionEditor.tsx",
            );
            process.output.push(
              "  modified:   src/services/TerminalService.ts",
            );
            process.output.push("");
            process.output.push("no changes added to commit");
          } else if (args.includes("log")) {
            process.output.push(
              "commit a1b2c3d4 (HEAD -> feature/terminal-preview-integration)",
            );
            process.output.push("Author: user <user@mobile-dev-studio>");
            process.output.push("Date:   Sun Jul 13 12:00:00 2025");
            process.output.push("");
            process.output.push(
              "    Add enhanced terminal simulation with development server integration",
            );
          } else {
            process.output.push(
              "git [--version] [--help] [-C <path>] [-c <name>=<value>]",
            );
            process.output.push(
              "           [--exec-path[=<path>]] [--html-path] [--man-path] [--info-path]",
            );
            process.output.push(
              "           [-p | --paginate | -P | --no-pager] [--no-replace-objects] [--bare]",
            );
          }
          break;

        case "curl":
          if (args.includes("localhost:3000")) {
            if (this.serverStatus.status === "running") {
              process.output.push("<!DOCTYPE html>");
              process.output.push(
                "<html><head><title>Notion Editor</title></head>",
              );
              process.output.push(
                "<body><h1>Mobile Dev Studio</h1></body></html>",
              );
            } else {
              process.output.push(
                "curl: (7) Failed to connect to localhost port 3000: Connection refused",
              );
            }
          } else {
            process.output.push("curl: (6) Could not resolve host");
          }
          break;

        case "ps": {
          const runningProcs = this.getAllProcesses().filter(
            (p) => p.status === "running",
          );
          process.output.push("  PID TTY          TIME CMD");
          process.output.push("    1 ?        00:00:01 sh");
          if (this.serverStatus.status === "running") {
            process.output.push(" 1247 ?        00:00:03 node (next dev)");
          }
          runningProcs.forEach((proc, i) => {
            process.output.push(
              `${1248 + i} ?        00:00:00 ${proc.command}`,
            );
          });
          break;
        }

        case "help":
        case "--help":
          process.output.push("Mobile Dev Studio Terminal Commands:");
          process.output.push("");
          process.output.push("File Operations:");
          process.output.push("  ls, pwd, cd, cat, echo");
          process.output.push("");
          process.output.push("Development:");
          process.output.push("  node, npm - Node.js development");
          process.output.push("  git - Version control");
          process.output.push("  curl - HTTP requests");
          process.output.push("");
          process.output.push("System:");
          process.output.push("  ps, whoami, uname, clear");
          break;

        default:
          process.output.push(`${command}: command not found`);
          process.output.push('Type "help" for available commands');
      }

      process.status = "stopped";
    } catch (error) {
      process.output.push(`Error: ${error}`);
      process.status = "error";
    }
  }

  getProcess(processId: string): TerminalProcess | undefined {
    return this.processes.get(processId);
  }

  getAllProcesses(): TerminalProcess[] {
    return Array.from(this.processes.values());
  }

  async writeToSession(processId: string, data: string): Promise<boolean> {
    const session = this.sessions.get(processId);
    if (session) {
      try {
        await TermuxCore.writeToSession(session.id, data);
        return true;
      } catch (error) {
        console.error("Failed to write to session:", error);
        return false;
      }
    }
    return false;
  }

  killProcess(processId: string): boolean {
    const process = this.processes.get(processId);
    const session = this.sessions.get(processId);

    if (process && session) {
      try {
        TermuxCore.killSession(session.id);
        process.status = "stopped";
        this.sessions.delete(processId);
        return true;
      } catch (error) {
        console.error("Failed to kill session:", error);
        process.status = "error";
        return false;
      }
    }
    return false;
  }

  clearProcesses(): void {
    // Kill all active sessions
    for (const [processId, session] of this.sessions) {
      try {
        TermuxCore.killSession(session.id);
      } catch (error) {
        console.error("Error killing session:", error);
      }
    }
    this.processes.clear();
    this.sessions.clear();
  }

  async getDirectoryListing(path: string = "/home/user"): Promise<string[]> {
    try {
      const fullPath = `${this.alpineRootPath}${path.replace(/^\//, "")}`;
      const dirInfo = await FileSystem.getInfoAsync(fullPath);

      if (dirInfo.exists && dirInfo.isDirectory) {
        return await FileSystem.readDirectoryAsync(fullPath);
      }

      return [];
    } catch (error) {
      console.error("Error reading directory:", error);
      return [];
    }
  }

  async readFile(path: string): Promise<string | null> {
    try {
      const fullPath = `${this.alpineRootPath}${path.replace(/^\//, "")}`;
      const fileInfo = await FileSystem.getInfoAsync(fullPath);

      if (fileInfo.exists && !fileInfo.isDirectory) {
        return await FileSystem.readAsStringAsync(fullPath);
      }

      return null;
    } catch (error) {
      console.error("Error reading file:", error);
      return null;
    }
  }

  async writeFile(path: string, content: string): Promise<boolean> {
    try {
      const fullPath = `${this.alpineRootPath}${path.replace(/^\//, "")}`;
      await FileSystem.writeAsStringAsync(fullPath, content);
      return true;
    } catch (error) {
      console.error("Error writing file:", error);
      return false;
    }
  }

  private notifyServerStatus(
    status: "stopped" | "running" | "error",
    url?: string,
  ): void {
    this.serverStatus = { status, url };
    this.listeners.forEach((listener) => {
      listener({
        type: "SERVER_STATUS_CHANGE",
        data: { status, url },
      });
    });
  }

  addEventListener(
    listener: (event: { type: string; data: any }) => void,
  ): void {
    this.listeners.push(listener);
  }

  removeEventListener(
    listener: (event: { type: string; data: any }) => void,
  ): void {
    const index = this.listeners.indexOf(listener);
    if (index > -1) {
      this.listeners.splice(index, 1);
    }
  }

  getServerStatus(): { status: "stopped" | "running" | "error"; url?: string } {
    return this.serverStatus;
  }

  getStatus(): {
    initialized: boolean;
    processCount: number;
    runningProcesses: number;
    alpineRootPath: string;
    serverStatus: { status: "stopped" | "running" | "error"; url?: string };
  } {
    const processes = this.getAllProcesses();
    const runningProcesses = processes.filter(
      (p) => p.status === "running",
    ).length;

    return {
      initialized: this.isInitialized,
      processCount: processes.length,
      runningProcesses,
      alpineRootPath: this.alpineRootPath,
      serverStatus: this.serverStatus,
    };
  }
}

// Singleton instance
export const terminalService = new TerminalService();
