import { MongoClient } from "mongodb";
import dotenv from "dotenv";
dotenv.config();

const connectionString = process.env.CONNECTION_URL || "";
const client = new MongoClient(connectionString);

await client.connect(); // ✅ top-level await
console.log("✅ Connected to MongoDB");

const db = client.db("IdeaDatabase");

export default db; // ✅ now this is a fully connected DB object
