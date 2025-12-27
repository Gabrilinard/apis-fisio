/* eslint-env node */
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const mysql = require('mysql2');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const path = require('path');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:5174', 'http://localhost:3000'],
  credentials: true
}));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

const db = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Medusawebby210',
  database: 'agendamento',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = db;

const dbCallback = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Medusawebby210',
  database: 'agendamento',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

const dbPromise = mysql.createConnection({
  host: 'localhost',
  port: 3306,
  user: 'root',
  password: 'Medusawebby210',
  database: 'agendamento',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
}).promise();

module.exports = { dbCallback, dbPromise };

const port = process.env.PORT || 3000;
app.listen(port, () => {
  console.log(`Servidor rodando na porta ${port}`);
});

db.connect(err => {
  if (err) {
    console.error('Erro ao conectar ao banco de dados:', err.message);
    console.log('Servidor continuará rodando, mas operações de banco podem falhar.');
  } else {
    console.log('Banco conectado!');
  }
});

app.post('/register', async (req, res) => {
    const { 
      nome, 
      sobrenome, 
      telefone,
      email,
      senha,
      tipoUsuario,
      tipoProfissional,
      especialidadeMedica,
      profissaoCustomizada,
      numeroConselho,
      ufRegiao,
      latitude,
      longitude,
      cidade
    } = req.body;
  
    console.log('=== DADOS RECEBIDOS NO REGISTRO ===');
    console.log('req.body completo:', JSON.stringify(req.body, null, 2));
    console.log('tipoUsuario recebido:', tipoUsuario, 'tipo:', typeof tipoUsuario);
    console.log('tipoUsuario === "profissional":', tipoUsuario === 'profissional');
    console.log('tipoUsuario === "paciente":', tipoUsuario === 'paciente');
    console.log('tipoProfissional:', tipoProfissional);
    console.log('numeroConselho:', numeroConselho);
    console.log('ufRegiao:', ufRegiao);
    console.log('latitude:', latitude);
    console.log('longitude:', longitude);
  
    if (!nome || !sobrenome || !email || !senha) {
      return res.status(400).json({ error: 'Todos os campos são obrigatórios!' });
    }
    
    if (tipoUsuario === 'profissional') {
      if (!tipoProfissional) {
        return res.status(400).json({ error: 'Tipo de profissional é obrigatório.' });
      }
      const tiposValidos = ['medico', 'dentista', 'nutricionista', 'fisioterapeuta', 'fonoaudiologo', 'outros'];
      if (!tiposValidos.includes(tipoProfissional)) {
        return res.status(400).json({ error: 'Tipo de profissional inválido.' });
      }
      if (tipoProfissional === 'medico' && (!especialidadeMedica || !especialidadeMedica.trim())) {
        return res.status(400).json({ error: 'Especialidade médica é obrigatória para médicos.' });
      }
      if (tipoProfissional === 'outros' && (!profissaoCustomizada || !profissaoCustomizada.trim())) {
        return res.status(400).json({ error: 'Profissão customizada é obrigatória quando selecionar "Outros".' });
      }
      if (!numeroConselho || !numeroConselho.trim()) {
        return res.status(400).json({ error: 'Número do conselho é obrigatório para profissionais.' });
      }
      
      const apenasNumeros = numeroConselho.replace(/\D/g, '');
      let regexConselho;
      let mensagemErro;
      
      switch (tipoProfissional) {
        case 'medico':
          regexConselho = /^CRM\s?\d{4,6}$/i;
          mensagemErro = 'Número do conselho inválido. Formato esperado: CRM 123456 (4 a 6 dígitos)';
          break;
        case 'dentista':
          regexConselho = /^CRO\s?\d{4,6}$/i;
          mensagemErro = 'Número do conselho inválido. Formato esperado: CRO 123456 (4 a 6 dígitos)';
          break;
        case 'nutricionista':
          regexConselho = /^CRN\s?\d{4,5}$/i;
          mensagemErro = 'Número do conselho inválido. Formato esperado: CRN 12345 (4 a 5 dígitos)';
          break;
        case 'fisioterapeuta':
          regexConselho = /^CREFITO\s?\d{4,6}$/i;
          mensagemErro = 'Número do conselho inválido. Formato esperado: CREFITO 123456 (4 a 6 dígitos)';
          break;
        case 'fonoaudiologo':
          regexConselho = /^CRFa\s?\d{4,5}$/i;
          mensagemErro = 'Número do conselho inválido. Formato esperado: CRFa 12345 (4 a 5 dígitos)';
          break;
        default:
          regexConselho = /^[A-Za-z0-9\s]{3,15}$/;
          mensagemErro = 'Número do conselho inválido. Deve conter entre 3 e 10 dígitos';
      }
      
      if (!regexConselho.test(numeroConselho.trim())) {
        return res.status(400).json({ error: mensagemErro });
      }
      
      if (tipoProfissional === 'medico' && (apenasNumeros.length < 4 || apenasNumeros.length > 6)) {
        return res.status(400).json({ error: 'CRM deve conter entre 4 e 6 dígitos' });
      }
      if (tipoProfissional === 'dentista' && (apenasNumeros.length < 4 || apenasNumeros.length > 6)) {
        return res.status(400).json({ error: 'CRO deve conter entre 4 e 6 dígitos' });
      }
      if (tipoProfissional === 'nutricionista' && (apenasNumeros.length < 4 || apenasNumeros.length > 5)) {
        return res.status(400).json({ error: 'CRN deve conter entre 4 e 5 dígitos' });
      }
      if (tipoProfissional === 'fisioterapeuta' && (apenasNumeros.length < 4 || apenasNumeros.length > 6)) {
        return res.status(400).json({ error: 'CREFITO deve conter entre 4 e 6 dígitos' });
      }
      if (tipoProfissional === 'fonoaudiologo' && (apenasNumeros.length < 4 || apenasNumeros.length > 5)) {
        return res.status(400).json({ error: 'CRFa deve conter entre 4 e 5 dígitos' });
      }
      if (!ufRegiao || !ufRegiao.trim()) {
        return res.status(400).json({ error: 'UF/Região é obrigatória para profissionais.' });
      }
    }
  
    try {
      const hashedPassword = await bcrypt.hash(senha, 10);

      let tipoUsuarioFinal;
      
      if (tipoUsuario === 'profissional') {
        tipoUsuarioFinal = 'profissional';
        console.log('✅✅✅ tipoUsuario é "profissional" - FORÇANDO COMO PROFISSIONAL ✅✅✅');
      } else if (tipoProfissional || numeroConselho || ufRegiao || latitude || longitude || cidade) {
        tipoUsuarioFinal = 'profissional';
        console.log('✅ Forçando tipoUsuario para "profissional" porque há campos de profissional');
      } else {
        tipoUsuarioFinal = 'paciente';
        console.log('✅ tipoUsuario é "paciente" ou não definido - definindo como paciente');
      }
      
      if (tipoUsuarioFinal === 'cliente') {
        tipoUsuarioFinal = 'paciente';
        console.log('⚠️ Convertendo "cliente" para "paciente"');
      }

      console.log('📝📝📝 RESUMO FINAL ANTES DE SALVAR 📝📝📝');
      console.log('   tipoUsuario recebido do frontend:', tipoUsuario, '(tipo:', typeof tipoUsuario, ')');
      console.log('   tipoUsuario === "profissional":', tipoUsuario === 'profissional');
      console.log('   tipoUsuarioFinal que será salvo no banco:', tipoUsuarioFinal);
      console.log('   Validação final: tipoUsuarioFinal === "profissional"?', tipoUsuarioFinal === 'profissional');
      
      if (tipoUsuario === 'profissional' && tipoUsuarioFinal !== 'profissional') {
        console.error('❌❌❌ ERRO CRÍTICO: tipoUsuario é "profissional" mas tipoUsuarioFinal não é! ❌❌❌');
        tipoUsuarioFinal = 'profissional';
        console.log('🔧 CORRIGINDO: Forçando tipoUsuarioFinal para "profissional"');
      }

      let query = 'INSERT INTO usuario (nome, sobrenome, telefone, email, senha';
      let values = [nome, sobrenome, telefone, email, hashedPassword];
      let placeholders = '?, ?, ?, ?, ?';

      query += ', tipoUsuario';
      placeholders += ', ?';
      
      if (tipoUsuario === 'profissional' && tipoUsuarioFinal !== 'profissional') {
        console.error('❌ ERRO: tipoUsuarioFinal não é "profissional" mas deveria ser! Forçando...');
        tipoUsuarioFinal = 'profissional';
      }
      
      values.push(tipoUsuarioFinal);
      console.log('🔒 VALIDAÇÃO FINAL: tipoUsuarioFinal sendo inserido:', tipoUsuarioFinal);

      if (tipoUsuarioFinal === 'profissional') {
        if (!tipoProfissional) {
          return res.status(400).json({ error: 'Tipo de profissional é obrigatório quando há campos de profissional.' });
        }
        
        query += ', tipoProfissional';
        placeholders += ', ?';

        const tipoProfissionalFinal = tipoProfissional === 'medico' 
          ? especialidadeMedica 
          : (tipoProfissional === 'outros' ? profissaoCustomizada : tipoProfissional);
        values.push(tipoProfissionalFinal);

        query += ', numeroConselho';
        placeholders += ', ?';
        values.push(numeroConselho ? numeroConselho.trim() : '');

        query += ', ufRegiao';
        placeholders += ', ?';
        values.push(ufRegiao ? ufRegiao.trim() : '');

        if (latitude && longitude) {
          query += ', latitude, longitude';
          placeholders += ', ?, ?';
          values.push(latitude, longitude);
        }

        if (cidade) {
          query += ', cidade';
          placeholders += ', ?';
          values.push(cidade.trim());
        }
      }

      query += `) VALUES (${placeholders})`;

      console.log('=== EXECUTANDO QUERY ===');
      console.log('Query:', query);
      console.log('Values:', values);

      db.query(query, values, async (err, results) => {
        if (err) {
          console.error('=== ERRO AO REGISTRAR ===');
          console.error('Erro completo:', err);
          console.error('Código do erro:', err.code);
          console.error('Mensagem do erro:', err.sqlMessage);
          if (err.code === 'ER_DUP_ENTRY') {
            if (err.sqlMessage && err.sqlMessage.includes('email')) {
              return res.status(400).json({ error: 'Este e-mail já está cadastrado. Por favor, use outro e-mail ou faça login.' });
            }
            return res.status(400).json({ error: 'Já existe um registro com estes dados. Por favor, verifique as informações.' });
          }
          if (err.code === 'ER_BAD_FIELD_ERROR') {
            console.log('⚠️ Colunas não existem, inserindo com campos básicos mas mantendo tipoUsuario...');
            console.log('tipoUsuarioFinal que será salvo no fallback:', tipoUsuarioFinal);
            db.query(
              'INSERT INTO usuario (nome, sobrenome, telefone, email, senha, tipoUsuario) VALUES (?, ?, ?, ?, ?, ?)',
              [nome, sobrenome, telefone, email, hashedPassword, tipoUsuarioFinal],
              (err2, results2) => {
                if (err2) {
                  console.error('Erro ao registrar (fallback):', err2);
                  if (err2.code === 'ER_DUP_ENTRY' && err2.sqlMessage && err2.sqlMessage.includes('email')) {
                    return res.status(400).json({ error: 'Este e-mail já está cadastrado. Por favor, use outro e-mail ou faça login.' });
                  }
                  return res.status(400).json({ error: `Erro ao registrar: ${err2.sqlMessage}` });
                }
                console.log('✅ Usuário registrado com sucesso (fallback) - tipoUsuario:', tipoUsuarioFinal);
                console.log('ID inserido:', results2.insertId);
                res.json({ message: 'Usuário registrado com sucesso!', id: results2.insertId });
              }
            );
          } else {
            return res.status(400).json({ error: `Erro ao registrar: ${err.sqlMessage}` });
          }
        } else {
          const userId = results.insertId;
          console.log('=== USUÁRIO CRIADO COM SUCESSO ===');
          console.log('ID do usuário criado:', userId);
          console.log('Resultados:', results);
          
          res.json({ message: 'Usuário registrado com sucesso!', id: userId });
        }
      });
    } catch (error) {
      console.error('Erro no servidor:', error);
      res.status(500).json({ error: 'Erro interno do servidor' });
    }
  });


