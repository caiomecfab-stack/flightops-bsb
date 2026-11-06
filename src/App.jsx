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
  ShieldCheck,
  Menu,
  ChevronLeft,
  ChevronRight,
  Database
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  // Lista de aeronaves FAB (expansível)
  const [fabAircrafts, setFabAircrafts] = useState([
    'C-95 (Bandeirante)', 
    'C-97 (Brasília)', 
    'C-98 (Caravan)', 
    'KC-390', 
    'C-105 (Amazonas)', 
    'H-60 (Black Hawk)'
  ]);

  const [newAircraftInput, setNewAircraftInput] = useState('');

  // Estados dos Filtros do Dashboard/Painel
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
      route: 'SBBR-SBGO',
      date: '2026-06-06',
      callTime: '1330',
      takeoffTime: '1400',
      realTime: '1420',
      paxWeight: 960,
      bagWeight: 240,
      totalWeight: 1200,
      bagCount: 14,
      originalList: ['JOAO SILVA', 'MARIA OLIVEIRA', 'CARLOS SOUZA'],
      embarkedList: ['JOAO SILVA', 'MARIA OLIVEIRA']
    }
  ]);

  // Estado para Criar Novo Voo (Matrícula não obrigatória)
  const [newFlight, setNewFlight] = useState({
    aircraft: fabAircrafts[0],
    matricula: '',
    route: '',
    date: new Date().toISOString().split('T')[0],
    callTime: '',
    takeoffTime: '',
    realTime: '',
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

  // Pré-cálculo em tempo real para o formulário de Adicionar Voo (Copiar/Colar)
  const formOriginalList = newFlight.originalText.split('\n').map(s => s.trim().toUpperCase()).filter(Boolean);
  const formEmbarkedList = newFlight.embarkedText.split('\n').map(s => s.trim().toUpperCase()).filter(Boolean);
  const formTotalPrev = formOriginalList.length;
  const formTotalEmb = formEmbarkedList.length;
  const formFaltas = Math.max(0, formTotalPrev - formTotalEmb);
  const formExtras = Math.max(0, formTotalEmb - formTotalPrev);
  const formPercFaltas = formTotalPrev > 0 ? ((formFaltas / formTotalPrev) * 100).toFixed(1) : '0.0';

  const handleAddAircraft = (e) => {
    e.preventDefault();
    if (!newAircraftInput.trim()) return;
    const upperName = newAircraftInput.trim().toUpperCase();
    if (!fabAircrafts.includes(upperName)) {
      setFabAircrafts([...fabAircrafts, upperName]);
    }
    setNewAircraftInput('');
    alert('Nova aeronave adicionada com sucesso!');
  };

  const handleAddFlight = (e) => {
    e.preventDefault();

    const flightToAdd = {
      id: `FL-00${flightList.length + 1}`,
      aircraft: newFlight.aircraft,
      matricula: newFlight.matricula.toUpperCase(),
      route: newFlight.route.toUpperCase(),
      date: newFlight.date,
      callTime: newFlight.callTime,
      takeoffTime: newFlight.takeoffTime,
      realTime: newFlight.realTime,
      paxWeight: Number(newFlight.paxWeight) || 0,
      bagWeight: Number(newFlight.bagWeight) || 0,
      totalWeight: (Number(newFlight.paxWeight) || 0) + (Number(newFlight.bagWeight) || 0),
      bagCount: Number(newFlight.bagCount) || 0,
      originalList: formOriginalList,
      embarkedList: formEmbarkedList
    };

    setFlightList([flightToAdd, ...flightList]);
    setNewFlight({
      aircraft: fabAircrafts[0],
      matricula: '',
      route: '',
      date: new Date().toISOString().split('T')[0],
      callTime: '',
      takeoffTime: '',
      realTime: '',
      paxWeight: '',
      bagWeight: '',
      bagCount: '',
      originalText: '',
      embarkedText: ''
    });
    setActiveTab('panel');
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

  const totalWeightAll = filteredFlights.reduce((acc, f) => acc + f.totalWeight, 0);
  const totalPaxAll = filteredFlights.reduce((acc, f) => acc + (f.originalList.length || 0), 0);
  const totalFlightsCount = filteredFlights.length;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans uppercase">
      {/* Header */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 flex items-center justify-between shadow-md">
        <div className="flex items-center space-x-3">
          <button 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-slate-400 hover:text-white p-1 rounded-lg bg-slate-800/60 border border-slate-700 transition-colors"
            title="Ocultar/Exibir Menu Lateral"
          >
            <Menu className="w-5 h-5" />
          </button>
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
        {/* Sidebar Retrátil */}
        {sidebarOpen && (
          <aside className="w-64 bg-slate-900/90 border-r border-slate-800 p-4 flex flex-col space-y-2 transition-all duration-300">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${activeTab === 'dashboard' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard (Gráficos)</span>
            </button>

            <button 
              onClick={() => setActiveTab('panel')}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${activeTab === 'panel' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Database className="w-4 h-4" />
              <span>Painel de Voos</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('new')}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${activeTab === 'new' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <PlusCircle className="w-4 h-4" />
              <span>Adicionar Voo</span>
            </button>

            <button 
              onClick={() => setActiveTab('aircrafts')}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${activeTab === 'aircrafts' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Plane className="w-4 h-4" />
              <span>Adicionar Aeronave</span>
            </button>

            <div className="mt-auto pt-4 border-t border-slate-800">
              <button 
                onClick={() => setSidebarOpen(false)}
                className="w-full flex items-center justify-center space-x-2 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>Ocultar Menu</span>
              </button>
            </div>
          </aside>
        )}

        {/* Content Area */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950 space-y-6">
          
          {/* Menu de Abas Alternativo se Sidebar Fechada */}
          {!sidebarOpen && (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
              <button 
                onClick={() => setSidebarOpen(true)}
                className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700"
                title="Mostrar Menu"
              >
                <Menu className="w-4 h-4" />
              </button>
              <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'dashboard' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('panel')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'panel' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Painel</button>
              <button onClick={() => setActiveTab('new')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'new' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Adicionar Voo</button>
              <button onClick={() => setActiveTab('aircrafts')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'aircrafts' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Aeronaves</button>
            </div>
          )}

          {/* BARRA DE FILTROS COMUM PARA DASHBOARD E PAINEL */}
          <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow space-y-4">
            <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold tracking-wider">
              <Filter className="w-4 h-4" />
              <span>Filtros Operacionais — Posto PR</span>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">Aeronave FAB</label>
                <select 
                  value={filterAircraft} 
                  onChange={(e) => setFilterAircraft(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white uppercase font-sans"
                >
                  <option value="ALL">TODAS AS AERONAVES</option>
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
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Data Final</label>
                <input 
                  type="date" 
                  value={filterEndDate}
                  onChange={(e) => setFilterEndDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Data Específica</label>
                <input 
                  type="date" 
                  value={filterDate}
                  onChange={(e) => setFilterDate(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-sans"
                />
              </div>

              <div>
                <label className="block text-slate-400 mb-1">Mês / Ano</label>
                <input 
                  type="month" 
                  value={filterMonthYear}
                  onChange={(e) => setFilterMonthYear(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-sans"
                />
              </div>
            </div>
          </div>

          {/* 1. DASHBOARD EXCLUSIVO COM GRÁFICOS E MÉTRICAS */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow space-y-3">
                  <div className="flex items-center justify-between text-slate-300 text-xs font-bold">
                    <span className="flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-sky-400" /> TOTAL DE VOOS FILTRADOS</span>
                    <span className="text-sky-400 font-mono text-base">{totalFlightsCount}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden p-0.5 border border-slate-800">
                    <div className="bg-sky-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, totalFlightsCount * 10)}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500">VOLUME OPERACIONAL ATIVO NO PERÍODO.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow space-y-3">
                  <div className="flex items-center justify-between text-slate-300 text-xs font-bold">
                    <span className="flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-emerald-400" /> TOTAL DE PASSAGEIROS (PAX)</span>
                    <span className="text-emerald-400 font-mono text-base">{totalPaxAll}</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden p-0.5 border border-slate-800">
                    <div className="bg-emerald-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, totalPaxAll * 2)}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500">SOMA DE EFETIVO PREVISTO TRANSPORTADO.</p>
                </div>

                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow space-y-3">
                  <div className="flex items-center justify-between text-slate-300 text-xs font-bold">
                    <span className="flex items-center"><BarChart3 className="w-4 h-4 mr-2 text-amber-400" /> PESO TOTAL TRANSPORTADO</span>
                    <span className="text-amber-400 font-mono text-base">{totalWeightAll} KG</span>
                  </div>
                  <div className="w-full bg-slate-950 rounded-full h-4 overflow-hidden p-0.5 border border-slate-800">
                    <div className="bg-amber-500 h-full rounded-full transition-all duration-500" style={{ width: `${Math.min(100, totalWeightAll / 50)}%` }}></div>
                  </div>
                  <p className="text-[10px] text-slate-500">CARGA COMBINADA (PAX + BAGAGEM).</p>
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow text-center space-y-3">
                <h3 className="text-sm font-bold text-white tracking-wide">INDICADORES GRÁFICOS DO POSTO PR</h3>
                <p className="text-xs text-slate-400">OS GRÁFICOS ACIMA DEMONSTRAM O FLUXO EM TEMPO REAL CONFORME OS FILTROS SELECIONADOS NA BARRA SUPERIOR.</p>
              </div>
            </div>
          )}

          {/* 2. PAINEL DE VOOS (TABELA SEPARADA) */}
          {activeTab === 'panel' && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex justify-between items-center">
                <h2 className="text-xs font-bold text-white tracking-wider">PAINEL DE REGISTO DE VOOS — POSTO PR</h2>
                <span className="text-xs text-slate-400 font-mono">{filteredFlights.length} REGISTOS</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs font-mono">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 uppercase border-b border-slate-800">
                      <th className="p-3">AERONAVE</th>
                      <th className="p-3">MATRÍCULA</th>
                      <th className="p-3">ROTA</th>
                      <th className="p-3">DATA</th>
                      <th className="p-3">CHAMADA</th>
                      <th className="p-3">DECOLAGEM</th>
                      <th className="p-3">HORA REAL</th>
                      <th className="p-3 text-center">PAX</th>
                      <th className="p-3 text-center">PESO PAX</th>
                      <th className="p-3 text-center">BAG. (KG)</th>
                      <th className="p-3 text-center">TOTAL (KG)</th>
                      <th className="p-3 text-center">QTD BAG.</th>
                      <th className="p-3 text-center">FALTAS</th>
                      <th className="p-3 text-center">EXTRAS</th>
                      <th className="p-3 text-center">% FALTAS</th>
                      <th className="p-3 text-right">AÇÃO</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800">
                    {filteredFlights.map((f) => {
                      const originalArr = f.originalList || [];
                      const embarkedArr = f.embarkedList || [];
                      const totalPrevisto = originalArr.length;
                      const totalEmbarcadoReal = embarkedArr.length;
                      
                      const faltas = Math.max(0, totalPrevisto - totalEmbarcadoReal);
                      const extras = Math.max(0, totalEmbarcadoReal - totalPrevisto);
                      const percFaltas = totalPrevisto > 0 ? ((faltas / totalPrevisto) * 100).toFixed(1) : '0.0';

                      return (
                        <tr key={f.id} className="hover:bg-slate-800/40">
                          <td className="p-3 text-sky-400 font-bold">{f.aircraft}</td>
                          <td className="p-3 text-white font-bold">{f.matricula || 'N/D'}</td>
                          <td className="p-3 text-slate-300">{f.route}</td>
                          <td className="p-3 text-slate-300">{f.date}</td>
                          <td className="p-3 text-slate-300">{f.callTime || '-'}</td>
                          <td className="p-3 text-slate-300">{f.takeoffTime || '-'}</td>
                          <td className="p-3 text-slate-300">{f.realTime || '-'}</td>
                          <td className="p-3 text-center text-white">{totalPrevisto}</td>
                          <td className="p-3 text-center text-slate-300">{f.paxWeight} KG</td>
                          <td className="p-3 text-center text-slate-300">{f.bagWeight} KG</td>
                          <td className="p-3 text-center font-bold text-sky-300">{f.totalWeight} KG</td>
                          <td className="p-3 text-center text-slate-300">{f.bagCount}</td>
                          <td className="p-3 text-center text-amber-400 font-bold">{faltas}</td>
                          <td className="p-3 text-center text-emerald-400 font-bold">{extras}</td>
                          <td className="p-3 text-center text-rose-400">{percFaltas}%</td>
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
          )}

          {/* 3. ADICIONAR AERONAVE */}
          {activeTab === 'aircrafts' && (
            <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
              <h2 className="text-xs font-bold text-white flex items-center tracking-wider">
                <Plane className="w-4 h-4 mr-2 text-sky-400" /> REGISTAR NOVA AERONAVE FAB
              </h2>
              <form onSubmit={handleAddAircraft} className="space-y-4 text-xs">
                <div>
                  <label className="block text-slate-400 mb-1 font-sans">MODELO DA AERONAVE</label>
                  <input 
                    type="text" 
                    required
                    placeholder="EX: C-130 HÉRCULES"
                    value={newAircraftInput}
                    onChange={(e) => setNewAircraftInput(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white uppercase font-sans"
                  />
                </div>
                <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-2.5 rounded-lg transition-colors">
                  ADICIONAR AERONAVE
                </button>
              </form>

              <div className="pt-4 border-t border-slate-800">
                <h3 className="text-xs font-bold text-slate-300 mb-3 tracking-wider">AERONAVES REGISTRADAS:</h3>
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

          {/* 4. ADICIONAR VOO (MATRÍCULA NÃO OBRIGATÓRIA, CAIXA ALTA E RELATÓRIO DINÂMICO ABAIXO) */}
          {activeTab === 'new' && (
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
              <h2 className="text-xs font-bold text-white flex items-center tracking-wider">
                <PlusCircle className="w-4 h-4 mr-2 text-sky-400" /> ADICIONAR VOO — POSTO PR
              </h2>
              
              <form onSubmit={handleAddFlight} className="space-y-6 text-xs font-sans">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-slate-400 mb-1">TIPO DE AERONAVE FAB</label>
                    <select 
                      value={newFlight.aircraft}
                      onChange={(e) => setNewFlight({ ...newFlight, aircraft: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white uppercase"
                    >
                      {fabAircrafts.map((ac, idx) => (
                        <option key={idx} value={ac}>{ac}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">MATRÍCULA (NÃO OBRIGATÓRIA)</label>
                    <input 
                      type="text" 
                      placeholder="EX: FAB 2310"
                      value={newFlight.matricula}
                      onChange={(e) => setNewFlight({ ...newFlight, matricula: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">ROTA (EX: SBBR-SBGO)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="SBBR-SBGO"
                      value={newFlight.route}
                      onChange={(e) => setNewFlight({ ...newFlight, route: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">DATA DO VOO</label>
                    <input 
                      type="date" 
                      required
                      value={newFlight.date}
                      onChange={(e) => setNewFlight({ ...newFlight, date: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">HORA DE CHAMADA</label>
                    <input 
                      type="text" 
                      placeholder="1330"
                      value={newFlight.callTime}
                      onChange={(e) => setNewFlight({ ...newFlight, callTime: formatTimeInput(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">HORA DE DECOLAGEM</label>
                    <input 
                      type="text" 
                      placeholder="1400"
                      value={newFlight.takeoffTime}
                      onChange={(e) => setNewFlight({ ...newFlight, takeoffTime: formatTimeInput(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">HORA REAL</label>
                    <input 
                      type="text" 
                      placeholder="1420"
                      value={newFlight.realTime}
                      onChange={(e) => setNewFlight({ ...newFlight, realTime: formatTimeInput(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">PESO DE PAX (KG)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={newFlight.paxWeight}
                      onChange={(e) => setNewFlight({ ...newFlight, paxWeight: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">PESO DE BAGAGEM (KG)</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={newFlight.bagWeight}
                      onChange={(e) => setNewFlight({ ...newFlight, bagWeight: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">TOTAL DE PESO (AUTO: PAX + BAG.)</label>
                    <input 
                      type="text" 
                      disabled
                      value={`${(Number(newFlight.paxWeight) || 0) + (Number(newFlight.bagWeight) || 0)} KG`}
                      className="w-full bg-slate-950/50 border border-slate-800 rounded-lg p-2.5 text-sky-400 font-mono font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">QUANTIDADE DE BAGAGENS</label>
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
                    <label className="block text-slate-300 font-semibold flex items-center uppercase">
                      <FileSpreadsheet className="w-4 h-4 mr-1 text-sky-400" /> 1. COPIAR & COLAR RELAÇÃO PRINCIPAL
                    </label>
                    <textarea 
                      rows="5"
                      placeholder="JOÃO DA SILVA&#10;MARIA OLIVEIRA&#10;CARLOS SOUZA"
                      value={newFlight.originalText}
                      onChange={(e) => setNewFlight({ ...newFlight, originalText: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono text-xs uppercase"
                    ></textarea>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-300 font-semibold flex items-center uppercase">
                      <Users className="w-4 h-4 mr-1 text-emerald-400" /> 2. COPIAR & COLAR EFETIVAMENTE EMBARCADOS
                    </label>
                    <textarea 
                      rows="5"
                      placeholder="JOÃO DA SILVA&#10;MARIA OLIVEIRA&#10;NOVO PASSAGEIRO"
                      value={newFlight.embarkedText}
                      onChange={(e) => setNewFlight({ ...newFlight, embarkedText: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono text-xs uppercase"
                    ></textarea>
                  </div>
                </div>

                {/* RELATÓRIO DINÂMICO DE PASSAGEIROS ABAIXO DAS CAIXAS */}
                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-3 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">TOTAL PREVISTO</span>
                    <span className="text-base font-bold text-white">{formTotalPrev}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">EMBARCADOS</span>
                    <span className="text-base font-bold text-sky-400">{formTotalEmb}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">FALTAS</span>
                    <span className="text-base font-bold text-amber-400">{formFaltas}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">EXTRAS (+)</span>
                    <span className="text-base font-bold text-emerald-400">{formExtras}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">% FALTAS</span>
                    <span className="text-base font-bold text-rose-400">{formPercFaltas}%</span>
                  </div>
                </div>

                <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg transition-colors mt-4 tracking-wider">
                  SALVAR VOY E GERAR RELATÓRIO DO POSTO PR
                </button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
