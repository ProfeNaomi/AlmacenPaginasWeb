import React, { useState } from 'react';
import { LogIn, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError('Credenciales incorrectas. Por favor, intenta de nuevo.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex font-sans bg-[#020617] text-slate-200 selection:bg-cyan-500/30">
      {/* Left Side - Image/Branding */}
      <div className="hidden lg:flex w-1/2 relative bg-slate-900 border-r border-slate-800/50 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-t from-[#020617] to-transparent z-10" />
        <img 
          src="/login_naomi.png" 
          alt="Almacén Naomi Welcome" 
          className="object-cover w-full h-full opacity-80"
          onError={(e) => {
            // Fallback en caso de que la imagen no exista aún
            e.currentTarget.style.display = 'none';
          }}
        />
        <div className="absolute inset-0 flex flex-col justify-center px-16 z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <h1 className="text-5xl font-display font-bold text-white mb-6">
              Le damos la bienvenida a <br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-400 to-emerald-400">
                Almacén Naomi
              </span>
            </h1>
            <p className="text-slate-300 text-lg max-w-md leading-relaxed">
              Su aventura de aprendizaje comienza aquí. Acceda a sus cursos, herramientas y todo el contenido educativo en un solo lugar.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Side - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12">
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="text-center mb-10">
            <h2 className="text-3xl font-display font-bold text-white mb-2">Entrar a Espacio Virtual</h2>
            <p className="text-slate-400">Introduce tus credenciales para continuar</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            {error && (
              <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm text-center">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">
                Correo Electrónico
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
                placeholder="tu@correo.com"
              />
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between items-center px-1">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                  Contraseña
                </label>
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-slate-900/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white transition-all py-4 rounded-2xl font-bold mt-4 shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/40 hover:-translate-y-1"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  Acceder
                </>
              )}
            </button>
          </form>

          <div className="mt-8 pt-8 border-t border-slate-800/50 text-center">
            <p className="text-slate-400 text-sm">
              ¿No tienes cuenta?{' '}
              <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                Regístrate aquí
              </Link>
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