app.post('/login', (req, res) => {
  const { email, senha } = req.body;
  db.query('SELECT * FROM usuario WHERE email = ?', [email], async (err, results) => {
    if (err || results.length === 0) return res.status(400).json({ error: 'Usuário não encontrado' });

    const user = results[0];
    const senhaCorreta = await bcrypt.compare(senha, user.senha);

    if (!senhaCorreta) return res.status(401).json({ error: 'Senha incorreta' });

    const token = jwt.sign({ id: user.id }, 'secreto', { expiresIn: '1h' });

    let tipoUsuario = user.tipoUsuario || 'paciente';
    
    if (tipoUsuario !== 'profissional' && (user.tipoProfissional || user.numeroConselho || user.ufRegiao)) {
      tipoUsuario = 'profissional';
      console.log(`Corrigindo tipoUsuario para 'profissional' para o usuário ${user.id} (tem campos de profissional)`);
    }

    const userResponse = { 
      id: user.id, 
      nome: user.nome, 
      sobrenome: user.sobrenome, 
      telefone: user.telefone,
      email: user.email,
      tipoUsuario: tipoUsuario
    };

    console.log('=== LOGIN ===');
    console.log('User do banco:', { id: user.id, email: user.email, tipoUsuario: user.tipoUsuario, temProfissional: !!(user.tipoProfissional || user.numeroConselho || user.ufRegiao) });
    console.log('User retornado:', userResponse);

    res.json({ 
      token, 
      user: userResponse
    });
  });
})

