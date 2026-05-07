import { useState, useRef, useEffect } from "react";
import api from "../../../services/api";
import { Mic, MicOff, Send } from "lucide-react";

export default function OwnerChatbot() {

  const [messages, setMessages] = useState([
    {
      role: "assistant",
      content: "Hello! I'm your store management AI assistant. Ask me about sales, revenue, stock levels, demand forecasts, or any business insights!"
    }
  ]);

  const [input,         setInput]         = useState("");
  const [loading,       setLoading]       = useState(false);
  const [recording,     setRecording]     = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [lastAction,    setLastAction]    = useState(null); // ← tracks last stock intent

  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const addMessage = (role, content) => {
    setMessages(prev => [...prev, { role, content }]);
  };

  const send = async () => {

    if (!input.trim() || loading) return;

    const msg = input.trim();
    setInput("");
    addMessage("user", msg);
    setLoading(true);

    try {

      const res = await api.post("/ai/chat", {
        message:     msg,
        last_action: lastAction   // ← send previous intent for "yes" handling
      });

      const data = res.data.response;

      // Store detected intent for next turn
      if (res.data.last_action) {
        setLastAction(res.data.last_action);
      } else {
        setLastAction(null);
      }

      if (typeof data === "string") {
        addMessage("assistant", data);
      } else {
        addMessage("assistant", JSON.stringify(data, null, 2));
      }

    } catch {
      addMessage("assistant", "Sorry, connection issue. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // VOICE RECORDING
  // =========================

  const startRecording = async () => {
    try {

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mr     = new MediaRecorder(stream);
      const chunks = [];

      mr.ondataavailable = (e) => chunks.push(e.data);

      mr.onstop = async () => {

        const blob     = new Blob(chunks, { type: "audio/webm" });
        const formData = new FormData();
        formData.append("audio", blob, "voice.webm");

        setLoading(true);

        try {

          const res = await api.post("/ai/voice", formData, {
            headers: { "Content-Type": "multipart/form-data" }
          });

          addMessage("user",      "[Voice message]");
          addMessage("assistant", res.data.response);

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
    <div>

      <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Business Assistant</h1>
      <p className="text-sm text-gray-500 mb-6">Get insights on sales, inventory, and business performance</p>

      <div
        className="bg-white rounded-2xl border border-gray-100 shadow-sm flex flex-col"
        style={{ height: "65vh" }}
      >

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

        <div className="border-t border-gray-100 p-4">

          <div className="flex gap-2">

            <input
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              placeholder="Ask about sales, stock, revenue..."
              className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent outline-none"
            />

            <button
              onClick={recording ? stopRecording : startRecording}
              className={`p-3 rounded-xl transition-colors ${
                recording
                  ? "bg-red-500 hover:bg-red-600 text-white animate-pulse"
                  : "bg-gray-100 hover:bg-gray-200 text-gray-600"
              }`}
            >
              {recording ? <MicOff size={20} /> : <Mic size={20} />}
            </button>

            <button
              onClick={send}
              disabled={loading || !input.trim()}
              className="bg-green-700 hover:bg-green-800 disabled:bg-gray-200 text-white px-5 py-3 rounded-xl font-medium transition-colors"
            >
              <Send size={20} />
            </button>

          </div>

          <div className="flex gap-2 mt-3 flex-wrap">
            {["Today's revenue?", "Low stock items?", "Sales trends", "Top selling rice", "Demand forecast"].map(q => (
              <button
                key={q}
                onClick={() => setInput(q)}
                className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-600 px-3 py-1.5 rounded-lg transition-colors"
              >
                {q}
              </button>
            ))}
          </div>

        </div>
      </div>
    </div>
  );
}