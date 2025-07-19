package expo.modules.termuxcore

import android.content.Context
import android.os.Handler
import android.os.Looper
import android.util.Log
import androidx.annotation.NonNull
import androidx.annotation.Nullable
import com.termux.terminal.*
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ExpoView
import java.util.concurrent.ConcurrentHashMap

class TermuxTerminalViewModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("TermuxTerminalView")
        
        View(TermuxTerminalView::class) {
            Prop("command") { view: TermuxTerminalView, command: String ->
                view.setCommand(command)
            }
            
            Prop("workingDirectory") { view: TermuxTerminalView, workingDirectory: String ->
                view.setWorkingDirectory(workingDirectory)
            }
            
            Prop("environment") { view: TermuxTerminalView, environment: Map<String, String> ->
                view.setEnvironment(environment)
            }
            
            Events("onSessionOutput", "onSessionExit", "onTitleChanged")
            
            AsyncFunction("createSession") { view: TermuxTerminalView ->
                view.createSession()
            }
            
            AsyncFunction("writeToSession") { view: TermuxTerminalView, data: String ->
                view.writeToSession(data)
            }
            
            AsyncFunction("killSession") { view: TermuxTerminalView ->
                view.killSession()
            }
        }
    }
}

class TermuxTerminalView(context: Context, appContext: expo.modules.kotlin.AppContext) : ExpoView(context, appContext), TerminalSessionClient {
    private var command: String = "/data/data/com.termux/files/usr/bin/bash"
    private var workingDirectory: String = "/data/data/com.termux/files/home"
    private var environment: Map<String, String> = emptyMap()
    private var terminalSession: TerminalSession? = null
    private var terminalView: com.termux.terminal.TerminalView? = null
    private val handler = Handler(Looper.getMainLooper())
    
    companion object {
        private const val LOG_TAG = "TermuxTerminalView"
        private val activeSessions = ConcurrentHashMap<String, TerminalSession>()
    }
    
    init {
        initializeTerminalView()
    }
    
    private fun initializeTerminalView() {
        // Create the actual Termux terminal view
        terminalView = com.termux.terminal.TerminalView(context, null).apply {
            setTerminalViewClient(object : TerminalViewClient {
                override fun copyModeChanged(copyMode: Boolean) {
                    // Handle copy mode changes
                }
                
                override fun onKeyDown(keyCode: Int, event: android.view.KeyEvent, session: TerminalSession): Boolean {
                    // Handle key events
                    return false
                }
                
                override fun onKeyUp(keyCode: Int, event: android.view.KeyEvent): Boolean {
                    return false
                }
                
                override fun onTouchEvent(event: android.view.MotionEvent): Boolean {
                    return false
                }
                
                override fun onLongPress(event: android.view.MotionEvent): Boolean {
                    return false
                }
                
                override fun readControlKey(): Boolean {
                    return false
                }
                
                override fun readAltKey(): Boolean {
                    return false
                }
                
                override fun readShiftKey(): Boolean {
                    return false
                }
                
                override fun readFnKey(): Boolean {
                    return false
                }
                
                override fun onCodePoint(codePoint: Int, ctrlDown: Boolean, session: TerminalSession): Boolean {
                    // Handle code point input
                    session.writeCodePoint(false, codePoint)
                    return true
                }
                
                override fun onEmulatorSet() {
                    // Handle emulator setup
                }
                
                override fun logError(tag: String, message: String) {
                    Log.e(tag, message)
                }
                
                override fun logWarn(tag: String, message: String) {
                    Log.w(tag, message)
                }
                
                override fun logInfo(tag: String, message: String) {
                    Log.i(tag, message)
                }
                
                override fun logDebug(tag: String, message: String) {
                    Log.d(tag, message)
                }
                
                override fun logVerbose(tag: String, message: String) {
                    Log.v(tag, message)
                }
                
                override fun logStackTraceWithMessage(tag: String, message: String, e: Exception) {
                    Log.e(tag, message, e)
                }
                
                override fun logStackTrace(tag: String, e: Exception) {
                    Log.e(tag, "Stack trace", e)
                }
            })
        }
        
        addView(terminalView)
    }
    
    fun setCommand(command: String) {
        this.command = command
    }
    
    fun setWorkingDirectory(workingDirectory: String) {
        this.workingDirectory = workingDirectory
    }
    
    fun setEnvironment(environment: Map<String, String>) {
        this.environment = environment
    }
    
