package expo.modules.termuxcore

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import expo.modules.kotlin.types.Enumerable

import android.content.Context
import android.os.Environment
import android.system.Os
import android.util.Log
import java.io.*
import java.util.*
import java.util.concurrent.ConcurrentHashMap
import java.util.zip.ZipInputStream
import kotlin.collections.HashMap

class TermuxCoreModule : Module() {
    private val LOG_TAG = "TermuxCore"
    private val sessions = ConcurrentHashMap<String, TermuxSession>()
    private var isBootstrapInstalled = false
    private lateinit var termuxFilesDir: File
    private lateinit var termuxPrefixDir: File

    override fun definition() = ModuleDefinition {
        Name("TermuxCore")

        Events("onSessionOutput", "onSessionExit", "onBootstrapProgress")

        OnCreate {
            Log.i(LOG_TAG, "TermuxCore module created")
            termuxFilesDir = File(appContext.cacheDir, "termux")
            termuxPrefixDir = File(termuxFilesDir, "usr")
            checkBootstrapInstallation()
        }

        AsyncFunction("getBootstrapInfo") { promise: Promise ->
            try {
                val info = HashMap<String, Any>()
                info["isInstalled"] = isBootstrapInstalled
                if (isBootstrapInstalled) {
                    info["path"] = termuxPrefixDir.absolutePath
                    info["size"] = getDirectorySize(termuxPrefixDir)
                }
                promise.resolve(info)
            } catch (e: Exception) {
                promise.reject("GET_BOOTSTRAP_INFO_ERROR", e.message, e)
            }
        }

        AsyncFunction("installBootstrap") { promise: Promise ->
            try {
                Log.i(LOG_TAG, "Starting bootstrap installation")
                sendEvent("onBootstrapProgress", mapOf("progress" to 0, "message" to "Starting installation..."))
                
                // Create directories
                termuxFilesDir.mkdirs()
                termuxPrefixDir.mkdirs()
                
                sendEvent("onBootstrapProgress", mapOf("progress" to 10, "message" to "Created directories"))
                
                // Extract bootstrap
                extractBootstrap()
                sendEvent("onBootstrapProgress", mapOf("progress" to 80, "message" to "Extracted bootstrap"))
                
                // Set permissions
                setBootstrapPermissions()
                sendEvent("onBootstrapProgress", mapOf("progress" to 95, "message" to "Set permissions"))
                
                isBootstrapInstalled = true
                sendEvent("onBootstrapProgress", mapOf("progress" to 100, "message" to "Installation complete"))
                
                Log.i(LOG_TAG, "Bootstrap installation completed successfully")
                promise.resolve(true)
            } catch (e: Exception) {
                Log.e(LOG_TAG, "Bootstrap installation failed", e)
                sendEvent("onBootstrapProgress", mapOf("progress" to -1, "message" to "Installation failed: ${e.message}"))
                promise.reject("INSTALL_BOOTSTRAP_ERROR", e.message, e)
            }
        }

        AsyncFunction("createSession") { 
            command: String, 
            args: List<String>, 
            cwd: String, 
            env: Map<String, String>,
            rows: Int,
            cols: Int,
            promise: Promise ->
            
            try {
                if (!isBootstrapInstalled) {
                    promise.reject("BOOTSTRAP_NOT_INSTALLED", "Bootstrap must be installed first", null)
                    return@AsyncFunction
                }

                val sessionId = UUID.randomUUID().toString()
                val session = TermuxSession.create(
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

        AsyncFunction("readFromSession") { sessionId: String, promise: Promise ->
            try {
                val session = sessions[sessionId] ?: throw Exception("Session not found")
                val output = session.read()
                promise.resolve(output)
            } catch (e: Exception) {
                promise.reject("READ_SESSION_ERROR", e.message, e)
            }
        }

        AsyncFunction("killSession") { sessionId: String, promise: Promise ->
            try {
                val session = sessions[sessionId]
                if (session != null) {
                    session.kill()
                    sessions.remove(sessionId)
                    promise.resolve(true)
                } else {
                    promise.resolve(false)
                }
            } catch (e: Exception) {
                promise.reject("KILL_SESSION_ERROR", e.message, e)
            }
        }

        AsyncFunction("readFile") { path: String, promise: Promise ->
            try {
                val file = File(termuxPrefixDir, path)
                if (file.exists() && file.isFile) {
                    val content = file.readText()
                    promise.resolve(content)
                } else {
                    promise.reject("FILE_NOT_FOUND", "File does not exist: $path", null)
                }
            } catch (e: Exception) {
                promise.reject("READ_FILE_ERROR", e.message, e)
            }
        }

        AsyncFunction("writeFile") { path: String, content: String, promise: Promise ->
            try {
                val file = File(termuxPrefixDir, path)
                file.parentFile?.mkdirs()
                file.writeText(content)
                promise.resolve(true)
            } catch (e: Exception) {
                promise.reject("WRITE_FILE_ERROR", e.message, e)
            }
        }

        AsyncFunction("listDirectory") { path: String, promise: Promise ->
            try {
                val dir = File(termuxPrefixDir, path)
                if (dir.exists() && dir.isDirectory) {
                    val files = dir.listFiles()?.map { it.name } ?: emptyList()
                    promise.resolve(files)
                } else {
                    promise.reject("DIRECTORY_NOT_FOUND", "Directory does not exist: $path", null)
                }
            } catch (e: Exception) {
                promise.reject("LIST_DIRECTORY_ERROR", e.message, e)
            }
        }
    }

    private fun checkBootstrapInstallation() {
        isBootstrapInstalled = termuxPrefixDir.exists() && 
                             File(termuxPrefixDir, "bin").exists() &&
                             File(termuxPrefixDir, "bin/sh").exists()
        Log.i(LOG_TAG, "Bootstrap installed: $isBootstrapInstalled")
    }

    private fun extractBootstrap() {
        val bootstrapAsset = "termux/bootstrap-aarch64.zip"
        
        appContext.assets.open(bootstrapAsset).use { inputStream ->
            ZipInputStream(BufferedInputStream(inputStream)).use { zip ->
                var entry = zip.nextEntry
                while (entry != null) {
                    val file = File(termuxPrefixDir, entry.name)
                    
                    if (entry.isDirectory) {
                        file.mkdirs()
                    } else {
                        file.parentFile?.mkdirs()
                        FileOutputStream(file).use { output ->
                            zip.copyTo(output)
                        }
                    }
                    
                    entry = zip.nextEntry
                }
            }
        }
        
        Log.i(LOG_TAG, "Bootstrap extracted to ${termuxPrefixDir.absolutePath}")
    }

    private fun setBootstrapPermissions() {
        // Set executable permissions for bin/ and other executable directories
        val executableDirs = listOf("bin", "libexec", "lib/apt/apt-helper", "lib/apt/methods")
        
        for (dirPath in executableDirs) {
            val dir = File(termuxPrefixDir, dirPath)
            if (dir.exists()) {
                dir.walkTopDown().forEach { file ->
                    if (file.isFile) {
                        try {
                            Os.chmod(file.absolutePath, 0x1c0) // 0700 in octal
                        } catch (e: Exception) {
                            Log.w(LOG_TAG, "Failed to set permissions for ${file.absolutePath}", e)
                        }
                    }
                }
            }
        }
    }

    private fun getDirectorySize(dir: File): Long {
        return if (dir.exists()) {
            dir.walkTopDown().filter { it.isFile }.map { it.length() }.sum()
        } else {
            0L
        }
    }

    companion object {
        init {
            System.loadLibrary("termux-core")
        }
    }
}