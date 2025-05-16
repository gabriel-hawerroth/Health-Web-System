var user = {};
var patient = null;

const serverUrl = "http://localhost:8083";

var consulta = null;
var medicos = [];

user = JSON.parse(atob(localStorage.getItem("user")));

if (user.accessType === "PAC") {
    patient = JSON.parse(atob(localStorage.getItem("patient")));
}

document.addEventListener("DOMContentLoaded", () => {
    if (localStorage.getItem("consultaCadastrada")) {
        const titulo = document.getElementById("titulo-card");
        titulo.innerHTML = "Consulta marcada com sucesso";

        document.getElementById("icone").style.display = "block";

        showMessage("Consulta marcada com sucesso");
        localStorage.removeItem("consultaCadastrada");
    } else if (localStorage.getItem("jaPossuiConsulta")) {
        showMessage("Você já possui uma consulta marcada");
        localStorage.removeItem("jaPossuiConsulta");
    }

    const inputHora = document.getElementById("input-horario");
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
        const titulo = document.getElementById("titulo-card");
        titulo.innerHTML = "Consultas marcadas";

        document.getElementById("card-content").style.display = "none";

        fetch(`${serverUrl}/lista-consultas`)
            .then(async (response) => {
                if (response.ok) {
                    const consultas = await response.json();

                    document.getElementById("consultas-card").style.display =
                        "flex";

                    const listaConsultas =
                        document.getElementById("lista-consultas");

                    consultas.forEach((registro) => {
                        const item = document.createElement("li");
                        item.innerHTML =
                            `Paciente: ${registro.paciente} | Médico: ${registro.medico}` +
                            ` | Data: ${registro.data} | Hora: ${registro.hora}`;
                        listaConsultas.appendChild(item);
                    });
                } else {
                    showMessage("Erro ao obter a lista de consultas");
                }
            })
            .catch((error) => {
                console.log(error);
                showMessage("Erro ao obter a lista de consultas");
            });
    } else if (user.accessType === "PAC") {
        fetch(`${serverUrl}/lista-medicos`)
            .then(async (response) => {
                if (response.ok) {
                    const responseBody = await response.json();

                    medicos = responseBody;

                    const select = document.getElementById("select-medico");

                    medicos.forEach((registro) => {
                        const item = document.createElement("option");
                        item.value = registro.id.toString();
                        item.text = registro.nome;
                        select.add(item);
                    });
                } else {
                    showMessage("Erro ao obter a lista de médicos");
                }
            })
            .catch((error) => {
                showMessage("Erro ao obter a lista de médicos");
            });

        buscarConsultaMarcada();
    } else {
        showMessage("Erro ao obter a consulta");
    }
});

async function buscarConsultaMarcada() {
    await fetch(
        `${serverUrl}/buscar-consulta-marcada?idPaciente=${patient.id}`
    ).then(async (response) => {
        if (response.ok) {
            const responseBody = await response.json();

            if (responseBody.length < 1) {
                localStorage.setItem("naoPossuiConsultaMarcada", "true");
                window.location.href = "../menu/menu.html";
                return;
            }

            consulta = responseBody[0];

            const medico = consulta.medico;
            const horario = consulta.hora;
            const dia = consulta.data;

            document.getElementById(
                "consulta-medico"
            ).innerHTML = `Médico: ${medico}`;
            document.getElementById(
                "consulta-horario"
            ).innerHTML = `Horário: ${horario}`;
            document.getElementById("consulta-data").innerHTML = `Data: ${dia}`;

            document.getElementById("select-medico").value = consulta.id_medico;

            document.getElementById("input-horario").value = horario;

            const partesData = dia.split("/");
            const dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;

            document.getElementById("input-data").value = dataFormatada;
        } else {
            showMessage("Erro ao obter a consulta");
        }
    });
}

function voltarAoMenu() {
    window.location.href = `../menu/menu.html`;
}

function editarConsulta() {
    const views = document.querySelectorAll(".view");
    views.forEach((element) => {
        element.style.display = "none";
    });

    const edits = document.querySelectorAll(".edit");
    edits.forEach((element) => {
        element.style.display = "flex";
    });

    document.getElementById("editar-consulta-btn").style.display = "none";
    document.getElementById("cancelar-consulta-btn").style.display = "none";
    document.getElementById("salvar-consulta-btn").style.display = "block";
    document.getElementById("cancelar-edicao-btn").style.display = "block";
}

function cancelarEdicao() {
    const views = document.querySelectorAll(".view");
    views.forEach((element) => {
        element.style.display = "flex";
    });

    const edits = document.querySelectorAll(".edit");
    edits.forEach((element) => {
        element.style.display = "none";
    });

    document.getElementById("editar-consulta-btn").style.display = "block";
    document.getElementById("cancelar-consulta-btn").style.display = "block";
    document.getElementById("salvar-consulta-btn").style.display = "none";
    document.getElementById("cancelar-edicao-btn").style.display = "none";

    document.getElementById("select-medico").value = consulta.id_medico;
    document.getElementById("input-horario").value = consulta.hora;
    const partesData = consulta.data.split("/");
    const dataFormatada = `${partesData[2]}-${partesData[1]}-${partesData[0]}`;
    document.getElementById("input-data").value = dataFormatada;
}

function salvarConsulta() {
    const novaConsulta = {
        id: consulta.id,
        idPaciente: patient.id,
        idMedico: document.getElementById("select-medico").value,
        data: document.getElementById("input-data").value,
        hora: document.getElementById("input-horario").value,
    };

    if (
        !novaConsulta.id ||
        !novaConsulta.idPaciente ||
        !novaConsulta.idMedico ||
        !novaConsulta.data ||
        !novaConsulta.hora
    ) {
        showMessage("Todos os campos são obrigatórios");
        return;
    }

    const dataAtual = new Date();
    const dataSelecionada = new Date(
        `${novaConsulta.data} ${novaConsulta.hora}`
    );

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
        body: JSON.stringify(novaConsulta),
    })
        .then(async (response) => {
            if (response.ok) {
                showMessage("Consulta alterada com sucesso");

                await buscarConsultaMarcada();
                cancelarEdicao();
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

function confirmarCancelamento(exibir) {
    if (exibir)
        document.getElementById("cancelar-consulta-dialog").style.display =
            "flex";
    else
        document.getElementById("cancelar-consulta-dialog").style.display =
            "none";
}

function cancelarConsulta() {
    console.log(consulta.id);
    document.getElementById("cancelar-consulta-dialog").style.display = "none";

    fetch(`${serverUrl}/cancelar-consulta?idConsulta=${consulta.id}`, {
        method: "DELETE",
    })
        .then((response) => {
            if (response.ok) {
                localStorage.setItem("consultaCancelada", "true");
                window.location.href = "../menu/menu.html";
            } else {
                showMessage("Erro ao cancelar a consulta");
            }
        })
        .catch((error) => {
            showMessage("Erro ao cancelar a consulta");
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
