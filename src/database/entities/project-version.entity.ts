import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
} from "typeorm";
import { Project } from "./project.entity.js";

@Entity({
  name: "project_version",
})
export class ProjectVersion {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    name: "project_id",
    type: "uuid",
  })
  @Index()
  projectId: string;

  @ManyToOne(() => Project, (project) => project.id, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "project_id",
    foreignKeyConstraintName: "fk__project_version__project_id",
  })
  project: Project;

  @CreateDateColumn({
    name: "creation_time",
  })
  creationTime: Date;

  @DeleteDateColumn({
    name: "deletion_time",
  })
  @Index()
  deletionTime?: Date;
}
