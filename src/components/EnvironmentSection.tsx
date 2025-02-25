
import React from 'react';
import { Plus, X, Eye, EyeOff } from 'lucide-react';
import { KeyValue } from '../types/environment';
import { toast } from 'sonner';

interface EnvironmentSectionProps {
  title: string;
  items: KeyValue[];
  envIndex: number;
  type: 'vars' | 'secrets';
  showSecrets?: boolean;
  onAdd: () => void;
  onUpdate: (kvIndex: number, field: 'key' | 'value', value: string) => void;
  onRemove: (kvIndex: number) => void;
  onToggleVisibility?: () => void;
}

const EnvironmentSection = ({
  title,
  items,
  envIndex,
  type,
  showSecrets,
  onAdd,
  onUpdate,
  onRemove,
  onToggleVisibility
}: EnvironmentSectionProps) => {
  const handleUpdate = (kvIndex: number, field: 'key' | 'value', value: string) => {
    // Remove espaços em branco do início e fim
    const trimmedValue = value.trim();
    
    // Se o valor estiver vazio após remover espaços, não atualiza e mostra mensagem
    if (trimmedValue === '') {
      toast.error(`O campo ${field === 'key' ? 'chave' : 'valor'} não pode ficar vazio`);
      return;
    }
    
    onUpdate(kvIndex, field, trimmedValue);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-medium text-gray-700">{title}</h3>
          {type === 'secrets' && onToggleVisibility && (
            <button
              onClick={onToggleVisibility}
              className="p-1 text-gray-400 hover:text-gray-600 rounded-full transition-all"
            >
              {showSecrets ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          )}
        </div>
        <button
          onClick={onAdd}
          className="text-sm px-3 py-1 bg-gray-100 text-gray-600 rounded-md hover:bg-gray-200 transition-colors inline-flex items-center gap-1"
        >
          <Plus size={16} /> Add {type === 'vars' ? 'Variable' : 'Secret'}
        </button>
      </div>
      <div className="grid gap-3">
        {items.map((kv, kvIndex) => (
          <div key={kvIndex} className="flex gap-4 items-start animate-fade-in">
            <input
              type="text"
              value={kv.key}
              onChange={(e) => handleUpdate(kvIndex, 'key', e.target.value)}
              placeholder="Key"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              required
            />
            <input
              type={type === 'secrets' && !showSecrets ? "password" : "text"}
              value={kv.value}
              onChange={(e) => handleUpdate(kvIndex, 'value', e.target.value)}
              placeholder="Value"
              className="flex-1 px-3 py-2 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-200 transition-all"
              required
            />
            <button
              onClick={() => {
                // Apenas permite remover se houver mais de uma variável/segredo
                if (items.length > 1) {
                  onRemove(kvIndex);
                } else {
                  toast.error('Deve haver pelo menos uma variável/segredo');
                }
              }}
              className="p-2 text-gray-400 hover:text-red-500 rounded-full hover:bg-gray-100 transition-all"
            >
              <X size={20} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default EnvironmentSection;

