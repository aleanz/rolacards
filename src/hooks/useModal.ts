import { useEffect, useCallback } from 'react';

interface UseModalOptions {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * Hook para manejar el cierre de modales con ESC y click fuera
 * @param isOpen - Estado del modal (abierto/cerrado)
 * @param onClose - Función para cerrar el modal
 */
export function useModal({ isOpen, onClose }: UseModalOptions) {
  // Manejar tecla ESC
  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose();
      }
    },
    [isOpen, onClose]
  );

  // Manejar click en el backdrop
  const handleBackdropClick = useCallback(
    (event: React.MouseEvent<HTMLDivElement>) => {
      if (event.target === event.currentTarget) {
        onClose();
      }
    },
    [onClose]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevenir scroll del body cuando el modal está abierto
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  return { handleBackdropClick };
}
