$files = Get-ChildItem -Path . -Recurse -Include *.tsx,*.ts -Exclude node_modules,dist,build

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Fix single-quoted template literals with ${API_BASE_URL}
    $content = $content -replace "'(\$\{API_BASE_URL\}[^']*)'", '`$1`'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "Done!"
