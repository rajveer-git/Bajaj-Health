import React, { useState } from 'react';
import Board from './components/Board';
import TicketForm from './components/TicketForm';
import { Plus } from 'lucide-react';

function App() {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleTicketCreated = () => {
    setIsFormOpen(false);
    setRefreshTrigger(prev => prev + 1); // Trigger board refresh
  };

  return (
    <div className="app-container">
      <header className="header">
        <div>
          <h1>DeskFlow</h1>
          <p className="text-muted">Support Ticket Triage</p>
        </div>
        <button className="btn" onClick={() => setIsFormOpen(true)}>
          <Plus size={18} /> New Ticket
        </button>
      </header>
      
      <Board refreshTrigger={refreshTrigger} />
      
      {isFormOpen && (
        <TicketForm 
          onClose={() => setIsFormOpen(false)} 
          onSuccess={handleTicketCreated} 
        />
      )}
    </div>
  );
}

export default App;
