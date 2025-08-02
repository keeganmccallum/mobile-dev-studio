package expo.modules.expotermux

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import expo.modules.kotlin.Promise
import android.util.Log
import java.util.concurrent.ConcurrentHashMap
import java.util.Timer
import java.util.TimerTask
import expo.modules.termuxcore.TermuxSession

/**
 * Expo Termux Module - Provides REAL Termux session management for Expo apps
 * Using actual Termux terminal implementation with native PTY support
 */
class ExpoTermuxModule : Module() {
    private val sessions = ConcurrentHashMap<String, TermuxSession>()
    private val LOG_TAG = "ExpoTermuxModule"
    private val outputPollingTimer = Timer("TermuxOutputPoller", true)
    
    override fun definition() = ModuleDefinition {
        Name("ExpoTermux")
        
        // Events that this module can send
        Events("onSessionOutput", "onSessionExit", "onTitleChanged")
        
        // Test functions to verify module is working
        Function("test") {
            return@Function "Hello from ExpoTermux native module!"
        }
        
        AsyncFunction("testAsync") { promise: Promise ->
            promise.resolve("Hello from ExpoTermux async!")
        }
        
        // Create a new Termux session
        AsyncFunction("createSession") { 
            command: String?,
            cwd: String?,
            environment: Map<String, Any>?,
            promise: Promise ->
            
            try {
                val sessionId = "session_${System.currentTimeMillis()}"
                val workingDir = cwd ?: "/data/data/com.termux/files/home"
                val cmd = command ?: "/data/data/com.termux/files/usr/bin/bash"  // Real Termux shell
                val env = environment?.mapValues { it.value.toString() } ?: emptyMap()
                
                Log.i(LOG_TAG, "Creating REAL Termux session $sessionId with command: $cmd, cwd: $workingDir")
                
                // Use real Termux implementation with proper terminal integration
                val session = TermuxSession.create(
                    sessionId = sessionId,
                    command = cmd,
                    args = emptyArray(),
                    cwd = workingDir,
                    env = env,
                    rows = 24,
                    cols = 80,
                    prefixPath = "/data/data/com.termux/files/usr"  // Real Termux prefix
                )
                
                sessions[sessionId] = session
                
                // Start polling for output
                startOutputPolling(sessionId)
                
                val result = mapOf(
                    "sessionId" to sessionId,
                    "pid" to session.pid,
                    "command" to cmd,
                    "cwd" to workingDir,
                    "isRunning" to session.isRunning
                )
                
                Log.i(LOG_TAG, "✅ Session created successfully: $sessionId")
                promise.resolve(result)
                
            } catch (error: Exception) {
                Log.e(LOG_TAG, "❌ Failed to create session", error)
                promise.reject("SESSION_CREATE_ERROR", "Failed to create session: ${error.message}", error)
            }
        }
        
        // Get session info
        Function("getSession") { sessionId: String ->
            val session = sessions[sessionId]
            if (session != null) {
                return@Function mapOf(
                    "sessionId" to sessionId,
                    "pid" to session.pid,
                    "isRunning" to session.isRunning,
                    "exitCode" to session.exitCode
                )
            } else {
                return@Function null
            }
        }
        
        // Write data to session (execute command)
        AsyncFunction("writeToSession") { 
            sessionId: String,
            data: String,
            promise: Promise ->
            
            try {
                val session = sessions[sessionId]
                if (session == null) {
                    promise.reject("SESSION_NOT_FOUND", "Session $sessionId not found", null)
                    return@AsyncFunction
                }
                
                if (!session.isRunning) {
                    promise.reject("SESSION_NOT_RUNNING", "Session $sessionId is not running", null)
                    return@AsyncFunction
                }
                
                Log.i(LOG_TAG, "Writing to session $sessionId: $data")
                session.write(data)
                
                promise.resolve(true)
                
            } catch (error: Exception) {
                Log.e(LOG_TAG, "❌ Failed to write to session $sessionId", error)
                promise.reject("WRITE_ERROR", "Failed to write to session: ${error.message}", error)
            }
        }
        
        // Read output from session
        Function("readFromSession") { sessionId: String ->
            val session = sessions[sessionId]
            if (session != null) {
                val output = session.read()
                Log.d(LOG_TAG, "Read from session $sessionId: $output")
                return@Function output
            } else {
                Log.w(LOG_TAG, "Session $sessionId not found for read")
                return@Function ""
            }
        }
        
        // Kill session
        AsyncFunction("killSession") { 
            sessionId: String,
            promise: Promise ->
            
            try {
                val session = sessions[sessionId]
                if (session == null) {
                    promise.resolve(false)
                    return@AsyncFunction
                }
                
                Log.i(LOG_TAG, "Killing session $sessionId")
                session.kill()
                sessions.remove(sessionId)
                
                // Emit session exit event
                sendEvent("onSessionExit", mapOf(
                    "sessionId" to sessionId,
                    "exitCode" to session.exitCode
                ))
                
                promise.resolve(true)
                
            } catch (error: Exception) {
                Log.e(LOG_TAG, "❌ Failed to kill session $sessionId", error)
                promise.reject("KILL_ERROR", "Failed to kill session: ${error.message}", error)
            }
        }
    }
    
    private fun startOutputPolling(sessionId: String) {
        var pollCount = 0
        val maxPolls = 600 // Max 5 minutes of polling (600 * 500ms)
        
        outputPollingTimer.scheduleAtFixedRate(object : TimerTask() {
            override fun run() {
                pollCount++
                
                // Safety check - stop polling after max polls to prevent runaway timers
                if (pollCount >= maxPolls) {
                    Log.w(LOG_TAG, "Stopping polling for session $sessionId - max polls reached")
                    cancel()
                    return
                }
                
                val session = sessions[sessionId]
                if (session == null || !session.isRunning) {
                    // Session ended, emit exit event and stop polling
                    if (session != null) {
                        Log.i(LOG_TAG, "Session $sessionId ended, emitting exit event")
                        sendEvent("onSessionExit", mapOf(
                            "sessionId" to sessionId,
                            "exitCode" to session.exitCode
                        ))
                        sessions.remove(sessionId)
                    }
                    cancel()
                    return
                }
                
                try {
                    val output = session.read()
                    if (output.isNotEmpty()) {
                        Log.d(LOG_TAG, "Session $sessionId output: $output")
                        sendEvent("onSessionOutput", mapOf(
                            "sessionId" to sessionId,
                            "data" to output
                        ))
                    }
                } catch (e: Exception) {
                    Log.w(LOG_TAG, "Error reading session $sessionId output: ${e.message}")
                    // Don't cancel on read errors, just log them
                }
            }
        }, 500, 1000) // Start after 500ms, poll every 1000ms (reduced frequency)
    }
}