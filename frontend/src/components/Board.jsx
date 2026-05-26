import React, { useState, useEffect } from 'react';
import Column from './Column';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

const BOARD_COLUMNS = [
  { id: 'open', title: 'Open' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'resolved', title: 'Resolved' },
  { id: 'closed', title: 'Closed' }
];

function Board({ refreshTrigger, onTicketMoved }) {
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filters
  const [filterPriority, setFilterPriority] = useState('');
  const [filterBreached, setFilterBreached] = useState(false);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      
      const queryParams = new URLSearchParams();
      if (filterPriority) queryParams.append('priority', filterPriority);
      if (filterBreached) queryParams.append('breachedSla', 'true');
      
      const res = await fetch(`${API_URL}/tickets?${queryParams.toString()}`);
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
  }, [refreshTrigger, filterPriority, filterBreached]);

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
      
      // Notify parent to refresh stats
      if (onTicketMoved) onTicketMoved();
      
      // Fetch fresh data to get updated age and timestamps
      fetchTickets();
    } catch (err) {
      alert(err.message);
      // Revert on failure
      setTickets(previousTickets);
    }
  };

  return (
    <div style={{display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0}}>
      {/* Filter Bar */}
      <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem', alignItems: 'center' }}>
        <span className="text-muted text-sm font-semibold uppercase">Filters:</span>
        <select 
          className="form-control" 
          style={{ width: 'auto', padding: '0.4rem 1rem' }}
          value={filterPriority}
          onChange={(e) => setFilterPriority(e.target.value)}
        >
          <option value="">All Priorities</option>
          <option value="urgent">Urgent</option>
          <option value="high">High</option>
          <option value="medium">Medium</option>
          <option value="low">Low</option>
        </select>
        
        <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.9rem' }}>
          <input 
            type="checkbox" 
            checked={filterBreached}
            onChange={(e) => setFilterBreached(e.target.checked)}
          />
          SLA Breached Only
        </label>
      </div>

      {loading && tickets.length === 0 ? (
        <div className="text-center">Loading board...</div>
      ) : error ? (
        <div className="text-center text-red-500">Error: {error}</div>
      ) : (
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
      )}
    </div>
  );
}

export default Board;
