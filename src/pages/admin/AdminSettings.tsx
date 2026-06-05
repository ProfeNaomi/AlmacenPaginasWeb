import React, { useState, useEffect } from 'react';
import { Key, Save, CheckCircle2 } from 'lucide-react';
import { initializeAI } from '../../lib/ai';

export default function AdminSettings() {
  const [apiKey, setApiKey] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem('gemini_api_key');
    if (stored) setApiKey(stored);
  }, []);

  const handleSave = () => {
    localStorage.setItem('gemini_api_key', apiKey);
    initializeAI();
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 sm:p-8">
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-white mb-2 flex items-center gap-3">
          <Key className="text-cyan-400 w-8 h-8" /> Configuración de la Plataforma
        </h1>
        <p className="text-slate-400 text-lg">Ajustes de Integración y API Keys</p>
      </div>

      <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl shadow-xl space-y-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Integración con Google Gemini (Inteligencia Artificial)</h2>
          <p className="text-slate-400 mb-4">
            Para generar solucionarios automáticos en el Banco de Preguntas PAES, necesitas proporcionar una clave de API de Google Gemini (es gratuita). 
            Esta clave se guardará localmente en tu navegador.
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-300 mb-1">Clave de API (Gemini API Key)</label>
              <input 
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="AIzaSyB..."
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-cyan-500 font-mono"
              />
            </div>
            
            <button 
              onClick={handleSave}
              className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-3 px-6 rounded-xl transition-all shadow-lg flex items-center gap-2"
            >
              {saved ? <CheckCircle2 className="w-5 h-5" /> : <Save className="w-5 h-5" />}
              {saved ? 'Guardado Exitosamente' : 'Guardar Clave API'}
            </button>
          </div>
        </div>

        <div className="mt-8 p-4 bg-slate-800/50 rounded-xl border border-slate-700">
          <h3 className="font-bold text-slate-200 mb-2">¿Cómo obtener mi clave de API?</h3>
          <ol className="list-decimal list-inside text-slate-400 space-y-2 text-sm">
            <li>Ingresa a <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="text-cyan-400 hover:underline">Google AI Studio</a> e inicia sesión con tu cuenta de Google.</li>
            <li>Haz clic en el botón azul "Create API Key".</li>
            <li>Selecciona "Create API key in new project".</li>
            <li>Copia la clave generada y pégala en el campo de arriba.</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
