package expo.modules.termuxcore

import android.content.Context
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
// import expo.modules.kotlin.views.ExpoView

// TODO: Implement TerminalView and TerminalSession classes
// Commented out for now to allow basic compilation

/*
class TermuxTerminalView(context: Context) : ExpoView(context) {
    private val terminalView = TerminalView(context, null)
    
    init {
        addView(terminalView)
    }
    
    fun createSession(command: String, cwd: String, env: Map<String, String>) {
        // Create a new terminal session
        val session = TerminalSession(command, cwd, arrayOf(), env.toMutableMap(), true)
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
*/

class TermuxTerminalViewModule : Module() {
    override fun definition() = ModuleDefinition {
        Name("TermuxTerminalView")

        // TODO: Implement View manager when TerminalView classes are ready
        /*
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
            
            Function("createSession") { view: TermuxTerminalView, command: String, cwd: String, env: Map<String, String> ->
                view.createSession(command, cwd, env)
            }
            
            Function("writeToSession") { view: TermuxTerminalView, data: String ->
                view.writeToSession(data)
            }
            
            OnViewDidUpdateProps { view: TermuxTerminalView ->
                // Called when props are updated
            }
        }
        */
    }
}