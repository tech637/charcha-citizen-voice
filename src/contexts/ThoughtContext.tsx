import React, { createContext, useContext, useState, ReactNode } from 'react';

export interface Thought {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
  isNew?: boolean;
}

interface ThoughtContextType {
  thoughts: Thought[];
  addThought: (text: string, author: string) => void;
  clearNewThoughts: () => void;
}

const ThoughtContext = createContext<ThoughtContextType | undefined>(undefined);

export const useThoughts = () => {
  const context = useContext(ThoughtContext);
  if (!context) {
    throw new Error('useThoughts must be used within a ThoughtProvider');
  }
  return context;
};

interface ThoughtProviderProps {
  children: ReactNode;
}

export const ThoughtProvider: React.FC<ThoughtProviderProps> = ({ children }) => {
  const [thoughts, setThoughts] = useState<Thought[]>([]);

  const addThought = (text: string, author: string) => {
    const newThought: Thought = {
      id: Math.random().toString(36).substr(2, 9),
      text: text.trim(),
      author: author || 'Anonymous',
      timestamp: new Date(),
      isNew: true
    };

    setThoughts(prev => [newThought, ...prev]);

    // Remove "new" status after 3 seconds
    setTimeout(() => {
      setThoughts(prev => 
        prev.map(thought => 
          thought.id === newThought.id 
            ? { ...thought, isNew: false }
            : thought
        )
      );
    }, 3000);
  };

  const clearNewThoughts = () => {
    setThoughts(prev => 
      prev.map(thought => ({ ...thought, isNew: false }))
    );
  };

  return (
    <ThoughtContext.Provider value={{ thoughts, addThought, clearNewThoughts }}>
      {children}
    </ThoughtContext.Provider>
  );
};
