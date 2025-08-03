package expo.modules.termuxcore

import android.util.Log
import java.io.*
import java.util.*
import kotlin.concurrent.thread

class TermuxSession private constructor(
    val id: String,
    private val command: String,
    private val workingDir: String,
    private val environment: Map<String, String>,
    private val cols: Int,
    private val rows: Int
) {
    private var mPid: Int = -1
    private var mFileDescriptor: Int = -1
    private var isSessionRunning: Boolean = false
    private var mExitCode: Int = -1
    
    // Getters for compatibility
    val pid: Int get() = mPid
    val fileDescriptor: Int get() = mFileDescriptor
    val isRunning: Boolean get() = isSessionRunning
    val exitCode: Int get() = mExitCode
    
    private val LOG_TAG = "TermuxSession"
    private var outputStream: FileOutputStream? = null
    private var inputStream: FileInputStream? = null

    init {
        // Create the subprocess using native PTY support
        createSubprocess()
    }

    private fun createSubprocess() {
        try {
            Log.i(LOG_TAG, "Creating real PTY subprocess for session $id")
            
            // Prepare arguments array
            val args = arrayOfNulls<String>(1)
            args[0] = command
            
            // Prepare environment variables array
            val envArray = environment.entries.map { "${it.key}=${it.value}" }.toTypedArray()
            
            // Process ID will be stored here
            val processIdArray = intArrayOf(0)
            
            // Create real PTY subprocess using native method
            mFileDescriptor = createSubprocess(
                command,
                workingDir,
                args,
                envArray,
                processIdArray,
                rows,
                cols,
                8, // cell_width
                16 // cell_height
            )
            
            mPid = processIdArray[0]
            isSessionRunning = true
            
            Log.i(LOG_TAG, "Created PTY session $id: pid=$mPid, fd=$mFileDescriptor")
            
            // Set up I/O streams
            if (mFileDescriptor > 0) {
                outputStream = FileOutputStream(java.io.FileDescriptor().apply {
                    // Use reflection to set the file descriptor
                    val descriptorField = this.javaClass.getDeclaredField("descriptor")
                    descriptorField.isAccessible = true
                    descriptorField.setInt(this, mFileDescriptor)
                })
                
                inputStream = FileInputStream(java.io.FileDescriptor().apply {
                    val descriptorField = this.javaClass.getDeclaredField("descriptor")
                    descriptorField.isAccessible = true
                    descriptorField.setInt(this, mFileDescriptor)
                })
                
                Log.i(LOG_TAG, "Set up I/O streams for session $id")
            }
            
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to create PTY subprocess for session $id", e)
            isSessionRunning = false
        }
    }

    fun write(data: String) {
        if (!isRunning || outputStream == null) return
        try {
            outputStream?.write(data.toByteArray())
            outputStream?.flush()
            Log.v(LOG_TAG, "Wrote ${data.length} bytes to session $id")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to write to session $id", e)
        }
    }

    fun read(): String {
        if (!isRunning || inputStream == null) return ""
        
        try {
            val buffer = ByteArray(4096)
            val available = inputStream?.available() ?: 0
            if (available > 0) {
                val bytesRead = inputStream?.read(buffer, 0, minOf(available, buffer.size)) ?: 0
                if (bytesRead > 0) {
                    val result = String(buffer, 0, bytesRead)
                    Log.v(LOG_TAG, "Read ${bytesRead} bytes from session $id")
                    return result
                }
            }
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to read from session $id", e)
        }
        return ""
    }

    fun kill() {
        if (!isRunning) return
        
        try {
            if (mPid > 0) {
                // Send SIGTERM to the process
                android.system.Os.kill(mPid, android.system.OsConstants.SIGTERM)
                Log.i(LOG_TAG, "Sent SIGTERM to session $id (pid: $mPid)")
            }
            
            // Close file descriptor
            if (mFileDescriptor > 0) {
                close(mFileDescriptor)
                Log.i(LOG_TAG, "Closed file descriptor for session $id")
            }
            
            // Close streams
            outputStream?.close()
            inputStream?.close()
            
            isSessionRunning = false
            Log.i(LOG_TAG, "Killed session $id")
            
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to kill session $id", e)
        }
    }

    fun waitFor(): Int {
        if (mPid <= 0) return -1
        
        try {
            mExitCode = waitFor(mPid)
            isSessionRunning = false
            Log.i(LOG_TAG, "Session $id exited with code: $mExitCode")
            return mExitCode
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to wait for session $id", e)
            return -1
        }
    }

    fun setPtyWindowSize(rows: Int, cols: Int) {
        if (mFileDescriptor > 0) {
            try {
                setPtyWindowSize(mFileDescriptor, rows, cols, 8, 16)
                Log.d(LOG_TAG, "Updated terminal size for session $id: ${cols}x${rows}")
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to set window size for session $id", e)
            }
        }
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
        init {
            // Load the native library
            try {
                System.loadLibrary("termux")
                Log.i("TermuxSession", "Successfully loaded termux native library")
            } catch (e: UnsatisfiedLinkError) {
                Log.e("TermuxSession", "Failed to load termux native library", e)
            }
        }
        
        // Native method declarations - these connect to termux-core.cpp
        @JvmStatic external fun createSubprocess(
            cmd: String,
            cwd: String,
            args: Array<String?>,
            envVars: Array<String>,
            processIdArray: IntArray,
            rows: Int,
            columns: Int,
            cellWidth: Int,
            cellHeight: Int
        ): Int
        
        @JvmStatic external fun setPtyWindowSize(
            fd: Int,
            rows: Int,
            cols: Int,
            cellWidth: Int,
            cellHeight: Int
        )
        
        @JvmStatic external fun waitFor(pid: Int): Int
        
        @JvmStatic external fun close(fileDescriptor: Int)
        
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
            Log.i("TermuxSession", "Creating real PTY session $sessionId")
            Log.i("TermuxSession", "Command: $command with ${args.size} args")
            Log.i("TermuxSession", "Working directory: $cwd")
            Log.i("TermuxSession", "Environment variables: ${env.size} vars")
            Log.i("TermuxSession", "Terminal size: ${cols}x${rows}")
            Log.i("TermuxSession", "Prefix path: $prefixPath")
            
            // Create enhanced environment with Termux paths
            val enhancedEnv = env.toMutableMap().apply {
                put("HOME", prefixPath)
                put("PATH", "$prefixPath/bin:${get("PATH") ?: "/system/bin"}")
                put("PREFIX", prefixPath)
                put("TMPDIR", "$prefixPath/tmp")
                put("TERM", "xterm-256color")
                put("COLORTERM", "truecolor")
            }
            
            return TermuxSession(
                id = sessionId,
                command = command,
                workingDir = cwd,
                environment = enhancedEnv,
                cols = cols,
                rows = rows
            )
        }
    }
}