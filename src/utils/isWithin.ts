import path from 'node:path';

export default function isWithin(root: string, inner: string): boolean {
    const rel = path.relative(root, path.resolve(root, inner));

    return !rel.startsWith('../') && rel !== '..';
}
