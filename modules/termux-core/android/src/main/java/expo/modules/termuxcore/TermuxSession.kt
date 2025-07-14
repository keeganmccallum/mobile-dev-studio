package expo.modules.termuxcore

import android.system.Os
import android.util.Log
import java.io.*
import java.util.*
import kotlin.collections.ArrayList

class TermuxSession private constructor(
    val id: String,
    val pid: Int,
    val fileDescriptor: Int,
    private val outputStream: FileOutputStream,
    private val inputStream: FileInputStream
) {
    var isRunning = true
        private set
    
    private val outputBuffer = ArrayList<String>()
    private val LOG_TAG = "TermuxSession"

    fun write(data: String) {
        if (!isRunning) return
        try {
            outputStream.write(data.toByteArray())
            outputStream.flush()
        } catch (e: IOException) {
            Log.e(LOG_TAG, "Failed to write to session $id", e)
        }
    }

    fun read(): String {
        if (!isRunning) return ""
        
        try {
            val buffer = ByteArray(1024)
            val available = inputStream.available()
            if (available > 0) {
                val bytesRead = inputStream.read(buffer, 0, minOf(available, buffer.size))
                if (bytesRead > 0) {
                    return String(buffer, 0, bytesRead)
                }
            }
        } catch (e: IOException) {
            Log.e(LOG_TAG, "Failed to read from session $id", e)
        }
        
        return ""
    }

    fun kill() {
        if (!isRunning) return
        
        try {
            Os.kill(pid, 9) // SIGKILL
            isRunning = false
            outputStream.close()
            inputStream.close()
            close(fileDescriptor)
            Log.i(LOG_TAG, "Killed session $id (pid: $pid)")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to kill session $id", e)
        }
    }

    fun waitFor(): Int {
        return waitFor(pid)
    }

    companion object {
        external fun createSubprocess(
            cmd: String,
            cwd: String,
            args: Array<String>,
            env: Array<String>,
            processIdArray: IntArray,
            rows: Int,
            cols: Int,
            cellWidth: Int,
            cellHeight: Int
        ): Int

        external fun waitFor(pid: Int): Int
        external fun close(fd: Int)
        external fun setPtyWindowSize(fd: Int, rows: Int, cols: Int, cellWidth: Int, cellHeight: Int)

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
            val processIdArray = IntArray(1)
            
            // Create the subprocess using JNI
            val fileDescriptor = createSubprocess(
                command,
                cwd,
                args,
                fullEnv,
                processIdArray,
                rows,
                cols,
                12, // cellWidth
                24  // cellHeight
            )
            
            val pid = processIdArray[0]
            val outputStream = FileOutputStream(java.io.FileDescriptor())
            val inputStream = FileInputStream(java.io.FileDescriptor())
            
            // Use reflection to set the file descriptor
            try {
                val fdField = java.io.FileDescriptor::class.java.getDeclaredField("descriptor")
                fdField.isAccessible = true
                fdField.setInt(outputStream.fd, fileDescriptor)
                fdField.setInt(inputStream.fd, fileDescriptor)
            } catch (e: Exception) {
                Log.e("TermuxSession", "Failed to set file descriptor", e)
            }
            
            return TermuxSession(sessionId, pid, fileDescriptor, outputStream, inputStream)
        }
    }
}