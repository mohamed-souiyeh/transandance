/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-google-oauth20';
import { UsersService } from 'src/database/users/users.service';
import { UserDto } from '../../database/users/User_DTO/User.dto';
import { UserStatus } from '@prisma/client';
import { join } from 'path';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(private readonly usersService: UsersService) {
    super({
      clientID: process.env['GOOGLE_CLIENT_ID'],
      clientSecret: process.env['GOOGLE_SECRET'],
      callbackURL: process.env['GOOGLE_REDIRECT_URI'],
      scope: ['email', 'profile'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: any,
  ): Promise<any> {
    //FIXME - look for the case of the profile returned by google is empty
    // const { id, name, emails } = profile;

    const cwd = process.cwd();
    const user: UserDto = {
      id: null,
      provider: 'google',
      username: profile._json.email.split('@')[0],
      score: 0,
      machesPlayed: 0,
      status: UserStatus.online,
      friendRequests: false,
      avatar: join(cwd, process.env.DEFAULT_AVATAR),
      email: profile._json.email,
      activeRefreshToken: null,
      redirectUrl: null,
      TFAisEnabled: false,
      isProfileSetup: false,
      TFASecret: null,
    };


    // console.log('google strategy user =>', user);
    let found_user: UserDto = await this.usersService.findUserByEmail(user.email);

    if (!found_user) {
      found_user = await this.usersService.addUser(user);

      // console.log('google strategy found user =>', found_user);
    }


    found_user.redirectUrl = process.env.LOADING_URL;

    if (found_user.TFAisEnabled) {
      //NOTE - if TFA is enabled, then we need to do something here
      //NOTE - that i still dont know
      found_user.redirectUrl = process.env.TFA_URL;
    }

    // console.log('google strategy found user =>', found_user);
    return found_user;
  }
}
