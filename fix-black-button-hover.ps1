$files = Get-ChildItem -Path . -Recurse -Include *.tsx,*.jsx -Exclude node_modules,dist,build

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Replace various red/dark hover colors on black buttons with yellow
    $content = $content -replace 'bg-black hover:bg-\[#a0040d\]', 'bg-black hover:bg-[#FFC400] hover:text-black'
    $content = $content -replace 'bg-black hover:bg-\[#B00410\]', 'bg-black hover:bg-[#FFC400] hover:text-black'
    $content = $content -replace 'bg-black hover:bg-\[#0F1C3F\]', 'bg-black hover:bg-[#FFC400] hover:text-black'
    $content = $content -replace 'bg-black hover:bg-gray-800', 'bg-black hover:bg-[#FFC400] hover:text-black'
    
    # Fix cases where hover:text-black might be duplicated
    $content = $content -replace 'hover:text-black hover:text-black', 'hover:text-black'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "Done!"
