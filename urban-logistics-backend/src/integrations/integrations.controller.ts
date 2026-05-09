import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards';
import { CreateApiClientDto } from './dto/create-api-client.dto';
import { IntegrationsService } from './integrations.service';

@ApiTags('integrations')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('integrations/api-clients')
export class IntegrationsController {
    constructor(private readonly integrationsService: IntegrationsService) {}

    @Get()
    @ApiOperation({ summary: 'Danh sách API client (không trả secret)' })
    list() {
        return this.integrationsService.listClients();
    }

    @Post()
    @ApiOperation({ summary: 'Tạo API key mới cho đối tác tích hợp' })
    create(@Body() body: CreateApiClientDto) {
        return this.integrationsService.createClient(body.name);
    }
}
