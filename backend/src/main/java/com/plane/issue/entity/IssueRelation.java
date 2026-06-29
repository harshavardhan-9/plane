package com.plane.issue.entity;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.CreationTimestamp;

import java.time.OffsetDateTime;
import java.util.UUID;

@Entity
@Table(name = "issue_relations")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueRelation {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "source_issue_id", nullable = false)
    private UUID sourceIssueId;

    @Column(name = "target_issue_id", nullable = false)
    private UUID targetIssueId;

    @Enumerated(EnumType.STRING)
    @Column(name = "relation_type", nullable = false)
    private IssueRelationType relationType;

    @CreationTimestamp
    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;
}
