// server.js
const express = require("express");
const bodyParser = require("body-parser");
const mysql = require("mysql");
const cors = require("cors");
const app = express();
const port = 3000;

let con;

function connectToMySQL() {
    con = mysql.createConnection({
        host: "localhost",
        user: "root",
        password: "",
        database: "vitalmedical",
    });

    con.connect((error) => {
        if (error) {
            console.error("Not connected:", error.message);
            return;
        }

        console.log("Successfully Connected");
    });
}

// Verifica se a conexão já foi estabelecida
if (!con) {
    connectToMySQL();
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

app.use(cors());
app.use(bodyParser.json());

app.get("/conectar-mysql", (req, res) => {
    if (con) {
        res.send("A conexão com o MYSQL já foi estabelecida");
    } else {
        connectToMySQL();
        res.status(200).send("Conectado com sucesso ao MYSQL");
    }
});

app.get("/login", (req, res) => {
    const email = req.query.email; // enviado como parâmetro na URL
    const password = req.query.password; // enviado como parâmetro na URL

    const query = `SELECT * FROM USUARIO WHERE email='${email}' AND senha='${password}'`;

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de login: ",
                error.message
            );
            res.status(500).send("Erro na execução da query de login");
            return;
        }

        if (results.length > 0) {
            console.log("Login bem sucessido: ", results);
            res.status(200).send(results);
        } else {
            console.log(
                "Falha no login: usuario nao encontrado ou credenciais incorretas"
            );
            res.status(404).send(
                "Falha no login: usuario nao encontrado ou credenciais incorretas"
            );
        }
    });
});

app.post("/criar-conta-paciente", async (req, res) => {
    const newAccount = req.body;

    let query = `INSERT INTO USUARIO (EMAIL, SENHA, TIPO_ACESSO) VALUES ('${newAccount.email}', '${newAccount.password}', 'PAC')`;

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execucao da query de criar usuario: ",
                error.message
            );
            res.status(500).send("Erro na execucao da query de criar usuario");
        } else {
            console.log("Usuario criado: ", results);

            query = `INSERT INTO PACIENTE (ID_USUARIO, NOME, IDADE, CPF) VALUES (${results.insertId}, '${newAccount.name}', ${newAccount.age}, '${newAccount.cpf}')`;

            con.query(query, (error, results) => {
                if (error) {
                    console.error(
                        "Erro na execucao da query de criar paciente: ",
                        error.message
                    );
                    res.status(500).send(
                        "Erro na execucao da query de criar paciente"
                    );
                } else {
                    console.log("Paciente criado: ", results);
                    res.status(200).send(results);
                }
            });
        }
    });
});

app.get("/buscar-paciente", (req, res) => {
    const userId = req.query.userId;

    const query = `SELECT * FROM PACIENTE WHERE ID_USUARIO = ${userId}`;

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de buscar paciente: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de buscar paciente"
            );
        } else if (results.length > 0) {
            console.log("Paciente localizado : ", results);
            res.send(results);
        } else {
            console.log("Falha ao buscar paciente");
            res.status(404).send("Falha ao buscar paciente");
        }
    });
});

app.put("/atualizar-conta", (req, res) => {
    const data = req.body;

    let query = `update usuario set email = '${data.email}', senha = '${data.password}' where id = ${data.id}`;

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de update do usuario: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de update do usuario"
            );
        } else {
            console.log("Usuario atualizado: ", results);

            if (!data.cpf) {
                res.status(200).send(results);
                return;
            }

            query = `update paciente set nome = '${data.name}', idade = '${data.age}', cpf = '${data.cpf}' where id_usuario = ${data.userId}`;

            con.query(query, (error, result) => {
                if (error) {
                    console.error(
                        "Erro na execucao da query de update do paciente: ",
                        error.message
                    );
                    res.status(500).send(
                        "Erro na execucao da query de update do paciente"
                    );
                } else {
                    console.log("Paciente atualizado: ", result);

                    res.status(200).send(result);
                }
            });
        }
    });
});

app.delete("/excluir-conta", (req, res) => {
    const userId = req.query.userId;
    const isPatient = req.query.isPatient === "true" ? true : false;

    let query = `delete from usuario where id = ${userId}`;

    con.query(query, (error, results) => {
        if (error) {
            console.log(
                "Erro na execução da query de delete do usuario: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de delete do usuario"
            );
        } else {
            console.log("Conta excluída: ", results);

            if (!isPatient) {
                res.status(200).send(results);
                return;
            } else {
                query = `delete from paciente where id_usuario = ${userId}`;

                con.query(query, (error, result) => {
                    if (error) {
                        console.error(
                            "Erro na execução de delete do paciente: ",
                            error.message
                        );
                        res.status(500).send(
                            "Erro na execução de delete do paciente"
                        );
                    } else {
                        console.log("Paciente excluído: ", result);
                        res.status(200).send(result);
                    }
                });
            }
        }
    });
});

app.post("/cadastrar-medico", (req, res) => {
    const novoMedico = req.body;

    const query = `INSERT INTO MEDICO (nome, especialidade) values ('${novoMedico.nome}', '${novoMedico.especialidade}')`;

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query insert de médico",
                error.message
            );
            res.status(500).send("Erro na execução da query insert de médico");
            return;
        } else {
            console.log("Médico cadastrado: ", results);
            res.status(200).send(results);
        }
    });
});

