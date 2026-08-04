# setup-scheduler.ps1 - Configura la tarea programada de Windows
# ==============================================================

# Cargar configuración
. "$PSScriptRoot\config.ps1"

$TaskName = "IA-Issues-Agent"
$TaskDescription = "Agente automático que procesa issues de GitHub con @IA"

function Test-Administrator {
    $currentUser = [Security.Principal.WindowsIdentity]::GetCurrent()
    $principal = New-Object Security.Principal.WindowsPrincipal($currentUser)
    return $principal.IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
}

function Install-ScheduledTask {
    Write-Log "Configurando tarea programada: $TaskName"

    # Verificar permisos de administrador
    if (-not (Test-Administrator)) {
        Write-Log "Se requieren permisos de administrador para crear tareas programadas" "ERROR"
        Write-Log "Ejecuta este script como administrador" "ERROR"
        return $false
    }

    # Eliminar tarea existente si existe
    $existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if ($existingTask) {
        Write-Log "Eliminando tarea existente..."
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
    }

    # Ruta completa al script principal
    $scriptPath = Join-Path $PSScriptRoot "process-issues.ps1"

    # Crear la acción (ejecutar PowerShell con el script)
    $action = New-ScheduledTaskAction `
        -Execute "powershell.exe" `
        -Argument "-NoProfile -ExecutionPolicy Bypass -File `"$scriptPath`"" `
        -WorkingDirectory $script:RepoPath

    # Crear el trigger (cada X minutos)
    $trigger = New-ScheduledTaskTrigger `
        -Once `
        -At (Get-Date) `
        -RepetitionInterval (New-TimeSpan -Minutes $script:ExecutionInterval) `
        -RepetitionDuration (New-TimeSpan -Days 9999)

    # Configuración de la tarea
    $settings = New-ScheduledTaskSettingsSet `
        -AllowStartIfOnBatteries `
        -DontStopIfGoingOnBatteries `
        -StartWhenAvailable `
        -RunOnlyIfNetworkAvailable `
        -MultipleInstances IgnoreNew

    # Principal (usuario actual)
    $principal = New-ScheduledTaskPrincipal `
        -UserId $env:USERNAME `
        -LogonType Interactive `
        -RunLevel Limited

    # Registrar la tarea
    try {
        Register-ScheduledTask `
            -TaskName $TaskName `
            -Description $TaskDescription `
            -Action $action `
            -Trigger $trigger `
            -Settings $settings `
            -Principal $principal `
            -Force | Out-Null

        Write-Log "Tarea programada creada exitosamente"
        Write-Log "Intervalo de ejecución: cada $script:ExecutionInterval minutos"

        return $true
    }
    catch {
        Write-Log "Error al crear tarea programada: $_" "ERROR"
        return $false
    }
}

function Uninstall-ScheduledTask {
    Write-Log "Eliminando tarea programada: $TaskName"

    if (-not (Test-Administrator)) {
        Write-Log "Se requieren permisos de administrador" "ERROR"
        return $false
    }

    $existingTask = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue
    if (-not $existingTask) {
        Write-Log "La tarea no existe" "WARN"
        return $true
    }

    try {
        Unregister-ScheduledTask -TaskName $TaskName -Confirm:$false
        Write-Log "Tarea eliminada exitosamente"
        return $true
    }
    catch {
        Write-Log "Error al eliminar tarea: $_" "ERROR"
        return $false
    }
}

function Get-TaskStatus {
    $task = Get-ScheduledTask -TaskName $TaskName -ErrorAction SilentlyContinue

    if (-not $task) {
        Write-Host "Estado: NO INSTALADA" -ForegroundColor Yellow
        return
    }

    $taskInfo = Get-ScheduledTaskInfo -TaskName $TaskName

    Write-Host ""
    Write-Host "=== Estado de la Tarea Programada ===" -ForegroundColor Cyan
    Write-Host "Nombre: $TaskName"
    Write-Host "Estado: $($task.State)"
    Write-Host "Última ejecución: $($taskInfo.LastRunTime)"
    Write-Host "Resultado último: $($taskInfo.LastTaskResult)"
    Write-Host "Próxima ejecución: $($taskInfo.NextRunTime)"
    Write-Host ""
}

function Show-Menu {
    Write-Host ""
    Write-Host "=== Configuración del Agente IA ===" -ForegroundColor Cyan
    Write-Host "1. Instalar tarea programada"
    Write-Host "2. Desinstalar tarea programada"
    Write-Host "3. Ver estado de la tarea"
    Write-Host "4. Ejecutar procesamiento ahora (manual)"
    Write-Host "5. Salir"
    Write-Host ""
}

# Menú principal
param(
    [ValidateSet("install", "uninstall", "status", "run", "menu")]
    [string]$Action = "menu"
)

switch ($Action) {
    "install" {
        Install-ScheduledTask
    }
    "uninstall" {
        Uninstall-ScheduledTask
    }
    "status" {
        Get-TaskStatus
    }
    "run" {
        Write-Log "Ejecutando procesamiento manual..."
        & "$PSScriptRoot\process-issues.ps1"
    }
    "menu" {
        do {
            Show-Menu
            $choice = Read-Host "Selecciona una opción"

            switch ($choice) {
                "1" { Install-ScheduledTask }
                "2" { Uninstall-ScheduledTask }
                "3" { Get-TaskStatus }
                "4" {
                    Write-Log "Ejecutando procesamiento manual..."
                    & "$PSScriptRoot\process-issues.ps1"
                }
                "5" { Write-Host "Saliendo..." }
                default { Write-Host "Opción inválida" -ForegroundColor Red }
            }
        } while ($choice -ne "5")
    }
}
