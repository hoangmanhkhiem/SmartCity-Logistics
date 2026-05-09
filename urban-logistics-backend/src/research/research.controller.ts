import { Controller, DefaultValuePipe, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiParam, ApiQuery, ApiTags } from '@nestjs/swagger';
import { ResearchService } from './research.service';

@ApiTags('research')
@Controller('research')
export class ResearchController {
    constructor(private readonly researchService: ResearchService) {}

    @Get('tables')
    @ApiOperation({ summary: 'List research / field data tables' })
    listTables() {
        return this.researchService.listTables();
    }

    @Get(':tableKey/rows')
    @ApiOperation({ summary: 'Paginated rows for a research table' })
    @ApiParam({ name: 'tableKey', example: 'bang-thu-thap-0' })
    @ApiQuery({ name: 'skip', required: false, example: 0 })
    @ApiQuery({ name: 'take', required: false, example: 20 })
    async listRows(
        @Param('tableKey') tableKey: string,
        @Query('skip', new DefaultValuePipe(0), ParseIntPipe) skip: number,
        @Query('take', new DefaultValuePipe(20), ParseIntPipe) take: number,
    ) {
        const takeClamped = Math.min(Math.max(take, 1), 100);
        const skipSafe = Math.max(skip, 0);
        const [total, rows] = await Promise.all([
            this.researchService.countRows(tableKey),
            this.researchService.listRows(tableKey, skipSafe, takeClamped),
        ]);
        return {
            tableKey,
            total,
            skip: skipSafe,
            take: takeClamped,
            rows,
        };
    }
}
