package com.plane.asset.dto;

import com.plane.asset.entity.AssetStatus;
import com.plane.asset.entity.FileAsset;

import java.time.OffsetDateTime;
import java.util.UUID;

public record AssetResponse(
        UUID id,
        UUID workspaceId,
        UUID uploadedBy,
        String filename,
        long size,
        String mimeType,
        String storageKey,
        AssetStatus status,
        OffsetDateTime createdAt
) {
    public static AssetResponse from(FileAsset a) {
        return new AssetResponse(
                a.getId(), a.getWorkspaceId(), a.getUploadedBy(),
                a.getFilename(), a.getSize(), a.getMimeType(),
                a.getStorageKey(), a.getStatus(), a.getCreatedAt()
        );
    }
}
