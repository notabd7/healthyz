const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');

const app = express();
const port = 3000;

app.use(cors());
app.use(express.json());

const uri = "mongodb://localhost:27017";
const client = new MongoClient(uri);

async function connectToDatabase() {
    try {
        await client.connect();
        console.log("Connected to MongoDB");
    } catch (error) {
        console.error("Error connecting to MongoDB:", error);
    }
}

connectToDatabase();

app.post('/saveClientInfo', async (req, res) => {
    try {
        const { firstName } = req.body;
        const database = client.db("healthProfile");
        const clients = database.collection("clients");

        const result = await clients.insertOne({ firstName });

        if (result.acknowledged) {
            res.json({ success: true });
        } else {
            res.json({ success: false, error: "Failed to insert document" });
        }
    } catch (error) {
        console.error("Error saving client info:", error);
        res.json({ success: false, error: error.message });
    }
});

app.get('/getClientInfo', async (req, res) => {
    try {
        const database = client.db("healthProfile");
        const clients = database.collection("clients");

        const allClients = await clients.find({}).toArray();
        res.json({ success: true, clients: allClients });
    } catch (error) {
        console.error("Error retrieving client info:", error);
        res.json({ success: false, error: error.message });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});