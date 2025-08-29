Write-Host "Copying images from input to assets folder..." -ForegroundColor Green

# Create assets directory if it doesn't exist
if (!(Test-Path "E:\Project\website\assets")) {
    New-Item -ItemType Directory -Path "E:\Project\website\assets"
}

# Copy all files from input to assets
Copy-Item "E:\Project\website\input\*" -Destination "E:\Project\website\assets\" -Recurse -Force

Write-Host "Images copied successfully!" -ForegroundColor Green
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")