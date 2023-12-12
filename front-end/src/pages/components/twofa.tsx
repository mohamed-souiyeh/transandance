
import { Dispatch, SetStateAction, useState } from "react";


function Popup({switchValue, setSwitchValue, prompt, setPrompt} : {switchValue: boolean, prompt:boolean, setSwitchValue: Dispatch<SetStateAction<boolean>>, setPrompt: Dispatch<SetStateAction<boolean>>}) {
  const [enable, setEnable] = useState(false);
  const handleDisable = () => {
    setSwitchValue(!switchValue);
    setPrompt(!prompt)
  }
  const handleEnable = () => {
    setEnable(true)
  }
  const handleClose = () => {
    setSwitchValue(!switchValue)
    setPrompt(!prompt)
  }

  return (
    <>
      <div className='h-screen w-screen absolute top-0 left-0 grid place-content-center'>
        <div className='h-[400px] w-[300px] backdrop-blur-sm bg-purple bg-opacity-30 rounded-3xl grid place-content-center z-50'>

          {!enable && switchValue && <>
          <div className="grid place-content-center py-5">
            <p> Do You Really want to disable 2fa?? </p>
          </div>
          <div className="flex place-content-center gap-3">
            <button className="w-32 rounded-lg bg-purple-sh-1 focus:outline-none border-none hover:bg-purple-sh-2" onClick={() => handleDisable()}>
              Disable
            </button>
            <button className="w-32 rounded-lg bg-purple-sh-1 focus:outline-none border-none hover:bg-purple-sh-2" onClick={() => setPrompt(!prompt)}>
              NO
            </button>
          </div>
          </>
          }
          {!enable && !switchValue && <>
          <div className="grid place-content-center py-5 place-self-center">
            <p className=" place-self-center"> Do you want to Enable 2fa? </p>
            <p className="text-3xl place-self-center"> I AM A QR CODE </p>

              <form action='' className=" grid place-self-center gap-3">
                <input type='text' className='w-48 h-12 bg-purple-sh-2 outline-none rounded-lg text-impure-white px-2 place-self-center' />

                <div className="flex place-content-center gap-3">
                  <button className="w-32 rounded-lg bg-purple-sh-1 focus:outline-none border-none hover:bg-purple-sh-2"  type="submit" value="Send" onClick={() => handleEnable()}> Confirm </button>

                  <button className="w-32 rounded-lg bg-purple-sh-1 focus:outline-none border-none hover:bg-purple-sh-2" onClick={() => setPrompt(!prompt)}> Cancel </button>
                </div>
              </form>
            </div>
          </>}

          {enable && !switchValue &&
            <>
              you either did enabled it correctly ^*^, or your dumbass copied the code wrong -_-
              <button className="w-32 rounded-lg bg-purple-sh-1 focus:outline-none border-none hover:bg-purple-sh-2 place-self-center" onClick={() => handleClose()}> Close </button>
            </>
          }
        </div>
      </div>
    </>
  )

}

export default Popup

