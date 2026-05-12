import React, { useState, useRef, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Send, Sprout, User } from 'lucide-react';
import { GoogleGenAI } from '@google/genai';
import { ChatMessage } from '../types';
import { chatWithAI } from '../services/aiService';

interface ChatPanelProps {
  ai: GoogleGenAI;
  globalContext: string;
  initialMessage?: string;
}

const ChatPanel: React.FC<ChatPanelProps> = ({ ai, globalContext, initialMessage }) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'welcome',
      role: 'model',
      text: 'Halo Pak/Bu! Saya TaniVibe, asisten pertanian Anda. Silakan tanya apa saja — soal cuaca, hama, pupuk, atau kapan waktu tanam yang tepat. Saya siap bantu! 🌱'
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  useEffect(() => {
    if (initialMessage) {
      handleSendMessage(initialMessage);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialMessage]);

  const handleSendMessage = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const newUserMsg: ChatMessage = { id: Date.now().toString(), role: 'user', text };
    const updatedMessages = [...messages, newUserMsg];
    
    setMessages(updatedMessages);
    setInputValue('');
    setIsLoading(true);

    try {
      // Mengirimkan seluruh riwayat pesan yang sudah diperbarui ke model terbaru
      const responseText = await chatWithAI(ai, updatedMessages, globalContext);
      const newModelMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: responseText };
      setMessages(prev => [...prev, newModelMsg]);
    } catch (error) {
      const errorMsg: ChatMessage = { id: (Date.now() + 1).toString(), role: 'model', text: 'Maaf, terjadi kesalahan saat menghubungi sistem. Silakan coba lagi nanti.' };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const quickQuestions = [
    "🌾 Waktu tanam padi",
    "🐛 Hama wereng",
    "☀️ Cuaca panen",
    "💧 Irigasi cabai"
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="max-w-3xl mx-auto p-4 md:p-8 h-[calc(100vh-80px)] flex flex-col"
    >
      <div className="flex-1 bg-tanivibe-surface border border-tanivibe-border rounded-xl shadow-subtle flex flex-col overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-tanivibe-border bg-tanivibe-bg2 flex items-center gap-3 shrink-0">
          <div className="w-10 h-10 rounded-full bg-tanivibe-green flex items-center justify-center text-white">
            <Sprout className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-tanivibe-ink">TaniVibe Assistant</h2>
            <p className="text-xs text-tanivibe-ink3">Siap membantu pertanyaan pertanian kamu</p>
          </div>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-6">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${msg.role === 'user' ? 'bg-tanivibe-ink2 text-white' : 'bg-tanivibe-green text-white'}`}>
                {msg.role === 'user' ? <User className="w-4 h-4" /> : <Sprout className="w-4 h-4" />}
              </div>
              <div className={`max-w-[80%] p-3.5 text-sm leading-relaxed rounded-2xl ${
                msg.role === 'user' 
                  ? 'bg-tanivibe-green text-white rounded-tr-sm' 
                  : 'bg-tanivibe-bg2 text-tanivibe-ink border border-tanivibe-border rounded-tl-sm'
              }`}>
                {/* Simple markdown-like rendering for line breaks */}
                {msg.text.split('\n').map((line, i) => (
                  <React.Fragment key={i}>
                    {line}
                    {i !== msg.text.split('\n').length - 1 && <br />}
                  </React.Fragment>
                ))}
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3 flex-row">
              <div className="w-8 h-8 rounded-full bg-tanivibe-green text-white flex items-center justify-center shrink-0">
                <Sprout className="w-4 h-4" />
              </div>
              <div className="bg-tanivibe-bg2 border border-tanivibe-border rounded-2xl rounded-tl-sm p-4 flex gap-1 items-center">
                <div className="w-2 h-2 bg-tanivibe-ink3 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-tanivibe-ink3 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-tanivibe-ink3 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Questions */}
        <div className="px-4 pb-3 flex flex-wrap gap-2 shrink-0">
          {quickQuestions.map((q, idx) => (
            <button
              key={idx}
              onClick={() => handleSendMessage(q.substring(2).trim())} // Remove emoji for sending
              disabled={isLoading}
              className="px-3 py-1.5 border border-tanivibe-border rounded-full bg-transparent text-xs text-tanivibe-ink2 hover:bg-tanivibe-green-l hover:border-tanivibe-green-m hover:text-tanivibe-green transition-colors disabled:opacity-50"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Input Area */}
        <div className="p-3 border-t border-tanivibe-border bg-tanivibe-surface flex gap-2 shrink-0">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSendMessage(inputValue)}
            placeholder="Ketik pertanyaan pertanian Anda..."
            disabled={isLoading}
            className="flex-1 bg-tanivibe-bg border border-tanivibe-border rounded-lg px-4 py-2.5 text-sm text-tanivibe-ink outline-none focus:border-tanivibe-green transition-colors disabled:opacity-50"
          />
          <button
            onClick={() => handleSendMessage(inputValue)}
            disabled={isLoading || !inputValue.trim()}
            className="bg-tanivibe-green text-white p-2.5 rounded-lg hover:bg-[#1e4f3a] transition-colors disabled:opacity-50 flex items-center justify-center"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </motion.div>
  );
};

export default ChatPanel;
