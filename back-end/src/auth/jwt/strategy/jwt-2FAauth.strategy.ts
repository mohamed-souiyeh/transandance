
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
// import { config } from 'dotenv';
import { Request } from 'express';
import { UsersService } from 'src/users/users.service';
import { UserDto } from 'src/users/User_DTO/User.dto';
import { JwtPayload } from '../JwtPayloadDto/JwtPayloadDto';


// config({
//   encoding: 'latin1',
//   debug: false,
//   override: false,
// });

@Injectable()
export class Jwt2FAStrategy extends PassportStrategy(Strategy, '2FAauth') {
  constructor(private userService: UsersService) {
    const extractJwtFromCookie = (req) => {
      let token = null;

      console.log('jwt2FA strategy req.cookies =>', req.cookies);
      if (req && req.cookies) {
        token = req.cookies[process.env.ACCESS_TOKEN_KEY];
      }
      return token;
    };

    super({
      jwtFromRequest: extractJwtFromCookie,
      secretOrKey: process.env['JWT_SECRET'],
      passReqToCallback: true,
      ignoreExpiration: false,
    });
  }

  async validate(req: Request, payload: JwtPayload) {
    console.log('jwt2FA strategy payload =>', payload);
    const refreshTokenIsValid = await this.userService.validatRefreshToken(payload.id, req.cookies[process.env.REFRESH_TOKEN_KEY])
    
    //NOTE - check if refresh token is valid
    if (!refreshTokenIsValid) {
      console.log('refresh token is not valid');
      await this.userService.replaceRefreshToken(payload.id, null);
      throw new UnauthorizedException();
    } 

    const user: UserDto = {
      id: payload.id,
      provider: null,
      username: null,
      profilePicture: null,
      email: payload.email,
      activeRefreshToken: req.cookies[process.env.REFRESH_TOKEN_KEY],
      redirectUrl: null,
      TFAisenabled: payload.TFAisenabled,
      TFAsecret: null,
    };

    return user;
  }
}