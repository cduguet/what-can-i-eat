# Agents intructions
The main user and developer documentation lives in the `docs/` directory.

# Coordination
All progress from agents, for coordination with other agents shuold be written in `CONTEXT.md`. Before starting a tasks, after finishing and completing a task, you shuold write your results in this file, so other agents can understand what has been done. Conversely, if you find that there is outdated information, or that you have updated a functionality or progress that is referred by this document, you should make sure of removing the outdated parts of this document. 

# Environments
When creating an environment and packages, you will write the information about how to use the environment, and how to update it on the `CONTEXT.md` file. Do not install packages that will be globally installed on this computer, only local installations. 

# Tests
For every component, perform as many tests as you can. 

# Autonomy
All tests and terminal executions should be perform automatically, without waiting for user feedback. Therefore, you will be mindful of using flags like `-y` when necessary, or implementing timeouts when executing something, so taht you can keep working if the command doesn't return anything after a while.

# Stack 
This application is made for Mobile and Web using Expo. Please be consistent with this stack. 

# Per module git committing
Every time an agent in coding mode, documentation mode, or any other mode that modifies the codebase finishes, it should add its data to git. No need to create a new branch, just stage the newly created and modified files, and commit them, with a comment on the developed features. Perform this step before coming back to the orchestrator or parent mode.