import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, doc, deleteDoc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyDV-q2ZVhz6BvC7vyDG8D8e3LBUGb2TZvc",
  authDomain: "controle-de-entregas-f826e.firebaseapp.com",
  projectId: "controle-de-entregas-f826e",
  storageBucket: "controle-de-entregas-f826e.firebasestorage.app",
  messagingSenderId: "344407439902",
  appId: "1:344407439902:web:5fdbf39341b9f881b9cc0f"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLECAO = "lancamentos";

let dados = [];

// Definir data atual no input ao carregar
const dataInputEl = document.getElementById('data');
if (dataInputEl) {
  dataInputEl.valueAsDate = new Date();
}

// Carregar dados do Firebase ao iniciar a página
async function carregarDadosDoFirebase() {
  try {
    const q = query(collection(db, COLECAO), orderBy("data", "desc"));
    const querySnapshot = await getDocs(q);
    dados = [];
    querySnapshot.forEach((docSnap) => {
      dados.push({ id: docSnap.id, ...docSnap.data() });
    });
    atualizarTela();
  } catch (error) {
    console.error("Erro ao carregar dados do Firebase: ", error);
  }
}

// Salvar Lançamento
window.salvar = async function(event) {
  if (event) event.preventDefault();

  const tipo = document.getElementById('tipo')?.value || 'entrada';
  const aplicativo = document.getElementById('app-origem')?.value || '99 Food';
  const categoria = document.getElementById('categoria')?.value || '';
  const data = document.getElementById('data')?.value;
  const descricao = document.getElementById('descricao')?.value || '';
  const valorInput = document.getElementById('valor')?.value;
  const valor = parseFloat(valorInput ? valorInput.replace(',', '.') : '0') || 0;

  if (!data || valor <= 0) {
    alert("Por favor, preencha a data e um valor válido.");
    return;
  }

  const novoLancamento = { tipo, aplicativo, categoria, data, descricao, valor };

  try {
    await addDoc(collection(db, COLECAO), novoLancamento);
    alert("Lançamento salvo com sucesso!");
    
    // Limpar campos
    const descEl = document.getElementById('descricao');
    if (descEl) descEl.value = '';
    const valEl = document.getElementById('valor');
    if (valEl) valEl.value = '';
    const catEl = document.getElementById('categoria');
    if (catEl) catEl.value = '';
    const dtEl = document.getElementById('data');
    if (dtEl) dtEl.valueAsDate = new Date();

    await carregarDadosDoFirebase();
  } catch (error) {
    console.error("Erro ao salvar lançamento: ", error);
    alert("Erro ao salvar no Firebase.");
  }
};

// Excluir Lançamento
window.excluir = async function(idDoc) {
  if (confirm("Deseja realmente excluir este lançamento da nuvem?")) {
    try {
      await deleteDoc(doc(db, COLECAO, idDoc));
      await carregarDadosDoFirebase();
    } catch (error) {
      console.error("Erro ao excluir: ", error);
      alert("Erro ao excluir.");
    }
  }
};

// Mudar de Aba (Ativa/Desativa conteúdos e botões)
window.mudarAba = function(numAba) {
  // Ocultar todas as abas e remover classe active dos botões
  const conteudos = document.querySelectorAll('.content');
  conteudos.forEach(c => c.classList.remove('active'));

  const botoes = document.querySelectorAll('.tabs .tab');
  botoes.forEach(b => b.classList.remove('active'));

  // Ativar a aba correspondente
  const abaAlvo = document.getElementById(`aba-${numAba}`);
  if (abaAlvo) {
    abaAlvo.classList.add('active');
  }
  if (botoes[numAba]) {
    botoes[numAba].classList.add('active');
  }
};