app.get('/user/:id', (req, res) => {
  const { id } = req.params;
  db.query('SELECT id, nome, email, tipoUsuario FROM usuario WHERE id = ?', [id], (err, results) => {
    if (err || results.length === 0) return res.status(404).json({ error: 'Usuário não encontrado' });
    res.json(results[0]);
  });
});

app.post('/reservas', async (req, res) => {
    console.log(req.body); 
  
    const { nome, sobrenome, telefone, email, dia, horario, horarioFinal, qntd_pessoa, usuario_id, nomeProfissional } = req.body;

    let profissional_id = null;
    
    if (nomeProfissional) {
      try {
        const partes = nomeProfissional.trim().split(' ');
        const nomeProf = partes[0] || '';
        const sobrenomeProf = partes.slice(1).join(' ') || '';
        
        console.log('Buscando profissional:', { nomeProfissional, nomeProf, sobrenomeProf });
        
        const profissionalQuery = 'SELECT id FROM usuario WHERE nome = ? AND sobrenome = ? AND tipoUsuario = ? LIMIT 1';
        const profResults = await new Promise((resolve, reject) => {
          db.query(profissionalQuery, [nomeProf, sobrenomeProf, 'profissional'], (err, results) => {
            if (err) reject(err);
            else resolve(results);
          });
        });
        
        if (profResults.length > 0) {
          profissional_id = profResults[0].id;
          console.log('Profissional encontrado com ID:', profissional_id);
        } else {
          console.log('Profissional não encontrado no banco de dados');
        }
      } catch (err) {
        console.error('Erro ao buscar profissional:', err);
      }
    }
    
    console.log('Criando reserva com profissional_id:', profissional_id);
    const sql = 'INSERT INTO reservas (nome, sobrenome, telefone, email, dia, horario, horarioFinal, qntd_pessoa, usuario_id, profissional_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)';
    db.query(sql, [nome, sobrenome, telefone, email, dia, horario, horarioFinal, qntd_pessoa, usuario_id, profissional_id], (err, result) => {
        if (err) {
            console.error('Erro ao inserir no banco de dados:', err);
            return res.status(500).json({ error: 'Erro ao processar a reserva.' });
        }
        console.log('Reserva criada com sucesso, ID:', result.insertId, 'profissional_id:', profissional_id);
        res.json({ success: true, id: result.insertId });
    });
});

  
  app.get('/reservas/:id', (req, res) => {
    const userId = req.params.id;
    db.query('SELECT * FROM reservas WHERE usuario_id = ?', [userId], (err, results) => {
        if (err) return res.status(500).json(err);
        res.json(results);
    });
});
  
  app.delete('/reservas', (req, res) => {
    const { usuario, horario, dia } = req.body;  

    console.error('Usuário:', usuario, 'Horário:', horario, 'Dia:', dia);

    if (!usuario || !horario || !dia) {
        return res.status(400).json({ error: 'Usuário, horário e dia são obrigatórios.' });
    }

    const query = 'DELETE FROM reservas WHERE usuario_id = ? AND horario = ? AND dia = ?';

    db.query(query, [usuario, horario, dia], (err, result) => {
        if (err) {
            console.error('Erro ao remover a reserva:', err);
            return res.status(500).json({ error: 'Erro ao remover a reserva.' });
        }

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Nenhuma reserva encontrada para este usuário, horário e dia.' });
        }

        res.status(200).json({ message: 'Reserva removida com sucesso.' });
    });
});

