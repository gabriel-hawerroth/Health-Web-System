// server.js
const express = require("express");
const bodyParser = require("body-parser");
const { Pool } = require("pg"); // Substituindo MySQL por PostgreSQL
const cors = require("cors");
const app = express();
const port = 8083;

let pool; // Usando pool em vez de uma única conexão

function connectToPostgres() {
    pool = new Pool({
        host: "localhost",
        user: "postgres", // Usuário padrão do PostgreSQL
        password: "postgres", // Senha padrão, altere conforme necessário
        database: "vitalmedical",
        port: 5432 // Porta padrão do PostgreSQL
    });

    pool.connect((error) => {
        if (error) {
            console.error("Not connected:", error.message);
            return;
        }

        console.log("Successfully Connected to PostgreSQL");
    });
}

// Verifica se a conexão já foi estabelecida
if (!pool) {
    connectToPostgres();
}

app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
});

app.use(cors());
app.use(bodyParser.json());

app.get("/conectar-postgres", (req, res) => {
    if (pool) {
        res.send("A conexão com o PostgreSQL já foi estabelecida");
    } else {
        connectToPostgres();
        res.status(200).send("Conectado com sucesso ao PostgreSQL");
    }
});

app.get("/login", (req, res) => {
    const email = req.query.email;
    const password = req.query.password;

    // No PostgreSQL, usamos $1, $2, etc para parâmetros
    const query = "SELECT * FROM usuario WHERE email=$1 AND senha=$2";

    pool.query(query, [email, password], (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de login: ",
                error.message
            );
            res.status(500).send("Erro na execução da query de login");
            return;
        }

        if (results.rows.length > 0) {
            console.log("Login bem sucessido: ", results.rows);
            res.status(200).send(results.rows);
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
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        // Inserir usuário
        const userQuery = "INSERT INTO usuario (email, senha, tipo_acesso) VALUES ($1, $2, 'PAC') RETURNING id";
        const userResults = await client.query(userQuery, [newAccount.email, newAccount.password]);
        
        const userId = userResults.rows[0].id;
        
        // Inserir paciente
        const patientQuery = "INSERT INTO paciente (id_usuario, nome, idade, cpf) VALUES ($1, $2, $3, $4)";
        await client.query(patientQuery, [userId, newAccount.name, newAccount.age, newAccount.cpf]);
        
        await client.query('COMMIT');
        console.log("Paciente criado com ID: ", userId);
        res.status(200).send({insertId: userId});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro ao criar conta: ", error.message);
        res.status(500).send("Erro ao criar conta: " + error.message);
    } finally {
        client.release();
    }
});

app.get("/buscar-paciente", (req, res) => {
    const userId = req.query.userId;

    const query = "SELECT * FROM paciente WHERE id_usuario = $1";

    pool.query(query, [userId], (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query de buscar paciente: ",
                error.message
            );
            res.status(500).send(
                "Erro na execução da query de buscar paciente"
            );
        } else if (results.rows.length > 0) {
            console.log("Paciente localizado : ", results.rows);
            res.send(results.rows);
        } else {
            console.log("Falha ao buscar paciente");
            res.status(404).send("Falha ao buscar paciente");
        }
    });
});

app.put("/atualizar-conta", async (req, res) => {
    const data = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        // Atualizar usuário
        let query = "UPDATE usuario SET email = $1, senha = $2 WHERE id = $3";
        await client.query(query, [data.email, data.password, data.id]);
        
        // Se for paciente, atualizar paciente
        if (data.cpf) {
            query = "UPDATE paciente SET nome = $1, idade = $2, cpf = $3 WHERE id_usuario = $4";
            await client.query(query, [data.name, data.age, data.cpf, data.userId]);
        }
        
        await client.query('COMMIT');
        res.status(200).send({success: true});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro ao atualizar conta: ", error.message);
        res.status(500).send("Erro ao atualizar conta: " + error.message);
    } finally {
        client.release();
    }
});

app.delete("/excluir-conta", async (req, res) => {
    const userId = req.query.userId;
    const isPatient = req.query.isPatient === "true" ? true : false;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        // Se for paciente, excluir dados do paciente primeiro
        if (isPatient) {
            await client.query("DELETE FROM paciente WHERE id_usuario = $1", [userId]);
        }
        
        // Excluir usuário
        await client.query("DELETE FROM usuario WHERE id = $1", [userId]);
        
        await client.query('COMMIT');
        res.status(200).send({success: true});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro ao excluir conta: ", error.message);
        res.status(500).send("Erro ao excluir conta: " + error.message);
    } finally {
        client.release();
    }
});

app.post("/cadastrar-medico", (req, res) => {
    const novoMedico = req.body;

    const query = "INSERT INTO medico (nome, especialidade) VALUES ($1, $2)";

    pool.query(query, [novoMedico.nome, novoMedico.especialidade], (error, results) => {
        if (error) {
            console.error(
                "Erro na execução da query insert de médico",
                error.message
            );
            res.status(500).send("Erro na execução da query insert de médico");
            return;
        } else {
            console.log("Médico cadastrado com sucesso");
            res.status(200).send({success: true});
        }
    });
});

