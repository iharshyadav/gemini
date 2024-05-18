"use client"

import { cn } from '@/lib/utils';
import { FC, HTMLAttributes, useState } from 'react';
import TextareaAutosize from 'react-textarea-autosize';
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import {
  GoogleGenerativeAI,
  HarmCategory,
  HarmBlockThreshold,
} from "@google/generative-ai";

const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY as string;

interface ChatInputProps extends HTMLAttributes<HTMLDivElement> {}

const ChatInput: FC<ChatInputProps> = ({ className, ...props }) => {
  const [input, setInput] = useState<string>('');
  const [messages, setMessages] = useState<{ user: string, ai: string }[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  const generationConfig = {
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
    setLoading(true);  // Start loading state
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-1.5-flash-latest",
    });

    const chatSession = model.startChat({
      generationConfig,
      safetySettings,
      history: [
        {
          role: "user",
          parts: [{ text: "HELLO" }],
        },
        {
          role: "model",
          parts: [{ text: "Hello there! How can I assist you today?" }],
        },
      ],
    });

    const result = await model.generateContentStream([prompt]);
    let responseText = '';

    for await (const chunk of result.stream) {
      responseText += chunk.text();
    }

    setMessages((prevMessages) => [
      ...prevMessages,
      { user: prompt, ai: responseText },
    ]);
    setLoading(false);  // End loading state
  }

  const onSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    await run(input);
    setInput('');
  };

    return (
      <ScrollArea >
        
          <ScrollArea className="chat-output w-full overflow-y-scroll p-4 mb-10">
          <>
            {messages.map((item, index) => (
              <div key={index}>
                <ScrollArea className="user-message mb-4 text-right p-2 bg-blue-100">{item.user}</ScrollArea>
                <ScrollArea className="ai-message mb-4 p-2 bg-red-100">{item.ai}</ScrollArea>
              </div>
            ))}
            </>
          </ScrollArea>
      <form
        onSubmit={onSubmit}
        className="flex items-center pl-2 justify-center gap-2 absolute bottom-0 bg-white h-16"
      >
        <TextareaAutosize
          rows={2}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();

              // const message: Message = {
              //   id: nanoid(),
              //   isUserMessage: true,
              //   text: input,
              // }
              //  run(input)
              // sendMessages(message);
            }
          }}
          maxRows={4}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          autoFocus
          placeholder="Write a message..."
          className="peer disabled:opacity-50 pr-14 resize-none rounded-[8px] p-3 block w-full border-0 bg-zinc-100 py-2 text-gray-900 focus:ring-0 text-sm sm:leading-6"
        />
        <Button type="submit" className="h-8">
          Submit
        </Button>
        </form>
 

    </ScrollArea>
  );
}

export default ChatInput;
