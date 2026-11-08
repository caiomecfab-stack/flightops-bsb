import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState('dashboard');
  const [sidebarAberto, setSidebarAberto] = useState(true);

  // Estados de Cadastro de Voo
  const [formVoo, setFormVoo] = useState({
    aeronave: 'C-95 (BANDEIRANTE)',
    matricula: '',
    rota: '',
    dataVoo: '',
    horaChamada: '',
    horaDecolagem: '',
    horaReal: '',
    pax: '',
    pesoPax: '',
    bagagem: '',
    relacaoPrincipal: '',
    relacaoEmbarcados: ''
  });

  // Estados para Gestão de Aeronaves e Utilizadores
  const [aeronaves, setAeronaves] = useState([
    'C-95 (BANDEIRANTE)',
    'C-97 (BRASÍLIA)',
    'C-98 (CARAVAN)',
    'KC-390',
    'C-105 (AMAZONAS)',
    'H-60 (BLACK HAWK)',
    'C-99 (LEGACY)'
  ]);
  const [novaAeronave, setNovaAeronave] = useState('');
  const [utilizadores, setUtilizadores] = useState(['CAIO']);
  const [novoUser, setNovoUser] = useState('');
  const [senhaUser, setSenhaUser] = useState('');
  const [perfilUser, setPerfilUser] = useState('OPERADOR');
  const [novaSenhaAdmin, setNovaSenhaAdmin] = useState('');

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

  async function adicionarVoo(e) {
    e.preventDefault();
    try {
      const novoRegistro = {
        prefixo: formVoo.aeronave,
        matricula: formVoo.matricula || 'N/D',
        rota: formVoo.rota,
        data_voo: formVoo.dataVoo || '2026-11-08',
        horario: formVoo.horaChamada || '00:00',
        pax: Number(formVoo.pax) || 0,
        peso_pax: Number(formVoo.pesoPax) || 0,
        bagagem: Number(formVoo.bagagem) || 0,
        excluido: false
      };

      const { error } = await supabase.from('voos').insert([novoRegistro]);
      if (error) throw error;

      alert('Voo registado com sucesso na nuvem!');
      setFormVoo({ aeronave: 'C-95 (BANDEIRANTE)', matricula: '', rota: '', dataVoo: '', horaChamada: '', horaDecolagem: '', horaReal: '', pax: '', pesoPax: '', bagagem: '', relacaoPrincipal: '', relacaoEmbarcados: '' });
      setMenuAtivo('painel');
      carregarVoos();
    } catch (err) {
      alert('Erro ao adicionar voo: ' + err.message);
    }
  }

  async function moverParaLixeira(id, prefixo) {
    if (!window.confirm(`Deseja realmente enviar o voo ${prefixo || ''} para a lixeira?`)) return;
    try {
      const { error } = await supabase.from('voos').update({ excluido: true }).eq('id', id);
      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao excluir: ' + err.message);
    }
  }

  async function excluirDefinitivo(id) {
    if (!window.confirm('Deseja excluir este item permanentemente?')) return;
    try {
      const { error } = await supabase.from('voos').delete().eq('id', id);
      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao excluir definitivamente: ' + err.message);
    }
  }

  async function restaurarVoo(id) {
    try {
      const { error } = await supabase.from('voos').update({ excluido: false }).eq('id', id);
      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao restaurar: ' + err.message);
    }
  }

  const voosAtivos = voos.filter(v => !v.excluido);
  const voosLixeira = voos.filter(v => v.excluido);

  const totalVoos = voosAtivos.length;
  const totalPax = voosAtivos.reduce((acc, curr) => acc + (Number(curr.pax) || 0), 0);
  const totalBagagem = voosAtivos.reduce((acc, curr) => acc + (Number(curr.bagagem) || 0), 0);
  const pesoTotalPax = voosAtivos.reduce((acc, curr) => acc + (Number(curr.peso_pax) || 0), 0);
  const pesoTotalTransp = pesoTotalPax + totalBagagem;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070b19', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Menu Lateral Esquerdo */}
      <div style={{ width: sidebarAberto ? '260px' : '80px', backgroundColor: '#070b19', borderRight: '1px solid #141c3a', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 10, transition: 'width 0.3s' }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #141c3a' }}>
          <div style={{ backgroundColor: '#00b4d8', padding: '10px', borderRadius: '10px', color: '#070b19', fontWeight: 'bold' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '9px', color: '#8d99ae', display: 'block', marginTop: '2px' }}>POSTO CAN BR — BASE AÉREA DE BRASÍLIA (SBBR)</small>
            </div>
          )}
        </div>

        <div style={{ padding: '15px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          <div onClick={() => setMenuAtivo('dashboard')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'dashboard' ? '#00b4d8' : 'transparent', color: menuAtivo === 'dashboard' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'dashboard' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            📊 {sidebarAberto && <span>Dashboard</span>}
          </div>
          <div onClick={() => setMenuAtivo('painel')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'painel' ? '#00b4d8' : 'transparent', color: menuAtivo === 'painel' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'painel' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            📋 {sidebarAberto && <span>Painel de Voos</span>}
          </div>
          <div onClick={() => setMenuAtivo('adicionar')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'adicionar' ? '#00b4d8' : 'transparent', color: menuAtivo === 'adicionar' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'adicionar' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            ➕ {sidebarAberto && <span>Adicionar Voo</span>}
          </div>
          <div onClick={() => setMenuAtivo('desembarque')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'desembarque' ? '#00b4d8' : 'transparent', color: menuAtivo === 'desembarque' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'desembarque' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            🛬 {sidebarAberto && <span>Desembarque</span>}
          </div>
          <div onClick={() => setMenuAtivo('aeronave')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'aeronave' ? '#00b4d8' : 'transparent', color: menuAtivo === 'aeronave' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'aeronave' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            ✈️ {sidebarAberto && <span>Adicionar Aeronave</span>}
          </div>
          <div onClick={() => setMenuAtivo('relatorio')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'relatorio' ? '#00b4d8' : 'transparent', color: menuAtivo === 'relatorio' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'relatorio' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            🖨️ {sidebarAberto && <span>Imprimir Relatório</span>}
          </div>
          <div onClick={() => setMenuAtivo('utilizadores')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'utilizadores' ? '#00b4d8' : 'transparent', color: menuAtivo === 'utilizadores' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'utilizadores' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px' }}>
            👥 {sidebarAberto && <span>Utilizadores</span>}
          </div>
          <div onClick={() => setMenuAtivo('lixeira')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'lixeira' ? '#ff4d4d' : 'transparent', color: menuAtivo === 'lixeira' ? '#fff' : '#ff6b6b', fontWeight: menuAtivo === 'lixeira' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', marginTop: '10px', border: '1px dashed rgba(255, 107, 107, 0.4)' }}>
            🗑️ {sidebarAberto && <span>Lixeira ({voosLixeira.length})</span>}
          </div>
        </div>

        <div style={{ padding: '15px 12px', borderTop: '1px solid #141c3a' }}>
          <button onClick={() => setSidebarAberto(!sidebarAberto)} style={{ width: '100%', background: '#111936', border: '1px solid #1c2541', color: '#8d99ae', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px' }}>
            {sidebarAberto ? '◀ Ocultar Menu' : '▶'}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#070b19', minWidth: 0 }}>
        
        {/* Topbar */}
        <div style={{ height: '70px', borderBottom: '1px solid #141c3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', backgroundColor: '#070b19' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#00b4d8', color: '#070b19', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>✈</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>FLIGHTOPS BSB</h2>
              <small style={{ color: '#8d99ae', fontSize: '10px' }}>POSTO CAN BR — BASE AÉREA DE BRASÍLIA (SBBR)</small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ backgroundColor: '#0b2b24', color: '#06d6a0', border: '1px solid rgba(6, 214, 160, 0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>POSTO CAN BR OPERACIONAL</span>
            <span style={{ backgroundColor: '#111936', color: '#fff', border: '1px solid #1c2541', padding: '6px 16px', borderRadius: '20px', fontSize: '11px' }}>CAIO (ADMIN) 👤</span>
          </div>
        </div>

        {/* Corpo Dinâmico */}
        <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
          
          {menuAtivo === 'dashboard' && (
            <>
              {/* Filtros Operacionais */}
              <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <div style={{ color: '#00b4d8', fontSize: '12px', fontWeight: 'bold', marginBottom: '18px' }}>
                  🔍 FILTROS OPERACIONAIS — POSTO CAN BR
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>AERONAVE FAB</label>
                    <select style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                      <option>TODAS AS AERONAVES</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>DATA INICIAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>DATA FINAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>DATA ESPECÍFICA</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>MÊS / ANO</label>
                    <input type="text" placeholder("-------- de ----" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#8d99ae', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #1c2541', paddingTop: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#00b4d8', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>📍 FILTRAR PAX POR LOCALIDADE / DESTINO:</label>
                    <select style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                      <option>TODAS AS LOCALIDADES (GERAL)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#00b4d8', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>👤 FILTRAR POR STATUS DE DESEMBARQUE:</label>
                    <select style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                      <option>TODOS OS VOOS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Perfil Estatístico */}
              <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <div>
                  <div style={{ color: '#00b4d8', fontSize: '15px', fontWeight: 'bold' }}>📊 PERFIL ESTATÍSTICO OPERACIONAL</div>
                  <small style={{ color: '#8d99ae', fontSize: '12px' }}>Gere a visão consolidada por tipo de aeronave aplicando os filtros de data acima</small>
                </div>
                <button onClick={() => alert('Estatísticas geradas com sucesso!')} style={{ backgroundColor: '#00b4d8', color: '#070b19', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px' }}>
                  ⏱️ GERAR ESTATÍSTICA
                </button>
              </div>

              {/* Cartões Superiores */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <span style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold' }}>TOTAL DE VOOS</span>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#fff', textAlign: 'right' }}>{totalVoos}</div>
                  <div style={{ backgroundColor: '#00b4d8', color: '#070b19', textAlign: 'center', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>{totalVoos}</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <span style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold' }}>TOTAL DE PASSAGEIROS (PAX)</span>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#fff', textAlign: 'right' }}>{totalPax}</div>
                  <div style={{ backgroundColor: '#06d6a0', color: '#070b19', textAlign: 'center', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>{totalPax}</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <span style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold' }}>TOTAL DESEMBARCADOS</span>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#fff', textAlign: 'right' }}>0</div>
                  <div style={{ backgroundColor: '#00b4d8', color: '#070b19', textAlign: 'center', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>0</div>
                </div>
              </div>

              {/* Cartões Inferiores de Pesos */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>PESO TOTAL PAX</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4cc9f0' }}>{pesoTotalPax} KG</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>PESO TOTAL DE BAGAGEM</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffd166' }}>{totalBagagem} KG</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>PESO TOTAL TRANSP.</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6b6b' }}>{pesoTotalTransp} KG</div>
                </div>
              </div>
            </>
          )}

          {menuAtivo === 'painel' && (
            <div>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px' }}>PAINEL DE REGISTO DE VOOS — POSTO CAN BR</h3>
              {voosAtivos.length === 0 ? (
                <div style={{ color: '#8d99ae', padding: '40px', textAlign: 'center' }}>Nenhum voo registado na base de dados em nuvem.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px' }}>
                      <h4 style={{ color: '#00b4d8', margin: '0 0 10px 0' }}>{voo.prefixo}</h4>
                      <p style={{ margin: '5px 0', color: '#8d99ae', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <p style={{ margin: '5px 0', color: '#8d99ae', fontSize: '13px' }}>Data: {voo.data_voo} | Horário: {voo.horario}</p>
                      <p style={{ margin: '5px 0', color: '#8d99ae', fontSize: '13px' }}>PAX: {voo.pax} | Bagagem: {voo.bagagem} KG</p>
                      <button onClick={() => moverParaLixeira(voo.id, voo.prefixo)} style={{ marginTop: '15px', backgroundColor: 'rgba(255, 107, 107, 0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>APAGAR</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuAtivo === 'adicionar' && (
            <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '30px', maxWidth: '900px', margin: '0 auto' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px' }}>➕ ADICIONAR VOO — POSTO CAN BR</h3>
              <form onSubmit={adicionarVoo} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>TIPO DE AERONAVE FAB</label>
                    <select value={formVoo.aeronave} onChange={e => setFormVoo({...formVoo, aeronave: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px' }}>
                      {aeronaves.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>MATRÍCULA (NÃO OBRIGATÓRIA)</label>
                    <input type="text" placeholder="EX: FAB 2310" value={formVoo.matricula} onChange={e => setFormVoo({...formVoo, matricula: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>ROTA (EX: SBBR-SBGR-SBGL)</label>
                    <input type="text" required placeholder="SBBR-SBGR-SBGL" value={formVoo.rota} onChange={e => setFormVoo({...formVoo, rota: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>DATA DO VOO</label>
                    <input type="text" placeholder="dd/mm/aaaa" value={formVoo.dataVoo} onChange={e => setFormVoo({...formVoo, dataVoo: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>HORA DE CHAMADA</label>
                    <input type="text" placeholder="1330" value={formVoo.horaChamada} onChange={e => setFormVoo({...formVoo, horaChamada: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>DECOLAGEM (PREVISTA)</label>
                    <input type="text" placeholder="1530" value={formVoo.horaDecolagem} onChange={e => setFormVoo({...formVoo, horaDecolagem: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>HORA REAL (ATENDIMENTO)</label>
                    <input type="text" placeholder="1430" value={formVoo.horaReal} onChange={e => setFormVoo({...formVoo, horaReal: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>TOTAL PAX</label>
                    <input type="number" placeholder="0" value={formVoo.pax} onChange={e => setFormVoo({...formVoo, pax: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>PESO PAX (KG)</label>
                    <input type="number" placeholder="0" value={formVoo.pesoPax} onChange={e => setFormVoo({...formVoo, pesoPax: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>PESO BAGAGEM (KG)</label>
                    <input type="number" placeholder="0" value={formVoo.bagagem} onChange={e => setFormVoo({...formVoo, bagagem: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#00b4d8', display: 'block', marginBottom: '5px' }}>TOTAL DE PESO (AUTO)</label>
                    <div style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#06d6a0', padding: '12px', borderRadius: '8px', fontWeight: 'bold' }}>
                      {(Number(formVoo.pesoPax) || 0) + (Number(formVoo.bagagem) || 0)} KG
                    </div>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>QTD BAGAGENS</label>
                    <input type="number" placeholder="0" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#00b4d8', display: 'block', marginBottom: '5px' }}>📋 1. COPIAR & COLAR RELAÇÃO PRINCIPAL</label>
                    <textarea rows="5" placeholder="Reserva (FS, SGT, CEL) são ignoradas no cruzamento de nomes" value={formVoo.relacaoPrincipal} onChange={e => setFormVoo({...formVoo, relacaoPrincipal: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}></textarea>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#06d6a0', display: 'block', marginBottom: '5px' }}>👤 2. COPIAR & COLAR EFETIVAMENTE EMBARCADOS</label>
                    <textarea rows="5" placeholder="O nome limpo coincidirá mesmo se omitir a patente nesta lista" value={formVoo.relacaoEmbarcados} onChange={e => setFormVoo({...formVoo, relacaoEmbarcados: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }}></textarea>
                  </div>
                </div>

                <button type="submit" style={{ backgroundColor: '#00b4d8', color: '#070b19', border: 'none', padding: '15px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                  SALVAR VOO E GERAR RELATÓRIO DO POSTO CAN BR
                </button>
              </form>
            </div>
          )}

          {menuAtivo === 'desembarque' && (
            <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '30px' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '10px' }}>🛬 GESTÃO E FILTRO DE DESEMBARQUE — MÚLTIPLOS VOOS</h3>
              <p style={{ color: '#8d99ae', fontSize: '13px', marginBottom: '20px' }}>Filtre por aeronave, data inicial, data final, data específica ou mês/ano, selecione múltiplos voos e indique o total de passageiros desembarcados.</p>
              {voosAtivos.length === 0 ? (
                <div style={{ color: '#8d99ae', padding: '40px', textAlign: 'center' }}>Nenhum voo disponível para desembarque.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                        <h4 style={{ color: '#00b4d8', margin: 0 }}>{voo.prefixo}</h4>
                        <span style={{ backgroundColor: '#111936', color: '#06d6a0', padding: '4px 10px', borderRadius: '6px', fontSize: '11px' }}>DATA: {voo.data_voo}</span>
                      </div>
                      <p style={{ margin: '5px 0', color: '#8d99ae', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <div style={{ marginTop: '15px' }}>
                        <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>QTD DESEMBARCADOS:</label>
                        <input type="number" placeholder="0" style={{ width: '100%', backgroundColor: '#111936', border: '1px solid #1c2541', color: '#fff', padding: '10px', borderRadius: '8px', boxSizing: 'border-box' }} />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuAtivo === 'aeronave' && (
            <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px' }}>✈️ REGISTAR E GERIR AERONAVES FAB</h3>
              <div style={{ display: 'flex', gap: '15px', marginBottom: '25px' }}>
                <input type="text" placeholder="EX: C-130 HÉRCULES" value={novaAeronave} onChange={e => setNovaAeronave(e.target.value)} style={{ flex: 1, backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px' }} />
                <button onClick={() => { if(novaAeronave) { setAeronaves([...aeronaves, novaAeronave.toUpperCase()]); setNovaAeronave(''); }}} style={{ backgroundColor: '#00b4d8', color: '#070b19', border: 'none', padding: '12px 24px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ADICIONAR AERONAVE</button>
              </div>
              <h4 style={{ color: '#8d99ae', marginBottom: '15px' }}>AERONAVES REGISTADAS:</h4>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {aeronaves.map(a => (
                  <div key={a} style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', padding: '12px 18px', borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span>{a}</span>
                    <button onClick={() => setAeronaves(aeronaves.filter(item => item !== a))} style={{ backgroundColor: 'rgba(255, 107, 107, 0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '4px 10px', borderRadius: '6px', cursor: 'pointer', fontSize: '11px' }}>APAGAR</button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {menuAtivo === 'relatorio' && (
            <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '30px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <h3 style={{ color: '#00b4d8', margin: 0 }}>🖨️ GERADOR E IMPRESSÃO DE RELATÓRIO — POSTO CAN BR</h3>
                <button onClick={() => window.print()} style={{ backgroundColor: '#00b4d8', color: '#070b19', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>IMPRIMIR / EXPORTAR</button>
              </div>
              <div style={{ backgroundColor: '#fff', color: '#000', padding: '30px', borderRadius: '8px' }}>
                <h3 style={{ textAlign: 'center', margin: 0 }}>COMANDO DA AERONÁUTICA</h3>
                <p style={{ textAlign: 'center', fontSize: '12px', color: '#555' }}>BASE AÉREA DE BRASÍLIA — POSTO CAN BR<br/>RELATÓRIO OPERACIONAL DE VOOS</p>
                <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: '20px', fontSize: '13px' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid #000', textAlign: 'left' }}>
                      <th style={{ padding: '8px' }}>DATA / DIA</th>
                      <th style={{ padding: '8px' }}>AERONAVE / MATR.</th>
                      <th style={{ padding: '8px' }}>ROTA</th>
                      <th style={{ padding: '8px' }}>PAX</th>
                      <th style={{ padding: '8px' }}>DESEMBARCADOS</th>
                      <th style={{ padding: '8px' }}>PESO TOTAL</th>
                    </tr>
                  </thead>
                  <tbody>
                    {voosAtivos.map(v => (
                      <tr key={v.id} style={{ borderBottom: '1px solid #ddd' }}>
                        <td style={{ padding: '8px' }}>{v.data_voo}</td>
                        <td style={{ padding: '8px' }}>{v.prefixo}</td>
                        <td style={{ padding: '8px' }}>{v.rota}</td>
                        <td style={{ padding: '8px' }}>{v.pax}</td>
                        <td style={{ padding: '8px' }}>0</td>
                        <td style={{ padding: '8px' }}>{v.peso_pax + v.bagagem} KG</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {menuAtivo === 'utilizadores' && (
            <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px' }}>👥 SEGURANÇA E GESTÃO DE UTILIZADORES</h3>
              <div style={{ marginBottom: '30px' }}>
                <h4 style={{ color: '#8d99ae', fontSize: '13px', marginBottom: '10px' }}>NOVA SENHA PARA O ADMINISTRADOR CAIO</h4>
                <div style={{ display: 'flex', gap: '15px' }}>
                  <input type="password" placeholder="DIGITE A NOVA SENHA" value={novaSenhaAdmin} onChange={e => setNovaSenhaAdmin(e.target.value)} style={{ flex: 1, backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px' }} />
                  <button onClick={() => { if(novaSenhaAdmin) { alert('Senha atualizada com sucesso!'); setNovaSenhaAdmin(''); }}} style={{ backgroundColor: '#00b4d8', color: '#070b19', border: 'none', padding: '12px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>ATUALIZAR SENHA</button>
                </div>
              </div>
              <div>
                <h4 style={{ color: '#8d99ae', fontSize: '13px', marginBottom: '10px' }}>CADASTRAR NOVO UTILIZADOR / OPERADOR</h4>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <input type="text" placeholder="NOME DO UTILIZADOR (EX: 2S OLIVEIRA)" value={novoUser} onChange={e => setNovoUser(e.target.value)} style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px' }} />
                  <input type="password" placeholder="SENHA DE ACESSO" value={senhaUser} onChange={e => setSenhaUser(e.target.value)} style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px' }} />
                  <select value={perfilUser} onChange={e => setPerfilUser(e.target.value)} style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px' }}>
                    <option value="OPERADOR">OPERADOR</option>
                    <option value="ADMINISTRADOR">ADMINISTRADOR</option>
                  </select>
                  <button onClick={() => { if(novoUser) { setUtilizadores([...utilizadores, novoUser.toUpperCase()]); setNovoUser(''); setSenhaUser(''); }}} style={{ backgroundColor: '#06d6a0', color: '#070b19', border: 'none', padding: '14px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>CADASTRAR UTILIZADOR</button>
                </div>
                <h4 style={{ color: '#8d99ae', fontSize: '13px', marginTop: '25px', marginBottom: '10px' }}>UTILIZADORES CADASTRADOS:</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {utilizadores.map(u => (
                    <span key={u} style={{ backgroundColor: '#070b19', border: '1px solid #1c2541', padding: '8px 16px', borderRadius: '8px', fontSize: '12px', fontWeight: 'bold' }}>{u}</span>
                  ))}
                </div>
              </div>
            </div>
          )}

          {menuAtivo === 'lixeira' && (
            <div>
              <h3 style={{ color: '#ff6b6b', marginBottom: '20px' }}>🗑️ LIXEIRA DE VOOS</h3>
              <p style={{ color: '#8d99ae', fontSize: '13px', marginBottom: '20px' }}>Os voos enviados para aqui ficam salvos na nuvem. Pode restaurá-los ou excluí-los definitivamente.</p>
              {voosLixeira.length === 0 ? (
                <div style={{ color: '#8d99ae', padding: '40px', textAlign: 'center' }}>A lixeira está vazia.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {voosLixeira.map(voo => (
                    <div key={voo.id} style={{ backgroundColor: '#111936', border: '1px solid rgba(255, 107, 107, 0.3)', borderRadius: '12px', padding: '20px' }}>
                      <h4 style={{ color: '#ff6b6b', margin: '0 0 10px 0' }}>{voo.prefixo}</h4>
                      <p style={{ margin: '5px 0', color: '#8d99ae', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <div style={{ display: 'flex', gap: '10px', marginTop: '15px' }}>
                        <button onClick={() => restaurarVoo(voo.id)} style={{ backgroundColor: '#00b4d8', border: 'none', color: '#070b19', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>RESTAURAR</button>
                        <button onClick={() => excluirDefinitivo(voo.id)} style={{ backgroundColor: '#ff6b6b', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontWeight: 'bold' }}>EXCLUIR DEFINITIVO</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
