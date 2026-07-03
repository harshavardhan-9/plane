package com.plane.asset.dto;

import java.util.UUID;

public record UploadResponse(UUID assetId, String uploadUrl, String storageKey) {}
