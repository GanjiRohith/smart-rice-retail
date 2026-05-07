import { useState, useRef, useEffect } from "react";
import api from "../../../shared/services/api";
import { Mic, MicOff, Send } from "lucide-react";

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Hello! I'm your Rice Retail AI assistant. Ask me about our rice products, prices, orders, or anything else!" }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [recording, setRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const addMessage = (role, content) => setMessages(prev => [...prev, { role, content }]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput("");
    addMessage("user", msg);
    setLoading(true);
    try {
      const res = await api.post("/ai/chat", { message: msg });
      addMessage("assistant", res.data.response || "I could not process that request.");
    } catch {
      addMessage("assistant", "Sorry, I'm having trouble connecting. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr = new MediaRecorder(stream);
      const chunks = [];
      mr.ondataavailable = (e) => chunks.push(e.data);
      mr.onstop = async () => {
        const blob = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "voice.webm");
        setLoading(true);
        try {
          const res = await api.post("/ai/voice", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });
          addMessage("user", "[Voice message]");
          addMessage("assistant", res.data.response);
          // Play audio response if available
          if (res.data.audio_base64) {
            try {
              const audioBytes = atob(res.data.audio_base64);
              const buf = new Uint8Array(audioBytes.length);
              for (let i = 0; i < audioBytes.length; i++) buf[i] = audioBytes.charCodeAt(i);
              const audioBlob = new Blob([buf], { type: "audio/wav" });
              new Audio(URL.createObjectURL(audioBlob)).play();
            } catch { /* audio playback optional */ }
          }
        } catch {
          addMessage("assistant", "Voice processing failed. Please try again or type your question.");
        } finally {
          setLoading(false);
        }
        stream.getTracks().forEach(t => t.stop());
      };
      mr.start();
      setMediaRecorder(mr);
      setRecording(true);
    } catch {
      addMessage("assistant", "Microphone access denied. Please allow microphone permissions.");
    }
  };

  const stopRecording = () => {
    mediaRecorder?.stop();
    setRecording(false);
  };

  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Assistant</h1>
      <p className="text-sm text-gray-500 mb-6">Ask about products, prices, orders, or recommendations</p>

      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col" style={{ height: "65vh" }}>
        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                m.role === "user"
                  ? "bg-green-700 text-white rounded-br-md"
                  : "bg-gray-100 text-gray-800 rounded-bl-md"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 text-gray-500 px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="border-t border-gray-100 p-4">
          <div className="flex gap-2">
            <input value={input} onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about rice products, prices, orders..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none" />
            <button onClick={recording ? stopRecording : startRecording}
              className={`p-3 rounded-xl transition-colors ${recording ? "bg-red-500 hover:bg-red-600 text-white animate-pulse" : "bg-gray-100 hover:bg-gray-200 text-gray-600"}`}
              title={recording ? "Stop recording" : "Voice input"}>
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>
            <button onClick={send} disabled={loading || !input.trim()}
              className="bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white px-5 py-3 rounded-xl font-medium transition-colors">
              <Send size={20} />
            </button>
          </div>
          <div className="flex gap-2 mt-2 flex-wrap">
            {["What rice do you have?", "Track my order", "Best rice for biryani?", "Recommend something"].map(q => (
              <button key={q} onClick={() => setInput(q)} className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors">
                {q}
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
