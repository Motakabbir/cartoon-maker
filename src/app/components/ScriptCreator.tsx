'use client';

import { useState } from 'react';
import { createScript, createScene } from '@/lib/database-helpers';

export default function ScriptCreator() {
  const [scriptTitle, setScriptTitle] = useState('');
  const [fps, setFps] = useState(30);
  const [resolution, setResolution] = useState({ width: 1920, height: 1080 });
  const [loading, setLoading] = useState(false);

  const handleCreateScript = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const script = await createScript({
        title: scriptTitle,
        fps,
        resolution
      });

      // Create an initial empty scene
      await createScene({
        scriptId: script.id,
        background: 'default_background',
        lighting: 'natural',
        timeOfDay: 'day',
        weather: 'clear',
        duration: 5.0,
        order: 1
      });

      // Reset form
      setScriptTitle('');
      
      // You might want to redirect to the script editor or show a success message
      console.log('Script created:', script);
      
    } catch (error) {
      console.error('Error creating script:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 max-w-2xl mx-auto bg-white rounded-xl shadow-md">
      <h2 className="text-2xl font-bold mb-6">Create New Script</h2>
      
      <form onSubmit={handleCreateScript} className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700">
            Script Title
          </label>
          <input
            type="text"
            id="title"
            value={scriptTitle}
            onChange={(e) => setScriptTitle(e.target.value)}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            required
          />
        </div>

        <div>
          <label htmlFor="fps" className="block text-sm font-medium text-gray-700">
            Frames Per Second
          </label>
          <input
            type="number"
            id="fps"
            value={fps}
            onChange={(e) => setFps(parseInt(e.target.value))}
            min="1"
            max="60"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="width" className="block text-sm font-medium text-gray-700">
              Width
            </label>
            <input
              type="number"
              id="width"
              value={resolution.width}
              onChange={(e) => setResolution(prev => ({ ...prev, width: parseInt(e.target.value) }))}
              min="480"
              max="3840"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
          <div>
            <label htmlFor="height" className="block text-sm font-medium text-gray-700">
              Height
            </label>
            <input
              type="number"
              id="height"
              value={resolution.height}
              onChange={(e) => setResolution(prev => ({ ...prev, height: parseInt(e.target.value) }))}
              min="360"
              max="2160"
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-gray-400"
        >
          {loading ? 'Creating...' : 'Create Script'}
        </button>
      </form>
    </div>
  );
}