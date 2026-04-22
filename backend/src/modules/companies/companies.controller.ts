import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  createCompany(@Body() body: Record<string, unknown>) {
    return this.companiesService.createCompany(body);
  }

  @Get()
  getCompanies(@Query('search') search?: string) {
    return this.companiesService.getCompanies(search);
  }

  @Get(':id')
  getCompany(@Param('id') id: string) {
    return this.companiesService.getCompany(id);
  }

  @Patch(':id')
  updateCompany(
    @Param('id') id: string,
    @Body() body: Record<string, unknown>,
  ) {
    return this.companiesService.updateCompany(id, body);
  }

  @Delete(':id')
  deleteCompany(@Param('id') id: string) {
    return this.companiesService.deleteCompany(id);
  }
}
