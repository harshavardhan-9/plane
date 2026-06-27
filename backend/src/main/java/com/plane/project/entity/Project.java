package com.plane.project.entity;

import com.plane.shared.entity.BaseEntity;
import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "projects")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Project extends BaseEntity {

    @Column(name = "workspace_id", nullable = false)
    private UUID workspaceId;

    @Column(name = "name", nullable = false)
    private String name;

    @Column(name = "identifier", nullable = false)
    private String identifier;

    @Column(name = "description")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "network", nullable = false)
    @Builder.Default
    private ProjectNetwork network = ProjectNetwork.SECRET;

    @Column(name = "emoji")
    private String emoji;

    @Column(name = "cover_image")
    private String coverImage;
}
