import React, { useState, useEffect } from 'react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

function StatsBlob({ refreshTrigger }) {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const res = await fetch(`${API_URL}/tickets/stats`);
        if (res.ok) {
          const data = await res.json();
          setStats(data);
        }
      } catch (err) {
        console.error("Failed to fetch stats", err);
      }
    };
    fetchStats();
  }, [refreshTrigger]);

  if (!stats) return null;

  return (
    <div className="stats-blob" style={{ background: 'var(--column-bg)', padding: '1rem', borderRadius: 'var(--radius-lg)', marginBottom: '1rem', display: 'flex', gap: '2rem', border: '1px solid var(--card-border)' }}>
      <div>
        <h4 className="text-muted text-xs uppercase mb-1">Status</h4>
        <div className="flex gap-2">
          <span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>Open: {stats.byStatus.open}</span>
          <span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>In Prog: {stats.byStatus.in_progress}</span>
          <span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>Res: {stats.byStatus.resolved}</span>
          <span className="badge" style={{background: 'rgba(255,255,255,0.1)'}}>Closed: {stats.byStatus.closed}</span>
        </div>
      </div>
      <div>
        <h4 className="text-muted text-xs uppercase mb-1">Priority</h4>
        <div className="flex gap-2">
          <span className="badge priority-urgent">Urg: {stats.byPriority.urgent}</span>
          <span className="badge priority-high">High: {stats.byPriority.high}</span>
          <span className="badge priority-medium">Med: {stats.byPriority.medium}</span>
          <span className="badge priority-low">Low: {stats.byPriority.low}</span>
        </div>
      </div>
      <div style={{ marginLeft: 'auto' }}>
        <h4 className="text-muted text-xs uppercase mb-1">Active Breaches</h4>
        <div className="flex gap-2">
          <span className="badge priority-urgent" style={{fontSize: '1rem', padding: '0.2rem 1rem'}}>{stats.breachedSlaOpen}</span>
        </div>
      </div>
    </div>
  );
}

export default StatsBlob;
