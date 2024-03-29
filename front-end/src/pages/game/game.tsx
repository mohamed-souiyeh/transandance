import { useRef, useEffect, useState, useContext } from 'react';
import Profile from "../components/userProfileIcone";
import { Cube } from './cube';
import quitButton from './exitGame.png';
import './spinner.css';
import { useNavigate } from 'react-router-dom';
import { UserContext } from '../../App';

function rad2Degree(angle: number): number {
  return angle * 180 / Math.PI;
}

let gl: WebGLRenderingContext | null;

function Game() {
  //================================================================
  const canvasRef = useRef<HTMLCanvasElement>(null);
  let [avatar1, setAvatar1] = useState('');
  let [avatar2, setAvatar2] = useState('');
  let [score1, setScore1] = useState(0);
  let [score2, setScore2] = useState(0);
  let [fetchedAvatars, setFetchState] = useState(false);
  let [gameState, setState] = useState(false);
  let [win, setWinState] = useState(true);
  let [foundMatch, setMatchState] = useState(false);
  let navigate = useNavigate();
  const frameRef = useRef<number>(0);

  const socket = useContext(UserContext).user.game_socket;

  const leaveGame = () => {
    if (socket)
      socket.emit("leaveRoom")
    navigate("/home");
  }

  useEffect(() => {
    socket.emit("queuing");
    console.log("Game page socket ", socket);
    const handleWinner = (v: boolean) => { setWinState(v); };
    const handleLeaveGame = () => { navigate("/home"); };
    const handleAlreadyPlaying = () => { navigate("/home"); };
    const handleAlreadyQueuing = () => { navigate("/home"); };
    const handleGameOver = () => {
      if (!gameState) {
        setState(true);
        socket.emit("gameOver");
      }
    };

    if (socket)
    {
      console.log("Game page socket ");
      socket.on("inviteAccepted", () => {
        console.log("inviteAccepted");
        console.log("Game state ", gameState);
        setState(false);
      }
      );
      socket.on("winner", handleWinner);
      socket.on("leaveGame", handleLeaveGame);
      socket.on("alreadyPlaying", handleAlreadyPlaying);
      socket.on("alreadyQueuing", handleAlreadyQueuing);
      socket.on("gameover", handleGameOver);
    }
    if (canvasRef.current) {
      gl = canvasRef.current.getContext("webgl");

      if (gl) {
        gl.canvas.width = 900;
        gl.canvas.height = 600;
        frameRef.current =
          requestAnimationFrame(() => renderGame(gl));
      }
    }
    if (!gl) {
      return;
    }
    let w = 0, h = 0;
    if (gl) {
      w = gl.canvas.width;
      h = gl.canvas.height;
    }

    let terrain: Cube = new Cube(gl, 9.8, 7, 1);
    let first: Cube = new Cube(gl, 0.18, 1, 0.3);
    let second: Cube = new Cube(gl, 0.18, 1, 0.3);
    let ball: Cube = new Cube(gl, 0.2, 0.2, 0.5);

    first.vector3D.x = 0.97;
    first.vector3D.y = 0.0;
    first.vector3D.z = -0.02;
    first.velocityy = 0.0;
    first.speed = 0.01;

    second.vector3D.x = -0.97;
    second.vector3D.y = 0.0;
    second.vector3D.z = -0.02;
    second.velocityy = 0.0;
    second.speed = 0.01;

    ball.vector3D.x = first.vector3D.x - 0.05;
    ball.vector3D.y = first.vector3D.y;
    ball.vector3D.z = -0.02;
    ball.speed = 0.009;
    ball.prevPositions.x = first.vector3D.x + 0.5;
    ball.prevPositions.y = first.vector3D.y + 0.5;
    ball.prevPositions.z = -0.01;

    const handleKeyDown = (e: KeyboardEvent) => { 
      if (e.code == 'Space') {
      if (!ballLaunched) {
        ballLaunched = true;
      }
      if (socket)
        socket.emit('balllaunch', ballLaunched);
    }
    if (e.code == 'KeyW') {
      if (socket) {
        socket.emit('right', 1);
        socket.emit('left', 1);

      }
    }
    if (e.code == 'KeyS') {
      if (socket) {
        socket.emit('right', -1);
        socket.emit('left', -1);
      }
    }}

    document.addEventListener('keydown', handleKeyDown)

    const handleKeyUp = (e) => {
      if (e.code == 'KeyW') {
        if (socket) {
          socket.emit('right', 0);
          socket.emit('left', 0);
        }
      }
      if (e.code == 'KeyS') {
        if (socket) {
          socket.emit('right', 0);
          socket.emit('left', 0);
        }
      }
    }

    document.addEventListener('keyup', handleKeyUp);

    let ballLaunched: boolean = false;

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
    {
      socket.on('matchFound', (v:boolean)=>{foundMatch =v; setMatchState(v);});
      if(!fetchedAvatars)
      {
        socket.on('userIDs', (user1:number, user2:number)=>
        {
            setAvatar1(`${process.env.REACT_URL}:1337/users/${user1}/avatar`);
            setAvatar2(`${process.env.REACT_URL}:1337/users/${user2}/avatar`);
          })
        }
        fetchedAvatars = true;
        setFetchState(true);
    }
    if (socket)
    {
      
        socket.emit('playing');
        socket.on('score', (v:number, v1:number) => {
          score1 = v;
          score2 = v1;
          setScore1((score1));
          setScore2((score2));
        });
        socket.on('left', (v:number)=>{first.vector3D.y = v;});
        socket.on('right', (v:number)=>{second.vector3D.y = v;});
        socket.on('ballPosX', (v:number)=>{ball.vector3D.x = v;});
        socket.on('ballPosY', (v:number)=>{ball.vector3D.y = v;});
        socket.on('balllaunched', (v:boolean)=>{ballLaunched=v;});
        socket.on("gameStart", ()=>{gameState = false; setState(false)});
    }
    function renderGame(gl: WebGLRenderingContext | null)
    {

    if (foundMatch)
    {

        if (gl) {
          gl.clearColor(0.282, 0.17, 0.37, 1.0);
          gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
          gl.enable(gl.DEPTH_TEST);

          terrain.renderEntity(gl, 36);
          terrain.setColor(gl, [0.41, 0.26, 0.5]);
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

    const handle = () => {
      if (gl) {
        gl.canvas.width = 900;
        gl.canvas.height = 600;
      }
    };

    window.addEventListener("resize", handle);
    return () => {
      cancelAnimationFrame(frameRef.current);
      window.removeEventListener("resize", handle);
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('keyup', handleKeyUp);
      socket.off("winner", handleWinner);
      socket.off("leaveGame", handleLeaveGame);
      socket.off("alreadyPlaying", handleAlreadyPlaying);
      socket.off("alreadyQueuing", handleAlreadyQueuing);
      socket.off("gameover", handleGameOver);
      socket.emit("leaveRoom");
    }
  },
  [socket]);

  return (<>
    <div 
      style={{ backgroundColor: 'rgba(71, 43, 94, 1.0)'}}
      className="w-screen h-screen grid justify-center ">

      <div style={{
        textAlign: "center",
        font: "status-bar",
        height: "100%"
      }}>
        {<Profile score={score1}
          score2={score2}
          pic1={avatar1}
          pic2={avatar2}
        />}
        <canvas style={{
          right: "300px",
          width: "100%",
          height: "100%"
        }}
          ref={canvasRef}
        />
      </div>
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        pointerEvents: "none"
      }}>
        {/* <h1>GO !</h1> */}
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
                left: "28%"
              }}>GAME OVER</h1>

              {win && (<h1 style={{
                position: "absolute",
                top: "20%",
                left: "43%",
                fontSize: "25px"
              }}>YOU WIN</h1>)}

              {!win && (<h1 style={{
                position: "absolute",
                top: "20%",
                left: "42%",
                fontSize: "25px"
              }}>YOU LOSE</h1>)}

              <h1 style={{
                position: "absolute",
                top: "40%",
                left: "30%",
                fontSize: "90px"
              }}>{score1}</h1>
              <h1 style={{
                position: "absolute",
                top: "40%",
                left: "64%",
                fontSize: "90px"
              }}>{score2}</h1>
            </div>)
          }
          <div style={{ textAlign: "center", marginTop: "120px" }}>
            <button
              onClick={leaveGame}
              style={{ color: "white", background: "#DFA7FC", width: 60, height: 60, border: "none", padding: 0 }}>
              <img src={quitButton} style={{ width: "100%", height: "100%", objectFit: "cover" }} alt="Quit Button" />
            </button>
          </div>
    </div>

  </>
  );
}

export default Game;
