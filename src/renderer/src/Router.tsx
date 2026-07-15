import '@renderer/databases'

import type { FC } from 'react'
import { useMemo } from 'react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'

import Sidebar from './components/app/Sidebar'
import { ErrorBoundary } from './components/ErrorBoundary'
import NavigationHandler from './handler/NavigationHandler'
import { useOnboardingState } from './hooks/useOnboardingState'
import FilesPage from './pages/files/FilesPage'
import HomePage from './pages/home/HomePage'
import KnowledgePage from './pages/knowledge/KnowledgePage'
import LaunchpadPage from './pages/launchpad/LaunchpadPage'
import MinAppsPage from './pages/minapps/MinAppsPage'
import NotesPage from './pages/notes/NotesPage'
import { OnboardingPage } from './pages/onboarding'
import PaintingsRoutePage from './pages/paintings/PaintingsRoutePage'
import SettingsPage from './pages/settings/SettingsPage'
import AssistantPresetsPage from './pages/store/assistants/presets/AssistantPresetsPage'
import TranslatePage from './pages/translate/TranslatePage'

const Router: FC = () => {
  const { onboardingCompleted, completeOnboarding } = useOnboardingState()

  const routes = useMemo(() => {
    return (
      <ErrorBoundary>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/agents" element={<Navigate to="/" replace />} />
          <Route path="/code" element={<Navigate to="/" replace />} />
          <Route path="/openclaw" element={<Navigate to="/" replace />} />
          <Route path="/store" element={<AssistantPresetsPage />} />
          <Route path="/paintings/*" element={<PaintingsRoutePage />} />
          <Route path="/translate" element={<TranslatePage />} />
          <Route path="/files" element={<FilesPage />} />
          <Route path="/notes" element={<NotesPage />} />
          <Route path="/knowledge" element={<KnowledgePage />} />
          <Route path="/apps/:appId" element={<Navigate to="/apps" replace />} />
          <Route path="/apps" element={<MinAppsPage />} />
          <Route path="/settings/*" element={<SettingsPage />} />
          <Route path="/launchpad" element={<LaunchpadPage />} />
        </Routes>
      </ErrorBoundary>
    )
  }, [])

  if (!onboardingCompleted) {
    return <OnboardingPage onComplete={completeOnboarding} />
  }

  return (
    <HashRouter>
      <Sidebar />
      {routes}
      <NavigationHandler />
    </HashRouter>
  )
}

export default Router
