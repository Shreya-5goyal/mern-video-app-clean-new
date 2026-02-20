/**
 * AI Service for the chat bot
 */
export const getAIResponse = async (userMessage) => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));

    const msg = userMessage.toLowerCase();

    if (msg.includes('hello') || msg.includes('hi')) {
        return "Hello! I'm your AI session assistant. How can I help you today?";
    }

    if (msg.includes('summary') || msg.includes('summarize')) {
        return "I'm currently tracking the meeting. I can provide a full summary and emotion analytics once the call ends!";
    }

    if (msg.includes('filter') || msg.includes('avatar')) {
        return "You can change your look using the 🎭 and 🪄 buttons in the control bar!";
    }

    if (msg.includes('weather')) {
        return "I don't have live weather access, but I can tell you the vibe in this room is definitely positive! 😊";
    }

    if (msg.includes('help')) {
        return "I can help with summaries, meeting tips, emotion tracking, and navigation. Just ask!";
    }

    // Default smart-ish responses
    const fallbacks = [
        "That's an interesting point! I'm analyzing the context of our discussion.",
        "I've noted that. Is there anything specific you'd like me to look into?",
        "I'm here to ensure this meeting goes smoothly. Let me know if you need any data.",
        "Interesting! I'm processing your request. Meanwhile, do you want to see your attention stats?"
    ];

    return fallbacks[Math.floor(Math.random() * fallbacks.length)];
};
