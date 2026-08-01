# merlin
Merlin Business Operating System - Enterprise entity management platform

## Platform control plane

The active Node service now exposes a first-milestone platform control plane under `/api/v1/platform` for:
- creating workload definitions
- launching isolated runtime instances through a development-safe simulated microVM executor
- listing runtime status, lifecycle history, and runtime logs
- stopping and deleting runtimes without executing tenant software in the API process
