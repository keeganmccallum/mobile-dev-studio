package expo.modules.expotermux

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise

/**
 * MINIMAL TEST MODULE - Just to prove native module registration works
 */
class ExpoTermuxModuleMinimal : Module() {
    override fun definition() = ModuleDefinition {
        Name("ExpoTermux")
        
        // Just one simple function to test if module is available
        Function("test") {
            return@Function "Hello from ExpoTermux native module!"
        }
        
        AsyncFunction("testAsync") { promise: Promise ->
            promise.resolve("Hello from ExpoTermux async!")
        }
    }
}