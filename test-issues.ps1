$base = "http://localhost:8080/api/v1"

$owner = Invoke-RestMethod -Uri "$base/auth/login" -Method POST -ContentType "application/json" `
    -Body '{"email":"you@test.com","password":"password123"}'
$token = $owner.accessToken
$headers = @{Authorization="Bearer $token"}
Write-Host "Logged in as: $($owner.user.email)"

$wsName = "IssueTest-$(Get-Date -Format 'HHmmss')"
$ws = Invoke-RestMethod -Uri "$base/workspaces" -Method POST -ContentType "application/json" `
    -Headers $headers -Body "{`"name`":`"$wsName`"}"
$slug = $ws.slug
if (-not $slug) { Write-Error "Workspace creation failed"; exit 1 }
Write-Host "Workspace: $slug"

$proj = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects" -Method POST -ContentType "application/json" `
    -Headers $headers -Body '{"name":"My Project","network":"PUBLIC"}'
$projId = $proj.id
$states = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/states" -Headers $headers
$todoStateId = ($states | Where-Object { $_.name -eq "Todo" }).id
$doneStateId = ($states | Where-Object { $_.name -eq "Done" }).id
Write-Host "Project: $($proj.identifier), Todo state: $todoStateId"

Write-Host "`n=== 1. CREATE LABEL ===" -ForegroundColor Cyan
$label = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/labels" -Method POST `
    -ContentType "application/json" -Headers $headers -Body '{"name":"bug","color":"#ef4444"}'
$label | ConvertTo-Json
$labelId = $label.id

Write-Host "`n=== 2. DUPLICATE LABEL (expect 409) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/labels" -Method POST `
        -ContentType "application/json" -Headers $headers -Body '{"name":"bug","color":"#ff0000"}'
} catch { Write-Host "Status: $($_.Exception.Response.StatusCode.Value__) (expected 409)" }

Write-Host "`n=== 3. CREATE ISSUE (auto seq=1, default state, no assignees) ===" -ForegroundColor Cyan
$issue1 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method POST `
    -ContentType "application/json" -Headers $headers `
    -Body '{"title":"First issue","description":"Something broken","priority":"HIGH"}'
$issue1 | ConvertTo-Json
$issueId1 = $issue1.id
Write-Host "Identifier: $($issue1.identifier) (expected MP-1)"

Write-Host "`n=== 4. CREATE ISSUE (seq=2, with label) ===" -ForegroundColor Cyan
$issue2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method POST `
    -ContentType "application/json" -Headers $headers `
    -Body "{`"title`":`"Second issue`",`"priority`":`"MEDIUM`",`"labelIds`":[`"$labelId`"]}"
$issue2 | ConvertTo-Json
$issueId2 = $issue2.id
Write-Host "Identifier: $($issue2.identifier) (expected MP-2)"

Write-Host "`n=== 5. CREATE SUB-ISSUE (parent = issue1) ===" -ForegroundColor Cyan
$sub = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method POST `
    -ContentType "application/json" -Headers $headers `
    -Body "{`"title`":`"Sub-task`",`"parentId`":`"$issueId1`"}"
$sub | ConvertTo-Json
Write-Host "Parent: $($sub.parentId) (expected $issueId1)"

Write-Host "`n=== 6. LIST ALL ISSUES (expect 3) ===" -ForegroundColor Cyan
$all = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Headers $headers
Write-Host "Count: $($all.Count) (expected 3)"

Write-Host "`n=== 7. FILTER BY PRIORITY==HIGH (expect 1) ===" -ForegroundColor Cyan
$filtered = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues?priority=HIGH" -Headers $headers
Write-Host "Count: $($filtered.Count) (expected 1)"

Write-Host "`n=== 8. FILTER BY LABEL (expect 1) ===" -ForegroundColor Cyan
$byLabel = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues?labelId=$labelId" -Headers $headers
Write-Host "Count: $($byLabel.Count) (expected 1)"

Write-Host "`n=== 9. GET ISSUE BY ID ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId1" -Headers $headers | ConvertTo-Json

Write-Host "`n=== 10. UPDATE ISSUE (change state to Done → completedAt set) ===" -ForegroundColor Cyan
$updated = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId1" -Method PATCH `
    -ContentType "application/json" -Headers $headers `
    -Body "{`"stateId`":`"$doneStateId`",`"priority`":`"URGENT`"}"
$updated | ConvertTo-Json
Write-Host "completedAt: $($updated.completedAt) (expected non-null)"

Write-Host "`n=== 11. UPDATE ISSUE (back to Todo → completedAt cleared) ===" -ForegroundColor Cyan
$reverted = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId1" -Method PATCH `
    -ContentType "application/json" -Headers $headers `
    -Body "{`"stateId`":`"$todoStateId`"}"
Write-Host "completedAt: $($reverted.completedAt) (expected null)"

Write-Host "`n=== 12. UPDATE ASSIGNEES (replace with owner) ===" -ForegroundColor Cyan
$ownerId = $owner.user.id
$withAssignee = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId2" -Method PATCH `
    -ContentType "application/json" -Headers $headers `
    -Body "{`"assigneeIds`":[`"$ownerId`"]}"
Write-Host "Assignees: $($withAssignee.assigneeIds) (expected [$ownerId])"

Write-Host "`n=== 13. CLEAR ASSIGNEES (empty list) ===" -ForegroundColor Cyan
$cleared = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId2" -Method PATCH `
    -ContentType "application/json" -Headers $headers -Body '{"assigneeIds":[]}'
Write-Host "Assignees count: $($cleared.assigneeIds.Count) (expected 0)"

Write-Host "`n=== 14. FILTER BY STATE (expect 2 Todo issues) ===" -ForegroundColor Cyan
$byState = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues?stateId=$todoStateId" -Headers $headers
Write-Host "Count: $($byState.Count) (expected 3)"

Write-Host "`n=== 15. DELETE ISSUE (expect 204) ===" -ForegroundColor Cyan
Invoke-WebRequest -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId2" -Method DELETE `
    -Headers $headers -UseBasicParsing | Select-Object StatusCode

Write-Host "`n=== 16. GET DELETED ISSUE (expect 404) ===" -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId2" -Headers $headers
} catch { Write-Host "Status: $($_.Exception.Response.StatusCode.Value__) (expected 404)" }

Write-Host "`n=== 17. RAPID CREATE (seq continuity after delete) ===" -ForegroundColor Cyan
$issue4 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method POST `
    -ContentType "application/json" -Headers $headers -Body '{"title":"Fourth issue"}'
Write-Host "Identifier: $($issue4.identifier) (expected MP-4)"

Write-Host "`n=== 18. UPDATE LABEL ===" -ForegroundColor Cyan
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/labels/$labelId" -Method PATCH `
    -ContentType "application/json" -Headers $headers -Body '{"name":"feature","color":"#22c55e"}' | ConvertTo-Json

Write-Host "`n=== 19. LIST LABELS (expect 1) ===" -ForegroundColor Cyan
$labels = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/labels" -Headers $headers
Write-Host "Count: $($labels.Count) (expected 1)"
$labels | ConvertTo-Json

Write-Host "`n=== 20. DELETE LABEL (expect 204) ===" -ForegroundColor Cyan
Invoke-WebRequest -Uri "$base/workspaces/$slug/projects/$projId/labels/$labelId" -Method DELETE `
    -Headers $headers -UseBasicParsing | Select-Object StatusCode

Write-Host "`nAll issue tests done." -ForegroundColor Green
