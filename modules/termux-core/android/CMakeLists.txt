cmake_minimum_required(VERSION 3.18.1)
project(termux-core)

set(CMAKE_VERBOSE_MAKEFILE ON)
set(CMAKE_CXX_STANDARD 14)

file(GLOB_RECURSE SOURCES_CXX "src/main/cpp/*.cpp")

add_library(
  termux-core
  SHARED
  ${SOURCES_CXX}
)

target_include_directories(
  termux-core
  PRIVATE
  "src/main/cpp"
)

# Link with Android logging library
find_library(log-lib log)
target_link_libraries(termux-core ${log-lib})

# Link with Expo modules core
find_package(expo-modules-core REQUIRED CONFIG)
target_link_libraries(termux-core expo::modules::core)