app.get('/reservas', (req, res) => {
    const { profissional_id, usuario_id } = req.query;
    
    console.log('=== GET /reservas ===');
    console.log('Query params recebidos:', { profissional_id, usuario_id });
    console.log('req.query completo:', req.query);
    
    let query = 'SELECT * FROM reservas';
    let queryParams = [];
    let whereConditions = [];
    
    if (profissional_id) {
      whereConditions.push('profissional_id = ?');
      queryParams.push(profissional_id);
    }
    
    if (usuario_id) {
      if (profissional_id) {
        whereConditions.push('usuario_id = ?');
        queryParams.push(usuario_id);
      } else {
        whereConditions.push('(usuario_id = ? AND (profissional_id IS NULL OR profissional_id = ?))');
        queryParams.push(usuario_id, usuario_id);
      }
    }
    
    if (whereConditions.length > 0) {
      query += ' WHERE ' + whereConditions.join(' AND ');
    }
    
    console.log('Query SQL final:', query);
    console.log('Parâmetros:', queryParams);
    
    if (usuario_id && profissional_id) {
      console.log(`Filtrando reservas por usuario_id: ${usuario_id} e profissional_id: ${profissional_id}`);
    } else if (profissional_id) {
      console.log('Filtrando reservas APENAS por profissional_id:', profissional_id);
    } else if (usuario_id) {
      console.log('Filtrando reservas por usuario_id:', usuario_id);
    } else {
      console.log('Buscando todas as reservas (sem filtro)');
    }
    
    db.query(query, queryParams, (err, results) => {
      if (err) {
        console.error('Erro ao buscar reservas:', err);
        return res.status(500).json(err);
      }
      console.log(`Retornando ${results.length} reservas`);
      if (profissional_id) {
        console.log('Reservas retornadas para profissional_id:', profissional_id);
        results.forEach((r, i) => {
          console.log(`Reserva ${i + 1}: id=${r.id}, profissional_id=${r.profissional_id}, usuario_id=${r.usuario_id}`);
        });
      }
      res.json(results);
    });
  });
  

  app.patch('/reservas/:id', (req, res) => {
    const agendamentoId = req.params.id;
    const { status } = req.body; 
    
    if (!status) {
      return res.status(400).json({ error: 'Status é obrigatório' });
    }
  
    const query = `UPDATE reservas SET status = ? WHERE id = ?`;
  
    db.query(query, [status, agendamentoId], (err, results) => {
      if (err) {
        return res.status(500).json({ error: 'Erro ao atualizar o status', details: err });
      }
  
      if (results.affectedRows === 0) {
        return res.status(404).json({ message: 'Reserva não encontrada' });
      }
  
      res.status(200).json({ message: `Status atualizado com sucesso para ${status}` });
    });
  });
  
  app.put('/reservas/:id', async (req, res) => {
    const { id } = req.params; 
    const { dia, horario, qntd_pessoa } = req.body; 
  
    try {
      const [reservas] = await dbPromise.query('SELECT * FROM reservas WHERE id = ?', [id]);
  
      if (reservas.length === 0) {
        return res.status(404).json({ error: 'Reserva não encontrada' });
      }
  
      const [result] = await dbPromise.query(
        'UPDATE reservas SET dia = ?, horario = ?, qntd_pessoa = ? WHERE id = ?',
        [dia, horario, qntd_pessoa, id]
      );
  
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: 'Reserva não encontrada ou nenhum dado alterado' });
      }
  
      res.status(200).json({ message: 'Reserva atualizada com sucesso!' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Erro ao atualizar a reserva' });
    }
  });
  

  app.delete('/reservas/:id', (req, res) => {
    const { id } = req.params;
  
    const sql = 'DELETE FROM reservas WHERE id = ?';
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Erro ao excluir reserva:', err);
        return res.status(500).json({ error: 'Erro ao excluir reserva' });
      }
      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Reserva não encontrada ou não pertence a este usuário' });
      }
      res.json({ message: 'Reserva removida com sucesso!' });
    });
  });

  app.put('/reservas/solicitar/:id', (req, res) => {
    const reservaId = req.params.id;
    const { motivoFalta } = req.body; 
    const novoStatus = 'ausente';

    const sql = 'UPDATE reservas SET status = ?, motivoFalta = ? WHERE id = ?';
    db.query(sql, [novoStatus, motivoFalta, reservaId], (err, result) => {
        if (err) {
            console.error('Erro ao atualizar status:', err);
            return res.status(500).json({ success: false, message: 'Erro ao atualizar status' });
        }

        if (result.affectedRows > 0) {
            res.json({ success: true, message: 'Status atualizado para ausente e motivo registrado' });
        } else {
            res.status(404).json({ success: false, message: 'Reserva não encontrada' });
        }
    });
});

  

