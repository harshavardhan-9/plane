$base = "http://localhost:8080/api/v1"

$owner = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
    -Body '{"email":"you@test.com","password":"password123"}'
$token = $owner.accessToken
$headers = @{Authorization="Bearer $token"}
Write-Host "Logged in as: $($owner.user.email)"

$member = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
    -Body '{"email":"member@test.com","password":"password123"}'
$token2 = $member.accessToken
$headers2 = @{Authorization="Bearer $token2"}

$wsName = "ProjTest-$(Get-Date -Format 'HHmmss')"
$ws = Invoke-RestMethod -Uri "$base/workspaces" -Method POST -ContentType "application/json" `
    -Headers $headers -Body "{`"name`":`"$wsName`"}"
$slug = $ws.slug
if (-not $slug) { Write-Error "Workspace creation failed"; exit 1 }
Write-Host "Workspace: $slug"

Write-Host "`n=== 1. CREATE PROJECT (auto-identifier) ===" -ForegroundColor Cyan
$proj = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects" -Method POST -ContentType "application/json" `
    -Headers $headers -Body '{"name":"My Project","description":"Test project","network":"PUBLIC"}'
$proj | ConvertTo-Json
$projId = $proj.id

Write-Host "`n=== 2. CREATE PROJECT (explicit identifier) ===" -ForegroundColor Cyan
$proj2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects" -Method POST -ContentType "application/json" `
    -Headers $headers -Body '{"name":"Second Project","identifier":"SEC","network":"SECRET"}'
$proj2 | ConvertTo-Json
$projId2 = $proj2.id

Write-Host "`n=== 3. DUPLICATE IDENTIFIER (expect 409) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects" -Method POST -ContentType "application/json" `
        -Headers $headers -Body '{"name":"Another","identifier":"SEC"}'
} catch { Write-Host "Status: $($_.Exception.Response.StatusCode.Value__) (expected 409)" }

Write-Host "`n=== 4. LIST PROJECTS (PUBLIC visible, SECRET hidden for non-member) ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects" -Headers $headers | ConvertTo-Json -Depth 2

Write-Host "`n=== 5. GET PROJECT BY ID ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId" -Headers $headers | ConvertTo-Json

Write-Host "`n=== 6. UPDATE PROJECT ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId" -Method PATCH -ContentType "application/json" `
    -Headers $headers -Body '{"description":"Updated description","emoji":"rocket"}' | ConvertTo-Json

Write-Host "`n=== 7. LIST DEFAULT STATES (expect 5) ===" -ForegroundColor Cyan
$states = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/states" -Headers $headers
$states | ConvertTo-Json -Depth 2
Write-Host "State count: $($states.Count) (expected 5)"

Write-Host "`n=== 8. CREATE CUSTOM STATE ===" -ForegroundColor Cyan
$newState = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/states" -Method POST -ContentType "application/json" `
    -Headers $headers -Body '{"name":"In Review","color":"#9c27b0","group":"STARTED"}'
$newState | ConvertTo-Json
$stateId = $newState.id

Write-Host "`n=== 9. UPDATE STATE (set as default) ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/states/$stateId" -Method PATCH `
    -ContentType "application/json" -Headers $headers -Body '{"defaultState":true}' | ConvertTo-Json

Write-Host "`n=== 10. DELETE DEFAULT STATE (expect 403) ===" -ForegroundColor Cyan
try {
    Invoke-WebRequest -Uri "$base/workspaces/$slug/projects/$projId/states/$stateId" -Method DELETE `
        -Headers $headers -UseBasicParsing | Out-Null
} catch { Write-Host "Status: $($_.Exception.Response.StatusCode.Value__) (expected 403)" }

Write-Host "`n=== 11. DELETE NON-DEFAULT STATE ===" -ForegroundColor Cyan
$backlogId = ($states | Where-Object { $_.name -eq "Backlog" }).id
Invoke-WebRequest -Uri "$base/workspaces/$slug/projects/$projId/states/$backlogId" -Method DELETE `
    -Headers $headers -UseBasicParsing | Select-Object StatusCode

Write-Host "`n=== 12. LIST PROJECT MEMBERS (expect 1) ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/members" -Headers $headers | ConvertTo-Json -Depth 2

Write-Host "`n=== 13. ADD WORKSPACE MEMBER TO PROJECT ===" -ForegroundColor Cyan
$wsInvite = Invoke-RestMethod -Uri "$base/workspaces/$slug/invites" -Method POST -ContentType "application/json" `
    -Headers $headers -Body '{"email":"member@test.com","role":"MEMBER"}'
Invoke-RestMethod -Uri "$base/workspaces/invites/$($wsInvite.token)/accept" -Method POST -Headers $headers2 | Out-Null
$memberId2 = $member.user.id
$pm = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/members" -Method POST -ContentType "application/json" `
    -Headers $headers -Body "{`"userId`":`"$memberId2`",`"role`":`"MEMBER`"}"
$pm | ConvertTo-Json

Write-Host "`n=== 14. MEMBER ACCESSES PUBLIC PROJECT ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId" -Headers $headers2 | Select-Object name, identifier, role | ConvertTo-Json

Write-Host "`n=== 15. NON-MEMBER CANNOT ACCESS SECRET PROJECT (expect 403) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId2" -Headers $headers2
} catch { Write-Host "Status: $($_.Exception.Response.StatusCode.Value__) (expected 403)" }

Write-Host "`n=== 16. UPDATE MEMBER ROLE ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/members/$memberId2" -Method PATCH `
    -ContentType "application/json" -Headers $headers -Body '{"role":"ADMIN"}' | ConvertTo-Json

Write-Host "`n=== 17. REMOVE MEMBER ===" -ForegroundColor Cyan
Invoke-WebRequest -Uri "$base/workspaces/$slug/projects/$projId/members/$memberId2" -Method DELETE `
    -Headers $headers -UseBasicParsing | Select-Object StatusCode

Write-Host "`n=== 18. DELETE PROJECT (expect 204) ===" -ForegroundColor Cyan
Invoke-WebRequest -Uri "$base/workspaces/$slug/projects/$projId" -Method DELETE `
    -Headers $headers -UseBasicParsing | Select-Object StatusCode

Write-Host "`n=== 19. GET DELETED PROJECT (expect 404) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId" -Headers $headers
} catch { Write-Host "Status: $($_.Exception.Response.StatusCode.Value__) (expected 404)" }

Write-Host "`nAll project tests done." -ForegroundColor Green
