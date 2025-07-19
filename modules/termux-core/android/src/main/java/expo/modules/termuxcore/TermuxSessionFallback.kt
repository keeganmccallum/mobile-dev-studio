package expo.modules.termuxcore

import android.util.Log
import java.util.*
import java.util.concurrent.atomic.AtomicBoolean
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
        
        // Echo the input and simulate command responses
        outputBuffer.add(data)
        
        when {
            data.trim().equals("ls", ignoreCase = true) -> {
                outputBuffer.add("file1.txt  file2.txt  directory1/")
            }
            data.trim().equals("pwd", ignoreCase = true) -> {
                outputBuffer.add(cwd)
            }
            data.trim().equals("whoami", ignoreCase = true) -> {
                outputBuffer.add("termux")
            }
            data.trim().startsWith("echo ") -> {
                outputBuffer.add(data.substring(5))
            }
            data.trim().equals("exit", ignoreCase = true) -> {
                exitCode = 0
                _isRunning.set(false)
            }
            else -> {
                outputBuffer.add("Command simulated: ${data.trim()}")
            }
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