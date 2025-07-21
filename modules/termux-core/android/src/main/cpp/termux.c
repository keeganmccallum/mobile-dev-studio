#include <jni.h>
#include <android/log.h>
#include <sys/wait.h>
#include <sys/ioctl.h>
#include <termios.h>
#include <unistd.h>
#include <fcntl.h>
#include <stdlib.h>
#include <string.h>
#include <errno.h>
#include <sys/types.h>

#define LOG_TAG "TermuxJNI"
#define LOGE(...) __android_log_print(ANDROID_LOG_ERROR, LOG_TAG, __VA_ARGS__)
#define LOGW(...) __android_log_print(ANDROID_LOG_WARN, LOG_TAG, __VA_ARGS__)
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, LOG_TAG, __VA_ARGS__)
#define LOGD(...) __android_log_print(ANDROID_LOG_DEBUG, LOG_TAG, __VA_ARGS__)

static int throw_runtime_exception(JNIEnv* env, char const* message) {
    jclass exClass = (*env)->FindClass(env, "java/lang/RuntimeException");
    (*env)->ThrowNew(env, exClass, message);
    return -1;
}

JNIEXPORT jint JNICALL
Java_com_termux_terminal_JNI_createSubprocess(JNIEnv *env, jclass clazz,
                                              jstring cmd, jstring cwd, jobjectArray args,
                                              jobjectArray envVars, jintArray processIdArray,
                                              jint rows, jint cols, jint cellWidth, jint cellHeight) {
    
    LOGI("createSubprocess called");
    
    // Create a pseudo-terminal pair
    int ptm = posix_openpt(O_RDWR | O_CLOEXEC);
    if (ptm < 0) {
        LOGE("Failed to create PTY master: %s", strerror(errno));
        return throw_runtime_exception(env, "Failed to create PTY master");
    }
    
    if (grantpt(ptm) != 0 || unlockpt(ptm) != 0) {
        LOGE("Failed to grant/unlock PTY: %s", strerror(errno));
        close(ptm);
        return throw_runtime_exception(env, "Failed to grant/unlock PTY");
    }
    
    // Get the slave PTY name
    char* pts_name = ptsname(ptm);
    if (!pts_name) {
        LOGE("Failed to get PTY slave name: %s", strerror(errno));
        close(ptm);
        return throw_runtime_exception(env, "Failed to get PTY slave name");
    }
    
    LOGD("PTY master fd: %d, slave: %s", ptm, pts_name);
    
    // Set initial terminal size
    struct winsize ws;
    ws.ws_row = rows;
    ws.ws_col = cols;
    ws.ws_xpixel = cellWidth * cols;
    ws.ws_ypixel = cellHeight * rows;
    ioctl(ptm, TIOCSWINSZ, &ws);
    
    // Get command string
    const char* cmdStr = (*env)->GetStringUTFChars(env, cmd, NULL);
    const char* cwdStr = (*env)->GetStringUTFChars(env, cwd, NULL);
    
    // Prepare arguments array
    jsize argCount = (*env)->GetArrayLength(env, args);
    char** argv = malloc((argCount + 2) * sizeof(char*));
    argv[0] = (char*)cmdStr;
    
    for (int i = 0; i < argCount; i++) {
        jstring arg = (jstring)(*env)->GetObjectArrayElement(env, args, i);
        const char* argStr = (*env)->GetStringUTFChars(env, arg, NULL);
        argv[i + 1] = strdup(argStr);
        (*env)->ReleaseStringUTFChars(env, arg, argStr);
        (*env)->DeleteLocalRef(env, arg);
    }
    argv[argCount + 1] = NULL;
    
    // Prepare environment array
    jsize envCount = (*env)->GetArrayLength(env, envVars);
    char** envp = malloc((envCount + 1) * sizeof(char*));
    
    for (int i = 0; i < envCount; i++) {
        jstring envVar = (jstring)(*env)->GetObjectArrayElement(env, envVars, i);
        const char* envStr = (*env)->GetStringUTFChars(env, envVar, NULL);
        envp[i] = strdup(envStr);
        (*env)->ReleaseStringUTFChars(env, envVar, envStr);
        (*env)->DeleteLocalRef(env, envVar);
    }
    envp[envCount] = NULL;
    
    // Fork the process
    pid_t pid = fork();
    if (pid < 0) {
        LOGE("Fork failed: %s", strerror(errno));
        close(ptm);
        // Clean up allocated memory
        for (int i = 1; i <= argCount; i++) {
            if (argv[i]) free(argv[i]);
        }
        free(argv);
        for (int i = 0; i < envCount; i++) {
            if (envp[i]) free(envp[i]);
        }
        free(envp);
        (*env)->ReleaseStringUTFChars(env, cmd, cmdStr);
        (*env)->ReleaseStringUTFChars(env, cwd, cwdStr);
        return throw_runtime_exception(env, "Fork failed");
    }
    
    if (pid == 0) {
        // Child process
        
        // Create a new session
        if (setsid() < 0) {
            LOGE("setsid failed: %s", strerror(errno));
            exit(1);
        }
        
        // Open the slave PTY
        int pts = open(pts_name, O_RDWR);
        if (pts < 0) {
            LOGE("Failed to open PTY slave: %s", strerror(errno));
            exit(1);
        }
        
        // Make the slave PTY the controlling terminal
        if (ioctl(pts, TIOCSCTTY, 0) < 0) {
            LOGE("Failed to set controlling terminal: %s", strerror(errno));
            exit(1);
        }
        
        // Redirect stdin, stdout, stderr to the slave PTY
        if (dup2(pts, STDIN_FILENO) < 0 || 
            dup2(pts, STDOUT_FILENO) < 0 || 
            dup2(pts, STDERR_FILENO) < 0) {
            LOGE("Failed to redirect stdio: %s", strerror(errno));
            exit(1);
        }
        
        // Close the slave PTY since we've duplicated it
        close(pts);
        
        // Change to the specified working directory
        if (chdir(cwdStr) != 0) {
            LOGE("Failed to change directory to %s: %s", cwdStr, strerror(errno));
            // Don't exit, just continue with current directory
        }
        
        // Execute the command
        execve(cmdStr, argv, envp);
        
        // If we get here, execve failed
        LOGE("execve failed: %s", strerror(errno));
        exit(1);
    }
    
    // Parent process
    LOGI("Child process started with PID: %d", pid);
    
    // Store the process ID in the array
    jint* pids = (*env)->GetIntArrayElements(env, processIdArray, NULL);
    pids[0] = pid;
    (*env)->ReleaseIntArrayElements(env, processIdArray, pids, 0);
    
    // Clean up allocated memory
    for (int i = 1; i <= argCount; i++) {
        if (argv[i]) free(argv[i]);
    }
    free(argv);
    for (int i = 0; i < envCount; i++) {
        if (envp[i]) free(envp[i]);
    }
    free(envp);
    
    (*env)->ReleaseStringUTFChars(env, cmd, cmdStr);
    (*env)->ReleaseStringUTFChars(env, cwd, cwdStr);
    
    return ptm;
}

