/**
 * Permissions available in this service.
 *
 * Convention (matches other fsarch services):
 * - read_<resource>   : Reading <resource>
 * - create_<resource> : Creating a new <resource>
 * - write_<resource>  : Updating an existing <resource>
 *
 * `create_project_version` is kept separate from `write_project_version`
 * and the `*_project` roles so a CI job that only uploads new versions can
 * be granted that single, narrowly-scoped role instead of full project
 * management access.
 */
export enum Role {
  read_project = 'read_project',
  create_project = 'create_project',
  write_project = 'write_project',

  read_project_version = 'read_project_version',
  create_project_version = 'create_project_version',
  write_project_version = 'write_project_version',
}
