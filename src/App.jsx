import React, { useState } from 'react';
import { 
  Plane, 
  Activity, 
  PlusCircle, 
  Filter, 
  Users, 
  Trash2,
  FileSpreadsheet,
  BarChart3,
  ShieldCheck
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  // Lista inicial de aeronaves da FAB (agora expansível)
  const [fabAircrafts, setFabAircrafts] = useState([
    'C-95 (Bandeirante)', 
    'C-97 (Brasília)', 
    'C-98 (Caravan)', 
    'KC-390', 
    'C-105 (Amazonas)', 
    'H-60 (Black Hawk)'
  ]);

  const [newAircraftInput, setNewAircraftInput] = useState('');

  // Estados dos Filtros do Dashboard
  const [filterAircraft, setFilterAircraft] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonthYear, setFilterMonthYear] = useState('');

  // Estado dos Voos
  const [flightList, setFlightList] = useState([
    { 
      id: 'FL-001', 
      aircraft: 'C-95 (Bandeirante)', 
      matricula: 'FAB 2110', 
      route: 'SBBR - SBGO',
      date: '2026-06-06',
      callTime: '1330',
      boardTime: '1400',
      finalTime: '1420',
      paxTotal: 12, 
      paxWeight: 960,
      bagWeight: 240,
      totalWeight: 1200,
      bagCount: 14,
      originalList: ['João Silva', 'Maria Oliveira', 'Carlos Souza'],
      embarkedList: ['João Silva', 'Maria Oliveira']
    }
  ]);

  // Estado para Criar Novo Voo
  const [newFlight, setNewFlight] = useState({
    aircraft: fabAircrafts[0],
    matricula: '',
    route: '',
    date: new Date().toISOString().split('T')[0],
    callTime: '',
    boardTime: '',
    finalTime: '',
    paxWeight: '',
    bagWeight: '',
    bagCount: '',
    originalText: '',
    embarkedText: ''
  });

  const formatTimeInput = (val) => {
    let clean = val.replace(/\D/g, '');
    if (clean.length > 4) clean = clean.slice(0, 4);
    if (clean.length >= 3) {
      clean = clean.slice(0, 2) + ':' + clean.slice(2);
    }
    return clean;
  };

  const handleAddAircraft = (e) => {
    e.preventDefault();
    if (!newAircraftInput.trim()) return;
    if (!fabAircrafts.includes(newAircraftInput.trim())) {
      setFabAircrafts([...fabAircrafts, newAircraftInput.trim()]);
    }
    setNewAircraftInput('');
    alert('Nova aeronave adicionada com sucesso!');
  };

  const handleAddFlight = (e) => {
    e.preventDefault();
    if (!newFlight.matricula) return;

    const originalList = newFlight.originalText.split('\n').map(s => s.trim()).filter(Boolean);
    const embarkedList = newFlight.embarkedText.split('\n').map(s => s.trim()).filter(Boolean);

    const flightToAdd = {
      id: `FL-00${flightList.length + 1}`,
      ...newFlight,
      paxTotal: originalList.length || 0,
      paxWeight: Number(newFlight.paxWeight) || 0,
      bagWeight: Number(newFlight.bagWeight) || 0,
      totalWeight: (Number(newFlight.paxWeight) || 0) + (Number(newFlight.bagWeight) || 0),
      bagCount: Number(newFlight.bagCount) || 0,
      originalList,
      embarkedList
    };

    setFlightList([flightToAdd, ...flightList]);
    setNewFlight({
      aircraft: fabAircrafts[0],
      matricula: '',
      route: '',
      date: new Date().toISOString().split('T')[0],
      callTime: '',
      boardTime: '',
      finalTime: '',
      paxWeight: '',
      bagWeight: '',
      bagCount: '',
      originalText: '',
      embarkedText: ''
    });
    setActiveTab('dashboard');
  };

  const handleDeleteFlight = (id) => {
    setFlightList(flightList.filter(f => f.id !== id));
  };

  const filteredFlights = flightList.filter(flight => {
    const matchAircraft = filterAircraft === 'ALL' || flight.aircraft === filterAircraft;
    const matchStartDate = !filterStartDate || flight.date >= filterStartDate;
    const matchEndDate = !filterEndDate || flight.date <= filterEndDate;
    const matchDate = !filterDate || flight.date === filterDate;
    const matchMonthYear = !filterMonthYear || flight.date.startsWith(filterMonthYear);
    return matchAircraft && matchStartDate && matchEndDate && matchDate && matchMonthYear;
  });

  // Totais gerais para os gráficos e métricas
  const totalWeightAll = filteredFlights.reduce((acc, f) => acc + f.totalWeight, 0);
  const totalPaxAll = filteredFlights.reduce((acc, f) => acc + (f.originalList.length || f.paxTotal), 0);
  const totalFlightsCount = filteredFlights.length;

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
            <p className="text-xs text-slate-400">Posto PR — Base Aérea de Brasília (SBBR)</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-medium">Posto PR Operacional</span>
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
            <span>Dashboard / Painel</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('new')}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'new' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Adicionar Novo Voo</span>
          </button>

          <button 
            onClick={() => setActiveTab('aircrafts')}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'aircrafts' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <Plane className="w-4 h-4" />
            <span>Adicionar Aeronave</span>
          </button>
        </aside>

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950 space-y-6">
          
          <div className="flex space-x-2 border-b border-slate-800 pb-3 md:hidden">
            <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1 rounded text-xs ${activeTab === 'dashboard' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-300'}`}>Dashboard</button>
            <button onClick={() => setActiveTab('new')} className={`px-3 py-1 rounded text-xs ${activeTab === 'new' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-300'}`}>Novo Voo</button>
            <button onClick={() => setActiveTab('aircrafts')} className={`px-3 py-1 rounded text-xs ${activeTab === 'aircrafts' ? 'bg-sky-600 text-white' : 'bg-slate-900 text-slate-300'}`}>Aeronaves</button>
          </div>

          {/* DASHBOARD PROFISSIONAL COM GRÁFICOS DE BARRA */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              
              {/* Filtros */}
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow space-y-4">
                <div className="flex items-center space-x-2 text-sky-400 text-sm font-semibold">
                  <Filter className="w-4 h-4" />
                  <span>Filtros Operacionais — Posto PR</span>
                </div>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Aeronave FAB</label>
                    <select 
                      value={filterAircraft} 
                      onChange={(e) => setFilterAircraft(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    >
                      <option value="ALL">Todas as Aeronaves</option>
                      {fabAircrafts.map((ac, idx) => (
                        <option key={idx} value={ac}>{ac}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Data Inicial</label>
                    <input 
                      type="date" 
                      value={filterStartDate}
                      onChange={(e) => setFilterStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Data Final</label>
                    <input 
                      type="date" 
                      value={filterEndDate}
                      onChange={(e) => setFilterEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Data Específica</label>
                    <input 
                      type="date" 
                      value={filterDate}
                      onChange={(e) => setFilterDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Mês / Ano</label>
                    <input 
                      type="month" 
                      value={filterMonthYear}
                      onChange={(e) => setFilterMonthYear(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white"
                    />
                  </div>
                </div>
              </div>

              {/* GRÁFICOS DE BARRA INTERATIVOS E PROFISSIONAIS */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow space-y-3">
                  <div className="flex items-center justify-between text-slate-300 text-sm font-bold">
                    <span className="flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-sky-400" /> Total de Voos Filtrados</span>
                    <span className="text-sky-400 font-mono text-lg">{totalFlightsCount}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden p-0.5 border border-slate-800">
                    <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, totalFlightsCount * 10)}%` }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500">Volume operacional ativo no período selecionado.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow space-y-3">
                  <div className="flex items-center justify-between text-slate-300 text-sm font-bold">
                    <span className="flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-emerald-400" /> Total de Passageiros (PAX)</span>
                    <span className="text-emerald-400 font-mono text-lg">{totalPaxAll}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden p-0.5 border border-slate-800">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, totalPaxAll * 2)}%` }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500">Soma de efetivo previsto transportado.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow space-y-3">
                  <div className="flex items-center justify-between text-slate-300 text-sm font-bold">
                    <span className="flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-amber-400" /> Peso Total Transportado</span>
                    <span className="text-amber-400 font-mono text-lg">{totalWeightAll} kg</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden p-0.5 border border-slate-800">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, totalWeightAll / 50)}%` }}></div>
                  </div>
                  <p className="text-[11px] text-slate-500">Carga total combinada (PAX + Bagagem).</p>
                </div>
              </div>

              {/* Tabela Detalhada com Índice de Eficiência */}
              <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
                <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                  <h2 className="text-sm font-semibold text-white">Relatório de Voos e Eficiência Operacional — Posto PR</h2>
                  <span className="text-xs text-slate-400">{filteredFlights.length} registos</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                        <th className="p-3">Aeronave</th>
                        <th className="p-3">Matrícula</th>
                        <th className="p-3">Rota</th>
                        <th className="p-3">Data</th>
                        <th className="p-3">Chamada</th>
                        <th className="p-3">Embarque</th>
                        <th className="p-3">Final</th>
                        <th className="p-3 text-center">PAX</th>
                        <th className="p-3 text-center">Peso PAX</th>
                        <th className="p-3 text-center">Bag. (kg)</th>
                        <th className="p-3 text-center">Total (kg)</th>
                        <th className="p-3 text-center">Qtd Bag.</th>
                        <th className="p-3 text-center">Faltas</th>
                        <th className="p-3 text-center">Extras</th>
                        <th className="p-3 text-center">% Eficiência</th>
                        <th className="p-3 text-right">Ação</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {filteredFlights.map((f) => {
                        const originalArr = f.originalList || [];
                        const embarkedArr = f.embarkedList || [];
                        const totalPrevisto = originalArr.length || f.paxTotal || 0;
                        const totalEmbarcadoReal = embarkedArr.length || 0;
                        
                        const faltas = Math.max(0, totalPrevisto - totalEmbarcadoReal);
                        const extras = Math.max(0, totalEmbarcadoReal - totalPrevisto);

                        // Cálculo do índice de eficiência baseado na pontualidade/fluxo das horas informadas
                        let eficiencia = 100;
                        if (f.callTime && f.boardTime && f.finalTime) {
                          const callM = parseInt(f.callTime.slice(0,2))*60 + parseInt(f.callTime.slice(2));
                          const boardM = parseInt(f.boardTime.slice(0,2))*60 + parseInt(f.boardTime.slice(2));
                          const finalM = parseInt(f.finalTime.slice(0,2))*60 + parseInt(f.finalTime.slice(2));
                          const diff = Math.abs(finalM - boardM);
                          eficiencia = Math.max(60, Math.min(100, 100 - (diff * 0.5)));
                        }

                        return (
                          <tr key={f.id} className="hover:bg-slate-800/40">
                            <td className="p-3 text-sky-400 font-semibold">{f.aircraft}</td>
                            <td className="p-3 text-white font-bold">{f.matricula}</td>
                            <td className="p-3 text-slate-300">{f.route || '-'}</td>
                            <td className="p-3 text-slate-300">{f.date}</td>
                            <td className="p-3 text-slate-300">{f.callTime || '-'}</td>
                            <td className="p-3 text-slate-300">{f.boardTime || '-'}</td>
                            <td className="p-3 text-slate-300">{f.finalTime || '-'}</td>
                            <td className="p-3 text-center text-white">{totalPrevisto}</td>
                            <td className="p-3 text-center text-slate-300">{f.paxWeight} kg</td>
                            <td className="p-3 text-center text-slate-300">{f.bagWeight} kg</td>
                            <td className="p-3 text-center font-bold text-sky-300">{f.totalWeight} kg</td>
                            <td className="p-3 text-center text-slate-300">{f.bagCount}</td>
                            <td className="p-3 text-center text-amber-400 font-bold">{faltas}</td>
                            <td className="p-3 text-center text-emerald-400 font-bold">{extras}</td>
                            <td className="p-3 text-center font-bold text-emerald-300">{eficiencia.toFixed(0)}%</td>
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

          {/* ADICIONAR NOVA AERONAVE */}
          {activeTab === 'aircrafts' && (
            <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
              <h2 className="text-base font-bold text-white flex items-center">
                <Plane className="w-5 h-5 mr-2 text-sky-400" /> Registar Nova Aeronave FAB
              </h2>
              <form onSubmit={handleAddAircraft} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1">Nome / Modelo da Aeronave (ex: C-130 Hércules)</label>
                  <input 
                    type="text" 
                    required
                    placeholder="Modelo da Aeronave"
                    value={newAircraftInput}
                    onChange={(e) => setNewAircraftInput(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white"
                  />
                </div>
                <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-2.5 rounded-lg transition-colors">
                  Adicionar Aeronave à Lista
                </button>
              </form>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-sm font-semibold text-slate-300 mb-3">Aeronaves Registradas Atualmente:</h3>
                <ul className="space-y-2 font-mono text-xs">
                  {fabAircrafts.map((ac, idx) => (
                    <li key={idx} className="bg-slate-950 p-2.5 rounded-lg border border-slate-800 flex items-center justify-between text-sky-300">
                      <span>{ac}</span>
                      <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ADICIONAR VOO COM TODOS OS CAMPOS E DUAS ABAS DE PASSAGEIROS */}
          {activeTab === 'new' && (
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
              <h2 className="text-base font-bold text-white flex items-center">
                <PlusCircle className="w-5 h-5 mr-2 text-sky-400" /> Registar Voo e Cargas — Posto PR
              </h2>
              
              <form onSubmit={handleAddFlight} className="space-y-6 text-xs">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">Tipo de Aeronave FAB</label>
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
                    <label className="block text-slate-400 mb-1">Matrícula</label>
                    <input 
                      type="text" 
                      required
                      placeholder="Ex: FAB 2310"
                      value={newFlight.matricula}
                      onChange={(e) => setNewFlight({ ...newFlight, matricula: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Rota (ex: SBBR-SBGO)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="SBBR-SBGO"
                      value={newFlight.route}
                      onChange={(e) => setNewFlight({ ...newFlight, route: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
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
                    <label className="block text-slate-400 mb-1">Hora de Chamada (ex: 1330)</label>
                    <input 
                      type="text" 
                      placeholder="1330"
                      value={newFlight.callTime}
                      onChange={(e) => setNewFlight({ ...newFlight, callTime: formatTimeInput(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Hora de Embarque (ex: 1400)</label>
                    <input 
                      type="text" 
                      placeholder="1400"
                      value={newFlight.boardTime}
                      onChange={(e) => setNewFlight({ ...newFlight, boardTime: formatTimeInput(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Hora Final (ex: 1420)</label>
                    <input 
                      type="text" 
                      placeholder="1420"
                      value={newFlight.finalTime}
                      onChange={(e) => setNewFlight({ ...newFlight, finalTime: formatTimeInput(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Peso de PAX (kg)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={newFlight.paxWeight}
                      onChange={(e) => setNewFlight({ ...newFlight, paxWeight: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Peso de Bagagem (kg)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={newFlight.bagWeight}
                      onChange={(e) => setNewFlight({ ...newFlight, bagWeight: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Quantidade de Bagagens</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={newFlight.bagCount}
                      onChange={(e) => setNewFlight({ ...newFlight, bagCount: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>
                </div>

                {/* SECÇÃO DE COPIAR E COLAR PASSAGEIROS */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                  <div className="space-y-2">
                    <label className="block text-slate-300 font-semibold flex items-center">
                      <FileSpreadsheet className="w-4 h-4 mr-1 text-sky-400" /> 1. Copiar & Colar Relação Principal (Planilha Original)
                    </label>
                    <textarea 
                      rows="5"
                      placeholder="João da Silva&#10;Maria Oliveira&#10;Carlos Souza"
                      value={newFlight.originalText}
                      onChange={(e) => setNewFlight({ ...newFlight, originalText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono text-xs"
                    ></textarea>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-300 font-semibold flex items-center">
                      <Users className="w-4 h-4 mr-1 text-emerald-400" /> 2. Copiar & Colar Passageiros que Efetivamente Embarcaram
                    </label>
                    <textarea 
                      rows="5"
                      placeholder="João da Silva&#10;Maria Oliveira&#10;Novo Passageiro"
                      value={newFlight.embarkedText}
                      onChange={(e) => setNewFlight({ ...newFlight, embarkedText: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono text-xs"
                    ></textarea>
                  </div>
                </div>

                <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-semibold py-3 rounded-lg transition-colors mt-4">
                  Salvar Voo e Gerar Relatório do Posto PR
                </button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
