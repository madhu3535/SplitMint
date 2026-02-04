import React from 'react';
import Navbar from '../../components/Navbar.jsx';
import { useState } from 'react';
import axios from "axios"

function Profile({ user, thememode, toggle,setUser}) {
  const [url, setUrl] = useState(user.image);
  const [flag,setFlag]=useState(false)
  console.log(user)

  React.useEffect(()=>{
    const check=async()=>{
      try{
        const loggedInUser = localStorage.getItem("user");
        if (loggedInUser) {
          console.log(loggedInUser);
          const foundUser = JSON.parse(loggedInUser);
          console.log("found user",foundUser)
          setUser(foundUser);
        }
      }catch(err){
        console.log(err)
      }
    }
    check()
  },[user?._id])

  const [badges, setBadges] = useState([]);
  React.useEffect(() => {
    const getBadges = async () => {
      try {
        const response = await axios.get(`http://localhost:3001/api/user/getBadges/${user._id}`);
        setBadges(response.data.badges);
        console.log(response.data.badges)
      } catch (error) {
        console.log(error);
      }
    };
    getBadges();
  }, [user._id]);

  return (
    <div style={{backgroundColor:thememode=="dark"?"#181818":"#f0f0f0"}} className='min-h-screen overflow-x-hidden'>
      <Navbar thememode={thememode} toggle={toggle} flag={flag} setFlag={setFlag}/>
      <div
        className='flex flex-col justify-start items-center p-3 border-[#000080] h-full' 
        style={{ backgroundColor: thememode === 'dark' ? '#181818' : '#f0f0f0' }}
      >
        <div
          className='flex flex-col mx-auto w-[50%] h-[250px] border-1 border-black p-2 rounded-sm'
          style={{ backgroundColor: thememode === 'dark' ? '#000080' : '#000080', color: thememode == 'dark' ? 'white' : 'black' }}
        >
          {/* Profile picture section */}
          <div className=' flex justify-center align-middle items-center w-[70%] h-[80%] mx-auto p-1'>
            <img src={url || 'ProfileImg.jpeg'} className='w-[100px] h-[100px] rounded-full static' alt='Profile' />
          </div>
          
        </div>

        <div
          className='flex flex-col mx-auto w-[50%] h-auto justify-start items-center p-3 border-1 border-black gap-3 rounded-sm'
          style={{ backgroundColor: thememode === 'dark' ? 'rgb(195, 189, 189)' : 'white', border: '4px solid black' }}
        >
         

          {/* ------------------------------------------------------Existing labels and input fields---------------------------------------------------- */}
          <label
            htmlFor='username'
            className='w-full flex justify-between items-center gap-1 border-1 p-1 border-black rounded-md'
            style={{ backgroundColor: thememode == 'dark' ? 'rgb(222, 221, 221)' : 'white' }}
          >
            <div className='w-[30%] text-md p-1'>
              <b>Username</b>
            </div>
            <input type='text' value={user.username} readOnly />
          </label>

          <label
            htmlFor='username'
            className='w-full flex justify-between items-center gap-1 border-1 p-1 border-black rounded-md'
            style={{ backgroundColor: thememode == 'dark' ? 'rgb(222, 221, 221)' : 'white' }}
          >
            <div className='w-[30%] text-md p-1'>
              <b>Email</b>
            </div>
            <input type='text' value={user.email} readOnly />
          </label>

          {/* Friends section removed - users interact via groups now */}

      <div
        className='flex flex-col mx-auto w-[50%] h-auto justify-start items-center p-3 gap-3 rounded-sm'
        style={{ backgroundColor: thememode === 'dark' ? 'rgb(195, 189, 189)' : 'white'}}
      >
        <div className='w-full text-xl font-bolder mb-2 flex justify-center ' style={{ color: thememode === 'dark' ? 'black' : 'black' }}>
          Badges
        </div>
        <div className='flex flex-warp'>
        {badges?.map((badge, index) => (
          <img
          key={index}
          src={badge}
          alt={`Badge ${index + 1}`}
          className='w-32 h-32 m-2 object-cover'
        />
        ))}
        </div>
      </div>
        </div>
      </div>
    </div>
  );
}

export default Profile;
