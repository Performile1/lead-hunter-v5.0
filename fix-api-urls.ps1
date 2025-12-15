# Replace all hardcoded localhost:3001 URLs with API_BASE_URL
$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw
    $originalContent = $content
    
    # Replace localhost:3001/api with ${API_BASE_URL}
    $content = $content -replace "fetch\('http://localhost:3001/api/", "fetch(`${API_BASE_URL}/"
    $content = $content -replace 'fetch\("http://localhost:3001/api/', 'fetch(`${API_BASE_URL}/'
    $content = $content -replace "fetch\(`http://localhost:3001/api/", "fetch(`${API_BASE_URL}/"
    
    # Add import if API_BASE_URL is used and not already imported
    if ($content -match '\$\{API_BASE_URL\}' -and $content -notmatch "import.*API_BASE_URL") {
        # Find the last import statement
        if ($content -match "(?s)(import.*?from.*?;)") {
            $lastImport = $Matches[0]
            $importToAdd = "`nimport { API_BASE_URL } from '../../utils/api';"
            
            # Adjust path based on file location
            $relativePath = $file.DirectoryName -replace [regex]::Escape($PWD.Path), ""
            $depth = ($relativePath -split "\\").Count - 2
            $pathPrefix = "../" * $depth
            $importToAdd = "`nimport { API_BASE_URL } from '${pathPrefix}utils/api';"
            
            $content = $content -replace "(?s)(import.*?from.*?;)", "`$1$importToAdd"
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nDone! All localhost:3001 URLs replaced with API_BASE_URL"
