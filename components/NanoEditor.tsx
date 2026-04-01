"use client";

import { useState, useEffect, useRef } from 'react';

interface NanoEditorProps {
  filePath: string;
  initialContent: string;
  onSave: (content: string) => Promise<string | null>;
  onExit: () => void;
}

export default function NanoEditor({ filePath, initialContent, onSave, onExit }: NanoEditorProps) {
  const [content, setContent] = useState(initialContent);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showSavePrompt, setShowSavePrompt] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [currentLine, setCurrentLine] = useState(1);
  const [currentCol, setCurrentCol] = useState(1);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.focus();
      // Position cursor at beginning for existing files, end for new files
      textareaRef.current.setSelectionRange(0, 0);
    }
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey) {
      switch (e.key.toLowerCase()) {
        case 'x': // ^X - Exit
          e.preventDefault();
          if (hasUnsavedChanges) {
            setShowSavePrompt(true);
          } else {
            onExit();
          }
          break;
        case 'o': // ^O - Save
          e.preventDefault();
          handleSave();
          break;
      }
    }
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setContent(e.target.value);
    setHasUnsavedChanges(true);
    updateCursorPosition();
  };

  const handleSelectionChange = () => {
    updateCursorPosition();
  };

  const updateCursorPosition = () => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const lines = content.substring(0, start).split('\n');
    const line = lines.length;
    const col = lines[lines.length - 1].length + 1;
    setCurrentLine(line);
    setCurrentCol(col);
  };

  const handleSave = async () => {
    setIsSaving(true);
    setSaveMessage('');
    try {
      const error = await onSave(content);
      if (error === null) {
        setHasUnsavedChanges(false);
        setSaveMessage('File saved successfully');
        setTimeout(() => setSaveMessage(''), 2000);
      } else {
        setSaveMessage(error);
        setTimeout(() => setSaveMessage(''), 3000);
      }
    } catch (error) {
      setSaveMessage('Error saving file');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
      setShowSavePrompt(false);
    }
  };

  const handleExitWithoutSaving = () => {
    onExit();
  };

  const getFileName = () => {
    return filePath.split('/').pop() || filePath;
  };

  if (showSavePrompt) {
    return (
      <div className="h-screen bg-black text-green-400 font-mono flex items-center justify-center p-8">
        <div className="bg-gray-900 border border-yellow-400 rounded-lg p-6 max-w-md w-full">
          <div className="text-center">
            <div className="text-yellow-400 font-semibold mb-4">Save file?</div>
            <p className="text-gray-300 mb-6 text-sm">
              You have unsaved changes. Save before exiting?
            </p>
            <div className="flex justify-center space-x-4">
              <button
                onClick={handleSave}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded font-semibold transition-colors"
              >
                Save
              </button>
              <button
                onClick={handleExitWithoutSaving}
                className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded font-semibold transition-colors"
              >
                Don&apos;t Save
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen bg-black text-green-400 font-mono flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 text-white px-4 py-2 border-b border-gray-700 flex justify-between items-center flex-shrink-0">
        <div className="font-semibold">{getFileName()}</div>
        <div className="text-sm">
          {saveMessage && (
            <span className={`px-2 py-1 rounded text-xs ${
              saveMessage.includes('successfully')
                ? 'bg-green-600 text-white'
                : 'bg-red-600 text-white'
            }`}>
              {saveMessage}
            </span>
          )}
          {isSaving && <span className="text-yellow-400">Saving...</span>}
          {!saveMessage && !isSaving && hasUnsavedChanges && <span className="text-green-400">[Modified]</span>}
        </div>
      </div>

      {/* Editor area */}
      <div className="flex-1 overflow-hidden flex">
        {/* Line numbers */}
        <div className="bg-gray-900 text-gray-500 font-mono text-sm p-4 select-none border-r border-gray-700 overflow-auto">
          {content.split('\n').map((_, index) => (
            <div key={index} className="leading-5 h-5">
              {index + 1}
            </div>
          ))}
        </div>
        {/* Textarea */}
        <textarea
          ref={textareaRef}
          value={content}
          onChange={handleContentChange}
          onKeyDown={handleKeyDown}
          onSelect={handleSelectionChange}
          className="flex-1 h-full bg-black text-green-400 font-mono border-none outline-none resize-none caret-green-400 placeholder-gray-600 overflow-auto"
          placeholder="Start typing..."
          spellCheck={false}
          autoFocus
          style={{ paddingLeft: '1rem', paddingTop: '1rem', paddingBottom: '1rem' }}
        />
      </div>

      {/* Footer with shortcuts */}
      <div className="bg-gray-800 text-gray-300 px-4 py-2 border-t border-gray-700 text-sm flex-shrink-0">
        <div className="flex justify-between">
          <div>
            <span className="text-green-400 font-bold">^O</span> Save
            <span className="mx-4 text-gray-600">|</span>
            <span className="text-green-400 font-bold">^X</span> Exit
          </div>
          <div className="text-gray-500">
            Line {currentLine}, Col {currentCol} | nano {filePath}
          </div>
        </div>
      </div>
    </div>
  );
}