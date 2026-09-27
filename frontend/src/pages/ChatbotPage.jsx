import React, { useState, useEffect, useRef, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FaArrowLeft,
  FaPaperPlane,
  FaUpload,
  FaMoon,
  FaSun,
  FaSpinner,
  FaTrash,
  FaFile,
  FaCheckCircle,
  FaTimesCircle,
  FaLightbulb,
  FaCheck,
} from 'react-icons/fa';
import { readCurrentUser } from '../lib/currentUser';

const ChatbotPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const isDark = theme === 'dark';
  const currentUser = useMemo(() => readCurrentUser(), []);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const [messages, setMessages] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [currentATS, setCurrentATS] = useState(null);
  const [currentFeedback, setCurrentFeedback] = useState(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const cardBase = isDark
    ? 'border border-emerald-500/15 bg-white/5 text-emerald-50 shadow-[0_24px_60px_rgba(0,0,0,0.28)]'
    : 'border border-emerald-100 bg-white/85 text-slate-800 shadow-[0_24px_60px_rgba(16,185,129,0.10)]';

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const storedResume = window.sessionStorage.getItem('skillnet_resume_upload');
    if (!storedResume) {
      return;
    }

    try {
      const handoff = JSON.parse(storedResume);
      const resume = handoff?.resume || handoff;
      if (resume?.dataUrl && resume?.name) {
        setResumeFile(resume);
        if (handoff?.resumeFeedback && handoff?.atsScore !== null && handoff?.atsScore !== undefined) {
          const botMessage = {
            id: Date.now(),
            type: 'bot',
            content: `Your resume ATS analysis is ready. ATS score: ${handoff.atsScore}/100.`,
            atsScore: handoff.atsScore,
            resumeFeedback: handoff.resumeFeedback,
            provider: 'resume-page',
          };
          setMessages([botMessage]);
          setCurrentATS(handoff.atsScore);
          setCurrentFeedback(handoff.resumeFeedback);
        } else {
          setInputValue('Analyze my resume and give me an ATS score.');
        }
      }
    } catch (error) {
      // Ignore invalid handoff data.
    } finally {
      window.sessionStorage.removeItem('skillnet_resume_upload');
    }
  }, []);

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

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
    <div
      className={`flex h-dvh w-full flex-col transition-colors duration-500 ${
        isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'
      }`}
    >
      {/* Header */}
      <div className={`flex items-center justify-between border-b px-5 py-4 sm:px-8 ${isDark ? 'border-emerald-500/15 bg-white/5' : 'border-emerald-100 bg-white/75'}`}>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className={`inline-flex items-center justify-center rounded-full p-3 transition-all ${
              isDark ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}
          >
            <FaArrowLeft />
          </button>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Career Coach</p>
            <h1 className="text-lg font-black">SkillNet AI Assistant</h1>
          </div>
        </div>
        <button
          type="button"
          onClick={toggleTheme}
          className={`inline-flex items-center justify-center rounded-full p-3 transition-all ${
            isDark ? 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
          }`}
        >
          {isDark ? <FaSun /> : <FaMoon />}
        </button>
      </div>

      {/* Main Content */}
      <div className="flex flex-1 gap-4 overflow-hidden px-5 py-4 sm:px-8">
        {/* Chat Area */}
        <div className="flex flex-1 flex-col">
          <div className={`flex-1 overflow-y-auto rounded-2xl p-4 ${cardBase} space-y-4`}>
            {messages.length === 0 ? (
              <div className="flex h-full items-center justify-center">
                <div className="text-center">
                  <FaLightbulb className={`mx-auto mb-4 text-4xl ${isDark ? 'text-emerald-400' : 'text-emerald-600'}`} />
                  <h2 className="mb-2 text-xl font-semibold">Welcome to SkillNet Coach</h2>
                  <p className={`text-sm ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                    Ask questions about interviews, resumes, roadmaps, or upload your resume for ATS feedback.
                  </p>
                </div>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.type === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div
                      className={`max-w-xs rounded-lg px-4 py-3 lg:max-w-md ${
                        msg.type === 'user'
                          ? isDark
                            ? 'bg-emerald-500/20 text-emerald-100'
                            : 'bg-emerald-100 text-emerald-900'
                          : msg.type === 'error'
                          ? isDark
                            ? 'bg-red-500/20 text-red-100'
                            : 'bg-red-100 text-red-900'
                          : isDark
                          ? 'bg-white/10 text-emerald-50'
                          : 'bg-white/70 text-slate-900'
                      }`}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>

                      {msg.error ? (
                        <div className={`mt-3 rounded-lg border px-3 py-2 text-sm ${isDark ? 'border-rose-500/30 bg-rose-500/10 text-rose-100' : 'border-rose-300 bg-rose-50 text-rose-800'}`}>
                          <strong>Error:</strong> {msg.error}
                        </div>
                      ) : null}

                      {msg.atsScore !== null && msg.atsScore !== undefined && (
                        <div className={`mt-3 rounded-lg border ${isDark ? 'border-emerald-500/30 bg-emerald-500/10' : 'border-emerald-300 bg-emerald-50'} p-3`}>
                          <div className="mb-2 flex items-center justify-between">
                            <span className="text-sm font-semibold">ATS Score</span>
                            <span className={`text-lg font-bold ${msg.atsScore >= 75 ? (isDark ? 'text-green-400' : 'text-green-600') : msg.atsScore >= 50 ? (isDark ? 'text-yellow-400' : 'text-yellow-600') : isDark ? 'text-red-400' : 'text-red-600'}`}>
                              {msg.atsScore}/100
                            </span>
                          </div>
                          <div className={`h-2 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-emerald-100'}`}>
                            <div
                              className={`h-full transition-all ${msg.atsScore >= 75 ? (isDark ? 'bg-green-400' : 'bg-green-500') : msg.atsScore >= 50 ? (isDark ? 'bg-yellow-400' : 'bg-yellow-500') : isDark ? 'bg-red-400' : 'bg-red-500'}`}
                              style={{ width: `${msg.atsScore}%` }}
                            ></div>
                          </div>
                        </div>
                      )}

                      {msg.resumeFeedback && (
                        <div className={`mt-3 space-y-2`}>
                          {msg.resumeFeedback.strengths && msg.resumeFeedback.strengths.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold">Strengths:</p>
                              <ul className="space-y-1">
                                {msg.resumeFeedback.strengths.slice(0, 2).map((strength, idx) => (
                                  <li key={idx} className={`flex items-start gap-2 text-xs ${isDark ? 'text-green-300' : 'text-green-700'}`}>
                                    <FaCheck className="mt-1 flex-shrink-0" />
                                    <span>{strength}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                          {msg.resumeFeedback.improvements && msg.resumeFeedback.improvements.length > 0 && (
                            <div>
                              <p className="text-xs font-semibold">Improvements:</p>
                              <ul className="space-y-1">
                                {msg.resumeFeedback.improvements.slice(0, 2).map((improvement, idx) => (
                                  <li key={idx} className={`flex items-start gap-2 text-xs ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>
                                    <FaLightbulb className="mt-1 flex-shrink-0" />
                                    <span>{improvement}</span>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Input Area */}
          <div className="mt-4 space-y-3">
            {resumeFile && (
              <div className={`flex items-center justify-between rounded-lg px-3 py-2 ${isDark ? 'bg-emerald-500/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                <div className="flex items-center gap-2">
                  <FaFile className="text-sm" />
                  <span className="text-sm font-medium">{resumeFile.name}</span>
                </div>
                <button
                  type="button"
                  onClick={handleClearResume}
                  className={`text-sm transition-all ${isDark ? 'hover:text-red-300' : 'hover:text-red-600'}`}
                >
                  <FaTrash />
                </button>
              </div>
            )}

            <div
              className={`flex gap-2 rounded-full border-2 transition-all ${
                isDragActive
                  ? isDark
                    ? 'border-emerald-400 bg-emerald-500/5'
                    : 'border-emerald-400 bg-emerald-50'
                  : isDark
                  ? 'border-emerald-500/20 bg-white/5'
                  : 'border-emerald-200 bg-white/50'
              } overflow-hidden p-2`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 transition-all ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                }`}
              >
                <FaUpload className="text-lg" />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.txt,.docx"
                onChange={(e) => e.target.files && handleFileSelect(e.target.files[0])}
                className="hidden"
              />

              <textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask your question here... (Shift+Enter for new line)"
                rows="2"
                className={`flex-1 resize-none border-0 bg-transparent focus:outline-none ${isDark ? 'text-emerald-50 placeholder-emerald-300/50' : 'text-slate-900 placeholder-slate-400'}`}
                disabled={isLoading}
              />

              <button
                type="button"
                onClick={handleSendMessage}
                disabled={isLoading || (!inputValue.trim() && !resumeFile)}
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 transition-all disabled:opacity-50 ${
                  isDark
                    ? 'bg-emerald-500/20 text-emerald-200 hover:bg-emerald-500/30 disabled:hover:bg-emerald-500/20'
                    : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200 disabled:hover:bg-emerald-100'
                }`}
              >
                {isLoading ? <FaSpinner className="animate-spin text-lg" /> : <FaPaperPlane className="text-lg" />}
              </button>
            </div>
          </div>
        </div>

        {/* Sidebar - ATS Feedback */}
        {currentFeedback && (
          <div className={`hidden w-80 flex-col gap-4 overflow-y-auto lg:flex`}>
            <div className={`rounded-2xl p-4 ${cardBase}`}>
              <h3 className="mb-3 font-semibold">Current Feedback</h3>

              {currentATS !== null && (
                <div className="mb-4">
                  <div className={`mb-2 flex items-center justify-between text-sm font-medium ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>
                    <span>ATS Score</span>
                    <span>{currentATS}/100</span>
                  </div>
                  <div className={`h-3 overflow-hidden rounded-full ${isDark ? 'bg-white/10' : 'bg-emerald-100'}`}>
                    <div
                      className={`h-full transition-all ${currentATS >= 75 ? (isDark ? 'bg-green-400' : 'bg-green-500') : currentATS >= 50 ? (isDark ? 'bg-yellow-400' : 'bg-yellow-500') : isDark ? 'bg-red-400' : 'bg-red-500'}`}
                      style={{ width: `${currentATS}%` }}
                    ></div>
                  </div>
                </div>
              )}

              {currentFeedback.strengths && currentFeedback.strengths.length > 0 && (
                <div className="mb-4">
                  <p className={`mb-2 text-xs font-semibold ${isDark ? 'text-green-300' : 'text-green-700'}`}>✓ Strengths</p>
                  <ul className={`space-y-1 text-xs ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                    {currentFeedback.strengths.map((item, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className={`flex-shrink-0 ${isDark ? 'text-green-400' : 'text-green-600'}`}>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentFeedback.improvements && currentFeedback.improvements.length > 0 && (
                <div className="mb-4">
                  <p className={`mb-2 text-xs font-semibold ${isDark ? 'text-yellow-300' : 'text-yellow-700'}`}>→ Improvements</p>
                  <ul className={`space-y-1 text-xs ${isDark ? 'text-emerald-200/70' : 'text-slate-600'}`}>
                    {currentFeedback.improvements.map((item, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className={`flex-shrink-0 ${isDark ? 'text-yellow-400' : 'text-yellow-600'}`}>•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {currentFeedback.skills && currentFeedback.skills.length > 0 && (
                <div>
                  <p className={`mb-2 text-xs font-semibold ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>Skills Found</p>
                  <div className="flex flex-wrap gap-2">
                    {currentFeedback.skills.slice(0, 5).map((skill, idx) => (
                      <span
                        key={idx}
                        className={`inline-block rounded-full px-3 py-1 text-xs font-medium ${
                          isDark
                            ? 'border border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
                            : 'border border-emerald-300 bg-emerald-50 text-emerald-700'
                        }`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatbotPage;
