import SideBar from "./components/sidebar";

function ManageGoups() {
  return (
    <>
      <SideBar/>
      <div className="h-screen w-screen bg-gradient-to-br from-purple-sh-2 from-10% via-purple-sh-1 via-30% to-purple flex gap-10 justify-center items-center">
        <div className="basis-1/4 h-[80%] ">
          <p className="text-impure-white text-5xl pb-3"> Join a Group </p>
          <div className="bg-purple-sh-2 rounded-lg h-[90%] w-full">

            <div className="flex flex-col-reverse w-[60%]" >
              <form className="flex bg-purple-sh-0  ">
                <svg className="w-10 h-10 stroke-purple stroke-2 " xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
                </svg>

                <input type='text' className=' h-12 bg-transparent cursor-text border-transparent outline-none '/>
              </form>

            </div>
          </div>
        </div>

        <div className="basis-2/4 h-[80%] ">
          <p className="text-impure-white text-5xl pb-3"> Create a Group </p>
          <div className=" bg-purple-sh-2 rounded-lg h-[90%]">
          </div>
        </div>

      </div>
    </>
  )
}

export default ManageGoups
