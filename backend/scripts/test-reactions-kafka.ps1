$base = "http://localhost:8080/api/v1"
$headers = @{ "Content-Type" = "application/json" }
$pass = 0; $fail = 0

function Check($label, $cond) {
    if ($cond) { Write-Host "[PASS] $label"; $global:pass++ }
    else        { Write-Host "[FAIL] $label"; $global:fail++ }
}

# -- auth setup ------------------------------------------------------------
$ts = Get-Date -Format "HHmmss"

$r1 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Headers $headers `
    -Body (@{ name = "User1-$ts"; email = "u1-$ts@test.com"; password = "Pass1234!" } | ConvertTo-Json)
$auth1 = @{ "Content-Type" = "application/json"; Authorization = "Bearer $($r1.accessToken)" }

$r2 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Headers $headers `
    -Body (@{ name = "User2-$ts"; email = "u2-$ts@test.com"; password = "Pass1234!" } | ConvertTo-Json)
$auth2 = @{ "Content-Type" = "application/json"; Authorization = "Bearer $($r2.accessToken)" }

$ws = Invoke-RestMethod -Uri "$base/workspaces" -Method Post -Headers $auth1 `
    -Body (@{ name = "WS-RK-$ts"; slug = "ws-rk-$ts" } | ConvertTo-Json)
$slug = $ws.slug

$invite = Invoke-RestMethod -Uri "$base/workspaces/$slug/invites" -Method Post -Headers $auth1 `
    -Body (@{ email = "u2-$ts@test.com"; role = "MEMBER" } | ConvertTo-Json)
try {
    Invoke-RestMethod -Uri "$base/workspaces/invites/$($invite.token)/accept" -Method Post -Headers $auth2 | Out-Null
} catch {}

$proj = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects" -Method Post -Headers $auth1 `
    -Body (@{ name = "Proj-RK-$ts"; identifier = "RK"; network = "PUBLIC"; description = "" } | ConvertTo-Json)
$projId = $proj.id

# -- Kafka: issue create event ---------------------------------------------
$issue = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method Post -Headers $auth1 `
    -Body (@{ title = "Test issue for reactions" } | ConvertTo-Json)
$issueId = $issue.id
Check "Issue created, Kafka IssueEvent.CREATED fired async" ($null -ne $issueId)

# -- Kafka: comment add event ----------------------------------------------
$comment = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments" `
    -Method Post -Headers $auth1 -Body (@{ body = "Great issue!" } | ConvertTo-Json)
$commentId = $comment.id
Check "Comment created, Kafka CommentEvent.ADDED fired async" ($null -ne $commentId)

$reactUrl = "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments/$commentId/reactions"

# -- 1: add reaction -------------------------------------------------------
$react1 = Invoke-RestMethod -Uri $reactUrl -Method Post -Headers $auth1 `
    -Body (@{ emoji = "thumbs_up" } | ConvertTo-Json)
Check "Add reaction" ($react1.commentId -eq $commentId -and $null -ne $react1.id)

# -- 2: same user adds different emoji ------------------------------------
$react2 = Invoke-RestMethod -Uri $reactUrl -Method Post -Headers $auth1 `
    -Body (@{ emoji = "heart" } | ConvertTo-Json)
Check "Same user can add different emoji" ($react2.emoji -eq "heart")

# -- 3: different user adds same emoji ------------------------------------
$react3 = Invoke-RestMethod -Uri $reactUrl -Method Post -Headers $auth2 `
    -Body (@{ emoji = "thumbs_up" } | ConvertTo-Json)
Check "Different user can add same emoji" ($react3.emoji -eq "thumbs_up" -and $react3.id -ne $react1.id)

# -- 4: duplicate (same user + same emoji) rejected -----------------------
try {
    Invoke-RestMethod -Uri $reactUrl -Method Post -Headers $auth1 `
        -Body (@{ emoji = "thumbs_up" } | ConvertTo-Json)
    Check "Duplicate reaction rejected (409)" $false
} catch { Check "Duplicate reaction rejected (409)" ($_.Exception.Response.StatusCode.value__ -eq 409) }

# -- 5: empty emoji rejected ----------------------------------------------
try {
    Invoke-RestMethod -Uri $reactUrl -Method Post -Headers $auth1 `
        -Body (@{ emoji = "" } | ConvertTo-Json)
    Check "Empty emoji rejected (400)" $false
} catch { Check "Empty emoji rejected (400)" ($_.Exception.Response.StatusCode.value__ -eq 400) }

# -- 6: list reactions ----------------------------------------------------
$list = Invoke-RestMethod -Uri $reactUrl -Method Get -Headers $auth1
Check "List reactions returns 3" ($list.Count -eq 3)
Check "Reactions have commentId" ($list[0].commentId -eq $commentId)

# -- 7: remove own reaction by reactionId ---------------------------------
Invoke-RestMethod -Uri "$reactUrl/$($react1.id)" -Method Delete -Headers $auth1
$listAfter = Invoke-RestMethod -Uri $reactUrl -Method Get -Headers $auth1
Check "Remove own reaction (count=2)" ($listAfter.Count -eq 2)

# -- 8: remove already-removed -> 404 ------------------------------------
try {
    Invoke-RestMethod -Uri "$reactUrl/$($react1.id)" -Method Delete -Headers $auth1
    Check "Remove already-removed reaction (404)" $false
} catch { Check "Remove already-removed reaction (404)" ($_.Exception.Response.StatusCode.value__ -eq 404) }

# -- 9: cannot remove another user's reaction -> 403 ----------------------
try {
    Invoke-RestMethod -Uri "$reactUrl/$($react3.id)" -Method Delete -Headers $auth1
    Check "Cannot remove another user's reaction (403)" $false
} catch { Check "Cannot remove another user's reaction (403)" ($_.Exception.Response.StatusCode.value__ -eq 403) }

# -- 10: Kafka issue update event -----------------------------------------
$updated = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId" `
    -Method Patch -Headers $auth1 -Body (@{ title = "Updated title" } | ConvertTo-Json)
Check "Issue update, Kafka IssueEvent.UPDATED fired async" ($updated.title -eq "Updated title")

# -- 11: Kafka comment delete event ---------------------------------------
$c2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments" `
    -Method Post -Headers $auth1 -Body (@{ body = "Will be deleted" } | ConvertTo-Json)
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments/$($c2.id)" `
    -Method Delete -Headers $auth1
Check "Comment delete, Kafka CommentEvent.DELETED fired async" $true

# -- result ---------------------------------------------------------------
Write-Host ""
Write-Host "Results: $pass passed, $fail failed"
