'use client';

import { AlertCircle, CheckCircle2, AlertTriangle } from 'lucide-react';
import type { DeckValidationResult } from '@/lib/deck-validation';

interface DeckValidationProps {
  validationResult: DeckValidationResult;
}

export default function DeckValidation({ validationResult }: DeckValidationProps) {
  const { valid, errors, warnings } = validationResult;

  if (valid && warnings.length === 0) {
    return (
      <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
        <div className="flex items-center gap-3">
          <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
          <div>
            <p className="text-green-400 font-medium">Mazo válido</p>
            <p className="text-sm text-gray-400 mt-1">
              Tu mazo cumple con todas las reglas del torneo
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Errors */}
      {errors.length > 0 && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-red-400 font-medium mb-2">
                Errores ({errors.length})
              </p>
              <ul className="space-y-1.5">
                {errors.map((error, index) => (
                  <li key={index} className="text-sm text-gray-300">
                    • {error.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Warnings */}
      {warnings.length > 0 && (
        <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-yellow-400 font-medium mb-2">
                Advertencias ({warnings.length})
              </p>
              <ul className="space-y-1.5">
                {warnings.map((warning, index) => (
                  <li key={index} className="text-sm text-gray-300">
                    • {warning.message}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