app.post("/cadastrar-paciente", async (req, res) => {
    const novoPaciente = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        // Inserir usuário
        const userQuery = "INSERT INTO usuario (email, senha, tipo_acesso) VALUES ($1, $2, 'PAC') RETURNING id";
        const userResults = await client.query(userQuery, [novoPaciente.email, novoPaciente.senha]);
        
        const userId = userResults.rows[0].id;
        
        // Inserir paciente
        const patientQuery = "INSERT INTO paciente (id_usuario, nome, idade, cpf) VALUES ($1, $2, $3, $4)";
        await client.query(patientQuery, [userId, novoPaciente.nome, novoPaciente.idade, novoPaciente.cpf]);
        
        await client.query('COMMIT');
        res.status(200).send({insertId: userId});
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro ao cadastrar paciente: ", error.message);
        res.status(500).send("Erro ao cadastrar paciente: " + error.message);
    } finally {
        client.release();
    }
});

app.get("/lista-medicos", (req, res) => {
    const query = "SELECT * FROM medico";

    pool.query(query, (error, results) => {
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
            res.status(200).send(results.rows);
        }
    });
});

app.get("/lista-pacientes", (req, res) => {
    const query = "SELECT * FROM paciente";

    pool.query(query, (error, results) => {
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
            res.status(200).send(results.rows);
        }
    });
});

app.get("/lista-consultas", (req, res) => {
    // PostgreSQL tem funções TO_CHAR para formatação de data e hora
    const query = `
        SELECT con.id, pac.nome paciente, med.nome medico, TO_CHAR(con.data, 'DD/MM/YYYY') data,
        TO_CHAR(con.hora, 'HH24:MI') hora FROM consulta con JOIN paciente pac on con.id_paciente = pac.id
        JOIN medico med on con.id_medico = med.id
    `;

    pool.query(query, (error, results) => {
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
            res.status(200).send(results.rows);
        }
    });
});

app.post("/agendar-consulta", async (req, res) => {
    const consulta = req.body;
    const client = await pool.connect();

    try {
        await client.query('BEGIN');
        
        if (consulta.id) {
            // Atualizar consulta existente
            const query = "UPDATE consulta SET id_medico = $1, data = $2, hora = $3 WHERE id = $4";
            await client.query(query, [consulta.idMedico, consulta.data, consulta.hora, consulta.id]);
            
            await client.query('COMMIT');
            res.status(200).send({success: true});
        } else {
            // Verificar disponibilidade
            const checkQuery = "SELECT * FROM consulta WHERE id_medico = $1 AND data = $2 AND hora = $3";
            const checkResults = await client.query(checkQuery, [consulta.idMedico, consulta.data, consulta.hora]);
            
            if (checkResults.rows.length > 0) {
                await client.query('ROLLBACK');
                res.status(400).send("Esse horário não está disponível");
                return;
            }
            
            // Inserir nova consulta
            const insertQuery = "INSERT INTO consulta (id_paciente, id_medico, data, hora) VALUES ($1, $2, $3, $4)";
            await client.query(insertQuery, [consulta.idPaciente, consulta.idMedico, consulta.data, consulta.hora]);
            
            await client.query('COMMIT');
            res.status(200).send({success: true});
        }
    } catch (error) {
        await client.query('ROLLBACK');
        console.error("Erro ao agendar consulta: ", error.message);
        res.status(500).send("Erro ao agendar consulta: " + error.message);
    } finally {
        client.release();
    }
});

app.get("/verificar-consulta-paciente", (req, res) => {
    const idPaciente = req.query.idPaciente;

    const query = "SELECT * FROM consulta WHERE id_paciente = $1";

    pool.query(query, [idPaciente], (error, results) => {
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
            res.status(200).send(results.rows);
        }
    });
});

app.get("/buscar-consulta-marcada", (req, res) => {
    const idPaciente = req.query.idPaciente;

    const query = `
        SELECT con.id, con.id_paciente, con.id_medico, TO_CHAR(con.data, 'DD/MM/YYYY') data,
        TO_CHAR(con.hora, 'HH24:MI') hora, med.nome medico FROM consulta con JOIN medico med ON
        con.id_medico = med.id WHERE con.id_paciente = $1
    `;

    pool.query(query, [idPaciente], (error, results) => {
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
            res.status(200).send(results.rows);
        }
    });
});

app.delete("/cancelar-consulta", (req, res) => {
    const idConsulta = req.query.idConsulta;

    const query = "DELETE FROM consulta WHERE id = $1";

    pool.query(query, [idConsulta], (error, results) => {
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
            res.status(200).send({success: true});
        }
    });
});

app.post("/realizar-triagem", (req, res) => {
    const triagem = req.body;

    const query = `
        INSERT INTO triagem (id_paciente, status_urgencia, altura_cm, peso_kg, pressao, glicemia, frequencia_cardiaca,
        frequencia_respiratoria) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `;

    pool.query(query, [
        triagem.idPaciente, 
        triagem.statusUrgencia, 
        triagem.altura, 
        triagem.peso,
        triagem.pressao, 
        triagem.glicemia, 
        triagem.frequenciaCardiaca, 
        triagem.frequenciaRespiratoria
    ], (error, results) => {
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
            console.log("Triagem inserida com sucesso");
            res.status(200).send({success: true});
        }
    });
});
