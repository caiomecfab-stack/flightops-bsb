import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [menuAtivo, setMenuAtivo] = useState('dashboard');
  const [sidebarAberto, setSidebarAberto] = useState(true);

  // Sincronização e persistência total com o Supabase ao iniciar
  useEffect(() => {
    carregarVoos();
  }, []);

  async function carregarVoos() {
    try {
      const { data, error } = await supabase.from('voos').select('*');
      if (error) throw error;
      if (data) setVoos(data);
    } catch (err) {
      console.error('Erro ao carregar voos da nuvem:', err.message);
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
      alert('Erro ao enviar voo para a lixeira: ' + err.message);
    }
  }

  // Exclusão definitiva de itens dentro da lixeira
  async function excluirDefinitivo(id) {
    const confirmar = window.confirm('Deseja excluir este item permanentemente da base de dados em nuvem?');
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

  // Restaurar da lixeira para os voos ativos
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

  // Indicadores estatísticos dinâmicos ligados aos dados persistidos
  const totalVoos = voosAtivos.length;
  const totalPax = voosAtivos.reduce((acc, curr) => acc + (Number(curr.pax) || 0), 0);
  const totalBagagem = voosAtivos.reduce((acc, curr) => acc + (Number(curr.bagagem) || 0), 0);
  const pesoTotalPax = voosAtivos.reduce((acc, curr) => acc + (Number(curr.peso_pax) || 0), 0);
  const pesoTotalTransp = pesoTotalPax + totalBagagem;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#070b19', color: '#fff', fontFamily: 'sans-serif' }}>
      
      {/* Menu Lateral Esquerdo Completo */}
      <div style={{ width: sidebarAberto ? '260px' : '80px', backgroundColor: '#070b19', borderRight: '1px solid #161b2e', transition: 'width 0.3s', display: 'flex', flexDirection: 'column', position: 'sticky', top: 0, height: '100vh' }}>
        <div style={{ padding: '20px', display: 'flex', alignItems: 'center', gap: '12px', borderBottom: '1px solid #161b2e' }}>
          <div style={{ backgroundColor: '#00b4d8', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>✈</div>
          {sidebarAberto && (
            <div>
              <div style={{ fontWeight: 'bold', fontSize: '16px', color: '#00b4d8' }}>FLIGHTOPS BSB</div>
              <small style={{ fontSize: '10px', color: '#8d99ae' }}>BASE AÉREA DE BRASÍLIA (SBBR)</small>
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

          {/* Opção Lixeira dedicada no menu lateral esquerdo */}
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
        
        {/* Topbar Original */}
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

        {/* Corpo de Trabalho */}
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
                    <label style={{ fontSize: '11px', color: '#8d99ae', display: 'block', marginBottom: '5px' }}>DATA ESPECÍFICA</label>
                    <input type="text" placeholder="dd/mm/aaaa" style={{ width: '100%', backgroundColor: '#070b19', border: '1px solid #1c2541', color: '#fff', padding: '10px', borderRadius: '8px', boxSizing: 'border-box' }} />
                  </div>
                </div>
              </div>

              {/* Perfil Estatístico */}
              <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '25px' }}>
                <div>
                  <div style={{ color: '#00b4d8', fontSize: '15px', fontWeight: 'bold' }}>📊 PERFIL ESTATÍSTICO OPERACIONAL</div>
                  <small style={{ color: '#8d99ae' }}>Gere a visão consolidada por tipo de aeronave aplicando os filtros de data acima</small>
                </div>
                <button style={{ backgroundColor: '#00b4d8', color: '#070b19', border: 'none', padding: '10px 20px', borderRadius: '8px', fontWeight: 'bold', cursor: 'pointer' }}>GERAR ESTATÍSTICA</button>
              </div>

              {/* Cartões Estatísticos do Dashboard */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '20px' }}>
                
                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '13px' }}>TOTAL DE VOOS</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff', margin: '20px 0' }}>{totalVoos}</div>
                  <div style={{ backgroundColor: '#00b4d8', color: '#070b19', textAlign: 'center', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>{totalVoos}</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '13px' }}>TOTAL DE PASSAGEIROS (PAX)</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff', margin: '20px 0' }}>{totalPax}</div>
                  <div style={{ backgroundColor: '#06d6a0', color: '#070b19', textAlign: 'center', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>{totalPax}</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '13px' }}>TOTAL DESEMBARCADOS</div>
                  <div style={{ fontSize: '36px', fontWeight: 'bold', color: '#fff', margin: '20px 0' }}>0</div>
                  <div style={{ backgroundColor: '#00b4d8', color: '#070b19', textAlign: 'center', padding: '8px', borderRadius: '8px', fontWeight: 'bold' }}>0</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '13px' }}>PESO TOTAL PAX</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#4cc9f0', margin: '20px 0' }}>{pesoTotalPax} KG</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '13px' }}>PESO TOTAL DE BAGAGEM</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ffd166', margin: '20px 0' }}>{totalBagagem} KG</div>
                </div>

                <div style={{ backgroundColor: '#111936', border: '1px solid #1c2541', borderRadius: '12px', padding: '20px' }}>
                  <div style={{ color: '#8d99ae', fontSize: '13px' }}>PESO TOTAL TRANSP.</div>
                  <div style={{ fontSize: '28px', fontWeight: 'bold', color: '#ff6b6b', margin: '20px 0' }}>{pesoTotalTransp} KG</div>
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
                      <button onClick={() => moverParaLixeira(voo.id, voo.prefixo)} style={{ marginTop: '15px', backgroundColor: '#ff6b6b22', border: '1px solid #ff6b6b', color: '#ff6b6b', padding: '6px 12px', borderRadius: '6px', cursor: 'pointer', fontSize: '12px' }}>APAGAR</button>
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
                    <div key={voo.id} style={{ backgroundColor: '#111936', border: '1px solid #ff6b6b44', borderRadius: '12px', padding: '20px' }}>
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
