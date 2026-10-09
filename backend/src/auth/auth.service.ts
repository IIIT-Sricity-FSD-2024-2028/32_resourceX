import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { DataService } from '../data/data.service';
import { LoginDto } from './dto/login.dto';

@Injectable()
export class AuthService {
  constructor(
    private dataService: DataService,
    private jwtService: JwtService
  ) {}

  async signIn(loginDto: LoginDto) {
    const user = this.dataService.getUserByEmail(loginDto.email);
    if (user?.password !== loginDto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === 'Inactive') {
      throw new UnauthorizedException('Your account has been deactivated. Please contact your administrator.');
    }

    if (user.status === 'Suspended') {
      throw new UnauthorizedException('Your account has been suspended. Please contact your administrator.');
    }
    
    // In our new multi-tenant architecture, the owner and employees might be scoped to 'PLATFORM'
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role, 
      organizationId: user.organizationId 
    };
    
    return {
      access_token: await this.jwtService.signAsync(payload),
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        department: user.department,
        organizationId: user.organizationId
      }
    };
  }
}
