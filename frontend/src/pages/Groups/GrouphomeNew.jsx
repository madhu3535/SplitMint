import React, { useState, useEffect } from 'react'
import Navbar from '../../components/Navbar.jsx'
import Modal from 'react-bootstrap/Modal';
import Button from 'react-bootstrap/Button'
import axios from 'axios';
import { useParams } from 'react-router-dom';

const Grouphome = ({user, thememode, toggle}) => {
  const {id} = useParams()
  const [groupData, setgroupData] = useState({})
  const [participants, setParticipants] = useState([])
  const [expenses, setExpenses] = useState([])
  const [showAddExpense, setShowAddExpense] = useState(false)
  const [showParticipants, setShowParticipants] = useState(false)
  const [balances, setBalances] = useState({})
  const [settlements, setSettlements] = useState([])
  const [refreshFlag, setRefreshFlag] = useState(false)

  const [expenseInput, setExpenseInput] = useState({
    amount: '',
    description: '',
    payer_id: '',
    split_type: 'equal',
    participants: []
  })

  // Fetch group details
  useEffect(() => {
    const fetchGroup = async() => {
      try {
        const res = await axios.get(`http://localhost:3001/api/group/${id}`)
        console.log("Group:", res.data)
        setgroupData(res.data)
      } catch(err) {
        console.log(err)
      }
    }
    fetchGroup()
  }, [id, refreshFlag])

  // Fetch participants
  useEffect(() => {
    const fetchParticipants = async() => {
      try {
        const res = await axios.get(`http://localhost:3001/api/participant/${id}`)
        console.log("Participants:", res.data)
        setParticipants(res.data)
      } catch(err) {
        console.log(err)
      }
    }
    if(id) fetchParticipants()
  }, [id, refreshFlag])

  // Fetch expenses
  useEffect(() => {
    const fetchExpenses = async() => {
      try {
        const res = await axios.get(`http://localhost:3001/api/expenses/group/${id}`)
        console.log("Expenses:", res.data)
        setExpenses(res.data)
      } catch(err) {
        console.log(err)
      }
    }
    if(id) fetchExpenses()
  }, [id, refreshFlag])

  // Fetch balances
  useEffect(() => {
    const fetchBalances = async() => {
      try {
        const res = await axios.get(`http://localhost:3001/api/balance/calculate/${id}`)
        console.log("Balances:", res.data)
        if(res.data.balances) setBalances(res.data.balances)
        if(res.data.settlements) setSettlements(res.data.settlements)
      } catch(err) {
        console.log(err)
      }
    }
    if(id) fetchBalances()
  }, [id, expenses, refreshFlag])

  const handleAddExpense = async() => {
    if(!expenseInput.payer_id || !expenseInput.amount) {
      alert("Please fill in all required fields");
      return;
    }

    try {
      const participantIds = participants.map(p => p._id)
      
      const res = await axios.post("http://localhost:3001/api/expenses", {
        group_id: id,
        payer_id: expenseInput.payer_id,
        amount: parseFloat(expenseInput.amount),
        description: expenseInput.description || "No description",
        split_type: expenseInput.split_type,
        splitData: participantIds
      })
      
      console.log("Expense created:", res.data)
      setRefreshFlag(prev => !prev)
      setShowAddExpense(false)
      setExpenseInput({
        amount: '',
        description: '',
        payer_id: '',
        split_type: 'equal',
        participants: []
      })
    } catch(err) {
      console.log(err)
      alert(err.response?.data?.message || "Failed to add expense")
    }
  }

  const handleDeleteExpense = async(expenseId) => {
    if(!window.confirm("Are you sure?")) return;
    try {
      await axios.delete(`http://localhost:3001/api/expenses/${expenseId}`)
      setRefreshFlag(prev => !prev)
    } catch(err) {
      console.log(err)
      alert("Failed to delete expense")
    }
  }

  const getParticipantName = (participantId) => {
    const p = participants.find(part => part._id === participantId)
    return p ? p.name : 'Unknown'
  }

  return (
    <div style={{backgroundColor: thememode === "dark" ? "#181818" : "#f0f0f0"}} className='min-h-screen'>
      <Navbar thememode={thememode} toggle={toggle}/>
      
      <div className='p-6 max-w-6xl mx-auto'>
        <h1 className='text-3xl font-bold mb-6' style={{color: thememode === "dark" ? "white" : "black"}}>
          {groupData.name || groupData.title}
        </h1>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-6 mb-6'>
          {/* Participants Section */}
          <div style={{backgroundColor: thememode === "dark" ? "#252525" : "white"}} className='p-4 rounded-lg shadow'>
            <h2 className='text-xl font-bold mb-4' style={{color: thememode === "dark" ? "white" : "black"}}>
              Participants ({participants.length})
            </h2>
            <ul>
              {participants.map(p => (
                <li key={p._id} className='py-2 border-b flex justify-between items-center' style={{color: thememode === "dark" ? "white" : "black"}}>
                  <span>{p.name}</span>
                  {groupData.owner_id === p.userId && <span className='text-xs bg-blue-500 text-white px-2 py-1 rounded'>Owner</span>}
                </li>
              ))}
            </ul>
          </div>

          {/* Balances Section */}
          <div style={{backgroundColor: thememode === "dark" ? "#252525" : "white"}} className='p-4 rounded-lg shadow'>
            <h2 className='text-xl font-bold mb-4' style={{color: thememode === "dark" ? "white" : "black"}}>
              Balances
            </h2>
            {Object.entries(balances).length > 0 ? (
              Object.entries(balances).map(([id, balance]) => (
                <div key={id} className='py-2 border-b' style={{color: thememode === "dark" ? "white" : "black"}}>
                  <p className='font-semibold'>{balance.name}</p>
                  <p className={`text-sm font-bold ${balance.netBalance > 0 ? 'text-green-500' : balance.netBalance < 0 ? 'text-red-500' : ''}`}>
                    {balance.netBalance > 0 ? '+' : ''}{balance.netBalance.toFixed(2)}
                  </p>
                </div>
              ))
            ) : (
              <p style={{color: thememode === "dark" ? "white" : "black"}}>No balances yet</p>
            )}
          </div>

          {/* Settlements Section */}
          <div style={{backgroundColor: thememode === "dark" ? "#252525" : "white"}} className='p-4 rounded-lg shadow'>
            <h2 className='text-xl font-bold mb-4' style={{color: thememode === "dark" ? "white" : "black"}}>
              Who Owes Whom
            </h2>
            {settlements.length > 0 ? (
              settlements.map((settlement, idx) => (
                <div key={idx} className='py-2 border-b text-sm' style={{color: thememode === "dark" ? "white" : "black"}}>
                  <p className='font-semibold'>{settlement.from} → {settlement.to}</p>
                  <p className='text-green-500'>₹{settlement.amount.toFixed(2)}</p>
                </div>
              ))
            ) : (
              <p style={{color: thememode === "dark" ? "white" : "black"}}>All settled!</p>
            )}
          </div>
        </div>

        {/* Expenses Section */}
        <div style={{backgroundColor: thememode === "dark" ? "#252525" : "white"}} className='p-4 rounded-lg shadow'>
          <div className='flex justify-between items-center mb-4'>
            <h2 className='text-xl font-bold' style={{color: thememode === "dark" ? "white" : "black"}}>
              Expenses
            </h2>
            <button 
              className='bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded transition'
              onClick={() => setShowAddExpense(true)}
            >
              + Add Expense
            </button>
          </div>
          
          {expenses.length > 0 ? (
            <div className='overflow-x-auto'>
              <table className='w-full' style={{color: thememode === "dark" ? "white" : "black"}}>
                <thead>
                  <tr style={{borderBottom: '2px solid gray'}}>
                    <th className='text-left p-3'>Description</th>
                    <th className='text-left p-3'>Amount</th>
                    <th className='text-left p-3'>Paid By</th>
                    <th className='text-left p-3'>Type</th>
                    <th className='text-left p-3'>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map(expense => (
                    <tr key={expense._id} style={{borderBottom: '1px solid gray'}}>
                      <td className='p-3'>{expense.description}</td>
                      <td className='p-3 font-semibold'>₹{expense.amount.toFixed(2)}</td>
                      <td className='p-3'>{getParticipantName(expense.payer_id)}</td>
                      <td className='p-3'><span className='bg-purple-200 text-purple-800 px-2 py-1 rounded text-sm'>{expense.split_type}</span></td>
                      <td className='p-3'>
                        <button 
                          className='text-red-500 hover:text-red-700 font-semibold transition'
                          onClick={() => handleDeleteExpense(expense._id)}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p style={{color: thememode === "dark" ? "white" : "black"}} className='text-center py-4'>
              No expenses yet. Add one to get started!
            </p>
          )}
        </div>
      </div>

      {/* Add Expense Modal */}
      <Modal show={showAddExpense} onHide={() => setShowAddExpense(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>Add Expense</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className='mb-3'>
            <label className='block font-semibold mb-1'>Description</label>
            <input 
              type="text" 
              className='w-full border p-2 rounded'
              placeholder="e.g., Dinner"
              value={expenseInput.description}
              onChange={(e) => setExpenseInput({...expenseInput, description: e.target.value})}
            />
          </div>
          
          <div className='mb-3'>
            <label className='block font-semibold mb-1'>Amount *</label>
            <input 
              type="number" 
              className='w-full border p-2 rounded'
              placeholder="0.00"
              value={expenseInput.amount}
              onChange={(e) => setExpenseInput({...expenseInput, amount: e.target.value})}
            />
          </div>

          <div className='mb-3'>
            <label className='block font-semibold mb-1'>Paid By *</label>
            <select 
              className='w-full border p-2 rounded'
              value={expenseInput.payer_id}
              onChange={(e) => setExpenseInput({...expenseInput, payer_id: e.target.value})}
            >
              <option value="">Select participant</option>
              {participants.map(p => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className='mb-3'>
            <label className='block font-semibold mb-1'>Split Type</label>
            <select 
              className='w-full border p-2 rounded'
              value={expenseInput.split_type}
              onChange={(e) => setExpenseInput({...expenseInput, split_type: e.target.value})}
            >
              <option value="equal">Equal Split (All participants)</option>
              <option value="custom">Custom Split</option>
              <option value="percentage">Percentage Split</option>
            </select>
          </div>
          <p className='text-sm text-gray-500'>* = Required fields</p>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddExpense(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={handleAddExpense}>
            Add Expense
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}

export default Grouphome
