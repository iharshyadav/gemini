"use client"

import { FC, HTMLAttributes, useEffect, useRef, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import "./new.css"
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";
import { chatbotPrompt } from '@/app/helpers/constants/chatbot-prompt';

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

interface ChatInputProps extends HTMLAttributes<HTMLDivElement> {}

interface Content {
  role: string;
  parts: Part[];
}

interface Part {
  user?: string;
  ai?: string;
}


const ChatInput: FC<ChatInputProps> = ({ className, ...props }) => {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<{ user: string, ai: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [chatHistory, setChatHistory] = useState([
    {
      role: "user",
      parts: messages,
    },
    {
      role: "model",
      parts: messages,
    },
  ])
  const scrollRef = useRef<HTMLDivElement>(null);

  const generationConfig = {
    propmt:chatbotPrompt,
    temperature: 1,
    topP: 0.95,
    topK: 64,
    maxOutputTokens: 8192,
    responseMimeType: "text/plain",
  };

  const safetySettings = [
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
    },
  ];

  async function run(prompt: string) {
    setLoading(true); 
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: chatHistory,
    });

    const result = await model.generateContentStream([prompt]);
    // let responseText = '';

    const currentIndex = messages.length;

    // Add the new user message with an empty AI response
    setMessages((prevMessages) => [
      ...prevMessages,
      { user: prompt, ai: '' },
    ]);

    for await (const chunk of result.stream) {
      const responseText = chunk.text();
      // console.log(responseText);

      setMessages((prevMessages) => {
        const newMessages = [...prevMessages];
        newMessages[currentIndex] = { ...newMessages[currentIndex], ai: newMessages[currentIndex].ai + responseText };
        return newMessages;
      });
    }

    setLoading(false); 
  }
  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await run(input);
    setInput('');
  };

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

    return (
      <div className="relative h-full overflow-y-scroll custom-scrollbar" ref={scrollRef}>
          <ScrollArea className="chat-output w-full p-4 scroll-smooth custom-scrollbar" >
          <>
            {messages.map((item, index) => (
              <div key={index}>
                <ScrollArea className="user-message mb-4 text-right p-3 bg-blue-100 overflow-auto rounded-lg">{item.user}</ScrollArea>
                <ScrollArea className="ai-message mb-4 p-2 bg-red-100 overflow-auto rounded-lg">{item.ai}</ScrollArea>
              </div>
            ))}
            </>
          </ScrollArea>
      <form
        onSubmit={onSubmit}
        className="flex items-center pl-2 justify-center rounded-xl gap-2 bottom-0 sticky bg-white h-16"
      >
        <TextareaAutosize
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
            }
          }}
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          placeholder="Write a message..."
          className="peer disabled:opacity-50 custom-scrollbar pr-14 resize-none rounded-[8px] p-3 block w-full border-0 bg-zinc-100 py-[1vh] text-gray-900 focus:ring-0 text-sm sm:leading-6"
        />
        <Button type="submit" className="h-8 mr-2 mb-1 bg-blue-600 text-white font-medium rounded-[5px] hover:text-black hover:bg-gray-200">
          Submit
        </Button>
        </form>
 
        </div>
  );
}

export default ChatInput;
