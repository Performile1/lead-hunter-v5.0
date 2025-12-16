$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Fix incorrect import paths for API_BASE_URL
    $content = $content -replace "from '../../../utils/api'", "from '../../utils/api'"
    $content = $content -replace "from '../../../config/api'", "from '../../config/api'"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "`nDone!"
