package com.plane.issue.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "issue_assignees")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueAssignee {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "issue_id", nullable = false)
    private UUID issueId;

    @Column(name = "user_id", nullable = false)
    private UUID userId;
}
