package expo.modules.termuxcore

import android.system.Os
import android.util.Log
import java.io.*
import java.util.*
import kotlin.collections.ArrayList

class TermuxSession private constructor(
    val id: String,
    private var isSessionRunning: Boolean = false
) {
    val pid: Int = -1 // Fallback implementation for compilation
    val fileDescriptor: Int = 0 // Not directly accessible in new API
    val isRunning: Boolean get() = isSessionRunning
    val exitCode: Int = -1 // Fallback implementation
    
    private val LOG_TAG = "TermuxSession"

    fun write(data: String) {
        if (!isRunning) return
        try {
            // Fallback implementation - log the data for now
            Log.d(LOG_TAG, "Write to session $id: ${data.take(50)}...")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to write to session $id", e)
        }
    }

    fun read(): String {
        // Fallback implementation - return empty for now
        return ""
    }

    fun kill() {
        if (!isRunning) return
        
        try {
            isSessionRunning = false
            Log.i(LOG_TAG, "Killed session $id (pid: $pid)")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to kill session $id", e)
        }
    }

    fun waitFor(): Int {
        return exitCode
    }

    // Logging methods for compatibility
    fun logError(tag: String, message: String) { Log.e(tag, message) }
    fun logWarn(tag: String, message: String) { Log.w(tag, message) }
    fun logInfo(tag: String, message: String) { Log.i(tag, message) }
    fun logDebug(tag: String, message: String) { Log.d(tag, message) }
    fun logVerbose(tag: String, message: String) { Log.v(tag, message) }
    fun logStackTraceWithMessage(tag: String, message: String, e: Exception) { Log.e(tag, message, e) }
    fun logStackTrace(tag: String, e: Exception) { Log.e(tag, "Stack trace", e) }

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
        ): TermuxSession {
            // Fallback implementation for compilation - create a simple session
            val wrapper = TermuxSession(sessionId, true) // Mark as running
            
            Log.i("TermuxSession", "Created fallback session $sessionId with command: $command")
            Log.i("TermuxSession", "Working directory: $cwd")
            Log.i("TermuxSession", "Arguments: ${args.joinToString(" ")}")
            Log.i("TermuxSession", "Environment variables: ${env.size} vars")
            Log.i("TermuxSession", "Terminal size: ${cols}x${rows}")
            Log.i("TermuxSession", "Prefix path: $prefixPath")
            
            return wrapper
        }
    }
}