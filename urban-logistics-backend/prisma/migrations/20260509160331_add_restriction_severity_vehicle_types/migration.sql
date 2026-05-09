-- AlterTable
ALTER TABLE "0_Bang_Thu_Thap" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "1_khu_thu_thap_cau_giay" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "2_khu_thu_thap_dong_da" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "3_khu_thu_thap_hoan_kiem" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "4_khu_thu_thap_cua_nam" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "5_khu_cong_nghiep_ba_dinh" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "6_khu_thu_thap_giang_vo" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "b" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "grab" ALTER COLUMN "id" DROP DEFAULT;

-- AlterTable
ALTER TABLE "restrictions" ADD COLUMN     "severity" TEXT NOT NULL DEFAULT 'restricted',
ADD COLUMN     "vehicle_types" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- AlterTable
ALTER TABLE "shopee" ALTER COLUMN "id" DROP DEFAULT;
