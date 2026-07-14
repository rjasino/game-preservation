param(
    [switch]$Install
)

$tools = @("node", "git", "npm", "opencode")
$passed = 0
$failed = 0

function Write-Color {
    param([string]$Text, [string]$Color = "White")
    Write-Host $Text -ForegroundColor $Color
}

Write-Color "========================================" "Cyan"
Write-Color "  Tool Check Script" "Cyan"
Write-Color "========================================" "Cyan"

foreach ($tool in $tools) {
    Write-Color "----------------------------------------" "Gray"
    Write-Color "Checking $tool..." "Yellow"

    if ($tool -eq "node") {
        $version = & node --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Color "[PASS] node is available. Version: $version" "Green"
            $passed++
        } else {
            Write-Color "$version" "Red"
            if ($Install) {
                Write-Color "Installing node..." "Yellow"
                winget install OpenJS.NodeJS.LTS -e --accept-source-agreements 2>&1 | Out-Host
                Write-Color "node installed." "Green"
            } else {
                $failed++
            }
        }
    } elseif ($tool -eq "git") {
        $version = & git --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Color "[PASS] git is available. Version: $version" "Green"
            $passed++
        } else {
            Write-Color "$version" "Red"
            if ($Install) {
                Write-Color "Installing git..." "Yellow"
                winget install Git.Git -e --accept-source-agreements 2>&1 | Out-Host
                Write-Color "git installed." "Green"
            } else {
                $failed++
            }
        }
    } elseif ($tool -eq "npm") {
        $version = & npm --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Color "[PASS] npm is available. Version: $version" "Green"
            $passed++
        } else {
            $errorMsg = $version
            Write-Color "$errorMsg" "Red"
            if ($errorMsg -match "cannot be loaded because running scripts is disabled") {
                Write-Color "Resolving execution policy..." "Yellow"
                Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned -Force
                Write-Color "Execution policy updated. Retrying npm..." "Yellow"
                $version = & npm --version 2>&1
                if ($LASTEXITCODE -eq 0) {
                    Write-Color "[PASS] npm is available. Version: $version" "Green"
                    $passed++
                } else {
                    Write-Color "npm check failed after policy update." "Red"
                    $failed++
                }
            } else {
                if ($Install) {
                    Write-Color "npm should be installed with node. Please reinstall node." "Red"
                    $failed++
                } else {
                    $failed++
                }
            }
        }
    } elseif ($tool -eq "opencode") {
        $version = & opencode --version 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Color "[PASS] opencode is available. Version: $version" "Green"
            $passed++
        } else {
            Write-Color "$version" "Red"
            if ($Install) {
                Write-Color "Installing opencode..." "Yellow"
                npm install -g opencode-ai 2>&1 | Out-Host
                Write-Color "opencode installed." "Green"
            } else {
                $failed++
            }
        }
    }
}

Write-Color "========================================" "Cyan"
Write-Color "  Check complete. Passed: $passed, Failed: $failed" "Cyan"
Write-Color "========================================" "Cyan"
