import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard, RolesGuard } from '../../middlewares/guards';
import { CurrentUser, Public, Roles } from '../../middlewares/decorators';
import { SimulationService } from './simulation.service';

@Controller('simulation')
@ApiTags('simulation')
export class SimulationController {
    constructor(private readonly sim: SimulationService) {}

    @Get('hubs')
    @Public()
    @ApiOperation({ summary: 'FR21/FR22 — mạng lưới hub 2 cấp + năng lực kho' })
    hubs(@Query('organizationId') organizationId?: string) {
        return this.sim.hubNetwork(organizationId ? Number(organizationId) : undefined);
    }

    @Post('hubs/:id/capacity')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('org_admin', 'carrier_ops', 'platform_admin', 'regulator')
    updateCapacity(@Param('id', ParseIntPipe) id: number, @Body() body: { usedKg?: number; usedM3?: number; shareLevel?: string }) {
        return this.sim.updateCapacity(id, body);
    }

    @Get('scenarios')
    @Public()
    listScenarios(@Query('published') published?: string) {
        if (published === '1' || published === 'true') return this.sim.publishedScenarios();
        return this.sim.listScenarios();
    }

    @Post('scenarios')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('researcher', 'regulator', 'platform_admin')
    create(@Body() body: { name?: string; seed?: number; orderCount?: number; lezMode?: string }) {
        return this.sim.createScenario(body);
    }

    @Get('scenarios/:id')
    @Public()
    getScenario(@Param('id', ParseIntPipe) id: number) {
        return this.sim.getScenario(id);
    }

    @Post('scenarios/:id/generate')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('researcher', 'regulator', 'platform_admin')
    generate(@Param('id', ParseIntPipe) id: number, @Body() body?: { useOsrm?: boolean }) {
        return this.sim.generate(id, { useOsrm: body?.useOsrm });
    }

    @Post('scenarios/:id/publish')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('regulator', 'platform_admin', 'researcher')
    publish(@Param('id', ParseIntPipe) id: number) {
        return this.sim.publish(id);
    }

    @Get('scenarios/:id/orders')
    @Public()
    orders(
        @Param('id', ParseIntPipe) id: number,
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('organizationId') organizationId?: string,
    ) {
        return this.sim.listOrders(id, Number(page) || 1, Number(limit) || 10, organizationId ? Number(organizationId) : undefined);
    }

    @Get('scenarios/:id/flow')
    @Public()
    flow(@Param('id', ParseIntPipe) id: number, @Query('hour') hour?: string) {
        return this.sim.flowGeoJson(id, hour != null && hour !== '' ? Number(hour) : undefined);
    }

    @Post('orders/:id/live-route')
    @Public()
    @ApiOperation({ summary: 'Tính lại 3 chặng bằng chỉ đường (OSRM/Mapbox), không dùng chim bay' })
    liveRoute(@Param('id', ParseIntPipe) id: number) {
        return this.sim.liveRoute(id);
    }

    @Get('orders/:id')
    @Public()
    order(@Param('id', ParseIntPipe) id: number) {
        return this.sim.getOrder(id);
    }

    @Post('demo-trip')
    @Public()
    @ApiOperation({ summary: 'Đơn mẫu MiniHub → Hub tổng → MiniHub khu khác' })
    demoTrip() {
        return this.sim.demoTrip();
    }

    @Get('history')
    @Public()
    history(
        @Query('page') page?: string,
        @Query('limit') limit?: string,
        @Query('organizationId') organizationId?: string,
        @Query('scenarioId') scenarioId?: string,
    ) {
        return this.sim.history({
            page: Number(page) || 1,
            limit: Number(limit) || 10,
            orgId: organizationId ? Number(organizationId) : undefined,
            scenarioId: scenarioId ? Number(scenarioId) : undefined,
        });
    }

    @Get('feedback')
    @Public()
    feedback(@Query('scenarioId') scenarioId?: string) {
        return this.sim.listFeedback(scenarioId ? Number(scenarioId) : undefined);
    }

    @Post('feedback')
    @Public()
    addFeedback(
        @Body() body: { scenarioId: number; stance?: string; content?: string; latitude?: number; longitude?: number },
        @CurrentUser() user?: { id?: number },
    ) {
        return this.sim.addFeedback({ ...body, userId: user?.id });
    }

    @Patch('feedback/:id/reply')
    @ApiBearerAuth()
    @UseGuards(JwtAuthGuard, RolesGuard)
    @Roles('regulator', 'platform_admin')
    reply(@Param('id', ParseIntPipe) id: number, @Body() body: { reply: string; status?: string }) {
        return this.sim.replyFeedback(id, body.reply, body.status);
    }
}
