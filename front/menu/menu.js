var user = {};
var patient = null;

const serverUrl = "http://localhost:8083";

document.addEventListener("DOMContentLoaded", function () {
    if (localStorage.getItem("naoPossuiConsultaMarcada")) {
        showMessage("Você não possui nenhuma consulta marcada");
        localStorage.removeItem("naoPossuiConsultaMarcada");
    } else if (localStorage.getItem("consultaCancelada")) {
        showMessage("Consulta cancelada com sucesso");
        localStorage.removeItem("consultaCancelada");
    }

    user = JSON.parse(atob(localStorage.getItem("user")));

    if (user.accessType === "ADM") {
        document.querySelectorAll(".module").forEach((module) => {
            module.style.display = "flex";
        });
    } else if (user.accessType === "ENF") {
        document.getElementById("triage").style.display = "flex";
    } else if (user.accessType === "PAC") {
        document.getElementById("schedule-consultation").style.display = "flex";
        document.getElementById("access-consultation").style.display = "flex";

        fetch(`${serverUrl}/buscar-paciente?userId=${user.id}`).then(
            async (response) => {
                if (response.ok) {
                    const responseBody = await response.json();

                    patient = {
                        id: responseBody[0].id,
                        userId: responseBody[0].id_usuario,
                        name: responseBody[0].nome,
                        age: responseBody[0].idade,
                        cpf: responseBody[0].cpf,
                    };

                    localStorage.setItem(
                        "patient",
                        btoa(JSON.stringify(patient))
                    );
                } else {
                    showMessage("Erro ao obter o paciente");
                }
            }
        );
    } else {
        console.log("Erro ao obter o usuário");
    }
});

function logout() {
    user = null;
    patient = null;
    localStorage.removeItem("user");
    localStorage.removeItem("patient");
    window.location.href = `../index.html`;
}

function popup() {
    document.getElementById("first-popup").style.display = "flex";

    document.addEventListener("click", (event) => {
        const popup = document.getElementById("first-popup");
        const userIcon = document.getElementById("user-icon");

        if (
            popup &&
            !popup.contains(event.target) &&
            !userIcon.contains(event.target)
        ) {
            document.getElementById("first-popup").style.display = "none";
        }
    });
}

function accountPopup(addClickListener = false) {
    document.getElementById("first-popup").style.display = "none";
    document.getElementById("account-popup").style.display = "flex";

    if (user.accessType === "PAC") {
        document.getElementById(
            "user-name"
        ).innerHTML = `Nome: ${patient.name}`;

        document.getElementById("user-age").innerHTML = `Idade: ${patient.age}`;

        document.getElementById("user-cpf").innerHTML = `CPF: ${patient.cpf}`;
    }

    document.getElementById("user-email").innerHTML = `Email: ${user.email}`;

    let password = "Senha: ";
    for (var i = 0; i < user.password.length; i++) {
        password = password.concat("*");
    }

    document.getElementById("user-password").innerHTML = password;

    if (addClickListener) {
        document.addEventListener("click", (event) => {
            const accountPpopup = document.getElementById("account-popup");
            const firstPopup = document.getElementById("first-popup");

            if (
                accountPpopup &&
                !accountPpopup.contains(event.target) &&
                !firstPopup.contains(event.target)
            ) {
                document.getElementById("account-popup").style.display = "none";
                cancelAccountEdition();
                document.removeEventListener("click", this);
            }
        });
    }
}

function showEditAccount() {
    const emailInput = document.getElementById("email-input");
    const passwordInput = document.getElementById("password-input");

    if (user.accessType === "PAC") {
        document.getElementById("user-name").style.display = "none";
        document.getElementById("user-age").style.display = "none";
        document.getElementById("user-cpf").style.display = "none";

        document.querySelectorAll(".account-input").forEach((input) => {
            input.style.display = "block";
        });

        document.getElementById("name-input").value = patient.name;
        document.getElementById("age-input").value = patient.age;
        document.getElementById("cpf-input").value = patient.cpf;
    } else {
        emailInput.style.display = "block";
        emailInput.style.width = "100%";

        passwordInput.style.display = "block";
        passwordInput.style.width = "100%";
    }

    document.getElementById("user-email").style.display = "none";
    document.getElementById("user-password").style.display = "none";

    document.getElementById("edit-account-btn").style.display = "none";
    document.getElementById("save-account-btn").style.display = "block";
    document.getElementById("cancel-edition-btn").style.display = "block";
    document.getElementById("delete-account-btn").style.display = "none";

    emailInput.value = user.email;
    passwordInput.value = user.password;
}

