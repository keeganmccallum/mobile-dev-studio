package expo.modules.expotermux

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.exception.Exceptions

import android.content.Context
import android.util.Log
import java.io.*
import java.util.*
import java.util.concurrent.ConcurrentHashMap
import java.util.zip.ZipInputStream
import kotlin.collections.HashMap

/**
 * Simple, standard Expo module following exact conventions
 * This should work exactly like expo-camera, expo-media-library, etc.
 */
class ExpoTermuxModule : Module() {
    companion object {
        private const val LOG_TAG = "ExpoTermux"
        
        init {
            Log.i(LOG_TAG, "📚 ExpoTermuxModule class loaded - STANDARD EXPO MODULE")
        }
    }
    
    private val sessions = ConcurrentHashMap<String, TermuxSessionFallback>()
    private var isBootstrapInstalled = false
    private lateinit var termuxFilesDir: File
    private lateinit var termuxPrefixDir: File
    
    private val context: Context
        get() = appContext.reactContext ?: throw Exceptions.AppContextLost()

    init {
        Log.i(LOG_TAG, "🚀 ExpoTermuxModule constructor - INSTANCE CREATED")
    }

    override fun definition() = ModuleDefinition {
        // CRITICAL: Use simple, standard name
        Name("ExpoTermux")
        
        Log.i(LOG_TAG, "✅ ExpoTermuxModule definition() called - MODULE REGISTERED")

        Events("onSessionOutput", "onSessionExit", "onBootstrapProgress")

        OnCreate {
            Log.i(LOG_TAG, "🎯 ExpoTermuxModule OnCreate() - INITIALIZATION")
            
            termuxFilesDir = File(context.filesDir, "termux")
            termuxPrefixDir = File(termuxFilesDir, "usr")
            
            checkBootstrapInstallation()
        }

        AsyncFunction("getBootstrapInfo") { promise: Promise ->
            try {
                val info = HashMap<String, Any>()
                info["installed"] = isBootstrapInstalled
                if (isBootstrapInstalled) {
                    info["prefixPath"] = termuxPrefixDir.absolutePath
                    info["size"] = getDirectorySize(termuxPrefixDir)
                }
                promise.resolve(info)
            } catch (e: Exception) {
                promise.reject("GET_BOOTSTRAP_INFO_ERROR", e.message, e)
            }
        }

        AsyncFunction("createSession") { 
            sessionId: String,
            command: String, 
            args: List<String>, 
            cwd: String, 
            env: Map<String, String>,
            rows: Int,
            cols: Int,
            promise: Promise ->
            
            try {
                Log.i(LOG_TAG, "Creating session: $sessionId")
                
                val session = TermuxSessionFallback.create(
                    sessionId,
                    command,
                    args.toTypedArray(),
                    cwd,
                    env,
                    rows,
                    cols,
                    termuxPrefixDir.absolutePath
                )
                
                sessions[sessionId] = session
                
                val result = HashMap<String, Any>()
                result["id"] = sessionId
                result["pid"] = session.pid
                result["fileDescriptor"] = session.fileDescriptor
                result["isRunning"] = session.isRunning
                
                promise.resolve(result)
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Failed to create session", e)
                promise.reject("CREATE_SESSION_ERROR", e.message, e)
            }
        }

        AsyncFunction("writeToSession") { sessionId: String, data: String, promise: Promise ->
            try {
                val session = sessions[sessionId] ?: throw Exception("Session not found")
                session.write(data)
                promise.resolve(null)
            } catch (e: Exception) {
                promise.reject("WRITE_SESSION_ERROR", e.message, e)
            }
        }

        AsyncFunction("killSession") { sessionId: String, promise: Promise ->
            try {
                val session = sessions[sessionId]
                val found = if (session != null) {
                    session.kill()
                    sessions.remove(sessionId)
                    true
                } else false
                promise.resolve(found)
            } catch (e: Exception) {
                promise.reject("KILL_SESSION_ERROR", e.message, e)
            }
        }
    }

    private fun checkBootstrapInstallation() {
        isBootstrapInstalled = termuxPrefixDir.exists() && 
                             File(termuxPrefixDir, "bin").exists() &&
                             File(termuxPrefixDir, "bin/sh").exists()
        Log.i(LOG_TAG, "Bootstrap installed: $isBootstrapInstalled")
    }

    private fun getDirectorySize(dir: File): Long {
        return if (dir.exists()) {
            dir.walkTopDown().filter { it.isFile }.map { it.length() }.sum()
        } else {
            0L
        }
    }
}