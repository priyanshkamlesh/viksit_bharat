import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  FaPaperPlane,
  FaTimes,
  FaRobot,
  FaUpload,
  FaFile,
  FaTrash,
  FaSpinner,
  FaCheck,
  FaLightbulb,
} from 'react-icons/fa';

const FloatingChatbot = ({ theme }) => {
  const isDark = theme === 'dark';
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [currentATS, setCurrentATS] = useState(null);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const chatContainerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragActive(true);
    } else if (e.type === 'dragleave') {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const files = e.dataTransfer.files;
    if (files.length) {
      handleFileSelect(files[0]);
    }
  };

  const handleFileSelect = (file) => {
    const validExtensions = ['pdf', 'txt', 'docx'];
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (!validExtensions.includes(extension)) {
      alert('Please upload a PDF, DOCX, or TXT resume file.');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size must be less than 5MB');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      setResumeFile({
        name: file.name,
        size: file.size,
        type: file.type,
        dataUrl: e.target.result,
      });
    };
    reader.onerror = () => {
      alert('Could not read this file. Please try another resume file.');
    };
    reader.readAsDataURL(file);
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() && !resumeFile) return;
    const messageText = inputValue.trim() || `Uploaded ${resumeFile.name} for ATS analysis.`;

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: messageText,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const payload = {
        message: messageText,
        resume_file_name: resumeFile?.name,
        resume_mime_type: resumeFile?.type,
        resume_file_data: resumeFile?.dataUrl,
        history: messages.map((msg) => ({
          role: msg.type === 'user' ? 'user' : 'assistant',
          content: msg.content,
        })),
      };

      const response = await fetch('/api/chatbot/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: data.answer,
        atsScore: data.ats_score,
        resumeFeedback: data.resume_feedback,
        provider: data.provider,
        error: data.error,
      };

      setMessages((prev) => [...prev, botMessage]);
      setCurrentATS(data.ats_score);
      setCurrentFeedback(data.resume_feedback);
    } catch (error) {
      const errorMessage = {
        id: Date.now() + 1,
        type: 'error',
        content: `Error: ${error.message}. Please try again.`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearResume = () => {
    setResumeFile(null);
    setCurrentATS(null);
    setCurrentFeedback(null);
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50" ref={chatContainerRef}>
      {/* Chat Window */}
      {isOpen && (
        <div
          className={`mb-4 flex w-96 max-h-[600px] flex-col rounded-2xl border shadow-2xl ${
            isDark
              ? 'border-emerald-500/15 bg-[#050f0a]'
              : 'border-emerald-100 bg-white'
          }`}
        >
          {/* Header */}
          <div
            className={`flex items-center justify-between border-b px-4 py-3 ${
              isDark
                ? 'border-emerald-500/15 bg-emerald-500/5'
                : 'border-emerald-100 bg-emerald-50'
            }`}
          >
            <div>
              <p
                className={`text-xs font-bold uppercase tracking-widest ${
                  isDark ? 'text-emerald-300' : 'text-emerald-700'
                }`}
              >
                SkillNet
              </p>
              <h3 className="text-sm font-semibold">AI Coach</h3>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className={`rounded-full p-2 transition-all ${
                isDark
                  ? 'bg-red-500/10 text-red-300 hover:bg-red-500/20'
                  : 'bg-red-100 text-red-700 hover:bg-red-200'
              }`}
            >
              <FaTimes />
            </button>
          </div>

          {/* Messages */}
          <div
            className={`flex-1 overflow-y-auto space-y-3 p-4 ${
              isDark ? 'bg-[#050f0a]' : 'bg-white'
            }`}
          >
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center text-center">
                <div>
                  <FaLightbulb
                    className={`mx-auto mb-2 text-2xl ${
                      isDark ? 'text-emerald-400' : 'text-emerald-600'
                    }`}
                  />
                  <p
                    className={`text-xs ${
                      isDark ? 'text-emerald-200/60' : 'text-slate-500'
                    }`}
                  >
                    Ask me about interviews, resumes, or careers!
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex ${
                      msg.type === 'user' ? 'justify-end' : 'justify-start'
                    }`}
                  >
                    <div
                      className={`max-w-xs rounded-lg px-3 py-2 text-sm ${
                        msg.type === 'user'
                          ? isDark
                            ? 'bg-emerald-500/30 text-emerald-100'
                            : 'bg-emerald-100 text-emerald-900'
                          : msg.type === 'error'
                          ? isDark
                            ? 'bg-red-500/20 text-red-100'
                            : 'bg-red-100 text-red-900'
                          : isDark
                          ? 'bg-white/10 text-emerald-50'
                          : 'bg-gray-100 text-slate-900'
                      }`}
                    >
                      <p className="leading-relaxed whitespace-pre-wrap">
                        {msg.content}
                      </p>

                      {msg.error ? (
                        <div className={`mt-2 rounded px-2 py-1 text-xs ${isDark ? 'bg-rose-500/10 text-rose-100' : 'bg-rose-100 text-rose-800'}`}>
                          <span className="font-semibold">Provider error:</span> {msg.error}
                        </div>
                      ) : null}

                      {msg.atsScore !== null && msg.atsScore !== undefined && (
                        <div
                          className={`mt-2 rounded px-2 py-1 text-xs ${
                            isDark
                              ? 'bg-emerald-500/20 text-emerald-200'
                              : 'bg-emerald-100 text-emerald-700'
                          }`}
                        >
                          <div className="flex justify-between">
                            <span>ATS:</span>
                            <span className="font-bold">{msg.atsScore}/100</span>
                          </div>
                          <div
                            className={`mt-1 h-1.5 overflow-hidden rounded-full ${
                              isDark ? 'bg-white/10' : 'bg-emerald-200'
                            }`}
                          >
                            <div
                              className={`h-full ${
                                msg.atsScore >= 75
                                  ? isDark
                                    ? 'bg-green-400'
                                    : 'bg-green-500'
                                  : msg.atsScore >= 50
                                  ? isDark
                                    ? 'bg-yellow-400'
                                    : 'bg-yellow-500'
                                  : isDark
                                  ? 'bg-red-400'
                                  : 'bg-red-500'
                              }`}
                              style={{ width: `${msg.atsScore}%` }}
                            ></div>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Resume Info */}
          {resumeFile && (
            <div
              className={`border-t px-4 py-2 ${
                isDark ? 'border-emerald-500/15' : 'border-emerald-100'
              }`}
            >
              <div
                className={`flex items-center justify-between rounded px-2 py-1 text-xs ${
                  isDark
                    ? 'bg-emerald-500/10 text-emerald-200'
                    : 'bg-emerald-50 text-emerald-700'
                }`}
              >
                <div className="flex items-center gap-2">
                  <FaFile className="text-xs" />
                  <span className="truncate">{resumeFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearResume}
                  className={`transition-all ${
                    isDark ? 'hover:text-red-300' : 'hover:text-red-600'
                  }`}
                >
                  <FaTrash className="text-xs" />
                </button>
              </div>
            </div>
          )}

          {/* Input */}
          <div
            className={`border-t px-3 py-2 ${
              isDark ? 'border-emerald-500/15' : 'border-emerald-100'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            style={{
              borderTopStyle: isDragActive ? 'dashed' : 'solid',
              borderTopColor: isDragActive
                ? isDark
                  ? 'rgb(16, 185, 129)'
                  : 'rgb(5, 150, 105)'
                : undefined,
            }}
          >
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`rounded px-2 py-1.5 transition-all ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                <FaUpload className="text-sm" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={(e) =>
                  e.target.files && handleFileSelect(e.target.files[0])
                }
                className="hidden"
              />

              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask a question..."
                className={`flex-1 rounded border-0 px-2 py-1.5 text-sm focus:outline-none ${
                  isDark
                    ? 'bg-white/10 text-emerald-50 placeholder-emerald-300/40'
                    : 'bg-gray-100 text-slate-900 placeholder-slate-400'
                }`}
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={isLoading || (!inputValue.trim() && !resumeFile)}
                className={`rounded px-2 py-1.5 transition-all disabled:opacity-50 ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 disabled:hover:bg-emerald-500/20'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:hover:bg-emerald-100'
                }`}
              >
                {isLoading ? (
                  <FaSpinner className="animate-spin text-sm" />
                ) : (
                  <FaPaperPlane className="text-sm" />
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`inline-flex items-center justify-center rounded-full p-4 shadow-lg transition-all hover:scale-110 ${
          isDark
            ? 'border border-emerald-500/30 bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
            : 'border border-emerald-300 bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
        }`}
      >
        {isOpen ? <FaTimes className="text-xl" /> : <FaRobot className="text-xl" />}
      </button>
    </div>
  );
};

export default FloatingChatbot;
