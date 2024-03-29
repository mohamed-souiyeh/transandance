import axios from "axios";
import { Dispatch, SetStateAction, useContext, useEffect, useState } from "react";
import { UserContext } from "../../App";
import Cookies from 'js-cookie'

function Popup({ switchValue, setSwitchValue, prompt, setPrompt }: { switchValue: boolean, prompt: boolean, setSwitchValue: Dispatch<SetStateAction<boolean>>, setPrompt: Dispatch<SetStateAction<boolean>> }) {
  const { user } = useContext(UserContext)
  const [enable, setEnable] = useState(false);
  const [qrCode, setCode] = useState('');
  const [codeFetched, setStatus] = useState(false);
  const [confirmed, setConfirmed] = useState(true)
  let formdata = new FormData();


  useEffect(() => {
    axios.get(`${process.env.REACT_URL}:1337/2fa/generate`,
      {
        withCredentials: true,
        responseType: 'arraybuffer'
      })
      .then((response) => {
        if (response.status == 200) {

          let image = btoa(
            new Uint8Array(response.data)
              .reduce((data, byte) => data + String.fromCharCode(byte), '')
          );

          setCode(`data:${response.headers['content-type'].toLowerCase()};base64,${image}`);
          setStatus(true);
        }
      })
      .catch(() => {});
  }, []);

  const handleDisable = () => {
    axios.get(`${process.env.REACT_URL}:1337/2fa/deactivate`, {
      withCredentials: true
    })
      .then((resp) => {
        if (resp.status == 200) {

          setSwitchValue(!switchValue);
          setPrompt(!prompt)
          user.data.TFAisEnabled = false
          Cookies.remove('user')
          Cookies.set('user', JSON.stringify(user.data), { sameSite: 'lax'   });
        }
      })
      .catch(() => {})
  }

  const handleClose = () => {
    // setSwitchValue(!switchValue)
    setSwitchValue(user.data.TFAisEnabled)
    setPrompt(!prompt)
  }

  const verifyCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const Code = e.target.verfCode.value;
    formdata.set("code", Code);

    axios.post(`${process.env.REACT_URL}:1337/2fa/activate`, formdata, {
      withCredentials: true,
      headers: {
        'Content-Type': 'multipart/formdata'
      }
    })
      .then((res) => {
        if (res.status === 200) {
          setEnable(true)
          user.data.TFAisEnabled = true;
          Cookies.remove('user')
          Cookies.set('user', JSON.stringify(user.data), { sameSite: 'lax'  });
        }
        else {
          setConfirmed(false)
        }
      })
      .catch(() => {
        setConfirmed(false)
      })
  }

  

  return (
    <>
      <div onClick={() => {handleClose()}} className='h-screen w-screen absolute top-0 left-0 grid place-content-center'>
        <div onClick={(e) => {e.stopPropagation()}}className='h-[400px] w-[300px] backdrop-blur-sm bg-purple bg-opacity-30 rounded-3xl grid place-content-center z-50'>

          {!enable && switchValue && <>
            <div className="grid place-content-center py-20">
              <p className="text-center text-2xl place-self-center"> Do You Really want to disable 2fa?? </p>
            </div>
            <div className="flex place-content-center gap-3">
              <button className="w-32 rounded-lg bg-purple-sh-1 focus:outline-none border-none hover:bg-purple-sh-2" onClick={() => handleDisable()}>
                Disable
              </button>
              {/* <button className="w-32 rounded-lg bg-purple-sh-1 focus:outline-none border-none hover:bg-purple-sh-2" onClick={() => setPrompt(!prompt)}> */}
              <button type="button" className="w-32 rounded-lg bg-purple-sh-1 focus:outline-none border-none hover:bg-purple-sh-2" onClick={() => {handleClose()}}>
                Cancel
              </button>
            </div>
          </>
          }
          {!enable && !switchValue && <>
            <div className="grid place-content-center py-5 place-self-center">
              <p className="text-cente place-self-center">Please Use this
                <a className="m-1 text-purple-sh-2 hover:text-purple-sh-1" href="https://play.google.com/store/apps/details?id=two.factor.authenticator.generator.code" target="_blank">App</a>
                to enable 2fa </p>
              <img src={qrCode} className="w-40 h-40 my-4 place-self-center" />
              <form onSubmit={verifyCode} action='' className=" grid place-self-center ">
                <input type='text' name="verfCode" placeholder="Enter verification code" className='w-48 h-12 bg-purple-sh-2 outline-none rounded-lg text-impure-white px-2 place-self-center' />
                <div className="grid h-7">
                  {!confirmed && <p className="ml-12 text-sm text-[#D9534F] font-extrabold"> Error! Please Try again. </p>}
                </div>
                <div className="flex place-content-center gap-3 pt-1">
                  <button className="w-32 rounded-lg bg-purple-sh-1 focus:outline-none border-none hover:bg-purple-sh-2" type="submit" value="Send" > Confirm </button>
                  <button type="button" className="w-32 rounded-lg bg-purple-sh-1 focus:outline-none border-none hover:bg-purple-sh-2" onClick={() => {handleClose()}}> Cancel </button>
                </div>
              </form>
            </div>
          </>}

          {enable && !switchValue &&
            <>
              <div className="grid place-content-center py-20 ">
                <p className="text-center text-xl place-self-center"> two factor authentication was enabled successfully!</p>
              </div>
              <button className="w-32 rounded-lg bg-purple-sh-1 focus:outline-none border-none hover:bg-purple-sh-2 place-self-center" onClick={() => handleClose()}> Close </button>
            </>
          }
        </div>
      </div>
    </>
  )

}

export default Popup
