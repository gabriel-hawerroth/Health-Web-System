var user = {};
var patient = null;

const serverUrl = "http://localhost:8083";

var pacientes = [];
var medicos = [];

user = JSON.parse(atob(localStorage.getItem("user")));

if (user.accessType === "PAC") {
    patient = JSON.parse(atob(localStorage.getItem("patient")));
}

document.addEventListener("DOMContentLoaded", () => {
    const inputHora = document.getElementById("input-hora");

    // código do chatgpt para fazer o input de horário ser apenas de meia em meia hora
    inputHora.addEventListener("change", () => {
        const valorAtual = inputHora.value;

        const minutos =
            parseInt(valorAtual.split(":")[0]) * 60 +
            parseInt(valorAtual.split(":")[1]);

        const minutosAjustados = Math.round(minutos / 30) * 30;

        const horaAjustada = Math.floor(minutosAjustados / 60)
            .toString()
            .padStart(2, "0");
        const minutosAjustadosStr = (minutosAjustados % 60)
            .toString()
            .padStart(2, "0");

        inputHora.value = `${horaAjustada}:${minutosAjustadosStr}`;
    });

    if (user.accessType === "ADM") {
        const pacienteContent = document.getElementById(
            "content-select-paciente"
        );
        pacienteContent.style.display = "flex";

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
    } else if (user.accessType === "PAC") {
        fetch(
            `${serverUrl}/verificar-consulta-paciente?idPaciente=${patient.id}`
        )
            .then(async (response) => {
                const responseBody = await response.json();
                if (responseBody.length > 0) {
                    localStorage.setItem("jaPossuiConsulta", "true");
                    window.location.href =
                        "../acesse-sua-consulta/consulta.html";
                }
            })
            .catch((error) => {
                console.log(error);
            });
    } else {
        console.log("Erro ao obter o usuário");
    }

    fetch(`${serverUrl}/lista-medicos`)
        .then(async (response) => {
            if (response.ok) {
                const responseBody = await response.json();

                medicos = responseBody;

                const select = document.getElementById("select-medico");

                medicos.forEach((registro) => {
                    const item = document.createElement("option");
                    item.value = registro.id.toString();
                    item.text = `${registro.nome} | ${registro.especialidade}`;
                    select.add(item);
                });
            } else {
                showMessage("Erro ao obter a lista de médicos");
            }
        })
        .catch((error) => {
            showMessage("Erro ao obter a lista de médicos");
        });
});

function voltarAoMenu() {
    window.location.href = `../menu/menu.html`;
}

async function agendarConsulta() {
    const consulta = {
        idPaciente:
            patient === null
                ? document.getElementById("select-paciente").value
                : patient.id,
        idMedico: document.getElementById("select-medico").value,
        data: document.getElementById("input-data").value,
        hora: document.getElementById("input-hora").value,
    };

    if (
        !consulta.idPaciente ||
        !consulta.idMedico ||
        !consulta.data ||
        !consulta.hora
    ) {
        showMessage("Todos os campos são obrigatórios");
        return;
    }

    if (user.accessType === "ADM") {
        let possuiConsulta = false;

        await fetch(
            `${serverUrl}/verificar-consulta-paciente?idPaciente=${consulta.idPaciente}`
        )
            .then(async (response) => {
                const responseBody = await response.json();
                if (responseBody.length > 0) {
                    possuiConsulta = true;
                    showMessage("Esse paciente já possui uma consulta marcada");
                    return;
                }
            })
            .catch((error) => {
                console.log(error);
            });

        if (possuiConsulta) return;
    }

    const dataAtual = new Date();
    const dataSelecionada = new Date(`${consulta.data} ${consulta.hora}`);

    if (dataSelecionada <= dataAtual) {
        showMessage(
            "Não é possível agendar uma consulta para datas retroativas"
        );
        return;
    }

    fetch(`${serverUrl}/agendar-consulta`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(consulta),
    })
        .then((response) => {
            console.log(response);
            if (response.ok) {
                document.getElementById("select-paciente").value = "";
                document.getElementById("select-medico").value = "";
                document.getElementById("input-data").value = "";
                document.getElementById("input-hora").value = "";

                localStorage.setItem("consultaCadastrada", "true");
                // window.location.href = "../acesse-sua-consulta/consulta.html";
            } else if (response.status === 400) {
                showMessage(
                    "Esse horário já foi agendado e não está disponível"
                );
            } else {
                showMessage("Erro ao cadastrar a consulta");
            }
        })
        .catch((error) => {
            showMessage("Erro ao cadastrar a consulta");
        });
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
