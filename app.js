import express from "express";
import sql from 'mssql'
import z from 'zod'
import 'dotenv/config'
const app = express()
const config = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_DATABASE,
    options:{
        encrypt: true,
        trustServerCertificate: true 
    },
}

app.use(express.json())

async function connectToDatabase() {
    try {
        await sql.connect(config);
        console.log('Conectado ao SQL Server!');
    } catch (err) {
        console.error('Erro ao conectar ao SQL Server:', err);
    }
}

connectToDatabase().then(() => {
    app.listen(process.env.PORT, () => {
        console.log(`Servidor rodando em http://localhost:${process.env.PORT}`);
    });
});

const timeSchema = z.object({
    time: z.string().min(2).max(50),
    sigla: z.string().min(2).max(3),
    pontos: z.number().int(),
    jogos: z.number().int().nonnegative(),
    vitorias: z.number().int().nonnegative(),
    empates: z.number().int().nonnegative(),
    derrotas: z.number().int().nonnegative(),
    gols_pro: z.number().int().nonnegative(),
    gols_contra: z.number().int().nonnegative(),
    posicao: z.number().int().min(1).max(20)
});

const timeSchemaUpdate = z.object({
    time: z.string().min(2).max(50).optional(),
    sigla: z.string().min(2).max(3).optional(),
    pontos: z.number().int().optional(),
    jogos: z.number().int().nonnegative().optional(),
    vitorias: z.number().int().nonnegative().optional(),
    empates: z.number().int().nonnegative().optional(),
    derrotas: z.number().int().nonnegative().optional(),
    gols_pro: z.number().int().nonnegative().optional(),
    gols_contra: z.number().int().nonnegative().optional(),
    posicao: z.number().int().min(1).max(20).optional()
});


const validarTime = (req,res,next) => {
    const resultado = timeSchema.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({ error: resultado.error.errors });
    }

    next();
}

const validarUpdate = (req,res,next) => {
    const resultado = timeSchemaUpdate.safeParse(req.body);

    if (!resultado.success) {
        return res.status(400).json({ error: resultado.error.errors });
    }

    next();
}



const filtroSchema = z.object({
    minPontos: z.coerce.number().min(0).optional(),
    maxPontos: z.coerce.number().min(0).optional(),
    minPosicao: z.coerce.number().min(1).optional(), 
    maxPosicao: z.coerce.number().min(1).max(20).optional() 
});

const validarFiltros = (req, res, next) => {
    const resultado = filtroSchema.safeParse(req.query);

    if (!resultado.success) {
        return res.status(400).json({ error: resultado.error.errors });
    }

    req.query = resultado.data; 
    next();
};

app.get('/', async (req, res) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const offset = (page - 1) * limit;

    try {
        const result = await sql.query(`
            SELECT time, sigla, posicao, pontos, jogos, vitorias, empates, derrotas, gols_pro, gols_contra, saldo_gols
            FROM Classificacao
            ORDER BY posicao
            OFFSET ${offset} ROWS
            FETCH NEXT ${limit} ROWS ONLY
        `);

        res.status(200).send(result.recordset);
    } catch (err) {
        res.status(500).json({ error: "Erro ao consultar dados" });
    }
});



app.get('/times/:sigla', async (req, res) => {
    try {
        const sigla = req.params.sigla.toUpperCase();
        const request = new sql.Request();
        request.input('sigla', sql.VarChar, sigla);         
        const result = await request.query('SELECT time, sigla, posicao, pontos, jogos, vitorias, empates, derrotas, gols_pro, gols_contra, saldo_gols FROM Classificacao WHERE sigla = @sigla ORDER BY posicao');
        if(result.recordset.length === 0){
            return res.status(404).json({error: "A sigla fornecida não existe!"})
        }
        res.status(200).json(result.recordset);
    } catch(err) {
        console.log("Ocorreu um erro " + err);
        res.status(400).json({error: 'Erro interno no servidor'});
    }
});



app.post('/times/adicionar', validarTime, async(req,res)=>{
    try{
        const {
            time, sigla, pontos, jogos, vitorias, empates, derrotas,
            gols_pro, gols_contra, posicao
        } = req.body;

        const request = new sql.Request();
        request.input('time', sql.VarChar, time);
        request.input('sigla', sql.VarChar, sigla);
        request.input('pontos', sql.Int, pontos);
        request.input('jogos', sql.Int, jogos);
        request.input('vitorias', sql.Int, vitorias);
        request.input('empates', sql.Int, empates);
        request.input('derrotas', sql.Int, derrotas);
        request.input('gols_pro', sql.Int, gols_pro);
        request.input('gols_contra', sql.Int, gols_contra);
        request.input('posicao', sql.Int, posicao);

        await request.query(`
            INSERT INTO Classificacao (time, sigla, pontos, jogos, vitorias, empates, derrotas, gols_pro, gols_contra, posicao)
            VALUES (@time, @sigla, @pontos, @jogos, @vitorias, @empates, @derrotas, @gols_pro, @gols_contra, @posicao)
        `);

        res.status(201).json({ message: 'Time inserido com sucesso!' });
    }
    catch(err) {
        console.log("Ocorreu um erro " + err);
        res.status(400).json({error: "Ocorreu um erro interno no servidor"})
    }
})


