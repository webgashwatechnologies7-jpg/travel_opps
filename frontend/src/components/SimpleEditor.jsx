import React, { useRef, useEffect } from 'react';
import { Bold, Italic, Underline, List, ListOrdered, AlignLeft, AlignCenter, AlignRight } from 'lucide-react';

const SimpleEditor = ({ value, onChange, placeholder }) => {
    const contentRef = useRef(null);

    useEffect(() => {
        if (contentRef.current && contentRef.current.innerHTML !== value) {
            // Only update if content is different to avoid cursor jumping
            // Simple check: if empty and value is empty, do nothing.
            // If value is provided and innerHTML is empty, set it.
            if (value && contentRef.current.innerHTML === '') {
                contentRef.current.innerHTML = value;
            } else if (value && value !== contentRef.current.innerHTML) {
                // This is tricky with contentEditable. For now, only set on initial load or if drastically different?
                // Better strategy: Only set if user is NOT typing. But we don't know.
                // Common React Pattern for contentEditable is hard.
                // Let's use a simple textarea if this is too complex, OR rely on a library.
                // Actually, let's try to set it only if custom data attribute mismatches?
                // Or just setting it.
                if (document.activeElement !== contentRef.current) {
                    contentRef.current.innerHTML = value || '';
                }
            }
        }
    }, [value]);

    const execCommand = (command, value = null) => {
        document.execCommand(command, false, value);
        if (contentRef.current) {
            onChange(contentRef.current.innerHTML);
        }
    };

    const handleInput = (e) => {
        onChange(e.currentTarget.innerHTML);
    };

    return (
        <div className="border border-gray-300 rounded-lg overflow-hidden focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-transparent">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 bg-gray-50 border-b border-gray-200">
                <button
                    type="button"
                    onClick={() => execCommand('bold')}
                    className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                    title="Bold"
                >
                    <Bold className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('italic')}
                    className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                    title="Italic"
                >
                    <Italic className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('underline')}
                    className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                    title="Underline"
                >
                    <Underline className="w-4 h-4" />
                </button>
                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                <button
                    type="button"
                    onClick={() => execCommand('insertUnorderedList')}
                    className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                    title="Bullet List"
                >
                    <List className="w-4 h-4" />
                </button>
                <button
                    type="button"
                    onClick={() => execCommand('insertOrderedList')}
                    className="p-1.5 hover:bg-gray-200 rounded text-gray-700 hover:text-gray-900"
                    title="Numbered List"
                >
                    <ListOrdered className="w-4 h-4" />
                </button>
            </div>

            {/* Editor Area */}
            <div
                ref={contentRef}
                contentEditable
                className="min-h-[200px] p-4 outline-none prose max-w-none text-sm"
                onInput={handleInput}
                placeholder={placeholder}
                style={{ whiteSpace: 'pre-wrap' }}
            />
            {/* Note: whiteSpace: pre-wrap might not be needed for contentEditable as it uses divs/p tags */}
        </div>
    );
};

export default SimpleEditor;
