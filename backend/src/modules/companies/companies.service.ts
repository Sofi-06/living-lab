import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, SystemRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

type CompanyRecord = {
  id: number;
  nombre: string;
  sector: string;
  email: string | null;
  telefono: string | null;
  representanteId: number;
  representante: {
    id: number;
    name: string;
    email: string;
    role: string;
  };
};

type CompanyResponse = {
  company: CompanyRecord;
};

@Injectable()
export class CompaniesService {
  constructor(private readonly prisma: PrismaService) {}

  async createCompany(body: Record<string, unknown>): Promise<CompanyResponse> {
    const nombre = this.parseRequiredText(
      body.nombre,
      'El nombre es obligatorio',
    );
    const sector = this.parseRequiredText(
      body.sector,
      'El sector es obligatorio',
    );
    const representanteId = this.parseEntityId(
      body.representanteId,
      'El representante es obligatorio',
    );
    const email = this.parseOptionalText(body.email)?.toLowerCase() ?? null;
    const telefono = this.parseOptionalText(body.telefono) ?? null;

    await this.ensureRepresentativeExists(representanteId);

    const company = await this.prisma.company.create({
      data: {
        nombre,
        sector,
        email,
        telefono,
        representante: {
          connect: { id: representanteId },
        },
      },
      select: companySelect,
    });

    return { company: this.mapCompany(company) };
  }

  async getCompanies(rawSearch?: string) {
    const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';

    const where = search
      ? {
          OR: [
            { nombre: { contains: search } },
            { sector: { contains: search } },
            { email: { contains: search } },
            { telefono: { contains: search } },
            {
              representante: {
                is: {
                  OR: [
                    {
                      name: {
                        contains: search,
                      },
                    },
                    {
                      email: {
                        contains: search,
                      },
                    },
                  ],
                },
              },
            },
          ],
        }
      : undefined;

    const companies = await this.prisma.company.findMany({
      where,
      orderBy: { id: 'asc' },
      select: companySelect,
    });

    return { companies: companies.map((company) => this.mapCompany(company)) };
  }

  async getCompany(rawId: string) {
    const companyId = this.parseCompanyId(rawId);

    const company = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: companySelect,
    });

    if (!company) {
      throw new NotFoundException('Empresa no encontrada');
    }

    return { company: this.mapCompany(company) };
  }

  async updateCompany(
    rawId: string,
    body: Record<string, unknown>,
  ): Promise<CompanyResponse> {
    const companyId = this.parseCompanyId(rawId);

    const existingCompany = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: { id: true },
    });

    if (!existingCompany) {
      throw new NotFoundException('Empresa no encontrada');
    }

    const data: Prisma.CompanyUpdateInput = {};

    if (typeof body.nombre === 'string') {
      const nombre = this.normalizeText(body.nombre);
      if (!nombre) {
        throw new BadRequestException('El nombre es obligatorio');
      }
      data.nombre = nombre;
    }

    if (typeof body.sector === 'string') {
      const sector = this.normalizeText(body.sector);
      if (!sector) {
        throw new BadRequestException('El sector es obligatorio');
      }
      data.sector = sector;
    }

    if (body.representanteId !== undefined) {
      const representanteId = this.parseEntityId(
        body.representanteId,
        'El representante es obligatorio',
      );
      await this.ensureRepresentativeExists(representanteId);
      data.representante = {
        connect: { id: representanteId },
      };
    }

    if (body.email === null || typeof body.email === 'string') {
      data.email = this.parseOptionalText(body.email)?.toLowerCase() ?? null;
    }

    if (body.telefono === null || typeof body.telefono === 'string') {
      data.telefono = this.parseOptionalText(body.telefono) ?? null;
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay datos para actualizar');
    }

    const company = await this.prisma.company.update({
      where: { id: companyId },
      data,
      select: companySelect,
    });

    return { company: this.mapCompany(company) };
  }

  async deleteCompany(rawId: string) {
    const companyId = this.parseCompanyId(rawId);

    const existingCompany = await this.prisma.company.findUnique({
      where: { id: companyId },
      select: {
        id: true,
        projects: {
          select: { id: true },
          take: 1,
        },
      },
    });

    if (!existingCompany) {
      throw new NotFoundException('Empresa no encontrada');
    }

    if (existingCompany.projects.length > 0) {
      throw new BadRequestException(
        'No se puede eliminar la empresa porque tiene proyectos asociados',
      );
    }

    await this.prisma.company.delete({ where: { id: companyId } });

    return { message: 'Empresa eliminada correctamente' };
  }

  private parseCompanyId(rawId: string) {
    const companyId = Number(rawId);

    if (!Number.isInteger(companyId) || companyId <= 0) {
      throw new BadRequestException('Identificador de empresa invalido');
    }

    return companyId;
  }

  private parseEntityId(rawValue: unknown, message: string) {
    const entityId = Number(rawValue);

    if (!Number.isInteger(entityId) || entityId <= 0) {
      throw new BadRequestException(message);
    }

    return entityId;
  }

  private parseRequiredText(rawValue: unknown, message: string) {
    if (typeof rawValue !== 'string') {
      throw new BadRequestException(message);
    }

    const value = this.normalizeText(rawValue);

    if (!value) {
      throw new BadRequestException(message);
    }

    return value;
  }

  private parseOptionalText(rawValue: unknown) {
    if (rawValue === undefined || rawValue === null) return null;
    if (typeof rawValue !== 'string') {
      throw new BadRequestException('Dato invalido');
    }

    const value = this.normalizeText(rawValue);
    return value || null;
  }

  private normalizeText(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }

  private async ensureRepresentativeExists(representanteId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: representanteId },
      select: {
        id: true,
        role: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Representante no encontrado');
    }

    if (user.role !== SystemRole.REPRESENTANTE) {
      throw new BadRequestException(
        'El usuario seleccionado no tiene rol REPRESENTANTE',
      );
    }
  }

  private mapCompany(
    company: Prisma.CompanyGetPayload<{ select: typeof companySelect }>,
  ): CompanyRecord {
    return {
      id: company.id,
      nombre: company.nombre,
      sector: company.sector,
      email: company.email,
      telefono: company.telefono,
      representanteId: company.representanteId,
      representante: {
        id: company.representante.id,
        name: company.representante.name,
        email: company.representante.email,
        role: company.representante.role,
      },
    };
  }
}

const companySelect = {
  id: true,
  nombre: true,
  sector: true,
  email: true,
  telefono: true,
  representanteId: true,
  representante: {
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
  },
} as const;
