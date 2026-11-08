import React, { useState, useEffect } from 'react';
import { supabase } from './supabase';

export default function App() {
  const [voos, setVoos] = useState([]);
  const [lixeira, setLixeira] = useState([]);
  const [mostrarLixeira, setMostrarLixeira] = useState(false);
  const [loading, setLoading] = useState(false);

  // Formulário para novo voo
  const [form, setForm] = useState({
    prefixo: '',
    rota: '',
    horario: '',
    status: 'Programado'
  });

  // Carregar dados do Supabase ao iniciar
  useEffect(() => {
    carregarDados();
  }, []);

  async function carregarDados() {
    setLoading(true);
    // Voos ativos (excluida = false ou null)
    const { data: dadosVoos, error: errVoos } = await supabase
      .from('voos')
      .select('*')
      .eq('excluido', false)
      .order('created_at', { ascending: false });

    // Voos na lixeira (excluida = true)
    const { data: dadosLixeira, error: errLixeira } = await supabase
      .from('voos')
      .select('*')
      .eq('excluido', true)
      .order('created_at', { ascending: false });

    if (!errVoos) setVoos(dadosVoos || []);
    if (!errLixeira) setLixeira(dadosLixeira || []);
    setLoading(false);
  }

  // Adicionar Voo
  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.prefixo || !form.rota) return alert('Preencha os campos obrigatórios!');

    const { error } = await supabase.from('voos').insert([
      { ...form, excluido: false }
    ]);

    if (error) {
      alert('Erro ao guardar voo: ' + error.message);
    } else {
      setForm({ prefixo: '', rota: '', horario: '', status: 'Programado' });
      carregarDados();
    }
  }

  // Enviar para a Lixeira (com confirmação)
  async function confirmarEExcluir(id, prefixo) {
    const confirmar = window.confirm(`Tem a certeza de que deseja excluir o voo ${prefixo}? Ele será movido para a lixeira.`);
    if (!confirmar) return;

    const { error } = await supabase
      .from('voos')
      .update({ excluido: true })
      .eq('id', id);

    if (error) {
      alert('Erro ao excluir: ' + error.message);
    } else {
      carregarDados();
    }
  }

  // Restaurar da Lixeira
  async function restaurarVoo(id) {
    const { error } = await supabase
      .from('voos')
      .update({ excluido: false })
      .eq('id', id);

    if (error) {
      alert('Erro ao restaurar: ' + error.message);
    } else {
      carregarDados();
    }
  }

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '20px', fontFamily: 'Arial, sans-serif' }}>
      <h2>Posto CAN BR (SBBR) - Gestão de Voos</h2>

      {/* Formulário de Registo */}
      <form onSubmit={handleSubmit} style={{ background: '#f4f4f4', padding: '15px', borderRadius: '8px', marginBottom: '20px' }}>
        <h3>Adicionar Novo Voo</h3>
        <div style={{ display: 'grid', gap: '10px', gridTemplateColumns: '1fr 1fr' }}>
          <input 
            type="text" 
            placeholder="Prefixo da Aeronave" 
            value={form.prefixo} 
            onChange={e => setForm({...form, prefixo: e.target.value})} 
            required 
            style={{ padding: '8px' }}
          />
          <input 
            type="text" 
            placeholder="Rota (ex: SBBR - SBGR)" 
            value={form.rota} 
            onChange={e => setForm({...form, rota: e.target.value})} 
            required 
            style={{ padding: '8px' }}
          />
          <input 
            type="time" 
            value={form.horario} 
            onChange={e => setForm({...form, horario: e.target.value})} 
            style={{ padding: '8px' }}
          />
          <select 
            value={form.status} 
            onChange={e => setForm({...form, status: e.target.value})}
            style={{ padding: '8px' }}
          >
            <option value="Programado">Programado</option>
            <option value="Em Curso">Em Curso</option>
            <option value="Realizado">Realizado</option>
          </select>
        </div>
        <button type="submit" style={{ marginTop: '10px', padding: '10px 20px', background: '#007bff', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}>
          Salvar Voo na Nuvem
        </button>
      </form>

      {/* Botão para Alternar Lixeira */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
        <h3>{mostrarLixeira ? '🗑️ Itens na Lixeira' : '✈️ Voos Ativos'}</h3>
        <button 
          onClick={() => setMostrarLixeira(!mostrarLixeira)}
          style={{ padding: '8px 15px', background: '#6c757d', color: '#fff', border: 'none', borderRadius: '4px', cursor: 'pointer' }}
        >
          {mostrarLixeira ? 'Ver Voos Ativos' : `🗑️ Ver Lixeira (${lixeira.length})`}
        </button>
      </div>

      {loading && <p>A carregar dados da nuvem...</p>}

      {/* Tabela de Voos Ativos ou Lixeira */}
      {!mostrarLixeira ? (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: '#007bff', color: '#white', textAlign: 'left' }}>
              <th style={{ padding: '10px', color: '#fff' }}>Prefixo</th>
              <th style={{ padding: '10px', color: '#fff' }}>Rota</th>
              <th style={{ padding: '10px', color: '#fff' }}>Horário</th>
              <th style={{ padding: '10px', color: '#fff' }}>Status</th>
              <th style={{ padding: '10px', color: '#fff' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {voos.length === 0 ? (
              <tr><td colSpan="5" style={{ padding: '15px', textAlign: 'center' }}>Nenhum voo registado.</td></tr>
            ) : (
              voos.map(voo => (
                <tr key={voo.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{voo.prefixo}</td>
                  <td style={{ padding: '10px' }}>{voo.rota}</td>
                  <td style={{ padding: '10px' }}>{voo.horario}</td>
                  <td style={{ padding: '10px' }}>{voo.status}</td>
                  <td style={{ padding: '10px' }}>
                    <button 
                      onClick={() => confirmarEExcluir(voo.id, voo.prefixo)}
                      style={{ background: '#dc3545', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                      title="Excluir voo"
                    >
                      🗑️ Excluir
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse', background: '#fff3f3' }}>
          <thead>
            <tr style={{ background: '#dc3545', color: '#fff', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Prefixo</th>
              <th style={{ padding: '10px' }}>Rota</th>
              <th style={{ padding: '10px' }}>Horário</th>
              <th style={{ padding: '10px' }}>Ações</th>
            </tr>
          </thead>
          <tbody>
            {lixeira.length === 0 ? (
              <tr><td colSpan="4" style={{ padding: '15px', textAlign: 'center' }}>A lixeira está vazia.</td></tr>
            ) : (
              lixeira.map(voo => (
                <tr key={voo.id} style={{ borderBottom: '1px solid #ddd' }}>
                  <td style={{ padding: '10px' }}>{voo.prefixo}</td>
                  <td style={{ padding: '10px' }}>{voo.rota}</td>
                  <td style={{ padding: '10px' }}>{voo.horario}</td>
                  <td style={{ padding: '10px' }}>
                    <button 
                      onClick={() => restaurarVoo(voo.id)}
                      style={{ background: '#28a745', color: '#fff', border: 'none', padding: '5px 10px', borderRadius: '4px', cursor: 'pointer' }}
                    >
                      ♻️ Restaurar
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      )}
    </div>
  );
}