app.get('/reservas/extra', (req, res) => {
    const query = `
        SELECT 
            reservas.id, 
            reservas.dia, 
            reservas.horario, 
            usuario.nome, 
            usuario.sobrenome, 
            usuario.email 
        FROM reservas
        JOIN usuario ON reservas.usuario_id = usuario.id
    `;

    db.query(query, (err, results) => {
        if (err) {
            console.error('Erro ao buscar reservas:', err);
            return res.status(500).json({ error: 'Erro interno do servidor' });
        }
        res.json(results);
    });
});

app.patch('/reservas/negado/:id', async (req, res) => {
    const { status, motivoNegacao } = req.body;
    const reservaId = req.params.id;
    console.log(req.body, req.params.id);

    let sql = `UPDATE reservas SET status = ? ${status === 'negado' ? ', motivoNegacao = ?' : ', motivoNegacao = NULL'} WHERE id = ?`;
    let params = status === 'negado' ? [status, motivoNegacao, reservaId] : [status, reservaId];

    db.query(sql, params, (err) => {
        if (err) {
            console.error("Erro ao atualizar reserva:", err);
            return res.status(500).json({ error: "Erro ao atualizar reserva" });
        }
        res.json({ message: "Reserva atualizada com sucesso!" });
    });
});

app.patch('/reservas/editar/:id', async (req, res) => {
    const { id } = req.params;
    const { dia, horario, horarioFinal, qntd_pessoa } = req.body;

    try {
        await dbPromise.query(
            'UPDATE reservas SET dia = ?, horario = ?, horarioFinal = ?, qntd_pessoa = ?, status = ? WHERE id = ?',
            [dia, horario, horarioFinal, qntd_pessoa, 'pendente', id]
        );
        res.status(200).json({ message: 'Reserva editada e aguardando confirmação do professor!' });
    } catch (error) {
        console.error('Erro ao atualizar reserva:', error);
        res.status(500).json({ error: 'Erro ao atualizar reserva' });
    }
});

