import React, { useState, useEffect, useRef } from 'react';
import './GlobalLanguageSwitcher.css';

const GlobalLanguageSwitcher = () => {
    const [isOpen, setIsOpen] = useState(false);
    const [currentLang, setCurrentLang] = useState('English');
    const containerRef = useRef(null);
    const googleTranslateRef = useRef(null);

    // Toggle dropdown
    const toggleDropdown = () => setIsOpen(!isOpen);

    // Close when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Load Google Translate Script
    useEffect(() => {
        // Check if script already exists
        if (document.querySelector('script[src*="translate.google.com"]')) {
            return;
        }

        const addScript = document.createElement('script');
        addScript.src = '//translate.google.com/translate_a/element.js?cb=googleTranslateElementInit';
        addScript.async = true;
        document.body.appendChild(addScript);

        window.googleTranslateElementInit = () => {
            if (googleTranslateRef.current) return;
            new window.google.translate.TranslateElement(
                {
                    pageLanguage: 'en',
                    includedLanguages: 'en,es,fr,de,it,ja,zh-CN,ar,hi,pt,ru,ko',
                    layout: window.google.translate.TranslateElement.InlineLayout.SIMPLE,
                    autoDisplay: false,
                },
                'google_translate_element'
            );
            googleTranslateRef.current = true;
        };
    }, []);

    // Handle Language Change
    const changeLanguage = (langCode, langName) => {
        const select = document.querySelector('.goog-te-combo');
        if (select) {
            select.value = langCode;
            select.dispatchEvent(new Event('change'));
        } else {
            // Fallback: Set cookie and reload if select not found
            // This handles cases where the widget hasn't fully loaded or is blocked
            console.warn("Google Translate select not found, falling back to cookie.");
            const domain = window.location.hostname === 'localhost' ? '' : `domain=.${window.location.hostname};`;
            document.cookie = `googtrans=/auto/${langCode}; path=/; ${domain}`;
            document.cookie = `googtrans=/auto/${langCode}; path=/;`;
            window.location.reload();
        }
        setCurrentLang(langName);
        setIsOpen(false);
    };

    const languages = [
        { code: 'en', name: 'English', flag: '🇺🇸' },
        { code: 'es', name: 'Spanish', flag: '🇪🇸' },
        { code: 'fr', name: 'French', flag: '🇫🇷' },
        { code: 'de', name: 'German', flag: '🇩🇪' },
        { code: 'it', name: 'Italian', flag: '🇮🇹' },
        { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
        { code: 'zh-CN', name: 'Chinese', flag: '🇨🇳' },
        { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
        { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
        { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
        { code: 'ru', name: 'Russian', flag: '🇷🇺' },
        { code: 'ko', name: 'Korean', flag: '🇰🇷' },
    ];

    return (
        <div className="global-lang-switcher" ref={containerRef}>
            {/* Hidden Google Translate Element - Opacity 0 to ensure it renders in DOM */}
            <div id="google_translate_element" style={{ position: 'absolute', opacity: 0, pointerEvents: 'none', height: 0, width: 0, overflow: 'hidden' }}></div>

            {/* Floating Button */}
            <button
                className={`lang-float-btn ${isOpen ? 'active' : ''}`}
                onClick={toggleDropdown}
                title="Change Language"
            >
                <i className="fas fa-globe"></i>
            </button>

            {/* Popup Panel (Opens Upwards) */}
            <div className={`lang-panel ${isOpen ? 'open' : ''}`}>
                <div className="lang-header">
                    <span>Select Language</span>
                    <button className="close-btn" onClick={() => setIsOpen(false)}>
                        <i className="fas fa-times"></i>
                    </button>
                </div>
                <div className="lang-grid">
                    {languages.map((lang) => (
                        <button
                            key={lang.code}
                            className={`lang-option ${currentLang === lang.name ? 'selected' : ''}`}
                            onClick={() => changeLanguage(lang.code, lang.name)}
                        >
                            <span className="lang-flag">{lang.flag}</span>
                            <span className="lang-name">{lang.name}</span>
                            {currentLang === lang.name && <i className="fas fa-check"></i>}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default GlobalLanguageSwitcher;
