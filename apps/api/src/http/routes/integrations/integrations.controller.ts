import { Body, Controller, Delete, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../../middlewares/guards';
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

    @Patch(':id')
    @ApiOperation({ summary: 'Đổi tên hoặc thu hồi API key' })
    update(@Param('id', ParseIntPipe) id: number, @Body() body: { name?: string; isActive?: boolean }) {
        return this.integrationsService.updateClient(id, body);
    }

    @Delete(':id')
    @ApiOperation({ summary: 'Xóa API key' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.integrationsService.deleteClient(id);
    }
}
