' Awais Download Fast - Silent Background Launcher
' Starts the Node.js server without showing any command prompt window
Set WshShell = CreateObject("WScript.Shell")
Set fso = CreateObject("Scripting.FileSystemObject")

ScriptDir = fso.GetParentFolderName(WScript.ScriptFullName)
ServerScript = ScriptDir & "\server.js"

' Check if node is available and start server silently
WshShell.CurrentDirectory = ScriptDir
WshShell.Run "node """ & ServerScript & """", 0, False

' Wait 1.5 seconds for server to initialize
WScript.Sleep 1500

' Open browser to local app
WshShell.Run "http://localhost:3000", 1, False
