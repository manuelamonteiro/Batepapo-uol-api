import express from "express";
import cors from "cors";
import { MongoClient, ObjectId } from "mongodb";
import dotenv from "dotenv";
import dayjs from "dayjs";
import joi, { date } from "joi";

const messageSchema = joi.object({
    to: joi.string().required().min(1),
    text: joi.string().required().min(1),
    type: joi.string().required().valid("message", "private_message")
});

const statusSchema = joi.object({
    name: joi.string().required().min(1)
})

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
    const validationStatus = statusSchema.validate(req.body);
    const isUser = (await collectionParticipants.find().toArray()).find((p) => p.name === name);

    if (validationStatus.error) {
        const error = validationStatus.error.details.map((detail) => detail.message);
        res.status(422).send(error);
        return;
    }

    if (isUser) {
        res.status(409).send("O usuário não consta na lista de participantes!");
        return;
    }

    try {
        await collectionParticipants.insertOne({
            name: name,
            lastStatus: Date.now()
        });

        await collectionMessages.insertOne({
            from: name,
            to: "Todos",
            text: "entra na sala...",
            type: "status",
            time: dayjs().format("HH:MM:SS")
        });

        res.status(201).send("Participante criado com sucesso!");
    } catch (error) {
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
    const validationMessage = messageSchema.validate(req.body);
    const isUser = (await collectionParticipants.find().toArray()).find((p) => p.name === user);

    if (validationMessage.error) {
        const error = validationMessage.error.details.map((detail) => detail.message);
        res.status(422).send(error);
        return;
    }

    if (!isUser) {
        res.status(422).send("O usuário não existe!");
        return;
    }

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
        res.status(500).send(error);
    };

});

app.get("/messages", async (req, res) => {
    const { limit } = req.query;
    const { user } = req.headers;

    try {
        const messages = await collectionMessages.find().toArray();

        const filtredMessages = messages.filter((message) => {
            if ((message.type === "private_message" && (message.to === user || message.from === user)) || message.type === "status" || message.type === "message") {
                return message;
            }
        });

        if (limit <= 0) {
            res.send(filtredMessages);
        };

        if (limit > 0) {
            const lastsMessages = filtredMessages.slice(-limit);
            res.send(lastsMessages);
            return;
        };
    } catch (error) {
        res.status(500).send(error);
    };

});

app.post("/status", async (req, res) => {
    const { user } = req.headers;
    const isUser = (await collectionParticipants.find().toArray()).find((p) => p.name === user);
    const idUser = isUser._id;

    if (!isUser) {
        res.status(404).send("O usuário não existe!");
        return;
    };

    try {
        await collectionParticipants.updateOne({ _id: idUser },
            { $set: { lastStatus: Date.Now() } });

        res.status(200).send("Status do participante atualizado!");
    } catch (error) {
        res.status(500).send(error);
    }

});

app.listen(process.env.PORT, () => {
    console.log(`Server running in port: ${process.env.PORT}`);
});