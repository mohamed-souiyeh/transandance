import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import SignUp from "./pages/login";
import NotFound from "./pages/not_found";
import Home from "./pages/home";
import Profile from "./pages/profile";
import UserProfile from "./pages/user";
import Game from "./pages/game/game";
import LandingPage from "./pages/landingpage";
import Setup from "./pages/userSetup";
import RequireAuth from "./pages/components/requireAuth";
import React, { useContext, useEffect, useState } from "react";
import { createContext } from "react";
import TwoFAConfirmation from "./pages/twofaconfirm";
import Loading from "./pages/loading";
import Cookies from 'js-cookie';
import Chat from "./pages/chat";
import { eventBus } from "./eventBus";
import { DmProvider } from "./contexts/chatContext";
import { setupSocket } from "./pages/setupSocket";
import { ChannelProvider } from "./contexts/channelContext";
import ManageGoups from "./pages/manageGoups";
import BotMode from "./pages/game/botmode";
import { toast } from "react-toastify";
import { ToastContainer } from "react-toastify";
import 'react-toastify/dist/ReactToastify.css';
import './Toasts.css';
import { PwdPopupProvider } from "./contexts/pwdPopupContext";
import { AddFriendsPopupProvider } from "./contexts/addFriendsPopupContext";
import { ProtectedRoomProvider } from "./contexts/ProtectedRoomContext";
import Search from "./pages/search";
import { useAvatarContext } from "./contexts/avatar";
import NotFoundPage from "./pages/notfoundpage";
import axios from "axios";
import { NotificationProvider, useNotificationContext } from "./contexts/notificationContext";
import { interceptorData } from "./main";
//TODO - channel doesnt send msgs and the users dont get added in the channel creation

function GameInviteToast({ msg, joinGame, declineGame }: { msg: string, joinGame?: any, declineGame?: any }) {
  let [acceptedInvite, setInviteState] = useState(false);

  return (
    <div>
      <h3>{msg}</h3>
      <button style={{
        backgroundColor: "purple",
        marginRight: "10px",
        cursor: "pointer",
        pointerEvents: "auto"
      }}
        onClick={() => {
          if (joinGame) {
            setInviteState(true);
            joinGame();
          }
        }}
      >
        Accept
      </button>
      <button style={{
        backgroundColor: "purple",
        cursor: "pointer",
        pointerEvents: "auto"
      }}
        onClick={() => {
          if (declineGame) {
            declineGame();
          }
        }}
      >
        Decline</button>
    </div>
  );
}

export const UserContext = createContext({
  user: {
    data: {},
    chat: {},
    chatException: {},
    requests: {},
    ping: {},
    game_socket: {},
    // avatar: {},
  }, setUser: React.Dispatch<React.SetStateAction<boolean>>
});

function KickTheBastard() {
  const navigate = useNavigate();
  const { user, setUser } = useContext(UserContext);

  useEffect(() => {

    const kick = () => {
      if (typeof user.chat?.disconnect === 'function')
        user.chat.disconnect();
      if (typeof user.ping?.disconnect === 'function')
        user.ping.disconnect();
      if (typeof user.game_socket?.disconnect === 'function')
        user.game_socket.disconnect();

      setUser({ data: {} });
      Cookies.remove('user');
      navigate('/login');
    };

    eventBus.on('unauthorized', kick);

    return () => {
      eventBus.off('unauthorized', kick);
    };
  }, []);

  return null;
}

