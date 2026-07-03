package com.plane.asset.service;

import com.plane.asset.dto.AssetResponse;
import com.plane.asset.dto.UploadRequest;
import com.plane.asset.dto.UploadResponse;
import com.plane.asset.entity.AssetStatus;
import com.plane.asset.entity.FileAsset;
import com.plane.asset.repository.FileAssetRepository;
import com.plane.shared.exception.ForbiddenException;
import com.plane.shared.exception.ResourceNotFoundException;
import com.plane.workspace.entity.Workspace;
import com.plane.workspace.entity.WorkspaceRole;
import com.plane.workspace.repository.WorkspaceMemberRepository;
import com.plane.workspace.repository.WorkspaceRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import software.amazon.awssdk.services.s3.presigner.S3Presigner;
import software.amazon.awssdk.services.s3.presigner.model.PresignedPutObjectRequest;

import java.time.Duration;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class FileAssetService {

    private final FileAssetRepository fileAssetRepository;
    private final WorkspaceRepository workspaceRepository;
    private final WorkspaceMemberRepository workspaceMemberRepository;
    private final S3Presigner s3Presigner;

    @Value("${minio.bucket}")
    private String bucket;

    @Transactional
    public UploadResponse initiateUpload(String slug, UploadRequest request, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        requireWorkspaceMember(workspace.getId(), userId);

        String storageKey = workspace.getId() + "/" + UUID.randomUUID() + "/" + request.filename();

        FileAsset asset = fileAssetRepository.saveAndFlush(FileAsset.builder()
                .workspaceId(workspace.getId())
                .uploadedBy(userId)
                .filename(request.filename())
                .size(request.size())
                .mimeType(request.mimeType())
                .storageKey(storageKey)
                .build());

        String uploadUrl = presignPut(storageKey, request.mimeType());
        return new UploadResponse(asset.getId(), uploadUrl, storageKey);
    }

    @Transactional
    public AssetResponse completeUpload(String slug, UUID assetId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        FileAsset asset = getAsset(assetId, workspace.getId());
        if (!asset.getUploadedBy().equals(userId)) {
            throw new ForbiddenException("Only the uploader can confirm this upload");
        }
        asset.setStatus(AssetStatus.UPLOADED);
        return AssetResponse.from(fileAssetRepository.save(asset));
    }

    @Transactional
    public void delete(String slug, UUID assetId, UUID userId) {
        Workspace workspace = getWorkspace(slug);
        FileAsset asset = getAsset(assetId, workspace.getId());

        boolean isUploader = asset.getUploadedBy().equals(userId);
        boolean isAdmin = workspaceMemberRepository
                .findByWorkspaceIdAndUserId(workspace.getId(), userId)
                .map(m -> m.getRole().isAtLeast(WorkspaceRole.ADMIN))
                .orElse(false);

        if (!isUploader && !isAdmin) {
            throw new ForbiddenException("Not authorized to delete this asset");
        }

        asset.softDelete();
        asset.setStatus(AssetStatus.DELETED);
        fileAssetRepository.save(asset);
    }

    private String presignPut(String storageKey, String mimeType) {
        PresignedPutObjectRequest presigned = s3Presigner.presignPutObject(r -> r
                .signatureDuration(Duration.ofMinutes(15))
                .putObjectRequest(p -> p
                        .bucket(bucket)
                        .key(storageKey)
                        .contentType(mimeType)));
        return presigned.url().toString();
    }

    private Workspace getWorkspace(String slug) {
        return workspaceRepository.findBySlug(slug)
                .orElseThrow(() -> new ResourceNotFoundException("Workspace not found: " + slug));
    }

    private void requireWorkspaceMember(UUID workspaceId, UUID userId) {
        workspaceMemberRepository.findByWorkspaceIdAndUserId(workspaceId, userId)
                .orElseThrow(() -> new ForbiddenException("You are not a member of this workspace"));
    }

    private FileAsset getAsset(UUID assetId, UUID workspaceId) {
        return fileAssetRepository.findByIdAndWorkspaceIdAndDeletedAtIsNull(assetId, workspaceId)
                .orElseThrow(() -> new ResourceNotFoundException("Asset not found"));
    }
}
