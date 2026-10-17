import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import './AdminAIMessage.css';

const AdminAIMessage = ({ message }) => {
    const isAI = message.role === 'assistant';

    return (
        <div className={`ai-message-row ${isAI ? 'ai' : 'user'}`}>
            <div className={`message-bubble ${isAI ? 'ai' : 'user'}`}>
                <div className="message-header">
                    <span className={`sender-name ${isAI ? 'ai' : 'user'}`}>
                        {isAI ? 'Nexora AI' : 'You'}
                    </span>
                    <span className={`timestamp ${isAI ? 'ai' : 'user'}`}>
                        {new Date(message.id).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                </div>

                <div className={`message-content ${isAI ? 'ai' : 'user'}`}>
                    {isAI ? (
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                            {message.content}
                        </ReactMarkdown>
                    ) : (
                        <p>{message.content}</p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default AdminAIMessage;
