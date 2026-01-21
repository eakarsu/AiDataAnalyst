import { useState, useRef, useEffect } from 'react';
import api from '../services/api';
import { MessageSquare, Send, Sparkles, User, Loader2, Trash2 } from 'lucide-react';

export default function AIChat() {
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hello! I\'m your AI Data Analyst assistant. I can help you analyze data, generate insights, answer questions about your metrics, and more. What would you like to know?' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const context = { type: 'general_analytics' };
      const history = messages.slice(-10).map(m => ({ role: m.role, content: m.content }));
      const response = await api.aiChat(userMessage, context, history);
      setMessages(prev => [...prev, { role: 'assistant', content: response.response }]);
    } catch (error) {
      setMessages(prev => [...prev, { role: 'assistant', content: 'I apologize, but I encountered an error processing your request. Please try again or rephrase your question.' }]);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([
      { role: 'assistant', content: 'Chat cleared. How can I help you with your data analysis today?' }
    ]);
  };

  const suggestedQuestions = [
    'What are my top performing metrics?',
    'Summarize recent anomalies',
    'Generate a revenue forecast',
    'What insights should I focus on?',
  ];

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary-50 rounded-lg"><MessageSquare className="h-6 w-6 text-primary-600" /></div>
          <div><h1 className="text-2xl font-bold text-gray-900">AI Assistant</h1><p className="text-gray-500">Ask questions about your data</p></div>
        </div>
        <button onClick={handleClear} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors" title="Clear chat">
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="flex-1 bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.map((message, idx) => (
            <div key={idx} className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${message.role === 'user' ? 'bg-primary-100' : 'bg-purple-100'}`}>
                {message.role === 'user' ? <User className="h-4 w-4 text-primary-600" /> : <Sparkles className="h-4 w-4 text-purple-600" />}
              </div>
              <div className={`max-w-[80%] p-4 rounded-2xl ${message.role === 'user' ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-900'}`}>
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                <Sparkles className="h-4 w-4 text-purple-600" />
              </div>
              <div className="bg-gray-100 p-4 rounded-2xl">
                <Loader2 className="h-5 w-5 text-gray-500 animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {messages.length === 1 && (
          <div className="px-4 pb-4">
            <p className="text-sm text-gray-500 mb-2">Try asking:</p>
            <div className="flex flex-wrap gap-2">
              {suggestedQuestions.map((q, i) => (
                <button key={i} onClick={() => setInput(q)} className="px-3 py-1.5 text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-full transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-4 border-t border-gray-200">
          <div className="flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about your data..."
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
              disabled={loading}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading}
              className="px-5 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
