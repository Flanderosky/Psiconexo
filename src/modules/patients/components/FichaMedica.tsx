// UBICACIÓN: src/modules/patients/components/FichaMedica.tsx
import { useState, useEffect } from 'react';
import { Save, FileText } from 'lucide-react';
import { supabase } from '../../../lib/supabase'; 

interface TechnicalSheetProps {
  patientId: string;
  onClose: () => void;
}

export const FichaMedica = ({ patientId, onClose }: TechnicalSheetProps) => {
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    age: '',
    occupation: '',
    marital_status: '',
    consultation_reason: '',
    medical_history: '',
    medication: ''
  });

  useEffect(() => {
    const fetchSheet = async () => {
      // CORRECCIÓN: Quitamos la variable 'error' porque no la usábamos
      const { data } = await supabase
        .from('technical_sheets')
        .select('*')
        .eq('patient_id', patientId)
        .single();

      if (data) setFormData(data);
      setLoading(false);
    };
    fetchSheet();
  }, [patientId]);

  const handleSave = async () => {
    const { error } = await supabase
      .from('technical_sheets')
      .upsert({ ...formData, patient_id: patientId });

    if (error) alert('Error al guardar: ' + error.message);
    else {
        alert('Ficha actualizada');
        onClose();
    }
  };

  if (loading) return <div className="text-zinc-500 p-4">Cargando ficha...</div>;

  return (
    <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 animate-in slide-in-from-bottom-4">
      <div className="flex justify-between items-center mb-6 border-b border-zinc-800 pb-4">
        <h3 className="text-lg font-semibold text-zinc-100 flex items-center gap-2">
          <FileText className="text-emerald-400" size={20} /> Ficha Técnica
        </h3>
        <button onClick={handleSave} className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg transition-colors text-sm font-medium">
          <Save size={16} /> Guardar Cambios
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Edad</label>
            <input 
              type="number" 
              value={formData.age}
              onChange={e => setFormData({...formData, age: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-emerald-500/50 focus:outline-none transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Ocupación</label>
            <input 
              type="text" 
              value={formData.occupation}
              onChange={e => setFormData({...formData, occupation: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-emerald-500/50 focus:outline-none transition-colors"
            />
          </div>
           <div>
            <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Estado Civil</label>
            <input 
              type="text" 
              value={formData.marital_status}
              onChange={e => setFormData({...formData, marital_status: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-emerald-500/50 focus:outline-none transition-colors"
            />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Motivo de Consulta</label>
            <textarea 
              rows={3}
              value={formData.consultation_reason}
              onChange={e => setFormData({...formData, consultation_reason: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-emerald-500/50 focus:outline-none transition-colors resize-none"
            />
          </div>
          <div>
            <label className="block text-xs text-zinc-500 mb-1 uppercase tracking-wider">Historia Médica</label>
            <textarea 
              rows={3}
              value={formData.medical_history}
              onChange={e => setFormData({...formData, medical_history: e.target.value})}
              className="w-full bg-zinc-950 border border-zinc-800 rounded-lg p-3 text-zinc-200 focus:border-emerald-500/50 focus:outline-none transition-colors resize-none"
            />
          </div>
        </div>
      </div>
    </div>
  );
};