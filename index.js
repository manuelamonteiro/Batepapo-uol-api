import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";

const app = express();

app.use(cors());
app.use(express.json());
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);

let db;

mongoClient.connect().then(() => {
    db = mongoClient.db("batepapo-uol-api");
}).catch((error) => console.log(error));

app.post("/participants", async (req, res) => {
    const { name } = req.body;

    try {
        await db.collection("participants").insert({
            name: name,
            lastStatus: Date.now()
        });
        res.status(201).send("Participante criado com sucesso!");
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
});

app.get("/participants", async (req, res) => {

    try {
        const participants = await db.collection("participants").find().toArray()
        res.send(participants);
    } catch (error) {
        res.status(500).send(error);
    };

});

app.post("/messages", async (req, res) => {
    const { user } = req.headers;
    const { to, text, type } = req.body;

    try {
        await db.collection("messages").insert({
            from: user,
            to: to,
            text: text,
            type: type,
            time: 'HH:MM:SS'
        });
        res.status(201).send("Mensagem enviada com sucesso!");
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    };

});

app.get("/messages", async (req, res) => {
    const { user } = req.headers;

    try {
        const messages = await db.collection("messages").find().toArray()
        res.send(messages);
    } catch (error) {
        res.status(500).send(error);
    };

});

app.post("/status", (req, res) => {
});

app.listen(5000, () => {
    console.log("Server running in port: 5000");
});