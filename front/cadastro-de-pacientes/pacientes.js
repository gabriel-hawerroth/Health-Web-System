var user = {};
var patient = null;

const serverUrl = "http://localhost:8083";

user = JSON.parse(atob(localStorage.getItem("user")));

if (user.accessType === "PAC") {
    patient = JSON.parse(atob(localStorage.getItem("patient")));
}

function cadastrarPaciente() {
    const nome = document.getElementById("nome-input");
    const idade = document.getElementById("idade-input");
    const email = document.getElementById("email-input");
    const cpf = document.getElementById("cpf-input");
    const senha = document.getElementById("senha-input");
    const confirmacaoSenha = document.getElementById("confirmacao-senha-input");

    const regex = /^[0-9]+$/;

    const novoPaciente = {
        idUsuario: user.id,
        nome: nome.value,
        idade: idade.value,
        email: email.value,
        cpf: cpf.value,
        senha: senha.value,
    };

    if (
        !nome.value ||
        !idade.value ||
        !email.value ||
        !cpf.value ||
        !senha.value ||
        !confirmacaoSenha.value
    ) {
        showMessage("Todos os campos são obrigatórios");
        return;
    } else if (
        novoPaciente.idade.length < 1 ||
        novoPaciente.idade.length > 3 ||
        novoPaciente.idade < 18 ||
        novoPaciente.idade > 130
    ) {
        showMessage("Idade inválida");
        return;
    } else if (email.invalid) {
        showMessage("E-mail inválido");
        return;
    } else if (!regex.test(novoPaciente.cpf)) {
        showMessage("CPF inválido");
        return;
    } else if (senha.value !== confirmacaoSenha.value) {
        showMessage("As senhas não coincidem");
        return;
    } else if (senha.value < 6) {
        showMessage("A senha deve ter no mínimo seis caracteres");
        return;
    }

    fetch(`${serverUrl}/cadastrar-paciente`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(novoPaciente),
    })
        .then((response) => {
            console.log(response);
            if (response.ok) {
                showMessage("Paciente cadastrado com sucesso");
                limparCampos();
                return;
            } else {
                showMessage("Erro ao cadastrar o paciente");
                return;
            }
        })
        .catch((error) => {
            showMessage("Erro ao cadastrar o paciente");
            return;
        });
}

function limparCampos() {
    document.getElementById("nome-input").value = "";
    document.getElementById("idade-input").value = "";
    document.getElementById("email-input").value = "";
    document.getElementById("cpf-input").value = "";
    document.getElementById("senha-input").value = "";
    document.getElementById("confirmacao-senha-input").value = "";
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
