import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState('dashboard');
  const [sidebarAberto, setSidebarAberto] = useState(true);

  // Carregar voos do Supabase ao iniciar
  useEffect(() => {
    carregarVoos();
  }, []);

  async function carregarVoos() {
    try {
      const { data, error } = await supabase.from('voos').select('*');
      if (error) throw error;
      if (data) setVoos(data);
    } catch (err) {
      console.error('Erro ao carregar voos:', err.message);
    }
  }

  // Enviar para a lixeira (com confirmação)
  async function moverParaLixeira(id, prefixo) {
    const confirmar = window.confirm(`Deseja realmente excluir o voo ${prefixo || ''}?`);
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('voos')
        .update({ excluido: true })
        .eq('id', id);

      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao excluir voo: ' + err.message);
    }
  }

  // Excluir permanentemente da lixeira
  async function excluirDefinitivo(id) {
    const confirmar = window.confirm('Deseja excluir este item permanentemente?');
    if (!confirmar) return;

    try {
      const { error } = await supabase
        .from('voos')
        .delete()
        .eq('id', id);

      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao excluir definitivamente: ' + err.message);
    }
  }

  // Restaurar da lixeira
  async function restaurarVoo(id) {
    try {
      const { error } = await supabase
        .from('voos')
        .update({ excluido: false })
        .eq('id', id);

      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao restaurar voo: ' + err.message);
    }
  }

  const voosAtivos = voos.filter(v => !v.excluido);
  const voosLixeira = voos.filter(v => v.excluido);

  // Cálculos estatísticos para o Dashboard baseados nos dados reais
  const totalVoos = voosAtivos.length;
  const totalPax = voosAtivos.reduce((acc, curr) => acc + (Number(curr.pax) || 0), 0);
  const totalBagagem = voosAtivos.reduce((acc, curr) => acc + (Number(curr.bagagem) || 0), 0);
  const pesoTotalPax = voosAtivos.reduce((acc, curr) => acc + (Number(curr.peso_pax) || 0), 0);
  const pesoTotalTransp = pesoTotalPax + totalBagagem;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070b19', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Menu Lateral Esquerdo */}
      <div style={{ width: sidebarAberto ? '260px' : '80px', backgroundColor: '#070b19', borderRight: '1px solid #161b2e', transition: 'width 0.3s', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #161b2e' }}>
          <div style={{ backgroundColor: '#00b4d8', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#00b4d8' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '10px', color: '#8d99ae' }}>BASE AÉREA DE BRASÍLIA</small>
            </div>
          )}
        </div>

        <div style={{ padding: '15px', display: 'flex', flexDirection: 'column', gap: '6px', flex: 1, overflowY: 'auto' }}>
          
          <div onClick={() => setMenuAtivo('dashboard')} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'dashboard' ? '#00b4d8' : 'transparent', color: menuAtivo === 'dashboard' ? '#070b19' : '#8d99ae', fontWeight: menuAtivo === 'dashboard' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px' }}>
            📊 {sidebarAberto && <span>Dashboard</span>}
          </div>

          <div onClick={() => setMenuAtivo('painel')} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'painel' ? '#00b4d8' : 'transparent', color: menuAtivo === 'painel' ? '#070b19' : '#8d99ae', fontWeight: menuAtivo === 'painel' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px' }}>
            📋 {sidebarAberto && <span>Painel de Voos</span>}
          </div>

          <div onClick={() => setMenuAtivo('adicionar')} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'adicionar' ? '#00b4d8' : 'transparent', color: menuAtivo === 'adicionar' ? '#070b19' : '#8d99ae', fontWeight: menuAtivo === 'adicionar' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px' }}>
            ➕ {sidebarAberto && <span>Adicionar Voo</span>}
          </div>

          <div onClick={() => setMenuAtivo('desembarque')} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'desembarque' ? '#00b4d8' : 'transparent', color: menuAtivo === 'desembarque' ? '#070b19' : '#8d99ae', fontWeight: menuAtivo === 'desembarque' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px' }}>
            🛬 {sidebarAberto && <span>Desembarque</span>}
          </div>

          <div onClick={() => setMenuAtivo('aeronave')} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'aeronave' ? '#00b4d8' : 'transparent', color: menuAtivo === 'aeronave' ? '#070b19' : '#8d99ae', fontWeight: menuAtivo === 'aeronave' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px' }}>
            ✈️ {sidebarAberto && <span>Adicionar Aeronave</span>}
          </div>

          <div onClick={() => setMenuAtivo('relatorio')} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'relatorio' ? '#00b4d8' : 'transparent', color: menuAtivo === 'relatorio' ? '#070b19' : '#8d99ae', fontWeight: menuAtivo === 'relatorio' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px' }}>
            🖨️ {sidebarAberto && <span>Imprimir Relatório</span>}
          </div>

          <div onClick={() => setMenuAtivo('utilizadores')} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'utilizadores' ? '#00b4d8' : 'transparent', color: menuAtivo === 'utilizadores' ? '#070b19' : '#8d99ae', fontWeight: menuAtivo === 'utilizadores' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px' }}>
            👥 {sidebarAberto && <span>Utilizadores</span>}
          </div>

          {/* Lixeira solicitada */}
          <div onClick={() => setMenuAtivo('lixeira')} style={{ padding: '12px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'lixeira' ? '#ff6b6b' : 'transparent', color: menuAtivo === 'lixeira' ? '#fff' : '#ff6b6b', fontWeight: menuAtivo === 'lixeira' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px', marginTop: '10px', border: '1px dashed #ff6b6b55' }}>
            🗑️ {sidebarAberto && <span>Lixeira ({voosLixeira.length})</span>}
          </div>

        </div>

        <div style={{ padding: '15px', borderTop: '1px solid #161b2e', textAlign: 'center' }}>
          <button onClick={() => setSidebarAberto(!sidebarAberto)} style={{ background: 'transparent', border: 'none', color: '#8d99ae', cursor: 'pointer', fontSize: '12px' }}>
            {sidebarAberto ? '◀ Ocultar Menu' : '▶'}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        
        {/* Topbar */}
        <div style={{ height: '70px', borderBottom: '1px solid #161b2e', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', backgroundColor: '#070b19' }}>
          <div>
            <h2 style={{ margin: 0, fontSize: '18px', color: '#fff' }}>FLIGHTOPS BSB</h2>
            <small style={{ color: '#8d99ae', fontSize: '11px' }}>POSTO CAN BR — BASE AÉREA DE BRASÍLIA (SBBR)</small>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ backgroundColor: '#0e2b24', color: '#06d6a0', border: '1px solid #06d6a033', padding: '6px 14px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>POSTO CAN BR OPERACIONAL</span>
            <span style={{ backgroundColor: '#111936', color: '#fff', border: '1px solid #1c2541', padding: '6px 14px', borderRadius: '20px', fontSize: '11px' }}>CAIO (ADMIN) 👤</span>
          </div>
        </div>

        {/* Corpo Dinâmico */}
        <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
          
          {menuAtivo === 'dashboard' && (
            <>
              {/* Filtros Operacionais */}
              <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px', marginBottom: '25px' }}>
                <div style={{ color: '#00b4d8', fontSize: '13px', fontWeight: 'bold', marginBottom: '15px' }}>🔍 FILTROS OPERACIONAIS — POSTO CAN BR</div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>AERONAVE FAB</label>
                    <select style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '10px', borderRadius: '8px' }}>
                      <option>TODAS AS AERONAVES</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>DATA INICIAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '10px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>DATA FINAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '10px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '
