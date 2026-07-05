' تشغيل لوحة التحكم بدون نافذة Command Prompt
Set WShell = CreateObject("WScript.Shell")
strBat = Replace(WScript.ScriptFullName, ".vbs", ".bat")
WShell.Run """" & strBat & """", 0, False
Set WShell = Nothing
