$files = Get-ChildItem -Path "src" -Filter "*.tsx" -Recurse | Where-Object { $_.FullName -notmatch "node_modules" }

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Check if file uses API_BASE_URL but doesn't import it
    if ($content -match '\$\{API_BASE_URL\}' -and $content -notmatch "import.*API_BASE_URL") {
        # Find the last import statement
        if ($content -match "(?s)(import[^;]+;)(?![\s\S]*import)") {
            $lastImport = $Matches[0]
            
            # Determine correct path based on file location
            $relativePath = $file.DirectoryName -replace [regex]::Escape((Get-Location).Path), ""
            $depth = ($relativePath -split "\\").Count - 2
            
            # Calculate path to utils/api
            if ($relativePath -match "src\\components\\admin") {
                $importPath = "../../../utils/api"
            } elseif ($relativePath -match "src\\components") {
                $importPath = "../../utils/api"
            } else {
                $importPath = "../utils/api"
            }
            
            $importToAdd = "`nimport { API_BASE_URL } from '$importPath';"
            
            # Add import after last import
            $content = $content -replace "(?s)(import[^;]+;)(?![\s\S]*import)", "`$1$importToAdd"
        }
    }
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "`nDone! All files now have API_BASE_URL imported"
