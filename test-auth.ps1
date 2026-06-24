$base = "http://localhost:8080/api/v1/auth"

Write-Host "=== 1. REGISTER ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/register" -Method POST -ContentType "application/json" `
    -Body '{"email":"you@test.com","password":"password123","displayName":"Your Name"}' | ConvertTo-Json -Depth 4

Write-Host "=== 2. DUPLICATE EMAIL (expect 409) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/register" -Method POST -ContentType "application/json" `
        -Body '{"email":"you@test.com","password":"password123"}'
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)"
    Write-Host "Error: $(($_.ErrorDetails.Message | ConvertFrom-Json).error)"
}

Write-Host "=== 3. WRONG PASSWORD (expect 401) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/login" -Method POST -ContentType "application/json" `
        -Body '{"email":"you@test.com","password":"wrongpass"}'
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)"
    Write-Host "Message: $(($_.ErrorDetails.Message | ConvertFrom-Json).message)"
}

Write-Host "=== 4. LOGIN ===" -ForegroundColor Cyan
$res = Invoke-RestMethod -Uri "$base/login" -Method POST -ContentType "application/json" `
    -Body '{"email":"you@test.com","password":"password123"}'
Write-Host "Access token: $($res.accessToken.Substring(0,40))..."
Write-Host "Refresh token: $($res.refreshToken)"

Write-Host "=== 5. GET /me WITH TOKEN ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/me" -Headers @{Authorization="Bearer $($res.accessToken)"} | ConvertTo-Json

Write-Host "=== 6. GET /me WITHOUT TOKEN (expect 403) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/me"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)"
}

Write-Host "=== 7. REFRESH TOKENS ===" -ForegroundColor Cyan
$refreshed = Invoke-RestMethod -Uri "$base/refresh" -Method POST -ContentType "application/json" `
    -Body "{`"refreshToken`":`"$($res.refreshToken)`"}"
Write-Host "New access token: $($refreshed.accessToken.Substring(0,40))..."
Write-Host "New refresh token: $($refreshed.refreshToken)"

Write-Host "=== 8. REUSE OLD REFRESH TOKEN (expect 401 - revoked) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/refresh" -Method POST -ContentType "application/json" `
        -Body "{`"refreshToken`":`"$($res.refreshToken)`"}"
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)"
    Write-Host "Message: $(($_.ErrorDetails.Message | ConvertFrom-Json).message)"
}

Write-Host "=== 9. LOGOUT ===" -ForegroundColor Cyan
$logout = Invoke-WebRequest -Uri "$base/logout" -Method POST `
    -Headers @{Authorization="Bearer $($refreshed.accessToken)"} -UseBasicParsing
Write-Host "Status: $($logout.StatusCode) (expect 204)"

Write-Host "=== 10. USE TOKEN AFTER LOGOUT (expect 403 - blacklisted) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/me" -Headers @{Authorization="Bearer $($refreshed.accessToken)"}
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__)"
}

Write-Host "=== 11. REDIS BLACKLIST ===" -ForegroundColor Cyan
docker exec plane_redis redis-cli KEYS "blacklist:*"

Write-Host "=== 12. POSTGRES - USERS ===" -ForegroundColor Cyan
docker exec plane_postgres psql -U plane -d plane_db -c "SELECT id, email, display_name, created_at FROM users;"

Write-Host "=== 13. POSTGRES - REFRESH TOKENS ===" -ForegroundColor Cyan
docker exec plane_postgres psql -U plane -d plane_db -c "SELECT token, revoked, expires_at FROM refresh_tokens ORDER BY created_at DESC LIMIT 5;"

Write-Host "All tests done." -ForegroundColor Green
