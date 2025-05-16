// Chama a função de conexão quando a página HTML é totalmente carregada
document.addEventListener("DOMContentLoaded", function () {
    connectToMySQL();

    if (localStorage.getItem("savedLogin")) {
        const user = JSON.parse(atob(localStorage.getItem("savedLogin")));

        document.getElementById("emailInput").value = user.email;
        document.getElementById("passwordInput").value = user.password;
        document.getElementById("remember-me-id").checked = true;
    }
});

const serverUrl = "http://localhost:8083";

// conecta com o servidor do mysql
function connectToMySQL() {
    fetch(`${serverUrl}/conectar-mysql`)
        .then((response) => response.text())
        .then((data) => console.log(data))
        .catch((error) => console.error("Erro ao conectar ao MYSQL:", error));
}

// função chamada para fazer login
function login() {
    const emailInput = document.querySelector("#emailInput").value;
    const passwordInput = document.querySelector("#passwordInput").value;

    fetch(`${serverUrl}/login?email=${emailInput}&password=${passwordInput}`)
        .then(async (response) => {
            if (response.ok) {
                const responseBody = await response.json();

                const user = {
                    id: responseBody[0].id,
                    email: emailInput,
                    password: passwordInput,
                    accessType: responseBody[0].tipo_acesso,
                };

                localStorage.setItem("user", btoa(JSON.stringify(user)));

                if (document.getElementById("remember-me-id").checked) {
                    localStorage.setItem(
                        "savedLogin",
                        btoa(
                            JSON.stringify({
                                email: user.email,
                                password: user.password,
                            })
                        )
                    );
                } else {
                    localStorage.removeItem("savedLogin");
                }

                window.location.href = `./menu/menu.html`;
            } else {
                showMessage("Credenciais incorretas");
            }
        })
        .catch(() => {
            showMessage("Erro no sistema, tente novamente mais tarde");
        });
}

// muda para a tela de cadastro
function redirectToSignUp() {
    var elements = document.getElementsByClassName("sign-in");

    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = "none";
    }

    elements = document.getElementsByClassName("sign-up");

    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = "flex";
    }
}

// muda para a tela de login
function redirectToSignIn() {
    var elements = document.getElementsByClassName("sign-in");

    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = "flex";
    }

    elements = document.getElementsByClassName("sign-up");

    for (var i = 0; i < elements.length; i++) {
        elements[i].style.display = "none";
    }
}

function createAccount() {
    const elements = Array.from(document.querySelectorAll(".register-input"));

    const regex = /^[0-9]+$/;

    const [
        nameInput,
        ageInput,
        emailInput,
        cpfInput,
        passwordInput,
        passwordConfirm,
    ] = elements;

    if (
        !nameInput.value ||
        !ageInput.value ||
        !emailInput.value ||
        !passwordInput.value ||
        !passwordConfirm.value ||
        !cpfInput.value
    ) {
        showMessage("Todos os campos são obrigatórios", 3500);
        return;
    } else if (ageInput.value.length > 3 || ageInput.value.length < 1) {
        showMessage("É necessário ser uma idade válida");
        return;
    } else if (ageInput.value > 130 || ageInput.value < 0) {
        showMessage("É necessário ser uma idade válida");
        return;
    } else if (ageInput.value < 18) {
        showMessage("Apenas maiores de 18 anos podem fazer o cadastro");
        return;
    } else if (!emailInput.validity.valid) {
        showMessage("É necessário ser um email válido");
        return;
    } else if (passwordInput.value.length < 6) {
        showMessage("A senha deve ter 6 caracteres ou mais");
        return;
    } else if (passwordInput.value !== passwordConfirm.value) {
        showMessage("As senhas não coincidem");
        return;
    } else if (cpfInput.value.length !== 11 || !regex.test(cpfInput.value)) {
        showMessage("É necessário ser um CPF válido");
        return;
    }

    const newAccount = {
        name: nameInput.value,
        age: ageInput.value,
        email: emailInput.value,
        password: passwordInput.value,
        cpf: cpfInput.value,
    };

    fetch(`${serverUrl}/criar-conta-paciente`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(newAccount),
    })
        .then((response) => response.json())
        .then((data) => {
            showMessage("Conta criada com sucesso");
            document.getElementById("emailInput").value = "";
            document.getElementById("passwordInput").value = "";
            redirectToSignIn();
        })
        .catch((error) => {
            console.log(`Erro: ${error}`);
            showMessage(
                "Erro ao criar a conta, entre em contato com nosso suporte"
            );
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
