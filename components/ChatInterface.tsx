
import React, { useState, useRef, useEffect } from 'react';
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Button } from './Button';

interface ChatInterfaceProps {
  repositoryContext: string;
}

interface Message {
  role: 'user' | 'model';
  content: string;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({ repositoryContext }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const prompt = `You are a world-class principal code analyst. Below is the full context of a GitHub repository serialized into a single text format. Use this context to answer my questions with extreme precision.\n\n[REPOSITORY_CONTEXT_START]\n${repositoryContext}\n[REPOSITORY_CONTEXT_END]\n\nUser Question: ${input}`;
      
      const response: GenerateContentResponse = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
        contents: prompt,
      });

      const aiText = response.text || "NO_RESPONSE_RECEIVED_FROM_KERNEL";
      setMessages(prev => [...prev, { role: 'model', content: aiText }]);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', content: `[CRITICAL_SYSTEM_ERROR]: ${err.message}` }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col bg-black border border-zinc-800 rounded-sm overflow-hidden h-[700px] shadow-[0_30px_60px_rgba(0,0,0,0.8)] animate-in slide-in-from-bottom-8 duration-700">
      <div className="bg-zinc-900/90 px-6 py-4 border-b border-zinc-800 flex justify-between items-center backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-2.5 h-2.5 bg-crimson-600 rounded-full animate-pulse shadow-[0_0_8px_rgba(220,38,38,0.8)]"></div>
          <span className="text-[11px] font-mono font-black text-zinc-100 uppercase tracking-[0.2em]">ORACLE_SESSION: GEMINI_3_FLASH</span>
        </div>
        <span className="text-[10px] font-mono text-zinc-500 uppercase font-bold tracking-tighter">Handshake: 1.0M_Context_Stable</span>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-thin scrollbar-thumb-zinc-800 bg-[#050507]"
      >
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center">
             <div className="w-16 h-px bg-zinc-900 mb-6"></div>
             <p className="text-[11px] font-mono text-zinc-600 uppercase tracking-[0.3em] max-w-xs leading-relaxed font-bold">
               Awaiting query parameters...<br/>
               Analyze architecture, logic flow, or hidden vulnerabilities.
             </p>
             <div className="w-16 h-px bg-zinc-900 mt-6"></div>
          </div>
        )}
        
        {messages.map((msg, i) => (
          <div key={i} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-in fade-in slide-in-from-bottom-2`}>
            <div className={`
              max-w-[95%] p-5 font-mono text-[12px] leading-relaxed shadow-lg
              ${msg.role === 'user' 
                ? 'bg-zinc-900 text-zinc-50 border-r-2 border-zinc-500' 
                : 'bg-zinc-900/30 text-zinc-300 border-l-2 border-crimson-800'}
            `}>
              <div className="flex justify-between items-center mb-3">
                <span className={`text-[9px] font-black uppercase tracking-widest ${msg.role === 'user' ? 'text-zinc-500' : 'text-crimson-700'}`}>
                  {msg.role === 'user' ? '>> USER_ORIGIN' : '>> SYSTEM_ORACLE'}
                </span>
                <span className="text-[8px] font-mono text-zinc-800 uppercase font-black">Node_01</span>
              </div>
              <div className="whitespace-pre-wrap selection:bg-crimson-900 selection:text-white">{msg.content}</div>
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex flex-col items-start animate-pulse">
            <div className="bg-zinc-900/30 border-l-2 border-crimson-800 p-5 w-48">
               <div className="h-2 w-full bg-zinc-800 rounded-full mb-2"></div>
               <div className="h-2 w-2/3 bg-zinc-800 rounded-full"></div>
            </div>
          </div>
        )}
      </div>

      <div className="p-6 border-t border-zinc-900 bg-black/80 backdrop-blur-md">
        <div className="flex gap-4">
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder="> ASK_ABOUT_CODEBASE_ARCHITECTURE..."
            className="flex-1 bg-transparent border-b border-zinc-800 px-2 py-3 text-sm font-mono text-white placeholder-zinc-800 focus:outline-none focus:border-crimson-700 transition-colors"
          />
          <Button 
            onClick={handleSend} 
            isLoading={isLoading} 
            className="px-8 py-3 font-black"
          >
            EXEC_QUERY
          </Button>
        </div>
      </div>
    </div>
  );
};
