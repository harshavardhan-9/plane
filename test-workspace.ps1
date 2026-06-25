$base = "http://localhost:8080/api/v1"

# Login first
$res = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
    -Body '{"email":"you@test.com","password":"password123"}'
$token = $res.accessToken
$headers = @{Authorization="Bearer $token"}
Write-Host "Logged in as: $($res.user.email)"

# Register second user for invite test
try {
    $res2 = Invoke-RestMethod -Uri "$base/auth/register" -Method POST -ContentType "application/json" `
        -Body '{"email":"member@test.com","password":"password123","displayName":"Member User"}'
    Write-Host "Registered second user: $($res2.user.email)"
} catch {
    Write-Host "Second user already exists"
    $res2 = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
        -Body '{"email":"member@test.com","password":"password123"}'
}
$token2 = $res2.accessToken
$headers2 = @{Authorization="Bearer $token2"}

Write-Host "`n=== 1. CREATE WORKSPACE ===" -ForegroundColor Cyan
$ws = Invoke-RestMethod -Uri "$base/workspaces" -Method POST -ContentType "application/json" `
    -Headers $headers -Body '{"name":"My Workspace","description":"Test workspace"}'
$ws | ConvertTo-Json
$slug = $ws.slug

Write-Host "`n=== 2. LIST MY WORKSPACES ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces" -Headers $headers | ConvertTo-Json -Depth 3

Write-Host "`n=== 3. GET WORKSPACE BY SLUG ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug" -Headers $headers | ConvertTo-Json

Write-Host "`n=== 4. UPDATE WORKSPACE ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug" -Method PATCH -ContentType "application/json" `
    -Headers $headers -Body '{"description":"Updated description"}' | ConvertTo-Json

Write-Host "`n=== 5. LIST MEMBERS ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug/members" -Headers $headers | ConvertTo-Json -Depth 3

Write-Host "`n=== 6. NON-MEMBER ACCESS (expect 403) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug" -Headers $headers2
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__) (expected 403)"
}

Write-Host "`n=== 7. INVITE MEMBER ===" -ForegroundColor Cyan
$invite = Invoke-RestMethod -Uri "$base/workspaces/$slug/invites" -Method POST -ContentType "application/json" `
    -Headers $headers -Body '{"email":"member@test.com","role":"MEMBER"}'
$invite | ConvertTo-Json
$inviteToken = $invite.token

Write-Host "`n=== 8. DUPLICATE INVITE (expect 409) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/invites" -Method POST -ContentType "application/json" `
        -Headers $headers -Body '{"email":"member@test.com","role":"MEMBER"}'
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__) (expected 409)"
}

Write-Host "`n=== 9. ACCEPT INVITE (as member@test.com) ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/invites/$inviteToken/accept" -Method POST -Headers $headers2 | ConvertTo-Json

Write-Host "`n=== 10. LIST MEMBERS (now 2) ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug/members" -Headers $headers | ConvertTo-Json -Depth 3

Write-Host "`n=== 11. MEMBER CAN ACCESS WORKSPACE ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug" -Headers $headers2 | Select-Object name, slug, role | ConvertTo-Json

Write-Host "`n=== 12. UPDATE MEMBER ROLE TO ADMIN ===" -ForegroundColor Cyan
$memberId = $res2.user.id
Invoke-RestMethod -Uri "$base/workspaces/$slug/members/$memberId" -Method PATCH `
    -ContentType "application/json" -Headers $headers -Body '{"role":"ADMIN"}' | ConvertTo-Json

Write-Host "`n=== 13. REMOVE MEMBER ===" -ForegroundColor Cyan
Invoke-WebRequest -Uri "$base/workspaces/$slug/members/$memberId" -Method DELETE `
    -Headers $headers -UseBasicParsing | Select-Object StatusCode

Write-Host "`n=== 14. DELETE WORKSPACE (expect 204) ===" -ForegroundColor Cyan
Invoke-WebRequest -Uri "$base/workspaces/$slug" -Method DELETE -Headers $headers -UseBasicParsing | Select-Object StatusCode

Write-Host "`n=== 15. GET DELETED WORKSPACE (expect 404) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug" -Headers $headers
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode.Value__) (expected 404)"
}

Write-Host "`nAll workspace tests done." -ForegroundColor Green
