# Background jobs sidebar

[简体中文](README.zh.md)

The expanded left sidebar lists live jobs directly above the account control.
It shows the jobs and their owners across sessions, including shared jobs.
Select a row with a known session to open its conversation.
The list updates as jobs start, begin stopping, and settle.

The bundle targets DeepSeek Harness `0.2.2-rc.5`.
Run `npm ci` in this checkout to install and build it, then choose the directory in **Plugins** > **Add plugin**.
Disable **Background jobs sidebar** from **Plugins**.

The list follows the same DSH job registry as the session header.
It also shows foreground commands while DSH tracks them as jobs.
[Development and verification](docs/README.md)
