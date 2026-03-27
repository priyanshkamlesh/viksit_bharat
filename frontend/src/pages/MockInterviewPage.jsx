import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  FaArrowRight,
  FaChartLine,
  FaCheckCircle,
  FaClock,
  FaHome,
  FaInbox,
  FaMoon,
  FaMicrophone,
  FaPlay,
  FaRobot,
  FaSignOutAlt,
  FaStop,
  FaSun,
  FaSyncAlt,
  FaUserCircle,
  FaUsers,
} from 'react-icons/fa';
import { useNavigate, useSearchParams } from 'react-router-dom';

import {
  analyzeConnectedMockInterview,
  connectMockInterview,
  continueAiMockInterview,
  fetchRecommendationUsers,
  fetchMockInterviewChat,
  fetchMockInterviewSession,
  fetchUserNotifications,
  fetchUserById,
  finishAiMockInterview,
  recordMockInterviewTurn,
  sendMockInterviewChatMessage,
  startAiMockInterview,
} from '../lib/api';
import { clearCurrentUser, readCurrentUser } from '../lib/currentUser';
import { recordConnection } from '../lib/dashboardStorage';

const DEFAULT_PEER_FORM = {
  userId: '1',
  partnerId: '2',
  askerId: '1',
  responderId: '2',
  question: '',
  answer: '',
};

const SpeechRecognitionImpl = typeof window !== 'undefined'
  ? window.SpeechRecognition || window.webkitSpeechRecognition
  : null;

