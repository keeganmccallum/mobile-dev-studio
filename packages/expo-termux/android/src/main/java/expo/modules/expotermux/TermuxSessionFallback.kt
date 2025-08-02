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
                    // Execute real command using ProcessBuilder
                    val processBuilder = ProcessBuilder()
                    
                    // For Android, we need to use /system/bin/sh
                    processBuilder.command("/system/bin/sh", "-c", command)
                    processBuilder.directory(java.io.File(cwd))
                    
                    val process = processBuilder.start()
                    
                    // Read output
                    val output = process.inputStream.bufferedReader().readText()
                    val error = process.errorStream.bufferedReader().readText()
                    
                    // Wait for completion with timeout
                    val completed = process.waitFor(5, java.util.concurrent.TimeUnit.SECONDS)
                    
                    if (completed) {
                        if (output.isNotEmpty()) {
                            outputBuffer.add(output.trim())
                        }
                        if (error.isNotEmpty()) {
                            outputBuffer.add("Error: ${error.trim()}")
                        }
                    } else {
                        process.destroyForcibly()
                        outputBuffer.add("Command timed out")
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
        if (outputBuffer.isEmpty()) return ""
        
        // Return all buffered output and clear buffer
        val output = outputBuffer.joinToString("\n")
        outputBuffer.clear()
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