import OpenAI from "openai";
import AIChat from "../models/AIChat.js";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export const handleAIChat = async (req, res) => {
    const { roomId, userName, message } = req.body;

    if (!message) {
        return res.status(400).json({ error: "Message is required" });
    }

    try {
        // 1. Get or create history for this user in this room
        let chat = await AIChat.findOne({ roomId, userName });

        if (!chat) {
            chat = new AIChat({
                roomId,
                userName,
                messages: [
                    { role: "assistant", content: `Hello ${userName}! I'm your AI assistant for this video call. How can I help you today?` }
                ]
            });
            await chat.save();
        }

        // 2. Add user message
        chat.messages.push({ role: "user", content: message });

        // 3. Prepare messages for OpenAI
        const apiMessages = [
            {
                role: "system",
                content: "You are a helpful AI assistant inside a video calling application. Help users with FAQs about the app, provide technical support during calls, and assist them with any questions. Be concise and professional."
            },
            ...chat.messages.map(m => ({ role: m.role, content: m.content }))
        ];

        // 4. Call OpenAI
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // or gpt-4-turbo
            messages: apiMessages,
            max_tokens: 500,
        });

        const reply = response.choices[0].message.content;

        // 5. Save assistant reply
        chat.messages.push({ role: "assistant", content: reply });
        await chat.save();

        res.json({ reply, history: chat.messages });

    } catch (error) {
        console.error("AI Chat Error:", error);
        res.status(500).json({ error: "Failed to process AI request. Make sure OPENAI_API_KEY is configured." });
    }
};

export const getAIHistory = async (req, res) => {
    const { roomId, userName } = req.query;
    try {
        const chat = await AIChat.findOne({ roomId, userName });
        res.json(chat ? chat.messages : []);
    } catch (error) {
        res.status(500).json({ error: "Failed to fetch AI history" });
    }
};
