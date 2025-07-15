package expo.modules.termuxcore

import android.content.Context
import android.view.View
import android.widget.TextView
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ExpoView

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
            
            Events("onSessionOutput", "onSessionExit")
        }
    }
}

class TermuxTerminalView(context: Context) : ExpoView(context) {
    private var command: String = "/data/data/com.termux/files/usr/bin/bash"
    private var workingDirectory: String = "/data/data/com.termux/files/home"
    private var environment: Map<String, String> = emptyMap()
    
    init {
        // Create a placeholder terminal view for now
        val terminalView = TextView(context).apply {
            text = "🐧 Termux Terminal\n\nInitializing native terminal...\n\n$ "
            setTextColor(android.graphics.Color.WHITE)
            setBackgroundColor(android.graphics.Color.BLACK)
            setPadding(16, 16, 16, 16)
            typeface = android.graphics.Typeface.MONOSPACE
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
    
    fun createSession(command: String, cwd: String, env: Map<String, String>) {
        // TODO: Implement actual terminal session creation
    }
    
    fun writeToSession(data: String) {
        // TODO: Implement writing to terminal session
    }
}