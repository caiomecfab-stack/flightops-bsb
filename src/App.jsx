import React, { useState, useEffect } from 'react';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
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
  RefreshCw,
  LogOut,
  Clock,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

// ========================================================
// CONFIGURAÇÃO DA NUVEM (SUPABASE)
// ========================================================
const SUPABASE_URL = 'https://pqhakpqcbndhgienvjzw.supabase.co';
// Substitua o valor abaixo pela sua Publishable Key completa se ela tiver mais caracteres
const SUPABASE_ANON_KEY = 'sb_publishable_PjVJXvye7P5IH1ZIRmqIpQ_l0XAz'; 

const supabase = (SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 10)
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

export default function App() {
  const [currentUser, setCurrentUser] = useState({ name: 'CAIO', role: 'ADMIN' });
  const [authView, setAuthView] = useState('app'); // 'login' ou 'app'
  const [loginInput, setLoginInput] = useState({ user: '', pass: '' });

  const [usersList, setUsersList] = useState([
    { name: 'CAIO', pass: 'admin123', role: 'ADMIN' }
  ]);

  const [newUserForm, setNewUserForm] = useState({ name: '', pass: '', role: 'OPERADOR' });
  const [adminNewPass, setAdminNewPass] = useState('');

  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // ESTADO DOS VOOS
  const [flights, setFlights] = useState([
    {
      id: '1',
      anv: 'FAB 2101',
      etapa: 'SBBR - SBRJ',
      chamada: '10:00',
      decolagemPrevista: '11:00',
      envolvimentoInicio: '10:10',
      envolvimentoFim: '10:50',
      status: 'CONCLUIDO',
      operador: 'CAIO',
      data: new Date().toISOString().split('T')[0]
    }
  ]);

  const [filterStatus, setFilterStatus] = useState('TODOS');
  const [filterData, setFilterData] = useState('');

  // FORMULÁRIO DE NOVO VOO
  const [newFlight, setNewFlight] = useState({
    anv: '',
    etapa: '',
    chamada: '',
    decolagemPrevista: '',
    envolvimentoInicio: '',
    envolvimentoFim: '',
    status: 'EM ANDAMENTO'
  });

  // ========================================================
  // PERSISTÊNCIA E SINCRONIZAÇÃO EM TEMPO REAL (REALTIME)
  // ========================================================
  useEffect(() => {
    if (!supabase) return;

    // Carregar dados iniciais do Supabase
    const fetchStorage = async () => {
      const { data, error } = await supabase
        .from('app_storage')
        .select('*')
        .eq('key', 'flightops_data')
        .single();

      if (data && data.value) {
        if (data.value.flights) setFlights(data.value.flights);
        if (data.value.usersList) setUsersList(data.value.usersList);
      }
    };

    fetchStorage();

    // Sincronização em Tempo Real (Realtime Channel)
    const channel = supabase
      .channel('schema-db-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'app_storage', filter: 'key=eq.flightops_data' },
        (payload) => {
          if (payload.new && payload.new.value) {
            setFlights(payload.new.value.flights || []);
            setUsersList(payload.new.value.usersList || []);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Guardar alterações na nuvem
  const saveDataToCloud = async (newFlights, newUsers) => {
    if (!supabase) return;
    await supabase.from('app_storage').upsert({
      key: 'flightops_data',
      value: { flights: newFlights, usersList: newUsers },
      updated_at: new Date().toISOString()
    });
  };

  // ========================================================
  // LÓGICA DE NEGÓCIO E MÉTRICAS
  // ========================================================
  const parseMinutes = (timeStr) => {
    if (!timeStr || !timeStr.includes(':')) return 0;
    const [h, m] = timeStr.split(':').map(Number);
    return h * 60 + m;
  };

  // FÓRMULA DE EFETIVIDADE CORRIGIDA:
  // (Tempo Previsto entre Chamada e Decolagem / Tempo Real de Envolvimento) * 100
  const calculateEfetividade = (flight) => {
    const tChamada = parseMinutes(flight.chamada);
    const tDecolagem = parseMinutes(flight.decolagemPrevista);
    const tInicioEnv = parseMinutes(flight.envolvimentoInicio);
    const tFimEnv = parseMinutes(flight.envolvimentoFim);

    const tempoPrevisto = tDecolagem - tChamada;
    const tempoRealEnvolvimento = tFimEnv - tInicioEnv;

    if (tempoPrevisto <= 0 || tempoRealEnvolvimento <= 0) return 0;

    const ef = (tempoPrevisto / tempoRealEnvolvimento) * 100;
    return Math.min(Math.round(ef), 100); // Limita ao máximo de 100%
  };

  // AÇÕES
  const handleAddFlight = (e) => {
    e.preventDefault();
    const flightToAdd = {
      ...newFlight,
      id: Date.now().toString(),
      operador: currentUser.name,
      data: new Date().toISOString().split('T')[0]
    };
    const updatedFlights = [flightToAdd, ...flights];
    setFlights(updatedFlights);
    saveDataToCloud(updatedFlights, usersList);
    setNewFlight({
      anv: '',
      etapa: '',
      chamada: '',
      decolagemPrevista: '',
      envolvimentoInicio: '',
      envolvimentoFim: '',
      status: 'EM ANDAMENTO'
    });
    setActiveTab('dashboard');
  };

  const handleUpdateStatus = (id, newStatus) => {
    const updated = flights.map(f => f.id === id ? { ...f, status: newStatus } : f);
    setFlights(updated);
    saveDataToCloud(updated, usersList);
  };

  const handleDeleteFlight = (id) => {
    if (confirm('Deseja realmente apagar este registo de voo?')) {
      const updated = flights.filter(f => f.id !== id);
      setFlights(updated);
      saveDataToCloud(updated, usersList);
    }
  };

  const handleAddUser = (e) => {
    e.preventDefault();
    if (!newUserForm.name || !newUserForm.pass) return;
    const updatedUsers = [...usersList, newUserForm];
    setUsersList(updatedUsers);
    saveDataToCloud(flights, updatedUsers);
    setNewUserForm({ name: '', pass: '', role: 'OPERADOR' });
  };

  const handleChangePassword = (e) => {
    e.preventDefault();
    const updatedUsers = usersList.map(u => u.name === currentUser.name ? { ...u, pass: adminNewPass } : u);
    setUsersList(updatedUsers);
    saveDataToCloud(flights, updatedUsers);
    setAdminNewPass('');
    alert('Palavra-passe alterada com sucesso!');
  };

  const handleLogin = (e) => {
    e.preventDefault();
    const found = usersList.find(u => u.name.toUpperCase() === loginInput.user.toUpperCase() && u.pass === loginInput.pass);
    if (found) {
      setCurrentUser(found);
      setAuthView('app');
    } else {
      alert('Utilizador ou palavra-passe incorretos!');
    }
  };

  // FILTROS
  const filteredFlights = flights.filter(f => {
    const matchStatus = filterStatus === 'TODOS' || f.status === filterStatus;
    const matchData = !filterData || f.data === filterData;
    return matchStatus && matchData;
  });

  // MÉTRICAS
  const totalVoos = filteredFlights.length;
  const voosConcluidos = filteredFlights.filter(f => f.status === 'CONCLUIDO');
  const mediaEfetividade = voosConcluidos.length > 0
    ? Math.round(voosConcluidos.reduce((acc, f) => acc + calculateEfetividade(f), 0) / voosConcluidos.length)
    : 0;

  // ========================================================
  // RENDERIZAÇÃO
  // ========================================================
  if (authView === 'login') {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
        <div className="bg-slate-800 border border-slate-700 p-8 rounded-xl shadow-2xl w-full max-w-md">
          <div className="flex justify-center mb-4">
            <div className="p-3 bg-blue-600 rounded-full">
              <Plane className="w-8 h-8 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-center text-white mb-2">POSTO CAN BR (SBBR)</h2>
          <p className="text-slate-400 text-center mb-6 text-sm">Sistema de Gestão de Voos Operacionais</p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase">Utilizador</label>
              <input 
                type="text" 
                required
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
                value={loginInput.user}
                onChange={e => setLoginInput({ ...loginInput, user: e.target.value })}
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-slate-300 uppercase">Palavra-passe</label>
              <input 
                type="password" 
                required
                className="w-full mt-1 bg-slate-900 border border-slate-700 rounded p-2.5 text-white focus:outline-none focus:border-blue-500"
                value={loginInput.pass}
                onChange={e => setLoginInput({ ...loginInput, pass: e.target.value })}
              />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3 rounded-lg transition-colors">
              Entrar no Sistema
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col md:flex-row">
      {/* SIDEBAR */}
      <aside className={`${sidebarOpen ? 'w-64' : 'w-20'} bg-slate-900 border-r border-slate-800 transition-all duration-300 flex flex-col justify-between`}>
        <div>
          <div className="p-4 flex items-center justify-between border-b border-slate-800">
            <div className="flex items-center gap-3">
              <Plane className="w-6 h-6 text-blue-500 shrink-0" />
              {sidebarOpen && <span className="font-bold text-lg tracking-wider">POSTO CAN</span>}
            </div>
            <button onClick={() => setSidebarOpen(!sidebarOpen)} className="p-1 hover:bg-slate-800 rounded">
              {sidebarOpen ? <ChevronLeft size={20} /> : <Menu size={20} />}
            </button>
          </div>

          <nav className="p-2 space-y-1">
            <button 
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'dashboard' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <Activity size={20} />
              {sidebarOpen && <span>Painel Operacional</span>}
            </button>

            <button 
              onClick={() => setActiveTab('novo-voo')}
              className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'novo-voo' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
            >
              <PlusCircle size={20} />
              {sidebarOpen && <span>Registar Voo</span>}
            </button>

            {currentUser.role === 'ADMIN' && (
              <button 
                onClick={() => setActiveTab('usuarios')}
                className={`w-full flex items-center gap-3 p-3 rounded-lg text-sm font-medium transition-colors ${activeTab === 'usuarios' ? 'bg-blue-600 text-white' : 'hover:bg-slate-800 text-slate-400'}`}
              >
                <Users size={20} />
                {sidebarOpen && <span>Gestão de Utilizadores</span>}
              </button>
            )}
          </nav>
        </div>

        <div className="p-4 border-t border-slate-800">
          {sidebarOpen && (
            <div className="mb-3">
              <p className="text-xs text-slate-500">Sessão ativa</p>
              <p className="text-sm font-bold text-blue-400">{currentUser.name} ({currentUser.role})</p>
            </div>
          )}
          <button 
            onClick={() => setAuthView('login')}
            className="w-full flex items-center gap-2 p-2 hover:bg-red-500/10 text-red-400 rounded-lg text-sm transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Sair</span>}
          </button>
        </div>
      </aside>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="flex-1 p-4 md:p-8 overflow-y-auto">
        {/* DASHBOARD */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <div>
                <h1 className="text-2xl font-bold">Painel de Controlo de Voos</h1>
                <p className="text-sm text-slate-400">Monitorização em Tempo Real — SBBR</p>
              </div>

              {/* BARRA DE FILTROS */}
              <div className="flex flex-wrap items-center gap-3 bg-slate-900 p-2 rounded-lg border border-slate-800">
                <Filter size={16} className="text-slate-400 ml-2" />
                <select 
                  className="bg-slate-800 text-xs rounded border border-slate-700 p-1.5 focus:outline-none"
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                >
                  <option value="TODOS">Todos os Status</option>
                  <option value="EM ANDAMENTO">Em Andamento</option>
                  <option value="CONCLUIDO">Concluído</option>
                  <option value="CANCELADO">Cancelado</option>
                </select>

                <input 
                  type="date" 
                  className="bg-slate-800 text-xs rounded border border-slate-700 p-1.5 focus:outline-none"
                  value={filterData}
                  onChange={e => setFilterData(e.target.value)}
                />
              </div>
            </div>

            {/* CARDS DE MÉTRICAS */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Total de Voos</p>
                  <h3 className="text-3xl font-bold mt-1">{totalVoos}</h3>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                  <Plane size={24} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Voos Concluídos</p>
                  <h3 className="text-3xl font-bold mt-1 text-emerald-400">{voosConcluidos.length}</h3>
                </div>
                <div className="p-3 bg-emerald-500/10 text-emerald-400 rounded-lg">
                  <CheckCircle2 size={24} />
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-5 rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs text-slate-400 uppercase font-semibold">Média de Efetividade</p>
                  <h3 className="text-3xl font-bold mt-1 text-blue-400">{mediaEfetividade}%</h3>
                </div>
                <div className="p-3 bg-blue-500/10 text-blue-400 rounded-lg">
                  <BarChart3 size={24} />
                </div>
              </div>
            </div>

            {/* TABELA DE VOOS */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-800/50 text-xs text-slate-400 border-b border-slate-800">
                      <th className="p-4">ANV / Etapa</th>
                      <th className="p-4">Chamada</th>
                      <th className="p-4">Decolagem Prev.</th>
                      <th className="p-4">Envolvimento (Início - Fim)</th>
                      <th className="p-4">Efetividade</th>
                      <th className="p-4">Status</th>
                      <th className="p-4">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {filteredFlights.length === 0 ? (
                      <tr>
                        <td colSpan="7" className="p-8 text-center text-slate-500">
                          Nenhum registo de voo encontrado.
                        </td>
                      </tr>
                    ) : (
                      filteredFlights.map(flight => {
                        const ef = calculateEfetividade(flight);
                        return (
                          <tr key={flight.id} className="hover:bg-slate-800/30 transition-colors">
                            <td className="p-4 font-semibold">
                              <div>{flight.anv}</div>
                              <div className="text-xs font-normal text-slate-400">{flight.etapa}</div>
                            </td>
                            <td className="p-4 text-slate-300">{flight.chamada}</td>
                            <td className="p-4 text-slate-300">{flight.decolagemPrevista}</td>
                            <td className="p-4 text-slate-300">
                              {flight.envolvimentoInicio} - {flight.envolvimentoFim}
                            </td>
                            <td className="p-4">
                              <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ef >= 80 ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'}`}>
                                {ef}%
                              </span>
                            </td>
                            <td className="p-4">
                              <select 
                                className="bg-slate-800 text-xs border border-slate-700 rounded p-1 focus:outline-none"
                                value={flight.status}
                                onChange={e => handleUpdateStatus(flight.id, e.target.value)}
                              >
                                <option value="EM ANDAMENTO">EM ANDAMENTO</option>
                                <option value="CONCLUIDO">CONCLUÍDO</option>
                                <option value="CANCELADO">CANCELADO</option>
                              </select>
                            </td>
                            <td className="p-4">
                              <button 
                                onClick={() => handleDeleteFlight(flight.id)}
                                className="p-1.5 hover:bg-red-500/20 text-red-400 rounded transition-colors"
                              >
                                <Trash2 size={16} />
                              </button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* REGISTAR VOO */}
        {activeTab === 'novo-voo' && (
          <div className="max-w-2xl mx-auto bg-slate-900 border border-slate-800 p-6 rounded-xl shadow-xl">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <PlusCircle className="text-blue-500" /> Registar Novo Voo Operacional
            </h2>

            <form onSubmit={handleAddFlight} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Aeronave (ANV)</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: FAB 2101"
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2.5 text-white"
                    value={newFlight.anv}
                    onChange={e => setNewFlight({ ...newFlight, anv: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Etapa</label>
                  <input 
                    type="text" 
                    required 
                    placeholder="Ex: SBBR - SBRJ"
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2.5 text-white"
                    value={newFlight.etapa}
                    onChange={e => setNewFlight({ ...newFlight, etapa: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Hora de Chamada</label>
                  <input 
                    type="time" 
                    required 
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2.5 text-white"
                    value={newFlight.chamada}
                    onChange={e => setNewFlight({ ...newFlight, chamada: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Decolagem Prevista</label>
                  <input 
                    type="time" 
                    required 
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2.5 text-white"
                    value={newFlight.decolagemPrevista}
                    onChange={e => setNewFlight({ ...newFlight, decolagemPrevista: e.target.value })}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400">Início de Envolvimento</label>
                  <input 
                    type="time" 
                    required 
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2.5 text-white"
                    value={newFlight.envolvimentoInicio}
                    onChange={e => setNewFlight({ ...newFlight, envolvimentoInicio: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400">Fim de Envolvimento</label>
                  <input 
                    type="time" 
                    required 
                    className="w-full mt-1 bg-slate-800 border border-slate-700 rounded p-2.5 text-white"
                    value={newFlight.envolvimentoFim}
                    onChange={e => setNewFlight({ ...newFlight, envolvimentoFim: e.target.value })}
                  />
                </div>
              </div>

              <button type="submit" className="w-full bg-blue-600 hover:bg-blue-500 font-bold py-3 rounded-lg transition-colors mt-4">
                Salvar Registo de Voo
              </button>
            </form>
          </div>
        )}

        {/* GESTÃO DE UTILIZADORES */}
        {activeTab === 'usuarios' && currentUser.role === 'ADMIN' && (
          <div className="max-w-4xl mx-auto space-y-6">
            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <ShieldCheck className="text-blue-500" /> Alterar Minha Palavra-passe
              </h2>
              <form onSubmit={handleChangePassword} className="flex gap-4">
                <input 
                  type="password" 
                  required
                  placeholder="Nova palavra-passe"
                  className="flex-1 bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  value={adminNewPass}
                  onChange={e => setAdminNewPass(e.target.value)}
                />
                <button type="submit" className="bg-blue-600 hover:bg-blue-500 px-4 py-2 rounded font-semibold text-sm">
                  Atualizar
                </button>
              </form>
            </div>

            <div className="bg-slate-900 border border-slate-800 p-6 rounded-xl">
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Users className="text-blue-500" /> Criar Novo Utilizador
              </h2>
              <form onSubmit={handleAddUser} className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <input 
                  type="text" 
                  required
                  placeholder="Nome de Utilizador"
                  className="bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  value={newUserForm.name}
                  onChange={e => setNewUserForm({ ...newUserForm, name: e.target.value })}
                />
                <input 
                  type="password" 
                  required
                  placeholder="Palavra-passe"
                  className="bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  value={newUserForm.pass}
                  onChange={e => setNewUserForm({ ...newUserForm, pass: e.target.value })}
                />
                <select 
                  className="bg-slate-800 border border-slate-700 rounded p-2 text-white"
                  value={newUserForm.role}
                  onChange={e => setNewUserForm({ ...newUserForm, role: e.target.value })}
                >
                  <option value="OPERADOR">OPERADOR</option>
                  <option value="ADMIN">ADMINISTRADOR</option>
                </select>
                <button type="submit" className="md:col-span-3 bg-emerald-600 hover:bg-emerald-500 py-2 rounded font-bold text-sm">
                  Registar Utilizador
                </button>
              </form>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
