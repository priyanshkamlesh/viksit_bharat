import React, { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'

import Login from './pages/Login'
import Register from './pages/RegistrationPage'
import Home from './pages/Home'
import InterviewPage from './pages/InterviewPage'
import MockInterviewPage from './pages/MockInterviewPage'
import MockTestPage from './pages/MockTestPage'
import RecommendationPage from './pages/RecommendationPage'
import ResumePage from './pages/ResumePage'
import ChatbotPage from './pages/ChatbotPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import InboxPage from './pages/InboxPage'
import OAuthCallback from './pages/OAuthCallback'
import JobRolePage from './pages/JobRolePage'
import JobRoleTypesPage from './pages/JobRoleTypesPage'
import CommunicationSkillsPage from './pages/CommunicationSkillsPage'
import InterpersonalSkillsPage from './pages/InterpersonalSkillsPage'
import TnpSkillsPage from './pages/TnpSkillsPage'
import FloatingChatbot from './components/FloatingChatbot'
import ResponsiveNavigation from './components/ResponsiveNavigation'
import ToastFeedback from './components/ToastFeedback'
import { readCurrentUser } from './lib/currentUser'
import CareerReadinessPage from "./pages/CareerReadinessPage";

const ProfileRoute = ({ currentUser, theme, setTheme }) => {
  if (!currentUser) {
    return <Navigate to="/login" replace />
  }

  return <ProfilePage theme={theme} setTheme={setTheme} />
}

const App = () => {
  const [currentUser, setCurrentUser] = useState(() => (typeof window === 'undefined' ? null : readCurrentUser()))
  const [theme, setTheme] = useState(() => {
    if (typeof window === 'undefined') {
      return 'light'
    }

    return window.localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    window.localStorage.setItem('theme', theme)

    const backgroundColor = theme === 'dark' ? '#050f0a' : '#f0fdf4'
    document.documentElement.style.backgroundColor = backgroundColor
    document.body.style.backgroundColor = backgroundColor
  }, [theme])

  useEffect(() => {
    const syncCurrentUser = () => {
      setCurrentUser(readCurrentUser());
    };

    syncCurrentUser();
    window.addEventListener('auth-change', syncCurrentUser);
    window.addEventListener('storage', syncCurrentUser);

    return () => {
      window.removeEventListener('auth-change', syncCurrentUser);
      window.removeEventListener('storage', syncCurrentUser);
    };
  }, []);

  const ProtectedRoute = ({ element }) => {
    if (!currentUser) {
      return <Navigate to="/login" replace />;
    }

    return element;
  };

  return (
    <BrowserRouter>
      <div className={`min-h-dvh w-full ${theme === 'dark' ? 'bg-[#050f0a]' : 'bg-[#f0fdf4]'}`}>
        <ToastFeedback theme={theme} />
        {currentUser && <ResponsiveNavigation theme={theme} setTheme={setTheme} currentUser={currentUser} />}
        <Routes>
          <Route path='/login' element={<Login theme={theme} setTheme={setTheme} />} />
          <Route path='/auth/callback' element={<OAuthCallback theme={theme} setTheme={setTheme} />} />
          <Route path='/register' element={<Register theme={theme} setTheme={setTheme} />} />
          <Route path='/profile' element={<ProfileRoute currentUser={currentUser} theme={theme} setTheme={setTheme} />} />
          <Route path='/collaboration-profile' element={<ProfileRoute currentUser={currentUser} theme={theme} setTheme={setTheme} />} />
          <Route path='/home' element={<ProtectedRoute element={<Home theme={theme} setTheme={setTheme} />} />} />
          <Route path='/job-roles' element={<ProtectedRoute element={<JobRolePage theme={theme} setTheme={setTheme} />} />} />
          <Route path='/job-roles/types' element={<ProtectedRoute element={<JobRoleTypesPage theme={theme} setTheme={setTheme} />} />} />
          <Route path='/dashboard' element={<ProtectedRoute element={<DashboardPage theme={theme} setTheme={setTheme} />} />} />
          <Route path='/inbox' element={<ProtectedRoute element={<InboxPage theme={theme} setTheme={setTheme} />} />} />
          <Route path='/interview' element={<ProtectedRoute element={<InterviewPage theme={theme} setTheme={setTheme} />} />} />
          <Route path='/interview/mock' element={<ProtectedRoute element={<MockInterviewPage theme={theme} setTheme={setTheme} />} />} />
          <Route path='/interview/mock-test' element={<ProtectedRoute element={<MockTestPage theme={theme} />} />} />
          <Route path='/interview/communication' element={<ProtectedRoute element={<CommunicationSkillsPage theme={theme} setTheme={setTheme} />} />} />
          <Route path='/interview/interpersonal' element={<ProtectedRoute element={<InterpersonalSkillsPage theme={theme} setTheme={setTheme} />} />} />
          <Route path='/interview/tnp' element={<ProtectedRoute element={<TnpSkillsPage theme={theme} />} />} />
          <Route path='/interview/tnp/topic' element={<ProtectedRoute element={<TnpSkillsPage theme={theme} />} />} />
          <Route path='/recommendations' element={<ProtectedRoute element={<RecommendationPage theme={theme} setTheme={setTheme} />} />} />
          <Route path='/recommendations/profiles' element={<ProtectedRoute element={<RecommendationPage theme={theme} setTheme={setTheme} />} />} />
          <Route path='/resume' element={<ProtectedRoute element={<ResumePage theme={theme} setTheme={setTheme} />} />} />
          <Route path='/chatbot' element={<ProtectedRoute element={<ChatbotPage theme={theme} setTheme={setTheme} />} />} />
          <Route path='*' element={<Navigate to={currentUser ? '/home' : '/login'} replace />} />
          <Route path="/career-readiness" element={<CareerReadinessPage />} />
        </Routes>
        {currentUser && <FloatingChatbot theme={theme} />}
      </div>
    </BrowserRouter>
  )
}

export default App
