'use client';

import { useState } from 'react';
import { createNewScript } from '@/app/actions/script-actions';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faFileCirclePlus, faFilm, faGears, faChartArea } from '@fortawesome/free-solid-svg-icons';

export default function ScriptCreator() {
  const [scriptTitle, setScriptTitle] = useState('');
  const [fps, setFps] = useState(30);
  const [resolution, setResolution] = useState({ width: 1920, height: 1080 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleCreateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      await createNewScript({
        title: scriptTitle,
        fps,
        resolution
      });

      // Reset form
      setScriptTitle('');
      
      // You might want to redirect to the script editor or show a success message
      console.log('Script created successfully');
      
    } catch (error) {
      console.error('Error creating script:', error);
      setError('Failed to create script. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-lg shadow-sm border border-purple-100 overflow-hidden">
        <div className="bg-gradient-to-r from-purple-50 to-transparent border-b border-purple-100 p-6">
          <h2 className="text-2xl font-bold text-purple-900 flex items-center gap-2">
            <FontAwesomeIcon icon={faFilm} className="text-purple-600" />
            Create New Script
          </h2>
        </div>

        <form onSubmit={handleCreateScript} className="p-6 space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 text-red-600 rounded-lg text-center">
              {error}
            </div>
          )}

          <div className="space-y-4">
            <label className="block">
              <span className="text-sm font-medium text-purple-900 flex items-center gap-2">
                <FontAwesomeIcon icon={faFileCirclePlus} className="text-purple-600" />
                Script Title
              </span>
              <input
                type="text"
                value={scriptTitle}
                onChange={(e) => setScriptTitle(e.target.value)}
                className="mt-1 block w-full p-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                required
                placeholder="Enter script title..."
              />
            </label>

            <div>
              <span className="text-sm font-medium text-purple-900 flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faGears} className="text-purple-600" />
                Frames Per Second
              </span>
              <div className="flex items-center gap-4">
                <input
                  type="range"
                  id="fps"
                  value={fps}
                  onChange={(e) => setFps(parseInt(e.target.value))}
                  min="1"
                  max="60"
                  className="flex-1 h-2 bg-purple-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <span className="text-sm font-mono bg-purple-50 px-2 py-1 rounded">
                  {fps} FPS
                </span>
              </div>
            </div>

            <div>
              <span className="text-sm font-medium text-purple-900 flex items-center gap-2 mb-2">
                <FontAwesomeIcon icon={faChartArea} className="text-purple-600" />
                Resolution
              </span>
              <div className="grid grid-cols-2 gap-4">
                <label className="block">
                  <span className="text-sm text-purple-700">Width</span>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      value={resolution.width}
                      onChange={(e) => setResolution(prev => ({ ...prev, width: parseInt(e.target.value) }))}
                      min="480"
                      max="3840"
                      className="block w-full p-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-purple-400">
                      px
                    </span>
                  </div>
                </label>

                <label className="block">
                  <span className="text-sm text-purple-700">Height</span>
                  <div className="mt-1 relative">
                    <input
                      type="number"
                      value={resolution.height}
                      onChange={(e) => setResolution(prev => ({ ...prev, height: parseInt(e.target.value) }))}
                      min="360"
                      max="2160"
                      className="block w-full p-2.5 bg-white border border-purple-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-purple-400">
                      px
                    </span>
                  </div>
                </label>
              </div>
            </div>
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={loading || !scriptTitle}
              className={`w-full flex justify-center items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                loading || !scriptTitle
                  ? 'bg-purple-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 hover:shadow-lg transform hover:-translate-y-0.5'
              } text-white`}
            >
              <FontAwesomeIcon icon={faFileCirclePlus} className={loading ? 'animate-spin' : ''} />
              {loading ? 'Creating...' : 'Create Script'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}