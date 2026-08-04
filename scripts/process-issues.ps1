# process-issues.ps1 - Script principal del Agente Automático de Issues
# =====================================================================

# Cargar configuración
. "$PSScriptRoot\config.ps1"

function Get-OpenIssuesWithIA {
    <#
    .SYNOPSIS
    Obtiene todos los issues abiertos que contienen "@ia" en título o cuerpo
    Nota: GitHub no permite buscar "@" en search, así que obtenemos todos y filtramos localmente
    #>

    Write-Log "Buscando issues con '$script:SearchPattern'..."

    try {
        # Cambiar al directorio del repositorio
        Set-Location $script:RepoPath

        # Obtener TODOS los issues abiertos (GitHub search no funciona con @)
        $issuesJson = gh issue list `
            --repo $script:RepoName `
            --state open `
            --json number,title,body,labels `
            --limit 50 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Log "Error al obtener issues: $issuesJson" "ERROR"
            return @()
        }

        $allIssues = $issuesJson | ConvertFrom-Json

        if (-not $allIssues -or $allIssues.Count -eq 0) {
            Write-Log "No hay issues abiertos en el repositorio"
            return @()
        }

        # Filtrar localmente por @ia en título o body (case-insensitive)
        $issues = $allIssues | Where-Object {
            $_.title -match $script:SearchPattern -or $_.body -match $script:SearchPattern
        }

        if (-not $issues -or @($issues).Count -eq 0) {
            Write-Log "No se encontraron issues con '$script:SearchPattern'"
            return @()
        }

        # Asegurar que siempre es un array
        $issues = @($issues)

        Write-Log "Encontrados $($issues.Count) issues con '$script:SearchPattern'"
        return $issues
    }
    catch {
        Write-Log "Error al buscar issues: $_" "ERROR"
        return @()
    }
}

function Test-IssueAlreadyProcessed {
    <#
    .SYNOPSIS
    Verifica si un issue ya está siendo procesado o ya fue procesado
    #>
    param(
        [object]$Issue
    )

    $labels = $Issue.labels | ForEach-Object { $_.name }

    # Verificar si tiene alguno de los labels de procesamiento
    $processingLabels = @(
        $script:Labels.Processing,
        $script:Labels.Review,
        $script:Labels.Done,
        $script:Labels.Processed
    )

    foreach ($label in $processingLabels) {
        if ($labels -contains $label) {
            return $true
        }
    }

    return $false
}

function Start-IssueProcessing {
    <#
    .SYNOPSIS
    Marca un issue como en procesamiento
    #>
    param(
        [int]$IssueNumber
    )

    Write-Log "Marcando issue #$IssueNumber como en procesamiento..."

    gh issue edit $IssueNumber --repo $script:RepoName --add-label $script:Labels.Processing 2>&1 | Out-Null

    if ($LASTEXITCODE -ne 0) {
        Write-Log "Error al añadir label de procesamiento al issue #$IssueNumber" "ERROR"
        return $false
    }

    return $true
}

function Stop-IssueProcessingOnError {
    <#
    .SYNOPSIS
    Maneja errores durante el procesamiento de un issue
    #>
    param(
        [int]$IssueNumber,
        [string]$ErrorMessage
    )

    Write-Log "Error procesando issue #$IssueNumber : $ErrorMessage" "ERROR"

    # Comentar el error en el issue
    $comment = @"
:warning: **Agente IA - Error**

Ocurrió un error al procesar este issue:

``````
$ErrorMessage
``````

Por favor revisa el issue y vuelve a intentarlo.
"@

    gh issue comment $IssueNumber --repo $script:RepoName --body $comment 2>&1 | Out-Null

    # Quitar el label de procesamiento
    gh issue edit $IssueNumber --repo $script:RepoName --remove-label $script:Labels.Processing 2>&1 | Out-Null
}

function Invoke-ProcessIssues {
    <#
    .SYNOPSIS
    Función principal que procesa todos los issues pendientes
    #>

    Write-Log "=========================================="
    Write-Log "Iniciando procesamiento de issues"
    Write-Log "=========================================="

    # Verificar que gh está instalado y autenticado
    $ghStatus = gh auth status 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "GitHub CLI no está autenticado. Ejecuta 'gh auth login'" "ERROR"
        return
    }

    # Verificar que opencode está disponible
    $opencodeVersion = opencode --version 2>&1
    if ($LASTEXITCODE -ne 0) {
        Write-Log "OpenCode no está instalado o no está en PATH" "ERROR"
        return
    }

    Write-Log "OpenCode versión: $opencodeVersion"

    # Obtener issues con @IA
    $issues = Get-OpenIssuesWithIA

    if ($issues.Count -eq 0) {
        Write-Log "No hay issues pendientes para procesar"
        return
    }

    # Filtrar issues que ya están siendo procesados
    $pendingIssues = $issues | Where-Object { -not (Test-IssueAlreadyProcessed $_) }

    if ($pendingIssues.Count -eq 0) {
        Write-Log "Todos los issues con '$script:SearchPattern' ya están siendo procesados o completados"
        return
    }

    Write-Log "Issues pendientes de procesar: $($pendingIssues.Count)"

    # Procesar cada issue
    foreach ($issue in $pendingIssues) {
        $issueNumber = $issue.number
        $issueTitle = $issue.title
        $issueBody = $issue.body

        Write-Log "------------------------------------------"
        Write-Log "Procesando Issue #$issueNumber : $issueTitle"

        # Marcar como en procesamiento
        if (-not (Start-IssueProcessing -IssueNumber $issueNumber)) {
            continue
        }

        try {
            # Ejecutar el script de resolución
            $solveScript = Join-Path $PSScriptRoot "solve-issue.ps1"

            & $solveScript `
                -IssueNumber $issueNumber `
                -IssueTitle $issueTitle `
                -IssueBody $issueBody

            if ($LASTEXITCODE -ne 0) {
                Stop-IssueProcessingOnError `
                    -IssueNumber $issueNumber `
                    -ErrorMessage "El script de resolución falló"
            }
        }
        catch {
            Stop-IssueProcessingOnError `
                -IssueNumber $issueNumber `
                -ErrorMessage $_.Exception.Message
        }
    }

    Write-Log "=========================================="
    Write-Log "Procesamiento completado"
    Write-Log "=========================================="
}

# Ejecutar
Invoke-ProcessIssues
