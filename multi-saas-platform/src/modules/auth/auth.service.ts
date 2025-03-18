import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../user/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    // This would be implemented with actual database calls
    const user = await this.userService.findByEmail(email);
    
    // For demo purposes only - actual implementation would check against stored password hash
    if (user && (await bcrypt.compare(password, user.password))) {
      // Remove password from response
      const { password, ...result } = user;
      return result;
    }
    
    return null;
  }

  async login(user: any) {
    const payload = { sub: user.id, email: user.email, tenantId: user.tenantId };
    return {
      accessToken: this.jwtService.sign(payload),
      user,
    };
  }
}