const MockInterviewPage = ({ theme, setTheme }) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isDark = theme === 'dark';
  const profileMenuRef = useRef(null);
  const currentUser = useMemo(() => readCurrentUser(), []);
  const profileName = currentUser?.name || 'Collaborator Profile';
  const requestedPeerUserId = searchParams.get('userId');
  const requestedPeerPartnerId = searchParams.get('partnerId');
  const requestedSessionId = searchParams.get('sessionId');
  const requestedMode = searchParams.get('mode');
  const autoConnectRef = useRef(false);

  const [mode, setMode] = useState('peer');
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const [roster, setRoster] = useState([]);
  const [rosterLoading, setRosterLoading] = useState(false);
  const [rosterError, setRosterError] = useState('');
  const [peerForm, setPeerForm] = useState(DEFAULT_PEER_FORM);
  const [peerSession, setPeerSession] = useState(null);
  const [peerTurns, setPeerTurns] = useState([]);
  const [peerLiveUpdate, setPeerLiveUpdate] = useState(null);
  const [peerFinalFeedback, setPeerFinalFeedback] = useState(null);
  const [peerError, setPeerError] = useState('');
  const [peerLoading, setPeerLoading] = useState(false);
  const [peerDetails, setPeerDetails] = useState({ interviewer: null, partner: null });
  const [aiUserId, setAiUserId] = useState('1');
  const [aiUserDetails, setAiUserDetails] = useState(null);
  const [aiAnswer, setAiAnswer] = useState('');
  const [aiSession, setAiSession] = useState(null);
  const [aiRounds, setAiRounds] = useState([]);
  const [aiFinalFeedback, setAiFinalFeedback] = useState(null);
  const [aiError, setAiError] = useState('');
  const [aiLoading, setAiLoading] = useState(false);
  const [listeningTarget, setListeningTarget] = useState(null);
  const [voiceError, setVoiceError] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [peerChatMessages, setPeerChatMessages] = useState([]);
  const [peerChatDraft, setPeerChatDraft] = useState('');
  const [peerChatLoading, setPeerChatLoading] = useState(false);
  const [peerChatError, setPeerChatError] = useState('');
  const [peerChatSending, setPeerChatSending] = useState(false);
  const recognitionRef = useRef(null);
  const voiceBaseRef = useRef({ peer: '', ai: '' });

  const cardBase = isDark
    ? 'border border-emerald-400/12 bg-gradient-to-br from-white/8 via-white/5 to-white/[0.03] text-emerald-50 shadow-[0_28px_70px_rgba(0,0,0,0.32)] backdrop-blur-2xl'
    : 'border border-emerald-100 bg-gradient-to-br from-white/96 via-white/88 to-emerald-50/70 text-slate-800 shadow-[0_28px_70px_rgba(16,185,129,0.10)] backdrop-blur-2xl';

  const inputClass = isDark
    ? 'w-full rounded-2xl border border-white/10 bg-[#0b1711]/90 px-4 py-3 text-sm text-emerald-50 outline-none transition-colors placeholder:text-emerald-100/40 focus:border-emerald-300/40 focus:ring-2 focus:ring-emerald-400/15'
    : 'w-full rounded-2xl border border-emerald-100 bg-white px-4 py-3 text-sm text-slate-800 outline-none transition-colors placeholder:text-slate-400 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-200';

  const primaryButtonClass = isDark
    ? 'inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-emerald-300 to-lime-300 px-5 py-3 text-sm font-black text-[#052414] shadow-[0_16px_40px_rgba(74,222,128,0.22)] transition-all hover:scale-[1.01] hover:from-emerald-200 hover:to-lime-200 disabled:cursor-not-allowed disabled:opacity-60'
    : 'inline-flex items-center justify-center gap-3 rounded-full bg-gradient-to-r from-emerald-600 to-emerald-500 px-5 py-3 text-sm font-black text-white shadow-[0_16px_40px_rgba(16,185,129,0.22)] transition-all hover:scale-[1.01] hover:from-emerald-500 hover:to-lime-500 disabled:cursor-not-allowed disabled:opacity-60';

  const secondaryButtonClass = isDark
    ? 'inline-flex items-center justify-center gap-3 rounded-full bg-white/8 px-5 py-3 text-sm font-black text-white ring-1 ring-white/10 transition-all hover:bg-white/12 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60'
    : 'inline-flex items-center justify-center gap-3 rounded-full bg-white px-5 py-3 text-sm font-black text-slate-900 ring-1 ring-emerald-100 transition-all hover:bg-emerald-50 hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60';

  const enabledUsers = useMemo(
    () => roster.filter((user) => user.mock_interview_enabled),
    [roster],
  );

  const selectedPeerRoster = useMemo(() => {
    const interviewer = roster.find((user) => String(user.id) === String(peerForm.userId));
    const partner = roster.find((user) => String(user.id) === String(peerForm.partnerId));
    return { interviewer, partner };
  }, [peerForm.partnerId, peerForm.userId, roster]);

  const sessionPartnerNames = useMemo(() => {
    if (!peerSession?.participants) {
      return '';
    }

    return peerSession.participants.map((participant) => participant.name).join(' vs ');
  }, [peerSession]);

  const peerChatPartner = useMemo(() => {
    if (!peerSession?.participants?.length) {
      return { local: null, remote: null };
    }

    const signedInId = currentUser?.id ? String(currentUser.id) : '';
    const local = peerSession.participants.find((participant) => String(participant.id) === signedInId) || peerSession.participants[0] || null;
    const remote = peerSession.participants.find((participant) => String(participant.id) !== String(local?.id)) || peerSession.participants[1] || null;

    return { local, remote };
  }, [currentUser?.id, peerSession]);

  const progressSummary = useMemo(() => {
    if (mode === 'peer') {
      return [
        { label: 'Connected turns', value: peerTurns.length },
        { label: 'Live feedback cards', value: peerLiveUpdate?.live_feedback?.length || peerFinalFeedback?.feedback?.length || 0 },
        { label: 'Match score', value: peerSession?.compatibility_score ?? 'N/A' },
      ];
    }

    return [
      { label: 'Rounds completed', value: aiRounds.length },
      { label: 'Current status', value: aiSession?.status || 'idle' },
      { label: 'Final score', value: aiFinalFeedback?.overall_score ?? 'N/A' },
    ];
  }, [aiFinalFeedback?.overall_score, aiRounds.length, aiSession?.status, mode, peerFinalFeedback?.feedback?.length, peerLiveUpdate?.live_feedback?.length, peerSession?.compatibility_score, peerTurns.length]);

  useEffect(() => {
    let active = true;

    const loadRoster = async () => {
      setRosterLoading(true);
      setRosterError('');

      try {
        const result = await fetchRecommendationUsers();
        if (!active) return;
        setRoster(result.users || []);
      } catch (error) {
        if (!active) return;
        setRosterError('Could not load the interview roster from the backend.');
      } finally {
        if (active) {
          setRosterLoading(false);
        }
      }
    };

    loadRoster();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    if (!currentUser?.id) {
      setNotificationCount(0);
      return undefined;
    }

    let ignore = false;

    const loadNotifications = async () => {
      try {
        const data = await fetchUserNotifications(currentUser.id);
        if (!ignore) {
          setNotificationCount((data.notifications || []).filter((item) => item.status === 'pending').length);
        }
      } catch (error) {
        if (!ignore) {
          setNotificationCount(0);
        }
      }
    };

    loadNotifications();
    const interval = window.setInterval(loadNotifications, 10000);

    return () => {
      ignore = true;
      window.clearInterval(interval);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (!roster.length) {
      return;
    }

    const enabled = roster.filter((user) => user.mock_interview_enabled);
    if (!enabled.length) {
      return;
    }

    setPeerForm((current) => {
      const requestedUserExists = requestedPeerUserId
        && enabled.some((user) => String(user.id) === String(requestedPeerUserId));
      const requestedPartnerExists = requestedPeerPartnerId
        && enabled.some((user) => String(user.id) === String(requestedPeerPartnerId));
      const requestedPairIsValid = requestedUserExists && requestedPartnerExists && String(requestedPeerUserId) !== String(requestedPeerPartnerId);

      const currentUserId = requestedPairIsValid
        ? String(requestedPeerUserId)
        : roster.some((user) => String(user.id) === String(current.userId))
          ? current.userId
          : String(enabled[0].id);
      const fallbackPartner = enabled.find((user) => String(user.id) !== String(currentUserId)) || enabled[0];
      const currentPartnerId = requestedPairIsValid
        ? String(requestedPeerPartnerId)
        : roster.some((user) => String(user.id) === String(current.partnerId) && String(user.id) !== String(currentUserId))
          ? current.partnerId
          : String(fallbackPartner.id);

      return {
        ...current,
        userId: currentUserId,
        partnerId: currentPartnerId,
        askerId: String(current.askerId || currentUserId),
        responderId: String(current.responderId || currentPartnerId),
      };
    });

    if (requestedMode === 'peer') {
      setMode('peer');
    }

    setAiUserId((current) => {
      if (roster.some((user) => String(user.id) === String(current))) {
        return current;
      }
      return String(enabled[0].id);
    });
  }, [requestedMode, requestedPeerPartnerId, requestedPeerUserId, roster]);

  useEffect(() => {
    if (!requestedSessionId) {
      return undefined;
    }

    let active = true;

    const loadSession = async () => {
      try {
        const data = await fetchMockInterviewSession(requestedSessionId);
        if (!active || data.error || !data.session) {
          return;
        }

        const session = data.session;
        setPeerSession(session);
        setMode('peer');
        setPeerLoading(false);
        setPeerError('');
        setPeerTurns(session.turns || []);
        setPeerLiveUpdate(null);
        setPeerFinalFeedback(null);
        setPeerChatMessages(session.chat_messages || []);

        const participants = session.participants || [];
        const first = participants[0];
        const second = participants[1] || participants[0];
        if (first && second) {
          setPeerForm((current) => ({
            ...current,
            userId: String(first.id),
            partnerId: String(second.id),
            askerId: String(first.id),
            responderId: String(second.id),
          }));
        }

        autoConnectRef.current = true;
      } catch (error) {
        if (!active) {
          return;
        }
      }
    };

    loadSession();

    return () => {
      active = false;
    };
  }, [requestedSessionId]);

  useEffect(() => {
    if (!peerSession?.session_id) {
      setPeerChatMessages([]);
      setPeerChatError('');
      setPeerChatLoading(false);
      return undefined;
    }

    let ignore = false;

    const loadMessages = async () => {
      try {
        const data = await fetchMockInterviewChat(peerSession.session_id);
        if (!ignore) {
          setPeerChatMessages(data.messages || []);
          setPeerChatError('');
        }
      } catch (error) {
        if (!ignore) {
          setPeerChatError('Could not load live chat.');
        }
      } finally {
        if (!ignore) {
          setPeerChatLoading(false);
        }
      }
    };

    setPeerChatLoading(true);
    loadMessages();
    const interval = window.setInterval(loadMessages, 2500);

    return () => {
      ignore = true;
      window.clearInterval(interval);
    };
  }, [peerSession?.session_id]);

  useEffect(() => {
    if (
      requestedMode === 'peer'
      && requestedPeerUserId
      && requestedPeerPartnerId
      && !requestedSessionId
      && !peerSession
      && !peerLoading
      && !autoConnectRef.current
    ) {
      autoConnectRef.current = true;
      handleConnectSession();
    }
  }, [peerLoading, peerSession, requestedMode, requestedPeerPartnerId, requestedPeerUserId, requestedSessionId]);

  useEffect(() => {
    let active = true;
    const interviewerId = Number(peerForm.userId);
    const partnerId = Number(peerForm.partnerId);

    if (!interviewerId || !partnerId) {
      setPeerDetails({ interviewer: null, partner: null });
      return;
    }

    const loadPeerDetails = async () => {
      try {
        const [interviewerResponse, partnerResponse] = await Promise.all([
          fetchUserById(interviewerId),
          fetchUserById(partnerId),
        ]);

        if (!active) return;

        setPeerDetails({
          interviewer: interviewerResponse.user || null,
          partner: partnerResponse.user || null,
        });
      } catch (error) {
        if (!active) return;
        setPeerDetails({ interviewer: null, partner: null });
      }
    };

    loadPeerDetails();

    return () => {
      active = false;
    };
  }, [peerForm.partnerId, peerForm.userId]);

  useEffect(() => {
    let active = true;
    const userId = Number(aiUserId);

    if (!userId) {
      setAiUserDetails(null);
      return;
    }

    const loadAiUser = async () => {
      try {
        const response = await fetchUserById(userId);
        if (!active) return;
        setAiUserDetails(response.user || null);
      } catch (error) {
        if (!active) return;
        setAiUserDetails(null);
      }
    };

    loadAiUser();

    return () => {
      active = false;
    };
  }, [aiUserId]);

  const toggleTheme = () => {
    setTheme((current) => (current === 'light' ? 'dark' : 'light'));
  };

  const handleSwitchAccount = () => {
    setIsProfileMenuOpen(false);
    clearCurrentUser();
    navigate('/login');
  };

  const handleOpenProfile = () => {
    setIsProfileMenuOpen(false);
    navigate('/profile');
  };

  const handleLogout = () => {
    setIsProfileMenuOpen(false);
    clearCurrentUser();
    navigate('/login');
  };

  const stopVoiceCapture = () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
      } catch (error) {
        recognition.abort?.();
      }
    }

    recognitionRef.current = null;
    setListeningTarget(null);
  };

  useEffect(() => () => {
    const recognition = recognitionRef.current;
    if (recognition) {
      try {
        recognition.onresult = null;
        recognition.onerror = null;
        recognition.onend = null;
        recognition.stop();
      } catch (error) {
        recognition.abort?.();
      }
    }

    recognitionRef.current = null;
  }, []);

  const startVoiceCapture = (target) => {
    if (!SpeechRecognitionImpl) {
      setVoiceError('Voice input is not supported in this browser. Use Chrome or Edge for live speech recognition.');
      return;
    }

    if (listeningTarget === target) {
      stopVoiceCapture();
      return;
    }

    stopVoiceCapture();

    const recognition = new SpeechRecognitionImpl();
    const currentTarget = target;
    const baseValue = currentTarget === 'peer' ? peerForm.answer : aiAnswer;

    voiceBaseRef.current[currentTarget] = baseValue || '';
    recognition.lang = 'en-US';
    recognition.continuous = true;
    recognition.interimResults = true;

    recognition.onresult = (event) => {
      const transcript = Array.from(event.results)
        .map((result) => result?.[0]?.transcript || '')
        .join(' ')
        .replace(/\s+/g, ' ')
        .trim();

      const base = voiceBaseRef.current[currentTarget] || '';
      const value = [base, transcript].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();

      if (currentTarget === 'peer') {
        setPeerForm((current) => ({ ...current, answer: value }));
      } else {
        setAiAnswer(value);
      }
    };

    recognition.onerror = (event) => {
      const message = event.error === 'no-speech'
        ? 'No speech detected. Try speaking a little more clearly.'
        : 'Could not capture voice input. Please try again.';
      setVoiceError(message);
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setListeningTarget(null);
      }
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition) {
        recognitionRef.current = null;
        setListeningTarget(null);
      }
    };

    recognitionRef.current = recognition;
    setVoiceError('');
    setListeningTarget(target);

    try {
      recognition.start();
    } catch (error) {
      setVoiceError('Could not start voice capture in this browser session.');
      recognitionRef.current = null;
      setListeningTarget(null);
    }
  };

  const clearVoiceAnswer = (target) => {
    if (target === 'peer') {
      setPeerForm((current) => ({ ...current, answer: '' }));
    } else {
      setAiAnswer('');
    }
    voiceBaseRef.current[target] = '';
  };

  const selectPeerUser = (selectedUserId) => {
    const selected = String(selectedUserId);
    setPeerForm((current) => {
      const update = { ...current };
      if (!current.userId || current.userId === selected || current.partnerId === selected) {
        update.userId = selected;
        update.askerId = selected;
        if (current.partnerId === selected) {
          const alternate = enabledUsers.find((user) => String(user.id) !== selected);
          update.partnerId = String(alternate?.id || selected);
          update.responderId = String(alternate?.id || selected);
        }
        return update;
      }

      update.partnerId = selected;
      update.responderId = selected;
      return update;
    });
    setMode('peer');
  };

  const selectAiUser = (selectedUserId) => {
    setAiUserId(String(selectedUserId));
    setMode('ai');
  };

  const swapPeerUsers = () => {
    setPeerForm((current) => ({
      ...current,
      userId: String(current.partnerId),
      partnerId: String(current.userId),
      askerId: String(current.responderId),
      responderId: String(current.askerId),
    }));
  };

  const handleConnectSession = async () => {
    setPeerLoading(true);
    setPeerError('');

    try {
      const session = await connectMockInterview(Number(peerForm.userId), Number(peerForm.partnerId));
      if (session.error) {
        setPeerError(session.error);
        return;
      }

      setPeerSession(session);
      setPeerTurns([]);
      setPeerLiveUpdate(null);
      setPeerFinalFeedback(null);
      setPeerForm((current) => ({
        ...current,
        askerId: current.userId,
        responderId: current.partnerId,
      }));

      const currentUser = readCurrentUser();
      if (currentUser?.id) {
        recordConnection(currentUser.id, {
          sessionId: session.session_id,
          partnerId: current.partnerId,
          partnerName: selectedPeerRoster.partner?.name || `User ${current.partnerId}`,
          mode: 'mock interview',
        });
      }
    } catch (error) {
      setPeerError('Could not connect mock interview users.');
    } finally {
      setPeerLoading(false);
    }
  };

  const handleRecordTurn = async () => {
    if (!peerSession?.session_id) {
      setPeerError('Connect two users before recording a mock interview turn.');
      return;
    }

    setPeerLoading(true);
    setPeerError('');

    try {
      const update = await recordMockInterviewTurn(
        peerSession.session_id,
        Number(peerForm.askerId),
        Number(peerForm.responderId),
        peerForm.question,
        peerForm.answer,
      );

      if (update.error) {
        setPeerError(update.error);
        return;
      }

      setPeerLiveUpdate(update);
      setPeerTurns((current) => [...current, update.latest_turn]);
      setPeerForm((current) => ({
        ...current,
        question: '',
        answer: '',
      }));
    } catch (error) {
      setPeerError('Could not record the interview turn.');
    } finally {
      setPeerLoading(false);
    }
  };

  const handleFinishPeerSession = async () => {
    if (!peerSession?.session_id) {
      return;
    }

    setPeerLoading(true);
    setPeerError('');

    try {
      const feedback = await analyzeConnectedMockInterview(peerSession.session_id);
      if (feedback.error) {
        setPeerError(feedback.error);
        return;
      }
      setPeerFinalFeedback(feedback);
    } catch (error) {
      setPeerError('Could not analyze the connected mock interview.');
    } finally {
      setPeerLoading(false);
    }
  };

  const handleSendPeerChat = async () => {
    if (!peerSession?.session_id || !peerChatDraft.trim()) {
      return;
    }

    const senderId = Number(peerChatPartner.local?.id || currentUser?.id || peerForm.userId);
    const recipientId = Number(peerChatPartner.remote?.id || (String(senderId) === String(peerForm.userId) ? peerForm.partnerId : peerForm.userId));

    if (!senderId || !recipientId) {
      setPeerChatError('Open a connected session before sending a message.');
      return;
    }

    setPeerChatSending(true);
    setPeerChatError('');

    try {
      const response = await sendMockInterviewChatMessage(peerSession.session_id, senderId, recipientId, peerChatDraft);
      if (response.error) {
        setPeerChatError(response.error);
        return;
      }

      setPeerChatMessages(response.messages || []);
      setPeerChatDraft('');
    } catch (error) {
      setPeerChatError('Could not send the chat message.');
    } finally {
      setPeerChatSending(false);
    }
  };

  const handleStartAiSession = async () => {
    setAiLoading(true);
    setAiError('');

    try {
      const session = await startAiMockInterview(Number(aiUserId));
      if (session.error) {
        setAiError(session.error);
        return;
      }

      setAiSession(session);
      setAiRounds([]);
      setAiFinalFeedback(null);
      setAiAnswer('');
    } catch (error) {
      setAiError('Could not start AI mock interview.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleSubmitAiAnswer = async () => {
    if (!aiSession?.session_id || !aiAnswer.trim()) {
      return;
    }

    setAiLoading(true);
    setAiError('');

    try {
      const result = await continueAiMockInterview(aiSession.session_id, aiAnswer);
      if (result.error) {
        setAiError(result.error);
        return;
      }

      setAiRounds((current) => [
        ...current,
        {
          question: aiSession.current_question || aiSession.opening_question,
          answer: aiAnswer,
          feedback: result.round_feedback,
          roundNumber: result.round_number,
          nextQuestion: result.next_question,
        },
      ]);
      setAiSession((current) => ({
        ...current,
        current_question: result.next_question,
        status: result.status,
      }));
      setAiAnswer('');
    } catch (error) {
      setAiError('Could not send answer to AI mock interview.');
    } finally {
      setAiLoading(false);
    }
  };

  const handleFinishAiSession = async () => {
    if (!aiSession?.session_id) {
      return;
    }

    setAiLoading(true);
    setAiError('');

    try {
      const result = await finishAiMockInterview(aiSession.session_id);
      if (result.error) {
        setAiError(result.error);
        return;
      }
      setAiFinalFeedback(result.feedback);
      setAiSession((current) => ({
        ...current,
        status: result.status,
      }));
    } catch (error) {
      setAiError('Could not finish AI mock interview.');
    } finally {
      setAiLoading(false);
    }
  };

  const renderUserCard = (user, actionLabel, onClick) => (
    <button
      key={user.id}
      type="button"
      onClick={onClick}
      className={`group rounded-[1.5rem] border p-4 text-left transition-all hover:-translate-y-1 hover:shadow-[0_18px_45px_rgba(16,185,129,0.10)] ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-base font-black">{user.name}</p>
          <p className={`mt-1 text-xs font-semibold uppercase tracking-[0.25em] ${isDark ? 'text-emerald-100/55' : 'text-emerald-700/80'}`}>
            {user.location || 'Location not set'}
          </p>
        </div>
        <span
          className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ${
            user.mock_interview_enabled
              ? isDark
                ? 'bg-emerald-400/15 text-emerald-200'
                : 'bg-emerald-50 text-emerald-700'
              : isDark
                ? 'bg-white/10 text-emerald-100/60'
                : 'bg-slate-100 text-slate-500'
          }`}
        >
          {user.mock_interview_enabled ? 'Enabled' : 'Disabled'}
        </span>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {(user.interests || []).slice(0, 3).map((interest) => (
          <span
            key={interest}
            className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/10 text-emerald-100/75' : 'bg-emerald-50 text-emerald-700'}`}
          >
            {interest}
          </span>
        ))}
      </div>
      <div className={`mt-4 rounded-2xl px-4 py-3 text-sm ${isDark ? 'bg-black/15 text-emerald-50/70' : 'bg-emerald-50/50 text-slate-600'}`}>
        {actionLabel}
      </div>
    </button>
  );

  const sessionModeLabel = mode === 'peer' ? 'Peer Mock Interview' : 'AI Practice';

  return (
    <div className={`relative min-h-dvh w-full overflow-x-hidden overflow-y-auto transition-colors duration-500 ${isDark ? 'bg-[#050f0a] text-white' : 'bg-[#f0fdf4] text-slate-900'}`}>
      <div className={`pointer-events-none absolute inset-0 overflow-hidden ${isDark ? 'opacity-100' : 'opacity-90'}`}>
        <div className="absolute -left-28 top-8 h-72 w-72 rounded-full bg-emerald-400/12 blur-3xl" />
        <div className="absolute right-0 top-40 h-96 w-96 rounded-full bg-lime-400/10 blur-3xl" />
        <div className="absolute bottom-0 left-1/3 h-80 w-80 rounded-full bg-teal-400/10 blur-3xl" />
      </div>

      <div className="relative mx-auto flex min-h-dvh w-full max-w-7xl flex-col px-5 py-5 sm:px-8">
        <nav className={`sticky top-5 z-20 flex items-center justify-between rounded-full px-5 py-4 backdrop-blur-2xl ${isDark ? 'border border-emerald-400/15 bg-[#07110c]/78 shadow-[0_14px_40px_rgba(0,0,0,0.2)]' : 'border border-white/70 bg-white/88 shadow-[0_14px_40px_rgba(16,185,129,0.08)]'}`}>
          <div>
            <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`}>SkillNet</p>
            <h1 className={`text-lg font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>Mock Interview Lab</h1>
          </div>

          <div className="flex items-center gap-3">
            <button type="button" onClick={() => navigate('/home')} className={secondaryButtonClass}>
              <FaHome />
              Home
            </button>

            <button type="button" onClick={() => navigate('/dashboard')} className={secondaryButtonClass}>
              <FaChartLine />
              Dashboard
            </button>

            <button type="button" onClick={() => navigate('/inbox')} className={`${secondaryButtonClass} relative`}>
              <FaInbox />
              Inbox
              {notificationCount > 0 ? (
                <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-rose-500 px-1.5 py-0.5 text-[10px] font-black text-white">
                  {notificationCount}
                </span>
              ) : null}
            </button>

            <button type="button" onClick={() => navigate('/interview')} className={secondaryButtonClass}>
              <FaArrowRight />
              Interview
            </button>

            <button type="button" onClick={toggleTheme} className={secondaryButtonClass}>
              {isDark ? <FaSun /> : <FaMoon />}
              {isDark ? 'Light' : 'Dark'}
            </button>

            <div className="relative" ref={profileMenuRef}>
              <button type="button" onClick={() => setIsProfileMenuOpen((current) => !current)} className={secondaryButtonClass}>
                <FaUserCircle className="text-lg" />
                Profile
              </button>

              {isProfileMenuOpen ? (
                <div className={`absolute right-0 top-[calc(100%+0.75rem)] z-20 min-w-60 overflow-hidden rounded-2xl border backdrop-blur-2xl ${isDark ? 'border-emerald-500/20 bg-[#0b1711]/95 shadow-[0_24px_50px_rgba(0,0,0,0.35)]' : 'border-emerald-100 bg-white/95 shadow-[0_24px_50px_rgba(16,185,129,0.12)]'}`}>
                  <div className={`flex items-center gap-3 px-4 py-3 ${isDark ? 'border-b border-white/10 text-emerald-100' : 'border-b border-emerald-100 text-slate-700'}`}>
                    <FaUserCircle className={`text-2xl ${isDark ? 'text-emerald-300' : 'text-emerald-700'}`} />
                    <button
                      type="button"
                      onClick={handleOpenProfile}
                      className="text-left"
                    >
                      <p className="text-sm font-bold underline decoration-transparent underline-offset-4 transition-all hover:decoration-current">
                        {profileName}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-emerald-100/60' : 'text-slate-500'}`}>Open collaboration profile</p>
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSwitchAccount}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${isDark ? 'text-emerald-100 hover:bg-white/5' : 'text-slate-700 hover:bg-emerald-50'}`}
                  >
                    <FaSyncAlt className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />
                    Switch Account
                  </button>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className={`flex w-full items-center gap-3 px-4 py-3 text-left text-sm font-semibold transition-colors ${isDark ? 'text-amber-200 hover:bg-white/5' : 'text-amber-700 hover:bg-amber-50'}`}
                  >
                    <FaSignOutAlt />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </nav>

        <main className="relative flex flex-1 items-start justify-center py-8">
          <div className="w-full space-y-6">
            <section className={`relative overflow-hidden rounded-[2rem] p-8 ${cardBase}`}>
              <div className={`pointer-events-none absolute inset-0 ${isDark ? 'opacity-100' : 'opacity-70'}`}>
                <div className="absolute -right-12 top-0 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl" />
                <div className="absolute left-1/3 top-1/3 h-40 w-40 rounded-full bg-lime-400/10 blur-3xl" />
              </div>

              <div className="relative flex flex-wrap items-start justify-between gap-6">
                <div className="max-w-3xl">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className={`text-xs font-bold uppercase tracking-[0.35em] ${isDark ? 'text-emerald-300/80' : 'text-emerald-700'}`}>Backend driven workflow</p>
                    <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.24em] ${isDark ? 'bg-emerald-400/10 text-emerald-200 ring-1 ring-emerald-400/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                      {sessionModeLabel}
                    </span>
                  </div>
                  <h2 className="mt-4 text-4xl font-black tracking-tight sm:text-5xl">
                    Run peer mock interviews or practice with the AI bot.
                  </h2>
                  <p className={`mt-4 max-w-2xl text-base leading-7 ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                    This workspace keeps peer sessions, live chat, voice answers, and AI practice in one place so you can move from invite to conversation without friction.
                  </p>
                  <p className={`mt-3 text-sm font-medium ${isDark ? 'text-emerald-100/65' : 'text-slate-500'}`}>
                    Voice input is used for answers, and the browser turns your speech into transcript text behind the scenes.
                  </p>

                  <div className="mt-6 grid gap-3 sm:grid-cols-3">
                    {progressSummary.map((item) => (
                      <div key={item.label} className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-white ring-1 ring-emerald-100'}`}>
                        <p className={`text-[11px] font-bold uppercase tracking-[0.28em] ${isDark ? 'text-emerald-100/55' : 'text-emerald-700/80'}`}>{item.label}</p>
                        <p className="mt-2 text-xl font-black">{item.value}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className={`relative overflow-hidden rounded-[1.75rem] p-5 ${isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-white ring-1 ring-emerald-100'}`}>
                  <div className="absolute inset-0 bg-gradient-to-br from-emerald-400/10 via-transparent to-lime-400/10" />
                  <div className="relative grid min-w-[240px] gap-3">
                    <div className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-black/20' : 'bg-emerald-50/70'}`}>
                      <p className={`text-[11px] font-black uppercase tracking-[0.28em] ${isDark ? 'text-emerald-100/55' : 'text-emerald-700/80'}`}>Live state</p>
                      <p className="mt-2 text-lg font-black">{peerSession?.status || aiSession?.status || 'idle'}</p>
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-black/20' : 'bg-emerald-50/70'}`}>
                      <p className={`text-[11px] font-black uppercase tracking-[0.28em] ${isDark ? 'text-emerald-100/55' : 'text-emerald-700/80'}`}>Pending invites</p>
                      <p className="mt-2 text-lg font-black">{notificationCount}</p>
                    </div>
                    <div className={`rounded-2xl px-4 py-3 ${isDark ? 'bg-black/20' : 'bg-emerald-50/70'}`}>
                      <p className={`text-[11px] font-black uppercase tracking-[0.28em] ${isDark ? 'text-emerald-100/55' : 'text-emerald-700/80'}`}>Current user</p>
                      <p className="mt-2 text-lg font-black">{currentUser?.name || 'Not signed in'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`relative mt-6 inline-flex rounded-full p-1 ${isDark ? 'bg-white/5 ring-1 ring-white/10' : 'bg-emerald-50 ring-1 ring-emerald-100'}`}>
                <button
                  type="button"
                  onClick={() => setMode('peer')}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${mode === 'peer'
                    ? isDark
                      ? 'bg-emerald-400 text-[#052414]'
                      : 'bg-emerald-600 text-white'
                    : isDark
                      ? 'text-emerald-100'
                      : 'text-emerald-700'
                  }`}
                >
                  Peer Session
                </button>
                <button
                  type="button"
                  onClick={() => setMode('ai')}
                  className={`rounded-full px-5 py-2 text-sm font-bold transition-all ${mode === 'ai'
                    ? isDark
                      ? 'bg-emerald-400 text-[#052414]'
                      : 'bg-emerald-600 text-white'
                    : isDark
                      ? 'text-emerald-100'
                      : 'text-emerald-700'
                  }`}
                >
                  AI Practice
                </button>
              </div>
            </section>

            <div className="grid gap-6 xl:grid-cols-[0.9fr_1.05fr_1fr]">
              <section className={`rounded-[2rem] p-6 ${cardBase}`}>
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-3">
                      <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-emerald-400/10 text-emerald-300' : 'bg-emerald-100 text-emerald-700'}`}>
                        <FaUsers />
                      </div>
                      <div>
                        <h3 className="text-2xl font-black">Interview Roster</h3>
                        <p className={isDark ? 'text-emerald-50/60' : 'text-slate-600'}>
                          Enabled users are ready for peer sessions.
                        </p>
                      </div>
                    </div>
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-black uppercase tracking-[0.2em] ${isDark ? 'bg-white/10 text-emerald-100' : 'bg-emerald-50 text-emerald-700'}`}>
                    {roster.length} users
                  </span>
                </div>

                {rosterLoading ? (
                  <div className={`mt-6 rounded-2xl p-4 text-sm ${isDark ? 'bg-white/5 text-emerald-50/70' : 'bg-emerald-50/60 text-slate-600'}`}>
                    Loading interview-ready users from the backend...
                  </div>
                ) : null}

                {rosterError ? (
                  <div className={`mt-4 rounded-2xl px-4 py-3 text-sm font-semibold ${isDark ? 'bg-rose-500/10 text-rose-200 ring-1 ring-rose-400/20' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'}`}>
                    {rosterError}
                  </div>
                ) : null}

                <div className="mt-5 space-y-3">
                  {enabledUsers.map((user) => (
                    <div key={user.id} className={`rounded-[1.5rem] border p-4 ${isDark ? 'border-white/10 bg-black/10' : 'border-emerald-100 bg-white'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="text-base font-black">{user.name}</p>
                          <p className={`mt-1 text-sm ${isDark ? 'text-emerald-50/65' : 'text-slate-600'}`}>
                            {user.location || 'Location not set'} {user.goal ? `, ${user.goal}` : ''}
                          </p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] ${isDark ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                          Mock Interview On
                        </span>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-2">
                        {(user.interests || []).slice(0, 3).map((interest) => (
                          <span key={interest} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/10 text-emerald-100/75' : 'bg-emerald-50 text-emerald-700'}`}>
                            {interest}
                          </span>
                        ))}
                      </div>

                      <div className="mt-4 grid grid-cols-2 gap-3">
                        <button type="button" className={secondaryButtonClass} onClick={() => selectPeerUser(user.id)}>
                          <FaUsers />
                          Use in Peer
                        </button>
                        <button type="button" className={secondaryButtonClass} onClick={() => selectAiUser(user.id)}>
                          <FaRobot />
                          Use in AI
                        </button>
                      </div>
                    </div>
                  ))}

                  {!rosterLoading && !enabledUsers.length ? (
                    <div className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5 text-emerald-100' : 'border-emerald-100 bg-emerald-50/40 text-slate-600'}`}>
                      No enabled mock interview users were found.
                    </div>
                  ) : null}
                </div>
              </section>

              {mode === 'peer' ? (
                <section className={`rounded-[2rem] p-6 ${cardBase}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-fuchsia-400/10 text-fuchsia-300' : 'bg-fuchsia-100 text-fuchsia-700'}`}>
                      <FaChartLine />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black">Peer Session Builder</h3>
                      <p className={isDark ? 'text-emerald-50/65' : 'text-slate-600'}>
                        Connect two enabled users, record turns, then analyze the transcript.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-bold">Interviewer ID</span>
                      <input className={inputClass} value={peerForm.userId} onChange={(event) => setPeerForm((current) => ({ ...current, userId: event.target.value }))} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-bold">Partner ID</span>
                      <input className={inputClass} value={peerForm.partnerId} onChange={(event) => setPeerForm((current) => ({ ...current, partnerId: event.target.value }))} />
                    </label>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-3">
                    <button type="button" onClick={handleConnectSession} className={primaryButtonClass} disabled={peerLoading}>
                      <FaPlay />
                      Connect Users
                    </button>
                    <button type="button" onClick={swapPeerUsers} className={secondaryButtonClass} disabled={peerLoading}>
                      <FaSyncAlt />
                      Swap Roles
                    </button>
                    {peerSession ? (
                      <span className={`rounded-full px-4 py-3 text-sm font-semibold ${isDark ? 'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                        Session: {peerSession.session_id}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-6 grid gap-4 lg:grid-cols-2">
                    <div className={`rounded-[1.5rem] border p-4 ${isDark ? 'border-white/10 bg-black/10' : 'border-emerald-100 bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-[0.28em]">Interviewer Profile</h4>
                        <FaUserCircle className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />
                      </div>
                      <p className="mt-3 text-lg font-black">{peerDetails.interviewer?.name || selectedPeerRoster.interviewer?.name || 'Select user'}</p>
                      <p className={`mt-1 text-sm ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                        {peerDetails.interviewer?.mock_interview?.target_role || 'Target role not loaded'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(peerDetails.interviewer?.mock_interview?.focus_areas || []).slice(0, 4).map((focus) => (
                          <span key={focus} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/10 text-emerald-100/75' : 'bg-emerald-50 text-emerald-700'}`}>
                            {focus}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className={`rounded-[1.5rem] border p-4 ${isDark ? 'border-white/10 bg-black/10' : 'border-emerald-100 bg-white'}`}>
                      <div className="flex items-center justify-between">
                        <h4 className="text-sm font-black uppercase tracking-[0.28em]">Responder Profile</h4>
                        <FaCheckCircle className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />
                      </div>
                      <p className="mt-3 text-lg font-black">{peerDetails.partner?.name || selectedPeerRoster.partner?.name || 'Select user'}</p>
                      <p className={`mt-1 text-sm ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                        {peerDetails.partner?.mock_interview?.target_role || 'Target role not loaded'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(peerDetails.partner?.mock_interview?.focus_areas || []).slice(0, 4).map((focus) => (
                          <span key={focus} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/10 text-emerald-100/75' : 'bg-emerald-50 text-emerald-700'}`}>
                            {focus}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid gap-4 md:grid-cols-2">
                    <label className="space-y-2">
                      <span className="text-sm font-bold">Asker ID</span>
                      <input className={inputClass} value={peerForm.askerId} onChange={(event) => setPeerForm((current) => ({ ...current, askerId: event.target.value }))} />
                    </label>
                    <label className="space-y-2">
                      <span className="text-sm font-bold">Responder ID</span>
                      <input className={inputClass} value={peerForm.responderId} onChange={(event) => setPeerForm((current) => ({ ...current, responderId: event.target.value }))} />
                    </label>
                    <label className="space-y-2 md:col-span-2">
                      <span className="text-sm font-bold">Question</span>
                      <textarea className={inputClass} rows="3" value={peerForm.question} onChange={(event) => setPeerForm((current) => ({ ...current, question: event.target.value }))} />
                    </label>
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold">Answer by voice</span>
                        <span className={`text-xs font-semibold ${isDark ? 'text-emerald-100/55' : 'text-slate-500'}`}>
                          {listeningTarget === 'peer' ? 'Listening now' : 'Tap the mic and speak your answer'}
                        </span>
                      </div>
                      <div className={`mt-2 rounded-[1.5rem] border p-4 ${isDark ? 'border-white/10 bg-black/10' : 'border-emerald-100 bg-white'}`}>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startVoiceCapture('peer')}
                            className={listeningTarget === 'peer' ? primaryButtonClass : secondaryButtonClass}
                          disabled={!SpeechRecognitionImpl}
                        >
                            {listeningTarget === 'peer' ? <FaStop /> : <FaMicrophone />}
                            {listeningTarget === 'peer' ? 'Stop Recording' : 'Start Recording'}
                          </button>
                          <button type="button" onClick={() => clearVoiceAnswer('peer')} className={secondaryButtonClass}>
                            Clear Answer
                          </button>
                        </div>

                        <div className={`mt-4 rounded-2xl border px-4 py-4 text-sm leading-7 ${isDark ? 'border-white/10 bg-white/5 text-emerald-50/80' : 'border-emerald-100 bg-emerald-50/40 text-slate-700'}`}>
                          {peerForm.answer?.trim()
                            ? peerForm.answer
                            : 'Your spoken answer will appear here as a live transcript.'}
                        </div>
                      </div>
                    </div>
                  </div>

                  {voiceError ? (
                    <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${isDark ? 'bg-amber-500/10 text-amber-100 ring-1 ring-amber-400/20' : 'bg-amber-50 text-amber-800 ring-1 ring-amber-100'}`}>
                      {voiceError}
                    </div>
                  ) : null}

                  {peerError ? (
                    <div className={`mt-5 rounded-2xl px-4 py-3 text-sm font-semibold ${isDark ? 'bg-rose-500/10 text-rose-200 ring-1 ring-rose-400/20' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'}`}>
                      {peerError}
                    </div>
                  ) : null}

                  <div className="mt-5 flex flex-wrap gap-3">
                    <button type="button" onClick={handleRecordTurn} className={primaryButtonClass} disabled={peerLoading || !peerSession}>
                      Save Turn
                    </button>
                    <button type="button" onClick={handleFinishPeerSession} className={secondaryButtonClass} disabled={peerLoading || !peerSession}>
                      Analyze Session
                    </button>
                  </div>
                </section>
              ) : (
                <section className={`rounded-[2rem] p-6 ${cardBase}`}>
                  <div className="flex items-center gap-3">
                    <div className={`flex h-12 w-12 items-center justify-center rounded-2xl ${isDark ? 'bg-sky-400/10 text-sky-300' : 'bg-sky-100 text-sky-700'}`}>
                      <FaRobot />
                    </div>
                    <div>
                      <h3 className="text-2xl font-black">AI Practice Session</h3>
                      <p className={isDark ? 'text-emerald-50/65' : 'text-slate-600'}>
                        Start a session, answer the generated question, then finish for summary feedback.
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 space-y-4">
                    <label className="space-y-2">
                      <span className="text-sm font-bold">User ID</span>
                      <input className={inputClass} value={aiUserId} onChange={(event) => setAiUserId(event.target.value)} />
                    </label>

                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={handleStartAiSession} className={primaryButtonClass} disabled={aiLoading}>
                        <FaPlay />
                        Start AI Session
                      </button>
                      {aiSession?.session_id ? (
                        <span className={`rounded-full px-4 py-3 text-sm font-semibold ${isDark ? 'bg-emerald-500/10 text-emerald-200 ring-1 ring-emerald-400/20' : 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100'}`}>
                          Session: {aiSession.session_id}
                        </span>
                      ) : null}
                    </div>

                    <div className={`rounded-[1.5rem] border p-4 ${isDark ? 'border-white/10 bg-black/10' : 'border-emerald-100 bg-white'}`}>
                      <div className="flex items-center justify-between gap-3">
                        <h4 className="text-sm font-black uppercase tracking-[0.28em]">Selected Candidate</h4>
                        <FaClock className={isDark ? 'text-emerald-300' : 'text-emerald-700'} />
                      </div>
                      <p className="mt-3 text-lg font-black">{aiUserDetails?.name || 'Choose a user'}</p>
                      <p className={`mt-1 text-sm ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                        {aiUserDetails?.mock_interview?.target_role || 'Target role not loaded'}
                      </p>
                      <div className="mt-3 flex flex-wrap gap-2">
                        {(aiUserDetails?.mock_interview?.focus_areas || []).slice(0, 4).map((focus) => (
                          <span key={focus} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/10 text-emerald-100/75' : 'bg-emerald-50 text-emerald-700'}`}>
                            {focus}
                          </span>
                        ))}
                      </div>
                    </div>

                    {aiSession?.opening_question || aiSession?.current_question ? (
                      <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/40'}`}>
                        <p className="text-sm font-black">Current AI Question</p>
                        <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>
                          {aiSession.current_question || aiSession.opening_question}
                        </p>
                      </div>
                    ) : null}

                    <div className="space-y-2">
                      <div className="flex items-center justify-between gap-3">
                        <span className="text-sm font-bold">Your Answer by Voice</span>
                        <span className={`text-xs font-semibold ${isDark ? 'text-emerald-100/55' : 'text-slate-500'}`}>
                          {listeningTarget === 'ai' ? 'Listening now' : 'Press the mic and answer out loud'}
                        </span>
                      </div>
                      <div className={`rounded-[1.5rem] border p-4 ${isDark ? 'border-white/10 bg-black/10' : 'border-emerald-100 bg-white'}`}>
                        <div className="flex flex-wrap items-center gap-3">
                          <button
                            type="button"
                            onClick={() => startVoiceCapture('ai')}
                            className={listeningTarget === 'ai' ? primaryButtonClass : secondaryButtonClass}
                            disabled={!SpeechRecognitionImpl}
                          >
                            {listeningTarget === 'ai' ? <FaStop /> : <FaMicrophone />}
                            {listeningTarget === 'ai' ? 'Stop Recording' : 'Start Recording'}
                          </button>
                          <button type="button" onClick={() => clearVoiceAnswer('ai')} className={secondaryButtonClass}>
                            Clear Answer
                          </button>
                        </div>

                        <div className={`mt-4 rounded-2xl border px-4 py-4 text-sm leading-7 ${isDark ? 'border-white/10 bg-white/5 text-emerald-50/80' : 'border-emerald-100 bg-emerald-50/40 text-slate-700'}`}>
                          {aiAnswer?.trim()
                            ? aiAnswer
                            : 'Your spoken answer will appear here as a live transcript.'}
                        </div>
                      </div>
                    </div>

                    {aiError ? (
                      <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${isDark ? 'bg-rose-500/10 text-rose-200 ring-1 ring-rose-400/20' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'}`}>
                        {aiError}
                      </div>
                    ) : null}

                    <div className="flex flex-wrap gap-3">
                      <button type="button" onClick={handleSubmitAiAnswer} className={primaryButtonClass} disabled={aiLoading || !aiSession}>
                        Submit Answer
                      </button>
                      <button type="button" onClick={handleFinishAiSession} className={secondaryButtonClass} disabled={aiLoading || !aiSession}>
                        Finish AI Session
                      </button>
                    </div>
                  </div>
                </section>
              )}

              <section className={`rounded-[2rem] p-6 ${cardBase}`}>
                <h3 className="text-2xl font-black">
                  {mode === 'peer' ? 'Peer Transcript and Feedback' : 'AI Round Feedback'}
                </h3>
                <p className={`mt-2 text-sm leading-6 ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                  {mode === 'peer'
                    ? 'Each saved turn updates the live transcript, and analyzing the session returns feedback for both participants.'
                    : 'Each answer gets round feedback, and finishing the session returns a summarized practice report.'}
                </p>

                {mode === 'peer' ? (
                  <div className="mt-5 space-y-4">
                    {peerSession ? (
                      <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/40'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black">Session Status</p>
                            <p className={`mt-1 text-sm ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                              {peerSession.status} {sessionPartnerNames ? `- ${sessionPartnerNames}` : ''}
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                            Score {peerSession.compatibility_score}
                          </span>
                        </div>

                        <div className="mt-4 flex flex-wrap gap-2">
                          {(peerSession.match_reasons || []).map((reason) => (
                            <span key={reason} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/10 text-emerald-100/75' : 'bg-white text-slate-600 ring-1 ring-emerald-100'}`}>
                              {reason}
                            </span>
                          ))}
                        </div>
                      </div>
                    ) : null}

                    {peerSession ? (
                      <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/40'}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <p className="text-sm font-black">Live Chat</p>
                            <p className={`mt-1 text-sm ${isDark ? 'text-emerald-50/70' : 'text-slate-600'}`}>
                              Messages sync for the accepted connection in near real time.
                            </p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                            {peerChatMessages.length} messages
                          </span>
                        </div>

                        <div className="mt-4 max-h-72 space-y-3 overflow-y-auto pr-1">
                          {peerChatLoading ? (
                            <div className={`rounded-2xl border p-3 text-sm ${isDark ? 'border-white/10 bg-white/5 text-emerald-100/70' : 'border-emerald-100 bg-white text-slate-600'}`}>
                              Loading live chat...
                            </div>
                          ) : peerChatMessages.length ? (
                            peerChatMessages.map((item) => {
                              const isMine = String(item.sender_id) === String(currentUser?.id || peerChatPartner.local?.id);
                              return (
                                <div key={item.id} className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}>
                                  <div className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm ${isMine ? (isDark ? 'bg-emerald-400 text-slate-950' : 'bg-emerald-600 text-white') : (isDark ? 'bg-white/10 text-emerald-50' : 'bg-white text-slate-700 ring-1 ring-emerald-100')}`}>
                                    <p className="text-[11px] font-black uppercase tracking-[0.2em] opacity-70">
                                      {isMine ? 'You' : (peerChatPartner.remote?.name || 'Collaborator')}
                                    </p>
                                    <p className="mt-1 leading-6">{item.message}</p>
                                    <p className="mt-2 text-[11px] opacity-60">
                                      {item.created_at ? new Date(item.created_at).toLocaleTimeString() : ''}
                                    </p>
                                  </div>
                                </div>
                              );
                            })
                          ) : (
                            <div className={`rounded-2xl border p-3 text-sm ${isDark ? 'border-white/10 bg-white/5 text-emerald-100/70' : 'border-emerald-100 bg-white text-slate-600'}`}>
                              No chat messages yet. Say hello to start the conversation.
                            </div>
                          )}
                        </div>

                        <div className="mt-4 space-y-3">
                          <textarea
                            className={inputClass}
                            rows="3"
                            value={peerChatDraft}
                            onChange={(event) => setPeerChatDraft(event.target.value)}
                            placeholder="Type a message to your collaborator..."
                          />
                          {peerChatError ? (
                            <div className={`rounded-2xl px-4 py-3 text-sm font-semibold ${isDark ? 'bg-rose-500/10 text-rose-200 ring-1 ring-rose-400/20' : 'bg-rose-50 text-rose-700 ring-1 ring-rose-100'}`}>
                              {peerChatError}
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-3">
                            <button
                              type="button"
                              onClick={handleSendPeerChat}
                              disabled={!peerSession?.session_id || peerChatSending}
                              className={primaryButtonClass}
                            >
                              Send Message
                            </button>
                            <button
                              type="button"
                              onClick={() => setPeerChatDraft('')}
                              className={secondaryButtonClass}
                            >
                              Clear
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className={`rounded-2xl border p-4 text-sm ${isDark ? 'border-white/10 bg-white/5 text-emerald-100/70' : 'border-emerald-100 bg-white text-slate-600'}`}>
                        Connect users first to unlock the live chat panel.
                      </div>
                    )}

                    {peerTurns.length ? (
                      peerTurns.map((turn, index) => (
                        <article key={`${turn.asker_id}-${index}`} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/40'}`}>
                          <p className="text-sm font-black">Turn {index + 1}</p>
                          <p className={`mt-2 text-sm ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>Q: {turn.question}</p>
                          <p className={`mt-2 text-sm ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>A: {turn.answer}</p>
                        </article>
                      ))
                    ) : (
                      <div className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5 text-emerald-100' : 'border-emerald-100 bg-emerald-50/40 text-slate-600'}`}>
                        Connect users and save turns to build the transcript here.
                      </div>
                    )}

                    {peerLiveUpdate?.latest_turn ? (
                      <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/40'}`}>
                        <p className="text-sm font-black">Latest Backend Turn</p>
                        <p className={`mt-2 text-sm ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>Q: {peerLiveUpdate.latest_turn.question}</p>
                        <p className={`mt-2 text-sm ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>A: {peerLiveUpdate.latest_turn.answer}</p>
                      </div>
                    ) : null}

                    {peerLiveUpdate?.live_feedback?.length ? (
                      <div className="space-y-3">
                        <h4 className="text-lg font-black">Live Feedback</h4>
                        {peerLiveUpdate.live_feedback.map((item) => (
                          <article key={item.user_id} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-lg font-black">{item.user_name}</p>
                                <p className={`mt-1 text-sm ${isDark ? 'text-emerald-50/65' : 'text-slate-600'}`}>
                                  Target role: {item.target_role}
                                </p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                                Score {item.overall_score}
                              </span>
                            </div>

                            <div className="mt-4 grid gap-4">
                              <div>
                                <p className="text-sm font-bold">Interviewer feedback</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(item.interviewer_feedback?.strengths || []).map((strength) => (
                                    <span key={strength} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/10 text-emerald-100/75' : 'bg-emerald-50 text-emerald-700'}`}>
                                      {strength}
                                    </span>
                                  ))}
                                </div>
                                <div className="mt-2 space-y-1">
                                  {(item.interviewer_feedback?.improvements || []).map((improvement) => (
                                    <p key={improvement} className={`text-sm ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                                      {improvement}
                                    </p>
                                  ))}
                                </div>
                              </div>

                              <div>
                                <p className="text-sm font-bold">Candidate feedback</p>
                                <div className="mt-2 flex flex-wrap gap-2">
                                  {(item.candidate_feedback?.strengths || []).map((strength) => (
                                    <span key={strength} className={`rounded-full px-3 py-1 text-[11px] font-semibold ${isDark ? 'bg-white/10 text-emerald-100/75' : 'bg-emerald-50 text-emerald-700'}`}>
                                      {strength}
                                    </span>
                                  ))}
                                </div>
                                <div className="mt-2 space-y-1">
                                  {(item.candidate_feedback?.improvements || []).map((improvement) => (
                                    <p key={improvement} className={`text-sm ${isDark ? 'text-emerald-50/75' : 'text-slate-600'}`}>
                                      {improvement}
                                    </p>
                                  ))}
                                </div>
                              </div>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}

                    {peerFinalFeedback?.feedback?.length ? (
                      <div className="space-y-3">
                        <h4 className="text-lg font-black">Final Analysis</h4>
                        {peerFinalFeedback.feedback.map((item) => (
                          <article key={item.user_id} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                            <div className="flex items-center justify-between gap-3">
                              <div>
                                <p className="text-lg font-black">{item.user_name}</p>
                                <p className={`mt-1 text-sm ${isDark ? 'text-emerald-50/65' : 'text-slate-600'}`}>
                                  {item.target_role}
                                </p>
                              </div>
                              <span className={`rounded-full px-3 py-1 text-xs font-black ${isDark ? 'bg-emerald-400/10 text-emerald-200' : 'bg-emerald-50 text-emerald-700'}`}>
                                Score {item.overall_score}
                              </span>
                            </div>
                          </article>
                        ))}
                      </div>
                    ) : null}
                  </div>
                ) : (
                  <div className="mt-5 space-y-4">
                    {aiRounds.length ? (
                      aiRounds.map((round) => (
                        <article key={round.roundNumber} className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/40'}`}>
                          <p className="text-sm font-black">Round {round.roundNumber}</p>
                          <p className={`mt-2 text-sm ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>Q: {round.question}</p>
                          <p className={`mt-2 text-sm ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>A: {round.answer}</p>
                          <p className={`mt-3 text-sm font-semibold ${isDark ? 'text-emerald-200' : 'text-emerald-700'}`}>
                            Score {round.feedback?.overall_score}
                          </p>
                        </article>
                      ))
                    ) : (
                      <div className={`rounded-2xl border p-5 ${isDark ? 'border-white/10 bg-white/5 text-emerald-100' : 'border-emerald-100 bg-emerald-50/40 text-slate-600'}`}>
                        Start an AI session to see bot questions and answer feedback here.
                      </div>
                    )}

                    {aiSession?.current_question || aiSession?.opening_question ? (
                      <div className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-emerald-50/40'}`}>
                        <p className="text-sm font-black">Current Question</p>
                        <p className={`mt-2 text-sm ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>
                          {aiSession.current_question || aiSession.opening_question}
                        </p>
                      </div>
                    ) : null}

                    {aiFinalFeedback ? (
                      <article className={`rounded-2xl border p-4 ${isDark ? 'border-white/10 bg-white/5' : 'border-emerald-100 bg-white'}`}>
                        <h4 className="text-lg font-black">Final AI Practice Feedback</h4>
                        <p className={`mt-2 text-sm ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>
                          Overall score: {aiFinalFeedback.overall_score}
                        </p>
                        <p className={`mt-2 text-sm ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>
                          Rounds completed: {aiFinalFeedback.practice_summary?.rounds_completed}
                        </p>
                        <p className={`mt-2 text-sm ${isDark ? 'text-emerald-50/78' : 'text-slate-600'}`}>
                          Next step: {aiFinalFeedback.practice_summary?.next_step}
                        </p>
                      </article>
                    ) : null}
                  </div>
                )}
              </section>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default MockInterviewPage;
