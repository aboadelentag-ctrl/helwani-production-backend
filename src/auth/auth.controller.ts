import {
  Controller, Post, Get, Patch, Body, Param, ParseIntPipe,
  HttpCode, HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { Public } from './decorators/public.decorator';
import { Roles } from './decorators/roles.decorator';
import { CurrentUser } from './decorators/current-user.decorator';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly service: AuthService) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Login and get JWT token' })
  login(@Body() dto: LoginDto) {
    return this.service.login(dto);
  }

  @Post('register')
  @ApiOperation({ summary: 'Create a new user (admin only can create admins)' })
  @Roles('admin', 'manager')
  register(@Body() dto: RegisterDto, @CurrentUser() currentUser: any) {
    return this.service.register(dto, currentUser.role);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user' })
  me(@CurrentUser() user: any) {
    return this.service.findById(user.id);
  }

  @Get('users')
  @ApiOperation({ summary: 'List all users (admin/manager only)' })
  @Roles('admin', 'manager')
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id/toggle-active')
  @ApiOperation({ summary: 'Activate/deactivate a user (admin only)' })
  @Roles('admin')
  toggleActive(@Param('id', ParseIntPipe) id: number) {
    return this.service.toggleActive(id);
  }

  @Post('change-password')
  @ApiOperation({ summary: 'Change your own password' })
  async changePassword(
    @CurrentUser() user: any,
    @Body() dto: ChangePasswordDto,
  ) {
    return this.service.changePassword(user.id, dto.oldPassword, dto.newPassword);
  }
}
