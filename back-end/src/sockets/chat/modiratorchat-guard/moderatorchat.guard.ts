/* eslint-disable @typescript-eslint/no-explicit-any */
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { ChatService } from '../chat.service';
import { JwtAuthService } from 'src/auth/jwt/jwt.service';
import { ConversationsService } from 'src/database/conversations/conversations.service';
import Joi from 'joi';
import { WsException } from '@nestjs/websockets';
import { ChannelType, Role, UserState } from '@prisma/client';

@Injectable()
export class modiratorChatGuard implements CanActivate {

  constructor(private readonly chatService: ChatService,
              private readonly jwtAuthService: JwtAuthService,
              private readonly convService: ConversationsService) {}


  async validaGuardData(data: any) {
    const schema = Joi.object({
      convType: Joi.string().required().valid(ChannelType.private, ChannelType.protected, ChannelType.public),
      convId: Joi.number().required(),
      targetedUserId: Joi.number().required(),
      until: Joi.date().optional(),
    });

    const { error } = schema.validate(data);

    if (error) {
      throw new WsException(error.message);
    }

    data.convId = Number(data.convId);
    data.targetedUserId = Number(data.targetedUserId);
  }

  async canActivate(
    context: ExecutionContext,
  ): Promise<boolean> {
    const client = await context.switchToWs().getClient();

    const data = await context.switchToWs().getData();

    await this.validaGuardData(data)



    const { jwt } = await this.chatService.getTokensFromSocket(client);

    const payload = await this.jwtAuthService.decodetoken(jwt);

    const conv = await this.convService.getChannel(data.convId, payload.id);

    if (conv === null)
      throw new WsException({error: 'Unauthorized operation'
      , message: 'the channel doesnt exist'});
    
    const userState = conv.usersState.find(userState => userState.userId === payload.id);

    if (userState === undefined)
      throw new WsException({error: 'Unauthorized operation'
      , message: 'you are not in the channel'});

    const targetedUserState = conv.usersState.find(userState => userState.userId === data.targetedUserId);

    if (targetedUserState === undefined)
      throw new WsException({error: 'Unauthorized operation'
      , message: 'the targeted user is not in the channel'});
    // console.log("userState => ", userState);

    //NOTE - check if the user doesnt have required role for the operation
    if (userState.state !== UserState.active)
      throw new WsException({error: 'Unauthorized operation'
      , message: 'your state is not active'});
    
    if (userState.role === Role.user)
      throw new WsException({error: 'Unauthorized operation'
      , message: 'you dont have the required role for this operation'});

    if (userState.userId === data.targetedUserId)
      throw new WsException({error: 'Unauthorized operation'
      , message: 'are u dumb or what?, you cant perform this operation on yourself'});

    if (data.targetedUserId === conv.ownerId)
      throw new WsException({error: 'Unauthorized operation'
      , message: 'you cant perform this operation on the owner of the channel'});

    return true;
  }
}
