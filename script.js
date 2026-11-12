// Importações do Firebase (SDK Modular v10 via CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Credenciais reais do seu projeto Firebase (já configuradas)
const firebaseConfig = {
    apiKey: "AIzaSyD-q2ZVhz6BvC7vydGD8e3LBUgb2TZvc",
    authDomain: "controle-de-entregas-f826e.firebaseapp.com",
    projectId: "controle-de-entregas-f826e",
    storageBucket: "controle-de-entregas-f826e.firebasestorage.app",
    messagingSenderId: "344407439902",
    appId: "1:344407439902:web:5fdbf39341b9f881b9cc0f"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const COLECAO = "lancamentos_entregas";

let dados = [];
document.getElementById('data').valueAsDate = new Date();

// Carregar dados do Firebase ao iniciar a página
async function carregarDadosDoFirebase() {
    try {
        const q = query(collection(db, COLECAO), orderBy("data", "desc"));
        const querySnapshot = await getDocs(q);
        dados = [];
        querySnapshot.forEach((docSnap) => {
            dados.push({ idDoc: docSnap.id, ...docSnap.data() });
        });
        atualizarTela();
    } catch (error) {
        console.error("Erro ao carregar dados do Firebase: ", error);
        alert("Erro ao sincronizar com o Firebase. Verifique as credenciais.");
    }
}

function mudarAba(index) {
    const botoes = document.querySelectorAll('.tab');
    const conteudos = document.querySelectorAll('.content');
    
    botoes.forEach((btn, i) => {
        btn.classList.toggle('active', i === index);
        conteudos[i].classList.toggle('active', i === index);
    });
}

function verificarTipo() {
    const tipo = document.getElementById('tipo').value;
    if (tipo === 'entrada') {
        document.getElementById('bloco-app').style.display = 'block';
        document.getElementById('bloco-categoria').style.display = 'none';
    } else {
        document.getElementById('bloco-app').style.display = 'none';
        document.getElementById('bloco-categoria').style.display = 'block';
    }
}

async function salvar() {
    const tipo = document.getElementById('tipo').value;
    const data = document.getElementById('data').value;
    const descricao = document.getElementById('descricao').value.trim();
    const valor = parseFloat(document.getElementById('valor').value);
    
    let categoria = '';
    let appOrigem = '';

    if (tipo === 'entrada') {
        appOrigem = document.getElementById('app-origem').value;
        categoria = appOrigem;
    } else {
        categoria = document.getElementById('categoria').value.trim() || 'Despesa Geral';
        appOrigem = 'Despesa';
    }

    if (!data || isNaN(valor) || valor <= 0) {
        alert('Informe uma data válida e um valor maior que zero!');
        return;
    }

    const novoLancamento = {
        tipo,
        data,
        categoria,
        appOrigem,
        descricao,
        valor,
        criadoEm: Date.now()
    };

    try {
        // Salva diretamente na nuvem do Firebase
        await addDoc(collection(db, COLECAO), novoLancamento);
        
        document.getElementById('filtro-mes').value = data.slice(0, 7);
        document.getElementById('descricao').value = '';
        document.getElementById('valor').value = '';
        if(tipo === 'saida') document.getElementById('categoria').value = '';

        // Recarrega os dados atualizados da nuvem
        await carregarDadosDoFirebase();
        mudarAba(1);
    } catch (error) {
        console.error("Erro ao salvar lançamento: ", error);
        alert("Erro ao salvar no Firebase.");
    }
}

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

window.mudarAba = mudarAba;
window.salvar = salvar;
window.atualizarTela = atualizarTela;
