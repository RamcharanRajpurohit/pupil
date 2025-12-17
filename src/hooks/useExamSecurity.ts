import { useEffect, useRef, useCallback, useState } from 'react';

interface ExamSecurityOptions {
  onViolation: (type: ViolationType) => void;
  autoSubmitOnViolation?: boolean;
  maxViolations?: number;
  enabled?: boolean;
}

export type ViolationType = 
  | 'tab-switch' 
  | 'window-blur' 
  | 'fullscreen-exit' 
  | 'page-refresh'
  | 'right-click'
  | 'copy-paste'
  | 'keyboard-shortcut'
  | 'escape-key';

export function useExamSecurity({
  onViolation,
  autoSubmitOnViolation = false,
  maxViolations = 3,
  enabled = true
}: ExamSecurityOptions) {
  const [violationCount, setViolationCount] = useState(0);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const violationTimeoutRef = useRef<NodeJS.Timeout>();
  const hasInitializedRef = useRef(false);

  const reportViolation = useCallback((type: ViolationType) => {
    if (!enabled) return;
    
    setViolationCount(prev => {
      const newCount = prev + 1;
      onViolation(type);
      
      if (autoSubmitOnViolation && newCount >= maxViolations) {
        // Trigger auto-submit through the violation handler
        setTimeout(() => onViolation('tab-switch'), 100);
      }
      
      return newCount;
    });
  }, [enabled, onViolation, autoSubmitOnViolation, maxViolations]);

  // Enter fullscreen
  const enterFullscreen = useCallback(async () => {
    try {
      const elem = document.documentElement;
      if (elem.requestFullscreen) {
        await elem.requestFullscreen();
      } else if ((elem as any).mozRequestFullScreen) {
        await (elem as any).mozRequestFullScreen();
      } else if ((elem as any).webkitRequestFullscreen) {
        await (elem as any).webkitRequestFullscreen();
      } else if ((elem as any).msRequestFullscreen) {
        await (elem as any).msRequestFullscreen();
      }
      setIsFullscreen(true);
    } catch (error) {
      console.error('Failed to enter fullscreen:', error);
    }
  }, []);

  // Exit fullscreen
  const exitFullscreen = useCallback(async () => {
    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen();
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen();
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen();
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen();
      }
      setIsFullscreen(false);
    } catch (error) {
      console.error('Failed to exit fullscreen:', error);
    }
  }, []);

  // Fullscreen change handler
  const handleFullscreenChange = useCallback(() => {
    const isCurrentlyFullscreen = !!(
      document.fullscreenElement ||
      (document as any).mozFullScreenElement ||
      (document as any).webkitFullscreenElement ||
      (document as any).msFullscreenElement
    );
    
    setIsFullscreen(isCurrentlyFullscreen);
    
    if (!isCurrentlyFullscreen && hasInitializedRef.current && enabled) {
      reportViolation('fullscreen-exit');
      // Auto re-enter fullscreen after a brief delay
      violationTimeoutRef.current = setTimeout(() => {
        enterFullscreen();
      }, 1000);
    }
  }, [enabled, reportViolation, enterFullscreen]);

  // Visibility change handler (tab switching)
  const handleVisibilityChange = useCallback(() => {
    if (document.hidden && enabled) {
      reportViolation('tab-switch');
    }
  }, [enabled, reportViolation]);

  // Window blur handler
  const handleWindowBlur = useCallback(() => {
    if (enabled) {
      reportViolation('window-blur');
    }
  }, [enabled, reportViolation]);

  // Context menu (right-click) blocker
  const handleContextMenu = useCallback((e: MouseEvent) => {
    if (enabled) {
      e.preventDefault();
      reportViolation('right-click');
    }
  }, [enabled, reportViolation]);

  // Copy, paste, cut blocker
  const handleCopyPaste = useCallback((e: ClipboardEvent) => {
    if (enabled) {
      e.preventDefault();
      reportViolation('copy-paste');
    }
  }, [enabled, reportViolation]);

  // Keyboard shortcut blocker
  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if (!enabled) return;

    // Block Escape key
    if (e.key === 'Escape') {
      e.preventDefault();
      reportViolation('escape-key');
      return;
    }

    const isMac = navigator.platform.toUpperCase().indexOf('MAC') >= 0;
    const ctrlKey = isMac ? e.metaKey : e.ctrlKey;

    // Block common shortcuts
    const blockedShortcuts = [
      // Developer tools
      { key: 'F12', ctrl: false },
      { key: 'I', ctrl: true, shift: true }, // Ctrl+Shift+I
      { key: 'J', ctrl: true, shift: true }, // Ctrl+Shift+J
      { key: 'C', ctrl: true, shift: true }, // Ctrl+Shift+C
      { key: 'U', ctrl: true, shift: false }, // Ctrl+U (view source)
      
      // Copy, paste, cut
      { key: 'C', ctrl: true, shift: false }, // Ctrl+C
      { key: 'V', ctrl: true, shift: false }, // Ctrl+V
      { key: 'X', ctrl: true, shift: false }, // Ctrl+X
      { key: 'A', ctrl: true, shift: false }, // Ctrl+A (select all)
      
      // Other
      { key: 'S', ctrl: true, shift: false }, // Ctrl+S (save)
      { key: 'P', ctrl: true, shift: false }, // Ctrl+P (print)
      { key: 'F', ctrl: true, shift: false }, // Ctrl+F (find)
      { key: 'R', ctrl: true, shift: false }, // Ctrl+R (refresh)
      { key: 'W', ctrl: true, shift: false }, // Ctrl+W (close tab)
      { key: 'T', ctrl: true, shift: false }, // Ctrl+T (new tab)
      { key: 'N', ctrl: true, shift: false }, // Ctrl+N (new window)
    ];

    for (const shortcut of blockedShortcuts) {
      if (e.key === shortcut.key) {
        if (shortcut.ctrl && ctrlKey) {
          if (shortcut.shift && e.shiftKey) {
            e.preventDefault();
            reportViolation('keyboard-shortcut');
            return;
          } else if (!shortcut.shift && !e.shiftKey) {
            e.preventDefault();
            reportViolation('keyboard-shortcut');
            return;
          }
        } else if (!shortcut.ctrl && !ctrlKey) {
          e.preventDefault();
          reportViolation('keyboard-shortcut');
          return;
        }
      }
    }

    // Block F-keys (F1-F12)
    if (e.key.startsWith('F') && e.key.length <= 3) {
      const fKeyNum = parseInt(e.key.substring(1));
      if (fKeyNum >= 1 && fKeyNum <= 12) {
        e.preventDefault();
        reportViolation('keyboard-shortcut');
      }
    }
  }, [enabled, reportViolation]);

  // Before unload handler (page refresh/close)
  const handleBeforeUnload = useCallback((e: BeforeUnloadEvent) => {
    if (enabled) {
      e.preventDefault();
      e.returnValue = 'Are you sure you want to leave? Your exam will be submitted.';
      reportViolation('page-refresh');
      return e.returnValue;
    }
  }, [enabled, reportViolation]);

  // Disable text selection
  const disableTextSelection = useCallback(() => {
    if (enabled) {
      document.body.style.userSelect = 'none';
      document.body.style.webkitUserSelect = 'none';
      (document.body.style as any).mozUserSelect = 'none';
      (document.body.style as any).msUserSelect = 'none';
    }
  }, [enabled]);

  // Enable text selection
  const enableTextSelection = useCallback(() => {
    document.body.style.userSelect = '';
    document.body.style.webkitUserSelect = '';
    (document.body.style as any).mozUserSelect = '';
    (document.body.style as any).msUserSelect = '';
  }, []);

  // Initialize security
  useEffect(() => {
    if (!enabled) return;

    // Enter fullscreen on mount
    const initSecurity = async () => {
      await enterFullscreen();
      hasInitializedRef.current = true;
    };
    
    initSecurity();
    disableTextSelection();

    // Add all event listeners
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('mozfullscreenchange', handleFullscreenChange);
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
    document.addEventListener('msfullscreenchange', handleFullscreenChange);
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    window.addEventListener('blur', handleWindowBlur);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);
    window.addEventListener('beforeunload', handleBeforeUnload);

    // Cleanup function
    return () => {
      if (violationTimeoutRef.current) {
        clearTimeout(violationTimeoutRef.current);
      }

      // Remove all event listeners
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange);
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange);
      document.removeEventListener('msfullscreenchange', handleFullscreenChange);
      
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('blur', handleWindowBlur);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('beforeunload', handleBeforeUnload);

      enableTextSelection();
      exitFullscreen();
    };
  }, [
    enabled,
    enterFullscreen,
    exitFullscreen,
    handleFullscreenChange,
    handleVisibilityChange,
    handleWindowBlur,
    handleContextMenu,
    handleCopyPaste,
    handleKeyDown,
    handleBeforeUnload,
    disableTextSelection,
    enableTextSelection
  ]);

  return {
    violationCount,
    isFullscreen,
    enterFullscreen,
    exitFullscreen,
    reportViolation
  };
}
