package com.plane.asset.controller;

import com.plane.asset.dto.AssetResponse;
import com.plane.asset.dto.UploadRequest;
import com.plane.asset.dto.UploadResponse;
import com.plane.asset.service.FileAssetService;
import com.plane.security.UserPrincipal;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/workspaces/{slug}/assets")
@RequiredArgsConstructor
public class FileAssetController {

    private final FileAssetService fileAssetService;

    @PostMapping("/upload")
    @ResponseStatus(HttpStatus.CREATED)
    public UploadResponse upload(@PathVariable String slug,
                                 @Valid @RequestBody UploadRequest request,
                                 @AuthenticationPrincipal UserPrincipal principal) {
        return fileAssetService.initiateUpload(slug, request, principal.getUserId());
    }

    @PatchMapping("/{assetId}/complete")
    public AssetResponse complete(@PathVariable String slug,
                                  @PathVariable UUID assetId,
                                  @AuthenticationPrincipal UserPrincipal principal) {
        return fileAssetService.completeUpload(slug, assetId, principal.getUserId());
    }

    @DeleteMapping("/{assetId}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String slug,
                       @PathVariable UUID assetId,
                       @AuthenticationPrincipal UserPrincipal principal) {
        fileAssetService.delete(slug, assetId, principal.getUserId());
    }
}
