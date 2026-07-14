---
description: Generate tool check script for the current machine to check installed development tools.
---

## Step by Step Procedure

Follow these steps when generating the script

### Step 1:

Check first the operating system of the current machine and load the appropriate skill:

- If Windows load: skill({name: "ps-generator"})
- If Linux load: skill({name: "bash-generator"})
- If MacOS load: skill({name: "zsh-generator"})

### Step 2:

Create parameter for option to install.

### Step 3:

Create variables for tool listing and for pass and fail flag.

### Step 4:

- Display Tool check script message then loop through all the tool list.
- Run check version for each tool.
- If check failed, install the tool.

### Rules

- Check `node` first.
- Check if the current tool is `npm` then if fails resolve the blocking issue by giving permission to run script.
- When tool is installing, display the log on screen to identify the progress of if installation was completed.
- Filename should be `tool-check` with appropriate file extension.
  - `.ps1` for Powershell
  - `.sh` for Bash and Zsh
- Use color coding if possible.
- Follow this logging display:

```text
========================================
  Tool Check Script
========================================
----------------------------------------
Checking <tool>...
[PASS] <tool> is available. Version: <version_number>
----------------------------------------
Checking <tool>...
<error_message>
----------------------------------------
Installing <tool>...
<log>
----------------------------------------
<tool> installed.

========================================
  Check complete. Passed: 6, Failed: 0
========================================
```
