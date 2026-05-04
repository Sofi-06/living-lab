import { Injectable, UnauthorizedException } from '@nestjs/common';
import { compare, hash } from 'bcryptjs';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';

const PASSWORD_SALT_ROUNDS = 10;

type LoginUser = {
  id: number;
  name: string;
  email: string;
  role: string;
};

type LoginResponse = {
  message: string;
  user: LoginUser;
};

@Injectable()
export class AuthService {
  constructor(private readonly prisma: PrismaService) {}

  async login(loginDto: LoginDto): Promise<LoginResponse> {
    const email = loginDto.email.trim().toLowerCase();
    const password = loginDto.password;

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        name: true,
        email: true,
        password: true,
        role: true,
      },
    });

    if (!user?.password) {
      throw new UnauthorizedException('Correo o contrasena incorrectos');
    }

    const usesHash = this.isBcryptHash(user.password);
    const isPasswordValid = usesHash
      ? await compare(password, user.password)
      : user.password === password;

    if (!isPasswordValid) {
      throw new UnauthorizedException('Correo o contrasena incorrectos');
    }

    // Transparently upgrade legacy plaintext passwords after successful login.
    if (!usesHash) {
      const hashedPassword = await hash(password, PASSWORD_SALT_ROUNDS);

      await this.prisma.user.update({
        where: { id: user.id },
        data: { password: hashedPassword },
      });
    }

    return {
      message: 'Inicio de sesion exitoso',
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: String(user.role),
      },
    };
  }

  private isBcryptHash(value: string) {
    return (
      value.startsWith('$2a$') ||
      value.startsWith('$2b$') ||
      value.startsWith('$2y$')
    );
  }
}
