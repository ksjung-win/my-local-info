"use client";

import { useState, useEffect, useRef } from "react";
import chatData from "../../chat-data.json";

interface Message {
  id: number;
  type: "user" | "bot";
  text: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(),
      type: "bot",
      text: "안녕하세요! 궁금하신 점이 있으신가요? 아래 질문을 클릭해 보세요.",
    },
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  // 메시지가 추가될 때마다 하단으로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const handleQuestionClick = (question: string, answer: string) => {
    // 사용자 질문 추가
    const userMsg: Message = { id: Date.now(), type: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);

    // 약간의 지연 후 AI 답변 추가 (자연스러운 느낌)
    setTimeout(() => {
      const botMsg: Message = { id: Date.now() + 1, type: "bot", text: answer };
      setMessages((prev) => [...prev, botMsg]);
    }, 500);
  };

  return (
    <>
      {/* ── 플로팅 버튼 ── */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 w-14 h-14 bg-blue-600 rounded-full shadow-lg hover:bg-blue-700 transition-all duration-300 z-50 flex items-center justify-center text-white"
        aria-label="채팅창 열기"
      >
        {isOpen ? (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
        )}
      </button>

      {/* ── 채팅창 ── */}
      <div
        className={`fixed z-50 overflow-hidden flex flex-col transition-all duration-300 transform 
          ${isOpen ? "translate-y-0 opacity-100 scale-100" : "translate-y-10 opacity-0 scale-95 pointer-events-none"}
          /* 모바일 (기본) */
          inset-0 w-full h-full bg-white
          /* 데스크탑 (sm 이상) */
          sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[360px] sm:h-[500px] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-100
        `}
      >
        {/* 헤더 */}
        <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">🤖</div>
            <div>
              <h3 className="font-bold text-sm">AI 상담원</h3>
              <div className="flex items-center gap-1.5 opacity-80 text-xs">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                온라인
              </div>
            </div>
          </div>
          {/* 모바일 닫기 버튼 (헤더에 추가) */}
          <button onClick={() => setIsOpen(false)} className="sm:hidden p-2 hover:bg-white/10 rounded-full">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 대화 영역 */}
        <div
          ref={scrollRef}
          className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50 scroll-smooth"
        >
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${msg.type === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] px-4 py-2 rounded-2xl text-sm leading-relaxed shadow-sm ${
                  msg.type === "user"
                    ? "bg-blue-600 text-white rounded-br-none"
                    : "bg-white text-slate-700 border border-slate-100 rounded-bl-none"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
        </div>

        {/* 질문 버튼 영역 */}
        <div className="p-4 bg-white border-t border-slate-100 mb-safe">
          <div className="flex flex-wrap gap-2 text-xs">
            {chatData.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleQuestionClick(item.question, item.answer)}
                className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors text-left"
              >
                {item.question}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}
