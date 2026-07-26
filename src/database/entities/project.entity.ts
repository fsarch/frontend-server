import {
  Column,
  CreateDateColumn,
  DeleteDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
} from "typeorm";

@Entity({
  name: "project",
})
export class Project {
  @PrimaryGeneratedColumn("uuid")
  id: string;

  @Column({
    name: "name",
    length: 2048,
  })
  name: string;

  @Column({
    name: "description",
    type: "text",
    nullable: true,
  })
  description?: string;

  @Column({
    name: "current_version_id",
    type: "uuid",
    nullable: true,
  })
  @Index()
  currentVersionId?: string;

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
