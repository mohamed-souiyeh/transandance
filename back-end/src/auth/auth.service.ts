/* eslint-disable @typescript-eslint/no-unused-vars */
import { HttpRedirectResponse, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtAuthService } from './jwt/jwt.service';
import { Response } from 'express';
import { UsersService } from 'src/users/users.service';
import { IRequestWithUser } from './Interfaces/IRequestWithUser';

@Injectable()
export class AuthService {
  constructor(
    private jwtAuthService: JwtAuthService,
    private userService: UsersService,
  ) {}

  hello(req) {
    return `hello world! from user ${req.user.email}\nof id ${req.user.id}.`;
  }

  async addTokenToCookie(res: Response, Token: string, key: string) {
    res.cookie(key, Token, {
      httpOnly: true,
      sameSite: 'strict',
      // secure: true,
    });
  }

  async refresh(req: IRequestWithUser) {
    if (!req.user) {
      return 'No user from refresh';
    }

    //NOTE - get user from db
    const user = await this.userService.findUserById(req.user.id);

    //NOTE - check if refresh token is valid
    //FIXME - uncomment it
    if (
      !user ||
      user.activeRefreshToken !== req.cookies[process.env.REFRESH_TOKEN_KEY]
    ) {
      if (user) await this.userService.replaceRefreshToken(user.id, null);
      throw new UnauthorizedException();
    }

    //NOTE - get signed tokens
    const accessToken = await this.jwtAuthService.getJwtAcessToken(user, true);
    const refreshToken = await this.jwtAuthService.getJwtRefreshToken(user, true);

    //NOTE - add tokens to cookies
    await this.addTokenToCookie(req.res, accessToken, process.env.ACCESS_TOKEN_KEY);
    await this.addTokenToCookie(
      req.res,
      refreshToken,
      process.env.REFRESH_TOKEN_KEY,
    );

    //NOTE - add refresh token to db
    await this.userService.replaceRefreshToken(user.id, refreshToken);

    return { message: 'refreshed tokens successfully'};
  }

  async googleLogin(req: IRequestWithUser) {
    if (!req.user) {
      return 'No user from google';
    }

    //NOTE - get signed tokens
    const accessToken = await this.jwtAuthService.getJwtAcessToken(req.user, false);
    const refreshToken = await this.jwtAuthService.getJwtRefreshToken(req.user, false);

    //NOTE - add tokens to cookies
    await this.addTokenToCookie(req.res, accessToken, process.env.ACCESS_TOKEN_KEY);
    await this.addTokenToCookie(
      req.res,
      refreshToken,
      process.env.REFRESH_TOKEN_KEY,
    );

    //NOTE - add refresh token to db
    await this.userService.replaceRefreshToken(req.user.id, refreshToken);

    //NOTE - redirect to home page
    const redirect: HttpRedirectResponse = {
      // use env vars here
      url: req.user.redirectUrl,
      statusCode: 302,
    };
    return redirect;
  }

  //FIXME - use req.res instead of res: Response because the latter puts
  // nestjs in express specific mode and prevents the serialization
  // interceptor from working properly
  //LINK - https://wanago.io/2020/06/08/api-nestjs-serializing-response-interceptors/
  async ftLogin(req: IRequestWithUser) {
    if (!req.user) {
      return 'No user from 42';
    }

    //NOTE - get signed tokens
    const accessToken = await this.jwtAuthService.getJwtAcessToken(req.user, false);
    const refreshToken = await this.jwtAuthService.getJwtRefreshToken(req.user, false);

    //NOTE - add tokens to cookies
    await this.addTokenToCookie(req.res, accessToken, process.env.ACCESS_TOKEN_KEY);
    await this.addTokenToCookie(
      req.res,
      refreshToken,
      process.env.REFRESH_TOKEN_KEY,
    );

    //NOTE - add refresh token to db
    await this.userService.replaceRefreshToken(req.user.id, refreshToken);

    //NOTE - redirect to home page
    const redirect: HttpRedirectResponse = {
      // use env vars here
      url: req.user.redirectUrl,
      statusCode: 302,
    };
    return redirect;
  }

  async logout(req: IRequestWithUser) {
    //reset cookies
    await this.addTokenToCookie(req.res, '', process.env.ACCESS_TOKEN_KEY);
    await this.addTokenToCookie(req.res, '', process.env.REFRESH_TOKEN_KEY);

    //reset refresh token in db
    await this.userService.replaceRefreshToken(req.user.id, null);

    //NOTE - redirect to login page
    const redirect: HttpRedirectResponse = {
      // use env vars here
      url: process.env.LOGIN_URL,
      statusCode: 302,
    };
    //FIXME - redirect to login page
    return redirect;
  }
}