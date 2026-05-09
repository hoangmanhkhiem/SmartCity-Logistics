import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiSecurity, ApiTags } from '@nestjs/swagger';
import { PlatformApiClient } from '@prisma/client';
import { ApiKeyGuard } from '../common/guards/api-key.guard';
import { PartnerCreateOrderDto } from './dto/partner-create-order.dto';
import { PartnerService } from './partner.service';

@ApiTags('partner')
@ApiSecurity('partner-api-key')
@ApiHeader({ name: 'X-Api-Key', description: 'Partner API key (logistics-as-a-service)' })
@Controller('partner')
@UseGuards(ApiKeyGuard)
export class PartnerController {
    constructor(private readonly partnerService: PartnerService) {}

    @Post('orders')
    @ApiOperation({ summary: 'Tạo đơn từ đối tác B2B (shop / sàn TMĐT)' })
    createOrder(@Body() dto: PartnerCreateOrderDto, @Req() req: { partner: PlatformApiClient }) {
        return this.partnerService.createOrder(dto, req.partner);
    }
}