function SetupSockets() {
  const { user, setUser } = useContext(UserContext);
  const navigate = useNavigate();



  useEffect(() => {

    console.log("the user context is in setup sockets :", user);

    const game_socket = setupSocket(`${process.env.REACT_URL}:1337/game`);

    game_socket.on("inviteAccepted", () => {
      navigate("/game");
    })

    const handleJoinPrivate = (roomID) => {
      game_socket.emit('acceptPlayingInvite', roomID);
    }

    const handleDeclinePrivate = (roomID) => {
      game_socket.emit('declinePlayingInvite', roomID);
    }

    //---------------------------------------------------------------------------
    const chat_socket = setupSocket(`${process.env.REACT_URL}:1337/chat`);

    chat_socket.on("exception", (err) => {
      // Handle the error here
      console.log("in the chat exception");
      setUser(prevUser => ({
        ...prevUser,
        chatException: err,
      }));
    });


    const ping_socket = setupSocket(`${process.env.REACT_URL}:1337`);

    ping_socket.on("exception", (err) => {
      console.log("in the ping exception");
      // Handle the error here
      setUser(prevUser => ({
        ...prevUser,
        chatException: err,
      }));
      // console.log(err); // Prints the error message
    });

    const setIntervalId = setInterval(() => {
      ping_socket.emit('ping');
    }, 0.5 * 60 * 1000);


    //TODO - this maybe broken it need testing because the notification event is sent from the main gateway not the chat gateway
    ping_socket.on("notification", (msg) => {
      console.log("notification msg is :", msg);
      //TODO - here we need to create the logic to start the notification logic
      //TODO - mark the network icon in the sidebar with a small red dot
      //TODO - and send a toastify notification
      toast(`${msg.from} sent u a friend request`, {
        pauseOnHover: false,
        pauseOnFocusLoss: false
      });

      axios.get(`${process.env.REACT_URL}:1337/users/allforhome`, {
        withCredentials: true
      })
        .then((resp) => {
          setUser(prevUser => ({ ...prevUser, data: resp.data }))
          Cookies.remove('user')
          Cookies.set('user', JSON.stringify(resp.data), { sameSite: 'lax' });
        })
        .catch(() => {
          navigate("/login")
        })

    });

    ping_socket.on('reconnect', () => {
      console.log("reconnected");
      chat_socket.disconnect();
      chat_socket.connect();
    })
    ping_socket.on('private', (roomID: number, username: string) => {
      const message = username + " Invited you to a game !";
      toast(<GameInviteToast msg={message} joinGame={() => handleJoinPrivate(roomID)}
        declineGame={() => handleDeclinePrivate(roomID)} />
        , {
          pauseOnHover: false,
          pauseOnFocusLoss: false
        });
    });

    setUser(prevUser => ({
      ...prevUser,
      ping: ping_socket,
      chat: chat_socket,
      game_socket: game_socket
    }));

    // console.log("the user context is in setup sockets :", user);
    return () => {
      // ping_socket.disconnect();
      ping_socket.off();
      // chat_socket.disconnect();
      chat_socket.off();
      // game_socket.disconnect();
      game_socket.off();
      console.log("sockets disconnected");
      clearInterval(setIntervalId);
    };
  }, []);

  return null;
}

function App() {

  // interface User {
  //   id: number;
  //   name: string;
  //   authed: boolean;
  // }

  const [user, setUser] = useState({
    data: {},
    chat: {},
    chatException: {},
    requests: {},
  });

  const { setAvatar } = useAvatarContext()
  const { setNotification } = useNotificationContext()
  //-----------------We are relying on cookies to save sessions, we should later rm the cookie in loggout, and also make sure we are not storing sensitive stuff


  // useEffect(() => {
  //   console.log("the user context is in app :", user);
  // }, [user]);

  // const navigate = useNavigate();
  useEffect(() => {

    interceptorData.isRefreshing = false;

    const userData = Cookies.get('user');


    if (userData) {
      //prevUser => ({...prevUser, data: resp.data})
      // console.log("we are in the app useeffect and we have the user data");
      setUser(prevUser => ({ ...prevUser, data: JSON.parse(userData) }));
    }

    const intervalId = setInterval(() => {
      axios.get(`${process.env.REACT_URL}:1337/auth/hello`, {
        withCredentials: true
      }).then(() => {
      }).catch(() => {
      });
    }, 1000 * 60);

    const userAvatar = localStorage.getItem('avatar')
    if (userAvatar) {
      setAvatar(userAvatar)
    }

    return () => {
      clearInterval(intervalId);
    };

  }, []);

  useEffect(() => {
    if (user.data && user.data.friendRequests) {
      setNotification(true)
      console.log('user have a new fr req')
    }
  }, [user.data.friendRequests])

  return (
    <>
      <UserContext.Provider value={{ user, setUser }}>
        <BrowserRouter>
          <KickTheBastard />
          <DmProvider>
            <ChannelProvider>
              <PwdPopupProvider >
                <AddFriendsPopupProvider>
                  <ProtectedRoomProvider >
                    <ToastContainer />
                    <Routes>
                      {/* Public Routes */}
                      <Route path="/" element={<LandingPage />} />
                      <Route path="/login" element={<SignUp />} />
                      <Route path="/loading" element={<Loading />} />
                      <Route path="*" element={<NotFound />} />
                      <Route path="/2fa" element={<TwoFAConfirmation />} />
                      {/* Private Routes */}
                      <Route element={
                        <>
                          <RequireAuth />
                          <SetupSockets />
                        </>
                      }>
                        <Route path="/home" element={<Home />} />
                        <Route path="/chat" element={<Chat />} />
                        <Route path="/:username" element={<UserProfile />} />
                        <Route path="/not-found" element={<NotFoundPage />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/setup" element={<Setup />} />
                        <Route path="/profile" element={<Profile />} />
                        <Route path="/:username" element={<UserProfile />} />
                        <Route path="/groups" element={<ManageGoups />} />
                        <Route path="/search" element={<Search />} />
                        <Route path="/not-found" element={<NotFoundPage />} />
                        <Route path="/game" element={<Game />} />
                        <Route path="/bot" element={<BotMode />} />
                      </Route>
                    </Routes>
                  </ProtectedRoomProvider>
                </AddFriendsPopupProvider>
              </PwdPopupProvider >
            </ChannelProvider>
          </DmProvider>
        </BrowserRouter>
      </UserContext.Provider>

    </>
  )
}
export default App
