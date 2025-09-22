"use client";

import "@crayonai/react-ui/styles/index.css";
import {
  C1Chat,
  useThreadListManager,
  useThreadManager,
  useC1State
} from "@thesysai/genui-sdk";
import * as apiClient from "@/src/apiClient";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const colors = {
  // Calculator specific colors (iOS style)
  calculatorBg: '#000000',
  displayBg: '#000000',
  displayText: '#ffffff',
  numberButton: '#333333',
  numberButtonText: '#ffffff',
  operatorButton: '#ff9500',
  operatorButtonText: '#ffffff',
  functionButton: '#a6a6a6',
  functionButtonText: '#000000',
  
  // Original app colors
  primary: '#e2e8f0', 
  primaryDark: '#a0aec0',
  background: '#1a202c',
  surface: '#2d3748',
  text: '#e2e8f0',
  textSecondary: '#a0aec0',
  border: '#4a5568',
  success: '#2d3748',
  white: '#ffffff',
  black: '#1a202c',
};


const Calculator = ({ initialValue = '0', operation = null, previousValue = null, waitingForOperand = false }: { 
  initialValue?: string; 
  operation?: string | null; 
  previousValue?: number | null; 
  waitingForOperand?: boolean; 
}) => {
  const { getValue, setValue } = useC1State('calculator');

  // Get calculator state from C1State or use props/defaults
  const calculatorState = getValue() || {
    display: initialValue,
    previousValue,
    operation,
    waitingForOperand,
    expression: ''
  };

  const { display, previousValue: prevValue, operation: currentOp, waitingForOperand: waiting, expression } = calculatorState;

  const updateState = (newState: Partial<typeof calculatorState>) => {
    setValue({ ...calculatorState, ...newState });
  };

  const inputNumber = (num: string) => {
    if (waiting) {
      updateState({ display: String(num), waitingForOperand: false });
    } else {
      // Clear expression when starting a new number after equals
      const newState: Partial<typeof calculatorState> = { 
        display: display === '0' ? String(num) : display + num 
      };
      if (!currentOp && expression) {
        newState.expression = '';
      }
      updateState(newState);
    }
  };

  const inputDecimal = () => {
    if (waiting) {
      updateState({ display: '0.', waitingForOperand: false });
    } else if (display.indexOf('.') === -1) {
      updateState({ display: display + '.' });
    }
  };

  const clear = () => {
    updateState({
      display: '0',
      previousValue: null,
      operation: null,
      waitingForOperand: false,
      expression: ''
    });
  };

  const toggleSign = () => {
    if (display !== '0') {
      const newDisplay = display.startsWith('-') ? display.slice(1) : '-' + display;
      updateState({ display: newDisplay });
    }
  };

  const percentage = () => {
    const value = parseFloat(display) / 100;
    updateState({ display: String(value) });
  };

  const performOperation = (nextOperation: string) => {
    const inputValue = parseFloat(display);

    if (prevValue === null) {
      updateState({
        previousValue: inputValue,
        waitingForOperand: true,
        operation: nextOperation,
        expression: `${inputValue} ${nextOperation}`
      });
    } else if (currentOp) {
      const currentValue = prevValue || 0;
      const newValue = calculate(currentValue, inputValue, currentOp);

      updateState({
        display: String(newValue),
        previousValue: newValue,
        waitingForOperand: true,
        operation: nextOperation,
        expression: `${newValue} ${nextOperation}`
      });
    }
  };

  const calculate = (firstValue: number, secondValue: number, operation: string): number => {
    switch (operation) {
      case '+':
        return firstValue + secondValue;
      case '-':
        return firstValue - secondValue;
      case '×':
        return firstValue * secondValue;
      case '÷':
        return firstValue / secondValue;
      case '=':
        return secondValue;
      default:
        return secondValue;
    }
  };

  const handleEquals = () => {
    const inputValue = parseFloat(display);

    if (prevValue !== null && currentOp) {
      const newValue = calculate(prevValue, inputValue, currentOp);
      const fullExpression = `${prevValue} ${currentOp} ${inputValue}`;
      updateState({
        display: String(newValue),
        previousValue: null,
        operation: null,
        waitingForOperand: true,
        expression: fullExpression
      });
    }
  };

  // iOS-style button styles
  const baseButtonStyle = {
    width: '80px',
    height: '80px',
    borderRadius: '50%',
    border: 'none',
    fontSize: '32px',
    fontWeight: '400',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    transition: 'all 0.1s ease',
    userSelect: 'none' as const,
  };

  const numberButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: colors.numberButton,
    color: colors.numberButtonText,
  };

  const operatorButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: currentOp && !waiting ? colors.numberButton : colors.operatorButton,
    color: colors.operatorButtonText,
  };

  const functionButtonStyle = {
    ...baseButtonStyle,
    backgroundColor: colors.functionButton,
    color: colors.functionButtonText,
  };

  const zeroButtonStyle = {
    ...baseButtonStyle,
    width: '168px',
    borderRadius: '40px',
    justifyContent: 'flex-start',
    paddingLeft: '30px',
    backgroundColor: colors.numberButton,
    color: colors.numberButtonText,
  };

  return (
    <div style={{
      backgroundColor: colors.calculatorBg,
      padding: '20px',
      borderRadius: '20px',
      width: '100%',
      maxWidth: '380px',
      margin: '0 auto',
      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
    }}>
      {/* Display */}
      <div style={{
        backgroundColor: colors.displayBg,
        color: colors.displayText,
        padding: '20px 20px 20px 20px',
        marginBottom: '20px',
        minHeight: '120px',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'flex-end',
        alignItems: 'flex-end',
        overflow: 'hidden',
        textAlign: 'right',
      }}>
        {/* Expression display (smaller, top) */}
        {expression && (
          <div style={{
            fontSize: '24px',
            fontWeight: '300',
            color: '#ff9500',
            marginBottom: '8px',
            opacity: 0.8,
          }}>
            {expression}
          </div>
        )}
        
        {/* Main result display (larger, bottom) */}
        <div style={{
          fontSize: display.length > 6 ? '48px' : '64px',
          fontWeight: '200',
          wordBreak: 'break-all',
        }}>
          {display}
        </div>
      </div>

      {/* Button Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: '12px',
        justifyItems: 'center',
      }}>
        {/* Row 1 */}
        <button onClick={clear} style={functionButtonStyle}>C</button>
        <button onClick={toggleSign} style={functionButtonStyle}>+/-</button>
        <button onClick={percentage} style={functionButtonStyle}>%</button>
        <button onClick={() => performOperation('÷')} style={operatorButtonStyle}>÷</button>

        {/* Row 2 */}
        <button onClick={() => inputNumber('7')} style={numberButtonStyle}>7</button>
        <button onClick={() => inputNumber('8')} style={numberButtonStyle}>8</button>
        <button onClick={() => inputNumber('9')} style={numberButtonStyle}>9</button>
        <button onClick={() => performOperation('×')} style={operatorButtonStyle}>×</button>

        {/* Row 3 */}
        <button onClick={() => inputNumber('4')} style={numberButtonStyle}>4</button>
        <button onClick={() => inputNumber('5')} style={numberButtonStyle}>5</button>
        <button onClick={() => inputNumber('6')} style={numberButtonStyle}>6</button>
        <button onClick={() => performOperation('-')} style={operatorButtonStyle}>-</button>

        {/* Row 4 */}
        <button onClick={() => inputNumber('1')} style={numberButtonStyle}>1</button>
        <button onClick={() => inputNumber('2')} style={numberButtonStyle}>2</button>
        <button onClick={() => inputNumber('3')} style={numberButtonStyle}>3</button>
        <button onClick={() => performOperation('+')} style={operatorButtonStyle}>+</button>

        {/* Row 5 */}
        <div style={{ gridColumn: 'span 2' }}>
          <button onClick={() => inputNumber('0')} style={zeroButtonStyle}>0</button>
        </div>
        <button onClick={inputDecimal} style={numberButtonStyle}>.</button>
        <button onClick={handleEquals} style={operatorButtonStyle}>=</button>
      </div>
    </div>
  );
};

