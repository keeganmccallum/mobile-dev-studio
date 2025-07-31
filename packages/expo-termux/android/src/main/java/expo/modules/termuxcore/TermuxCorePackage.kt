package expo.modules.termuxcore

import android.util.Log
import expo.modules.core.BasePackage

/**
 * Alternative module registration approach using BasePackage
 */
class TermuxCorePackage : BasePackage() {
    companion object {
        private const val LOG_TAG = "TermuxCorePackage"
    }
    
    init {
        Log.i(LOG_TAG, "🎁 TermuxCorePackage constructor called")
    }
    
    override fun createExportedModules(context: android.content.Context): List<expo.modules.core.ExportedModule> {
        Log.i(LOG_TAG, "🔧 createExportedModules called")
        return emptyList() // We use the modern Kotlin API
    }
}