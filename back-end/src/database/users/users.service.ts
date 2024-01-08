/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserDto } from './User_DTO/User.dto';
import * as crypto from 'crypto';
import { MemoryStoredFile } from 'nestjs-form-data';
import { Prisma, UserStatus, UserState, user, ChannelType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';



//FIXME - dont forget to handle the error thrown by the postgresql database
//LINK - https://www.postgresql.org/docs/9.3/errcodes-appendix.html

@Injectable()
export class UsersService {

  constructor(private readonly prismaService: PrismaService) { }

  private readonly reservedUsernames: string[] = [
    "SEGV",
    "HMMD",
    "Barbarousa",
    "barbarousa",
  ];

  //SECTION - CREATE OPERATIONS

  async createFriendship(userId: number, friendId: number): Promise<any> {
    const user = await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        friends: {
          connect: {
            id: friendId,
          }
        }
      }
    });

    await this.prismaService.user.update({
      where: {
        id: friendId,
      },
      data: {
        friends: {
          connect: {
            id: userId,
          }
        }
      }
    });

    return user;
  }

  async addUser(user: UserDto): Promise<any> {

    user.username = user.email.split('.')[0];
    const db_user = await this.prismaService.user.create({
      data: {
        username: user.username,
        email: user.email,
        avatar: user.avatar,
        status: user.status,
        provider: user.provider,
      }
    });
    return db_user;
  }
  //!SECTION


  //SECTION - READ OPERATIONS


  async getNetworkData(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        blockedUsers: {
          select: {
            id: true,
            username: true,
          }
        },
        friends: {
          select: {
            id: true,
            username: true,
          }
        },
        receivedNotifications: {
          include: {
            sender: {
              select: {
                id: true,
                username: true,
              }
            },
            receiver: {
              select: {
                id: true,
                username: true,
              }
            },
          },
        },
      }
    });

    if (user === null) null;

    return {
      blockedUsers: user.blockedUsers,
      friends: user.friends,
      friendRequests: user.receivedNotifications,
    };
  }

  async getUserFriends(userId: number): Promise<any> {
    const friends = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        friends: true,
      }
    });

    if (friends === null) null;

    return friends;
  }

  async getUserConvs(userId: number): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        channels: true,
        dms: true,
      }
    });

    if (user === null) null;

    return user;
  }


  async getUserDataForHome(userId: number) {


    const userRelations = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      include: {
        channels: true,
        dms: true,
      }
    });

    const userData = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        score: true,
        matchesPlayed: true,
        email: true,
        isProfileSetup: true,
        isAuthenticated: true,
        TFAisEnabled: true,
        friendRequests: true,
      }
    });

    if (userData === null) null;

    const user = {
      ...userData,
      channels: userRelations.channels,
      dms: userRelations.dms,
    };

    return user;
  }

  async whoami(userId: number) {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: userId,
      },
      select: {
        id: true,
        username: true,
        email: true,
        TFAisEnabled: true,
        isProfileSetup: true,
        isAuthenticated: true,
      }
    });

    if (user === null) null;

    return user;
  }

  async getStatus(id: number): Promise<any> {
    const user = await this.prismaService.user.findUnique({
      where: {
        id: id,
      },
      select: {
        status: true,
      }
    });

    if (user === null) null;

    return user.status;
  }

  async findUserByUsername(username: string): Promise<any> {
    const db_user = await this.prismaService.user.findUnique({
      where: {
        username: username,
      }
    });

    if (!db_user) return null;

    return db_user;
  }

  async findUserByEmail(email: string): Promise<any> {
    const db_user = await this.prismaService.user.findUnique({
      where: {
        email: email,
      }
    });

    if (!db_user) return null;

    return db_user;
  }

  async findUserById(id: number): Promise<any> {
    const db_user = await this.prismaService.user.findUnique({
      where: {
        id: id,
      }
    });

    if (!db_user) return null;

    return db_user;
  }
  //!SECTION


  //SECTION - UPDATE OPERATIONS

  async blockUser(userId: number, blockedUserId: number): Promise<any> {
    const user = await this.prismaService.user.update({
      where: {
        id: userId,
      },
      data: {
        blockedUsers: {
          connect: {
            id: blockedUserId,
          }
        }
      }
    });

    return user;
  }


  async setScore(id: number, score: number): Promise<any> {
    const user = await this.prismaService.user.update({
      where: {
        id: id,
      },
      data: {
        score: score,
      }
    });

    return user;
  }

  async setProfileSetup(id: number, state: boolean): Promise<any> {
    const user = await this.prismaService.user.update({
      where: {
        id: id,
      },
      data: {
        isProfileSetup: state,
      }
    });

    return user;
  }

  async setAuthenticated(id: number, state: boolean): Promise<any> {
    const user = await this.prismaService.user.update({
      where: {
        id: id,
      },
      data: {
        isAuthenticated: state,
      }
    });

    return user;
  }

  async setBusyStatus(id: number): Promise<any> {
    const user = await this.prismaService.user.update({
      where: {
        id: id,
      },
      data: {
        status: UserStatus.busy,
      }
    });

    return user;
  }

  async setOnlineStatus(id: number): Promise<any> {
    const user = await this.prismaService.user.update({
      where: {
        id: id,
      },
      data: {
        status: UserStatus.online,
      }
    });

    return user;
  }

  async setOfflineStatus(id: number): Promise<any> {
    const user = await this.prismaService.user.update({
      where: {
        id: id,
      },
      data: {
        status: UserStatus.offline,
      }
    });

    return user;
  }

  async turnOff2FA(id: number) {
    const user = await this.prismaService.user.update({
      where: {
        id: id,
      },
      data: {
        TFAisEnabled: false,
      }
    });
    return user;
  }

  async turnOn2FA(id: number) {
    const user = await this.prismaService.user.update({
      where: {
        id: id,
      },
      data: {
        TFAisEnabled: true,
      }
    });
    return user;
  }

  async set2FAscret(email: string, secret: string): Promise<any> {
    const user = await this.prismaService.user.update({
      where: {
        email: email,
      },
      data: {
        TFASecret: secret,
      }
    });

    if (!user) return null;
    return user;
  }

  async updateAvatar(id: number, avatar: any): Promise<any> {
    const user = await this.prismaService.user.update({
      where: {
        id: id,
      },
      data: {
        avatar: avatar.path,
      }
    });

    return user;
  }

  async replaceRefreshToken(id: number, refreshToken: string | null): Promise<any> {
    const user = await this.prismaService.user.update({
      where: {
        id: id,
      },
      data: {
        activeRefreshToken: refreshToken,
      }
    });

    return user;
  }

  async updateUserUsername(id: number, username: string): Promise<any> {
    await this.checkIfUsernamUnique(username);

    const user = await this.prismaService.user.update({
      where: {
        id: id,
      },
      data: {
        username: username,
      }
    });

    return user;
  }
  //!SECTION





  //SECTION - VALIDATION OPERATIONS

  async checkIfUsernamUnique(username: string): Promise<any> {
    await this.checkUsername(username);
    const isUnique = await this.findUserByUsername(username);
    const isReserved = this.reservedUsernames.includes(username, 0);


    if (isUnique === null && !isReserved) return {
      "message": "Username is unique"
    };

    throw new ConflictException('Username already taken');
  }

  async checkUsername(username: string): Promise<any> {
    const error_msg: string = 'Username must be between 5 and 13 characters long, and contain only letters and numbers and underscores';


    const regex: RegExp = /^[a-zA-Z0-9_]{5,13}$/;


    if (!regex.test(username)) throw new ConflictException(error_msg);
  }

  async validatRefreshToken(id: number, refreshToken: string): Promise<any> {
    const user = await this.findUserById(id);

    if (user === null)
      throw new NotFoundException('User not found');

    if (user.activeRefreshToken !== refreshToken) return null;

    return user;
  }
  //!SECTION




  //! Jojo's section
  async searchUsersByUsernamePrefix(prefix: string): Promise<UserDto[]> {
    const users = await this.prismaService.user.findMany({
      where: {
        username: {
          startsWith: prefix,
        },
      },
    });

    // Mapper les utilisateurs à UserDto
    return users.map(user => new UserDto(user));
  }

  // !
}
