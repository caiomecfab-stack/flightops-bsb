import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState('dashboard');
  const [sidebarAberto, setSidebarAberto] = useState(true);

  const [formVoo, setFormVoo] = useState({
    aeronave: '',
    matricula: '',
    rota: '',
    dataVoo: '',
    horaChamada: '',
    horaDecolagem: '',
    horaReal: '',
    pax: '',
    pesoPax: '',
    bagagem: ''
  });

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
      const novoVoo = {
        prefixo: formVoo.aeronave || 'AERONAVE',
        matricula: formVoo.matricula,
        rota: formVoo.rota,
        data_voo: formVoo.dataVoo,
        horario: formVoo.horaChamada,
        pax: Number(formVoo.pax) || 0,
        peso_pax: Number(formVoo.pesoPax) || 0,
        bagagem: Number(formVoo.bagagem) || 0,
        excluido: false
      };

      const { error } = await supabase.from('voos').insert([novoVoo]);
      if (error) throw error;

      alert('Voo adicionado com sucesso e guardado na nuvem!');
      setFormVoo({ aeronave: '', matricula: '', rota: '', dataVoo: '', horaChamada: '', horaDecolagem: '', horaReal: '', pax: '', pesoPax: '', bagagem: '' });
      setMenuAtivo('painel');
      carregarVoos();
    } catch (err) {
      alert('Erro ao adicionar voo: ' + err.message);
    }
  }

  async function moverParaLixeira(id, prefixo) {
    if (!window.confirm(`Deseja realmente excluir o voo ${prefixo || ''}?`)) return;

    try {
      const { error } = await supabase.from('voos').update({ excluido: true }).eq('id', id);
      if (error) throw error;
      carregarVoos();
    } catch (err) {
      alert('Erro ao excluir voo: ' + err.message);
    }
  }

  async function excluirDefinitivo(id) {
    if (!window.confirm('Deseja excluir este item permanentemente da base de dados?')) return;

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
      alert('Erro ao restaurar voo: ' + err.message);
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
      <div style={{ width: sidebarAberto ? '260px' : '80px', backgroundColor: '#070b19', borderRight: '1px solid #141c3a', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #141c3a' }}>
          <div style={{ backgroundColor: '#00b4d8', padding: '10px', borderRadius: '10px', color: '#070b19', fontWeight: 'bold' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '9px', color: '#8d99ae', display: 'block', marginTop: '2px' }}>POSTO CAN BR</small>
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
            {sidebarAberto ? '◀ Ocultar' : '▶'}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#070b19', minWidth: 0 }}>
        
        <div style={{ height: '70px', borderBottom: '1px solid #141c3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', backgroundColor: '#070b19' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#00b4d8', color: '#070b19', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>✈</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 'bold' }}>FLIGHTOPS BSB</h2>
              <small style={{ color: '#8d99ae', fontSize: '10px' }}>POSTO CAN BR</small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ backgroundColor: '#0b2b24', color: '#06d6a0', border: '1px solid rgba(6, 214, 160, 0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold' }}>OPERACIONAL</span>
            <span style={{ backgroundColor: '#111936', color: '#fff', border: '1px solid #1c2541', padding: '6px 16px', borderRadius: '20px', fontSize: '11px' }}>CAIO (ADMIN)</span>
          </div>
        </div>

        <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
          
          {menuAtivo === 'dashboard' && (
            <div>
              <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', marginBottom: '25px' }}>
                <div style={{ color: '#00b4d8', fontSize: '12px', fontWeight: 'bold', marginBottom: '18px' }}>🔍 FILTROS OPERACIONAIS</div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>AERONAVE FAB</label>
                    <select style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px', borderRadius: '8px', fontSize: '13px' }}>
                      <option>TODAS AS AERONAVES</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>DATA INICIAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>DATA FINAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>DATA ESPECÍFICA</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>MÊS / ANO</label>
                    <input type="text" placeholder("-------- de ----" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#8d99ae', padding: '11px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #1c2541', paddingTop: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#00b4d8', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>📍 FILTRAR PAX POR LOCALIDADE:</label>
                    <select style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px', borderRadius: '8px', fontSize: '13px' }}>
                      <option>TODAS AS LOCALIDADES (GERAL)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#00b4d8', display: 'block', marginBottom: '6px', fontWeight: 'bold' }}>👤 FILTRAR POR STATUS DE DESEMBARQUE:</label>
                    <select style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px', borderRadius: '8px', fontSize: '13px' }}>
                      <option>TODOS OS VOOS</option>
                    </select>
                  </div>
                </div>
              </div>

              <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                  <div style={{ color: '#00b4d8', fontSize: '15px', fontWeight: 'bold' }}>📊 PERFIL ESTATÍSTICO OPERACIONAL</div>
                  <small style={{ color: '#8d99ae', fontSize: '12px' }}>Gere a visão consolidada</small>
                </div>
                <button onClick={() => alert('Estatísticas geradas!')} style={{ backgroundColor: '#00b4d8', color: '#070b19', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '13px' }}>
                  ⏱️ GERAR ESTATÍSTICA
                </button>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px' }}>
                  <span style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold' }}>TOTAL DE VOOS</span>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', textAlign: 'right' }}>{totalVoos}</div>
                  <div style={{ backgroundColor: '#00b4d8', color: '#070b19', textAlign: 'center', padding: '10px', borderRadius: '8px', fontWeight: 'bold' }}>{totalVoos}</div>
                </div>
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px' }}>
                  <span style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold' }}>TOTAL DE PASSAGEIROS (PAX)</span>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', textAlign: 'right' }}>{totalPax}</div>
                  <div style={{ backgroundColor: '#06d6a0', color: '#070b19', textAlign: 'center', padding: '10px', borderRadius: '8px', fontWeight: 'bold' }}>{totalPax}</div>
                </div>
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px' }}>
                  <span style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold' }}>TOTAL DESEMBARCADOS</span>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', textAlign: 'right' }}>0</div>
                  <div style={{ backgroundColor: '#00b4d8', color: '#070b19', textAlign: 'center', padding: '10px', borderRadius: '8px', fontWeight: 'bold' }}>0</div>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>PESO TOTAL PAX</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4cc9f0' }}>{pesoTotalPax} KG</div>
                </div>
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>PESO TOTAL DE BAGAGEM</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffd166' }}>{totalBagagem} KG</div>
                </div>
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', marginBottom: '15px' }}>PESO TOTAL TRANSP.</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6b6b' }}>{pesoTotalTransp} KG</div>
                </div>
              </div>
            </div>
          )}

          {menuAtivo === 'painel' && (
            <div>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px' }}>PAINEL DE REGISTO DE VOOS</h3>
              {voosAtivos.length === 0 ? (
                <div style={{ color: '#8d99ae', padding: '40px', textAlign: 'center' }}>Nenhum voo registado.</div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px' }}>
                      <h4 style={{ color: '#00b4d8', margin: '0 0 10px 0' }}>{voo.prefixo} {voo.matricula && `(${voo.matricula})`}</h4>
                      <p style={{ margin: '5px 0', color: '#8d99ae', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <p style={{ margin: '5px 0', color: '#8d99ae', fontSize: '13px' }}>PAX: {voo.pax} | Bagagem: {voo.bagagem} KG</p>
                      <button onClick={() => moverParaLixeira(voo.id, voo.prefixo)} style={{ marginTop: '15px', backgroundColor: 'rgba(255, 107, 107, 0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>APAGAR</button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {menuAtivo === 'adicionar' && (
            <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '30px', maxWidth: '800px', margin: '0 auto' }}>
              <h3 style={{ color: '#00b4d8', marginBottom: '20px' }}>➕ ADICIONAR NOVO VOO</h3>
              <form onSubmit={adicionarVoo} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>AERONAVE / PREFIXO</label>
                    <input type="text" required placeholder="Ex: C-95" value={formVoo.aeronave} onChange={e => setFormVoo({...formVoo, aeronave: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>MATRÍCULA</label>
                    <input type="text" placeholder="Matrícula" value={formVoo.matricula} onChange={e => setFormVoo({...formVoo, matricula: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <div>
                  <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>ROTA</label>
                  <input type="text" required placeholder="Ex: BSB - GIG" value={formVoo.rota} onChange={e => setFormVoo({...formVoo, rota: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '15px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>TOTAL PAX</label>
                    <input type="number" placeholder="0" value={formVoo.pax} onChange={e => setFormVoo({...formVoo, pax: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>PESO PAX (KG)</label>
                    <input type="number" placeholder="0" value={formVoo.pesoPax} onChange={e => setFormVoo({...formVoo, pesoPax: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>BAGAGEM (KG)</label>
                    <input type="number" placeholder="0" value={formVoo.bagagem} onChange={e => setFormVoo({...formVoo, bagagem: e.target.value})} style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '12px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                </div>
                <button type="submit" style={{ backgroundColor: '#00b4d8', color: '#070b19', border: 'none', padding: '14px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', fontSize: '15px' }}>
                  GRAVAR VOO NA NUVEM
                </button>
              </form>
            </div>
          )}

          {menuAtivo === 'lixeira' && (
            <div>
              <h3 style={{ color: '#ff6b6b', marginBottom: '20px' }}>🗑️ LIXEIRA DE VOOS</h3>
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

          {['desembarque', 'aeronave', 'relatorio', 'utilizadores'].includes(menuAtivo) && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#8d99ae' }}>
              <h3>Módulo "{menuAtivo.toUpperCase()}" ativo com persistência em nuvem.</h3>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