JNIEXPORT void JNICALL
Java_com_termux_terminal_JNI_setPtyWindowSize(JNIEnv *env, jclass clazz,
                                              jint fd, jint rows, jint cols, 
                                              jint cellWidth, jint cellHeight) {
    struct winsize ws;
    ws.ws_row = rows;
    ws.ws_col = cols;
    ws.ws_xpixel = cellWidth * cols;
    ws.ws_ypixel = cellHeight * rows;
    
    if (ioctl(fd, TIOCSWINSZ, &ws) < 0) {
        LOGE("Failed to set window size: %s", strerror(errno));
    } else {
        LOGD("Set PTY window size: %dx%d", cols, rows);
    }
}

JNIEXPORT jint JNICALL
Java_com_termux_terminal_JNI_waitFor(JNIEnv *env, jclass clazz, jint pid) {
    int status;
    if (waitpid(pid, &status, 0) < 0) {
        LOGE("waitpid failed for PID %d: %s", pid, strerror(errno));
        return -1;
    }
    
    if (WIFEXITED(status)) {
        int exitCode = WEXITSTATUS(status);
        LOGD("Process %d exited with code %d", pid, exitCode);
        return exitCode;
    } else if (WIFSIGNALED(status)) {
        int signal = WTERMSIG(status);
        LOGD("Process %d killed by signal %d", pid, signal);
        return -signal;
    }
    
    return -1;
}

JNIEXPORT void JNICALL
Java_com_termux_terminal_JNI_close(JNIEnv *env, jclass clazz, jint fd) {
    if (close(fd) < 0) {
        LOGE("Failed to close fd %d: %s", fd, strerror(errno));
    } else {
        LOGD("Closed fd %d", fd);
    }
}