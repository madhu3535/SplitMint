import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './BalanceTable.css';

const BalanceTable = ({ groupId, thememode }) => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchBalances();
  }, [groupId]);

  const fetchBalances = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/balance/calculate/${groupId}`);
      const balancesArray = Object.entries(response.data.balances).map(([id, data]) => ({
        id,
        ...data
      }));
      setBalances(balancesArray.sort((a, b) => b.netBalance - a.netBalance));
      setError(null);
    } catch (err) {
      console.error('Error fetching balances:', err);
      setError('Failed to load balances');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="balance-loading">Loading balances...</div>;
  if (error) return <div className="balance-error">{error}</div>;
  if (balances.length === 0) return <div className="balance-empty">No balance data available</div>;

  return (
    <div className={`balance-table-container ${thememode}`}>
      <h3 className="balance-title">Balance Summary</h3>
      <div className="balance-table-wrapper">
        <table className="balance-table">
          <thead>
            <tr>
              <th>Participant</th>
              <th>Total Spent</th>
              <th>Total Owed</th>
              <th>Net Balance</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            {balances.map((balance) => (
              <tr key={balance.id} className={`balance-row ${balance.netBalance > 0 ? 'owed-to' : balance.netBalance < 0 ? 'owes' : 'settled'}`}>
                <td className="participant-name">{balance.name}</td>
                <td className="spent-amount">₹{balance.totalSpent.toFixed(2)}</td>
                <td className="owed-amount">₹{balance.totalOwed.toFixed(2)}</td>
                <td className="net-balance">
                  <span className={`balance-value ${balance.netBalance > 0 ? 'credit' : balance.netBalance < 0 ? 'debit' : 'zero'}`}>
                    {balance.netBalance > 0 ? '+' : ''} ₹{balance.netBalance.toFixed(2)}
                  </span>
                </td>
                <td className="status">
                  {balance.netBalance > 0 && <span className="status-owed-to">Owed to</span>}
                  {balance.netBalance < 0 && <span className="status-owes">Owes</span>}
                  {balance.netBalance === 0 && <span className="status-settled">Settled</span>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default BalanceTable;
