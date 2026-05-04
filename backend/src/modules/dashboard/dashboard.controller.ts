import { Controller, Get, Query } from '@nestjs/common';
import { DashboardService } from './dashboard.service';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('metrics')
  getMetrics(@Query('role') role?: string, @Query('userId') userId?: string) {
    const parsedUserId = Number(userId);
    const safeUserId = Number.isFinite(parsedUserId) ? parsedUserId : undefined;

    return this.dashboardService.getMetrics(role, safeUserId);
  }
}
