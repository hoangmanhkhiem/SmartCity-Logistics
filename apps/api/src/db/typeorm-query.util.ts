import { FindOptionsWhere, ObjectLiteral, Repository } from 'typeorm';

/** Shape compatible with Prisma list `_count` selects. */
export async function relationCounts(
    repo: Repository<ObjectLiteral>,
    items: Array<{ id: number }>,
    relationProperty: string,
    foreignKeyColumn: string,
    countKey: string,
): Promise<Array<Record<string, unknown> & { _count: Record<string, number> }>> {
    if (!items.length) return [];
    const ids = items.map((i) => i.id);
    const meta = repo.metadata;
    const relation = meta.relations.find((r) => r.propertyName === relationProperty);
    if (!relation) {
        return items.map((item) => ({ ...item, _count: { [countKey]: 0 } }));
    }
    const childMeta = relation.inverseEntityMetadata;
    const rows = await repo.manager
        .createQueryBuilder()
        .select(foreignKeyColumn, 'parentId')
        .addSelect('COUNT(*)', 'cnt')
        .from(childMeta.tableName, 'c')
        .where(`${foreignKeyColumn} IN (:...ids)`, { ids })
        .groupBy(foreignKeyColumn)
        .getRawMany<{ parentId: number; cnt: string }>();
    const map = new Map(rows.map((r) => [Number(r.parentId), Number(r.cnt)]));
    return items.map((item) => ({
        ...item,
        _count: { [countKey]: map.get(item.id) ?? 0 },
    }));
}

export async function groupByField<T extends ObjectLiteral>(
    repo: Repository<T>,
    field: keyof T & string,
    where?: FindOptionsWhere<T> | FindOptionsWhere<T>[],
): Promise<Array<{ key: string; count: number }>> {
    const alias = 'e';
    const qb = repo.createQueryBuilder(alias).select(`${alias}.${field}`, 'key').addSelect('COUNT(*)', 'count');
    if (where) {
        qb.setFindOptions({ where });
    }
    const rows = await qb.groupBy(`${alias}.${field}`).getRawMany<{ key: string; count: string }>();
    return rows.map((r) => ({ key: r.key, count: Number(r.count) }));
}
