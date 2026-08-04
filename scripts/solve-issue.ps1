# solve-issue.ps1 - Resuelve un issue delegando al agente opencode
# =================================================================

param(
    [Parameter(Mandatory = $true)]
    [int]$IssueNumber,

    [Parameter(Mandatory = $true)]
    [string]$IssueTitle,

    [Parameter(Mandatory = $false)]
    [string]$IssueBody = ""
)

# Cargar configuración
. "$PSScriptRoot\config.ps1"

function Solve-Issue {
    param(
        [int]$Number,
        [string]$Title,
        [string]$Body
    )

    try {
        Write-Log "Iniciando resolución del issue #${Number} - $Title"

        # Cambiar al directorio del repositorio
        Set-Location $script:RepoPath

        # Asegurar que estamos en main actualizado
        git checkout $script:BaseBranch 2>&1 | Out-Null
        git pull $script:RemoteAlias $script:BaseBranch 2>&1 | Out-Null

        # Ejecutar OpenCode con nuestro agente
        $prompt = "Process GitHub issue #${Number}: $Title"
        Write-Log "Ejecutando agente opencode para issue #${Number}..."
        $output = opencode run --agent github-issue-agent --auto $prompt 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Log "Error al ejecutar el agente: $output" "ERROR"
            return $false
        }

        Write-Log "Agente completado exitosamente para issue #${Number}"

        Write-Log "Issue #${Number} procesado exitosamente"

        return $true
    }
    catch {
        Write-Log "Error procesando issue #${Number}: $_" "ERROR"

        try { git checkout $script:BaseBranch 2>&1 | Out-Null } catch { }

        return $false
    }
}

# Ejecutar
$result = Solve-Issue -Number $IssueNumber -Title $IssueTitle -Body $IssueBody
exit $(if ($result) { 0 } else { 1 })
