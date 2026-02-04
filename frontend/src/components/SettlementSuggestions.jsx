import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './SettlementSuggestions.css';

const SettlementSuggestions = ({ groupId, thememode }) => {
  const [settlements, setSettlements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSettlements();
  }, [groupId]);

  const fetchSettlements = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`http://localhost:3001/api/balance/simplify/${groupId}`);
      setSettlements(response.data.settlements);
      setError(null);
    } catch (err) {
      console.error('Error fetching settlements:', err);
      setError('Failed to load settlement suggestions');
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="settlement-loading">Calculating settlements...</div>;
  if (error) return <div className="settlement-error">{error}</div>;
  if (settlements.length === 0) return <div className="settlement-empty">All settled up!</div>;

  return (
    <div className={`settlement-container ${thememode}`}>
      <h3 className="settlement-title">Minimal Settlement Suggestions</h3>
      <div className="settlement-list">
        {settlements.map((settlement, index) => (
          <div key={index} className="settlement-item">
            <div className="settlement-arrow">
              <span className="settlement-from">{settlement.from}</span>
              <div className="arrow-divider">
                <span className="arrow-text">owes</span>
                <svg className="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M5 12h14M12 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="settlement-to">{settlement.to}</span>
            </div>
            <div className="settlement-amount">
              ₹{settlement.amount.toFixed(2)}
            </div>
          </div>
        ))}
      </div>
      <p className="settlement-note">
        Following these suggestions will clear all debts with minimum number of transactions.
      </p>
    </div>
  );
};

export default SettlementSuggestions;
