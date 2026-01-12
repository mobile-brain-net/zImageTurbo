'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { AspectRatio, GenerateApiResponse, StatusApiResponse } from '@/types';
import LoadingSpinner from './LoadingSpinner';

const ASPECT_RATIOS: { value: AspectRatio; label: string }[] = [
  { value: '1:1', label: '1:1 (Square)' },
  { value: '4:3', label: '4:3 (Landscape)' },
  { value: '3:4', label: '3:4 (Portrait)' },
  { value: '16:9', label: '16:9 (Wide)' },
  { value: '9:16', label: '9:16 (Tall)' },
];

const MAX_CHARS = 1000;
const POLL_INTERVAL = 2000; // 2 seconds
const MAX_POLL_ATTEMPTS = 30; // 60 seconds timeout

export default function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('1:1');
  const [taskId, setTaskId] = useState<string | null>(null);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollAttempts, setPollAttempts] = useState(0);
  const [pollingStatus, setPollingStatus] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string | null>(null);
  const [generatedAspectRatio, setGeneratedAspectRatio] = useState<AspectRatio | null>(null);
  const [startTime, setStartTime] = useState<number | null>(null);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  const charsRemaining = MAX_CHARS - prompt.length;
  const isPromptValid = prompt.trim().length > 0 && prompt.length <= MAX_CHARS;

  // Timer logic for elapsed time
  useEffect(() => {
    if (!loading || !startTime) return;

    const interval = setInterval(() => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setElapsedSeconds(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [loading, startTime]);

  // Polling logic using useEffect
  useEffect(() => {
    if (!taskId || !loading) return;

    let timeoutId: NodeJS.Timeout;

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/status?task_id=${taskId}`);
        const data: StatusApiResponse = await response.json();

        if (!data.success) {
          setError(data.error || 'Failed to check status');
          setLoading(false);
          setTaskId(null);
          return;
        }

        if (data.status === 'SUCCESS' && data.imageUrl) {
          // Success - display image
          setImageUrl(data.imageUrl);
          setGeneratedPrompt(data.prompt || prompt);
          setGeneratedAspectRatio(data.aspect_ratio || aspectRatio);
          setLoading(false);
          setTaskId(null);
          setPollingStatus('');
          setPollAttempts(0);
          setStartTime(null);
          setElapsedSeconds(0);
        } else if (data.status === 'FAILED') {
          // Failed - display error
          setError(data.error || 'Image generation failed');
          setLoading(false);
          setTaskId(null);
          setPollingStatus('');
          setPollAttempts(0);
          setStartTime(null);
          setElapsedSeconds(0);
        } else if (data.status === 'IN_PROGRESS') {
          // Still in progress - continue polling
          const newAttempts = pollAttempts + 1;
          setPollAttempts(newAttempts);

          if (newAttempts >= MAX_POLL_ATTEMPTS) {
            // Timeout
            setError('Generation is taking longer than expected. Please try again.');
            setLoading(false);
            setTaskId(null);
            setPollingStatus('');
            setPollAttempts(0);
            setStartTime(null);
            setElapsedSeconds(0);
          } else {
            // Update status message
            if (newAttempts < 5) {
              setPollingStatus('Generating your image...');
            } else if (newAttempts < 15) {
              setPollingStatus('Still generating...');
            } else {
              setPollingStatus('Almost done...');
            }

            // Schedule next poll
            timeoutId = setTimeout(pollStatus, POLL_INTERVAL);
          }
        }
      } catch (err) {
        console.error('Polling error:', err);
        setError('Failed to connect. Please try again.');
        setLoading(false);
        setTaskId(null);
        setPollingStatus('');
        setPollAttempts(0);
        setStartTime(null);
        setElapsedSeconds(0);
      }
    };

    // Start polling
    pollStatus();

    // Cleanup function
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }
    };
  }, [taskId, loading, pollAttempts, prompt, aspectRatio]);

  const handleGenerate = async () => {
    // Clear previous results and errors
    setError(null);
    setImageUrl(null);
    setGeneratedPrompt(null);
    setGeneratedAspectRatio(null);
    setPollAttempts(0);
    setPollingStatus('Starting generation...');
    setLoading(true);
    setStartTime(Date.now());
    setElapsedSeconds(0);

    try {
      const response = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: prompt.trim(),
          aspect_ratio: aspectRatio,
        }),
      });

      const data: GenerateApiResponse = await response.json();

      if (!data.success || !data.task_id) {
        setError(data.error || 'Failed to start generation');
        setLoading(false);
        setPollingStatus('');
        setStartTime(null);
        setElapsedSeconds(0);
        return;
      }

      // Set task ID to trigger polling
      setTaskId(data.task_id);
      setPollingStatus('Generating your image...');
    } catch (err) {
      console.error('Generate error:', err);
      setError('Failed to connect. Please try again.');
      setLoading(false);
      setPollingStatus('');
      setStartTime(null);
      setElapsedSeconds(0);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto space-y-8">
      {/* Input Section */}
      <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
        <div>
          <label htmlFor="prompt" className="block text-sm font-medium text-gray-700 mb-2">
            Image Prompt
          </label>
          <textarea
            id="prompt"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Describe the image you want to generate..."
            rows={4}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
            disabled={loading}
          />
          <div className="mt-2 text-sm text-gray-600 text-right">
            {charsRemaining >= 0 ? (
              <span className={charsRemaining < 100 ? 'text-orange-600' : ''}>
                {charsRemaining} characters remaining
              </span>
            ) : (
              <span className="text-red-600">
                {Math.abs(charsRemaining)} characters over limit
              </span>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="aspectRatio" className="block text-sm font-medium text-gray-700 mb-2">
            Aspect Ratio
          </label>
          <select
            id="aspectRatio"
            value={aspectRatio}
            onChange={(e) => setAspectRatio(e.target.value as AspectRatio)}
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
            disabled={loading}
          >
            {ASPECT_RATIOS.map((ratio) => (
              <option key={ratio.value} value={ratio.value}>
                {ratio.label}
              </option>
            ))}
          </select>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!isPromptValid || loading}
          className="w-full bg-primary hover:bg-primary-dark text-white font-medium py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {loading ? 'Generating...' : 'Generate Image'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      {/* Loading Status */}
      {loading && (
        <div className="bg-white rounded-lg shadow-md p-8 space-y-4">
          <LoadingSpinner />
          {pollingStatus && (
            <p className="text-center text-gray-600 text-sm">{pollingStatus}</p>
          )}
          <div className="text-center space-y-1">
            <p className="text-gray-600 text-sm">
              Elapsed: {elapsedSeconds}s
            </p>
            <p className="text-gray-500 text-xs">
              Est. remaining: ~{Math.max(0, 60 - elapsedSeconds)}s (max 60s)
            </p>
            <p className="text-center text-gray-400 text-xs mt-2">
              Attempt {pollAttempts} of {MAX_POLL_ATTEMPTS}
            </p>
          </div>
        </div>
      )}

      {/* Image Display */}
      {imageUrl && generatedPrompt && !loading && (
        <div className="bg-white rounded-lg shadow-md p-6 space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">Generated Image</h2>
            <p className="text-gray-600 italic">&ldquo;{generatedPrompt}&rdquo;</p>
            {generatedAspectRatio && (
              <p className="text-sm text-gray-500 mt-1">
                Aspect Ratio: {generatedAspectRatio}
              </p>
            )}
          </div>
          <div className="relative w-full">
            <Image
              src={imageUrl}
              alt={generatedPrompt}
              width={1024}
              height={1024}
              className="w-full h-auto rounded-lg"
              unoptimized
            />
          </div>
        </div>
      )}
    </div>
  );
}
