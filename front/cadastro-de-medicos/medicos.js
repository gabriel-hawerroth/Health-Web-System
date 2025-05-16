var user = {};
var patient = null;

const serverUrl = "http://localhost:8083";

user = JSON.parse(atob(localStorage.getItem("user")));

if (user.accessType === "PAC") {
    patient = JSON.parse(atob(localStorage.getItem("patient")));
}

function cadastrarMedico() {
    const nome = document.getElementById("nome-input").value;
    const especialidade = document.getElementById("especialidade-input").value;

    if (nome.length < 3) {
        showMessage("O nome precisa ser válido");
        return;
    } else if (especialidade.length < 3) {
        showMessage("A especialidade precisa ser válida");
        return;
    }

    const medico = {
        nome: nome,
        especialidade: especialidade,
    };

    fetch(`${serverUrl}/cadastrar-medico`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(medico),
    })
        .then((response) => {
            console.log(response);
            if (response.ok) {
                showMessage("Médico cadastrado com sucesso");
                limparCampos();
            } else {
                showMessage("Erro ao cadastrar o médico");
            }
        })
        .catch((error) => {
            showMessage("Erro ao cadastrar o médico");
        });
}

function limparCampos() {
    document.getElementById("nome-input").value = "";
    document.getElementById("especialidade-input").value = "";
}

function voltarAoMenu() {
    window.location.href = `../menu/menu.html`;
}

function showMessage(message, duration = 3000) {
    document.getElementById("message").innerHTML = message;
    document.getElementById("snackbar").style.display = "flex";

    setTimeout(() => {
        document.getElementById("snackbar").style.display = "none";
    }, duration);
}

function closeMessage() {
    document.getElementById("snackbar").style.display = "none";
}
