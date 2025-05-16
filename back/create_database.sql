-- Criar banco de dados
CREATE DATABASE vitalmedical;

-- Criar tabelas
CREATE TABLE usuario (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  senha VARCHAR(255) NOT NULL,
  tipo_acesso VARCHAR(3) NOT NULL
);

CREATE TABLE paciente (
  id SERIAL PRIMARY KEY,
  id_usuario INTEGER NOT NULL REFERENCES usuario(id) ON DELETE CASCADE,
  nome VARCHAR(255) NOT NULL,
  idade INTEGER NOT NULL,
  cpf VARCHAR(14) NOT NULL
);

CREATE TABLE medico (
  id SERIAL PRIMARY KEY,
  nome VARCHAR(255) NOT NULL,
  especialidade VARCHAR(255) NOT NULL
);

CREATE TABLE consulta (
  id SERIAL PRIMARY KEY,
  id_paciente INTEGER NOT NULL REFERENCES paciente(id) ON DELETE CASCADE,
  id_medico INTEGER NOT NULL REFERENCES medico(id) ON DELETE CASCADE,
  data DATE NOT NULL,
  hora TIME NOT NULL
);

CREATE TABLE triagem (
  id SERIAL PRIMARY KEY,
  id_paciente INTEGER NOT NULL REFERENCES paciente(id) ON DELETE CASCADE,
  status_urgencia INTEGER NOT NULL,
  altura_cm INTEGER NOT NULL,
  peso_kg DECIMAL(5,2) NOT NULL,
  pressao VARCHAR(7) NOT NULL,
  glicemia INTEGER NOT NULL,
  frequencia_cardiaca INTEGER NOT NULL,
  frequencia_respiratoria INTEGER NOT NULL
);