function cancelAccountEdition(closePopups = false) {
    if (user.accessType === "PAC") {
        document.getElementById("name-input").value = patient.name;
        document.getElementById("age-input").value = patient.age;
        document.getElementById("cpf-input").value = patient.cpf;

        document.getElementById("user-name").style.display = "block";
        document.getElementById("user-age").style.display = "block";
        document.getElementById("user-cpf").style.display = "block";
    } else {
    }

    document.getElementById("user-email").style.display = "block";
    document.getElementById("user-password").style.display = "block";

    document.querySelectorAll(".account-input").forEach((input) => {
        input.style.display = "none";
    });

    document.getElementById("edit-account-btn").style.display = "block";
    document.getElementById("save-account-btn").style.display = "none";
    document.getElementById("cancel-edition-btn").style.display = "none";
    document.getElementById("delete-account-btn").style.display = "block";

    document.getElementById("email-input").value = user.email;
    document.getElementById("password-input").value = user.password;
}

function saveAccount() {
    const email = document.getElementById("email-input");
    const senha = document.getElementById("password-input");
    const nome = document.getElementById("name-input");
    const idade = document.getElementById("age-input");
    const cpf = document.getElementById("cpf-input");

    const regex = /^[0-9]+$/;

    const account =
        patient === null
            ? {
                  id: user.id,
                  email: email.value,
                  password: senha.value,
              }
            : {
                  id: user.id,
                  userId: patient.userId,
                  email: email.value,
                  password: senha.value,
                  name: nome.value,
                  age: idade.value,
                  cpf: cpf.value,
              };

    if (
        !nome.value ||
        !idade.value ||
        !email.value ||
        !cpf.value ||
        !senha.value
    ) {
        showMessage("Todos os campos são obrigatórios");
        return;
    } else if (
        idade.value.length < 1 ||
        idade.value.length > 3 ||
        idade.value < 18 ||
        idade.value > 130
    ) {
        showMessage("Idade inválida");
        return;
    } else if (email.invalid) {
        showMessage("E-mail inválido");
        return;
    } else if (!regex.test(cpf.value)) {
        showMessage("CPF inválido");
        return;
    } else if (senha.value < 6) {
        showMessage("A senha deve ter no mínimo seis caracteres");
        return;
    }

    fetch(`${serverUrl}/atualizar-conta`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(account),
    })
        .then((response) => response.json())
        .then((response) => {
            showMessage("Conta atualizada com sucesso");

            if (patient === null) {
                user = account;
            } else {
                user = {
                    id: account.id,
                    email: account.email,
                    password: account.password,
                    accessType: user.accessType,
                };

                patient = {
                    id: patient.id,
                    userId: patient.userId,
                    name: account.name,
                    age: account.age,
                    cpf: account.cpf,
                };
            }

            cancelAccountEdition();
            accountPopup();
        })
        .catch((error) => {
            console.log(error);
            showMessage("Erro ao atualizar a conta");
        });
}

function confirmAccountDelete(show) {
    if (show) {
        document.getElementById("delete-account-dialog").style.display = "flex";
    } else {
        document.getElementById("delete-account-dialog").style.display = "none";
    }
}

function deleteAccount() {
    fetch(
        `${serverUrl}/excluir-conta?userId=${user.id}&isPatient=${
            patient !== null
        }`,
        {
            method: "DELETE",
        }
    )
        .then((response) => {
            if (response.status === 200) {
                confirmAccountDelete(false);
                showMessage("Conta excluída com sucesso");

                user = null;
                patient = null;
                localStorage.removeItem("user");
                localStorage.removeItem("patient");
                localStorage.removeItem("savedLogin");

                window.location.href = `../index.html`;
            } else {
                confirmAccountDelete(false);
                showMessage("Erro ao excluir a conta");
            }
        })
        .catch((error) => {
            confirmAccountDelete(false);
            showMessage("Erro ao excluir a conta");
        });
}

function pageRedirection(url) {
    window.location.href = `../${url}`;
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
