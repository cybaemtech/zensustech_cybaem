# stop.ps1 - Kill backend and frontend dev servers
Write-Host "Stopping ZensusTech services..." -ForegroundColor Yellow
Get-Process -Name "python","uvicorn","node" -ErrorAction SilentlyContinue | ForEach-Object {
    Write-Host "  Stopping $($_.Name) (PID $($_.Id))" -ForegroundColor DarkGray
    $_ | Stop-Process -Force
}
Write-Host "Done." -ForegroundColor Green
