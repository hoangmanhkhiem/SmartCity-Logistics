import { Controller, Get, Patch, Delete, Param, ParseIntPipe, Body, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { UserService } from './user.service';
import { UpdateUserDto } from './dto';
import { JwtAuthGuard, RolesGuard } from '../common/guards';
import { Roles, CurrentUser } from '../common/decorators';

@Controller('users')
@ApiTags('users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
export class UserController {
    constructor(private readonly userService: UserService) { }

    @Get()
    @Roles('platform_admin')
    @ApiOperation({ summary: 'Get all users with pagination' })
    @ApiQuery({ name: 'page', required: false, type: Number })
    @ApiQuery({ name: 'limit', required: false, type: Number })
    findAll(@Query('page') page?: number, @Query('limit') limit?: number) {
        return this.userService.findAll(page, limit);
    }

    @Get(':id')
    @Roles('platform_admin')
    @ApiOperation({ summary: 'Get user by ID' })
    findOne(@Param('id', ParseIntPipe) id: number) {
        return this.userService.findOne(id);
    }

    @Patch(':id')
    @ApiOperation({ summary: 'Update user (chính mình, hoặc platform_admin sửa bất kỳ ai)' })
    update(
        @Param('id', ParseIntPipe) id: number,
        @Body() updateUserDto: UpdateUserDto,
        @CurrentUser() currentUser: { id: number; memberships?: { role: { name: string } }[] },
    ) {
        const isSelf = currentUser.id === id;
        const isAdmin = currentUser.memberships?.some((m) => m.role.name === 'platform_admin');
        if (!isSelf && !isAdmin) throw new ForbiddenException('Không có quyền sửa người dùng này');
        if (!isAdmin && updateUserDto.isActive != null) {
            throw new ForbiddenException('Chỉ platform_admin được đổi trạng thái hoạt động');
        }
        return this.userService.update(id, updateUserDto);
    }

    @Delete(':id')
    @Roles('platform_admin')
    @ApiOperation({ summary: 'Delete user' })
    remove(@Param('id', ParseIntPipe) id: number) {
        return this.userService.remove(id);
    }
}
