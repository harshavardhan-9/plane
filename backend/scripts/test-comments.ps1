$base = "http://localhost:8080/api/v1"
$headers = @{ "Content-Type" = "application/json" }
$pass = 0; $fail = 0

function Check($label, $cond) {
    if ($cond) { Write-Host "[PASS] $label"; $global:pass++ }
    else        { Write-Host "[FAIL] $label"; $global:fail++ }
}

# ── two users: author + another project member ─────────────────────────────
$ts = Get-Date -Format "HHmmss"
$r1 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Headers $headers `
    -Body (@{ name = "Author-$ts"; email = "author-$ts@test.com"; password = "Pass1234!" } | ConvertTo-Json)
$auth1 = @{ "Content-Type" = "application/json"; Authorization = "Bearer $($r1.accessToken)" }

$r2 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Headers $headers `
    -Body (@{ name = "Other-$ts"; email = "other-$ts@test.com"; password = "Pass1234!" } | ConvertTo-Json)
$auth2 = @{ "Content-Type" = "application/json"; Authorization = "Bearer $($r2.accessToken)" }
$user2Id = $r2.user.id

# ── workspace + project (user1 = admin) ─────────────────────────────────────
$ws = Invoke-RestMethod -Uri "$base/workspaces" -Method Post -Headers $auth1 `
    -Body (@{ name = "WS7-$ts"; slug = "ws7-$ts" } | ConvertTo-Json)
$slug = $ws.slug

$proj = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects" -Method Post -Headers $auth1 `
    -Body (@{ name = "Proj7-$ts"; identifier = "P7"; network = "PUBLIC"; description = "" } | ConvertTo-Json)
$projId = $proj.id

# invite user2 to workspace, accept as user2, then add to project as MEMBER
$invite = Invoke-RestMethod -Uri "$base/workspaces/$slug/invites" -Method Post -Headers $auth1 `
    -Body (@{ email = "other-$ts@test.com"; role = "MEMBER" } | ConvertTo-Json)
Invoke-RestMethod -Uri "$base/workspaces/invites/$($invite.token)/accept" -Method Post -Headers $auth2 | Out-Null
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/members" -Method Post -Headers $auth1 `
    -Body (@{ userId = $user2Id; role = "MEMBER" } | ConvertTo-Json) | Out-Null

$issue = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method Post -Headers $auth1 `
    -Body (@{ title = "Commentable Issue" } | ConvertTo-Json)
$issueId = $issue.id

# ── 1: create comment as user1 (author) ──────────────────────────────────
$c1 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments" `
    -Method Post -Headers $auth1 -Body (@{ body = "First comment" } | ConvertTo-Json)
Check "Create comment" ($c1.body -eq "First comment" -and $c1.authorId -eq $r1.user.id)

# ── 2: create comment as user2 ────────────────────────────────────────────
$c2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments" `
    -Method Post -Headers $auth2 -Body (@{ body = "Second comment" } | ConvertTo-Json)
Check "Create comment as second member" ($c2.authorId -eq $user2Id)

# ── 3: list comments, chronological order ─────────────────────────────────
$list = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments" `
    -Method Get -Headers $auth1
Check "List comments (count=2)" ($list.Count -eq 2)
Check "List comments (chronological)" ($list[0].body -eq "First comment" -and $list[1].body -eq "Second comment")

# ── 4: empty body rejected ────────────────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments" `
        -Method Post -Headers $auth1 -Body (@{ body = "" } | ConvertTo-Json)
    Check "Empty body rejected (400)" $false
} catch { Check "Empty body rejected (400)" ($_.Exception.Response.StatusCode.value__ -eq 400) }

# ── 5: author can edit own comment ────────────────────────────────────────
$upd = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments/$($c1.id)" `
    -Method Patch -Headers $auth1 -Body (@{ body = "First comment edited" } | ConvertTo-Json)
Check "Author edits own comment" ($upd.body -eq "First comment edited")

# ── 6: non-author cannot edit ─────────────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments/$($c1.id)" `
        -Method Patch -Headers $auth2 -Body (@{ body = "Hijacked" } | ConvertTo-Json)
    Check "Non-author edit rejected (403)" $false
} catch { Check "Non-author edit rejected (403)" ($_.Exception.Response.StatusCode.value__ -eq 403) }

# ── 7: activity log records COMMENTED events ──────────────────────────────
$act = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/activity" `
    -Method Get -Headers $auth1
$commented = $act | Where-Object { $_.verb -eq "COMMENTED" }
Check "Activity: COMMENTED events (count=2)" (@($commented).Count -eq 2)

# ── 8: non-author, non-admin cannot delete ────────────────────────────────
# user2 is not author of c1 and not ADMIN (only MEMBER) -> should be forbidden
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments/$($c1.id)" `
        -Method Delete -Headers $auth2
    Check "Non-author non-admin delete rejected (403)" $false
} catch { Check "Non-author non-admin delete rejected (403)" ($_.Exception.Response.StatusCode.value__ -eq 403) }

# ── 9: author can delete own comment ──────────────────────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments/$($c2.id)" `
    -Method Delete -Headers $auth2
$listAfter = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments" `
    -Method Get -Headers $auth1
Check "Author deletes own comment (count=1)" ($listAfter.Count -eq 1)

# ── 10: project admin (user1) can delete any comment ──────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments/$($c1.id)" `
    -Method Delete -Headers $auth1
$listFinal = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/comments" `
    -Method Get -Headers $auth1
Check "Admin deletes any comment (count=0)" (@($listFinal).Count -eq 0)

# ── 11: activity log records COMMENT_DELETED events ───────────────────────
$act2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$issueId/activity" `
    -Method Get -Headers $auth1
$deleted = $act2 | Where-Object { $_.verb -eq "COMMENT_DELETED" }
Check "Activity: COMMENT_DELETED events (count=2)" (@($deleted).Count -eq 2)

# ── 12: comment on non-existent issue → 404 ───────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/00000000-0000-0000-0000-000000000000/comments" `
        -Method Post -Headers $auth1 -Body (@{ body = "ghost" } | ConvertTo-Json)
    Check "Comment on missing issue rejected (404)" $false
} catch { Check "Comment on missing issue rejected (404)" ($_.Exception.Response.StatusCode.value__ -eq 404) }

# ── result ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Results: $pass passed, $fail failed"
