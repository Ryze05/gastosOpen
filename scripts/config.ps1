# Configuración del Agente Automático de Issues con IA
# =====================================================

# Ruta del repositorio
$script:RepoPath = "C:\Users\Usuario\Desktop\cursos\opencode\reto_final"

# Repositorio en formato owner/repo (para comandos gh)
$script:RepoName = "Ryze05/gastosOpen"

# Branch base para crear PRs
$script:BaseBranch = "main"

# Remote SSH alias configurado
$script:RemoteAlias = "origin"

# Intervalo de ejecución en minutos (para Task Scheduler)
$script:ExecutionInterval = 5

# Directorio de logs
$script:LogPath = "$script:RepoPath\scripts\logs"

# Prefijo para branches de issues
$script:BranchPrefix = "feature/issue-"

# Labels de GitHub
$script:Labels = @{
    Processing = "ia-processing"
    Review     = "ia-review"
    Done       = "ia-done"
    Processed  = "ia-processed"
}

# Patrón de búsqueda para issues (GitHub convierte a minúsculas)
$script:SearchPattern = "@ia"

# Función para escribir logs
function Write-Log {
    param(
        [string]$Message,
        [ValidateSet("INFO", "WARN", "ERROR")]
        [string]$Level = "INFO"
    )

    $timestamp = Get-Date -Format "yyyy-MM-dd HH:mm:ss"
    $logEntry = "[$timestamp] [$Level] $Message"

    # Crear directorio de logs si no existe
    if (-not (Test-Path $script:LogPath)) {
        New-Item -ItemType Directory -Path $script:LogPath -Force | Out-Null
    }

    # Archivo de log del día
    $logFile = Join-Path $script:LogPath "$(Get-Date -Format 'yyyy-MM-dd').log"

    # Escribir al archivo y consola
    Add-Content -Path $logFile -Value $logEntry

    switch ($Level) {
        "ERROR" { Write-Host $logEntry -ForegroundColor Red }
        "WARN"  { Write-Host $logEntry -ForegroundColor Yellow }
        default { Write-Host $logEntry -ForegroundColor Green }
    }
}

# Las variables y funciones se exportan automáticamente al usar dot-sourcing
