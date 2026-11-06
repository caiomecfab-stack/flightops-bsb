import React, { useState } from 'react';
import { 
  Plane, 
  ShieldAlert, 
  Radio, 
  CloudSun, 
  Activity, 
  Clock, 
  MapPin, 
  CheckCircle2, 
  AlertTriangle,
  RefreshCw,
  Terminal
} from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [flightList] = useState([
    { id: 'FL-001', callsign: 'AZU4215', origin: 'GRU', dest: 'BSB', status: 'Em Aproximação', runway: '11R', time: '14:25' },
    { id: 'FL-002', callsign: 'GLO1820', origin: 'CGH', dest: 'BSB', status: 'Taxiando', runway: '11L', time: '14:32' },
    { id: 'FL-003', callsign: 'TAM3410', origin: 'SDU', dest: 'BSB', status: 'Pousado', runway: '29R', time: '14:18' },
    { id: 'FL-004', callsign: 'ONE889', origin: 'VCP', dest: 'BSB', status: 'Programado', runway: '-', time: '14:50' }
  ]);

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
            <p className="text-xs text-slate-400">Aeroporto Internacional de Brasília - Presidente Juscelino Kubitschek</p>
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 bg-slate-800/80 px-3 py-1.5 rounded-full border border-slate-700 text-xs text-emerald-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
            <span className="font-medium">Sistema Operacional Online</span>
          </div>
          <div className="text-right hidden sm:block">
            <div className="text-xs font-mono text-slate-300">UTC: 17:26Z</div>
            <div className="text-xs text-slate-500">METAR SBBR Ativo</div>
          </div>
        </div>
      </header>

      {/* Main Content */}
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
            <span>Voos Ativos</span>
          </button>

          <button 
            onClick={() => setActiveTab('weather')}
            className={`flex items-center space-x-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${activeTab === 'weather' ? 'bg-sky-600 text-white shadow-md' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
          >
            <CloudSun className="w-4 h-4" />
            <span>Meteorologia (METAR)</span>
          </button>

          <div className="mt-auto pt-4 border-t border-slate-800 text-xs text-slate-500 px-2">
            <p>Versão v2.4.0-prod</p>
            <p className="mt-1">Netlify Deploy OK</p>
          </div>
        </aside>

        {/* Dashboard Content */}
        <main className="flex-1 p-6 overflow-y-auto bg-slate-950">
          <div className="max-w-7xl mx-auto space-y-6">
            
            {/* Top Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase font-semibold tracking-wider">Pistas Ativas</span>
                  <MapPin className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-bold text-white">11L / 11R / 29R</div>
                <div className="text-xs text-emerald-400 mt-1 flex items-center">
                  <CheckCircle2 className="w-3 h-3 mr-1" /> Operação Normal VFR/IFR
                </div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase font-semibold tracking-wider">Voos na TMA-BSB</span>
                  <Radio className="w-4 h-4 text-amber-400" />
                </div>
                <div className="text-2xl font-bold text-white">42 Aeronaves</div>
                <div className="text-xs text-slate-400 mt-1">Fluxo estável de chegada</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase font-semibold tracking-wider">Condição do Vento</span>
                  <CloudSun className="w-4 h-4 text-sky-400" />
                </div>
                <div className="text-2xl font-bold text-white">110° / 08kt</div>
                <div className="text-xs text-slate-400 mt-1">Visibilidade superior a 10km</div>
              </div>

              <div className="bg-slate-900 border border-slate-800 p-4 rounded-xl shadow">
                <div className="flex items-center justify-between text-slate-400 mb-2">
                  <span className="text-xs uppercase font-semibold tracking-wider">Alertas de Setor</span>
                  <ShieldAlert className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="text-2xl font-bold text-white">0 Alertas</div>
                <div className="text-xs text-emerald-400 mt-1">Espaço aéreo seguro</div>
              </div>
            </div>

            {/* Flight Table Section */}
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-lg">
              <div className="p-4 border-b border-slate-800 flex items-center justify-between">
                <h2 className="text-base font-semibold text-white flex items-center">
                  <Plane className="w-4 h-4 mr-2 text-sky-400" /> Movimento de Aeronaves Recentes
                </h2>
                <span className="text-xs text-slate-400 bg-slate-800 px-2.5 py-1 rounded-md font-mono">SBBR Terminal</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-slate-950/60 text-slate-400 text-xs uppercase tracking-wider border-b border-slate-800">
                      <th className="p-3.5">ID Voo</th>
                      <th className="p-3.5">Callsign</th>
                      <th className="p-3.5">Origem</th>
                      <th className="p-3.5">Destino</th>
                      <th className="p-3.5">Pista</th>
                      <th className="p-3.5">Estado</th>
                      <th className="p-3.5 text-right">Horário</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800 text-sm">
                    {flightList.map((flight) => (
                      <tr key={flight.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono text-sky-400">{flight.id}</td>
                        <td className="p-3.5 font-semibold text-white">{flight.callsign}</td>
                        <td className="p-3.5 font-mono text-slate-300">{flight.origin}</td>
                        <td className="p-3.5 font-mono text-slate-300">{flight.dest}</td>
                        <td className="p-3.5 font-mono text-slate-300">{flight.runway}</td>
                        <td className="p-3.5">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            flight.status === 'Pousado' ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' :
                            flight.status === 'Em Aproximação' ? 'bg-sky-950 text-sky-400 border border-sky-800' :
                            'bg-amber-950 text-amber-400 border border-amber-800'
                          }`}>
                            {flight.status}
                          </span>
                        </td>
                        <td className="p-3.5 text-right font-mono text-slate-400">{flight.time}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
