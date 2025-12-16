$files = Get-ChildItem -Path . -Recurse -Include *.tsx,*.jsx -Exclude node_modules,dist,build

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Replace purple button backgrounds with yellow
    $content = $content -replace 'bg-\[#8B5CF6\]', 'bg-[#FFC400]'
    $content = $content -replace 'bg-\[#7C3AED\]', 'bg-black'
    
    # Replace purple badge backgrounds with yellow
    $content = $content -replace "bg-purple-100 text-purple-800", "bg-[#FFC400] text-black"
    $content = $content -replace "bg-purple-50", "bg-yellow-50"
    $content = $content -replace "text-purple-700", "text-black"
    $content = $content -replace "text-purple-600", "text-gray-700"
    $content = $content -replace "text-purple-800", "text-black"
    $content = $content -replace "border-purple-200", "border-yellow-200"
    $content = $content -replace "border-purple-300", "border-yellow-300"
    $content = $content -replace "border-purple-500", "border-yellow-500"
    
    # Replace purple focus rings with yellow
    $content = $content -replace "peer-focus:ring-purple-300", "peer-focus:ring-yellow-300"
    $content = $content -replace "peer-checked:bg-\[#8B5CF6\]", "peer-checked:bg-[#FFC400]"
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.Name)"
    }
}

Write-Host "Done!"
