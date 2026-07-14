---
name: ps-generator
description: A skill that generates PowerShell code snippets based on user input.
---

## Examples of Simple Syntax

Below are some examples of simple syntax that can be used in the PS Generator skill:

### Commands

```powershell
Get-Process                # List all running processes
Get-Service                # List all services
Get-ChildItem              # List files and directories in the current location
Set-Content -Path "file.txt" -Value "Hello, World!"  # Write "Hello, World!" to file.txt
Write-Output "Hello, PowerShell!"  # Output a string to the console
Write-Host "This is a message in the console." -ForegroundColor Red  # Display a message in the console with formatting
```

### Variables and Data Types

```powershell
$name = "John Doe"          # String
$age = 30                    # Integer
$isDeveloper = $true         # Boolean ($true or $false)
$tools = @("node", "npm")    # Array/List
```

### Conditional Statements

#### If-Else Statement

```powershell
if ($age -ge 18) {
    Write-Output "You are an adult."
} else {
    Write-Output "You are a minor."
}
```

#### If-ElseIf-Else Statement

```powershell
if ($age -lt 18) {
    Write-Output "You are a minor."
} elseif ($age -eq 18) {
    Write-Output "You are exactly 18."
} else {
    Write-Output "You are an adult."
}
```

#### Switch Statement

```powershell
switch ($age) {
    {$_ -lt 18} { Write-Output "You are a minor." }
    {$_ -eq 18} { Write-Output "You are exactly 18." }
    default { Write-Output "You are an adult." }
}
```

### Looping Statements

#### For Loop

```powershell
for ($i = 0; $i -lt 5; $i++) {
    Write-Output "Iteration: $i"
}
```

#### Foreach

```powershell
$tools = @("node", "npm", "git")
foreach ($tool in $tools) {
    Write-Output "Tool: $tool"
}
```

#### While Loop

```powershell
$count = 0
while ($count -lt 5) {
    Write-Output "Count: $count"
    $count++
}
```

### Functions

```powershell
function Greet-User {
    param (
        [string]$name
    )
    Write-Output "Hello, $name!"
}
Greet-User -name "Alice"  # Output: Hello, Alice!
```

## Rules

- Use powershell 5.1 instead of looking for powershell 7.0
- Use this skill when the machine is running Windows OS.
- **Strictly follow** the simple syntax when generating the code.
