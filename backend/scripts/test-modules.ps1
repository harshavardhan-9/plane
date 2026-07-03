$base = "http://localhost:8080/api/v1"
$headers = @{ "Content-Type" = "application/json" }
$pass = 0; $fail = 0

function Check($label, $cond) {
    if ($cond) { Write-Host "[PASS] $label"; $global:pass++ }
    else        { Write-Host "[FAIL] $label"; $global:fail++ }
}

# ── auth + workspace + project ─────────────────────────────────────────────
$ts = Get-Date -Format "HHmmss"
$r = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Headers $headers `
    -Body (@{ name = "Day9-$ts"; email = "day9-$ts@test.com"; password = "Pass1234!" } | ConvertTo-Json)
$auth = @{ "Content-Type" = "application/json"; Authorization = "Bearer $($r.accessToken)" }

$ws = Invoke-RestMethod -Uri "$base/workspaces" -Method Post -Headers $auth `
    -Body (@{ name = "WS9-$ts"; slug = "ws9-$ts" } | ConvertTo-Json)
$slug = $ws.slug

$proj = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects" -Method Post -Headers $auth `
    -Body (@{ name = "Proj9-$ts"; identifier = "M9"; network = "PUBLIC"; description = "" } | ConvertTo-Json)
$projId = $proj.id

$states = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/states" -Method Get -Headers $auth
$doneState = ($states | Where-Object { $_.group -eq "COMPLETED" })[0]

# ── 1: create module (BACKLOG, no dates) ──────────────────────────────────
$m1 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules" -Method Post -Headers $auth `
    -Body (@{ name = "Auth Module"; description = "Everything auth-related" } | ConvertTo-Json)
Check "Create module" ($m1.name -eq "Auth Module" -and $m1.status -eq "BACKLOG")
Check "New module progress is 0/0/0" ($m1.progress.total -eq 0 -and $m1.progress.completed -eq 0 -and $m1.progress.percentage -eq 0)

# ── 2: create module with status and dates ────────────────────────────────
$m2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules" -Method Post -Headers $auth `
    -Body (@{ name = "Payments Module"; status = "IN_PROGRESS"; startDate = "2026-07-01"; targetDate = "2026-08-01" } | ConvertTo-Json)
Check "Create IN_PROGRESS module with dates" ($m2.status -eq "IN_PROGRESS" -and $m2.targetDate -eq "2026-08-01")

# ── 3: list modules ───────────────────────────────────────────────────────
$list = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules" -Method Get -Headers $auth
Check "List modules (count=2)" ($list.Count -eq 2)

# ── 4: get module by id ───────────────────────────────────────────────────
$got = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)" -Method Get -Headers $auth
Check "Get module by id" ($got.id -eq $m1.id -and $got.name -eq "Auth Module")

# ── 5: update module ──────────────────────────────────────────────────────
$upd = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)" -Method Patch -Headers $auth `
    -Body (@{ name = "Auth Module Updated"; status = "IN_PROGRESS" } | ConvertTo-Json)
Check "Update module name + status" ($upd.name -eq "Auth Module Updated" -and $upd.status -eq "IN_PROGRESS")

# ── 6: all 5 statuses are valid ───────────────────────────────────────────
foreach ($s in @("BACKLOG","IN_PROGRESS","PAUSED","COMPLETED","CANCELLED")) {
    $res = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)" -Method Patch -Headers $auth `
        -Body (@{ status = $s } | ConvertTo-Json)
    Check "Status $s accepted" ($res.status -eq $s)
}

# ── 7: empty name rejected ────────────────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules" -Method Post -Headers $auth `
        -Body (@{ name = "" } | ConvertTo-Json)
    Check "Empty name rejected (400)" $false
} catch { Check "Empty name rejected (400)" ($_.Exception.Response.StatusCode.value__ -eq 400) }

# ── 8: add issues to module ───────────────────────────────────────────────
$i1 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method Post -Headers $auth `
    -Body (@{ title = "Build login page" } | ConvertTo-Json)
$i2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method Post -Headers $auth `
    -Body (@{ title = "Build register page" } | ConvertTo-Json)
$i3 = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues" -Method Post -Headers $auth `
    -Body (@{ title = "Add JWT middleware" } | ConvertTo-Json)

$link = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)/issues" -Method Post -Headers $auth `
    -Body (@{ issueId = $i1.id } | ConvertTo-Json)
Check "Add issue to module" ($link.moduleId -eq $m1.id -and $link.issueId -eq $i1.id)

Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)/issues" -Method Post -Headers $auth `
    -Body (@{ issueId = $i2.id } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)/issues" -Method Post -Headers $auth `
    -Body (@{ issueId = $i3.id } | ConvertTo-Json) | Out-Null

# ── 9: duplicate add rejected ─────────────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)/issues" -Method Post -Headers $auth `
        -Body (@{ issueId = $i1.id } | ConvertTo-Json)
    Check "Duplicate issue in module rejected (409)" $false
} catch { Check "Duplicate issue in module rejected (409)" ($_.Exception.Response.StatusCode.value__ -eq 409) }

# ── 10: list module issues ────────────────────────────────────────────────
$issues = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)/issues" -Method Get -Headers $auth
Check "List module issues (count=3)" ($issues.Count -eq 3)
Check "Module issues are full IssueResponse (have identifier)" ($null -ne $issues[0].identifier)

# ── 11: progress with 0 completed ─────────────────────────────────────────
$mNow = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)" -Method Get -Headers $auth
Check "Progress total=3, completed=0" ($mNow.progress.total -eq 3 -and $mNow.progress.completed -eq 0)

# ── 12: complete 2 issues, check progress ────────────────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i1.id)" -Method Patch -Headers $auth `
    -Body (@{ stateId = $doneState.id } | ConvertTo-Json) | Out-Null
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/issues/$($i2.id)" -Method Patch -Headers $auth `
    -Body (@{ stateId = $doneState.id } | ConvertTo-Json) | Out-Null

$mAfter = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)" -Method Get -Headers $auth
Check "Progress: 2 completed" ($mAfter.progress.completed -eq 2)
Check "Progress percentage=67" ($mAfter.progress.percentage -eq 67)

# ── 13: issue can be in multiple modules ──────────────────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m2.id)/issues" -Method Post -Headers $auth `
    -Body (@{ issueId = $i1.id } | ConvertTo-Json) | Out-Null
$m2Issues = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m2.id)/issues" -Method Get -Headers $auth
Check "Issue can be in multiple modules" (@($m2Issues).Count -eq 1)

# ── 14: remove issue from module ──────────────────────────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)/issues/$($i3.id)" -Method Delete -Headers $auth
$issuesAfter = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)/issues" -Method Get -Headers $auth
Check "Remove issue from module (count=2)" ($issuesAfter.Count -eq 2)

# ── 15: remove non-existent link → 404 ───────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m1.id)/issues/$($i3.id)" -Method Delete -Headers $auth
    Check "Remove already-removed issue (404)" $false
} catch { Check "Remove already-removed issue (404)" ($_.Exception.Response.StatusCode.value__ -eq 404) }

# ── 16: delete module (admin) ─────────────────────────────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules/$($m2.id)" -Method Delete -Headers $auth
$listAfter = Invoke-RestMethod -Uri "$base/workspaces/$slug/projects/$projId/modules" -Method Get -Headers $auth
Check "Delete module (count=1)" ($listAfter.Count -eq 1)

# ── result ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Results: $pass passed, $fail failed"
