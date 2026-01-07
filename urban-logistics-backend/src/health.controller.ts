import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@Controller('health')
@ApiTags('health')
export class HealthController {
    @Get()
    @ApiOperation({ summary: 'Health check endpoint' })
    check() {
        return {
            status: 'ok',
            timestamp: new Date().toISOString(),
            service: 'urban-logistics-api',
        };
    }
}
