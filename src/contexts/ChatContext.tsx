
import React, { createContext, useState, useCallback } from 'react';
import { ChatMessage, PoeAnalysisResult } from '@/types';
import { Chat } from '@google/genai';
import { createChat } from '@/services/geminiService';
import { logService } from '@/services/logService';

type ProactiveTopic = 'welcome' | 'gear' | 'tree' | 'gems' | 'flasks' | 'synergy' | 'defenses' | 'leveling' | 'lootFilter' | 'crafting' | 'simulations' | 'metagame' | 'improvements';


interface ChatContextType {
    chat: Chat | null;
    chatMessages: ChatMessage[];
    isChatLoading: boolean;
    promptSuggestions: string[];
    proactiveMessagesSent: Set<string>;

    initializeChat: (analysisResult: PoeAnalysisResult) => void;
    handleSendMessage: (message: string) => Promise<void>;
    sendProactiveChatMessage: (topic: ProactiveTopic) => void;
    resetChat: () => void;
}

export const ChatContext = createContext<ChatContextType | null>(null);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [chat, setChat] = useState<Chat | null>(null);
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [isChatLoading, setIsChatLoading] = useState<boolean>(false);
    const [promptSuggestions, setChatPromptSuggestions] = useState<string[]>([]);
    const [proactiveMessagesSent, setProactiveMessagesSent] = useState<Set<string>>(new Set());

    const resetChat = () => {
        setChat(null);
        setChatMessages([]);
        setChatPromptSuggestions([]);
        setProactiveMessagesSent(new Set());
    };

    const initializeChat = (analysisResult: PoeAnalysisResult) => {
        resetChat();
        const chatSession = createChat(analysisResult);
        setChat(chatSession);

        const suggestions: string[] = [];
        if (analysisResult.passiveTreeAnalysis.nodesToRespec.length > 0) suggestions.push("Explain the passive tree changes.");
        if (analysisResult.gearAnalysis.some(g => g.suggestions.length > 0)) suggestions.push(`Suggest a cheaper alternative for my ${analysisResult.gearAnalysis.find(g => g.suggestions.length > 0)?.slot}.`);
        suggestions.push("Best upgrade for survivability?");
        suggestions.push("Best value damage upgrade?");
        setChatPromptSuggestions(suggestions);
        
        // Use a timeout to send the welcome message after the main UI has rendered
        setTimeout(() => sendProactiveChatMessage('welcome'), 500);
    };
    
    const sendProactiveChatMessage = useCallback((topic: ProactiveTopic) => {
        if (proactiveMessagesSent.has(topic) || isChatLoading) return;

        const messages: Record<ProactiveTopic, string> = {
            welcome: "I've finished analyzing your build! You can see the results on the left. Feel free to ask me any questions you have about the suggestions.",
            gear: "I see you're looking at your gear. Is there a specific piece you'd like to discuss upgrading?",
            tree: "The passive tree can be complex. Would you like me to explain the reasoning behind any of the nodes I suggested changing?",
            gems: "Gem links are crucial. Let me know if you want to explore alternative support gems for any of your skills.",
            flasks: "Your flasks provide a huge amount of power and utility. Do you have any questions about my suggestions for them?",
            synergy: "This section highlights non-obvious interactions in your build. Let me know if any of them are unclear.",
            defenses: "This chart visualizes your defensive layers. Ask me 'how can I improve my spell suppression?' to get specific advice.",
            improvements: "This is your prioritized to-do list. Let me know if you'd like a more detailed breakdown of any of these points.",
            leveling: "A good leveling plan can make starting a new character much smoother. Any questions about the strategy?",
            lootFilter: "This custom loot filter should help you find upgrades faster. Ask me if you want to know how to add your own custom rules to it.",
            crafting: "Crafting can be intimidating, but it's the best way to get perfect gear. Curious about any of the steps I've outlined?",
            simulations: "These simulations look for more advanced optimization paths. Happy to explain the theory behind any of these suggestions.",
            metagame: "The meta is always shifting! Understanding these trends can help you make more currency and find powerful new strategies.",
        };
        const messageContent = messages[topic];
        if (messageContent) {
            setChatMessages(prev => [...prev, { role: 'model', content: messageContent }]);
            setProactiveMessagesSent(prev => new Set(prev).add(topic));
        }
    }, [proactiveMessagesSent, isChatLoading]);

    const handleSendMessage = useCallback(async (message: string) => {
        if (!chat) return;
        if (promptSuggestions.length > 0) setChatPromptSuggestions([]);
        setIsChatLoading(true);
        const userMessage: ChatMessage = { role: 'user', content: message };
        setChatMessages(prev => [...prev, userMessage, { role: 'model', content: '' }]);
        try {
            const stream = await chat.sendMessageStream({ message });
            let text = '';
            for await (const chunk of stream) {
                text += chunk.text;
                setChatMessages(prev => {
                    const newMessages = [...prev];
                    newMessages[newMessages.length - 1].content = text;
                    return newMessages;
                });
            }
        } catch (err) {
            logService.error("Failed to send chat message.", { error: err });
            setChatMessages(prev => {
                const newMessages = [...prev];
                newMessages[newMessages.length - 1].content = "Sorry, I encountered an error.";
                return newMessages;
            });
        } finally {
            setIsChatLoading(false);
        }
    }, [chat, promptSuggestions]);
    
    const value = {
        chat,
        chatMessages,
        isChatLoading,
        promptSuggestions,
        proactiveMessagesSent,
        initializeChat,
        handleSendMessage,
        sendProactiveChatMessage,
        resetChat,
    };

    return <ChatContext.Provider value={value}>{children}</ChatContext.Provider>;
};