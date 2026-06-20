import React, { createContext, useContext, useState, type ReactNode } from 'react';
import { Product } from '../types';

interface ChatContextType {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  inputText: string;
  setInputText: (text: string) => void;
  productContext: Product | null;
  setProductContext: (product: Product | null) => void;
  triggerChat: (message?: string, product?: Product) => void;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputText, setInputText] = useState('');
  const [productContext, setProductContext] = useState<Product | null>(null);

  const triggerChat = (message?: string, product?: Product) => {
    setIsOpen(true);
    if (message) {
      setInputText(message);
    }
    if (product) {
      setProductContext(product);
    }
  };

  return (
    <ChatContext.Provider value={{ isOpen, setIsOpen, inputText, setInputText, triggerChat, productContext, setProductContext }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (!context) {
    throw new Error('useChat must be used within a ChatProvider');
  }
  return context;
}
