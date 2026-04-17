import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { LoginDto } from './dto/login.dto';

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

    if (!user || user.password !== password) {
      throw new UnauthorizedException('Correo o contrasena incorrectos');
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
}
