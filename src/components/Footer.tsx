import React from 'react';
import { Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="mt-16 py-8 border-t border-gray-200 dark:border-gray-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-2 text-gray-600 dark:text-gray-300">
          <span>Created by</span>
          <a
            href="https://github.com/0xsmolrun"
            target="_blank"
            rel="noopener noreferrer"
            className="font-semibold text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 transition-colors"
          >
            0xsmolrun
          </a>
          <span>with</span>
          <Heart className="w-4 h-4 text-red-500 fill-current animate-pulse" />
        </div>
      </div>
    </footer>
  );
};