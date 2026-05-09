import { BadRequestException, Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

export type ResearchTableMeta = {
    key: string;
    label: string;
    dbTable: string;
};

const RESEARCH_TABLES: ResearchTableMeta[] = [
    { key: 'bang-thu-thap-0', label: 'Bảng thu thập (tổng)', dbTable: '0_Bang_Thu_Thap' },
    { key: 'khu-cau-giay-1', label: 'Khu thu thập — Cầu Giấy', dbTable: '1_khu_thu_thap_cau_giay' },
    { key: 'khu-dong-da-2', label: 'Khu thu thập — Đống Đa', dbTable: '2_khu_thu_thap_dong_da' },
    { key: 'khu-hoan-kiem-3', label: 'Khu thu thập — Hoàn Kiếm', dbTable: '3_khu_thu_thap_hoan_kiem' },
    { key: 'khu-cua-nam-4', label: 'Khu thu thập — Cửa Nam', dbTable: '4_khu_thu_thap_cua_nam' },
    { key: 'khu-cn-ba-dinh-5', label: 'Khu CN Ba Đình', dbTable: '5_khu_cong_nghiep_ba_dinh' },
    { key: 'khu-giang-vo-6', label: 'Khu thu thập — Giảng Võ', dbTable: '6_khu_thu_thap_giang_vo' },
    { key: 'benchmark-be', label: 'So sánh — Be', dbTable: 'b' },
    { key: 'benchmark-grab', label: 'So sánh — Grab', dbTable: 'grab' },
    { key: 'benchmark-shopee', label: 'So sánh — Shopee', dbTable: 'shopee' },
];

@Injectable()
export class ResearchService {
    constructor(private readonly prisma: PrismaService) {}

    listTables(): ResearchTableMeta[] {
        return RESEARCH_TABLES;
    }

    resolveTable(key: string): ResearchTableMeta {
        const meta = RESEARCH_TABLES.find((t) => t.key === key);
        if (!meta) {
            throw new BadRequestException(`Unknown research table key: ${key}`);
        }
        return meta;
    }

    async countRows(tableKey: string): Promise<number> {
        const { key } = this.resolveTable(tableKey);
        switch (key) {
            case 'bang-thu-thap-0':
                return this.prisma.researchBangThuThap0.count();
            case 'khu-cau-giay-1':
                return this.prisma.researchKhuCauGiay1.count();
            case 'khu-dong-da-2':
                return this.prisma.researchKhuDongDa2.count();
            case 'khu-hoan-kiem-3':
                return this.prisma.researchKhuHoanKiem3.count();
            case 'khu-cua-nam-4':
                return this.prisma.researchKhuCuaNam4.count();
            case 'khu-cn-ba-dinh-5':
                return this.prisma.researchKhuCnBaDinh5.count();
            case 'khu-giang-vo-6':
                return this.prisma.researchKhuGiangVo6.count();
            case 'benchmark-be':
                return this.prisma.researchBenchmarkBe.count();
            case 'benchmark-grab':
                return this.prisma.researchBenchmarkGrab.count();
            case 'benchmark-shopee':
                return this.prisma.researchBenchmarkShopee.count();
            default:
                throw new BadRequestException(`Unknown research table key: ${tableKey}`);
        }
    }

    async listRows(tableKey: string, skip: number, take: number): Promise<unknown[]> {
        const { key } = this.resolveTable(tableKey);
        const args = { skip, take, orderBy: { id: 'asc' as const } };
        switch (key) {
            case 'bang-thu-thap-0':
                return this.prisma.researchBangThuThap0.findMany(args);
            case 'khu-cau-giay-1':
                return this.prisma.researchKhuCauGiay1.findMany(args);
            case 'khu-dong-da-2':
                return this.prisma.researchKhuDongDa2.findMany(args);
            case 'khu-hoan-kiem-3':
                return this.prisma.researchKhuHoanKiem3.findMany(args);
            case 'khu-cua-nam-4':
                return this.prisma.researchKhuCuaNam4.findMany(args);
            case 'khu-cn-ba-dinh-5':
                return this.prisma.researchKhuCnBaDinh5.findMany(args);
            case 'khu-giang-vo-6':
                return this.prisma.researchKhuGiangVo6.findMany(args);
            case 'benchmark-be':
                return this.prisma.researchBenchmarkBe.findMany(args);
            case 'benchmark-grab':
                return this.prisma.researchBenchmarkGrab.findMany(args);
            case 'benchmark-shopee':
                return this.prisma.researchBenchmarkShopee.findMany(args);
            default:
                throw new BadRequestException(`Unknown research table key: ${tableKey}`);
        }
    }
}
