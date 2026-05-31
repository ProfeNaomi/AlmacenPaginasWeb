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
    <div className="min-h-screen relative flex font-sans text-slate-200 selection:bg-cyan-500/30">
      {/* Background Image full screen */}
      <div 
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/login_naomi.png')` }}
      >
        {/* Un pequeño overlay oscuro para asegurar que el texto sea legible si la imagen es muy clara */}
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      {/* Contenedor principal */}
      <div className="relative z-10 w-full flex">
        
        {/* Left Side - Login Form and Welcome Text */}
        <div className="w-full lg:w-1/3 min-w-[320px] max-w-[450px] bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50 flex flex-col items-center justify-center p-8 sm:p-10">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-display font-bold text-white mb-2">Acceder</h2>
              <p className="text-slate-400">Introduce tus credenciales para continuar</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-5">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl text-sm text-center">
                  {error}
                </div>
              )}
              
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-widest px-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
                  placeholder="tu@correo.com"
                />
              </div>
              
              <div className="space-y-1.5">
                <div className="flex justify-between items-center px-1">
                  <label className="text-xs font-bold text-slate-400 uppercase tracking-widest">
                    Contraseña
                  </label>
                </div>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all font-sans"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white transition-all py-3.5 rounded-2xl font-bold mt-4 shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/40 hover:-translate-y-1"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    Entrar
                  </>
                )}
              </button>
            </form>

            <div className="mt-8 pt-6 border-t border-slate-800/50 text-center">
              <p className="text-slate-400 text-sm mb-6">
                ¿No tienes cuenta?{' '}
                <Link to="/register" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Regístrate aquí
                </Link>
              </p>
              
              {/* Texto de bienvenida movido debajo del login */}
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-cyan-950/30 p-4 rounded-2xl border border-cyan-900/30"
              >
                <p className="text-cyan-100 text-sm leading-relaxed font-medium">
                  Te damos la bienvenida al <span className="font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-emerald-400">Espacio Virtual de Naomi</span>
                </p>
              </motion.div>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Empty space to show the background image */}
        <div className="hidden lg:block lg:flex-1"></div>

      </div>
    </div>
  );
}
