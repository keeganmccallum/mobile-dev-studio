import { NativeModulesProxy } from "expo-modules-core";

export default NativeModulesProxy.TermuxCore as {
  getBootstrapInfo(): Promise<{
    installed: boolean;
    prefixPath: string;
    version?: string;
    size?: number;
  }>;
  installBootstrap(): Promise<boolean>;
  createSession(
    command: string,
    args: string[],
    cwd: string,
    env: Record<string, string>,
    rows: number,
    cols: number,
  ): Promise<{
    id: string;
    pid: number;
    fileDescriptor: number;
    isRunning: boolean;
  }>;
  writeToSession(sessionId: string, data: string): Promise<void>;
  killSession(sessionId: string): Promise<boolean>;
};
