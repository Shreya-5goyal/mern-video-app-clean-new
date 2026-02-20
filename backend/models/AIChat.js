import mongoose from "mongoose";

const aiChatSchema = new mongoose.Schema({
    roomId: { type: String, required: true, index: true },
    userName: { type: String, required: true },
    messages: [
        {
            role: { type: String, enum: ["user", "assistant"], required: true },
            content: { type: String, required: true },
            timestamp: { type: Date, default: Date.now }
        }
    ]
}, { timestamps: true });

const AIChat = mongoose.model("AIChat", aiChatSchema);

export default AIChat;
