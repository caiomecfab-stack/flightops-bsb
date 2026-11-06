import React, { useState } from 'react';
import { 
  Plane, 
  ShieldAlert, 
  Radio, 
  CloudSun, 
  Activity, 
  PlusCircle, 
  Filter, 
  Calendar, 
  Users, 
  CheckCircle2, 
  AlertTriangle,
  Trash2
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Lista de aeronaves operadas pela FAB
  const fabAircrafts = ['C-95 (Bandeirante)', 'C-97 (Brasília)', 'C-98 (Caravan)', 'KC-390', 'C-105 (Amazonas)', 'H-60 (Black Hawk)'];

  // Estados dos Filtros
  const [filterAircarft, setFilterAircraft] = useState('ALL');
  const [filterProject, setFilterProject] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Estado dos Voos com os dados de Passageiros e Projetos
  const [flightList, setFlightList] = useState([
    { 
      id: 'FL-001', 
      callsign: 'BRASÍLIA 01', 
      aircraft: 'C-95 (Bandeirante)', 
      project: 'Operação K-BSB', 
      origin: 'SBBR', 
      dest: 'SBGO', 
      date: '2026-06-06',
      time: '1425', 
      paxOriginal: 12, 
      paxEmbarked: 10,
      status: 'Em Aproximação' 
    },
    { 
      id: 'FL-002', 
      callsign: 'FAB 2310', 
      aircraft: 'C-98 (Caravan)', 
      project: 'Missão Amazônia', 
      origin: 'SBBR', 
      dest: 'SBCG', 
      date: '2026-06-06',
      time: '1432', 
      paxOriginal: 8, 
      paxEmbarked: 9,
      status: 'Taxiando' 
    }
  ]);

  // Estado para Criar Novo Voo
  const [newFlight, setNewFlight] = useState({
    callsign: '',
    aircraft: 'C-95 (Bandeirante)',
    project: '',
    origin: 'SBBR',
    dest: '',
    date: new Date().toISOString().split('T')[0],
    time: '',
    paxOriginal: '',
    paxEmbarked: ''
  });

  // Função para formatar a hora sem precisar de dois pontos (ex: 1430 -> 14:30)
  const handleTimeChange = (e) => {
    let val = e.target.value.replace(/\D/g, '');
    if (val.length > 4) val = val.slice(0, 4);
    if (val.length >= 3) {
      val = val.slice(0, 2) + ':' + val.slice(2);
    }
    setNewFlight({ ...newFlight, time: val });
  };

  const handleAddFlight = (e) => {
    e.preventDefault();
    if (!newFlight.callsign || !newFlight.dest) return;

    const flightToAdd = {
      id: `FL-00${flightList.length + 1}`,
      ...newFlight,
      paxOriginal: Number(newFlight.paxOriginal) || 0,
      paxEmbarked: Number(newFlight.paxEmbarked) || 0,
      status: 'Programado'
    };

    setFlightList([flightToAdd, ...flightList]);
    setNewFlight({
      callsign: '',
      aircraft: 'C-95 (Bandeirante)',
      project: '',
      origin: 'SBBR',
      dest: '',
      date: new Date().toISOString().split('T')[0],
      time: '',
      paxOriginal: '',
      paxEmbarked: ''
    });
    setActiveTab('flights');
  };

  const handleDeleteFlight = (id) => {
    setFlightList(flightList.filter(f => f.id !== id));
  };

  // Filtragem avançada de voos
  const filteredFlights = flightList.filter(flight => {
    const matchAircraft = filterAircarft === 'ALL' || flight.aircraft === filterAircarft;
    const matchProject = !filterProject || flight.project.toLowerCase().includes(filterProject.toLowerCase());
    const matchStartDate = !startDate || flight.date >= startDate;
    const matchEndDate = !endDate || flight.date <= endDate;
    return matchAircraft && matchProject && matchStartDate && matchEndDate;
  });

  // Cálculos automáticos de triangulação de passageiros dos voos filtrados
  const totalOriginal = filteredFlights.reduce((acc, f) => acc + f.paxOriginal, 0);
  const totalEmbarked = filteredFlights.reduce((acc, f) => acc + f.paxEmbarked, 0);
  const totalMissing = filteredFlights.reduce((acc, f) => acc + Math.max(0, f.paxOriginal - f.paxEmbarked), 0);
  const totalNew = filteredFlights.reduce((acc, f) => acc + Math.max(0, f.paxEmbarked - f.paxOriginal), 0);
  const absenceRate = totalOriginal > 0 ? ((totalMissing / totalOriginal) * 100).toFixed(1) : '0.0';

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <div className="bg-sky-600 p-2 rounded-lg text-white shadow-lg shadow-sky-900/50">
            <Plane className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-wider text-white">FLIGHTOPS <span className="text-sky-400">BSB</span></h1>
            <p className="text-xs text-slate-400">Posto K — Base Aérea de Brasília (SBBR)</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-medium">Posto K Operacional</span>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-slate-900/60 border-r border-slate-800 p-4 flex flex-col space-y-2 hidden md:flex">
          <button 
            onClick={() => setActiveTab('dashboard')}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'dashboard' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Activity className="w-4 h-4" />
            <span>Painel Principal</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('flights')}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'flights' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Plane className="w-4 h-4" />
            <span>Voos & Triangulação</span>
          </button>

          <button 
            onClick={() => setActiveTab('new')}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'new' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Adicionar Voo</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950 space-y-6">
          
          {/* Navegação por Abas Rápida */}
          <div className="flex space-x-2 border-b border-slate-800 pb-3 md:hidden">
            <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1 rounded text-xs ${activeTab === 'dashboard' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-300'}`}>Painel</button>
            <button onClick={() => setActiveTab('flights')} className={`px-3 py-1 rounded text-xs ${activeTab === 'flights' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-300'}`}>Voos</button>
            <button onClick={() => setActiveTab('new')} className={`px-3 py-1 rounded text-xs ${activeTab === 'new' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-300'}`}>Novo</button>
          </div>

          {/* PAINEL PRINCIPAL & FILTROS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Barra de Filtros FAB & Datas */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow space-y-4">
                <div className="flex items-center space-x-2 text-sky-400 text-sm font-semibold">
                  <Filter className="w-4 h-4" />
                  <span>Filtros Operacionais da FAB e Projetos</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Aeronave FAB</label>
                    <select 
                      value={filterAircarft} 
                      onChange={(e) => setFilterAircraft(e.target.value)}
                      className="w-auto min-w-[12rem] bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    >
                      <option value="ALL">Todas as Aeronaves</option>
                      {fabAircrafts.map((ac, idx) => (
                        <option key={idx} value={ac}>{ac}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Projeto</label>
                    <input 
                      type="text" 
                      placeholder="Filtrar por projeto..." 
                      value={filterProject}
                      onChange={(e) => setFilterProject(e.target.value)}
                      className="w-auto min-w-[12rem] bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Data Inicial</label>
                    <input 
                      type="date" 
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      className="w-auto min-w-[12rem] bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>

                  <div>
                    <label className="text-xs text-slate-400 block mb-1">Data Final</label>
                    <input 
                      type="date" 
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      className="w-auto min-w-[12rem] bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                    />
                  </div>
                </div>
              </div>

              {/* Cards de Triangulação de Passageiros Somados */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
                  <span className="text-xs uppercase font-semibold text-slate-400">Planilha Original</span>
                  <div className="text-2xl font-bold text-white mt-1">{totalOriginal} PAX</div>
                  <span className="text-xs text-slate-500">Total previsto</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
                  <span className="text-xs uppercase font-semibold text-slate-400">Embarcados</span>
                  <div className="text-2xl font-bold text-sky-400 mt-1">{totalEmbarked} PAX</div>
                  <span className="text-xs text-slate-500">Efetivo real</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
                  <span className="text-xs uppercase font-semibold text-slate-400">Faltas / Ausentes</span>
                  <div className="text-2xl font-bold text-amber-400 mt-1">{totalMissing} PAX</div>
                  <span className="text-xs text-amber-500">Não compareceram</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
                  <span className="text-xs uppercase font-semibold text-slate-400">Novos / Extras</span>
                  <div className="text-2xl font-bold text-emerald-400 mt-1">{totalNew} PAX</div>
                  <span className="text-xs text-emerald-500">Entrada adicional</span>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
                  <span className="text-xs uppercase font-semibold text-slate-400">% de Faltas</span>
                  <div className="text-2xl font-bold text-rose-400 mt-1">{absenceRate}%</div>
                  <span className="text-xs text-slate-500">Índice de abstenção</span>
                </div>
              </div>

              {/* Tabela de Voos */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h2 className="text-sm font-semibold text-white">Voos Registrados no Posto K</h2>
                  <span className="text-xs text-slate-400">{filteredFlights.length} voos encontrados</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 text-xs uppercase border-b border-slate-800">
                        <th className="p-3">Callsign</th>
                        <th className="p-3">Aeronave FAB</th>
                        <th className="p-3">Projeto</th>
                        <th className="p-3">Data</th>
                        <th className="p-3">Hora</th>
                        <th className="p-3 text-center">Orig. (Planilha)</th>
                        <th className="p-3 text-center">Embarcados</th>
                        <th className="p-3 text-center">Faltas</th>
                        <th className="p-3 text-center">Novos</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800 text-xs font-mono">
                      {filteredFlights.map((f) => {
                        const faltas = Math.max(0, f.paxOriginal - f.paxEmbarked);
                        const novos = Math.max(0, f.paxEmbarked - f.paxOriginal);
                        return (
                          <tr key={f.id} className="hover:bg-slate-800/40">
                            <td className="p-3 font-bold text-white">{f.callsign}</td>
                            <td className="p-3 text-sky-400">{f.aircraft}</td>
                            <td className="p-3 text-slate-300">{f.project || '-'}</td>
                            <td className="p-3 text-slate-300">{f.date}</td>
                            <td className="p-3 text-slate-300">{f.time}</td>
                            <td className="p-3 text-center text-slate-300">{f.paxOriginal}</td>
                            <td className="p-3 text-center text-sky-400 font-bold">{f.paxEmbarked}</td>
                            <td className="p-3 text-center text-amber-400">{faltas}</td>
                            <td className="p-3 text-center text-emerald-400">{novos}</td>
                            <td className="p-3 text-right">
                              <button onClick={() => handleDeleteFlight(f.id)} className="text-rose-400 hover:text-rose-300">
                                <Trash2 className="w-4 h-4 inline" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ADICIONAR VOO */}
          {activeTab === 'new' && (
            <div className="max-w-2xl bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
              <h2 className="text-base font-bold text-white flex items-center">
                <PlusCircle className="w-5 h-5 mr-2 text-sky-400" /> Registrar Novo Voo / Posto K
              </h2>
              <form onSubmit={handleAddFlight} className="space-y-4 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Callsign / Matrícula</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: FAB 2310"
                      value={newFlight.callsign}
                      onChange={(e) => setNewFlight({ ...newFlight, callsign: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Aeronave FAB</label>
                    <select 
                      value={newFlight.aircraft}
                      onChange={(e) => setNewFlight({ ...newFlight, aircraft: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    >
                      {fabAircrafts.map((ac, idx) => (
                        <option key={idx} value={ac}>{ac}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Projeto</label>
                    <input 
                      type="text" 
                      placeholder="Ex: Operação K-BSB"
                      value={newFlight.project}
                      onChange={(e) => setNewFlight({ ...newFlight, project: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Data do Voo</label>
                    <input 
                      type="date" 
                      required
                      value={newFlight.date}
                      onChange={(e) => setNewFlight({ ...newFlight, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Hora (Digite sem dois pontos, ex: 1430)</label>
                    <input 
                      type="text" 
                      placeholder="1430"
                      required
                      value={newFlight.time}
                      onChange={handleTimeChange}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Destino</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: SBGO"
                      value={newFlight.dest}
                      onChange={(e) => setNewFlight({ ...newFlight, dest: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Passageiros (Planilha Original)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="0"
                      value={newFlight.paxOriginal}
                      onChange={(e) => setNewFlight({ ...newFlight, paxOriginal: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Passageiros (Efetivamente Embarcados)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="0"
                      value={newFlight.paxEmbarked}
                      onChange={(e) => setNewFlight({ ...newFlight, paxEmbarked: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                </div>

                <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 rounded-lg transition-colors mt-4">
                  Salvar e Adicionar Voo ao Painel
                </button>
              </form>
            </div>
          )}

          {activeTab === 'flights' && (
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
              <h2 className="text-base font-bold text-white">Lista Completa de Voos e Controlo de Passageiros</h2>
              <p className="text-xs text-slate-400">Todos os dados e triangulações são calculados instantaneamente com base nas informações inseridas.</p>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                      <th className="p-3">Callsign</th>
                      <th className="p-3">Aeronave FAB</th>
                      <th className="p-3">Projeto</th>
                      <th className="p-3">Data</th>
                      <th className="p-3 text-center">Original</th>
                      <th className="p-3 text-center">Embarcados</th>
                      <th className="p-3 text-center">Faltas</th>
                      <th className="p-3 text-center">Novos</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {flightList.map(f => {
                      const faltas = Math.max(0, f.paxOriginal - f.paxEmbarked);
                      const novos = Math.max(0, f.paxEmbarked - f.paxOriginal);
                      return (
                        <tr key={f.id} className="hover:bg-slate-800/40">
                          <td className="p-3 font-bold text-white">{f.callsign}</td>
                          <td className="p-3 text-sky-400">{f.aircraft}</td>
                          <td className="p-3 text-slate-300">{f.project || '-'}</td>
                          <td className="p-3 text-slate-300">{f.date}</td>
                          <td className="p-3 text-center">{f.paxOriginal}</td>
                          <td className="p-3 text-center text-sky-400">{f.paxEmbarked}</td>
                          <td className="p-3 text-center text-amber-400">{faltas}</td>
                          <td className="p-3 text-center text-emerald-400">{novos}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
