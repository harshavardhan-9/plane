$base = "http://localhost:8080/api/v1"
$headers = @{ "Content-Type" = "application/json" }
$pass = 0; $fail = 0

function Check($label, $cond) {
    if ($cond) { Write-Host "[PASS] $label"; $global:pass++ }
    else        { Write-Host "[FAIL] $label"; $global:fail++ }
}

# ── auth + two users ──────────────────────────────────────────────────────
$ts = Get-Date -Format "HHmmss"

$r1 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Headers $headers `
    -Body (@{ name = "Owner-$ts"; email = "owner-$ts@test.com"; password = "Pass1234!" } | ConvertTo-Json)
$auth1 = @{ "Content-Type" = "application/json"; Authorization = "Bearer $($r1.accessToken)" }

$r2 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Headers $headers `
    -Body (@{ name = "Member-$ts"; email = "member-$ts@test.com"; password = "Pass1234!" } | ConvertTo-Json)
$auth2 = @{ "Content-Type" = "application/json"; Authorization = "Bearer $($r2.accessToken)" }

$r3 = Invoke-RestMethod -Uri "$base/auth/register" -Method Post -Headers $headers `
    -Body (@{ name = "Outside-$ts"; email = "outside-$ts@test.com"; password = "Pass1234!" } | ConvertTo-Json)
$auth3 = @{ "Content-Type" = "application/json"; Authorization = "Bearer $($r3.accessToken)" }

# ── workspace ─────────────────────────────────────────────────────────────
$ws = Invoke-RestMethod -Uri "$base/workspaces" -Method Post -Headers $auth1 `
    -Body (@{ name = "WS-Assets-$ts"; slug = "ws-assets-$ts" } | ConvertTo-Json)
$slug = $ws.slug

# invite user2 as member
$invite = Invoke-RestMethod -Uri "$base/workspaces/$slug/invites" -Method Post -Headers $auth1 `
    -Body (@{ email = "member-$ts@test.com"; role = "MEMBER" } | ConvertTo-Json)
Invoke-RestMethod -Uri "$base/workspaces/invites/$($invite.token)/accept" -Method Post -Headers $auth2 | Out-Null

# ── 1: initiate upload ────────────────────────────────────────────────────
$up = Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/upload" -Method Post -Headers $auth1 `
    -Body (@{ filename = "logo.png"; mimeType = "image/png"; size = 204800 } | ConvertTo-Json)
Check "Initiate upload returns assetId + uploadUrl + storageKey" `
    ($null -ne $up.assetId -and $up.uploadUrl -like "*plane-assets*" -and $up.storageKey -like "*logo.png*")

# ── 2: upload URL contains workspace path ─────────────────────────────────
Check "Storage key is workspace-scoped" ($up.storageKey -like "$($ws.id)*")

# ── 3: upload to MinIO via presigned URL ──────────────────────────────────
$fakeBytes = [System.Text.Encoding]::UTF8.GetBytes("fake-png-content")
try {
    Invoke-RestMethod -Uri $up.uploadUrl -Method Put `
        -Headers @{ "Content-Type" = "image/png"; "Content-Length" = $fakeBytes.Length } `
        -Body $fakeBytes
    Check "PUT to presigned URL succeeds (MinIO accepts)" $true
} catch {
    Check "PUT to presigned URL succeeds (MinIO accepts)" $false
    Write-Host "  Error: $($_.Exception.Message)"
}

# ── 4: complete upload ────────────────────────────────────────────────────
$asset = Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/$($up.assetId)/complete" -Method Patch -Headers $auth1
Check "Complete upload → status UPLOADED" ($asset.status -eq "UPLOADED")
Check "Asset has correct filename" ($asset.filename -eq "logo.png")
Check "Asset has correct mimeType" ($asset.mimeType -eq "image/png")
Check "Asset size is stored" ($asset.size -eq 204800)

# ── 5: only uploader can complete their own upload ────────────────────────
$up2 = Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/upload" -Method Post -Headers $auth1 `
    -Body (@{ filename = "doc.pdf"; mimeType = "application/pdf"; size = 1048576 } | ConvertTo-Json)
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/$($up2.assetId)/complete" -Method Patch -Headers $auth2
    Check "Non-uploader completing upload rejected (403)" $false
} catch { Check "Non-uploader completing upload rejected (403)" ($_.Exception.Response.StatusCode.value__ -eq 403) }

# ── 6: workspace member can initiate their own upload ─────────────────────
$up3 = Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/upload" -Method Post -Headers $auth2 `
    -Body (@{ filename = "avatar.jpg"; mimeType = "image/jpeg"; size = 51200 } | ConvertTo-Json)
Check "Workspace member can initiate upload" ($null -ne $up3.assetId)

# ── 7: non-member cannot upload ───────────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/upload" -Method Post -Headers $auth3 `
        -Body (@{ filename = "hack.exe"; mimeType = "application/octet-stream"; size = 1 } | ConvertTo-Json)
    Check "Non-member cannot upload (403)" $false
} catch { Check "Non-member cannot upload (403)" ($_.Exception.Response.StatusCode.value__ -eq 403) }

# ── 8: validation — missing filename ─────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/upload" -Method Post -Headers $auth1 `
        -Body (@{ filename = ""; mimeType = "image/png"; size = 100 } | ConvertTo-Json)
    Check "Empty filename rejected (400)" $false
} catch { Check "Empty filename rejected (400)" ($_.Exception.Response.StatusCode.value__ -eq 400) }

# ── 9: validation — zero size ─────────────────────────────────────────────
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/upload" -Method Post -Headers $auth1 `
        -Body (@{ filename = "empty.txt"; mimeType = "text/plain"; size = 0 } | ConvertTo-Json)
    Check "Zero size rejected (400)" $false
} catch { Check "Zero size rejected (400)" ($_.Exception.Response.StatusCode.value__ -eq 400) }

# ── 10: uploader can delete own asset ────────────────────────────────────
Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/$($up.assetId)" -Method Delete -Headers $auth1
$deleted = $null
try {
    $deleted = Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/$($up.assetId)/complete" -Method Patch -Headers $auth1
} catch {}
Check "Deleted asset is no longer accessible (404)" ($null -eq $deleted)

# ── 11: workspace admin can delete another user's asset ───────────────────
$up4 = Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/upload" -Method Post -Headers $auth2 `
    -Body (@{ filename = "report.csv"; mimeType = "text/csv"; size = 2048 } | ConvertTo-Json)
Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/$($up4.assetId)" -Method Delete -Headers $auth1
$gone = $null
try {
    $gone = Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/$($up4.assetId)/complete" -Method Patch -Headers $auth2
} catch {}
Check "Admin can delete another user's asset" ($null -eq $gone)

# ── 12: non-uploader non-admin cannot delete ──────────────────────────────
$up5 = Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/upload" -Method Post -Headers $auth1 `
    -Body (@{ filename = "private.png"; mimeType = "image/png"; size = 500 } | ConvertTo-Json)
try {
    Invoke-RestMethod -Uri "$base/workspaces/$slug/assets/$($up5.assetId)" -Method Delete -Headers $auth2
    Check "Non-uploader non-admin cannot delete (403)" $false
} catch { Check "Non-uploader non-admin cannot delete (403)" ($_.Exception.Response.StatusCode.value__ -eq 403) }

# ── result ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "Results: $pass passed, $fail failed"
