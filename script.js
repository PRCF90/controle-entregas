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
    if (typeof window.atualizarTela === 'function') {
      window.atualizarTela();
    }
  } catch (error) {
    console.error("Erro ao carregar dados do Firebase: ", error);
  }
}

// Salvar Lançamento
window.salvar = async function(event) {
  if (event) event.preventDefault();

  const tipo = document.getElementById('tipo')?.value || 'entrada';
  const aplicativo = document.getElementById('aplicativo')?.value || '99 Food';
  const data = document.getElementById('data')?.value;
  const descricao = document.getElementById('descricao')?.value || '';
  const valorInput = document.getElementById('valor')?.value;
  const valor = parseFloat(valorInput ? valorInput.replace(',', '.') : '0') || 0;

  if (!data || valor <= 0) {
    alert("Por favor, preencha a data e um valor válido.");
    return;
  }

  const novoLancamento = { tipo, aplicativo, data, descricao, valor };

  try {
    await addDoc(collection(db, COLECAO), novoLancamento);
    alert("Lançamento salvo com sucesso!");
    
    // Limpar campos de forma segura
    const descEl = document.getElementById('descricao');
    if (descEl) descEl.value = '';
    const valorEl = document.getElementById('valor');
    if (valorEl) valorEl.value = '';
    const dataEl = document.getElementById('data');
    if (dataEl) dataEl.valueAsDate = new Date();

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

// Mudar de Aba de forma universal (suporta IDs, classes e exibições)
window.mudarAba = function(aba) {
  console.log("Mudando para a aba:", aba);
  
  let encontrou = false;
  const conteudos = document.querySelectorAll('.conteudo-aba, .tab-pane, section');
  if (conteudos.length > 0) {
    conteudos.forEach((el, index) => {
      if (el.id === String(aba) || index === Number(aba) || el.classList.contains(`aba-${aba}`)) {
        el.style.display = 'block';
        encontrou = true;
      } else {
        el.style.display = 'none';
      }
    });
  }

  if (!encontrou) {
    const possiveisIds = [`aba-${aba}`, `secao-${aba}`, `${aba}`];
    possiveisIds.forEach(id => {
      const el = document.getElementById(id);
      if (el) {
        el.style.display = 'block';
      }
    });
  }
};

// Atualizar Tela
window.atualizarTela = function() {
  const mesSelecionado = document.getElementById('filtro-mes')?.value;
  console.log("Tela atualizada para o mês:", mesSelecionado);
  
  const listaEl = document.getElementById('lista-lancamentos');
  if (listaEl && dados.length > 0) {
    listaEl.innerHTML = dados.map(item => `
      <div>${item.data} - ${item.aplicativo} - R$ ${item.valor} (${item.tipo})</div>
    `).join('');
  }
};

// Verificar Tipo
window.verificarTipo = function() {
  const tipo = document.getElementById('tipo')?.value;
  const categoriaContainer = document.getElementById('categoria-container');
  if (categoriaContainer) {
    categoriaContainer.style.display = (tipo === 'saida') ? 'block' : 'none';
  }
};

// Inicialização ao carregar a página
window.addEventListener('DOMContentLoaded', () => {
  carregarDadosDoFirebase();
});