app.post("/cadastrar-paciente", (req, res) => {
    const novoPaciente = req.body;

    let query = `insert into usuario (email, senha, tipo_acesso) values ('${novoPaciente.email}', '${novoPaciente.senha}', 'PAC')`;

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de insert do usuario: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de insert do usuario"
            );
            return;
        } else {
            console.log("Usuário criado: ", results);

            query = `insert into paciente (id_usuario, nome, idade, cpf) values (${results.insertId}, '${novoPaciente.nome}', ${novoPaciente.idade}, '${novoPaciente.cpf}')`;

            con.query(query, (error, results) => {
                if (error) {
                    console.error(
                        "Erro na execução da query de insert do paciente: ",
                        error.message
                    );
                    res.status(500).send(
                        "Erro na execução da query de insert do paciente"
                    );
                } else {
                    console.log("Paciente criado: ", results);
                    res.status(200).send(results);
                }
            });
        }
    });
});

app.get("/lista-medicos", (req, res) => {
    const query = "SELECT * FROM MEDICO";

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de select de médicos: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de select de médicos"
            );
            return;
        } else {
            res.status(200).send(results);
        }
    });
});

app.get("/lista-pacientes", (req, res) => {
    const query = "SELECT * FROM PACIENTE";

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de select de pacientes: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de select de pacientes"
            );
            return;
        } else {
            res.status(200).send(results);
        }
    });
});

app.get("/lista-consultas", (req, res) => {
    const query =
        "SELECT con.id, pac.nome paciente, med.nome medico, DATE_FORMAT(con.data, '%d/%m/%Y') data, " +
        "TIME_FORMAT(con.hora, '%H:%i') hora FROM consulta con JOIN paciente pac on con.id_paciente = pac.id " +
        "JOIN medico med on con.id_medico = med.id";

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de select das consultas: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de select das consultas"
            );
            return;
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/agendar-consulta", async (req, res) => {
    const consulta = req.body;

    if (consulta.id) {
        let query = `UPDATE consulta set id_medico = ${consulta.idMedico}, data = '${consulta.data}', hora = '${consulta.hora}' where id = ${consulta.id}`;

        await con.query(query, (error, results) => {
            if (error) {
                console.error(
                    "Erro na execução da query de update da consulta: ",
                    error.message
                );
                res.status(500).send(
                    "Erro na execução da query de update da consulta"
                );
            } else {
                res.status(200).send(results);
            }
        });

        return;
    } else {
        let query = `SELECT * FROM CONSULTA WHERE ID_MEDICO = ${consulta.idMedico} AND DATA = '${consulta.data}' AND HORA = '${consulta.hora}'`;

        con.query(query, (error, results) => {
            if (error) {
                console.error(
                    "Erro na execução da query de select das consultas: ",
                    error.message
                );
                res.status(500).send(
                    "Erro na execução da query de select das consultas"
                );
                return;
            } else {
                if (results.length > 0) {
                    res.status(400).send("Esse horário não está disponível");
                    return;
                } else {
                    query = `INSERT INTO CONSULTA (ID_PACIENTE, ID_MEDICO, DATA, HORA) VALUES (${consulta.idPaciente}, ${consulta.idMedico}, '${consulta.data}', '${consulta.hora}')`;

                    con.query(query, (error, results) => {
                        if (error) {
                            console.error(
                                "Erro na execução da query de insert da consulta: ",
                                error.message
                            );
                            res.status(500).send(
                                "Erro na execução da query de insert da consulta"
                            );
                            return;
                        } else {
                            console.log("Consulta cadastrada: ", results);
                            res.status(200).send(results);
                        }
                    });
                }
            }
        });
    }
});

app.get("/verificar-consulta-paciente", (req, res) => {
    const idPaciente = req.query.idPaciente;

    const query = `SELECT * FROM CONSULTA WHERE ID_PACIENTE = ${idPaciente}`;

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de select de consulta do paciente: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de select de consulta do paciente"
            );
            return;
        } else {
            res.status(200).send(results);
        }
    });
});

app.get("/buscar-consulta-marcada", (req, res) => {
    const idPaciente = req.query.idPaciente;

    const query =
        `select con.id, con.id_paciente, con.id_medico, DATE_FORMAT(con.data, '%d/%m/%Y') data,` +
        ` TIME_FORMAT(con.hora, '%H:%i') hora, med.nome medico from consulta con join medico med on` +
        ` con.id_medico = med.id where con.id_paciente = ${idPaciente}`;

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de select da consulta marcada: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de select da consulta marcada"
            );
            return;
        } else {
            res.status(200).send(results);
        }
    });
});

app.delete("/cancelar-consulta", (req, res) => {
    const idConsulta = req.query.idConsulta;

    const query = `DELETE FROM CONSULTA WHERE ID = ${idConsulta}`;

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de delete da consulta: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de delete da consulta"
            );
            return;
        } else {
            res.status(200).send(results);
        }
    });
});

app.post("/realizar-triagem", (req, res) => {
    const triagem = req.body;

    const query =
        `insert into triagem (id_paciente, status_urgencia, altura_cm, peso_kg, pressao, glicemia, frequencia_cardiaca,` +
        ` frequencia_respiratoria) values (${triagem.idPaciente}, ${triagem.statusUrgencia}, ${triagem.altura}, ${triagem.peso},` +
        `${triagem.pressao}, ${triagem.glicemia}, ${triagem.frequenciaCardiaca}, ${triagem.frequenciaRespiratoria})`;

    con.query(query, (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de insert da triagem: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de insert da triagem"
            );
            return;
        } else {
            console.log("Triagem inserida: ", results);
            res.status(200).send(results);
        }
    });
});
