"use client";

import { useState, useEffect, useRef } from "react";

interface Message {
  id: number;
  sender: "user" | "admin";
  text: string;
}

export default function AdminPage() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMsgIdRef = useRef<number>(0);

  // 인증 확인
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === "admin1234") {
      setIsAuthenticated(true);
    } else {
      alert("비밀번호가 올바르지 않습니다.");
    }
  };

  // 스크롤 하단 유지
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isAuthenticated]);

  // 메시지 폴링 (2초 간격)
  useEffect(() => {
    if (!isAuthenticated) return;

    const fetchMessages = async () => {
      try {
        const response = await fetch("/api/chat-poll");
        if (response.ok) {
          const data: any[] = await response.json();
          // 새로운 메시지만 필터링
          const newMsgs = data.filter((m) => m.id > lastMsgIdRef.current);
          if (newMsgs.length > 0) {
            setMessages((prev) => [...prev, ...newMsgs]);
            lastMsgIdRef.current = Math.max(...newMsgs.map((m) => m.id));
          }
        }
      } catch (error) {
        console.error("Polling error:", error);
      }
    };

    fetchMessages(); // 초기 실행
    const interval = setInterval(fetchMessages, 2000);
    return () => clearInterval(interval);
  }, [isAuthenticated]);

  // 메시지 전송 (관리자 답장)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const text = inputValue;
    setInputValue("");

    try {
      const response = await fetch("/api/chat-human", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text, sender: "admin" }),
      });

      if (!response.ok) throw new Error("전송 실패");
      
      // 전송 성공 시 화면에 즉시 반영 (폴링에서도 곧 잡히겠지만 즉각적인 피드백을 위해)
      // 실제로는 API에서 저장된 ID를 받아와야 하지만, 여기서는 임시 ID 사용
      // 폴링에서 중복 방지를 위해 lastMsgId를 체크하므로 안전함
    } catch (error) {
      alert("메시지 전송에 실패했습니다.");
    }
  };

  // ── 로그인 화면 ──
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-center mb-6 text-slate-800">관리자 상담 로그인</h1>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:ring-2 focus:ring-blue-500 outline-none transition-all"
            />
            <button
              type="submit"
              className="w-full bg-blue-600 text-white py-3 rounded-lg font-bold hover:bg-blue-700 transition-all"
            >
              접속하기
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ── 관리자 채팅 화면 ──
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col max-w-4xl mx-auto shadow-2xl border-x bg-white">
      {/* 헤더 */}
      <header className="bg-blue-600 p-6 text-white flex justify-between items-center shrink-0">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center text-2xl">👤</div>
          <div>
            <h1 className="text-xl font-bold">실시간 상담 관리자</h1>
            <p className="text-sm opacity-80">방문자와 실시간으로 소통 중입니다</p>
          </div>
        </div>
        <button 
          onClick={() => setIsAuthenticated(false)}
          className="text-sm bg-white/10 px-4 py-2 rounded-lg hover:bg-white/20 transition-all"
        >
          로그아웃
        </button>
      </header>

      {/* 대화 영역 */}
      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50"
      >
        {messages.length === 0 && (
          <div className="text-center py-20 text-slate-400">
            <p>메시지가 아직 없습니다.</p>
            <p className="text-xs mt-1">방문자가 메시지를 보내면 여기에 나타납니다.</p>
          </div>
        )}
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"} max-w-[70%]`}>
              <span className="text-[10px] text-slate-400 mb-1 px-1">
                {msg.sender === "user" ? "방문자" : "나 (관리자)"}
              </span>
              <div
                className={`px-4 py-3 rounded-2xl text-sm leading-relaxed shadow-md ${
                  msg.sender === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* 하단 입력창 */}
      <div className="p-6 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={handleSend} className="flex gap-3">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="답장을 입력해 주세요..."
            className="flex-1 bg-slate-100 border-none rounded-full px-6 py-4 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all"
          />
          <button
            type="submit"
            disabled={!inputValue.trim()}
            className="px-8 bg-blue-600 text-white rounded-full font-bold hover:bg-blue-700 transition-all disabled:bg-slate-300 shadow-lg active:scale-95"
          >
            전송
          </button>
        </form>
      </div>
    </div>
  );
}
