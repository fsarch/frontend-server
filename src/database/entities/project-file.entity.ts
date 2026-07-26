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
import { ProjectVersion } from "./project-version.entity.js";

@Entity({
  name: "project_file",
})
@Index(["versionId", "path"], { unique: false })
@Index(["versionId", "hash"], { unique: false })
export class ProjectFile {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    name: "version_id",
    type: "uuid",
  })
  versionId: string;

  @ManyToOne(() => ProjectVersion, (version) => version.id, {
    onUpdate: "CASCADE",
    onDelete: "CASCADE",
  })
  @JoinColumn({
    name: "version_id",
    foreignKeyConstraintName: "fk__project_file__version_id",
  })
  version: ProjectVersion;

  @Column({
    name: "path",
    length: 4096,
  })
  path: string;

  @Column({
    name: "original_path",
    length: 4096,
  })
  originalPath: string;

  @Column({
    name: "hash",
    length: 512,
  })
  hash: string;

  @Column({
    name: "size",
    type: "bigint",
  })
  size: number;

  @Column({
    name: "mime",
    length: 255,
  })
  mime: string;

  @CreateDateColumn({
    name: "creation_time",
  })
  creationTime: Date;

  @DeleteDateColumn({
    name: "deletion_time",
  })
  deletionTime?: Date;
}
