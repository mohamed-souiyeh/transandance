import {
	OnModuleInit,
	Controller,
	Get
}
	from '@nestjs/common';
import {
	OnGatewayInit,
	OnGatewayConnection,
	OnGatewayDisconnect,
	SubscribeMessage,
	WebSocketGateway,
	WebSocketServer
}
	from "@nestjs/websockets";
import { Server, Socket } from 'socket.io';

class room {
	firstClient: Socket = null;
	secondClient: Socket = null;
	firstPaddlePos: number = 0;
	secondPaddlePos: number = 0;
	firstPaddleSpeed: number = 0.01;
	secondPaddleSpeed: number = 0.01;
	firstvelocity: number = 0;
	secondvelocity: number = 0;
	ballPosX: number = 0;
	ballPosY: number = 0;
	ballVelocityX: number = 0;
	ballVelocityY: number = 0;
	score1: number = 0;
	score2: number = 0;
	speed: number = 0.01;
	ballLaunched: boolean = false;
	firstPlayerHaveTheBall: boolean = true;
	secondPlayerHaveTheBall: boolean = false;
	foundMatch: boolean = false;
	roomsName: string = null;
};

let launchRight: boolean = true;

// Managing the sockets
@WebSocketGateway({ cors: '*:*' })
export class gameServer implements OnModuleInit {
	@WebSocketServer()
	server: Server;
	clientsList: Socket[] = new Array();

	clientCount: number = 0;
	roomid: number = 0;
	roomsList: room[] = new Array();
	fv: number = 0;
	sv: number = 0;

