package com.plane.asset.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;

public record UploadRequest(
        @NotBlank String filename,
        @NotBlank String mimeType,
        @Positive long size
) {}
