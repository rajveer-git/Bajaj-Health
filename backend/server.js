require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const Ticket = require('./models/Ticket');

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*', // Allow frontend URL from env or fallback to all for dev
  methods: ['GET', 'POST', 'PATCH', 'DELETE'],
}));
app.use(express.json());

// SLA Configuration (in minutes)
const SLA_MINUTES = {
  urgent: 60,       // 1 hour
  high: 4 * 60,     // 4 hours
  medium: 24 * 60,  // 24 hours
  low: 72 * 60      // 72 hours
};

// Strict Transition Rules
const VALID_TRANSITIONS = {
  open: ['in_progress'],
  in_progress: ['open', 'resolved'],
  resolved: ['in_progress', 'closed'],
  closed: ['resolved']
};

// Helper to compute age and SLA
const enrichTicketWithStats = (ticket) => {
  const t = ticket.toObject ? ticket.toObject() : ticket;
  const now = new Date();
  
  // Use resolvedAt if it exists, otherwise use current time to calculate age
  const endTime = t.resolvedAt ? new Date(t.resolvedAt) : now;
  const startTime = new Date(t.createdAt);
  
  const ageMinutes = Math.floor((endTime - startTime) / (1000 * 60));
  
  const targetSla = SLA_MINUTES[t.priority] || SLA_MINUTES['low'];
  const slaBreached = ageMinutes > targetSla;

  return {
    ...t,
    ageMinutes,
    slaBreached
  };
};

// Routes

// 1. Create Ticket
app.post('/api/tickets', async (req, res) => {
  try {
    const { subject, description, customerEmail, priority } = req.body;
    
    const newTicket = new Ticket({
      subject,
      description,
      customerEmail,
      priority: priority || 'low',
      status: 'open'
    });

    const savedTicket = await newTicket.save();
    res.status(201).json(enrichTicketWithStats(savedTicket));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 2. List Tickets (with optional filters)
app.get('/api/tickets', async (req, res) => {
  try {
    const { status, priority, breachedSla } = req.query;
    
    // Build DB query for direct fields
    const query = {};
    if (status) query.status = status;
    if (priority) query.priority = priority;

    const tickets = await Ticket.find(query).sort({ createdAt: -1 });
    
    // Dynamically compute ageMinutes and slaBreached
    let enrichedTickets = tickets.map(enrichTicketWithStats);
    
    // Filter by derived field breachedSla if requested
    if (breachedSla === 'true') {
      enrichedTickets = enrichedTickets.filter(t => t.slaBreached);
    }
    
    res.json(enrichedTickets);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Update Ticket (Enforce Transitions)
app.patch('/api/tickets/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const ticketId = req.params.id;

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ error: 'Ticket not found' });

    if (status) {
      // Validate transition
      const currentStatus = ticket.status;
      if (currentStatus !== status) {
        if (!VALID_TRANSITIONS[currentStatus].includes(status)) {
          return res.status(400).json({ 
            error: `Invalid transition from ${currentStatus} to ${status}. Valid next states: ${VALID_TRANSITIONS[currentStatus].join(', ')}` 
          });
        }
        
        ticket.status = status;
        
        // Handle resolvedAt timestamp
        if (status === 'resolved' || status === 'closed') {
          if (!ticket.resolvedAt) {
            ticket.resolvedAt = new Date();
          }
        } else {
          // If moved back to open or in_progress, reset resolvedAt
          ticket.resolvedAt = null;
        }
      }
    }

    // Allow updating other fields if needed (omitted for strictness, but let's allow priority)
    if (req.body.priority) ticket.priority = req.body.priority;

    const updatedTicket = await ticket.save();
    res.json(enrichTicketWithStats(updatedTicket));
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// 4. Delete Ticket
app.delete('/api/tickets/:id', async (req, res) => {
  try {
    const deletedTicket = await Ticket.findByIdAndDelete(req.params.id);
    if (!deletedTicket) return res.status(404).json({ error: 'Ticket not found' });
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Stats Endpoint
app.get('/api/tickets/stats', async (req, res) => {
  try {
    const tickets = await Ticket.find();
    const enriched = tickets.map(enrichTicketWithStats);
    
    const stats = {
      total: enriched.length,
      byStatus: {
        open: enriched.filter(t => t.status === 'open').length,
        in_progress: enriched.filter(t => t.status === 'in_progress').length,
        resolved: enriched.filter(t => t.status === 'resolved').length,
        closed: enriched.filter(t => t.status === 'closed').length
      },
      byPriority: {
        urgent: enriched.filter(t => t.priority === 'urgent').length,
        high: enriched.filter(t => t.priority === 'high').length,
        medium: enriched.filter(t => t.priority === 'medium').length,
        low: enriched.filter(t => t.priority === 'low').length
      },
      // Only count SLA-breached tickets that are currently open/in-progress
      breachedSlaOpen: enriched.filter(t => t.slaBreached && (t.status === 'open' || t.status === 'in_progress')).length
    };

    res.json(stats);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Database Connection & Server Start
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

if (MONGODB_URI) {
  mongoose.connect(MONGODB_URI)
    .then(() => {
      console.log('Connected to MongoDB');
      app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
    })
    .catch(err => {
      console.error('MongoDB connection error:', err);
      process.exit(1);
    });
} else {
  console.warn('MONGODB_URI is not defined. Server is NOT starting. Please add it to your .env file or environment variables.');
}
