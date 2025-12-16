# Script to remove black borders and add yellow to white background buttons

$files = Get-ChildItem -Path . -Recurse -Include *.tsx,*.jsx,*.ts,*.js -Exclude node_modules,dist,build

foreach ($file in $files) {
    $content = Get-Content $file.FullName -Raw -Encoding UTF8
    $originalContent = $content
    
    # Remove border-black classes
    $content = $content -replace 'border-black\s+', ''
    $content = $content -replace '\s+border-black', ''
    $content = $content -replace 'border-2\s+border-black', ''
    $content = $content -replace 'border-black', ''
    
    # Add yellow background to buttons with white backgrounds
    # Pattern: bg-white on buttons, add bg-[#FFC400] and adjust text color
    $content = $content -replace '(className="[^"]*?)bg-white([^"]*?text-black[^"]*?"[^>]*?<button|className="[^"]*?text-black[^"]*?bg-white[^"]*?"[^>]*?<button)', '$1bg-[#FFC400]$2'
    
    if ($content -ne $originalContent) {
        Set-Content -Path $file.FullName -Value $content -Encoding UTF8 -NoNewline
        Write-Host "Updated: $($file.FullName)"
    }
}

Write-Host "Done!"
