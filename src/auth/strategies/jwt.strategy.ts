import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Strategy, ExtractJwt } from "passport-jwt";
import { Request as RequestType } from 'express';
import { ConfigService } from "@nestjs/config";
import { JwtPayload } from "../interfaces/jwt-payload.interface";
import { UserService } from "../../user/user.service";



@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {


  constructor(
    private readonly usersService: UserService,
    private readonly configService: ConfigService
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        JwtStrategy.extractJwt,
        ExtractJwt.fromAuthHeaderAsBearerToken()
      ]),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('JWT_SECRET') || 'secret'
    })
  }

  private static extractJwt(req: RequestType): string | null {

    if (req.cookies && 'user_token' in req.cookies && req.cookies.user_token.length > 0) {

      return req.cookies.user_token;
    }

    return null;

  }

  async validate(payload: JwtPayload) {
    const { sub } = payload
    

    const user = await this.usersService.findById(sub)

    if (!user) {
      throw new UnauthorizedException('Token not valid')
    }

    const { password: _, ...rest } = user
    
    return rest

  }

}