const VideoPlayer = ({ videoUrl = '', autoplay = false }: { 
  videoUrl?: string; 
  autoplay?: boolean; 
}) => {
  const { getValue, setValue } = useC1State('videoPlayer');
  const [inputUrl, setInputUrl] = useState('');
  const [showPlayer, setShowPlayer] = useState(false);
  
  // Get video player state from C1State or use props/defaults
  const videoPlayerState = getValue() || {
    currentVideoUrl: videoUrl,
    isPlaying: false,
    showPlayer: !!videoUrl
  };

  const { currentVideoUrl, showPlayer: stateShowPlayer } = videoPlayerState;

  const updateState = (newState: Partial<typeof videoPlayerState>) => {
    setValue({ ...videoPlayerState, ...newState });
  };

  const handleSubmit = () => {
    if (inputUrl.trim()) {
      updateState({
        currentVideoUrl: inputUrl.trim(),
        showPlayer: true,
        isPlaying: autoplay
      });
      setShowPlayer(true);
    }
  };

  const handlePlay = () => {
    updateState({ isPlaying: true });
  };

  const handlePause = () => {
    updateState({ isPlaying: false });
  };

  const handleReset = () => {
    updateState({
      currentVideoUrl: '',
      showPlayer: false,
      isPlaying: false
    });
    setShowPlayer(false);
    setInputUrl('');
  };

  const isYouTubeUrl = (url: string) => {
    return url.includes('youtube.com') || url.includes('youtu.be');
  };

  const getYouTubeEmbedUrl = (url: string) => {
    let videoId = '';
    if (url.includes('youtube.com/watch?v=')) {
      videoId = url.split('youtube.com/watch?v=')[1].split('&')[0];
    } else if (url.includes('youtu.be/')) {
      videoId = url.split('youtu.be/')[1].split('?')[0];
    }
    return `https://www.youtube.com/embed/${videoId}?autoplay=${autoplay ? 1 : 0}`;
  };

  const currentUrl = currentVideoUrl || stateShowPlayer;
  const displayPlayer = showPlayer || stateShowPlayer;

  return (
    <div style={{
      backgroundColor: colors.surface,
      padding: '24px',
      borderRadius: '16px',
      width: '100%',
      maxWidth: '600px',
      margin: '0 auto',
      fontFamily: 'SF Pro Display, -apple-system, BlinkMacSystemFont, sans-serif',
      border: `1px solid ${colors.border}`,
      boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    }}>
      <h3 style={{ color: colors.text, margin: '0 0 20px 0', fontSize: '1.5rem' }}>
        🎬 Video Player
      </h3>

      {!displayPlayer ? (
        // Input Form
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <input
            type="text"
            placeholder="Enter video URL (YouTube, MP4, etc.)"
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            style={{
              padding: '12px 16px',
              borderRadius: '8px',
              border: `1px solid ${colors.border}`,
              backgroundColor: colors.background,
              color: colors.text,
              fontSize: '16px',
              outline: 'none',
            }}
            onKeyPress={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <button
            onClick={handleSubmit}
            disabled={!inputUrl.trim()}
            style={{
              backgroundColor: inputUrl.trim() ? colors.operatorButton : colors.border,
              color: colors.white,
              border: 'none',
              borderRadius: '8px',
              padding: '12px 24px',
              fontSize: '16px',
              fontWeight: '600',
              cursor: inputUrl.trim() ? 'pointer' : 'not-allowed',
              transition: 'all 0.2s ease',
            }}
          >
            Load Video
          </button>
        </div>
      ) : (
        // Video Player
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{
            position: 'relative',
            width: '100%',
            paddingBottom: '56.25%', // 16:9 aspect ratio
            backgroundColor: colors.black,
            borderRadius: '12px',
            overflow: 'hidden',
          }}>
            {isYouTubeUrl(currentUrl) ? (
              <iframe
                src={getYouTubeEmbedUrl(currentUrl)}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  border: 'none',
                }}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              />
            ) : (
              <video
                src={currentUrl}
                controls
                autoPlay={autoplay}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                }}
                onPlay={handlePlay}
                onPause={handlePause}
              />
            )}
          </div>

          {/* Controls */}
          <div style={{
            display: 'flex',
            gap: '12px',
            justifyContent: 'center',
            alignItems: 'center',
          }}>
            <button
              onClick={handleReset}
              style={{
                backgroundColor: colors.functionButton,
                color: colors.functionButtonText,
                border: 'none',
                borderRadius: '8px',
                padding: '8px 16px',
                fontSize: '14px',
                fontWeight: '500',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
              }}
            >
              Load New Video
            </button>
          </div>

          {/* Video Info */}
          <div style={{
            backgroundColor: colors.background,
            padding: '12px 16px',
            borderRadius: '8px',
            border: `1px solid ${colors.border}`,
          }}>
            <p style={{
              margin: 0,
              color: colors.textSecondary,
              fontSize: '14px',
              wordBreak: 'break-all',
            }}>
              <strong>Playing:</strong> {currentUrl}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default function Home() {
  const searchParams = useSearchParams();
  const threadIdInUrl = searchParams.get("threadId");
  const pathname = usePathname();
  const { replace } = useRouter();

  const threadListManager = useThreadListManager({
    fetchThreadList: () => apiClient.getThreadList(),
    deleteThread: (threadId) => apiClient.deleteThread(threadId),
    updateThread: (t) => apiClient.updateThread(t),
    onSwitchToNew: () => {
      replace(`${pathname}`);
    },
    onSelectThread: (threadId) => {
      const newSearch = `?threadId=${threadId}`;
      replace(`${pathname}${newSearch}`);
    },
    createThread: (message) => {
      return apiClient.createThread(message.message!);
    },
  });

  const threadManager = useThreadManager({
    threadListManager,
    loadThread: (threadId) => apiClient.getMessages(threadId),
    onUpdateMessage: ({ message }) => {
      apiClient.updateMessage(threadListManager.selectedThreadId!, message);
    },
    apiUrl: "/api/chat",
    customizeC1: {
      customComponents: {
        Calculator,
        VideoPlayer,
      },
    },
  });

  useEffect(() => {
    // at the first render, if there is a threadId in the url, select the thread
    if (threadIdInUrl && threadListManager.selectedThreadId !== threadIdInUrl) {
      threadListManager.selectThread(threadIdInUrl);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <C1Chat
      threadManager={threadManager}
      threadListManager={threadListManager}
    />
  );
}
