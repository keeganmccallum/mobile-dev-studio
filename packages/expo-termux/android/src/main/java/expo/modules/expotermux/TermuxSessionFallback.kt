package expo.modules.expotermux

import android.util.Log
import java.util.*
import java.util.concurrent.atomic.AtomicBoolean
import java.util.concurrent.TimeUnit
import kotlin.random.Random

/**
 * Fallback implementation for TermuxSession when native library is not available
 * This provides a mock terminal session for testing and development
 */
class TermuxSessionFallback(
    val id: String,
    private val command: String,
    private val cwd: String
) {
    val pid: Int = Random.nextInt(1000, 9999)
    val fileDescriptor: Int = Random.nextInt(10, 100)
    private val _isRunning = AtomicBoolean(true)
    val isRunning: Boolean get() = _isRunning.get()
    var exitCode: Int = 0
        private set
    
    private val LOG_TAG = "TermuxSessionFallback"
    private val outputBuffer = mutableListOf<String>()
    private var lastReadIndex = 0
    
    init {
        Log.i(LOG_TAG, "Created fallback session $id with mock PID $pid")
        
        // Simulate some initial output
        outputBuffer.add("Welcome to Termux (Fallback Mode)")
        outputBuffer.add("Session ID: $id")
        outputBuffer.add("Working directory: $cwd")
        outputBuffer.add("Command: $command")
        outputBuffer.add("$ ")
        
        // Simulate session ending after 30 seconds for demo
        Timer().schedule(object : TimerTask() {
            override fun run() {
                if (_isRunning.get()) {
                    exitCode = 0
                    _isRunning.set(false)
                    Log.i(LOG_TAG, "Mock session $id ended")
                }
            }
        }, 30000)
    }

    fun write(data: String) {
        if (!isRunning) return
        
        Log.d(LOG_TAG, "Writing to session $id: $data")
        
        // Echo the input
        outputBuffer.add(data)
        
        val command = data.trim()
        
        if (command.isEmpty()) {
            outputBuffer.add("$ ")
            return
        }
        
        try {
            when {
                command.equals("exit", ignoreCase = true) -> {
                    exitCode = 0
                    _isRunning.set(false)
                    return
                }
                else -> {
                    // Try to execute real command with safety checks
                    try {
                        Log.d(LOG_TAG, "Attempting to execute command: $command")
                        
                        // Check if the working directory exists and is accessible
                        val workingDir = java.io.File(cwd)
                        if (!workingDir.exists() || !workingDir.canRead()) {
                            Log.w(LOG_TAG, "Working directory $cwd not accessible, using app directory")
                            // Use app's data directory as fallback
                            // Will be set by context in real implementation
                        }
                        
                        // For safety and Android compatibility, only allow specific safe commands
                        val result = when {
                            command.equals("date", ignoreCase = true) -> {
                                try {
                                    val processBuilder = ProcessBuilder("date")
                                    val process = processBuilder.start()
                                    val completed = process.waitFor(2, TimeUnit.SECONDS)
                                    if (completed) {
                                        process.inputStream.bufferedReader().readText().trim()
                                    } else {
                                        process.destroyForcibly()
                                        "Date command timed out"
                                    }
                                } catch (e: Exception) {
                                    // Fallback to Java date if system date fails
                                    java.util.Date().toString()
                                }
                            }
                            command.equals("pwd", ignoreCase = true) -> {
                                workingDir.absolutePath
                            }
                            command.equals("whoami", ignoreCase = true) -> {
                                "android_app"
                            }
                            command.startsWith("echo ") -> {
                                command.substring(5).trim()
                            }
                            command.equals("ls", ignoreCase = true) -> {
                                try {
                                    workingDir.listFiles()?.joinToString("  ") { it.name } ?: "Permission denied"
                                } catch (e: Exception) {
                                    "ls: Permission denied"
                                }
                            }
                            else -> {
                                "Command '$command' is not supported in this environment.\nSupported: date, pwd, whoami, echo, ls"
                            }
                        }
                        
                        Log.d(LOG_TAG, "Command result: $result")
                        outputBuffer.add(result)
                        
                    } catch (e: Exception) {
                        Log.w(LOG_TAG, "Safe command execution failed: ${e.message}")
                        outputBuffer.add("Command execution error: ${e.message}")
                    }
                }
            }
        } catch (e: Exception) {
            Log.w(LOG_TAG, "Command execution failed: ${e.message}")
            outputBuffer.add("Command failed: ${e.message}")
        }
        
        outputBuffer.add("$ ")
    }

    fun read(): String {
        if (outputBuffer.size <= lastReadIndex) return ""
        
        // Return only new output since last read
        val newOutput = outputBuffer.subList(lastReadIndex, outputBuffer.size)
        val output = newOutput.joinToString("\n")
        
        // Update read index to current buffer size
        lastReadIndex = outputBuffer.size
        
        return output
    }

    fun kill() {
        if (!isRunning) return
        
        Log.i(LOG_TAG, "Killing mock session $id")
        exitCode = 128 + 9 // SIGKILL
        _isRunning.set(false)
    }

    fun waitFor(): Int {
        return exitCode
    }

    companion object {
        fun create(
            sessionId: String,
            command: String,
            args: Array<String>,
            cwd: String,
            env: Map<String, String>,
            rows: Int,
            cols: Int,
            prefixPath: String
        ): TermuxSessionFallback {
            Log.i("TermuxSessionFallback", "Creating fallback session: $sessionId")
            return TermuxSessionFallback(sessionId, command, cwd)
        }
    }
}