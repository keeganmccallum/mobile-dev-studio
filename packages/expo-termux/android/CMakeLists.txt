cmake_minimum_required(VERSION 3.18.1)
project(termux)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 14)

file(GLOB_RECURSE SOURCES_C "src/main/cpp/*.c")
file(GLOB_RECURSE SOURCES_CXX "src/main/cpp/*.cpp")
file(GLOB_RECURSE JNI_SOURCES_C "src/main/jni/*.c")

add_library(
  termux
  SHARED
  ${SOURCES_C}
  ${SOURCES_CXX}
  ${JNI_SOURCES_C}
)

target_include_directories(
  termux
  PRIVATE
  "src/main/cpp"
  "src/main/jni"
)

# Link with Android logging library
find_library(log-lib log)
target_link_libraries(termux ${log-lib})

# Link with Expo modules core (if available, otherwise skip)
find_package(expo-modules-core QUIET CONFIG)
if (expo-modules-core_FOUND)
  target_link_libraries(termux expo::modules::core)
else()
  # Fallback: just link with log library for now
  message(STATUS "expo-modules-core not found, building without it")
endif()