import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Loader2 } from 'lucide-react';

// Layouts & Pages
import MainLayout from './components/layout/MainLayout';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Profile from './pages/Profile';
import CategoryView from './pages/CategoryView';
import CourseView from './pages/CourseView';
import ContentMaker from './pages/ContentMaker';
import LessonViewer from './pages/LessonViewer';
import AdminSettings from './pages/admin/AdminSettings';
import QuestionBank from './pages/admin/QuestionBank';
import ExamBuilder from './pages/admin/ExamBuilder';
import CoverBuilder from './pages/admin/CoverBuilder';
import PaesExams from './pages/PaesExams';
import ExamViewer from './pages/ExamViewer';
import GameMapViewer from './pages/GameMapViewer';
import GameMapBuilder from './pages/admin/GameMapBuilder';
import DossierBuilder from './pages/admin/DossierBuilder';
import DossierTemplateBuilder from './pages/admin/DossierTemplateBuilder';
import DossierViewer from './pages/DossierViewer';
import PlannerBuilder from './pages/admin/PlannerBuilder';
import OABank from './pages/admin/OABank';

// Protected Route Wrapper
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    );
  }
  
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  
  return <>{children}</>;
};

// Public Route Wrapper (redirects to dashboard if already logged in)
const PublicRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="w-10 h-10 text-cyan-500 animate-spin" />
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function AppRoutes() {
  return (
    <Routes>
      {/* Rutas Públicas */}
      <Route path="/" element={<Navigate to="/login" replace />} />
      <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
      <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />

      {/* Rutas Protegidas con el Layout Principal (Estilo Moodle) */}
      <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/category/:categoryId" element={<CategoryView />} />
        <Route path="/course/:courseId" element={<CourseView />} />
        <Route path="/course/:courseId/maker/:moduleId/:resourceId" element={<ContentMaker />} />
        <Route path="/course/:courseId/lesson/:moduleId/:resourceId" element={<LessonViewer />} />
        <Route path="/profile" element={<Profile />} />
        
        {/* Rutas PAES */}
        <Route path="/ensayos" element={<PaesExams />} />
        <Route path="/ensayos/:id" element={<ExamViewer />} />

        {/* Videojuego (Mapa de Desafíos) */}
        <Route path="/desafios" element={<GameMapViewer />} />
        
        {/* Rutas Admin */}
        <Route path="/admin/settings" element={<AdminSettings />} />
        <Route path="/admin/question-bank" element={<QuestionBank />} />
        <Route path="/admin/exam-builder" element={<ExamBuilder />} />
        <Route path="/admin/covers" element={<CoverBuilder />} />
        <Route path="/admin/desafios" element={<GameMapBuilder />} />
        <Route path="/admin/dossiers" element={<DossierBuilder />} />
        <Route path="/admin/dossier-templates" element={<DossierTemplateBuilder />} />
        <Route path="/admin/planner" element={<PlannerBuilder />} />
        <Route path="/admin/oa-bank" element={<OABank />} />
        
        {/* Rutas para ver Dossier */}
        <Route path="/dossiers/:dossierId" element={<DossierViewer />} />
      </Route>

      {/* Catch all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </AuthProvider>
  );
}