	onModuleInit() {
		let room_: room;
		room_ = new room();

		this.server.on('connection', (socket) => {
			if (this.clientCount == 0)
				room_.firstClient = socket;
			if (this.clientCount == 1)
				room_.secondClient = socket;
			this.clientCount++;
			this.clientCount %= 2;
			if (this.clientCount == 0) {
				room_.roomsName = 'room' + this.roomid;
				this.roomid++;
				room_.firstClient.join(room_.roomsName);
				room_.secondClient.join(room_.roomsName);
				room_.foundMatch = true;
				this.roomsList.push(room_);
				room_ = new room();
			}
		})
		setInterval(() => {
			// Game Logic
			for (var i: number = 0; i < this.roomsList.length; i++) {
				if (this.roomsList[i].firstPaddlePos + this.roomsList[i].firstPaddleSpeed * this.roomsList[i].firstvelocity < 7 / 10 - 1 / 10
					&& this.roomsList[i].firstPaddlePos + this.roomsList[i].firstPaddleSpeed * this.roomsList[i].firstvelocity > -7 / 10 + 1 / 10)
					this.roomsList[i].firstPaddlePos += this.roomsList[i].firstPaddleSpeed * this.roomsList[i].firstvelocity;
				if (this.roomsList[i].secondPaddlePos + this.roomsList[i].secondPaddleSpeed * this.roomsList[i].secondvelocity < 7 / 10 - 1 / 10
					&& this.roomsList[i].secondPaddlePos + this.roomsList[i].secondPaddleSpeed * this.roomsList[i].secondvelocity > -7 / 10 + 1 / 10)
					this.roomsList[i].secondPaddlePos += this.roomsList[i].secondPaddleSpeed * this.roomsList[i].secondvelocity;
				if (!this.roomsList[i].ballLaunched) {
					if (this.roomsList[i].firstPlayerHaveTheBall) {
						this.roomsList[i].ballPosX = 0.97 - 0.05;
						this.roomsList[i].ballPosY = this.roomsList[i].firstPaddlePos;
						this.roomsList[i].ballVelocityX = -1;
					}
					if (this.roomsList[i].secondPlayerHaveTheBall) {
						this.roomsList[i].ballPosX = -0.97 + 0.05;
						this.roomsList[i].ballPosY = this.roomsList[i].secondPaddlePos;
						this.roomsList[i].ballVelocityX = 1;
					}
				}
				else {
					if (this.roomsList[i].firstPlayerHaveTheBall)
						this.server.to("room" + i).emit('balllaunched', true);
					if (this.roomsList[i].secondPlayerHaveTheBall)
						this.server.to("room" + i).emit('balllaunched', true);

					if (this.roomsList[i].ballPosX + 0.2 / 10 >= 0.97 &&
						this.roomsList[i].ballPosY - 0.2 / 10 <= this.roomsList[i].firstPaddlePos + 1 / 10 &&
						this.roomsList[i].ballPosY + 0.2 / 10 >= this.roomsList[i].firstPaddlePos - 1 / 10) {
						console.log('collisiooooon');
						this.roomsList[i].ballVelocityX = -1;
					}
					if (this.roomsList[i].ballPosX - 0.2 / 10 <= -0.97 &&
						this.roomsList[i].ballPosY - 0.2 / 10 <= this.roomsList[i].secondPaddlePos + 1 / 10 &&
						this.roomsList[i].ballPosY + 0.2 / 10 >= this.roomsList[i].secondPaddlePos - 1 / 10) {
						console.log('collisiooooon');
						this.roomsList[i].ballPosX += 0.0001;
						this.roomsList[i].ballVelocityX = 1;
					}
					if (this.roomsList[i].ballPosX >= 1) {
						this.roomsList[i].score1++;
						this.roomsList[i].firstPlayerHaveTheBall = false;
						this.roomsList[i].secondPlayerHaveTheBall = true;
						this.roomsList[i].ballLaunched = false;
						this.roomsList[i].secondPaddleSpeed = 0.01;
						this.server.to("room" + i).emit('balllaunched', false);
					}
					if (this.roomsList[i].ballPosX <= -1) {
						this.roomsList[i].firstPlayerHaveTheBall = true;
						this.roomsList[i].secondPlayerHaveTheBall = false;
						this.roomsList[i].score2++;
						this.roomsList[i].ballLaunched = false;
						this.roomsList[i].secondPaddleSpeed = 0.01;
						this.server.to("room" + i).emit('balllaunched', false);
					}
					if (this.roomsList[i].ballPosY >= 7 / 10) {
						this.roomsList[i].ballPosY = 7 / 10;
						this.roomsList[i].ballVelocityY = -1;
					}
					if (this.roomsList[i].ballPosY <= -7 / 10) {
						this.roomsList[i].ballPosY = -7 / 10;
						this.roomsList[i].ballVelocityY = 1;
					}
				}
				if (this.roomsList[i].firstPaddlePos + this.roomsList[i].firstPaddleSpeed * this.roomsList[i].firstvelocity < 7 / 10 - 1 / 10
					&& this.roomsList[i].firstPaddlePos + this.roomsList[i].firstPaddleSpeed * this.roomsList[i].firstvelocity > -7 / 10 + 1 / 10)
					this.roomsList[i].firstPaddlePos += this.roomsList[i].firstPaddleSpeed * this.roomsList[i].firstvelocity;
				if (this.roomsList[i].secondPaddlePos + this.roomsList[i].secondPaddleSpeed * this.roomsList[i].secondvelocity < 7 / 10 - 1 / 10
					&& this.roomsList[i].secondPaddlePos + this.roomsList[i].secondPaddleSpeed * this.roomsList[i].secondvelocity > -7 / 10 + 1 / 10)
					this.roomsList[i].secondPaddlePos += this.roomsList[i].secondPaddleSpeed * this.roomsList[i].secondvelocity;

				this.roomsList[i].ballPosX += (this.roomsList[i].speed * this.roomsList[i].ballVelocityX);
				this.roomsList[i].ballPosY += (this.roomsList[i].speed * this.roomsList[i].ballVelocityY);

				this.server.to("room" + i).emit('ballPosX', (this.roomsList[i].ballPosX));
				this.server.to("room" + i).emit('ballPosY', (this.roomsList[i].ballPosY));
				this.server.to("room" + i).emit('score', this.roomsList[i].score1, this.roomsList[i].score2);
				this.server.to("room" + i).emit('left', this.roomsList[i].firstPaddlePos);
				this.server.to("room" + i).emit('right', this.roomsList[i].secondPaddlePos);
				this.server.to("room" + i).emit('matchFound', true);
				this.server.to("room" + i).emit('ballPosetion', this.roomsList[i].firstPlayerHaveTheBall, this.roomsList[i].secondPlayerHaveTheBall);
			}
		}, 1000 / 60);
	}
	@SubscribeMessage('left')
	leftMove(client: Socket, vel: number)
	{
		const room = this.roomsList.find(room => room.firstClient === client);
		if (room)
		{
			room.firstvelocity = vel;
		}
	}
	@SubscribeMessage('right')
	rightMove(client: Socket, vel: number)
	{
		const room = this.roomsList.find(room => room.secondClient === client);
		if (room)
		{
			room.secondvelocity = vel;
		}
	}
	@SubscribeMessage('balllaunch')
	ballLaunch(client: Socket, launched: boolean) 
	{
		const room = this.roomsList.find(room => room.firstClient === client 
				|| room.secondClient === client);
		if (room) {
			if (room.firstPlayerHaveTheBall && client == room.firstClient) {
				console.log("One");
				room.ballLaunched = launched;
			}
			if (room.secondPlayerHaveTheBall && client == room.secondClient) {
				console.log("Two");
				room.ballLaunched = launched;
			}
		}
	}
}
