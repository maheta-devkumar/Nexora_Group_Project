import React from 'react';
import { useVoiceAssistant } from '../../context/VoiceAssistantContext';
import './VoiceAssistant.css';

const VoiceAssistant = () => {
    const { isListening, toggleListening, isSpeaking } = useVoiceAssistant();

    return (
        <button
            className={`voice-assistant-btn ${isListening ? 'listening' : ''} ${isSpeaking ? 'speaking' : ''}`}
            onClick={toggleListening}
            aria-label={isListening ? "Disable Voice Assistant" : "Enable Voice Assistant"}
            title="Voice Assistant (Alt + V)"
        >
            <i className={`fas ${isListening ? 'fa-microphone-alt' : 'fa-microphone'}`}></i>

            {isListening && (
                <span className="voice-pulse-ring"></span>
            )}
        </button>
    );
};

export default VoiceAssistant;
