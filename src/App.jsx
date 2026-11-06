import React, { useState } from 'react';
import { 
  Plane, 
  Activity, 
  PlusCircle, 
  Filter, 
  Users, 
  Trash2, 
  BarChart3, 
  ShieldCheck,
  Menu,
  ChevronLeft,
  Database,
  Scale,
  Briefcase
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);
  
  const [fabAircrafts, setFabAircrafts] = useState([
    'C-95 (BANDEIRANTE)', 
    'C-97 (BRASÍLIA)', 
    'C-98 (CARAVAN)', 
    'KC-390', 
    'C-105 (AMAZONAS)', 
    'H-60 (BLACK HAWK)'
  ]);

  const [newAircraftInput, setNewAircraftInput] = useState('');

  // Estados dos Filtros
  const [filterAircraft, setFilterAircraft] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonthYear, setFilterMonthYear] = useState('');

  // Estado dos Voos
  const [flightList, setFlightList] = useState([
    { 
      id: 'FL-001', 
      aircraft: 'C-95 (BANDEIRANTE)', 
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

  // Métricas do Dashboard
  const totalFlightsCount = filteredFlights.length;
  const totalPaxAll = filteredFlights.reduce((acc, f) => acc + (f.originalList.length || 0), 0);
  const totalPaxWeightAll = filteredFlights.reduce((acc, f) => acc + f.paxWeight, 0);
  const totalBagWeightAll = filteredFlights.reduce((acc, f) => acc + f.bagWeight, 0);
  const totalWeightAll = filteredFlights.reduce((acc, f) => acc + f.totalWeight, 0);

  // Valores máximos de referência para proporcionalidade das barras
  const maxFlights = Math.max(10, totalFlightsCount * 1.5);
  const maxPax = Math.max(50, totalPaxAll * 1.5);
  const maxPaxWeight = Math.max(3000, totalPaxWeightAll * 1.5);
  const maxBagWeight = Math.max(1000, totalBagWeightAll * 1.5);
  const maxTotalWeight = Math.max(4000, totalWeightAll * 1.5);

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
        {/* Sidebar */}
        {sidebarOpen && (
          <aside className="w-64 bg-slate-900/90 border-r border-slate-800 p-4 flex flex-col space-y-2 transition-all duration-300">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${activeTab === 'dashboard' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
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
          
          {!sidebarOpen && (
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-2 rounded-xl">
              <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                <Menu className="w-4 h-4" />
              </button>
              <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'dashboard' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('panel')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'panel' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Painel</button>
              <button onClick={() => setActiveTab('new')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'new' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Adicionar Voo</button>
              <button onClick={() => setActiveTab('aircrafts')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'aircrafts' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Aeronaves</button>
            </div>
          )}

          {/* BARRA DE FILTROS */}
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

          {/* DASHBOARD COM NOMENCLATURA SEPARADA E GRÁFICOS DE BARRAS VERTICAIS ESTILO 3D */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Total de Voos */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl space-y-4 flex flex-col justify-between">
                  {/* Nomenclatura separada no topo */}
                  <div className="text-center space-y-1 border-b border-slate-800 pb-3">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider block">TOTAL DE VOOS</span>
                    <span className="text-2xl font-extrabold text-sky-400 font-mono">{totalFlightsCount}</span>
                  </div>
                  {/* Gráfico 3D Vertical */}
                  <div className="h-44 bg-slate-950/80 rounded-xl border border-slate-800 flex items-end justify-center p-4 relative shadow-inner">
                    <div className="w-16 bg-gradient-to-t from-sky-700 via-sky-500 to-cyan-300 rounded-t-md transition-all duration-700 shadow-xl shadow-sky-500/30 flex items-center justify-center text-xs font-bold text-slate-950 font-mono" style={{ height: `${Math.max(20, (totalFlightsCount / maxFlights) * 100)}%` }}>
                      {totalFlightsCount}
                    </div>
                  </div>
                </div>

                {/* 2. Total de Passageiros (PAX) */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="text-center space-y-1 border-b border-slate-800 pb-3">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider block">TOTAL DE PASSAGEIROS (PAX)</span>
                    <span className="text-2xl font-extrabold text-emerald-400 font-mono">{totalPaxAll}</span>
                  </div>
                  <div className="h-44 bg-slate-950/80 rounded-xl border border-slate-800 flex items-end justify-center p-4 relative shadow-inner">
                    <div className="w-16 bg-gradient-to-t from-emerald-700 via-emerald-500 to-teal-300 rounded-t-md transition-all duration-700 shadow-xl shadow-emerald-500/30 flex items-center justify-center text-xs font-bold text-slate-950 font-mono" style={{ height: `${Math.max(20, (totalPaxAll / maxPax) * 100)}%` }}>
                      {totalPaxAll}
                    </div>
                  </div>
                </div>

                {/* 3. Peso Total PAX */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="text-center space-y-1 border-b border-slate-800 pb-3">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider block">PESO TOTAL PAX</span>
                    <span className="text-2xl font-extrabold text-indigo-400 font-mono">{totalPaxWeightAll} KG</span>
                  </div>
                  <div className="h-44 bg-slate-950/80 rounded-xl border border-slate-800 flex items-end justify-center p-4 relative shadow-inner">
                    <div className="w-16 bg-gradient-to-t from-indigo-700 via-indigo-500 to-blue-300 rounded-t-md transition-all duration-700 shadow-xl shadow-indigo-500/30 flex items-center justify-center text-xs font-bold text-slate-950 font-mono" style={{ height: `${Math.max(20, (totalPaxWeightAll / maxPaxWeight) * 100)}%` }}>
                      {totalPaxWeightAll}
                    </div>
                  </div>
                </div>

                {/* 4. Peso Total de Bagagem */}
                <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl shadow-xl space-y-4 flex flex-col justify-between">
                  <div className="text-center space-y-1 border-b border-slate-800 pb-3">
                    <span className="text-[11px] font-bold text-slate-400 tracking-wider block">PESO TOTAL DE BAGAGEM</span>
                    <span className="text-2xl font-extrabold text-amber-400 font-mono">{totalBagWeightAll} KG</span>
                  </div>
                  <div className="h-44 bg-slate-950/80 rounded-xl border border-slate-800 flex items-end justify-center p-4 relative shadow-inner">
                    <div className="w-16 bg-gradient-to-t from-amber-700 via-amber-500 to-yellow-300 rounded-t-md transition-all duration-700 shadow-xl shadow-amber-500
