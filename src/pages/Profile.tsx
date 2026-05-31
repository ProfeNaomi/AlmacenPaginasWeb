import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../lib/firebase';
import { doc, updateDoc } from 'firebase/firestore';
import { Loader2, Save, User as UserIcon } from 'lucide-react';
import { motion } from 'motion/react';

export default function Profile() {
  const { user, profile } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    lastName: '',
    description: '',
  });
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (profile) {
      setFormData({
        name: profile.name || '',
        lastName: profile.lastName || '',
        description: profile.description || '',
      });
    }
  }, [profile]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setIsSaving(true);
    setMessage('');

    try {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        name: formData.name,
        lastName: formData.lastName,
        username: `${formData.name} ${formData.lastName}`.trim(),
        description: formData.description,
      });
      setMessage('Perfil actualizado correctamente.');
    } catch (err) {
      console.error(err);
      setMessage('Error al actualizar el perfil.');
    } finally {
      setIsSaving(false);
    }
  };

  if (!profile) {
    return (
      <div className="p-8 flex justify-center">
        <Loader2 className="w-8 h-8 text-cyan-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 md:p-12 max-w-4xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="flex items-center gap-4 mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-cyan-600 to-emerald-600 flex items-center justify-center shadow-lg shadow-cyan-900/20">
            <UserIcon className="w-8 h-8 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-display font-bold text-white">Mi Perfil</h1>
            <p className="text-slate-400">Actualiza tu información personal</p>
          </div>
        </div>

        <div className="bg-slate-900/60 backdrop-blur-sm border border-slate-800 rounded-3xl p-8 shadow-xl">
          <form onSubmit={handleSave} className="space-y-6">
            {message && (
              <div className={`p-4 rounded-2xl text-sm text-center font-medium ${
                message.includes('Error') 
                  ? 'bg-rose-500/10 border border-rose-500/20 text-rose-400' 
                  : 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400'
              }`}>
                {message}
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Nombre</label>
                <input
                  type="text" required
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Apellidos</label>
                <input
                  type="text" required
                  value={formData.lastName}
                  onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                  className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-3.5 text-white focus:outline-none focus:border-cyan-500/50 transition-all"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Correo Electrónico (Solo Lectura)</label>
              <input
                type="email" disabled
                value={user?.email || ''}
                className="w-full bg-slate-950/30 border border-slate-800/50 rounded-2xl px-5 py-3.5 text-slate-500 cursor-not-allowed"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-widest px-1">Sobre Mí / Descripción</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
                rows={4}
                placeholder="Escribe algo sobre ti, qué te gusta, tus intereses..."
                className="w-full bg-slate-950/50 border border-slate-800 rounded-2xl px-5 py-4 text-white focus:outline-none focus:border-cyan-500/50 transition-all resize-none"
              />
            </div>

            <div className="pt-4 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 bg-gradient-to-r from-cyan-600 to-emerald-600 hover:from-cyan-500 hover:to-emerald-500 text-white px-8 py-3.5 rounded-2xl font-bold transition-all shadow-lg shadow-cyan-900/40 hover:-translate-y-1"
              >
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Guardar Cambios
              </button>
            </div>
          </form>
        </div>
      </motion.div>
    </div>
  );
}
