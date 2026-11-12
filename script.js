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
document.getElementById('data').valueAsDate = new Date();

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
window.salvar = async function() {
  const tipo = document.getElementById('tipo').value;
  const aplicativo = document.getElementById('aplicativo').value;
  const data = document.getElementById('data').value;
  const descricao = document.getElementById('descricao').value;
  const valor = parseFloat(document.getElementById('valor').value) || 0;

  if (!data || valor <= 0) {
    alert("Por favor, preencha a data e um valor válido.");
    return;
  }

  const novoLancamento = { tipo, aplicativo, data, descricao, valor };

  try {
    await addDoc(collection(db, COLECAO), novoLancamento);
    alert("Lançamento salvo com sucesso!");
    document.getElementById('descricao').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('data').valueAsDate = new Date();
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

// Mudar de Aba
window.mudarAba = function(aba) {
  console.log("Mudando para a aba:", aba);
};

// Atualizar Tela
window.atualizarTela = function() {
  const mesSelecionado = document.getElementById('filtro-mes')?.value;
  console.log("Tela atualizada para o mês:", mesSelecionado);
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
