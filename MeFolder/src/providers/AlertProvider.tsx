import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { CustomAlert } from '@/components/CustomAlert/CustomAlert';
import { CustomAlertOptions, CustomAlertButton, AlertContextType } from '@/types/ui/components';

const AlertContext = createContext<AlertContextType | null>(null);

const DEFAULT_BUTTON: CustomAlertButton = { text: 'Vale' };

export const AlertProvider = ({ children }: { children: ReactNode }) => {
  const [visible, setVisible] = useState(false);
  const [alertOptions, setAlertOptions] = useState<CustomAlertOptions>({
    title: '',
    buttons: [DEFAULT_BUTTON],
  });

  const showAlert = useCallback((options: CustomAlertOptions) => {
    setAlertOptions({
      ...options,
      buttons: options.buttons?.length ? options.buttons : [DEFAULT_BUTTON],
    });
    setVisible(true);
  }, []);

  const handleDismiss = useCallback(() => {
    setVisible(false);
  }, []);

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}
      <CustomAlert
        title={alertOptions.title}
        message={alertOptions.message ?? ""}
        buttons={alertOptions.buttons ?? [DEFAULT_BUTTON]}
        isVisible={visible}
        onDismiss={handleDismiss}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert debe usarse dentro de un <AlertProvider>');
  }
  return context;
};
