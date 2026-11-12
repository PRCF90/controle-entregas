// Importações do Firebase (SDK Modular v10 via CDN)
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, addDoc, getDocs, deleteDoc, doc, query, orderBy } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// ⚠️ COLOQUE AQUI AS SUAS CREDENCIAIS DO SEU PROJETO FIREBASE
const firebaseConfig = {
    apiKey: "SUA_API_KEY_AQUI",
    authDomain: "seu-projeto.firebaseapp.com",
    projectId: "seu-projeto-id",
    storageBucket: "seu-projeto.appspot.com",
    messagingSenderId: "SEU_SENDER_ID",
    appId: "SEU_APP_ID"
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
    if (confirm('Deseja realmente excluir este lançamento da nuvem?')) {
        try {
            await deleteDoc(doc(db, COLECAO, idDoc));
            await carregarDadosDoFirebase();
        } catch (error) {
            console.error("Erro ao excluir: ", error);
            alert("Erro ao excluir o item.");
        }
    }
}

// Tornar funções globais acessíveis pelo HTML
window.mudarAba = mudarAba;
window.verificarTipo = verificarTipo;
window.salvar = salvar;
window.atualizarTela = atualizarTela;

function atualizarTela() {
    const mesSelecionado = document.getElementById('filtro-mes').value;
    
    let saldoMes = 0;
    let htmlGeral = '', html99 = '', htmlKeeta = '', htmlUber = '';
    let soma99 = 0, somaKeeta = 0, somaUber = 0;

    let dadosMes = dados.filter(item => item.data && item.data.startsWith(mesSelecionado));

    dadosMes.forEach(item => {
        if (item.tipo === 'entrada') {
            saldoMes += item.valor;
        } else {
            saldoMes -= item.valor;
        }

        let cor = item.tipo === 'entrada' ? 'green' : 'red';
        let sinal = item.tipo === 'entrada' ? '+' : '-';
        let desc = item.descricao ? ` - ${item.descricao}` : '';
        let dataFormatada = item.data.split('-').reverse().join('/');

        let itemHtml = `
            <div class="item">
                <div>
                    <strong>[${item.categoria}]</strong> ${dataFormatada}${desc}<br>
                    <small style="color:#666;">Tipo: ${item.tipo.toUpperCase()}</small>
                </div>
                <div>
                    <span class="${cor}">${sinal} R$ ${item.valor.toFixed(2)}</span><br>
                    <button onclick="excluir('${item.idDoc}')" style="color:red; background:none; border:none; cursor:pointer; font-size:11px; margin-top:4px;">Excluir</button>
                </div>
            </div>
        `;

        htmlGeral += itemHtml;

        if (item.tipo === 'entrada') {
            if (item.appOrigem === '99 Food') {
                html99 += itemHtml;
                soma99 += item.valor;
            } else if (item.appOrigem === 'Keeta') {
                htmlKeeta += itemHtml;
                somaKeeta += item.valor;
            } else if (item.appOrigem === 'Uber') {
                htmlUber += itemHtml;
                somaUber += item.valor;
            }
        }
    });

    document.getElementById('saldo-total').innerText = `R$ ${saldoMes.toFixed(2)}`;
    document.getElementById('lista-geral').innerHTML = htmlGeral || '<p style="text-align:center; color:#777;">Nenhum lançamento neste mês.</p>';
    
    document.getElementById('lista-99').innerHTML = html99 || '<p style="text-align:center; color:#777;">Nenhum ganho na 99 Food.</p>';
    document.getElementById('total-99').innerText = `R$ ${soma99.toFixed(2)}`;

    document.getElementById('lista-keeta').innerHTML = htmlKeeta || '<p style="text-align:center; color:#777;">Nenhum ganho na Keeta.</p>';
    document.getElementById('total-keeta').innerText = `R$ ${somaKeeta.toFixed(2)}`;

    document.getElementById('lista-uber').innerHTML = htmlUber || '<p style="text-align:center; color:#777;">Nenhum ganho na Uber.</p>';
    document.getElementById('total-uber').innerText = `R$ ${somaUber.toFixed(2)}`;

    renderizarAnual();
}

function renderizarAnual() {
    const mesesNomes = {
        "01": "Janeiro", "02": "Fevereiro", "03": "Março", "04": "Abril",
        "05": "Maio", "06": "Junho", "07": "Julho", "08": "Agosto",
        "09": "Setembro", "10": "Outubro", "11": "Novembro", "12": "Dezembro"
    };

    let resumo = {};
    const anoAtual = document.getElementById('filtro-mes').value.slice(0, 4);

    Object.keys(mesesNomes).forEach(m => {
        resumo[`${anoAtual}-${m}`] = { nome: mesesNomes[m], ganhos: 0, gastos: 0 };
    });

    dados.forEach(item => {
        if (!item.data) return;
        let chave = item.data.slice(0, 7);
        if (!resumo[chave]) {
            let mesNum = item.data.slice(5, 7);
            resumo[chave] = { nome: mesesNomes[mesNum] || chave, ganhos: 0, gastos: 0 };
        }
        if (item.tipo === 'entrada') {
            resumo[chave].ganhos += item.valor;
        } else {
            resumo[chave].gastos += item.valor;
        }
    });

    let html = `<table>
        <tr>
            <th>Mês</th>
            <th>Ganhos</th>
            <th>Gastos</th>
            <th>Saldo</th>
        </tr>`;

    let totalG = 0, totalD = 0;
    Object.keys(resumo).sort().forEach(chave => {
        let m = resumo[chave];
        let saldo = m.ganhos - m.gastos;
        totalG += m.ganhos;
        totalD += m.gastos;

        if (m.ganhos > 0 || m.gastos > 0 || chave.startsWith(anoAtual)) {
            html += `
                <tr>
                    <td><strong>${m.nome}</strong></td>
                    <td class="green">+R$ ${m.ganhos.toFixed(2)}</td>
                    <td class="red">-R$ ${m.gastos.toFixed(2)}</td>
                    <td><strong>R$ ${saldo.toFixed(2)}</strong></td>
                </tr>
            `;
        }
    });

    let saldoAno = totalG - totalD;
    html += `
        <tr style="background:#e8f0fe; font-weight:bold;">
            <td>TOTAL ANUAL</td>
            <td class="green">+R$ ${totalG.toFixed(2)}</td>
            <td class="red">-R$ ${totalD.toFixed(2)}</td>
            <td class="${saldoAno >= 0 ? 'green' : 'red'}">R$ ${saldoAno.toFixed(2)}</td>
        </tr>
    </table>`;

    document.getElementById('tabela-anual').innerHTML = html;
}

// Inicia o carregamento dos dados da nuvem ao abrir o app
carregarDadosDoFirebase();
