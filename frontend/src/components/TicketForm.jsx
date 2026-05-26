import React, { useState } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function TicketForm({ onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    subject: '',
    description: '',
    customerEmail: '',
    priority: 'low'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`${API_URL}/tickets`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to create ticket');
      }

      onSuccess();
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <h2 className="mb-4">Create New Ticket</h2>
        
        {error && <div className="text-red-500 mb-4 text-sm">{error}</div>}
        
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Subject</label>
            <input 
              type="text" 
              name="subject" 
              className="form-control" 
              value={formData.subject} 
              onChange={handleChange} 
              required 
            />
          </div>
          
          <div className="form-group">
            <label>Customer Email</label>
            <input 
              type="email" 
              name="customerEmail" 
              className="form-control" 
              value={formData.customerEmail} 
              onChange={handleChange} 
              required 
            />
          </div>

          <div className="form-group">
            <label>Priority</label>
            <select 
              name="priority" 
              className="form-control" 
              value={formData.priority} 
              onChange={handleChange}
            >
              <option value="low">Low (72h SLA)</option>
              <option value="medium">Medium (24h SLA)</option>
              <option value="high">High (4h SLA)</option>
              <option value="urgent">Urgent (1h SLA)</option>
            </select>
          </div>
          
          <div className="form-group">
            <label>Description</label>
            <textarea 
              name="description" 
              className="form-control" 
              rows="4" 
              value={formData.description} 
              onChange={handleChange} 
              required 
            ></textarea>
          </div>
          
          <div className="modal-actions">
            <button type="button" className="btn btn-secondary" onClick={onClose} disabled={loading}>
              Cancel
            </button>
            <button type="submit" className="btn" disabled={loading}>
              {loading ? 'Creating...' : 'Create Ticket'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default TicketForm;
