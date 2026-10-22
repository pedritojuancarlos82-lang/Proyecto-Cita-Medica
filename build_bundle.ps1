# Script PowerShell para compilar js/app.bundle.js a partir de los módulos
$bundleFiles = @(
  'js/supabase-config.js',
  'js/supabase-client.js',
  'js/qr-generator.js',
  'js/data/consultation-catalog.js',
  'js/catalogo-motivos.js',
  'js/models/patient-record.js',
  'js/services/medical-service.js',
  'js/services/collision-engine.js',
  'js/services/qr-token-service.js',
  'js/services/email-service.js',
  'js/validaciones-globales.js',
  'js/ambient-background.js',
  'js/state.js',
  'js/auth.js',
  'js/patient.js',
  'js/doctor.js',
  'js/accountant.js',
  'js/app.js'
)

$bundleParts = [System.Collections.Generic.List[string]]::new()
$bundleParts.Add("// Montepiedra Salud - Bundle Unificado de Producción (Compatible con file:/// y http://)`n")

foreach ($file in $bundleFiles) {
  if (Test-Path $file) {
    $content = Get-Content -Path $file -Raw -Encoding UTF8
    
    # Eliminar import statements
    $content = [regex]::Replace($content, "import\s+[\s\S]*?from\s+['`"][^'`"]*?['`"];?\r?\n?", "")
    $content = [regex]::Replace($content, "import\s+['`"][^'`"]*?['`"];?\r?\n?", "")
    
    # Eliminar export default
    $content = [regex]::Replace($content, "export\s+default\s+", "")
    # Reemplazar export async function
    $content = [regex]::Replace($content, "export\s+async\s+function\s+", "async function ")
    # Reemplazar export const/let/var/function/class
    $content = [regex]::Replace($content, "export\s+(const|let|var|function|class)\s+", "`$1 ")
    # Eliminar export { ... }
    $content = [regex]::Replace($content, "export\s*\{[\s\S]*?\};?\r?\n?", "")
    
    $bundleParts.Add("`n// ==================== $file ====================`n")
    $bundleParts.Add($content)
  } else {
    Write-Warning "No se encontró el archivo: $file"
  }
}

$outputContent = [string]::Join("`n", $bundleParts)
$outputPath = Join-Path $PSScriptRoot "js/app.bundle.js"
if (-not (Test-Path (Split-Path $outputPath))) {
  $outputPath = "c:\Users\AlumnosMTP\Desktop\Proyecto\js\app.bundle.js"
}
[System.IO.File]::WriteAllText($outputPath, $outputContent, [System.Text.Encoding]::UTF8)
Write-Output "Bundle generado exitosamente en $outputPath. Longitud: $($outputContent.Length) caracteres."
