$files = Get-ChildItem -Path . -Recurse -Include *.tsx,*.jsx -Exclude node_modules,dist,build

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Remove border-black classes
    $content = $content -replace 'border-2\s+border-black', ''
    $content = $content -replace '\s+border-black', ''
    $content = $content -replace 'border-black\s+', ''
    $content = $content -replace 'border-black', ''
    
    # Change white background buttons to yellow
    $content = $content -replace 'bg-white([^"]*?"[^>]*?<button)', 'bg-[#FFC400]$1'
    $content = $content -replace '(<button[^>]*?className="[^"]*?)bg-white', '$1bg-[#FFC400]'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "Done!"
