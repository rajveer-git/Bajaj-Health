import React from 'react';
import TicketCard from './TicketCard';

function Column({ title, status, tickets, onMove }) {
  return (
    <div className="column">
      <div className="column-header">
        <h2>{title}</h2>
        <span className="ticket-count">{tickets.length}</span>
      </div>
      <div className="ticket-list">
        {tickets.map(ticket => (
          <TicketCard 
            key={ticket._id} 
            ticket={ticket} 
            onMove={onMove} 
            currentStatus={status}
          />
        ))}
        {tickets.length === 0 && (
          <div className="text-center text-muted text-sm mt-4">No tickets</div>
        )}
      </div>
    </div>
  );
}

export default Column;
