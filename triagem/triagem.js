var user = {};
const listaPacientes = [];

const serverUrl = "http://localhost:3000";

user = JSON.parse(atob(localStorage.getItem("user")));

document.addEventListener("DOMContentLoaded", () => {
    fetch(`${serverUrl}/lista-pacientes`)
        .then(async (response) => {
            if (response.ok) {
                const responseBody = await response.json();

                pacientes = responseBody;

                const select = document.getElementById("select-paciente");

                pacientes.forEach((registro) => {
                    const item = document.createElement("option");
                    item.value = registro.id.toString();
                    item.text = registro.nome;
                    select.add(item);
                });
            } else {
                showMessage("Erro ao obter a lista de pacientes");
            }
        })
        .catch((error) => {
            showMessage("Erro ao obter a lista de pacientes");
        });
});

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

function cadastrarTriagem() {
    var triagem = {};

    try {
        triagem = {
            idPaciente: document.getElementById("select-paciente").value,
            statusUrgencia: document.querySelector(
                'input[name="opcoes-status"]:checked'
            ).value,
            altura: document.getElementById("input-altura").value,
            peso: document.getElementById("input-peso").value,
            pressao: document.getElementById("input-pressao").value,
            glicemia: document.getElementById("input-glicemia").value,
            frequenciaCardiaca:
                document.getElementById("input-frq-cardiaca").value,
            frequenciaRespiratoria: document.getElementById(
                "input-frq-respiratoria"
            ).value,
        };
    } catch {
        showMessage("Todos os campos devem ser preenchidos");
        return;
    }

    if (
        !triagem.idPaciente ||
        !triagem.statusUrgencia ||
        !triagem.altura ||
        !triagem.peso ||
        !triagem.pressao ||
        !triagem.glicemia ||
        !triagem.frequenciaCardiaca ||
        !triagem.frequenciaRespiratoria
    ) {
        showMessage("Todos os campos devem ser preenchidos");
        return;
    }

    fetch(`${serverUrl}/realizar-triagem`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(triagem),
    })
        .then((response) => {
            if (response.ok) {
                showMessage("Triagem realizada com sucesso");

                document.getElementById("select-paciente").value = "";
                document.getElementById("input-altura").value = "";
                document.getElementById("input-peso").value = "";
                document.getElementById("input-pressao").value = "";
                document.getElementById("input-glicemia").value = "";
                document.getElementById("input-frq-cardiaca").value = "";
                document.getElementById("input-frq-respiratoria").value = "";

                const radioButtons =
                    document.getElementsByName("opcoes-status");
                radioButtons.forEach((radioButton) => {
                    if (radioButton.checked) {
                        radioButton.checked = false;
                    }
                });
            } else {
                showMessage("Erro ao realizar a triagem");
            }
        })
        .catch((error) => {
            showMessage("Erro ao realizar a triagem");
        });
}
