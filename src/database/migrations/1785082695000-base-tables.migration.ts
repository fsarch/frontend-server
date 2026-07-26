import { MigrationInterface, QueryRunner, Table, TableIndex } from "typeorm";
import { getDataType } from "./utils/data-type.mapper.js";

export class BaseTablesMigration1785082695000 implements MigrationInterface {
  name = 'BaseTablesMigration1785082695000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    const databaseType = queryRunner.connection.driver.options.type;

    // Create project table
    await queryRunner.createTable(new Table({
      name: 'project',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isNullable: false,
        },
        {
          name: 'name',
          type: 'varchar',
          length: '2048',
          isNullable: false,
        },
        {
          name: 'description',
          type: 'text',
          isNullable: true,
        },
        {
          name: 'current_version_id',
          type: 'uuid',
          isNullable: true,
        },
        {
          name: 'creation_time',
          type: getDataType(databaseType, 'timestamp'),
          isNullable: false,
          default: 'now()',
        },
        {
          name: 'deletion_time',
          type: getDataType(databaseType, 'timestamp'),
          isNullable: true,
        },
      ],
      indices: [
        new TableIndex({
          name: 'IDX_project_current_version_id',
          columnNames: ['current_version_id'],
        }),
        new TableIndex({
          name: 'IDX_project_deletion_time',
          columnNames: ['deletion_time'],
        }),
      ],
    }));

    // Create project_version table
    await queryRunner.createTable(new Table({
      name: 'project_version',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isNullable: false,
        },
        {
          name: 'project_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'creation_time',
          type: getDataType(databaseType, 'timestamp'),
          isNullable: false,
          default: 'now()',
        },
        {
          name: 'deletion_time',
          type: getDataType(databaseType, 'timestamp'),
          isNullable: true,
        },
      ],
      foreignKeys: [
        {
          name: 'fk__project_version__project_id',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          columnNames: ['project_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'project',
        },
      ],
      indices: [
        new TableIndex({
          name: 'IDX_project_version_project_id',
          columnNames: ['project_id'],
        }),
        new TableIndex({
          name: 'IDX_project_version_deletion_time',
          columnNames: ['deletion_time'],
        }),
      ],
    }));

    // Create project_file table
    await queryRunner.createTable(new Table({
      name: 'project_file',
      columns: [
        {
          name: 'id',
          type: 'uuid',
          isPrimary: true,
          isNullable: false,
        },
        {
          name: 'version_id',
          type: 'uuid',
          isNullable: false,
        },
        {
          name: 'path',
          type: 'varchar',
          length: '4096',
          isNullable: false,
        },
        {
          name: 'original_path',
          type: 'varchar',
          length: '4096',
          isNullable: false,
        },
        {
          name: 'hash',
          type: 'varchar',
          length: '512',
          isNullable: false,
        },
        {
          name: 'size',
          type: 'bigint',
          isNullable: false,
        },
        {
          name: 'mime',
          type: 'varchar',
          length: '255',
          isNullable: false,
        },
        {
          name: 'creation_time',
          type: getDataType(databaseType, 'timestamp'),
          isNullable: false,
          default: 'now()',
        },
        {
          name: 'deletion_time',
          type: getDataType(databaseType, 'timestamp'),
          isNullable: true,
        },
      ],
      foreignKeys: [
        {
          name: 'fk__project_file__version_id',
          onDelete: 'CASCADE',
          onUpdate: 'CASCADE',
          columnNames: ['version_id'],
          referencedColumnNames: ['id'],
          referencedTableName: 'project_version',
        },
      ],
      indices: [
        new TableIndex({
          name: 'IDX_project_file_version_id_path',
          columnNames: ['version_id', 'path'],
        }),
        new TableIndex({
          name: 'IDX_project_file_version_id_hash',
          columnNames: ['version_id', 'hash'],
        }),
      ],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropTable('project_file');
    await queryRunner.dropTable('project_version');
    await queryRunner.dropTable('project');
  }
}
