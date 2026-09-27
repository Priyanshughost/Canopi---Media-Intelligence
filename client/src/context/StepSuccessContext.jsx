import React, { createContext, useContext, useState, useCallback } from 'react';
import { StepSuccessToast } from '../components/common/StepSuccessToast';

const StepSuccessContext = createContext(null);

/**
 * StepSuccessProvider
 * 
 * Provides global step success confirmation toasts across any page/workflow.
 */
export const StepSuccessProvider = ({ children }) => {
  const [toastConfig, setToastConfig] = useState({
    isOpen: false,
    title: 'Step Complete',
    message: '',
    nextStepLabel: 'Next Step',
    autoAdvance: true,
    autoAdvanceSeconds: 5,
    onNext: null,
  });

  const dismissStepSuccess = useCallback(() => {
    setToastConfig((prev) => ({ ...prev, isOpen: false }));
  }, []);

  const triggerStepSuccess = useCallback(
    ({
      title = 'Step Complete',
      message = 'Action completed successfully.',
      nextStepLabel = 'Next Step',
      autoAdvance = true,
      autoAdvanceSeconds = 5,
      onNext,
    }) => {
      setToastConfig({
        isOpen: true,
        title,
        message,
        nextStepLabel,
        autoAdvance,
        autoAdvanceSeconds,
        onNext: () => {
          setToastConfig((prev) => ({ ...prev, isOpen: false }));
          if (typeof onNext === 'function') {
            onNext();
          }
        },
      });
    },
    []
  );

  return (
    <StepSuccessContext.Provider value={{ triggerStepSuccess, dismissStepSuccess }}>
      {children}
      <StepSuccessToast
        isOpen={toastConfig.isOpen}
        title={toastConfig.title}
        message={toastConfig.message}
        nextStepLabel={toastConfig.nextStepLabel}
        autoAdvance={toastConfig.autoAdvance}
        autoAdvanceSeconds={toastConfig.autoAdvanceSeconds}
        onNext={toastConfig.onNext}
        onDismiss={dismissStepSuccess}
      />
    </StepSuccessContext.Provider>
  );
};

/**
 * useStepSuccess Hook
 * 
 * Access the global step success trigger anywhere in the application.
 * 
 * @example
 * const { triggerStepSuccess } = useStepSuccess();
 * triggerStepSuccess({
 *   title: 'Media Uploaded',
 *   message: 'Asset processed and analyzed with Cloudinary Vision.',
 *   nextStepLabel: 'Review in Evidence',
 *   autoAdvanceSeconds: 5,
 *   onNext: () => navigate('/evidence')
 * });
 */
export const useStepSuccess = () => {
  const context = useContext(StepSuccessContext);
  if (!context) {
    return {
      triggerStepSuccess: () => {},
      dismissStepSuccess: () => {},
    };
  }
  return context;
};
