$files = Get-ChildItem -Path . -Recurse -Include *.tsx,*.jsx -Exclude node_modules,dist,build

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Replace purple text colors with yellow or black
    $content = $content -replace 'text-\[#8B5CF6\]', 'text-[#FFC400]'
    $content = $content -replace 'text-\[#7C3AED\]', 'text-black'
    $content = $content -replace 'text-purple-500', 'text-[#FFC400]'
    $content = $content -replace 'text-purple-900', 'text-black'
    
    # Replace purple focus rings
    $content = $content -replace 'focus:ring-\[#8B5CF6\]', 'focus:ring-[#FFC400]'
    $content = $content -replace 'border-b-2 border-\[#8B5CF6\]', 'border-b-2 border-[#FFC400]'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "Done!"
