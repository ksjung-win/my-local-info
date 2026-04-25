"use client";

import { useState, useEffect, useRef } from "react";
import chatData from "../../chat-data.json";

interface Message {
  id: number;
  type: "user" | "bot" | "admin";
  text: string;
}

export default function ChatBot() {
  const [isOpen, setIsOpen] = useState(false);
  const [isHumanMode, setIsHumanMode] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: Date.now(),
      type: "bot",
      text: "안녕하세요! 궁금하신 점이 있으신가요? 아래 질문을 클릭하거나 직접 입력해 보세요.",
    },
  ]);
  const [inputValue, setInputValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const lastMsgIdRef = useRef<number>(0);

  // 메시지가 추가될 때마다 하단으로 스크롤
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen, isLoading]);

  // 상담원 모드일 때 메시지 폴링 (2초 간격)
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isHumanMode && isOpen) {
      interval = setInterval(async () => {
        try {
          const response = await fetch("/api/chat-poll");
          if (response.ok) {
            const newMessages: any[] = await response.json();
            // sender가 admin이고 이전에 받지 않은 새로운 메시지만 필터링
            const adminMsgs = newMessages.filter(
              (m) => m.sender === "admin" && m.id > lastMsgIdRef.current
            );

            if (adminMsgs.length > 0) {
              const formattedMsgs: Message[] = adminMsgs.map((m) => ({
                id: m.id,
                type: "bot", // 표시 스타일은 공유
                text: m.text,
              }));
              
              setMessages((prev) => [...prev, ...formattedMsgs]);
              lastMsgIdRef.current = Math.max(...adminMsgs.map(m => m.id));
            }
          }
        } catch (error) {
          console.error("Polling error:", error);
        }
      }, 2000);
    }

    return () => clearInterval(interval);
  }, [isHumanMode, isOpen]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isLoading) return;

    const userMsg: Message = { id: Date.now(), type: "user", text };
    setMessages((prev) => [...prev, userMsg]);
    setInputValue("");

    if (isHumanMode) {
      // 상담원 모드: /api/chat-human으로 전송
      try {
        await fetch("/api/chat-human", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text, sender: "user" }),
        });
      } catch (error) {
        console.error("Human chat send error:", error);
      }
    } else {
      // AI 모드: /api/chat으로 전송
      setIsLoading(true);
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ prompt: text }),
        });

        if (!response.ok) throw new Error("API 요청 실패");

        const data = await response.json();
        const botMsg: Message = { 
          id: Date.now() + 1, 
          type: "bot", 
          text: data.response || "죄송합니다. 답변을 생성하는 중에 문제가 발생했습니다." 
        };
        setMessages((prev) => [...prev, botMsg]);
      } catch (error) {
        const errorMsg: Message = { 
          id: Date.now() + 1, 
          type: "bot", 
          text: "AI 상담 중 오류가 발생했습니다. 잠시 후 다시 시도해 주세요." 
        };
        setMessages((prev) => [...prev, errorMsg]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleQuestionClick = (question: string, answer: string) => {
    if (isLoading || isHumanMode) return;
    const userMsg: Message = { id: Date.now(), type: "user", text: question };
    setMessages((prev) => [...prev, userMsg]);

    setTimeout(() => {
      const botMsg: Message = { id: Date.now() + 1, type: "bot", text: answer };
      setMessages((prev) => [...prev, botMsg]);
    }, 500);
  };

  const startHumanSupport = () => {
    setIsHumanMode(true);
    const systemMsg: Message = {
      id: Date.now(),
      type: "bot",
      text: "전문 상담원과 연결 중입니다. 잠시만 기다려 주세요. (메시지를 남겨주시면 확인 후 답변드립니다)",
    };
    setMessages((prev) => [...prev, systemMsg]);
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
          inset-0 w-full h-full bg-white
          sm:inset-auto sm:bottom-24 sm:right-6 sm:w-[360px] sm:h-[500px] sm:rounded-2xl sm:shadow-2xl sm:border sm:border-slate-100
        `}
      >
        {/* 헤더 */}
        <div className="bg-blue-600 p-4 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-lg">
              {isHumanMode ? "👤" : "🤖"}
            </div>
            <div>
              <h3 className="font-bold text-sm">{isHumanMode ? "전문 상담원" : "AI 상담원"}</h3>
              <div className="flex items-center gap-1.5 opacity-80 text-xs">
                <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span>
                온라인
              </div>
            </div>
          </div>
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
          {isLoading && !isHumanMode && (
            <div className="flex justify-start">
              <div className="bg-white text-slate-400 border border-slate-100 px-4 py-2 rounded-2xl rounded-bl-none shadow-sm flex items-center gap-2">
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                <span className="w-1.5 h-1.5 bg-slate-300 rounded-full animate-bounce"></span>
              </div>
            </div>
          )}
        </div>

        {/* 하단 입력 및 질문 */}
        <div className="p-4 bg-white border-t border-slate-100 space-y-3">
          {!isHumanMode && (
            <div className="flex flex-wrap gap-2 text-[10px]">
              {chatData.map((item, idx) => (
                <button
                  key={idx}
                  disabled={isLoading}
                  onClick={() => handleQuestionClick(item.question, item.answer)}
                  className="px-2.5 py-1.5 bg-blue-50 text-blue-600 rounded-full border border-blue-100 hover:bg-blue-100 transition-colors text-left disabled:opacity-50"
                >
                  {item.question}
                </button>
              ))}
            </div>
          )}

          <form 
            onSubmit={(e) => {
              e.preventDefault();
              handleSend(inputValue);
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading && !isHumanMode}
              placeholder={isHumanMode ? "메시지를 남겨주세요..." : "무엇이든 물어보세요..."}
              className="flex-1 bg-slate-100 border-none rounded-full px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none transition-all disabled:opacity-50"
            />
            <button
              type="submit"
              disabled={!inputValue.trim() || (isLoading && !isHumanMode)}
              className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white hover:bg-blue-700 transition-colors disabled:bg-slate-300"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>

          {!isHumanMode && (
            <button
              onClick={startHumanSupport}
              className="w-full py-2 text-xs text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all border border-transparent hover:border-blue-100"
            >
              👩‍💼 상담원과 직접 대화하기
            </button>
          )}
        </div>
      </div>
    </>
  );
}
