package expo.modules.termuxcore

import android.content.Context
import android.util.Log
import com.termux.terminal.TerminalSession
import com.termux.terminal.TerminalSessionClient
import com.termux.view.TerminalView
import com.termux.view.TerminalViewClient
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ExpoView

class TermuxTerminalViewModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("TermuxTerminalView")
        
        View(TermuxTerminalView::class) {
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

class TermuxTerminalView(context: Context, appContext: expo.modules.kotlin.AppContext) : ExpoView(context, appContext) {
    private var terminalView: TerminalView? = null
    private var terminalSession: TerminalSession? = null
    
    companion object {
        private const val LOG_TAG = "TermuxTerminalView"
    }
    
    init {
        initializeTerminalView()
    }
    
    private fun initializeTerminalView() {
        try {
            // Create the actual Termux terminal view
            terminalView = TerminalView(context, null).apply {
                setTerminalViewClient(object : TerminalViewClient {
                    override fun copyModeChanged(copyMode: Boolean) {}
                    override fun onKeyDown(keyCode: Int, event: android.view.KeyEvent, session: TerminalSession): Boolean = false
                    override fun onKeyUp(keyCode: Int, event: android.view.KeyEvent): Boolean = false
                    override fun onTouchEvent(event: android.view.MotionEvent): Boolean = false
                    override fun onLongPress(event: android.view.MotionEvent): Boolean = false
                    override fun readControlKey(): Boolean = false
                    override fun readAltKey(): Boolean = false
                    override fun readShiftKey(): Boolean = false
                    override fun readFnKey(): Boolean = false
                    override fun onCodePoint(codePoint: Int, ctrlDown: Boolean, session: TerminalSession): Boolean {
                        session.writeCodePoint(false, codePoint)
                        return true
                    }
                })
            }
            
            addView(terminalView)
            Log.i(LOG_TAG, "TerminalView initialized successfully")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to initialize TerminalView", e)
        }
    }
    
    fun createSession(): Boolean {
        return try {
            val sessionClient = object : TerminalSessionClient {
                override fun onTextChanged(changedSession: TerminalSession) {
                    appContext.eventEmitter?.emit("onSessionOutput", mapOf(
                        "sessionId" to changedSession.pid.toString(),
                        "data" to "Text changed"
                    ))
                }
                
                override fun onTitleChanged(changedSession: TerminalSession) {
                    appContext.eventEmitter?.emit("onTitleChanged", mapOf(
                        "sessionId" to changedSession.pid.toString(),
                        "title" to changedSession.title
                    ))
                }
                
                override fun onSessionFinished(finishedSession: TerminalSession) {
                    appContext.eventEmitter?.emit("onSessionExit", mapOf(
                        "sessionId" to finishedSession.pid.toString(),
                        "exitCode" to finishedSession.exitStatus
                    ))
                }
                
                override fun onCopyTextToClipboard(session: TerminalSession, text: String) {}
                override fun onPasteTextFromClipboard(session: TerminalSession?) {}
                override fun onBell(session: TerminalSession) {}
                override fun onColorsChanged(session: TerminalSession) {}
                override fun onTerminalCursorStateChange(state: Boolean) {}
                override fun setTerminalShellPid(session: TerminalSession, pid: Int) {}
                override fun getTerminalCursorStyle(): Int = 0
                override fun logError(tag: String, message: String) { Log.e(tag, message) }
                override fun logWarn(tag: String, message: String) { Log.w(tag, message) }
                override fun logInfo(tag: String, message: String) { Log.i(tag, message) }
                override fun logDebug(tag: String, message: String) { Log.d(tag, message) }
                override fun logVerbose(tag: String, message: String) { Log.v(tag, message) }
                override fun logStackTraceWithMessage(tag: String, message: String, e: Exception) { Log.e(tag, message, e) }
                override fun logStackTrace(tag: String, e: Exception) { Log.e(tag, "Stack trace", e) }
            }
            
            // Create a basic shell session
            terminalSession = TerminalSession(
                "/system/bin/sh",
                "/",
                arrayOf(),
                arrayOf("PATH=/system/bin"),
                4000,
                sessionClient
            )
            
            terminalView?.attachSession(terminalSession)
            Log.i(LOG_TAG, "Terminal session created successfully")
            true
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to create terminal session", e)
            false
        }
    }
    
    fun writeToSession(data: String) {
        try {
            terminalSession?.write(data.toByteArray(), 0, data.length)
            Log.d(LOG_TAG, "Wrote data to session: $data")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to write to session", e)
        }
    }
    
    fun killSession() {
        try {
            terminalSession?.finishIfRunning()
            Log.i(LOG_TAG, "Terminal session killed")
        } catch (e: Exception) {
            Log.e(LOG_TAG, "Failed to kill session", e)
        }
    }
}