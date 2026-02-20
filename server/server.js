import "dotenv/config";
import express from "express";
import cors from "cors";
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import listingRouter from "./routes/listingRoutes.js";
import chatRouter from "./routes/chatRoutes.js";

const app = express();

app.use(express.json());
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true,
}))
app.use(clerkMiddleware())


app.get("/", (req, res) => res.send("Server is live!"))
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/listing", listingRouter)
app.use("/api/chat", chatRouter)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => console.log(`Server running on port ${PORT}`))