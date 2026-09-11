import React, { createContext, useContext, useState, useEffect, useCallback, useRef, ReactNode } from 'react';

export interface UnsavedChangesState {
  hasUnsaved: boolean;
  docTitle?: string;
  docType?: string;
  onSave?: () => Promise<boolean | void> | boolean | void;
  onDiscard?: () => void;
}

interface NavigationGuardContextType {
  unsavedState: UnsavedChangesState | null;
  registerUnsavedChanges: (state: UnsavedChangesState | null) => void;
  unregisterUnsavedChanges: () => void;
  requestActionWithGuard: (action: () => void, customDocTitle?: string) => void;
  showPrompt: boolean;
  isSaving: boolean;
  confirmSaveAndProceed: () => Promise<void>;
  confirmDiscardAndProceed: () => void;
  cancelPrompt: () => void;
}

const NavigationGuardContext = createContext<NavigationGuardContextType | undefined>(undefined);

export function NavigationGuardProvider({ children }: { children: ReactNode }) {
  const [unsavedState, setUnsavedState] = useState<UnsavedChangesState | null>(null);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const pendingActionRef = useRef<(() => void) | null>(null);
  const unsavedStateRef = useRef<UnsavedChangesState | null>(null);

  // Keep ref synchronized
  useEffect(() => {
    unsavedStateRef.current = unsavedState;
  }, [unsavedState]);

  // Register or update unsaved changes state
  const registerUnsavedChanges = useCallback((state: UnsavedChangesState | null) => {
    setUnsavedState(state);
  }, []);

  const unregisterUnsavedChanges = useCallback(() => {
    setUnsavedState(null);
  }, []);

  // Intercept any exit or navigation request if unsaved changes are present
  const requestActionWithGuard = useCallback((action: () => void, customDocTitle?: string) => {
    const current = unsavedStateRef.current;
    if (current && current.hasUnsaved) {
      if (customDocTitle && !current.docTitle) {
        setUnsavedState(prev => prev ? ({ ...prev, docTitle: customDocTitle }) : prev);
      }
      pendingActionRef.current = action;
      setShowPrompt(true);
    } else {
      action();
    }
  }, []);

  // User confirmed to Save and then proceed with navigation/exit
  const confirmSaveAndProceed = useCallback(async () => {
    const current = unsavedStateRef.current;
    setIsSaving(true);
    try {
      if (current?.onSave) {
        await current.onSave();
      }
      // Clear unsaved state
      setUnsavedState(null);
      setShowPrompt(false);
      
      // Execute the pending exit/navigation action
      const pending = pendingActionRef.current;
      pendingActionRef.current = null;
      if (pending) {
        pending();
      }
    } catch (err) {
      console.error('Error auto-saving before exit:', err);
    } finally {
      setIsSaving(false);
    }
  }, []);

  // User confirmed to Discard changes and proceed with exit
  const confirmDiscardAndProceed = useCallback(() => {
    const current = unsavedStateRef.current;
    try {
      if (current?.onDiscard) {
        current.onDiscard();
      }
    } catch (err) {
      console.warn('Error during discard handler:', err);
    }
    setUnsavedState(null);
    setShowPrompt(false);

    const pending = pendingActionRef.current;
    pendingActionRef.current = null;
    if (pending) {
      pending();
    }
  }, []);

  // User cancelled the prompt (wants to keep editing)
  const cancelPrompt = useCallback(() => {
    pendingActionRef.current = null;
    setShowPrompt(false);
  }, []);

  // Native Browser beforeunload listener to warn if closing/refreshing tab
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (unsavedState?.hasUnsaved) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes in your document. Are you sure you want to exit?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [unsavedState?.hasUnsaved]);

  return (
    <NavigationGuardContext.Provider
      value={{
        unsavedState,
        registerUnsavedChanges,
        unregisterUnsavedChanges,
        requestActionWithGuard,
        showPrompt,
        isSaving,
        confirmSaveAndProceed,
        confirmDiscardAndProceed,
        cancelPrompt
      }}
    >
      {children}
    </NavigationGuardContext.Provider>
  );
}

export function useNavigationGuard() {
  const context = useContext(NavigationGuardContext);
  if (!context) {
    throw new Error('useNavigationGuard must be used within a NavigationGuardProvider');
  }
  return context;
}
