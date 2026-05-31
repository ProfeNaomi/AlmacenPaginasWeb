import React, { useState } from 'react';
import { UserPlus, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../lib/firebase';
import { useNavigate, Link } from 'react-router-dom';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    email: '',
    password: '',
    role: 'student',
    matricula: ''
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Validar código de matrícula
    if (formData.role === 'student' && formData.matricula !== 'ESTUDIANTE_2026@') {
      setError('El código de matrícula para estudiantes es inválido.');
      return;
    }
    if (formData.role === 'professor' && formData.matricula !== 'PROFESOR_2026@') {
      setError('El código de matrícula para profesores es inválido.');
      return;
    }

    setIsLoading(true);
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;

      // Guardar información adicional en Firestore
      await setDoc(doc(db, 'users', user.uid), {
        name: formData.name,
        lastName: formData.lastName,
        username: formData.name + ' ' + formData.lastName,
        email: formData.email,
        role: formData.role,
        description: 'Nuevo usuario del Espacio Virtual.',
        createdAt: Date.now()
      });

      navigate('/dashboard');
    } catch (err: any) {
      if (err.code === 'auth/email-already-in-use') {
        setError('Este correo ya está registrado.');
      } else if (err.code === 'auth/weak-password') {
        setError('La contraseña debe tener al menos 6 caracteres.');
      } else {
        setError('Ocurrió un error al registrar. Intenta de nuevo.');
      }
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
        <div className="absolute inset-0 bg-black/40"></div>
      </div>

      <div className="relative z-10 w-full flex">
        {/* Left Side - Register Form */}
        <div className="w-full lg:w-[450px] bg-slate-950/80 backdrop-blur-xl border-r border-slate-800/50 flex flex-col items-center justify-center p-8 sm:p-10 h-screen overflow-y-auto">
          
          <motion.div 
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            className="w-full max-w-sm my-auto"
          >
            <div className="text-center mb-6">
              <h2 className="text-3xl font-display font-bold text-white mb-2">Registro</h2>
              <p className="text-slate-400 text-sm">Únete al Espacio Virtual de Naomi</p>
            </div>

            <form onSubmit={handleRegister} className="space-y-4">
              {error && (
                <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-3 rounded-xl text-sm text-center">
                  {error}
                </div>
              )}
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Nombre</label>
                  <input
                    type="text" required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Apellidos</label>
                  <input
                    type="text" required
                    value={formData.lastName}
                    onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Correo Electrónico</label>
                <input
                  type="email" required
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Contraseña</label>
                <input
                  type="password" required minLength={6}
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">Rol</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({...formData, role: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-cyan-500/50 transition-all appearance-none text-sm"
                  >
                    <option value="student">Estudiante</option>
                    <option value="professor">Profesor</option>
                  </select>
                </div>
                
                <div className="space-y-1.5">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-widest px-1">
                    Matrícula
                  </label>
                  <input
                    type="text" required
                    value={formData.matricula}
                    onChange={(e) => setFormData({...formData, matricula: e.target.value})}
                    className="w-full bg-slate-900/60 border border-slate-700/50 rounded-xl px-4 py-2.5 text-cyan-400 font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-all"
                    placeholder="Código..."
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white transition-all py-3.5 rounded-2xl font-bold mt-2 shadow-lg shadow-cyan-900/40 hover:shadow-cyan-500/40 hover:-translate-y-1"
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    Registrarse
                  </>
                )}
              </button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-slate-400 text-sm">
                ¿Ya tienes cuenta?{' '}
                <Link to="/login" className="text-cyan-400 hover:text-cyan-300 font-medium transition-colors">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </motion.div>
        </div>

        {/* Right Side - Empty space for background */}
        <div className="hidden lg:block lg:flex-1"></div>
      </div>
    </div>
  );
}
