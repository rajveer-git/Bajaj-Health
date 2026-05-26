import React, { useState, useEffect } from 'react';
import Column from './Column';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BOARD_COLUMNS = [
  { id: 'open', title: 'Open' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'resolved', title: 'Resolved' },
  { id: 'closed', title: 'Closed' }
];

function Board({ refreshTrigger }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/tickets`);
      if (!res.ok) throw new Error('Failed to fetch tickets');
      const data = await res.json();
      setTickets(data);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [refreshTrigger]);

  const handleMoveTicket = async (ticketId, newStatus) => {
    // Optimistic UI update
    const previousTickets = [...tickets];
    setTickets(tickets.map(t => t._id === ticketId ? { ...t, status: newStatus } : t));

    try {
      const res = await fetch(`${API_URL}/tickets/${ticketId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || 'Failed to update ticket');
      }
      
      // Fetch fresh data to get updated age and timestamps
      fetchTickets();
    } catch (err) {
      alert(err.message);
      // Revert on failure
      setTickets(previousTickets);
    }
  };

  if (loading && tickets.length === 0) return <div className="text-center">Loading board...</div>;
  if (error) return <div className="text-center text-red-500">Error: {error}</div>;

  return (
    <div className="board">
      {BOARD_COLUMNS.map(col => (
        <Column 
          key={col.id} 
          title={col.title} 
          status={col.id}
          tickets={tickets.filter(t => t.status === col.id)}
          onMove={handleMoveTicket}
        />
      ))}
    </div>
  );
}

export default Board;
