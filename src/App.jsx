import React, { useState, useEffect } from 'react';
// Importação de componentes simulados ou modularizados
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import FlightManagement from './components/FlightManagement';
import Reports from './components/Reports';

export default function App() {
  const [user, setUser] = useState(null);
  const [currentTab, setCurrentTab] = useState('dashboard');
  const [flights, setFlights] = useState([]);

  // Simulação de carregamento inicial ou verificação de sessão
  useEffect(() => {
    const savedUser = localStorage.getItem('can_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('can_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('can_user');
  };

  if (!user) {
    return <Login onLogin={handleLogin} />;
  }

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Barra de Navegação Superior */}
      <header className="bg-blue-900 text-white shadow-md p-4 flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h1 className="text-xl font-bold">POSTO CAN BR - SBBR</h1>
          <span className="text-sm bg-blue-800 px-2 py-1 rounded">
            Perfil: {user.role} ({user.username})
          </span>
        </div>
        <nav className="flex space-x-4">
          <button 
            onClick={() => setCurrentTab('dashboard')} 
            className={`px-3 py-1 rounded ${currentTab === 'dashboard' ? 'bg-blue-700 font-semibold' : 'hover:bg-blue-800'}`}
          >
            Dashboard
          </button>
          <button 
            onClick={() => setCurrentTab('flights')} 
            className={`px-3 py-1 rounded ${currentTab === 'flights' ? 'bg-blue-700 font-semibold' : 'hover:bg-blue-800'}`}
          >
            Gestão de Voos
          </button>
          <button 
            onClick={() => setCurrentTab('reports')} 
            className={`px-3 py-1 rounded ${currentTab === 'reports' ? 'bg-blue-700 font-semibold' : 'hover:bg-blue-800'}`}
          >
            Relatórios
          </button>
          <button 
            onClick={handleLogout} 
            className="bg-red-600 px-3 py-1 rounded hover:bg-red-700 ml-4"
          >
            Sair
          </button>
        </nav>
      </header>

      {/* Conteúdo Principal Dinâmico */}
      <main className="flex-1 p-6">
        {currentTab === 'dashboard' && <Dashboard flights={flights} />}
        {currentTab === 'flights' && <FlightManagement flights={flights} setFlights={setFlights} />}
        {currentTab === 'reports' && <Reports flights={flights} />}
      </main>

      {/* Rodapé */}
      <footer className="bg-gray-200 text-center py-3 text-sm text-gray-600 border-t">
        Comando da Aeronáutica — Base Aérea de Brasília | Sistema de Controlo Operacional CAN
      </footer>
    </div>
  );
}
