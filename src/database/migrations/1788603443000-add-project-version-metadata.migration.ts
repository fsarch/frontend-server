import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from "typeorm";

export class AddProjectVersionMetadataMigration1788603443000 implements MigrationInterface {
  name = 'AddProjectVersionMetadataMigration1788603443000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.addColumns('project_version', [
      new TableColumn({
        name: 'name',
        type: 'varchar',
        length: '2048',
        isNullable: true,
      }),
      new TableColumn({
        name: 'description',
        type: 'text',
        isNullable: true,
      }),
      new TableColumn({
        name: 'external_id',
        type: 'varchar',
        length: '2048',
        isNullable: true,
      }),
    ]);

    await queryRunner.createIndex('project_version', new TableIndex({
      name: 'IDX_project_version_external_id',
      columnNames: ['external_id'],
    }));
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.dropIndex('project_version', 'IDX_project_version_external_id');
    await queryRunner.dropColumns('project_version', ['name', 'description', 'external_id']);
  }
}
