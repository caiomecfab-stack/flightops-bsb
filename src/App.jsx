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
  Briefcase,
  FileSpreadsheet,
  Edit3,
  Zap,
  Printer,
  UserPlus,
  Lock,
  LogOut,
  UserCheck,
  Key,
  MapPin,
  Calendar,
  UserCheck2,
  CheckSquare,
  Square
} from 'lucide-react';

export default function App() {
  const [currentUser, setCurrentUser] = useState({ name: 'ADMINISTRADOR', role: 'ADMIN' });
  const [authView, setAuthView] = useState('login');
  const [loginInput, setLoginInput] = useState({ user: '', pass: '' });
  
  const [usersList, setUsersList] = useState([
    { name: 'ADMINISTRADOR', pass: 'admin123', role: 'ADMIN' }
  ]);
  const [newUserForm, setNewUserForm] = useState({ name: '', pass: '', role: 'OPERADOR' });
  const [adminNewPass, setAdminNewPass] = useState('');

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

  // Estados dos Filtros Gerais
  const [filterAircraft, setFilterAircraft] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonthYear, setFilterMonthYear] = useState('');

  // Filtro Específico do Dashboard por Localidade/Destino
  const [dashboardDestinationFilter, setDashboardDestinationFilter] = useState('ALL');
  
  // Novo Filtro de Desembarque no Dashboard
  const [dashboardDebarkFilter, setDashboardDebarkFilter] = useState('ALL');

  // Filtros de Relatório
  const [reportAircraft, setReportAircraft] = useState('ALL');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSpecificDate, setReportSpecificDate] = useState('');

  // Estados da Nova Aba Desembarque
  const [debarkFilterDate, setDebarkFilterDate] = useState('');
  const [debarkFilterAircraft, setDebarkFilterAircraft] = useState('ALL');
  const [selectedDebarkFlightIds, setSelectedDebarkFlightIds] = useState([]);
  const [debarkInputs, setDebarkInputs] = useState({}); // Armazena { [flightId]: quantidadeDesembarcados }

  // Estado dos Voos
  const [flightList, setFlightList] = useState([
    { 
      id: 'FL-001', 
      aircraft: 'C-97 (BRASÍLIA)', 
      matricula: 'FAB 2110', 
      route: 'SBBR-SBGR-SBGL',
      date: '2026-06-06',
      callTime: '1330',
      takeoffTime: '1530',
      realTime: '1430',
      paxTotal: 3,
      paxWeight: 960,
      bagWeight: 240,
      totalWeight: 1200,
      bagCount: 14,
      destinationsData: {
        'SBGR': { pax: 2 },
        'SBGL': { pax: 1 }
      },
      debarkCount: 3, // Quantidade de desembarcados registada
      originalList: ['2S JOAO DA SILVA', 'SGT MARIA OLIVEIRA', 'CEL CARLOS SOUZA'],
      embarkedList: ['2S JOAO DA SILVA', 'SGT MARIA OLIVEIRA']
    }
  ]);

  const [editingId, setEditingId] = useState(null);
  const [newFlight, setNewFlight] = useState({
    aircraft: fabAircrafts[0],
    matricula: '',
    route: '',
    date: new Date().toISOString().split('T')[0],
    callTime: '',
    takeoffTime: '',
    realTime: '',
    paxTotal: '',
    paxWeight: '',
    bagWeight: '',
    bagCount: '',
    destinationsData: {},
    debarkCount: '',
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

  const timeToMinutes = (timeStr) => {
    if (!timeStr || timeStr.length < 4) return null;
    const hours = parseInt(timeStr.slice(0, 2), 10);
    const mins = parseInt(timeStr.slice(2, 4), 10);
    if (isNaN(hours) || isNaN(mins)) return null;
    return hours * 60 + mins;
  };

  const calculateEffectiveness = (flight) => {
    const callMin = timeToMinutes(flight.callTime);
    const targetMin = timeToMinutes(flight.takeoffTime);
    const realMin = timeToMinutes(flight.realTime);

    if (callMin === null || targetMin === null || realMin === null) return 'N/A';

    let plannedDuration = targetMin - callMin;
    let actualDuration = realMin - callMin;

    if (plannedDuration <= 0) plannedDuration += 24 * 60;
    if (actualDuration <= 0) actualDuration += 24 * 60;

    if (actualDuration <= 0) return '0%';

    const ratio = (plannedDuration / actualDuration) * 100;
    return `${Math.round(ratio)}%`;
  };

  const getWeekdayName = (dateStr) => {
    if (!dateStr) return '';
    const dateObj = new Date(dateStr + 'T12:00:00');
    if (isNaN(dateObj.getTime())) return '';
    const weekdays = ['DOMINGO', 'SEGUNDA-FEIRA', 'TERÇA-FEIRA', 'QUARTA-FEIRA', 'QUINTA-FEIRA', 'SEXTA-FEIRA', 'SÁBADO'];
    return weekdays[dateObj.getDay()];
  };

  const getRouteDestinations = (routeStr) => {
    if (!routeStr) return [];
    const parts = routeStr.split('-').map(p => p.trim().toUpperCase()).filter(Boolean);
    if (parts.length < 3) return [];
    return parts.slice(1);
  };

  const currentDestinations = getRouteDestinations(newFlight.route);

  const allAvailableDestinations = Array.from(new Set(
    flightList.flatMap(f => Object.keys(f.destinationsData || {}))
  ));

  const cleanNameOnly = (line) => {
    let upper = line.trim().toUpperCase();
    const prefixes = [
      'MA/BR', 'TEN-BRIG', 'MAJ-BRIG', 'CEL', 'TC', 'MAJ', 'CAP', '1º TEN', '2º TEN', 'ASP', 
      'SO', '1S', '2S', '3S', 'CB', 'SGT', 'SATA', 'CIV', 'SR', 'SRA', 'DR', 'DRA', 'SUBTEN'
    ];
    
    let words = upper.split(/\s+/);
    while (words.length > 0) {
      let firstWord = words[0].replace(/[^A-Z0-9]/g, '');
      if (prefixes.includes(firstWord) || /^\d+[ºO]?[A-Z]*$/.test(firstWord)) {
        words.shift();
      } else {
        break;
      }
    }
    return words.join(' ');
  };

  const formOriginalList = newFlight.originalText.split('\n').map(s => s.trim()).filter(Boolean);
  const formEmbarkedList = newFlight.embarkedText.split('\n').map(s => s.trim()).filter(Boolean);
  
  const formTotalPrev = Number(newFlight.paxTotal) || formOriginalList.length;
  
  const cleanOriginalNames = formOriginalList.map(cleanNameOnly);
  const cleanEmbarkedNames = formEmbarkedList.map(cleanNameOnly);

  const embarkedMatchedCount = cleanOriginalNames.filter(orig => cleanEmbarkedNames.includes(orig)).length;
  const formFaltas = Math.max(0, formOriginalList.length - embarkedMatchedCount);
  const extraNamesCount = cleanEmbarkedNames.filter(emb => !cleanOriginalNames.includes(emb)).length;
  const formExtras = extraNamesCount;
  const formPercFaltas = formOriginalList.length > 0 ? ((formFaltas / formOriginalList.length) * 100).toFixed(1) : '0.0';

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

  const handleDeleteAircraft = (aircraftToDelete) => {
    setFabAircrafts(fabAircrafts.filter(ac => ac !== aircraftToDelete));
  };

  const handleAddFlight = (e) => {
    e.preventDefault();
    
    const flightData = {
      id: editingId ? editingId : `FL-00${flightList.length + 1}`,
      aircraft: newFlight.aircraft,
      matricula: newFlight.matricula.toUpperCase(),
      route: newFlight.route.toUpperCase(),
      date: newFlight.date,
      callTime: newFlight.callTime,
      takeoffTime: newFlight.takeoffTime,
      realTime: newFlight.realTime,
      paxTotal: Number(newFlight.paxTotal) || formOriginalList.length || 0,
      paxWeight: Number(newFlight.paxWeight) || 0,
      bagWeight: Number(newFlight.bagWeight) || 0,
      totalWeight: (Number(newFlight.paxWeight) || 0) + (Number(newFlight.bagWeight) || 0),
      bagCount: Number(newFlight.bagCount) || 0,
      destinationsData: newFlight.destinationsData || {},
      debarkCount: Number(newFlight.debarkCount) || 0,
      originalList: formOriginalList,
      embarkedList: formEmbarkedList
    };

    if (editingId) {
      setFlightList(flightList.map(f => f.id === editingId ? flightData : f));
      setEditingId(null);
      alert('Voo atualizado com sucesso!');
    } else {
      setFlightList([flightData, ...flightList]);
    }

    setNewFlight({
      aircraft: fabAircrafts[0],
      matricula: '',
      route: '',
      date: new Date().toISOString().split('T')[0],
      callTime: '',
      takeoffTime: '',
      realTime: '',
      paxTotal: '',
      paxWeight: '',
      bagWeight: '',
      bagCount: '',
      destinationsData: {},
      debarkCount: '',
      originalText: '',
      embarkedText: ''
    });
    setActiveTab('panel');
  };

  const handleEditFlight = (flight) => {
    setEditingId(flight.id);
    setNewFlight({
      aircraft: flight.aircraft,
      matricula: flight.matricula,
      route: flight.route,
      date: flight.date,
      callTime: flight.callTime,
      takeoffTime: flight.takeoffTime,
      realTime: flight.realTime,
      paxTotal: flight.paxTotal || flight.originalList.length,
      paxWeight: flight.paxWeight,
      bagWeight: flight.bagWeight,
      bagCount: flight.bagCount,
      destinationsData: flight.destinationsData || {},
      debarkCount: flight.debarkCount || '',
      originalText: flight.originalList.join('\n'),
      embarkedText: flight.embarkedList.join('\n')
    });
    setActiveTab('new');
  };

  const handleDeleteFlight = (id) => {
    setFlightList(flightList.filter(f => f.id !== id));
  };

  // Guardar Desembarques Múltiplos selecionados na aba Desembarque
  const handleSaveBatchDebark = (e) => {
    e.preventDefault();
    if (selectedDebarkFlightIds.length === 0) {
      alert('Selecione pelo menos um voo para registar o desembarque.');
      return;
    }

    setFlightList(flightList.map(f => {
      if (selectedDebarkFlightIds.includes(f.id)) {
        const inputVal = debarkInputs[f.id];
        return {
          ...f,
          debarkCount: inputVal !== undefined ? Number(inputVal) || 0 : (f.debarkCount || 0)
        };
      }
      return f;
    }));

    alert('Registos de desembarque múltiplos atualizados com sucesso!');
    setSelectedDebarkFlightIds([]);
  };

  const filteredFlights = flightList.filter(flight => {
    const matchAircraft = filterAircraft === 'ALL' || flight.aircraft === filterAircraft;
    const matchStartDate = !filterStartDate || flight.date >= filterStartDate;
    const matchEndDate = !filterEndDate || flight.date <= filterEndDate;
    const matchDate = !filterDate || flight.date === filterDate;
    const matchMonthYear = !filterMonthYear || flight.date.startsWith(filterMonthYear);
    
    const matchDestination = dashboardDestinationFilter === 'ALL' || 
      (flight.destinationsData && flight.destinationsData[dashboardDestinationFilter] && Number(flight.destinationsData[dashboardDestinationFilter].pax) > 0);

    const matchDebark = dashboardDebarkFilter === 'ALL' || 
      (dashboardDebarkFilter === 'HAS_DEBARK' ? Number(flight.debarkCount) > 0 : Number(flight.debarkCount) === 0);

    return matchAircraft && matchStartDate && matchEndDate && matchDate && matchMonthYear && matchDestination && matchDebark;
  });

  const reportFilteredFlights = flightList.filter(flight => {
    const matchAircraft = reportAircraft === 'ALL' || flight.aircraft === reportAircraft;
    const matchStartDate = !reportStartDate || flight.date >= reportStartDate;
    const matchEndDate = !reportEndDate || flight.date <= reportEndDate;
    const matchSpecific = !reportSpecificDate || flight.date === reportSpecificDate;
    return matchAircraft && matchStartDate && matchEndDate && matchSpecific;
  });

  // Voos filtrados especificamente para a aba Desembarque
  const debarkTabFilteredFlights = flightList.filter(f => {
    const matchDate = !debarkFilterDate || f.date === debarkFilterDate;
    const matchAc = debarkFilterAircraft === 'ALL' || f.aircraft === debarkFilterAircraft;
    return matchDate && matchAc;
  });

  // Métricas do Dashboard
  const totalFlightsCount = filteredFlights.length;
  
  const totalPaxAll = dashboardDestinationFilter === 'ALL' 
    ? filteredFlights.reduce((acc, f) => acc + (f.paxTotal || f.originalList.length || 0), 0)
    : filteredFlights.reduce((acc, f) => acc + (Number(f.destinationsData[dashboardDestinationFilter]?.pax) || 0), 0);

  const totalDebarkAll = filteredFlights.reduce((acc, f) => acc + (Number(f.debarkCount) || 0), 0);
  const totalPaxWeightAll = filteredFlights.reduce((acc, f) => acc + f.paxWeight, 0);
  const totalBagWeightAll = filteredFlights.reduce((acc, f) => acc + f.bagWeight, 0);
  const totalWeightAll = filteredFlights.reduce((acc, f) => acc + f.totalWeight, 0);

  const maxFlights = Math.max(10, totalFlightsCount * 1.5);
  const maxPax = Math.max(50, totalPaxAll * 1.5);
  const maxDebark = Math.max(50, totalDebarkAll * 1.5);
  const maxPaxWeight = Math.max(3000, totalPaxWeightAll * 1.5);
  const maxBagWeight = Math.max(1000, totalBagWeightAll * 1.5);
  const maxTotalWeight = Math.max(4000, totalWeightAll * 1.5);

  const handleRegisterUser = (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.pass) return;
    const upperName = newUserForm.name.trim().toUpperCase();
    if (usersList.some(u => u.name === upperName)) {
      alert('Este utilizador já existe!');
      return;
    }
    setUsersList([...usersList, { name: upperName, pass: newUserForm.pass, role: newUserForm.role }]);
    setNewUserForm({ name: '', pass: '', role: 'OPERADOR' });
    alert('Utilizador cadastrado com sucesso!');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const found = usersList.find(u => u.name === loginInput.user.trim().toUpperCase() && u.pass === loginInput.pass);
    if (found) {
      setCurrentUser(found);
      setLoginInput({ user: '', pass: '' });
    } else {
      alert('Utilizador ou senha incorretos! (Nota: A senha padrão inicial do Administrador é admin123)');
    }
  };

  const handleChangeAdminPassword = (e) => {
    e.preventDefault();
    if (!adminNewPass) return;
    setUsersList(usersList.map(u => u.name === 'ADMINISTRADOR' ? { ...u, pass: adminNewPass } : u));
    setAdminNewPass('');
    alert('Senha do Administrador alterada com sucesso!');
  };

  if (!currentUser) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center font-sans uppercase p-4">
        <div className="max-w-md w-full bg-slate-900 border border-slate-800 p-8 rounded-2xl shadow-2xl space-y-6">
          <div className="text-center space-y-2">
            <div className="bg-sky-600 w-12 h-12 rounded-xl flex items-center justify-center mx-auto text-white shadow-lg shadow-sky-900/50">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold text-white tracking-wider">POSTO CAN BR</h1>
            <p className="text-xs text-slate-400 font-mono">Base Aérea de Brasília (SBBR)</p>
          </div>

          <div className="bg-slate-950 p-3 rounded-xl border border-sky-900/40 text-[11px] text-sky-300 font-mono">
            ℹ️ <strong>Credencial padrão inicial:</strong> Utilizador: <strong>ADMINISTRADOR</strong> | Senha: <strong>admin123</strong>
          </div>

          {authView === 'login' ? (
            <form onSubmit={handleLogin} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-400 mb-1">UTILIZADOR</label>
                <input 
                  type="text" 
                  required
                  placeholder="EX: ADMINISTRADOR"
                  value={loginInput.user}
                  onChange={(e) => setLoginInput({ ...loginInput, user: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white uppercase font-mono"
                />
              </div>
              <div>
                <label className="block text-slate-400 mb-1">SENHA</label>
                <input 
                  type="password" 
                  required
                  placeholder="••••••••"
                  value={loginInput.pass}
                  onChange={(e) => setLoginInput({ ...loginInput, pass: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono"
                />
              </div>
              <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg transition-colors tracking-wider">
                ENTRAR NO SISTEMA
              </button>
            </form>
          ) : null}
        </div>
      </div>
    );
  }

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
            <p className="text-xs text-slate-400">POSTO CAN BR — Base Aérea de Brasília (SBBR)</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-medium">POSTO CAN BR Operacional</span>
          </div>
          <div className="flex items-center space-x-3 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs font-mono">
            <span className="text-sky-400">{currentUser.name} ({currentUser.role})</span>
            <button onClick={() => setCurrentUser(null)} className="text-rose-400 hover:text-rose-300" title="Terminar Sessão">
              <LogOut className="w-4 h-4" />
            </button>
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

            {/* Nova Opção Desembarque */}
            <button 
              onClick={() => setActiveTab('debark')}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${activeTab === 'debark' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <UserCheck2 className="w-4 h-4" />
              <span>Desembarque</span>
            </button>
            
            <button 
              onClick={() => { setEditingId(null); setActiveTab('new'); }}
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

            <button 
              onClick={() => setActiveTab('report')}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${activeTab === 'report' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Printer className="w-4 h-4" />
              <span>Imprimir Relatório</span>
            </button>

            <button 
              onClick={() => setActiveTab('users')}
              className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-xs font-semibold tracking-wider transition-all ${activeTab === 'users' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
            >
              <Users className="w-4 h-4" />
              <span>Utilizadores</span>
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
            <div className="flex items-center space-x-2 bg-slate-900 border border-slate-800 p-2 rounded-xl flex-wrap">
              <button onClick={() => setSidebarOpen(true)} className="p-2 bg-slate-800 text-white rounded-lg hover:bg-slate-700">
                <Menu className="w-4 h-4" />
              </button>
              <button onClick={() => setActiveTab('dashboard')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'dashboard' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Dashboard</button>
              <button onClick={() => setActiveTab('panel')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'panel' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Painel</button>
              <button onClick={() => setActiveTab('debark')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'debark' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Desembarque</button>
              <button onClick={() => { setEditingId(null); setActiveTab('new'); }} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'new' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Adicionar</button>
              <button onClick={() => setActiveTab('aircrafts')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'aircrafts' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Aeronaves</button>
              <button onClick={() => setActiveTab('report')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'report' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Relatório</button>
              <button onClick={() => setActiveTab('users')} className={`px-3 py-1.5 rounded text-xs font-bold ${activeTab === 'users' ? 'bg-sky-600 text-white' : 'bg-slate-950 text-slate-300'}`}>Utilizadores</button>
            </div>
          )}

          {/* BARRA DE FILTROS GERAIS */}
          {(activeTab === 'dashboard' || activeTab === 'panel') && (
            <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow space-y-4">
              <div className="flex items-center space-x-2 text-sky-400 text-xs font-bold tracking-wider">
                <Filter className="w-4 h-4" />
                <span>Filtros Operacionais — POSTO CAN BR</span>
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

              {/* FILTROS EXCLUSIVOS DO DASHBOARD (LOCALIDADE E DESEMBARQUE) */}
              {activeTab === 'dashboard' && (
                <div className="pt-3 border-t border-slate-800/80 grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="flex flex-col space-y-1">
                    <span className="text-emerald-400 font-mono text-xs flex items-center">
                      <MapPin className="w-3.5 h-3.5 mr-1" /> FILTRAR PAX POR LOCALIDADE / DESTINO:
                    </span>
                    <select 
                      value={dashboardDestinationFilter}
                      onChange={(e) => setDashboardDestinationFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white uppercase font-mono text-xs w-full"
                    >
                      <option value="ALL">TODAS AS LOCALIDADES (GERAL)</option>
                      {allAvailableDestinations.map((dest, idx) => (
                        <option key={idx} value={dest}>DESTINO: {dest}</option>
                      ))}
                    </select>
                  </div>

                  <div className="flex flex-col space-y-1">
                    <span className="text-sky-400 font-mono text-xs flex items-center">
                      <UserCheck2 className="w-3.5 h-3.5 mr-1" /> FILTRAR POR STATUS DE DESEMBARQUE:
                    </span>
                    <select 
                      value={dashboardDebarkFilter}
                      onChange={(e) => setDashboardDebarkFilter(e.target.value)}
                      className="bg-slate-950 border border-slate-800 rounded-lg p-2 text-white uppercase font-mono text-xs w-full"
                    >
                      <option value="ALL">TODOS OS VOOS</option>
                      <option value="HAS_DEBARK">APENAS VOOS COM DESEMBARQUE REGISTRADO</option>
                      <option value="NO_DEBARK">SEM DESEMBARQUE REGISTRADO</option>
                    </select>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* DASHBOARD */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                
                {/* 1. Total de Voos */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5 flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-extrabold text-slate-400 tracking-wider">TOTAL DE VOOS</span>
                    <span className="text-2xl font-black text-sky-400 font-mono">{totalFlightsCount}</span>
                  </div>
                  <div className="h-40 bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 flex items-end justify-center relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                    </div>
                    <div className="w-14 bg-gradient-to-t from-sky-700 via-sky-500 to-cyan-300 rounded-t-lg shadow-2xl shadow-sky-500/40 flex items-center justify-center text-xs font-bold text-slate-950 font-mono transition-all duration-700 z-10" style={{ height: `${Math.max(25, (totalFlightsCount / maxFlights) * 100)}%` }}>
                      {totalFlightsCount}
                    </div>
                  </div>
                </div>

                {/* 2. Total de Passageiros (PAX) */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5 flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-extrabold text-slate-400 tracking-wider">
                      {dashboardDestinationFilter === 'ALL' ? 'TOTAL DE PASSAGEIROS (PAX)' : `PAX PARA ${dashboardDestinationFilter}`}
                    </span>
                    <span className="text-2xl font-black text-emerald-400 font-mono">{totalPaxAll}</span>
                  </div>
                  <div className="h-40 bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 flex items-end justify-center relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                    </div>
                    <div className="w-14 bg-gradient-to-t from-emerald-700 via-emerald-500 to-teal-300 rounded-t-lg shadow-2xl shadow-emerald-500/40 flex items-center justify-center text-xs font-bold text-slate-950 font-mono transition-all duration-700 z-10" style={{ height: `${Math.max(25, (totalPaxAll / maxPax) * 100)}%` }}>
                      {totalPaxAll}
                    </div>
                  </div>
                </div>

                {/* 3. Total de Desembarques (NOVO) */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5 flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-extrabold text-slate-400 tracking-wider">TOTAL DESEMBARCADOS</span>
                    <span className="text-2xl font-black text-cyan-400 font-mono">{totalDebarkAll}</span>
                  </div>
                  <div className="h-40 bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 flex items-end justify-center relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                    </div>
                    <div className="w-14 bg-gradient-to-t from-cyan-700 via-cyan-500 to-sky-300 rounded-t-lg shadow-2xl shadow-cyan-500/40 flex items-center justify-center text-xs font-bold text-slate-950 font-mono transition-all duration-700 z-10" style={{ height: `${Math.max(25, (totalDebarkAll / maxDebark) * 100)}%` }}>
                      {totalDebarkAll}
                    </div>
                  </div>
                </div>

                {/* 4. Peso Total PAX */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5 flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-extrabold text-slate-400 tracking-wider">PESO TOTAL PAX</span>
                    <span className="text-2xl font-black text-indigo-400 font-mono">{totalPaxWeightAll} KG</span>
                  </div>
                  <div className="h-40 bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 flex items-end justify-center relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                    </div>
                    <div className="w-14 bg-gradient-to-t from-indigo-700 via-indigo-500 to-blue-300 rounded-t-lg shadow-2xl shadow-indigo-500/40 flex items-center justify-center text-xs font-bold text-slate-950 font-mono transition-all duration-700 z-10" style={{ height: `${Math.max(25, (totalPaxWeightAll / maxPaxWeight) * 100)}%` }}>
                      {totalPaxWeightAll}
                    </div>
                  </div>
                </div>

                {/* 5. Peso Total de Bagagem */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5 flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-extrabold text-slate-400 tracking-wider">PESO TOTAL DE BAGAGEM</span>
                    <span className="text-2xl font-black text-amber-400 font-mono">{totalBagWeightAll} KG</span>
                  </div>
                  <div className="h-40 bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 flex items-end justify-center relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                    </div>
                    <div className="w-14 bg-gradient-to-t from-amber-700 via-amber-500 to-yellow-300 rounded-t-lg shadow-2xl shadow-amber-500/40 flex items-center justify-center text-xs font-bold text-slate-950 font-mono transition-all duration-700 z-10" style={{ height: `${Math.max(25, (totalBagWeightAll / maxBagWeight) * 100)}%` }}>
                      {totalBagWeightAll}
                    </div>
                  </div>
                </div>

                {/* 6. Peso Total Transportado */}
                <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-2xl space-y-5 lg:col-span-1 flex flex-col justify-between">
                  <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                    <span className="text-xs font-extrabold text-slate-400 tracking-wider">PESO TOTAL TRANSP.</span>
                    <span className="text-2xl font-black text-rose-400 font-mono">{totalWeightAll} KG</span>
                  </div>
                  <div className="h-40 bg-slate-950/90 rounded-xl border border-slate-800/80 p-4 flex items-end justify-center relative overflow-hidden shadow-inner">
                    <div className="absolute inset-0 flex flex-col justify-between p-3 pointer-events-none opacity-20">
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                      <div className="border-b border-slate-700 w-full"></div>
                    </div>
                    <div className="w-20 bg-gradient-to-t from-rose-700 via-rose-500 to-amber-300 rounded-t-lg shadow-2xl shadow-rose-500/40 flex items-center justify-center text-xs font-bold text-white font-mono transition-all duration-700 z-10" style={{ height: `${Math.max(25, (totalWeightAll / maxTotalWeight) * 100)}%` }}>
                      {totalWeightAll} KG
                    </div>
                  </div>
                </div>

              </div>
            </div>
          )}

          {/* NOVA ABA DESEMBARQUE MÚLTIPLO */}
          {activeTab === 'debark' && (
            <div className="space-y-6 max-w-4xl mx-auto">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
                <h2 className="text-xs font-bold text-white flex items-center tracking-wider">
                  <UserCheck2 className="w-4 h-4 mr-2 text-sky-400" /> GESTÃO E FILTRO DE DESEMBARQUE — MÚLTIPLOS VOOS
                </h2>
                <p className="text-xs text-slate-400 font-sans normal-case">
                  Filtre por data e aeronave (ex: C-97, C-98, KC-390), selecione múltiplos voos e indique o total de passageiros desembarcados de uma só vez.
                </p>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Filtrar por Data</label>
                    <input 
                      type="date" 
                      value={debarkFilterDate}
                      onChange={(e) => setDebarkFilterDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Filtrar por Aeronave FAB</label>
                    <select 
                      value={debarkFilterAircraft}
                      onChange={(e) => setDebarkFilterAircraft(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white uppercase font-sans"
                    >
                      <option value="ALL">TODAS AS AERONAVES</option>
                      {fabAircrafts.map((ac, idx) => (
                        <option key={idx} value={ac}>{ac}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Lista de Voos Filtrados para Atribuição de Desembarque */}
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
                <div className="flex justify-between items-center border-b border-slate-800 pb-3">
                  <span className="text-xs font-bold text-sky-400 tracking-wider">VOOS ENCONTRADOS PARA DESEMBARQUE ({debarkTabFilteredFlights.length})</span>
                  <button 
                    type="button"
                    onClick={() => {
                      if (selectedDebarkFlightIds.length === debarkTabFilteredFlights.length) {
                        setSelectedDebarkFlightIds([]);
                      } else {
                        setSelectedDebarkFlightIds(debarkTabFilteredFlights.map(f => f.id));
                      }
                    }}
                    className="text-xs text-slate-300 underline hover:text-white"
                  >
                    {selectedDebarkFlightIds.length === debarkTabFilteredFlights.length ? 'Desmarcar Todos' : 'Selecionar Todos'}
                  </button>
                </div>

                {debarkTabFilteredFlights.length === 0 ? (
                  <p className="text-xs text-slate-500 text-center py-6 font-sans">Nenhum voo encontrado com os filtros de data/aeronave selecionados.</p>
                ) : (
                  <form onSubmit={handleSaveBatchDebark} className="space-y-4">
                    <div className="space-y-3">
                      {debarkTabFilteredFlights.map(f => {
                        const isSelected = selectedDebarkFlightIds.includes(f.id);
                        return (
                          <div key={f.id} className={`p-4 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all ${isSelected ? 'bg-sky-950/30 border-sky-600/80 shadow-md' : 'bg-slate-950 border-slate-800'}`}>
                            <div className="flex items-center space-x-3">
                              <input 
                                type="checkbox"
                                checked={isSelected}
                                onChange={(e) => {
                                  if (e.target.checked) {
                                    setSelectedDebarkFlightIds([...selectedDebarkFlightIds, f.id]);
                                  } else {
                                    setSelectedDebarkFlightIds(selectedDebarkFlightIds.filter(id => id !== f.id));
                                  }
                                }}
                                className="w-4 h-4 rounded bg-slate-900 border-slate-700 text-sky-600 focus:ring-0 cursor-pointer"
                              />
                              <div>
                                <span className="text-xs font-bold text-white block font-mono">{f.aircraft} {f.matricula ? `(${f.matricula})` : ''}</span>
                                <span className="text-[11px] text-slate-400 font-mono">ROTA: <strong className="text-sky-300">{f.route}</strong> | DATA: {f.date} ({getWeekdayName(f.date)})</span>
                                <span className="text-[10px] text-emerald-400 block mt-0.5">PAX PREVISTO: {f.paxTotal || f.originalList.length}</span>
                              </div>
                            </div>

                            <div className="flex items-center space-x-2 w-full sm:w-auto justify-end">
                              <label className="text-[10px] text-slate-400 font-mono">QTD DESEMBARCADOS:</label>
                              <input 
                                type="number" 
                                placeholder="0"
                                defaultValue={f.debarkCount || ''}
                                onChange={(e) => {
                                  setDebarkInputs({ ...debarkInputs, [f.id]: e.target.value });
                                  if (!isSelected) {
                                    setSelectedDebarkFlightIds([...selectedDebarkFlightIds, f.id]);
                                  }
                                }}
                                className="w-24 bg-slate-900 border border-slate-700 rounded p-2 text-white font-mono text-xs font-bold text-cyan-400 text-center"
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <button 
                      type="submit" 
                      className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg transition-colors tracking-wider text-xs shadow-lg"
                    >
                      GUARDAR DESEMBARQUE PARA OS VOOS SELECIONADOS
                    </button>
                  </form>
                )}
              </div>
            </div>
          )}

          {/* PAINEL DE VOOS */}
          {activeTab === 'panel' && (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl flex justify-between items-center shadow-lg">
                <h2 className="text-xs font-bold text-white tracking-wider">PAINEL DE REGISTO DE VOOS — POSTO CAN BR</h2>
                <span className="text-xs text-slate-400 font-mono">{filteredFlights.length} REGISTOS</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredFlights.map((f) => {
                  const effectiveness = calculateEffectiveness(f);
                  const weekdayName = getWeekdayName(f.date);
                  return (
                    <div key={f.id} className="bg-slate-900 border border-slate-800 rounded-xl p-5 shadow-lg space-y-4 relative hover:border-sky-500/50 transition-all">
                      <div className="flex justify-between items-start border-b border-slate-800 pb-3">
                        <div>
                          <span className="text-sky-400 font-bold text-sm block">{f.aircraft}</span>
                          <span className="text-slate-400 text-xs font-mono">MATRÍCULA: <strong className="text-white">{f.matricula || 'N/D'}</strong></span>
                        </div>
                        <div className="text-right">
                          <span className="bg-slate-800 px-2.5 py-1 rounded text-xs font-mono text-sky-300 font-bold">{f.route}</span>
                          <span className="text-[10px] text-slate-500 block mt-1">{f.date}</span>
                        </div>
                      </div>

                      {f.destinationsData && Object.keys(f.destinationsData).length > 0 && (
                        <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 space-y-2">
                          <span className="text-[10px] text-sky-400 font-bold tracking-wider flex items-center">
                            <MapPin className="w-3 h-3 mr-1" /> QUANTIDADE DE PASSAGEIROS POR DESTINO:
                          </span>
                          <div className="grid grid-cols-2 gap-2 text-xs font-mono">
                            {Object.entries(f.destinationsData).map(([dest, info], idx) => (
                              <div key={idx} className="bg-slate-900 p-2 rounded border border-slate-800">
                                <span className="text-slate-400 text-[10px] block">DESTINO: {dest}</span>
                                <span className="text-emerald-400 font-bold">{info.pax || 0} PAX</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="grid grid-cols-3 gap-2 text-center bg-slate-950 p-3 rounded-lg border border-slate-800 font-mono text-xs">
                        <div>
                          <span className="text-[10px] text-slate-500 block">CHAMADA</span>
                          <span className="text-slate-200">{f.callTime || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">DECOLAGEM</span>
                          <span className="text-slate-200">{f.takeoffTime || '-'}</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-slate-500 block">HORA REAL</span>
                          <span className="text-slate-200">{f.realTime || '-'}</span>
                        </div>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-center font-mono text-xs">
                        <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">PAX</span>
                          <span className="text-white font-bold">{f.paxTotal || f.originalList.length}</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">PESO PAX</span>
                          <span className="text-slate-300">{f.paxWeight} KG</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">BAGAGEM</span>
                          <span className="text-slate-300">{f.bagWeight} KG</span>
                        </div>
                        <div className="bg-slate-950/60 p-2 rounded border border-slate-800">
                          <span className="text-[10px] text-slate-500 block">TOTAL</span>
                          <span className="text-sky-400 font-bold">{f.totalWeight} KG</span>
                        </div>
                      </div>

                      <div className="flex justify-between items-center pt-2 border-t border-slate-800 text-xs">
                        <span className="text-slate-400 font-mono">QTD BAGAGENS: <strong className="text-white">{f.bagCount}</strong></span>
                        <div className="flex items-center space-x-2 bg-emerald-950/40 border border-emerald-800/60 px-3 py-1 rounded-lg">
                          <Zap className="w-3.5 h-3.5 text-emerald-400" />
                          <span className="text-slate-300 font-mono text-[11px]">EFETIVIDADE: <strong className="text-emerald-400">{effectiveness}</strong></span>
                        </div>
                      </div>

                      {/* Informação de Desembarque e Dia da Semana */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {weekdayName && (
                          <div className="flex items-center space-x-2 text-[11px] text-sky-400 font-mono bg-sky-950/30 border border-sky-900/40 px-3 py-1.5 rounded-lg">
                            <Calendar className="w-3.5 h-3.5" />
                            <span>DIA: <strong className="text-white">{weekdayName}</strong></span>
                          </div>
                        )}
                        <div className="flex items-center space-x-2 text-[11px] text-cyan-400 font-mono bg-cyan-950/30 border border-cyan-900/40 px-3 py-1.5 rounded-lg">
                          <UserCheck2 className="w-3.5 h-3.5" />
                          <span>DESEMBARCADOS: <strong className="text-white">{f.debarkCount || 0}</strong></span>
                        </div>
                      </div>

                      <div className="flex justify-end items-center pt-2 border-t border-slate-800/50 text-xs space-x-3 font-mono">
                        <button onClick={() => handleEditFlight(f)} className="text-sky-400 hover:text-sky-300 flex items-center space-x-1">
                          <Edit3 className="w-4 h-4 inline" /> <span>EDITAR</span>
                        </button>
                        <button onClick={() => handleDeleteFlight(f.id)} className="text-rose-400 hover:text-rose-300 flex items-center space-x-1">
                          <Trash2 className="w-4 h-4 inline" /> <span>APAGAR</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ABA IMPRIMIR RELATÓRIO */}
          {activeTab === 'report' && (
            <div className="space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-4">
                <div className="flex items-center justify-between border-b border-slate-800 pb-3">
                  <h2 className="text-xs font-bold text-white flex items-center tracking-wider">
                    <Printer className="w-4 h-4 mr-2 text-sky-400" /> GERADOR E IMPRESSÃO DE RELATÓRIO — POSTO CAN BR
                  </h2>
                  <button 
                    onClick={() => window.print()}
                    className="bg-sky-600 hover:bg-sky-500 text-white px-4 py-2 rounded-lg text-xs font-bold transition-colors shadow-md flex items-center space-x-2"
                  >
                    <Printer className="w-4 h-4" />
                    <span>IMPRIMIR / EXPORTAR PDF</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 pt-2 text-xs">
                  <div>
                    <label className="block text-slate-400 mb-1">Aeronave FAB</label>
                    <select 
                      value={reportAircraft} 
                      onChange={(e) => setReportAircraft(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white uppercase font-sans"
                    >
                      <option value="ALL">TODAS AS AERONAVES</option>
                      {fabAircrafts.map((ac, idx) => (
                        <option key={idx} value={ac}>{ac}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Data Inicial (Período)</label>
                    <input 
                      type="date" 
                      value={reportStartDate}
                      onChange={(e) => setReportStartDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Data Final (Período)</label>
                    <input 
                      type="date" 
                      value={reportEndDate}
                      onChange={(e) => setReportEndDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-sans"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">Data Específica (Dia Comum)</label>
                    <input 
                      type="date" 
                      value={reportSpecificDate}
                      onChange={(e) => setReportSpecificDate(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-white font-sans"
                    />
                  </div>
                </div>
              </div>

              <div className="bg-white text-slate-900 p-8 rounded-xl shadow-2xl space-y-6 font-sans">
                <div className="border-b-2 border-slate-900 pb-4 flex justify-between items-end">
                  <div>
                    <h1 className="text-xl font-black">COMANDO DA AERONÁUTICA</h1>
                    <h2 className="text-sm font-bold text-slate-700">BASE AÉREA DE BRASÍLIA — POSTO CAN BR</h2>
                    <p className="text-xs text-slate-500">Relatório Operacional de Voos</p>
                  </div>
                  <div className="text-right text-xs font-mono text-slate-600">
                    <p>EMITIDO EM: {new Date().toLocaleDateString('pt-BR')}</p>
                    <p>TOTAL DE REGISTOS: {reportFilteredFlights.length}</p>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs font-mono">
                    <thead>
                      <tr className="bg-slate-900 text-white border-b border-slate-800">
                        <th className="p-2.5">DATA / DIA</th>
                        <th className="p-2.5">AERONAVE / MATR.</th>
                        <th className="p-2.5">ROTA</th>
                        <th className="p-2.5 text-center">PAX</th>
                        <th className="p-2.5 text-center">DESEMBARCADOS</th>
                        <th className="p-2.5 text-center">PESO TOTAL</th>
                        <th className="p-2.5 text-center">EFETIVIDADE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-300">
                      {reportFilteredFlights.length === 0 ? (
                        <tr>
                          <td colSpan="7" className="p-4 text-center text-slate-500 font-sans">Nenhum voo encontrado com os filtros selecionados.</td>
                        </tr>
                      ) : (
                        reportFilteredFlights.map((f) => (
                          <tr key={f.id} className="hover:bg-slate-50">
                            <td className="p-2.5">
                              {f.date}
                              <span className="block text-[10px] text-slate-500 font-bold">{getWeekdayName(f.date)}</span>
                            </td>
                            <td className="p-2.5 font-bold">{f.aircraft} {f.matricula ? `(${f.matricula})` : ''}</td>
                            <td className="p-2.5">{f.route}</td>
                            <td className="p-2.5 text-center font-bold">{f.paxTotal || f.originalList.length}</td>
                            <td className="p-2.5 text-center font-bold text-cyan-700">{f.debarkCount || 0}</td>
                            <td className="p-2.5 text-center font-bold">{f.totalWeight} KG</td>
                            <td className="p-2.5 text-center font-bold text-emerald-700">{calculateEffectiveness(f)}</td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="pt-6 border-t border-slate-300 flex justify-between text-xs font-sans text-slate-600">
                  <div>
                    <p>___________________________________________________</p>
                    <p className="font-bold mt-1">CHEFE DO POSTO CAN BR (SBBR)</p>
                  </div>
                  <div className="text-right">
                    <p>SISTEMA FLIGHTOPS BSB — CONTROLO OPERACIONAL</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ABA UTILIZADORES */}
          {activeTab === 'users' && (
            <div className="max-w-xl mx-auto space-y-6">
              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
                <h2 className="text-xs font-bold text-white flex items-center tracking-wider">
                  <Key className="w-4 h-4 mr-2 text-sky-400" /> SEGURANÇA E SENHA DO ADMINISTRADOR
                </h2>
                <form onSubmit={handleChangeAdminPassword} className="space-y-4 text-xs">
                  <p className="text-slate-400 text-[11px] font-sans normal-case">
                    A senha padrão inicial do Administrador é <strong className="text-white">admin123</strong>. Utilize o formulário abaixo para definir a sua senha personalizada de Administrador.
                  </p>
                  <div>
                    <label className="block text-slate-400 mb-1">NOVA SENHA PARA O ADMINISTRADOR</label>
                    <input 
                      type="password" 
                      required
                      placeholder="DIGITE A NOVA SENHA"
                      value={adminNewPass}
                      onChange={(e) => setAdminNewPass(e.target.value)}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono"
                    />
                  </div>
                  <button type="submit" className="w-full bg-sky-600 hover:bg-sky-500 text-white font-bold py-3 rounded-lg transition-colors tracking-wider">
                    ATUALIZAR SENHA DO ADMINISTRADOR
                  </button>
                </form>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
                <h2 className="text-xs font-bold text-white flex items-center tracking-wider">
                  <UserPlus className="w-4 h-4 mr-2 text-emerald-400" /> CADASTRAR NOVO UTILIZADOR / OPERADOR
                </h2>
                
                {currentUser.role === 'ADMIN' ? (
                  <form onSubmit={handleRegisterUser} className="space-y-4 text-xs">
                    <div>
                      <label className="block text-slate-400 mb-1">NOME DO UTILIZADOR</label>
                      <input 
                        type="text" 
                        required
                        placeholder="EX: 2S OLIVEIRA"
                        value={newUserForm.name}
                        onChange={(e) => setNewUserForm({ ...newUserForm, name: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white uppercase font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">SENHA DE ACESSO</label>
                      <input 
                        type="password" 
                        required
                        placeholder="••••••••"
                        value={newUserForm.pass}
                        onChange={(e) => setNewUserForm({ ...newUserForm, pass: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono"
                      />
                    </div>
                    <div>
                      <label className="block text-slate-400 mb-1">PERFIL</label>
                      <select 
                        value={newUserForm.role}
                        onChange={(e) => setNewUserForm({ ...newUserForm, role: e.target.value })}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white uppercase"
                      >
                        <option value="OPERADOR">OPERADOR</option>
                        <option value="ADMIN">ADMINISTRADOR</option>
                      </select>
                    </div>
                    <button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-lg transition-colors tracking-wider">
                      CADASTRAR UTILIZADOR
                    </button>
                  </form>
                ) : (
                  <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 text-xs text-amber-400 font-mono">
                    Apenas administradores podem cadastrar novos operadores.
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ADICIONAR AERONAVE */}
          {activeTab === 'aircrafts' && (
            <div className="max-w-xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
              <h2 className="text-xs font-bold text-white flex items-center tracking-wider">
                <Plane className="w-4 h-4 mr-2 text-sky-400" /> REGISTAR E GERIR AERONAVES FAB
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
                      <div className="flex items-center space-x-3">
                        <ShieldCheck className="w-4 h-4 text-emerald-400" />
                        <button 
                          onClick={() => handleDeleteAircraft(ac)}
                          className="text-rose-400 hover:text-rose-300"
                          title="Excluir Aeronave"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          {/* ADICIONAR / EDITAR VOO */}
          {activeTab === 'new' && (
            <div className="max-w-4xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-lg space-y-6">
              <h2 className="text-xs font-bold text-white flex items-center tracking-wider">
                <PlusCircle className="w-4 h-4 mr-2 text-sky-400" /> {editingId ? 'EDITAR VOO' : 'ADICIONAR VOO'} — POSTO CAN BR
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
                    <label className="block text-slate-400 mb-1">ROTA (EX: SBBR-SBGR-SBGL)</label>
                    <input 
                      type="text" 
                      required
                      placeholder="SBBR-SBGR-SBGL"
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
                    <label className="block text-slate-400 mb-1">HORA DE DECOLAGEM (PREVISTA)</label>
                    <input 
                      type="text" 
                      placeholder="1530"
                      value={newFlight.takeoffTime}
                      onChange={(e) => setNewFlight({ ...newFlight, takeoffTime: formatTimeInput(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">HORA REAL (ATENDIMENTO)</label>
                    <input 
                      type="text" 
                      placeholder="1430"
                      value={newFlight.realTime}
                      onChange={(e) => setNewFlight({ ...newFlight, realTime: formatTimeInput(e.target.value) })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">TOTAL DE PASSAGEIROS (PAX)</label>
                    <input 
                      type="number" 
                      required
                      placeholder="0"
                      value={newFlight.paxTotal}
                      onChange={(e) => setNewFlight({ ...newFlight, paxTotal: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono font-bold text-sky-400"
                    />
                  </div>

                  <div>
                    <label className="block text-slate-400 mb-1">QTD DESEMBARCADOS</label>
                    <input 
                      type="number" 
                      placeholder="0"
                      value={newFlight.debarkCount}
                      onChange={(e) => setNewFlight({ ...newFlight, debarkCount: e.target.value })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2.5 text-white font-mono font-bold text-cyan-400"
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
                    <label className="block text-slate-400 mb-1">TOTAL DE PESO (AUTO)</label>
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

                {currentDestinations.length > 0 && (
                  <div className="bg-slate-950 p-4 rounded-xl border border-sky-900/40 space-y-3">
                    <span className="text-xs font-bold text-sky-400 flex items-center">
                      <MapPin className="w-4 h-4 mr-1.5" /> DESTINOS MÚLTIPLOS DETETADOS NA ROTA (3º AERÓDROMO OU SUPERIOR: {currentDestinations.join(', ')})
                    </span>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {currentDestinations.map((dest, idx) => (
                        <div key={idx} className="bg-slate-900 p-3 rounded-lg border border-slate-800 space-y-2">
                          <span className="text-xs font-bold text-white block font-mono">DESTINO: {dest}</span>
                          <div>
                            <label className="block text-[10px] text-slate-400 mb-1">QUANTIDADE DE PAX PARA {dest}</label>
                            <input 
                              type="number" 
                              placeholder="0"
                              value={newFlight.destinationsData[dest]?.pax || ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                setNewFlight({
                                  ...newFlight,
                                  destinationsData: {
                                    ...newFlight.destinationsData,
                                    [dest]: { pax: val }
                                  }
                                });
                              }}
                              className="w-full bg-slate-950 border border-slate-800 rounded p-2 text-white font-mono text-xs font-bold text-emerald-400"
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-4 border-t border-slate-800">
                  <div className="space-y-2">
                    <label className="block text-slate-300 font-semibold flex items-center uppercase">
                      <FileSpreadsheet className="w-4 h-4 mr-1 text-sky-400" /> 1. COPIAR & COLAR RELAÇÃO PRINCIPAL
                    </label>
                    <p className="text-[10px] text-slate-400 font-sans normal-case">Patentes (2S, SGT, CEL) são ignoradas no cruzamento de nomes</p>
                    <textarea 
                      rows="5"
                      placeholder="2S JOAO DA SILVA&#10;SGT MARIA OLIVEIRA&#10;CEL CARLOS SOUZA"
                      value={newFlight.originalText}
                      onChange={(e) => setNewFlight({ ...newFlight, originalText: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono text-xs uppercase"
                    ></textarea>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-slate-300 font-semibold flex items-center uppercase">
                      <Users className="w-4 h-4 mr-1 text-emerald-400" /> 2. COPIAR & COLAR EFETIVAMENTE EMBARCADOS
                    </label>
                    <p className="text-[10px] text-slate-400 font-sans normal-case">O nome limpo coincidirá mesmo se omitir a patente nesta lista</p>
                    <textarea 
                      rows="5"
                      placeholder="JOAO DA SILVA&#10;MARIA OLIVEIRA&#10;NOVO PASSAGEIRO"
                      value={newFlight.embarkedText}
                      onChange={(e) => setNewFlight({ ...newFlight, embarkedText: e.target.value.toUpperCase() })}
                      className="w-full bg-slate-950 border border-slate-800 rounded-lg p-3 text-white font-mono text-xs uppercase"
                    ></textarea>
                  </div>
                </div>

                <div className="bg-slate-950 border border-slate-800 p-4 rounded-xl grid grid-cols-2 sm:grid-cols-5 gap-3 text-center font-mono">
                  <div>
                    <span className="text-[10px] text-slate-400 block">TOTAL PREVISTO</span>
                    <span className="text-base font-bold text-white">{formTotalPrev}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">EMBARCADOS</span>
                    <span className="text-base font-bold text-sky-400">{embarkedMatchedCount}</span>
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
                  {editingId ? 'ATUALIZAR VOO NO POSTO CAN BR' : 'SALVAR VOO E GERAR RELATÓRIO DO POSTO CAN BR'}
                </button>
              </form>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
