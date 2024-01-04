import React , {useRef, useEffect, useState} from 'react';
import ReactDOM from 'react-dom/client';
import axios from 'axios';
import Profile from "../components/userProfileIcone";
import {io} from 'socket.io-client';
import {Cube} from './cube';
import quitButton from './exitGame.png';
import { useMode, useSocket } from '../../clientSocket';
import botPic from '../../assets/bot.png'
import pic from '../../assets/taha.jpg'
import './spinner.css';
import { useNavigate } from 'react-router-dom';

function rad2Degree(angle:number) : number
{
	return angle * 180/Math.PI;
}

let gl:WebGLRenderingContext | null;

function Game() 
{
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const reff = useRef<Cube | null>(null);
  let [score1, setScore1] = useState(0);
  let [score2, setScore2] = useState(0);
  let [leftPic, setLeftPic] = useState(pic);
  let [gameState, setState] = useState(false);
  let [win, setWinState] = useState(true);
  let [profileImage, setImage] = useState('');
  let [foundMatch, setMatchState] = useState(false);
  let navigate = useNavigate();
  const frameRef = useRef<number>(0);
  let gameMode = useMode();
  let formdata = new FormData();
  console.log(gameState);
  
  const socket = useSocket("game");

  const leaveGame = () => {
    if (socket)
    socket.emit("leaveRoom")
  }
  
  console.log(gameMode.mode);
  
  // socket.emit(gameMode.mode);
  useEffect(() => 
  {
  {
    if (socket && gameMode.mode)
    {
        socket.emit(gameMode.mode);
        socket.on("winner", (v:boolean)=>{setWinState(v);});
        socket.on("botGame", ()=>{
          setLeftPic(botPic);
        })
        socket.on("leaveGame", ()=>{
          navigate("/home");
        })
        socket.on("alreadyPlaying", ()=>{
          navigate("/home");
        });
        socket.on("alreadyQueuing", ()=>{
          navigate("/home");
        });
        socket.on("gameover", ()=>{
            if (!gameState)
            {
              socket.emit("gameOver");
              // navigate("/home");
              setState(true);
            }
          });
        }
      }
    if (canvasRef.current) 
    {
      gl = canvasRef.current.getContext("webgl");

      if (gl) 
      {
        gl.canvas.width = 900;
        gl.canvas.height = 600;
        frameRef.current = 
        requestAnimationFrame(() => renderGame(gl));
      }
    }
    if (!gl)
    {
      return;
    }
    let w = 0, h = 0;
    if (gl)
    {
        w = gl.canvas.width;
        h = gl.canvas.height;
    }

    let terrain:Cube = new Cube(gl, 9.8, 7, 1);
    let first:Cube = new Cube(gl, 0.18, 1, 0.3);
    let second:Cube = new Cube(gl, 0.18, 1, 0.3);
    let ball:Cube = new Cube(gl, 0.2, 0.2, 0.5);
    
    first.vector3D.x = 0.97;
    first.vector3D.y =  0.0;
    first.vector3D.z =  -0.02;
    first.velocityy =  0.0;
    first.speed =  0.01;

    second.vector3D.x = -0.97;
    second.vector3D.y = 0.0;
    second.vector3D.z = -0.02;
    second.velocityy = 0.0;
    second.speed =  0.01;

    ball.vector3D.x =  first.vector3D.x - 0.05;
    ball.vector3D.y =  first.vector3D.y;
    ball.vector3D.z =  -0.02;
    ball.speed = 0.009;
    ball.prevPositions.x = first.vector3D.x + 0.5;
    ball.prevPositions.y = first.vector3D.y + 0.5;
    ball.prevPositions.z = -0.01;

    document.addEventListener('keydown', (e) => {
      if (e.code == 'Space')
      {
        if (!ballLaunched)
        {
              second.speed = 0.01;
              first.speed = 0.01;
              if (firstPlayerHasTheBall)
              {
                  ball.prevPositions.x = first.vector3D.x + 0.5;
                  ball.prevPositions.y = first.vector3D.y + 0.5;
              }
              if (secondPlayerHasTheBall)
              {
                  ball.prevPositions.x = second.vector3D.x - 0.5;
                  ball.prevPositions.y = second.vector3D.y - 0.5;
              }
              ball.velocityx =  ball.vector3D.x - ball.prevPositions.x;
              ball.velocityy =  ball.vector3D.y - ball.prevPositions.y;
              ball.prevPositions.x = ball.vector3D.x + 0.5;
              ball.prevPositions.y = ball.vector3D.y + 0.5;
              ballLaunched = true;
              ball.speed = 0.009;
            }
            if (socket)
            socket.emit('balllaunch', ballLaunched);
        }
      if (e.code == 'KeyW')
      {
        if (socket)
        {
          socket.emit('right', 1);
          socket.emit('left', 1);

        }
      }
      if (e.code == 'KeyS')
      {
        if (socket)
        {
          socket.emit('right', -1);
          socket.emit('left', -1);
        }
      }
    })

    document.addEventListener('keyup', (e) => {
      if (e.code == 'KeyW')
      {
        if (socket)
        {
          socket.emit('right', 0);
          socket.emit('left', 0);
        }
      }
      if (e.code == 'KeyS')
      {
        if (socket)
        {
          socket.emit('right', 0);
          socket.emit('left', 0);
        }
      }
    })

    let firstPlayerHasTheBall:boolean = true;
    let secondPlayerHasTheBall:boolean = false;
    let ballLaunched:boolean = false;

    function renderGame(gl: WebGLRenderingContext | null)
    {
      let ar = w/h;
      let fov = rad2Degree(71.1);
      let n = 0.1;
      let f = 1000.0;
      let t = Math.tan(fov/2) * n;
      let r = t * ar;
      let len = f-n;
  
      let projection:number[] = 
      [
        2*n/r,  0.0,       0.0,  0.0,
        0.0, 2*n/t,         0.0,  0.0,
        0.0,  0.0,  -(f+n)/len, -1,
        0.0,  0.0, (-2*f*n)/len, 1.0
      ];

      let viewMatrix:number[] = 
      [
        1, 0, 0, 0,
        0, 1, 0, 0,
        0, 0,-3, 0,
        0, 0, 0, 1
      ];
      if (socket)
        socket.on('matchFound', (v:boolean)=>{foundMatch =v; setMatchState(v);});

    if (foundMatch)
    {
      setScore1((score1));
      setScore2((score2));
      if (socket)
      {
          socket.emit('playing');
          socket.on('score', (v:number, v1:number) => {
            score1 = v;
            score2 = v1;
          });
          socket.on('left', (v:number)=>{first.vector3D.y = v;});
          socket.on('right', (v:number)=>{second.vector3D.y = v;});
          socket.on('ballPosX', (v:number)=>{ball.vector3D.x = v;});
          socket.on('ballPosY', (v:number)=>{ball.vector3D.y = v;});
          socket.on('balllaunched', (v:boolean)=>{ballLaunched=v;});
        }
        
        if (gl)
        {
          gl.clearColor(0.282, 0.17, 0.37, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.enable(gl.DEPTH_TEST);
  
          terrain.renderEntity(gl, 36);
          terrain.setColor(gl, [0.41, 0.26,0.5]);
          terrain.rotateX(gl, rad2Degree(0.004));
          terrain.rotateY(gl, rad2Degree(0.0));
          terrain.setLightSource(gl, [0.0, 0.0, -0.6], [1.0, 1.0, 1.0]);
          terrain.set3DMatrices(gl, projection, viewMatrix);

          first.renderEntity(gl, 36);
          first.rotateX(gl, rad2Degree(0.004));
          first.rotateY(gl, rad2Degree(0.0));
          first.setColor(gl, [0.7, 0.6, 1.8]);
          first.setLightSource(gl, [0.0, 0.0, -0.1], [1.0, 1.0, 1.0]);
          first.set3DMatrices(gl, projection, viewMatrix);
          
          second.renderEntity(gl, 36);
          second.rotateX(gl, rad2Degree(0.004));
          second.rotateY(gl, rad2Degree(0.0));
          second.setColor(gl, [0.7, 0.6, 1.8]);
          second.setLightSource(gl, [0.0, 0.0, -0.1], [1.0, 1.0, 1.0]);
          second.set3DMatrices(gl, projection, viewMatrix);
  
          ball.renderEntity(gl, 36);
          ball.rotateX(gl, rad2Degree(0.004));
          ball.rotateY(gl, rad2Degree(0.0));
          ball.setColor(gl, [0.8, 0.1, 0.8]);
          ball.setLightSource(gl, [0.0, 0.0, -0.1], [1.0, 2.0, 1.0]);
          ball.set3DMatrices(gl, projection, viewMatrix);
        }
      }
    
      frameRef.current = requestAnimationFrame(() => renderGame(gl));
    }

    const handle = () =>
    {
      if (gl)
      {
        gl.canvas.width = 900;
        gl.canvas.height = 600;
      }
    };

    window.addEventListener("resize", handle);
    return () => {cancelAnimationFrame(frameRef.current);
    }
  }, [socket, gameMode.mode]);

  return (<>
          <div className="w-screen grid justify-center ">

          <div style={{textAlign:"center",
                      font:"status-bar",
                      height: "100%"}}>
          {/* <h1>{gameState}</h1>s */}
          {<Profile score = {score1}
                    score2= {score2}
                    pic1={leftPic}
                    pic2={leftPic}/>}
          <canvas style={{right:"300px",
                          width: "100%",
                          height: "100%"}} 
            ref={canvasRef}
          /></div>
          <div style={{ position: "absolute", 
              top: 0, 
              left: 0, 
              width: "100%", 
              height: "100%", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center",
              pointerEvents: "none" }}>
            {/* <h1>GO !</h1> */}
          </div>
          </div>
          {!foundMatch && (
            <div className="spinner">
              <div></div>
              <div></div>
              <div></div>
              <div></div>
              <div></div>
            </div>
          )} 
          {gameState &&
            (<div style={{ 
              position: "absolute", 
              top: "47%", 
              left: "50%", 
              width: "600px", 
              height: "400px", 
              backgroundColor: "rgba(128, 0, 129, 0.5)", 
              transform: "translate(-50%, -50%)",
              pointerEvents: "none",
              borderRadius: "20px",
              borderWidth: "5px",
              borderColor: "rgba(255, 0, 255, 0.5)",
            }}>

              <div className="lds-dual-ring"></div>
              <h1 style={{ 
              position: "absolute",
              left:"28%"}}>GAME OVER</h1>

              {win && (<h1 style={{ 
              position: "absolute",
              top:"20%",
              left:"43%",
              fontSize:"25px"}}>YOU WIN</h1>)}

              {!win && (<h1 style={{ 
              position: "absolute",
              top:"20%",
              left:"42%",
              fontSize:"25px"}}>YOU LOSE</h1>)}

              <h1 style={{ 
              position: "absolute",
              top:"40%",
              left:"30%",
              fontSize:"90px"}}>{score1}</h1>
              <h1 style={{ 
              position: "absolute",
              top:"40%",
              left:"64%",
              fontSize:"90px"}}>{score2}</h1>
            </div>)
          }
          <div style={{ textAlign: "center", marginTop: "120px" }}>
          <button 
              onClick={leaveGame}
              style={{ color: "white", background: "#DFA7FC", width: 60, height: 60, border: "none", padding: 0}}>
            <img src={quitButton} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Quit Button" />
          </button>
          </div>

          </>
          );
}

const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

export default Game