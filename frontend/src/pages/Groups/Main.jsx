import React,{useState,useEffect} from 'react'
import Navbar from '../../components/Navbar.jsx'
import Modal from 'react-bootstrap/Modal';
import {Button} from 'react-bootstrap'
import axios from 'axios';
import GroupCard from '../../components/GroupCard/GroupCard.jsx'
import {Button as Buttonmui} from '@mui/material';
import Menu from '@mui/material/Menu';
import { useTheme } from '@mui/material/styles';
import MenuItem from '@mui/material/MenuItem';

export const Main = ({user,setUser,thememode,toggle,groupData,setgroupData}) => {
  console.log(groupData)
    const theme = useTheme()
    const [showGroup, setShowGroup] = useState(false);
    const [showAddParticipant, setShowAddParticipant] = useState(false);
    const [selectedGroup, setSelectedGroup] = useState(null);
    const [groupflag,setgroupflag] = useState(false)
    const [participantName, setParticipantName] = useState("")
    const [participantEmail, setParticipantEmail] = useState("")
    const [anchorEl, setAnchorEl] = React.useState(null);
    const open = Boolean(anchorEl);
    const handleClick = (event) => {
      setAnchorEl(event.currentTarget);
    };
    const handleClose = () => {
      setAnchorEl(null);
    };
    const [groupInput,setgroupInput] = useState({
      name:'',
      description:''
    })
    const {name,description} = groupInput


    //modal opening and closing logic
    const handleGroupClose = () => {
      setShowGroup(false);
      setgroupInput({name:'',description:''})
    };
    const handleGroupShow = () => setShowGroup(true);

    const handleAddParticipantShow = () => {
      setShowAddParticipant(true);
    };
    const handleAddParticipantClose = () => {
      setShowAddParticipant(false);
      setParticipantName("");
      setParticipantEmail("");
    };

    //handling input
    const handleGroupInput = name=>e=>{
      setgroupInput({...groupInput,[name]:e.target.value})
    }
    const handleParticipantInput = (e, field) => {
      if(field === 'name') setParticipantName(e.target.value);
      if(field === 'email') setParticipantEmail(e.target.value);
    }

    //function to add participant to group
    const handleAddParticipant = async() => {
      if(!selectedGroup || !participantName) {
        alert("Please select a group and enter participant name");
        return;
      }
      try {
        const res = await axios.post("http://localhost:3001/api/participant", {
          groupId: selectedGroup._id,
          name: participantName,
          email: participantEmail
        });
        console.log("Participant added", res.data);
        alert("Participant added successfully!");
        setgroupflag(prev => !prev);
        handleAddParticipantClose();
      } catch(err) {
        console.log(err);
        alert(err.response?.data?.message || "Failed to add participant");
      }
    };

    //create group function
    const handleSubmit = e => {  
      e.preventDefault();
      console.log(groupInput);
      const addgroup = async() => {
        try{
          const res = await axios.post("http://localhost:3001/api/group", {
            name: groupInput.name,
            description: groupInput.description,
            owner_id: user._id
          });
          console.log(res.data);
          const val = res.data;
          setgroupData(prev => [...prev, val]);
          setgroupflag(prev => !prev);
          handleGroupClose();
        } catch(err) {
          console.log(err);
          alert(err.response?.data?.message || "Failed to create group");
        }
      };
      addgroup();
    }

    useEffect(()=>{
       //retrieving user data from local storage
        const check=async()=>{
            try{
              const loggedInUser = localStorage.getItem("user");
              if (loggedInUser) {
                console.log(loggedInUser);
                const foundUser = JSON.parse(loggedInUser);
                console.log("found user",foundUser  )
                await setUser(foundUser);
              }
            }catch(err){
              console.log(err)
            }
          }
          check()
    },[user._id])

    useEffect(()=>{
      //function to get all the groups a user is in
      const getGroups = async()=>{
        try{
          const res = await axios.get(`http://localhost:3001/api/group/user/${user._id}`);
          console.log("Groups:", res.data);
          setgroupData(res.data);
        }catch(err){
          console.log(err);
        }
      }
      getGroups();
    },[groupflag, user._id])

  return (
    <div style={{backgroundColor:thememode=="dark"?"#181818":"#f0f0f0"}} className='min-h-screen overflow-x-hidden'>
        <Navbar thememode={thememode} toggle={toggle}/>
        <div className='flex flex-col gap-2 justify-start items-start min-h-screen' style={{backgroundColor:thememode=="dark"?"#181818":"#f0f0f0"}}>
        <div className='flex justify-between w-full'>
        <div>
        <div className='font-extrabold text-2xl mx-4 mt-4 dark:text-[#f0f0f0]'> Groups</div>
        <div className='mx-4 text-gray-600 dark:text-gray-200 '>Invite friends, create groups and streamline bill splitting and debt settlements</div>
        </div>
      
        <div>
      <Buttonmui
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        sx={{
           backgroundColor:'#000080',
           margin:'2rem',
           color:'white',
           '&:hover': {
            backgroundColor: '#00009A', 
            color: 'white',
          },
          }}
          className='dark:bg-slate-200 dark:hover:bg-slate-400 dark:text-blue-400'
      >
        + NEW 
      </Buttonmui>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        PaperProps={{
          sx: {
            backgroundColor: thememode === 'dark' ? theme.palette.grey[900] : theme.palette.background.paper,
            color: thememode === 'dark' ? 'white' : 'black',
        
          },
        }}
      >
        <MenuItem onClick={()=>{handleGroupShow();handleClose()}}>Create new group</MenuItem>
        <MenuItem onClick={()=>{if(selectedGroup) handleAddParticipantShow(); else alert("Select a group first"); handleClose()}}>Add participant</MenuItem>
      </Menu>
    </div>

        
        </div>
          {/* -----------------------------Group Cards--------------------------------- */}
        <div className='flex flex-col lg:grid lg:grid-cols-4 mx-4 justify-evenly items-center gap-6 w-full h-fit dark:bg-[#181818]'>
          
          {groupData?.map(data=>{
            return(
            <GroupCard 
            key={data._id}
            setgroupData = {setgroupData}
            groupData={data} 
            allgroupsdata = {groupData}
            setSelectedGroup={setSelectedGroup} 
            selectedGroup={selectedGroup}
            thememode={thememode}
            toggle={toggle}
            user={user}
            setgroupflag={setgroupflag}
            /> 
            );
            })}

        </div>

    {/* ------------------------------------------------Modals------------------------------------------------ */}

    {/* ADD GROUP MODAL */}
    <Modal show={showGroup} onHide={handleGroupClose} animation={false} centered>
        <Modal.Header closeButton>
          <Modal.Title>Create New Group</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <label htmlFor='name'>Group Name: </label>
            <input type="text" 
                   name='name'
                   value={name}
                   onChange={handleGroupInput('name')}
                   placeholder="Enter group name"
                   required
                   style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                   ></input>
            <label htmlFor='description'>Description (optional): </label>
            <input type="text" 
                   name='description'
                   value={description}
                   onChange={handleGroupInput('description')}
                   placeholder="Enter description"
                   style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                   ></input>
        </Modal.Body>
        <Modal.Footer>
          <button className='bg-[#000080] p-2 rounded-md text-white' onClick={handleSubmit} required>Create</button>
        </Modal.Footer>
      </Modal>

      {/* ADD PARTICIPANT MODAL */}
      <Modal show={showAddParticipant} onHide={handleAddParticipantClose} animation={false} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Participant</Modal.Title>
        </Modal.Header>
        <Modal.Body>
        <label htmlFor='participantName'>Participant Name: </label>
            <input type="text" 
                   name='participantName'
                   value={participantName}
                   onChange={(e) => handleParticipantInput(e, 'name')}
                   placeholder="Enter name"
                   required
                   style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                   ></input>
            <label htmlFor='participantEmail'>Email (optional): </label>
            <input type="email" 
                   name='participantEmail'
                   value={participantEmail}
                   onChange={(e) => handleParticipantInput(e, 'email')}
                   placeholder="Enter email"
                   style={{width: '100%', padding: '8px', marginBottom: '10px'}}
                   ></input>
        </Modal.Body>
        <Modal.Footer>
          <button className="bg-[#000080] p-2 rounded-md text-white" onClick={handleAddParticipant} required>Add</button>
        </Modal.Footer>
      </Modal>
        </div>

    </div>
  )
}