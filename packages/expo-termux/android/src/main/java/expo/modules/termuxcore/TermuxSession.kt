package expo.modules.termuxcore

import android.system.Os
import android.util.Log
import java.io.*
import java.util.*
import kotlin.collections.ArrayList

import com.termux.terminal.TerminalSession
import com.termux.terminal.TerminalSessionClient

class TermuxSession private constructor(
    val id: String,
    private var terminalSession: TerminalSession?
) : TerminalSessionClient {
    val pid: Int get() = terminalSession?.pid ?: -1
    val fileDescriptor: Int = 0 // Not directly accessible in new API
    val isRunning: Boolean get() = terminalSession?.isRunning ?: false
    val exitCode: Int get() = terminalSession?.exitStatus ?: -1
    
    private val LOG_TAG = "TermuxSession"
    private val outputBuffer = mutableListOf<String>()
    
    // Callback for when output is available
    var onOutputAvailable: ((String) -> Unit)? = null
    var onSessionFinishedCallback: ((Int) -> Unit)? = null

    fun write(data: String) {
        if (!isRunning) return
        try {
            val bytes = data.toByteArray()
            terminalSession?.write(bytes, 0, bytes.size)
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to write to session $id", e)
        }
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
        
        try {
            terminalSession?.finishIfRunning()
            Log.i(LOG_TAG, "Killed session $id (pid: $pid)")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to kill session $id", e)
        }
    }

    fun waitFor(): Int {
        return terminalSession?.exitStatus ?: -1
    }

    // TerminalSessionClient implementation
    override fun onTextChanged(changedSession: TerminalSession) {
        // Capture new output from terminal
        try {
            val transcript = changedSession.transcript
            if (transcript != null && transcript.activeRows.isNotEmpty()) {
                // Get the last few lines that might be new
                val recentLines = transcript.activeRows.takeLast(5)
                    .map { it.text.toString().trim() }
                    .filter { it.isNotEmpty() }
                
                if (recentLines.isNotEmpty()) {
                    val newOutput = recentLines.joinToString("\n")
                    Log.d(LOG_TAG, "Session $id new output: $newOutput")
                    outputBuffer.addAll(recentLines)
                    onOutputAvailable?.invoke(newOutput)
                }
            }
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Error capturing output for session $id", e)
        }
    }
    
    override fun onTitleChanged(changedSession: TerminalSession) {
        Log.d(LOG_TAG, "Session $id title changed: ${changedSession.title}")
    }
    
    override fun onSessionFinished(finishedSession: TerminalSession) {
        Log.i(LOG_TAG, "Session $id finished with exit code: ${finishedSession.exitStatus}")
        onSessionFinishedCallback?.invoke(finishedSession.exitStatus)
    }
    
    override fun onCopyTextToClipboard(session: TerminalSession, text: String) {}
    override fun onPasteTextFromClipboard(session: TerminalSession?) {}
    override fun onBell(session: TerminalSession) {}
    override fun onColorsChanged(session: TerminalSession) {}
    override fun onTerminalCursorStateChange(state: Boolean) {}
    override fun setTerminalShellPid(session: TerminalSession, pid: Int) {
        Log.i(LOG_TAG, "Session $id shell PID set to: $pid")
    }
    override fun getTerminalCursorStyle(): Int? = 0
    override fun logError(tag: String, message: String) { Log.e(tag, message) }
    override fun logWarn(tag: String, message: String) { Log.w(tag, message) }
    override fun logInfo(tag: String, message: String) { Log.i(tag, message) }
    override fun logDebug(tag: String, message: String) { Log.d(tag, message) }
    override fun logVerbose(tag: String, message: String) { Log.v(tag, message) }
    override fun logStackTraceWithMessage(tag: String, message: String, e: Exception) { Log.e(tag, message, e) }
    override fun logStackTrace(tag: String, e: Exception) { Log.e(tag, "Stack trace", e) }

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
            // Prepare environment variables
            val envArray = env.map { "${it.key}=${it.value}" }.toTypedArray()
            
            // Add essential Termux environment variables
            val termuxEnv = arrayOf(
                "HOME=/home",
                "PREFIX=$prefixPath",
                "TMPDIR=/data/data/com.termux/files/usr/tmp",
                "SHELL=$prefixPath/bin/bash",
                "PATH=$prefixPath/bin:$prefixPath/bin/applets",
                "LD_LIBRARY_PATH=$prefixPath/lib",
                "LANG=en_US.UTF-8",
                "TERM=xterm-256color"
            )
            
            val fullEnv = termuxEnv + envArray
            
            // Create the wrapper session
            val wrapper = TermuxSession(sessionId, null as TerminalSession?)
            
            // Create the actual terminal session
            val terminalSession = TerminalSession(
                command,
                cwd,
                args,
                fullEnv,
                4000, // transcript rows
                wrapper
            )
            
            // Set the terminal session reference
            wrapper.terminalSession = terminalSession
            
            // Initialize the terminal session
            terminalSession.updateSize(cols, rows, 12, 24)
            
            return wrapper
        }
    }
}