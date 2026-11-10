import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Organization, Carrier, Facility, Membership } from '../../../db/entities';
import { CreateOrganizationDto, UpdateOrganizationDto } from './dto';

@Injectable()
export class OrganizationService {
    constructor(
        @InjectRepository(Organization) private readonly orgRepo: Repository<Organization>,
        @InjectRepository(Carrier) private readonly carrierRepo: Repository<Carrier>,
        @InjectRepository(Facility) private readonly facilityRepo: Repository<Facility>,
        @InjectRepository(Membership) private readonly membershipRepo: Repository<Membership>,
    ) {}

    async create(createDto: CreateOrganizationDto) {
        return this.orgRepo.save(this.orgRepo.create(createDto));
    }

    async findAll(page = 1, limit = 10, type?: string) {
        const pageNum = Number(page) || 1;
        const limitNum = Number(limit) || 10;
        const skip = (pageNum - 1) * limitNum;
        const where = type ? { type } : {};
        const [rows, total] = await Promise.all([
            this.orgRepo.find({ where, skip, take: limitNum, order: { createdAt: 'DESC' } }),
            this.orgRepo.count({ where }),
        ]);
        const data = await Promise.all(
            rows.map(async (org) => ({
                ...org,
                _count: {
                    carriers: await this.carrierRepo.count({ where: { organizationId: org.id } }),
                    facilities: await this.facilityRepo.count({ where: { organizationId: org.id } }),
                },
            })),
        );
        return { data, meta: { total, page: pageNum, limit: limitNum, totalPages: Math.ceil(total / limitNum) } };
    }

    async findOne(id: number) {
        const org = await this.orgRepo.findOne({
            where: { id },
            relations: ['carriers', 'facilities'],
        });
        if (!org) throw new NotFoundException(`Organization ${id} not found`);
        return {
            ...org,
            _count: {
                carriers: org.carriers?.length ?? 0,
                facilities: org.facilities?.length ?? 0,
                memberships: await this.membershipRepo.count({ where: { organizationId: id } }),
            },
        };
    }

    async update(id: number, updateDto: UpdateOrganizationDto) {
        await this.findOne(id);
        await this.orgRepo.update(id, updateDto);
        return this.orgRepo.findOneBy({ id });
    }

    async remove(id: number) {
        await this.findOne(id);
        return this.orgRepo.remove(await this.orgRepo.findOneByOrFail({ id }));
    }
}