// Atualizar Tela, Extratos, Totais e Saldo do Mês
window.atualizarTela = function() {
  const mesSelecionado = document.getElementById('filtro-mes')?.value; // Ex: "2026-11"
  
  // Filtrar dados do mês selecionado (compara os 7 primeiros caracteres da data "YYYY-MM")
  const dadosMes = dados.filter(item => item.data && item.data.startsWith(mesSelecionado));

  let totalEntradas = 0;
  let totalSaidas = 0;

  let total99 = 0;
  let totalKeeta = 0;
  let totalUber = 0;

  let htmlGeral = '';
  let html99 = '';
  let htmlKeeta = '';
  let htmlUber = '';

  dadosMes.forEach(item => {
    const val = Number(item.valor) || 0;
    const desc = item.descricao ? ` - ${item.descricao}` : '';
    const cat = item.categoria ? ` (${item.categoria})` : '';
    const btnExcluir = `<button onclick="excluir('${item.id}')" style="background:red; color:white; border:none; padding:2px 6px; cursor:pointer; margin-left:10px;">Excluir</button>`;
    
    const linhaHtml = `<div style="padding: 6px 0; border-bottom: 1px solid #eee;">${item.data.split('-').reverse().join('/')} | <b>${item.aplicativo || item.tipo}</b>: R$ ${val.toFixed(2)}${cat}${desc} ${btnExcluir}</div>`;

    htmlGeral += linhaHtml;

    if (item.tipo === 'entrada') {
      totalEntradas += val;
      if (item.aplicativo === '99 Food') {
        total99 += val;
        html99 += linhaHtml;
      } else if (item.aplicativo === 'Keeta') {
        totalKeeta += val;
        htmlKeeta += linhaHtml;
      } else if (item.aplicativo === 'Uber') {
        totalUber += val;
        htmlUber += linhaHtml;
      }
    } else if (item.tipo === 'saida') {
      totalSaidas += val;
    }
  });

  // Calcular Saldo Líquido do Mês (Entradas - Saídas)
  const saldoMes = totalEntradas - totalSaidas;

  // Atualizar elementos na tela
  const saldoEl = document.getElementById('saldo-total');
  if (saldoEl) {
    saldoEl.innerText = `R$ ${saldoMes.toFixed(2)}`;
    saldoEl.style.color = saldoMes < 0 ? '#ff4d4d' : '#2ecc71';
  }

  const listaGeralEl = document.getElementById('lista-geral');
  if (listaGeralEl) listaGeralEl.innerHTML = htmlGeral || '<p>Nenhum lançamento neste mês.</p>';

  const lista99El = document.getElementById('lista-99');
  if (lista99El) lista99El.innerHTML = html99 || '<p>Nenhum ganho registrado.</p>';
  const t99El = document.getElementById('total-99');
  if (t99El) t99El.innerText = `R$ ${total99.toFixed(2)}`;

  const listaKeetaEl = document.getElementById('lista-keeta');
  if (listaKeetaEl) listaKeetaEl.innerHTML = htmlKeeta || '<p>Nenhum ganho registrado.</p>';
  const tKeetaEl = document.getElementById('total-keeta');
  if (tKeetaEl) tKeetaEl.innerText = `R$ ${totalKeeta.toFixed(2)}`;

  const listaUberEl = document.getElementById('lista-uber');
  if (listaUberEl) listaUberEl.innerHTML = htmlUber || '<p>Nenhum ganho registrado.</p>';
  const tUberEl = document.getElementById('total-uber');
  if (tUberEl) tUberEl.innerText = `R$ ${totalUber.toFixed(2)}`;
};

// Controlar exibição da categoria de despesa
window.verificarTipo = function() {
  const tipo = document.getElementById('tipo')?.value;
  const blocoCat = document.getElementById('bloco-categoria');
  const blocoApp = document.getElementById('bloco-app');
  
  if (blocoCat) blocoCat.style.display = (tipo === 'saida') ? 'block' : 'none';
  if (blocoApp) blocoApp.style.display = (tipo === 'saida') ? 'none' : 'block';
};

// Inicialização ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
  carregarDadosDoFirebase();
});