app.put('/:sigla', validarUpdate, async(req,res)=>{
    try{
        
        const siglaParam = req.params.sigla

        const request = new sql.Request();
        request.input('siglaParam', sql.VarChar, siglaParam);

        const checkResult = await request.query('SELECT * FROM Classificacao WHERE sigla = @siglaParam');
        if (checkResult.recordset.length === 0) {
            return res.status(404).send({ message: "Time não encontrado!" });
        }
        if (!req.body || Object.keys(req.body).length === 0) {
            return res.status(400).send({ message: "Não podem enviar dados vazios!" });
        }
        const currentData = checkResult.recordset[0];

        
        const {
            time = currentData.time,
            sigla = currentData.sigla,            
            pontos = currentData.pontos,
            jogos = currentData.jogos,
            vitorias = currentData.vitorias,
            empates = currentData.empates,
            derrotas = currentData.derrotas,
            gols_pro = currentData.gols_pro,
            gols_contra = currentData.gols_contra,
            posicao = currentData.posicao
        } = req.body;

        request.input('time', sql.Char, time)
        request.input('sigla', sql.Char, sigla)
        request.input('pontos', sql.Int, pontos);
        request.input('jogos', sql.Int, jogos);
        request.input('vitorias', sql.Int, vitorias);
        request.input('empates', sql.Int, empates);
        request.input('derrotas', sql.Int, derrotas);
        request.input('gols_pro', sql.Int, gols_pro);
        request.input('gols_contra', sql.Int, gols_contra);
        request.input('posicao', sql.Int, posicao);

        
        await request.query(`
            UPDATE Classificacao 
            SET time = @time, pontos = @pontos, jogos = @jogos, vitorias = @vitorias, empates = @empates, derrotas = @derrotas, gols_pro = @gols_pro, gols_contra = @gols_contra, posicao = @posicao
            WHERE sigla = @sigla
        `);

        res.status(200).send({ message: "Time atualizado com sucesso!" });

    }
    catch(err){
        console.log("Ocorreu um erro " + err);
        res.status(400).json({error: "Ocorreu um erro interno no servidor"})
    }
})

app.delete('/:sigla', async (req, res) => {
    try {
        const { sigla } = req.params;
        const request = new sql.Request();
        request.input('sigla', sql.VarChar, sigla);

       
        const result = await request.query('DELETE FROM Classificacao WHERE sigla = @sigla');

        if (result.rowsAffected[0] === 0) {
            return res.status(404).send({ message: "Time não encontrado!" });
        }

        res.status(200).send({ message: "Time deletado com sucesso!" });

    } catch (err) {
        console.error("Erro ao deletar time: " + err);
        res.status(500).send({ message: "Erro interno no servidor!" });
    }
});


app.get('/tabela/filtro', validarFiltros, async (req,res)=>{
    try {
        const { minPontos, maxPontos, minPosicao, maxPosicao } = req.query;


        let query = 'SELECT  posicao, sigla, time, pontos, vitorias, empates, derrotas, gols_pro, gols_contra, saldo_gols FROM Classificacao WHERE 1=1';
        const request = new sql.Request();


        if (minPontos) {
            query += ' AND pontos >= @minPontos';
            request.input('minPontos', sql.Int, minPontos);
        }
        if (maxPontos) {
            query += ' AND pontos <= @maxPontos';
            request.input('maxPontos', sql.Int, maxPontos);
        }
        if (minPosicao) {
            query += ' AND posicao >= @minPosicao';
            request.input('minPosicao', sql.Int, minPosicao);
        }
        if (maxPosicao) {
            query += ' AND posicao <= @maxPosicao';
            request.input('maxPosicao', sql.Int, maxPosicao);
        }


        query += ` ORDER BY posicao`

        const result = await request.query(query);
        
        if(result.recordset.length === 0){
            res.status(400).json({message: "Não existem times que atendam o filtro solicitado!"})
            return
        }
        
        res.status(200).json(result.recordset);


    } catch (err) {
        console.error("Erro ao filtrar: " + err);
        res.status(500).json({ error: "Erro interno no servidor" });
    }
})