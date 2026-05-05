import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { hash } from 'bcryptjs';
import { Prisma, SystemRole } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const PASSWORD_SALT_ROUNDS = 10;
const MIN_PASSWORD_LENGTH = 4;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

type UserRecord = {
  id: number;
  name: string;
  email: string;
  role: string;
  createdAt: Date;
};

type UserResponse = {
  user: UserRecord;
};

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async createUser(body: Record<string, unknown>): Promise<UserResponse> {
    const name = this.parseRequiredText(body.name, 'El nombre es obligatorio');
    const email = this.parseRequiredText(
      body.email,
      'El correo es obligatorio',
    );
    const password = this.parsePassword(
      body.password,
      'La contraseña es obligatoria',
    );
    const hashedPassword = await hash(password, PASSWORD_SALT_ROUNDS);
    const role = this.parseRole(
      this.parseRequiredText(body.role, 'El rol es obligatorio'),
    );

    try {
      const user = await this.prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          role,
        },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return { user };
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }

  async getUsers(rawSearch?: string, rawRole?: string) {
    const search = typeof rawSearch === 'string' ? rawSearch.trim() : '';
    const roleFilter = this.parseOptionalRole(rawRole);
    const filters: Prisma.UserWhereInput[] = [];
    const searchFilters: Prisma.UserWhereInput[] = [
      { name: { contains: search } },
      { email: { contains: search } },
    ];

    const roleFromSearch = this.normalizeRoleFilter(search);

    if (roleFromSearch) {
      searchFilters.push({ role: roleFromSearch });
    }

    if (search) {
      filters.push({
        OR: searchFilters,
      });
    }

    if (roleFilter) {
      filters.push({ role: roleFilter });
    }

    const where = filters.length > 0 ? { AND: filters } : undefined;

    const users = await this.prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    return { users };
  }

  async getUser(rawId: string) {
    const userId = this.parseUserId(rawId);
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('Usuario no encontrado');
    }

    return { user };
  }

  async updateUser(
    rawId: string,
    body: Record<string, unknown>,
  ): Promise<UserResponse> {
    const userId = this.parseUserId(rawId);
    const existingUser = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true },
    });

    if (!existingUser) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const data: Prisma.UserUpdateInput = {};

    if (typeof body.name === 'string') {
      const name = this.normalizeText(body.name);
      if (!name) {
        throw new BadRequestException('El nombre es obligatorio');
      }
      data.name = name;
    }

    if (typeof body.email === 'string') {
      data.email = this.parseEmail(body.email, 'El correo es obligatorio');
    }

    if (typeof body.role === 'string') {
      data.role = this.parseRole(body.role);
    }

    if (typeof body.password === 'string') {
      const password = body.password.trim();
      if (password) {
        data.password = await hash(
          this.parsePassword(password, 'La contraseña es obligatoria'),
          PASSWORD_SALT_ROUNDS,
        );
      }
    }

    if (Object.keys(data).length === 0) {
      throw new BadRequestException('No hay datos para actualizar');
    }

    try {
      const user = await this.prisma.user.update({
        where: { id: userId },
        data,
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          createdAt: true,
        },
      });

      return { user };
    } catch (error) {
      this.handlePrismaError(error);
      throw error;
    }
  }
async deleteUser(rawId: string) {
  const userId = this.parseUserId(rawId);

  const existingUser = await this.prisma.user.findUnique({
    where: { id: userId },
    select: { id: true },
  });

  if (!existingUser) {
    throw new NotFoundException('Usuario no encontrado');
  }

  try {
    await this.prisma.user.delete({
      where: { id: userId },
    });

    return { message: 'Usuario eliminado correctamente' };

  } catch (error) {

    // 🔥 AQUÍ ESTÁ LA CLAVE
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2003'
    ) {
      throw new BadRequestException(
        'No se puede eliminar el usuario porque está asociado a proyectos o empresas'
      );
    }

    // cualquier otro error
    throw error;
  }
}

  private parseUserId(rawId: string) {
    const userId = Number(rawId);

    if (!Number.isInteger(userId) || userId <= 0) {
      throw new BadRequestException('Identificador de usuario inválido');
    }

    return userId;
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

  private parseEmail(rawValue: unknown, requiredMessage: string) {
    const email = this.parseRequiredText(
      rawValue,
      requiredMessage,
    ).toLowerCase();

    if (!EMAIL_REGEX.test(email)) {
      throw new BadRequestException('El correo es inválido');
    }

    return email;
  }

  private parsePassword(rawValue: unknown, message: string) {
    if (typeof rawValue !== 'string') {
      throw new BadRequestException(message);
    }

    const password = rawValue.trim();

    if (!password) {
      throw new BadRequestException(message);
    }

    if (password.length < MIN_PASSWORD_LENGTH) {
      throw new BadRequestException(
        `La contraseña debe tener mínimo ${MIN_PASSWORD_LENGTH} caracteres`,
      );
    }

    return password;
  }

  private parseRole(rawRole: string): SystemRole {
    const role = rawRole.trim().toUpperCase();

    switch (role) {
      case SystemRole.COORDINADOR:
      case SystemRole.PARTICIPANTE:
      case SystemRole.EVALUADOR:
      case SystemRole.REPRESENTANTE:
        return role;
      default:
        throw new BadRequestException('Rol inválido');
    }
  }

  private parseOptionalRole(rawRole?: string) {
    if (typeof rawRole !== 'string' || !rawRole.trim()) {
      return null;
    }

    return this.parseRole(rawRole);
  }

  private normalizeRoleFilter(rawSearch: string) {
    const normalized = rawSearch.trim().toUpperCase();

    if (
      normalized === SystemRole.COORDINADOR ||
      normalized === SystemRole.PARTICIPANTE ||
      normalized === SystemRole.EVALUADOR ||
      normalized === SystemRole.REPRESENTANTE
    ) {
      return normalized as SystemRole;
    }

    return null;
  }

  private handlePrismaError(error: unknown) {
    if (this.isKnownPrismaError(error, 'P2002')) {
      throw new BadRequestException('El correo ya está registrado');
    }
  }

  private normalizeText(value: string) {
    return value.trim().replace(/\s+/g, ' ');
  }

  private isKnownPrismaError(error: unknown, code: string) {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      (error as { code?: string }).code === code
    );
  }
}
