package expo.modules.termuxcore

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.views.ExpoView
import expo.modules.kotlin.views.ViewManagerDefinition
import expo.modules.kotlin.AppContext
import com.termux.view.TerminalView
import com.termux.terminal.TerminalSession
import com.termux.terminal.TerminalSessionClient

class TermuxTerminalView(context: Context, appContext: AppContext) : ExpoView(context, appContext) {
    private val terminalView = TerminalView(context, null)
    
    init {
        addView(terminalView)
    }
    
    fun createSession(command: String, cwd: String, env: Map<String, String>) {
        // Create a new terminal session with proper constructor signature
        val envArray = env.map { "${it.key}=${it.value}" }.toTypedArray()
        val session = TerminalSession(command, cwd, arrayOf(), envArray, null, null)
        terminalView.attachSession(session)
    }
    
    fun writeToSession(data: String) {
        terminalView.currentSession?.let { session ->
            session.write(data)
        }
    }
    
    fun getCurrentSession(): TerminalSession? {
        return terminalView.currentSession
    }
}

class TermuxTerminalViewModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("TermuxTerminalView")

        View(TermuxTerminalView::class) {
            Prop("command") { view: TermuxTerminalView, command: String ->
                // This will be called when the command prop is set
            }
            
            Prop("workingDirectory") { view: TermuxTerminalView, cwd: String ->
                // This will be called when the workingDirectory prop is set
            }
            
            Prop("environment") { view: TermuxTerminalView, env: Map<String, String> ->
                // This will be called when the environment prop is set
            }
            
            OnViewDidUpdateProps { view: TermuxTerminalView ->
                // Called when props are updated
            }
        }
        
        // TODO: Add functions for creating sessions and writing to sessions
        // This will require proper view instance management
    }
}