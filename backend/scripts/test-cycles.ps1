$base = "http://localhost:8080/api/v1"
$headers = @{ "Content-Type" = "application/json" }
$pass = 0; $fail = 0

function Check($label, $cond) {
    if ($cond) { Write-Host "[PASS] $label"; $global:pass++ }
    else        { Write-Host "[FAIL] $label"; $global:fail++ }
}

# ── auth + workspace + project ────────────────────────────────────────────
$ts = Get-Date -Format "HHmmss"
$r = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Headers $headers `
    -Body (@{ name = "Day8-$ts"; email = "day8-$ts@test.com"; password = "Pass1234!" } | ConvertTo-Json)
$auth = @{ "Content-Type" = "application/json"; Authorization = "Bearer $($r.accessToken)" }

$ws = Invoke-RestMethod -Uri "$base/workspaces" -Method Post -Headers $auth `
    -Body (@{ name = "WS8-$ts"; slug = "ws8-$ts" } | ConvertTo-Json)
$slug = $ws.slug

$proj = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects" -Method Post -Headers $auth `
    -Body (@{ name = "Proj8-$ts"; identifier = "C8"; network = "PUBLIC"; description = "" } | ConvertTo-Json)
$projId = $proj.id

$states = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/states" -Method Get -Headers $auth
$doneState = ($states | Where-Object { $_.group -eq "COMPLETED" })[0]

# ── 1: create cycle (DRAFT, no dates) ─────────────────────────────────────
$c1 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles" -Method Post -Headers $auth `
    -Body (@{ name = "Sprint 1"; description = "First sprint" } | ConvertTo-Json)
Check "Create cycle" ($c1.name -eq "Sprint 1" -and $c1.status -eq "DRAFT")
Check "New cycle progress is 0/0/0" ($c1.progress.total -eq 0 -and $c1.progress.completed -eq 0 -and $c1.progress.percentage -eq 0)

# ── 2: create cycle with dates and STARTED status ─────────────────────────
$c2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles" -Method Post -Headers $auth `
    -Body (@{ name = "Sprint 2"; status = "STARTED"; startDate = "2026-07-01"; endDate = "2026-07-14" } | ConvertTo-Json)
Check "Create STARTED cycle with dates" ($c2.status -eq "STARTED" -and $c2.startDate -eq "2026-07-01")

# ── 3: list cycles ────────────────────────────────────────────────────────
$list = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles" -Method Get -Headers $auth
Check "List cycles (count=2)" ($list.Count -eq 2)

# ── 4: get cycle by id ────────────────────────────────────────────────────
$got = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)" -Method Get -Headers $auth
Check "Get cycle by id" ($got.id -eq $c1.id -and $got.name -eq "Sprint 1")

# ── 5: update cycle ───────────────────────────────────────────────────────
$upd = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)" -Method Patch -Headers $auth `
    -Body (@{ name = "Sprint 1 Updated"; status = "STARTED" } | ConvertTo-Json)
Check "Update cycle name + status" ($upd.name -eq "Sprint 1 Updated" -and $upd.status -eq "STARTED")

# ── 6: empty name rejected ────────────────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles" -Method Post -Headers $auth `
        -Body (@{ name = "" } | ConvertTo-Json)
    Check "Empty name rejected (400)" $false
} catch { Check "Empty name rejected (400)" ($_.Exception.Response.StatusCode.value__ -eq 400) }

# ── 7: create 3 issues and add them to cycle ──────────────────────────────
$i1 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method Post -Headers $auth `
    -Body (@{ title = "Task Alpha" } | ConvertTo-Json)
$i2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method Post -Headers $auth `
    -Body (@{ title = "Task Beta" } | ConvertTo-Json)
$i3 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method Post -Headers $auth `
    -Body (@{ title = "Task Gamma" } | ConvertTo-Json)

$link1 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)/issues" -Method Post -Headers $auth `
    -Body (@{ issueId = $i1.id } | ConvertTo-Json)
Check "Add issue to cycle" ($link1.cycleId -eq $c1.id -and $link1.issueId -eq $i1.id)

Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)/issues" -Method Post -Headers $auth `
    -Body (@{ issueId = $i2.id } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)/issues" -Method Post -Headers $auth `
    -Body (@{ issueId = $i3.id } | ConvertTo-Json) | Out-Null

# ── 8: duplicate add rejected ─────────────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)/issues" -Method Post -Headers $auth `
        -Body (@{ issueId = $i1.id } | ConvertTo-Json)
    Check "Duplicate issue in cycle rejected (409)" $false
} catch { Check "Duplicate issue in cycle rejected (409)" ($_.Exception.Response.StatusCode.value__ -eq 409) }

# ── 9: list cycle issues ──────────────────────────────────────────────────
$issues = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)/issues" -Method Get -Headers $auth
Check "List cycle issues (count=3)" ($issues.Count -eq 3)
Check "Issues are full IssueResponse (have identifier)" ($null -ne $issues[0].identifier)

# ── 10: progress with 0 completed ─────────────────────────────────────────
$cycleNow = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)" -Method Get -Headers $auth
Check "Progress total=3, completed=0" ($cycleNow.progress.total -eq 3 -and $cycleNow.progress.completed -eq 0)
Check "Progress percentage=0" ($cycleNow.progress.percentage -eq 0)

# ── 11: complete one issue, check progress ────────────────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)" -Method Patch -Headers $auth `
    -Body (@{ stateId = $doneState.id } | ConvertTo-Json) | Out-Null

$cycleAfter = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)" -Method Get -Headers $auth
Check "Progress: 1 completed after state change" ($cycleAfter.progress.completed -eq 1)
Check "Progress percentage=33" ($cycleAfter.progress.percentage -eq 33)

# ── 12: issue can belong to multiple cycles ───────────────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c2.id)/issues" -Method Post -Headers $auth `
    -Body (@{ issueId = $i1.id } | ConvertTo-Json) | Out-Null
$c2Issues = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c2.id)/issues" -Method Get -Headers $auth
Check "Issue can be in multiple cycles" (@($c2Issues).Count -eq 1)

# ── 13: remove issue from cycle ───────────────────────────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)/issues/$($i2.id)" -Method Delete -Headers $auth
$issuesAfterRemove = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)/issues" -Method Get -Headers $auth
Check "Remove issue from cycle (count=2)" ($issuesAfterRemove.Count -eq 2)

# ── 14: remove non-member issue → 404 ────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c1.id)/issues/$($i2.id)" -Method Delete -Headers $auth
    Check "Remove already-removed issue (404)" $false
} catch { Check "Remove already-removed issue (404)" ($_.Exception.Response.StatusCode.value__ -eq 404) }

# ── 15: delete cycle (admin) ──────────────────────────────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles/$($c2.id)" -Method Delete -Headers $auth
$listAfter = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/cycles" -Method Get -Headers $auth
Check "Delete cycle (count=1)" ($listAfter.Count -eq 1)

# ── result ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Results: $pass passed, $fail failed"
