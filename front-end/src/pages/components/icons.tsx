import { useEffect, useRef, useState } from "react"
import { useNavigate } from "react-router-dom";
import { networkTabs } from "../chat.enums";
import { useContext } from "react";

import { Menu, MenuHandler, MenuList, MenuItem} from "@material-tailwind/react";
import { UserContext } from "../../App";


function Icons(props) {

  // const [state, setState] = useState(false)
  const menuRef = useRef(null);
  const navigate = useNavigate()
  const game_socket = useContext(UserContext).user.game_socket;

  let { user, unmount } = props;

  if (!user) {
    user = {id: 0, username: 'username'};
  }
  const username = user.username;


  // useEffect(() => {
  //   const handleClickOutside = (event: Event) => {
  //     if (menuRef.current && !menuRef.current.contains(event.target)) {
  //       // setState(false);
  //     }
  //   };
  //   document.addEventListener("mousedown", handleClickOutside);
  // }, [menuRef]);


  // const unfriend = () => {
  //   axios.post(`${process.env.REACT_URL}:1337/users/unfriend`, {id: user.id}, {
  //     withCredentials: true
  //   }).then((res) => {
  //     if (unmount) {
  //       unmount(networkTabs.FRIENDS);
  //     }
  //   }).catch((err) => {
  //   });

  // }

  const visitProfile = () => {
    navigate('/'+ username)
  }

  // const blocUser = () => {
  //   axios.post(`${process.env.REACT_URL}:1337/users/block`, {id: user.id}, {
  //     withCredentials: true
  //   }).then((res) => {
  //     if (unmount) {
  //       unmount(networkTabs.FRIENDS);
  //     }
  //   }).catch((err) => {
  //   });
  //   

  // }

  return (
    <div className="flex items-center">
      <div  title="Invite to a game" className="px-3 cursor-pointer" onClick={() =>  
      {
          if (game_socket)
            game_socket.emit("invite", user.id);
        }}>
        <svg xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 23 23" fill="none">
          <path d="M22.695 8.25738C22.4359 7.85385 22.016 7.51121 21.4857 7.27053C20.9554 7.02985 20.3372 6.90134 19.7052 6.90042H16.7317L18.9166 3.15155C19.1118 2.80732 19.1854 2.4352 19.131 2.06681C19.0767 1.69842 18.896 1.34466 18.6045 1.03562C18.2928 0.715464 17.8738 0.453697 17.384 0.273259C16.8943 0.0928214 16.3488 -0.000780465 15.7953 0.00065618H8.66559C7.99172 -0.0106117 7.32921 0.123475 6.76791 0.38473C6.20661 0.645985 5.77369 1.02177 5.52785 1.46111L0.221621 10.6608C0.0316072 11.0043 -0.0377284 11.3748 0.0194486 11.741C0.0766257 12.1073 0.258643 12.4585 0.55018 12.7652C0.861828 13.0854 1.28089 13.3471 1.77065 13.5276C2.26041 13.708 2.80591 13.8016 3.35936 13.8002H7.89347L4.92001 21.5509C4.82095 21.8039 4.84839 22.0729 4.9978 22.3135C5.1472 22.554 5.40957 22.7516 5.74141 22.8734C5.99759 22.9594 6.27873 23.0027 6.56281 22.9999C6.80009 22.9999 7.03457 22.9639 7.2501 22.8944C7.46563 22.825 7.6571 22.7236 7.81133 22.5974L22.2679 10.6723C22.6546 10.338 22.8996 9.93449 22.9751 9.50761C23.0506 9.08074 22.9536 8.64759 22.695 8.25738Z" fill="#8176AF"/>
        </svg>
      </div>

      <div  title="Visit Profile" className="px-3 cursor-pointer" onClick={() => {visitProfile()}}>
        <svg className="stroke-[0.5] stroke-[#8176AF]" xmlns="http://www.w3.org/2000/svg" width="23" height="23" viewBox="0 0 15 15" fill="none">
          <path d="M3.12466 0L11.8799 0.00140786C13.5498 0.00216164 14.9136 1.31228 15.0003 2.96086L15.0047 3.12681V6.87061C15.0047 7.21578 14.7248 7.49561 14.3797 7.49561C14.0632 7.49561 13.8017 7.26048 13.7604 6.95542L13.7547 6.87061V3.12699C13.7544 2.13458 12.9834 1.32218 12.0079 1.25579L11.8796 1.25141L3.12408 1.25C2.14269 1.24925 1.33713 2.00333 1.2559 2.96406L1.24936 3.0963L1.25153 11.8764C1.25202 12.8688 2.0231 13.6811 2.99862 13.7474L3.12697 13.7517H6.87392C7.2191 13.7517 7.49892 14.0316 7.49892 14.3767C7.49892 14.6932 7.26379 14.9547 6.95873 14.996L6.87392 15.0017H3.12677C1.45691 15.0012 0.092973 13.6914 0.00594397 12.0428L0.00153343 11.8769L0 3.1272L0.00351946 2.95767C0.0871909 1.36372 1.36519 0.0864305 2.95872 0.0042069L3.12466 0ZM11.0473 4.99965C11.3925 4.99965 11.6723 5.27947 11.6723 5.62465C11.6723 5.94106 11.4372 6.20255 11.1321 6.24394L11.0473 6.24965L7.135 6.24916L13.1551 12.2663C13.377 12.4881 13.3973 12.8354 13.2158 13.0801L13.1553 13.1502C12.9334 13.3721 12.5862 13.3924 12.3415 13.2109L12.2714 13.1504L6.25167 7.13333L6.2524 11.0426C6.2524 11.359 6.01727 11.6205 5.7122 11.6619L5.6274 11.6676C5.31098 11.6676 5.04949 11.4325 5.0081 11.1274L5.00237 11.0426L5.00252 5.61198C5.00187 5.59076 5.00337 5.56963 5.00593 5.5486L5.02389 5.45826L5.05281 5.378L5.05717 5.3684C5.08649 5.30082 5.12916 5.23795 5.18427 5.1828L5.22097 5.14887L5.28886 5.09842L5.33834 5.06984L5.41778 5.03536L5.47344 5.01875L5.52503 5.00786L5.60269 5.00009L11.0473 4.99965Z" fill="#8176AF"/>
        </svg>
      </div>



      {/* <Menu> */}
      {/*   <MenuHandler> */}
      {/*     <button className="bg-transparent"> */}
      {/*       <svg xmlns="http://www.w3.org/2000/svg" width="8" height="23" viewBox="0 0 8 23" fill="none"> */}
      {/*         <path d="M0.820641 2.84711C0.820641 1.27359 2.09352 0 3.66631 0C5.23911 0 6.5127 1.27216 6.5127 2.84711C6.5127 4.41775 5.24126 5.69278 3.66631 5.69278C2.09352 5.69278 0.820641 4.41775 0.820641 2.84711ZM0.820641 11.6474C0.820641 10.0775 2.0928 8.80034 3.66559 8.80034C5.23839 8.80034 6.51198 10.0761 6.51198 11.6474C6.51198 13.2188 5.24054 14.496 3.66559 14.496C2.09351 14.4946 0.820641 13.2188 0.820641 11.6474ZM0.820641 20.155C0.820641 18.5823 2.09352 17.3072 3.66703 17.3072C5.23839 17.3072 6.51198 18.5801 6.51198 20.155C6.51198 21.725 5.24054 23 3.66703 23C2.09352 23 0.820641 21.725 0.820641 20.155Z" fill="#8176AF"/> */}
      {/*         <defs> */}
      {/*           <clipPath id="clip0_1311_182"> */}
      {/*             <rect width="23" height="7" fill="white" transform="matrix(0 1 1 0 0.0833359 0)"/> */}
      {/*           </clipPath> */}
      {/*         </defs> */}
      {/*       </svg> */}
      {/*     </button> */}
      {/*   </MenuHandler> */}
      {/*   <MenuList className="bg-purple-sh-2 border border-purple"> */}
      {/*     <MenuItem onClick={() => {unfriend()}} placeholder={"a"} className="text-purple-tone-2 hover:bg-purple-sh-0 hover:text-purple-tone-2">Unfriend</MenuItem> */}
      {/*     <MenuItem onClick={() => {visitProfile()}} className="text-purple-tone-2 hover:bg-purple-sh-0 hover:text-purple-tone-2">Visit profile</MenuItem> */}
      {/*     <MenuItem onClick={() => {blocUser()}} className="text-purple-tone-2 hover:bg-purple-sh-0 hover:text-purple-tone-2">Bloc user</MenuItem> */}
      {/*   </MenuList> */}
      {/* </Menu> */}

    </div>
  );
}

export default Icons
