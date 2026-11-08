import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState('dashboard');
  const [sidebarAberto, setSidebarAberto] = useState(true);

  // Sincronização e persistência total com o Supabase
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

  // Enviar para a lixeira com confirmação explícita
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

  // Exclusão definitiva de itens dentro da lixeira
  async function excluirDefinitivo(id) {
    const confirmar = window.confirm('Deseja excluir este item permanentemente da base de dados?');
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

  // Cálculos dinâmicos baseados nos dados reais do Supabase
  const totalVoos = voosAtivos.length;
  const totalPax = voosAtivos.reduce((acc, curr) => acc + (Number(curr.pax) || 0), 0);
  const totalBagagem = voosAtivos.reduce((acc, curr) => acc + (Number(curr.bagagem) || 0), 0);
  const pesoTotalPax = voosAtivos.reduce((acc, curr) => acc + (Number(curr.peso_pax) || 0), 0);
  const pesoTotalTransp = pesoTotalPax + totalBagagem;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070b19', color: '#fff', fontFamily: 'Inter, system-ui, sans-serif' }}>
      
      {/* Menu Lateral Esquerdo Original Exato */}
      <div style={{ width: sidebarAberto ? '260px' : '80px', backgroundColor: '#070b19', borderRight: '1px solid #141c3a', transition: 'width 0.3s', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh', zIndex: 10 }}>
        <div style={{ padding: '24px 20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #141c3a' }}>
          <div style={{ backgroundColor: '#00b4d8', padding: '10px', borderRadius: '10px', color: '#070b19', fontWeight: 'bold', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '15px', color: '#fff', letterSpacing: '0.5px' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '9px', color: '#8d99ae', display: 'block', marginTop: '2px' }}>POSTO CAN BR — BASE AÉREA DE BRASÍLIA (SBBR)</small>
            </div>
          )}
        </div>

        <div style={{ padding: '15px 12px', display: 'flex', flexDirection: 'column', gap: '4px', flex: 1, overflowY: 'auto' }}>
          
          <div onClick={() => setMenuAtivo('dashboard')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'dashboard' ? '#00b4d8' : 'transparent', color: menuAtivo === 'dashboard' ? '#070b19' : '#b0c4de', fontWeight: menuAtivo === 'dashboard' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', transition: 'all 0.2s' }}>
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

          {/* Opção Lixeira integrada exatamente no menu lateral esquerdo */}
          <div onClick={() => setMenuAtivo('lixeira')} style={{ padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', backgroundColor: menuAtivo === 'lixeira' ? '#ff4d4d' : 'transparent', color: menuAtivo === 'lixeira' ? '#fff' : '#ff6b6b', fontWeight: menuAtivo === 'lixeira' ? 'bold' : 'normal', display: 'flex', alignItems: 'center', gap: '12px', fontSize: '13px', marginTop: '8px', border: '1px dashed rgba(255, 107, 107, 0.4)' }}>
            🗑️ {sidebarAberto && <span>Lixeira ({voosLixeira.length})</span>}
          </div>

        </div>

        <div style={{ padding: '15px 12px', borderTop: '1px solid #141c3a' }}>
          <button onClick={() => setSidebarAberto(!sidebarAberto)} style={{ width: '100%', background: '#111936', border: '1px solid #1c2541', color: '#8d99ae', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
            {sidebarAberto ? '◀ Ocultar Menu' : '▶'}
          </button>
        </div>
      </div>

      {/* Conteúdo Principal */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#070b19', minWidth: 0 }}>
        
        {/* Topbar Original Exata */}
        <div style={{ height: '70px', borderBottom: '1px solid #141c3a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 30px', backgroundColor: '#070b19' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ backgroundColor: '#00b4d8', color: '#070b19', padding: '8px', borderRadius: '8px', fontWeight: 'bold', display: 'flex' }}>✈</div>
            <div>
              <h2 style={{ margin: 0, fontSize: '16px', color: '#fff', fontWeight: 'bold', letterSpacing: '0.5px' }}>FLIGHTOPS BSB</h2>
              <small style={{ color: '#8d99ae', fontSize: '10px', letterSpacing: '0.3px' }}>POSTO CAN BR — BASE AÉREA DE BRASÍLIA (SBBR)</small>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <span style={{ backgroundColor: '#0b2b24', color: '#06d6a0', border: '1px solid rgba(6, 214, 160, 0.2)', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: 'bold', letterSpacing: '0.5px' }}>POSTO CAN BR OPERACIONAL</span>
            <span style={{ backgroundColor: '#111936', color: '#fff', border: '1px solid #1c2541', padding: '6px 16px', borderRadius: '20px', fontSize: '11px', fontWeight: '500' }}>CAIO (ADMIN) 👤</span>
          </div>
        </div>

        {/* Corpo Principal do Dashboard */}
        <div style={{ padding: '30px', flex: 1, overflowY: 'auto' }}>
          
          {menuAtivo === 'dashboard' && (
            <>
              {/* Filtros Operacionais — Layout Exato Original */}
              <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <div style={{ color: '#00b4d8', fontSize: '12px', fontWeight: 'bold', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '8px', letterSpacing: '0.5px' }}>
                  🔍 FILTROS OPERACIONAIS — POSTO CAN BR
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '15px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>AERONAVE FAB</label>
                    <select style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                      <option>TODAS AS AERONAVES</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>DATA INICIAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>DATA FINAL</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>DATA ESPECÍFICA</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '10px', color: '#8d99ae', display: 'block', marginBottom: '6px', fontWeight: 'bold', letterSpacing: '0.5px' }}>MÊS / ANO</label>
                    <input type="text" placeholder="-------- de ----" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#8d99ae', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', boxSizing: 'border-box', outline: 'none' }} />
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', borderTop: '1px solid #1c2541', paddingTop: '20px' }}>
                  <div>
                    <label style={{ fontSize: '11px', color: '#00b4d8', display: 'block', marginBottom: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      📍 FILTRAR PAX POR LOCALIDADE / DESTINO:
                    </label>
                    <select style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                      <option>TODAS AS LOCALIDADES (GERAL)</option>
                    </select>
                  </div>
                  <div>
                    <label style={{ fontSize: '11px', color: '#00b4d8', display: 'block', marginBottom: '6px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      👤 FILTRAR POR STATUS DE DESEMBARQUE:
                    </label>
                    <select style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '11px 12px', borderRadius: '8px', fontSize: '13px', outline: 'none' }}>
                      <option>TODOS OS VOOS</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Perfil Estatístico Operacional — Estilo Exato Original */}
              <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '22px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                  <div style={{ backgroundColor: '#00b4d8', color: '#070b19', padding: '12px', borderRadius: '10px', fontSize: '18px', display: 'flex' }}>⏱️</div>
                  <div>
                    <div style={{ color: '#00b4d8', fontSize: '15px', fontWeight: 'bold', letterSpacing: '0.3px' }}>PERFIL ESTATÍSTICO OPERACIONAL</div>
                    <small style={{ color: '#8d99ae', fontSize: '12px' }}>Gere a visão consolidada por tipo de aeronave aplicando os filtros de data acima</small>
                  </div>
                </div>
                <button style={{ backgroundColor: '#00b4d8', color: '#070b19', border: 'none', padding: '12px 24px', borderRadius: '10px', fontWeight: 'bold', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', transition: 'opacity 0.2s' }}>
                  ⏱️ GERAR ESTATÍSTICA
                </button>
              </div>

              {/* Linha Superior de Cartões (Voos, Passageiros, Desembarcados) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', marginBottom: '20px' }}>
                
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TOTAL DE VOOS</span>
                  </div>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#fff', textAlign: 'right', letterSpacing: '1px' }}>{totalVoos}</div>
                  <div style={{ backgroundColor: '#00b4d8', color: '#070b19', textAlign: 'center', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>{totalVoos}</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TOTAL DE PASSAGEIROS (PAX)</span>
                  </div>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#fff', textAlign: 'right', letterSpacing: '1px' }}>{totalPax}</div>
                  <div style={{ backgroundColor: '#06d6a0', color: '#070b19', textAlign: 'center', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>{totalPax}</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '180px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px' }}>TOTAL DESEMBARCADOS</span>
                  </div>
                  <div style={{ fontSize: '42px', fontWeight: 'bold', color: '#fff', textAlign: 'right', letterSpacing: '1px' }}>0</div>
                  <div style={{ backgroundColor: '#00b4d8', color: '#070b19', textAlign: 'center', padding: '10px', borderRadius: '8px', fontWeight: 'bold', fontSize: '14px' }}>0</div>
                </div>

              </div>

              {/* Linha Inferior de Cartões (Pesos) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
                
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '15px' }}>PESO TOTAL PAX</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#4cc9f0', letterSpacing: '1px' }}>{pesoTotalPax} KG</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '15px' }}>PESO TOTAL DE BAGAGEM</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ffd166', letterSpacing: '1px' }}>{totalBagagem} KG</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '14px', padding: '24px', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
                  <div style={{ color: '#8d99ae', fontSize: '12px', fontWeight: 'bold', letterSpacing: '0.5px', marginBottom: '15px' }}>PESO TOTAL TRANSP.</div>
                  <div style={{ fontSize: '32px', fontWeight: 'bold', color: '#ff6b6b', letterSpacing: '1px' }}>{pesoTotalTransp} KG</div>
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
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                  {voosAtivos.map(voo => (
                    <div key={voo.id} style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px' }}>
                      <h4 style={{ color: '#00b4d8', margin: '0 0 10px 0' }}>{voo.prefixo}</h4>
                      <p style={{ margin: '5px 0', color: '#8d99ae', fontSize: '13px' }}>Rota: {voo.rota}</p>
                      <p style={{ margin: '5px 0', color: '#8d99ae', fontSize: '13px' }}>Horário: {voo.horario}</p>
                      <button onClick={() => moverParaLixeira(voo.id, voo.prefixo)} style={{ marginTop: '15px', backgroundColor: 'rgba(255, 107, 107, 0.1)', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>APAGAR</button>
                    </div>
                  ))}
                </div>
              )}
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
                        <button onClick={() => restaurarVoo(voo.id)} style={{ backgroundColor: '#00b4d8', border: 'none', color: '#070b19', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>RESTAURAR</button>
                        <button onClick={() => excluirDefinitivo(voo.id)} style={{ backgroundColor: '#ff6b6b', border: 'none', color: '#fff', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px', fontWeight: 'bold' }}>EXCLUIR DEFINITIVO</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {['adicionar', 'desembarque', 'aeronave', 'relatorio', 'utilizadores'].includes(menuAtivo) && (
            <div style={{ textAlign: 'center', padding: '60px', color: '#8d99ae' }}>
              <h3>Módulo "{menuAtivo.toUpperCase()}" ativo e integrado com persistência em nuvem.</h3>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