    fun createSession() {
        try {
            // Build environment array
            val defaultEnv = mapOf(
                "HOME" to "/data/data/com.termux/files/home",
                "PREFIX" to "/data/data/com.termux/files/usr",
                "TMPDIR" to "/data/data/com.termux/files/usr/tmp",
                "SHELL" to command,
                "PATH" to "/data/data/com.termux/files/usr/bin:/data/data/com.termux/files/usr/bin/applets",
                "LD_LIBRARY_PATH" to "/data/data/com.termux/files/usr/lib",
                "LANG" to "en_US.UTF-8",
                "TERM" to "xterm-256color"
            )
            
            val finalEnv = defaultEnv + environment
            val envArray = finalEnv.map { "${it.key}=${it.value}" }.toTypedArray()
            
            // Create terminal session
            terminalSession = TerminalSession(
                command,
                workingDirectory,
                arrayOf(), // args
                envArray,
                4000, // transcript rows
                this // TerminalSessionClient
            )
            
            // Set the session in the terminal view
            terminalView?.attachSession(terminalSession)
            
            // Start the session with initial size
            terminalSession?.updateSize(80, 24, 12, 24)
            
            Log.i(LOG_TAG, "Terminal session created successfully")
            
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to create terminal session", e)
            sendEvent("onSessionError", mapOf("error" to e.message))
        }
    }
    
    fun writeToSession(data: String) {
        terminalSession?.let { session ->
            try {
                val bytes = data.toByteArray(Charsets.UTF_8)
                session.write(bytes, 0, bytes.size)
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to write to session", e)
            }
        }
    }
    
    fun killSession() {
        terminalSession?.finishIfRunning()
        terminalSession = null
        terminalView?.attachSession(null)
    }
    
    // TerminalSessionClient implementation
    override fun onTextChanged(@NonNull changedSession: TerminalSession) {
        handler.post {
            // Get the terminal buffer content and send to React Native
            val emulator = changedSession.emulator
            if (emulator != null) {
                val screen = emulator.screen
                val lines = mutableListOf<String>()
                
                for (i in 0 until screen.activeRows) {
                    val row = screen.getLine(i)
                    lines.add(row.text)
                }
                
                sendEvent("onSessionOutput", mapOf(
                    "sessionId" to changedSession.mHandle,
                    "lines" to lines
                ))
            }
        }
    }
    
    override fun onTitleChanged(@NonNull changedSession: TerminalSession) {
        handler.post {
            sendEvent("onTitleChanged", mapOf(
                "sessionId" to changedSession.mHandle,
                "title" to (changedSession.title ?: "Terminal")
            ))
        }
    }
    
    override fun onSessionFinished(@NonNull finishedSession: TerminalSession) {
        handler.post {
            sendEvent("onSessionExit", mapOf(
                "sessionId" to finishedSession.mHandle,
                "exitCode" to finishedSession.exitStatus
            ))
        }
    }
    
    override fun onCopyTextToClipboard(@NonNull session: TerminalSession, text: String) {
        // Handle clipboard copy
    }
    
    override fun onPasteTextFromClipboard(@Nullable session: TerminalSession?) {
        // Handle clipboard paste
    }
    
    override fun onBell(@NonNull session: TerminalSession) {
        // Handle terminal bell
    }
    
    override fun onColorsChanged(@NonNull session: TerminalSession) {
        // Handle color changes
    }
    
    override fun onTerminalCursorStateChange(state: Boolean) {
        // Handle cursor state changes
    }
    
    override fun setTerminalShellPid(@NonNull session: TerminalSession, pid: Int) {
        Log.i(LOG_TAG, "Terminal shell PID set: $pid")
    }
    
    override fun getTerminalCursorStyle(): Integer? {
        return 0 // Default cursor style
    }
    
    // Logging methods
    override fun logError(tag: String, message: String) {
        Log.e(tag, message)
    }
    
    override fun logWarn(tag: String, message: String) {
        Log.w(tag, message)
    }
    
    override fun logInfo(tag: String, message: String) {
        Log.i(tag, message)
    }
    
    override fun logDebug(tag: String, message: String) {
        Log.d(tag, message)
    }
    
    override fun logVerbose(tag: String, message: String) {
        Log.v(tag, message)
    }
    
    override fun logStackTraceWithMessage(tag: String, message: String, e: Exception) {
        Log.e(tag, message, e)
    }
    
    override fun logStackTrace(tag: String, e: Exception) {
        Log.e(tag, "Stack trace", e)
    }
}