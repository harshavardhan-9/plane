package com.plane.issue.entity;

import jakarta.persistence.*;
import lombok.*;

import java.util.UUID;

@Entity
@Table(name = "issue_labels")
@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class IssueLabel {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "issue_id", nullable = false)
    private UUID issueId;

    @Column(name = "label_id", nullable = false)
    private UUID labelId;
}
