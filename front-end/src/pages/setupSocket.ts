import axios from "axios";
import { io } from "socket.io-client";
import { eventBus } from "../eventBus";

export function setupSocket(url: string) {
  const socket = io(url,
    {
      withCredentials: true,
      transports: ['websocket', 'polling'],
    });

  // console.log("this is the socket in home => ", socket)
  socket.on("401", (err) => {
    // Handle the error here
    console.log("this is the 401 socket event error : ", err);

    axios.get(`${process.env.REACT_URL}:1337/auth/hello`, {
      withCredentials: true
    }).then((res) => {
      // console.log("Token refreshed in socket!")
      console.log(res.data);
      socket.connect();
      //FIXME - this bastard is mostlikly is the root of the problem
    }).catch((err) => {
      console.log("Error while refreshing token in socket => ", err);
    })
    // console.log("this is the 401 socket event error : ", err); // Prints the error message
  });
  return socket;
}
