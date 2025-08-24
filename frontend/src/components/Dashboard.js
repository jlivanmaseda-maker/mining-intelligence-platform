import React from 'react';

const Dashboard = ({ user }) => {
  return (
    <div style={{ padding: '20px', background: 'red', color: 'white' }}>
      <h1>🧪 DASHBOARD FUNCIONANDO - USUARIO: {user?.email || 'No usuario'}</h1>
    </div>
  );
};

export default Dashboard;