app.get('/usuarios/logados', (req, res) => {
  const query = `
    SELECT DISTINCT 
      u.id, 
      u.nome, 
      u.sobrenome, 
      u.telefone, 
      u.email 
    FROM usuario u
    INNER JOIN reservas r ON u.id = r.usuario_id
    ORDER BY u.nome ASC;
  `;

  db.query(query, (err, results) => {
    if (err) {
      console.error(err);
      return res.status(500).send('Erro ao buscar usuários logados');
    }

    res.json(results);
  });
});

app.get('/usuarios/solicitarDados/:id', (req, res) => {
  const userId = req.params.id; 
  console.log('ID do usuário recebido:', userId); 

  const query = 'SELECT id, nome, sobrenome, email, telefone, latitude, longitude, cidade, ufRegiao FROM usuario WHERE id = ?';
  
  db.query(query, [userId], (err, results) => {
    if (err) {
      console.error('Erro ao buscar usuário logado pelo ID:', err);
      return res.status(500).send('Erro ao buscar dados do usuário logado');
    }

    if (results.length === 0) {
      return res.status(404).send('Usuário não encontrado ou não está logado');
    }

    res.json(results[0]); 
  });
});

app.patch('/usuarios/:id/tipoUsuario', (req, res) => {
  const userId = req.params.id;
  let { tipoUsuario } = req.body;

  if (!tipoUsuario || !['paciente', 'profissional', 'cliente'].includes(tipoUsuario)) {
    return res.status(400).json({ error: 'tipoUsuario inválido. Deve ser: paciente ou profissional.' });
  }

  if (tipoUsuario === 'cliente') {
    tipoUsuario = 'paciente';
    console.log('Convertendo "cliente" para "paciente" no PATCH');
  }

  const query = 'UPDATE usuario SET tipoUsuario = ? WHERE id = ?';

  db.query(query, [tipoUsuario, userId], (err, results) => {
    if (err) {
      console.error('Erro ao atualizar tipoUsuario:', err);
      return res.status(500).json({ error: 'Erro ao atualizar tipoUsuario.' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    console.log(`tipoUsuario atualizado para ${tipoUsuario} para o usuário ${userId}`);
    res.json({ success: true, message: 'tipoUsuario atualizado com sucesso!' });
  });
});

app.patch('/usuarios/:id/localizacao', (req, res) => {
  const userId = req.params.id;
  const { latitude, longitude, cidade, ufRegiao } = req.body;

  if (!latitude || !longitude) {
    return res.status(400).json({ error: 'Latitude e longitude são obrigatórios.' });
  }

  let query = 'UPDATE usuario SET latitude = ?, longitude = ?';
  let values = [latitude, longitude];

  if (cidade) {
    query += ', cidade = ?';
    values.push(cidade.trim());
  }

  if (ufRegiao) {
    query += ', ufRegiao = ?';
    values.push(ufRegiao.trim());
  }

  query += ' WHERE id = ?';
  values.push(userId);

  db.query(query, values, (err, results) => {
    if (err) {
      console.error('Erro ao atualizar localização:', err);
      return res.status(500).json({ error: 'Erro ao atualizar localização.' });
    }

    if (results.affectedRows === 0) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    res.json({ success: true, message: 'Localização atualizada com sucesso!' });
  });
});

app.get('/profissionais', (req, res) => {
  const query = `
    SELECT 
      u.id,
      u.nome,
      u.sobrenome,
      CONCAT(u.nome, ' ', u.sobrenome) as nomeCompleto,
      u.tipoProfissional,
      u.email,
      u.telefone
    FROM usuario u
    WHERE u.tipoUsuario = 'profissional' 
      AND (u.empresa_id IS NULL OR u.empresa_id = 0)
    ORDER BY u.nome ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar profissionais:', err);
      return res.status(500).json({ error: 'Erro ao buscar profissionais' });
    }
    res.json(results);
  });
});

app.get('/profissionais/:categoria', (req, res) => {
  const { categoria } = req.params;
  const categoriasValidas = ['medico', 'dentista', 'nutricionista', 'fisioterapeuta', 'fonoaudiologo'];
  
  if (!categoriasValidas.includes(categoria)) {
    return res.status(400).json({ error: 'Categoria inválida' });
  }

  let query;
  let queryParams;
  
  if (categoria === 'medico') {
    const especialidadesMedicas = [
      'Clínico Geral', 'Oftalmologista', 'Cardiologista', 'Dermatologista', 
      'Pediatra', 'Ginecologista', 'Ortopedista', 'Neurologista', 'Psiquiatra',
      'Endocrinologista', 'Gastroenterologista', 'Urologista', 'Otorrinolaringologista',
      'Pneumologista', 'Reumatologista', 'Oncologista', 'Hematologista', 'Nefrologista',
      'Anestesiologista', 'Radiologista', 'Patologista', 'Medicina do Trabalho',
      'Medicina Esportiva', 'Geriatra', 'Mastologista', 'Proctologista', 'Angiologista',
      'Cirurgião Geral', 'Cirurgião Plástico', 'Cirurgião Cardiovascular', 'Neurocirurgião',
      'Cirurgião Pediátrico'
    ];
    
    const placeholders = especialidadesMedicas.map(() => '?').join(', ');
    
    query = `
      SELECT 
        u.id,
        CONCAT(u.nome, ' ', u.sobrenome) as nomeCompleto,
        u.tipoProfissional,
        u.email,
        u.telefone,
        u.ufRegiao
      FROM usuario u
      WHERE u.tipoUsuario = 'profissional' 
        AND u.tipoProfissional IN (${placeholders})
        AND (u.empresa_id IS NULL OR u.empresa_id = 0)
      ORDER BY u.nome ASC
    `;
    queryParams = especialidadesMedicas;
  } else {
    query = `
      SELECT 
        u.id,
        CONCAT(u.nome, ' ', u.sobrenome) as nomeCompleto,
        u.tipoProfissional,
        u.email,
        u.telefone,
        u.ufRegiao
      FROM usuario u
      WHERE u.tipoUsuario = 'profissional' 
        AND LOWER(u.tipoProfissional) = ?
        AND (u.empresa_id IS NULL OR u.empresa_id = 0)
      ORDER BY u.nome ASC
    `;
    queryParams = [categoria];
  }
  
  db.query(query, queryParams, (err, results) => {
    if (err) {
      console.error(`Erro ao buscar ${categoria}:`, err);
      return res.status(500).json({ error: `Erro ao buscar ${categoria}` });
    }
    res.json(results);
  });
});

app.get('/empresas', (req, res) => {
  const query = `
    SELECT 
      e.id,
      e.nome as nomeEmpresa,
      COUNT(DISTINCT u.id) as quantidadeProfissionais,
      GROUP_CONCAT(DISTINCT CONCAT(u.nome, ' ', u.sobrenome) SEPARATOR ', ') as nomesProfissionais,
      GROUP_CONCAT(DISTINCT u.tipoProfissional) as tiposProfissionais
    FROM empresas e
    LEFT JOIN usuario u ON u.empresa_id = e.id
    GROUP BY e.id, e.nome
    ORDER BY e.nome ASC
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      console.error('Erro ao buscar empresas:', err);
      const fallbackQuery = `
        SELECT DISTINCT nomeEmpresa, 
               COUNT(*) as quantidadeProfissionais,
               GROUP_CONCAT(DISTINCT tipoProfissional) as tiposProfissionais
        FROM usuario 
        WHERE fazParteEmpresa = 1 AND nomeEmpresa IS NOT NULL AND nomeEmpresa != ''
        GROUP BY nomeEmpresa
        ORDER BY nomeEmpresa ASC
      `;
      
      db.query(fallbackQuery, (err2, results2) => {
        if (err2) {
          return res.status(500).json({ error: 'Erro ao buscar empresas' });
        }
        res.json(results2);
      });
    } else {
      res.json(results);
    }
  });
});

app.post('/api/forgot-password', (req, res) => {
  const { email } = req.body;

  db.query('SELECT id FROM usuario WHERE email = ?', [email], (err, results) => {
    if (err || results.length === 0) {
      return res.status(400).json({ error: 'Usuário não encontrado.' });
    }

    const userId = results[0].id; 
    res.json({ userId }); 
  });
});

app.patch('/api/reset-password/:id', async (req, res) => {
  const { id } = req.params; 
  const { senha } = req.body; 

  try {
    const hashedPassword = await bcrypt.hash(senha, 10);

    const query = 'UPDATE usuario SET senha = ? WHERE id = ?';

    db.query(query, [hashedPassword, id], (err, result) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao atualizar a senha.' });
      }

      if (result.affectedRows === 0) {
        return res.status(404).json({ message: 'Usuário não encontrado.' });
      }

      return res.status(200).json({ message: 'Senha redefinida com sucesso.' });
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Erro ao processar a senha.' });
  }
});