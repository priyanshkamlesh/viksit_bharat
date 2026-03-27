import React, { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Routes, Route } from 'react-router-dom'

import Login from './pages/Login'
import Register from './pages/RegistrationPage'
import Home from './pages/Home'
import TechPage from './pages/TechPage'
import InterviewPage from './pages/InterviewPage'
import AiMlPage from './pages/AiMlPage'
import ProgrammingLanguagePage from './pages/ProgrammingLanguagePage'
import FullStackPage from './pages/FullStackPage'
import CloudDevopsPage from './pages/CloudDevopsPage'
import LibrariesFrameworksPage from './pages/LibrariesFrameworksPage'
import ApisPage from './pages/ApisPage'
import DatabasePage from './pages/DatabasePage'
import SkillRoadmapPage from './pages/SkillRoadmapPage'
import MockTestPage from './pages/MockTestPage'
import MockInterviewPage from './pages/MockInterviewPage'
import RecommendationPage from './pages/RecommendationPage'
import ProfilePage from './pages/ProfilePage'
import DashboardPage from './pages/DashboardPage'
import InboxPage from './pages/InboxPage'
import OAuthCallback from './pages/OAuthCallback'
import TechTrackPage from './pages/TechTrackPage'
import CommunicationSkillsPage from './pages/CommunicationSkillsPage'
import InterpersonalSkillsPage from './pages/InterpersonalSkillsPage'
import { readCurrentUser } from './lib/currentUser'

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
      <Routes>
        <Route path='/login' element={<Login theme={theme} setTheme={setTheme} />} />
        <Route path='/auth/callback' element={<OAuthCallback theme={theme} setTheme={setTheme} />} />
        <Route path='/register' element={<Register theme={theme} setTheme={setTheme} />} />
        <Route path='/profile' element={<ProtectedRoute element={<ProfilePage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/collaboration-profile' element={<ProtectedRoute element={<ProfilePage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/home' element={<ProtectedRoute element={<Home theme={theme} setTheme={setTheme} />} />} />
        <Route path='/dashboard' element={<ProtectedRoute element={<DashboardPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/inbox' element={<ProtectedRoute element={<InboxPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/tech' element={<ProtectedRoute element={<TechPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/interview' element={<ProtectedRoute element={<InterviewPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/interview/mock' element={<ProtectedRoute element={<MockInterviewPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/interview/communication' element={<ProtectedRoute element={<CommunicationSkillsPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/interview/interpersonal' element={<ProtectedRoute element={<InterpersonalSkillsPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/aiml' element={<ProtectedRoute element={<AiMlPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/programming-language' element={<ProtectedRoute element={<ProgrammingLanguagePage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/full-stack-developer' element={<ProtectedRoute element={<FullStackPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/cloud-devops' element={<ProtectedRoute element={<CloudDevopsPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/libraries-frameworks' element={<ProtectedRoute element={<LibrariesFrameworksPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/apis' element={<ProtectedRoute element={<ApisPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/database' element={<ProtectedRoute element={<DatabasePage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/roadmap/:skillId' element={<ProtectedRoute element={<SkillRoadmapPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/mock-test/:skillId' element={<ProtectedRoute element={<MockTestPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/tech/:track' element={<ProtectedRoute element={<TechTrackPage theme={theme} setTheme={setTheme} />} />} />
        <Route path='/recommendations' element={<ProtectedRoute element={<RecommendationPage theme={theme} setTheme={setTheme} />} />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
