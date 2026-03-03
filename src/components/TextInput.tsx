import React, { useState } from 'react';
import { Link2, ArrowRight } from 'lucide-react';
import { generateSVG } from '../utils/qrUtils';
import './TextInput.css';

interface TextInputProps {
    onSuccess: (svgString: string, originalText: string) => void;
    onError: (error: string) => void;
}

export const TextInput: React.FC<TextInputProps> = ({ onSuccess, onError }) => {
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim()) {
            onError('Please enter a valid URL or text');
            return;
        }

        setIsLoading(true);
        try {
            const svg = await generateSVG(inputValue.trim());
            onSuccess(svg, inputValue.trim());
        } catch (err) {
            onError(err instanceof Error ? err.message : 'Failed to generate QR code');
        } finally {
            setIsLoading(false);
            setInputValue('');
        }
    };

    return (
        <form className="text-input-container" onSubmit={handleSubmit}>
            <div className="input-wrapper">
                <Link2 className="input-icon" size={20} />
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    placeholder="Paste URL or Text here..."
                    className="url-input"
                    disabled={isLoading}
                />
                <button
                    type="submit"
                    className="submit-button"
                    disabled={!inputValue.trim() || isLoading}
                >
                    {isLoading ? (
                        <div className="btn-loader"></div>
                    ) : (
                        <>
                            <span>Generate</span>
                            <ArrowRight size={16} />
                        </>
                    )}
                </button>
            </div>
        </form>
    );
};
