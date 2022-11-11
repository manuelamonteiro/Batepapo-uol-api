import express from "express";
import cors from "cors";
import { MongoClient } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";

const app = express();

app.use(cors());
app.use(express.json());
dotenv.config();

const mongoClient = new MongoClient(process.env.MONGO_URI);

try {
    await mongoClient.connect();
    console.log("MongoDB connect!");
} catch (error) {
    console.log(error);
}

const db = mongoClient.db("batepapo-uol-api");
const collectionParticipants = db.collection("participants");
const collectionMessages = db.collection("messages");

app.post("/participants", async (req, res) => {
    const { name } = req.body;

    try {
        await collectionParticipants.insertOne({
            name: name,
            lastStatus: Date.now()
        });

        await collectionMessages.insertOne({
            from: name,
            to: "Todos",
            text: "status",
            type: "entra na sala...",
            time: dayjs().format("HH:MM:SS")
        });

        res.status(201).send("Participante criado com sucesso!");
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    }
});

app.get("/participants", async (req, res) => {

    try {
        const participants = await collectionParticipants.find().toArray()
        res.send(participants);
    } catch (error) {
        res.status(500).send(error);
    };

});

app.post("/messages", async (req, res) => {
    const { user } = req.headers;
    const { to, text, type } = req.body;

    try {
        await collectionMessages.insertOne({
            from: user,
            to: to,
            text: text,
            type: type,
            time: dayjs().format("HH:MM:SS")
        });
        res.status(201).send("Mensagem enviada com sucesso!");
    } catch (error) {
        console.log(error)
        res.status(500).send(error);
    };

});

app.get("/messages", async (req, res) => {
    const { limit } = req.query;
    const { user } = req.headers;

    try {
        const messages = await collectionMessages.find().toArray();

        if (limit <= 0) {
            res.send(messages);
        }

        if (limit > 0) {
            let lastsMessages = messages.slice(-limit);
            res.send(lastsMessages);
            return;
        }

    } catch (error) {
        res.status(500).send(error);
    };

});

app.post("/status", (req, res) => {
    const { user } = req.headers;

    res.status(200).send("Status do participante atualizado!");
});

app.listen(process.env.PORT, () => {
    console.log(`Server running in port: ${process.env.PORT}`);
});