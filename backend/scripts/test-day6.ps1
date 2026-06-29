$base = "http://localhost:8080/api/v1"
$headers = @{ "Content-Type" = "application/json" }
$pass = 0; $fail = 0

function Check($label, $cond) {
    if ($cond) { Write-Host "[PASS] $label"; $global:pass++ }
    else        { Write-Host "[FAIL] $label"; $global:fail++ }
}

# ── auth ─────────────────────────────────────────────────────────────────
$ts = Get-Date -Format "HHmmss"
$body = @{ name = "Day6-$ts"; email = "day6-$ts@test.com"; password = "Pass1234!" } | ConvertTo-Json
$r = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Body $body -Headers $headers
$token = $r.accessToken
$auth = @{ "Content-Type" = "application/json"; Authorization = "Bearer $token" }
$userId = $r.user.id

# ── workspace + project ───────────────────────────────────────────────────
$ws = Invoke-RestMethod -Uri "$base/workspaces" -Method Post -Headers $auth `
    -Body (@{ name = "WS-$ts"; slug = "ws-$ts" } | ConvertTo-Json)
$slug = $ws.slug

$proj = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects" -Method Post -Headers $auth `
    -Body (@{ name = "Proj-$ts"; identifier = "P6"; network = "PUBLIC"; description = "" } | ConvertTo-Json)
$projId = $proj.id

$states = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/states" -Method Get -Headers $auth
$todoState = ($states | Where-Object { $_.name -eq "Todo" })[0]
$doneState  = ($states | Where-Object { $_.group -eq "COMPLETED" })[0]

# ── create three issues ───────────────────────────────────────────────────
$i1 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method Post -Headers $auth `
    -Body (@{ title = "Issue Alpha" } | ConvertTo-Json)
$i2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method Post -Headers $auth `
    -Body (@{ title = "Issue Beta" } | ConvertTo-Json)
$i3 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method Post -Headers $auth `
    -Body (@{ title = "Issue Gamma" } | ConvertTo-Json)

Check "Issues created" ($i1.id -and $i2.id -and $i3.id)

# ── 1: add relation BLOCKED_BY (i1 blocked by i2) ─────────────────────────
$rel = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)/relations" `
    -Method Post -Headers $auth `
    -Body (@{ targetIssueId = $i2.id; relationType = "BLOCKED_BY" } | ConvertTo-Json)
Check "Add relation" ($rel.relationType -eq "BLOCKED_BY" -and $rel.sourceIssueId -eq $i1.id)

# ── 2: list relations for i1 ──────────────────────────────────────────────
$rels = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)/relations" `
    -Method Get -Headers $auth
Check "List relations (count=1)" ($rels.Count -eq 1)
Check "List relations (target=i2)" ($rels[0].targetIssueId -eq $i2.id)

# ── 3: duplicate relation rejected ────────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)/relations" `
        -Method Post -Headers $auth `
        -Body (@{ targetIssueId = $i2.id; relationType = "BLOCKED_BY" } | ConvertTo-Json)
    Check "Duplicate relation rejected (409)" $false
} catch { Check "Duplicate relation rejected (409)" ($_.Exception.Response.StatusCode.value__ -eq 409) }

# ── 4: self-relation rejected ─────────────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)/relations" `
        -Method Post -Headers $auth `
        -Body (@{ targetIssueId = $i1.id; relationType = "DUPLICATE" } | ConvertTo-Json)
    Check "Self-relation rejected (409)" $false
} catch { Check "Self-relation rejected (409)" ($_.Exception.Response.StatusCode.value__ -eq 409) }

# ── 5: add second relation BLOCKING (i1 blocking i3) ─────────────────────
$rel2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)/relations" `
    -Method Post -Headers $auth `
    -Body (@{ targetIssueId = $i3.id; relationType = "BLOCKING" } | ConvertTo-Json)
Check "Add second relation" ($rel2.relationType -eq "BLOCKING")

$rels2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)/relations" `
    -Method Get -Headers $auth
Check "List relations (count=2)" ($rels2.Count -eq 2)

# ── 6: activity log on issue creation ────────────────────────────────────
$act = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)/activity" `
    -Method Get -Headers $auth
Check "Activity on create" ($act.Count -ge 1 -and $act[0].verb -eq "CREATED")

# ── 7: update issue and check activity log ────────────────────────────────
$upd = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)" `
    -Method Patch -Headers $auth `
    -Body (@{ title = "Issue Alpha Updated"; priority = "HIGH" } | ConvertTo-Json)
Check "Update issue" ($upd.title -eq "Issue Alpha Updated" -and $upd.priority -eq "HIGH")

$act2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)/activity" `
    -Method Get -Headers $auth
$titleActivity    = $act2 | Where-Object { $_.field -eq "title" }
$priorityActivity = $act2 | Where-Object { $_.field -eq "priority" }
Check "Activity: title change recorded" (@($titleActivity).Count -ge 1)
Check "Activity: priority change recorded" (@($priorityActivity).Count -ge 1)
Check "Activity: priority oldValue=NONE" ($priorityActivity[0].oldValue -eq "NONE")
Check "Activity: priority newValue=HIGH" ($priorityActivity[0].newValue -eq "HIGH")

# ── 8: no-op update produces no activity ─────────────────────────────────
$actBefore = (Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i2.id)/activity" `
    -Method Get -Headers $auth).Count
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i2.id)" `
    -Method Patch -Headers $auth `
    -Body (@{ title = "Issue Beta" } | ConvertTo-Json) | Out-Null   # same title -> wait, we don't know the current title
# Actually let's patch with empty body — no tracked fields → 0 new activity rows
# But title="Issue Beta" is sent — it WILL change since beta's title is "Issue Beta" so it stays same
# Wait, i2 title is "Issue Beta" and we're patching with title="Issue Beta" → no change
$actAfter = (Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i2.id)/activity" `
    -Method Get -Headers $auth).Count
Check "No-op update: no new activity" ($actAfter -eq $actBefore + 0)

# ── 9: state change activity ──────────────────────────────────────────────
$upd2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i2.id)" `
    -Method Patch -Headers $auth `
    -Body (@{ stateId = $doneState.id } | ConvertTo-Json)
Check "State change → completedAt set" ($null -ne $upd2.completedAt)

$act3 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i2.id)/activity" `
    -Method Get -Headers $auth
$stateAct = $act3 | Where-Object { $_.field -eq "state" }
Check "Activity: state change recorded" (@($stateAct).Count -ge 1)

# ── 10: remove relation ───────────────────────────────────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)/relations/$($i2.id)/BLOCKED_BY" `
    -Method Delete -Headers $auth
$rels3 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)/relations" `
    -Method Get -Headers $auth
Check "Remove relation (count=1)" ($rels3.Count -eq 1)

# ── 11: remove non-existent relation → 404 ───────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)/relations/$($i2.id)/BLOCKED_BY" `
        -Method Delete -Headers $auth
    Check "Remove missing relation (404)" $false
} catch { Check "Remove missing relation (404)" ($_.Exception.Response.StatusCode.value__ -eq 404) }

# ── result ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Results: $pass passed, $fail failed"
