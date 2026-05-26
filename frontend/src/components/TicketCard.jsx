import React from 'react';
import { ArrowLeft, ArrowRight, AlertCircle, Clock } from 'lucide-react';

// Strict Transition Rules mapped to available actions
const AVAILABLE_MOVES = {
  open: { next: 'in_progress' },
  in_progress: { prev: 'open', next: 'resolved' },
  resolved: { prev: 'in_progress', next: 'closed' },
  closed: { prev: 'resolved' }
};

function TicketCard({ ticket, onMove, currentStatus }) {
  const { prev, next } = AVAILABLE_MOVES[currentStatus] || {};

  return (
    <div 
      className={`ticket-card ${ticket.slaBreached ? 'sla-breached' : ''}`}
      draggable
      onDragStart={(e) => e.dataTransfer.setData('ticketId', ticket._id)}
    >
      <div className="ticket-header">
        <h3 className="ticket-subject">{ticket.subject}</h3>
        {ticket.slaBreached && (
          <AlertCircle size={16} className="text-red-500" title="SLA Breached" />
        )}
      </div>
      
      <p className="text-sm text-muted mb-3 line-clamp-2">
        {ticket.description}
      </p>
      
      <div className="flex justify-between items-center text-xs mb-2">
        <span className={`badge priority-${ticket.priority}`}>
          {ticket.priority}
        </span>
        <span className="flex items-center gap-1 text-muted">
          <Clock size={12} /> {ticket.ageMinutes}m
        </span>
      </div>
      
      <div className="text-xs text-muted mb-2">
        {ticket.customerEmail}
      </div>

      <div className="ticket-actions">
        {prev ? (
          <button 
            className="btn btn-icon" 
            onClick={() => onMove(ticket._id, prev)}
            title={`Move to ${prev.replace('_', ' ')}`}
          >
            <ArrowLeft size={16} />
          </button>
        ) : <div />}
        
        {next ? (
          <button 
            className="btn btn-icon" 
            onClick={() => onMove(ticket._id, next)}
            title={`Move to ${next.replace('_', ' ')}`}
          >
            <ArrowRight size={16} />
          </button>
        ) : <div />}
      </div>
    </div>
  );
}

export default TicketCard;
