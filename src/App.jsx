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
  PieChart,
  User
} from 'lucide-react';

// ==========================================
// CONFIGURAÇÃO DA NUVEM (SUPABASE)
// ==========================================
const SUPABASE_URL = 'COLOQUE_A_URL_DO_SUPABASE_AQUI';
const SUPABASE_ANON_KEY = 'COLOQUE_A_CHAVE_ANON_DO_SUPABASE_AQUI';

const supabase = (SUPABASE_URL.startsWith('http') && SUPABASE_ANON_KEY.length > 10) 
  ? createClient(SUPABASE_URL, SUPABASE_ANON_KEY) 
  : null;

export default function App() {
  const [currentUser, setCurrentUser] = useState({ name: 'CAIO', role: 'ADMIN' });
  const [authView, setAuthView] = useState('login');
  const [loginInput, setLoginInput] = useState({ user: '', pass: '' });
  
  const [usersList, setUsersList] = useState([
    { name: 'CAIO', pass: 'admin123', role: 'ADMIN' }
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

  // Estados dos Filtros Gerais (Dashboard)
  const [filterAircraft, setFilterAircraft] = useState('ALL');
  const [filterStartDate, setFilterStartDate] = useState('');
  const [filterEndDate, setFilterEndDate] = useState('');
  const [filterDate, setFilterDate] = useState('');
  const [filterMonthYear, setFilterMonthYear] = useState('');

  // Filtros Específicos do Dashboard
  const [dashboardDestinationFilter, setDashboardDestinationFilter] = useState('ALL');
  const [dashboardDebarkFilter, setDashboardDebarkFilter] = useState('ALL');

  const [showStatsReport, setShowStatsReport] = useState(false);

  // Filtros de Relatório
  const [reportAircraft, setReportAircraft] = useState('ALL');
  const [reportStartDate, setReportStartDate] = useState('');
  const [reportEndDate, setReportEndDate] = useState('');
  const [reportSpecificDate, setReportSpecificDate] = useState('');

  // Filtros da Aba Desembarque
  const [debarkFilterAircraft, setDebarkFilterAircraft] = useState('ALL');
  const [debarkStartDate, setDebarkStartDate] = useState('');
  const [debarkEndDate, setDebarkEndDate] = useState('');
  const [debarkSpecificDate, setDebarkSpecificDate] = useState('');
  const [debarkMonthYear, setDebarkMonthYear] = useState('');

  const [selectedDebarkFlightIds, setSelectedDebarkFlightIds] = useState([]);
  const [debarkInputs, setDebarkInputs] = useState({});

  // Estado dos Voos
  const [flightList, setFlightList] = useState([
    { 
      id: 'FL-001', 
      aircraft: 'C-97 (BRASÍLIA)', 
      matric
