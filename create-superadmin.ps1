# Create SuperAdmin User Script
# Use a literal JSON string to avoid PowerShell quote issues
$jsonArgs = '{"clerkId":"user_36UDKKVRjPuAQlr5vwrqXu31Pyc","email":"safespace.dev.app@gmail.com","firstName":"SafeSpace","lastName":"SuperAdmin"}'

Write-Host "Creating SuperAdmin user with arguments:" -ForegroundColor Cyan
Write-Host $jsonArgs -ForegroundColor Yellow
Write-Host ""

# Run the command
cmd /c "npx convex run bootstrapSuperAdmin:createSuperAdmin $jsonArgs"
