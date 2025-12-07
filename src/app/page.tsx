"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Code, Eye, Download, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseCodeBlocks, createHTMLPreview, CodeBlock } from "@/lib/codeParser";

interface Message {
    role: "user" | "assistant" | "system";
    content: string;
}

export default function Home() {
    const [messages, setMessages] = useState<Message[]>([
        {
            role: "assistant",
            content: "👋 Hi! I'm Asuna, your AI web development assistant. Tell me what website or web app you'd like to build, and I'll create it for you instantly!\n\nTry something like:\n• \"Create a modern landing page for a coffee shop\"\n• \"Build a todo list app with animations\"\n• \"Make a portfolio website with dark mode\""
        },
    ]);
    const [input, setInput] = useState("");
    const [isLoading, setIsLoading] = useState(false);
    const [codeBlocks, setCodeBlocks] = useState<CodeBlock[]>([]);
    const [previewHTML, setPreviewHTML] = useState("");
    const [activeTab, setActiveTab] = useState<"chat" | "preview">("chat");
    const iframeRef = useRef<HTMLIFrameElement>(null);

    // Update preview when code blocks change
    useEffect(() => {
        if (codeBlocks.length > 0) {
            const html = createHTMLPreview(codeBlocks);
            setPreviewHTML(html);
            setActiveTab("preview");
        }
    }, [codeBlocks]);

    // Update iframe when preview HTML changes
    useEffect(() => {
        if (iframeRef.current && previewHTML) {
            const iframe = iframeRef.current;
            const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document;
            if (iframeDoc) {
                iframeDoc.open();
                iframeDoc.write(previewHTML);
                iframeDoc.close();
            }
        }
    }, [previewHTML]);

    const sendMessage = async () => {
        if (!input.trim()) return;

        const userMessage = input;
        setInput("");

        const newMessages: Message[] = [
            ...messages,
            { role: "user", content: userMessage }
        ];

        setMessages(newMessages);
        setIsLoading(true);

        try {
            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: newMessages.map(m => ({
                        role: m.role,
                        content: m.content
                    }))
                }),
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || "Failed to send message");
            }

            const data = await response.json();
            const assistantMessage = data.message;

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: assistantMessage },
            ]);

            // Parse code blocks from the response
            const blocks = parseCodeBlocks(assistantMessage);
            if (blocks.length > 0) {
                setCodeBlocks(blocks);
            }

        } catch (error: any) {
            console.error(error);
            setMessages((prev) => [
                ...prev,
                {
                    role: "assistant",
                    content: `Sorry, I encountered an error: ${error.message}`
                },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    const downloadCode = () => {
        if (codeBlocks.length === 0) return;

        codeBlocks.forEach(block => {
            const blob = new Blob([block.content], { type: 'text/plain' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = block.filename;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        });
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
            {/* Left Panel - Chat */}
            <div className="w-[450px] border-r border-slate-700 flex flex-col bg-slate-900/50 backdrop-blur">
                {/* Header */}
                <div className="p-4 border-b border-slate-700">
                    <div className="flex items-center gap-2 mb-2">
                        <Sparkles className="w-6 h-6 text-purple-400" />
                        <h1 className="text-xl font-bold text-white">Asuna</h1>
                    </div>
                    <p className="text-sm text-slate-400">AI Web Development Platform</p>
                </div>

                {/* Messages */}
                <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                        {messages.map((msg, index) => (
                            <div
                                key={index}
                                className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-2xl px-4 py-3 ${msg.role === "user"
                                        ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none shadow-lg"
                                        : "bg-slate-800 text-slate-100 border border-slate-700 rounded-bl-none"
                                        }`}
                                >
                                    <div className="whitespace-pre-wrap break-words text-sm">
                                        {msg.content}
                                    </div>
                                </div>
                            </div>
                        ))}
                        {isLoading && (
                            <div className="flex justify-start">
                                <div className="bg-slate-800 border border-slate-700 rounded-2xl rounded-bl-none px-4 py-3">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex space-x-1">
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "0ms" }}></div>
                                            <div className="w-2 h-2 bg-pink-500 rounded-full animate-bounce" style={{ animationDelay: "150ms" }}></div>
                                            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{ animationDelay: "300ms" }}></div>
                                        </div>
                                        <span className="text-slate-300 text-sm">Generating...</span>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </ScrollArea>

                {/* Input */}
                <div className="p-4 border-t border-slate-700">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            sendMessage();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Describe the website you want to build..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className="flex-1 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !input.trim()}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>

            {/* Right Panel - Preview/Code */}
            <div className="flex-1 flex flex-col bg-slate-950">
                {/* Tabs Header */}
                <div className="border-b border-slate-700 bg-slate-900/50 backdrop-blur">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        <div className="flex items-center justify-between px-4 py-2">
                            <TabsList className="bg-slate-800">
                                <TabsTrigger value="chat" className="data-[state=active]:bg-slate-700">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                </TabsTrigger>
                                <TabsTrigger value="preview" className="data-[state=active]:bg-slate-700">
                                    <Code className="w-4 h-4 mr-2" />
                                    Code
                                </TabsTrigger>
                            </TabsList>
                            {codeBlocks.length > 0 && (
                                <Button
                                    onClick={downloadCode}
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download
                                </Button>
                            )}
                        </div>
                    </Tabs>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden">
                    {activeTab === "chat" && (
                        <div className="w-full h-full bg-white">
                            {previewHTML ? (
                                <iframe
                                    ref={iframeRef}
                                    className="w-full h-full border-0"
                                    title="Preview"
                                    sandbox="allow-scripts"
                                />
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Code className="w-16 h-16 mx-auto mb-4 text-slate-400" />
                                        <h3 className="text-xl font-semibold text-slate-700 mb-2">No Preview Yet</h3>
                                        <p className="text-slate-500">Ask me to create a website and see it here!</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "preview" && (
                        <ScrollArea className="h-full p-4">
                            {codeBlocks.length > 0 ? (
                                <div className="space-y-4">
                                    {codeBlocks.map((block, index) => (
                                        <Card key={index} className="bg-slate-900 border-slate-700 overflow-hidden">
                                            <div className="bg-slate-800 px-4 py-2 border-b border-slate-700 flex items-center justify-between">
                                                <span className="text-sm font-mono text-slate-300">{block.filename}</span>
                                                <span className="text-xs text-slate-500 uppercase">{block.language}</span>
                                            </div>
                                            <pre className="p-4 overflow-x-auto">
                                                <code className="text-sm text-slate-300 font-mono">
                                                    {block.content}
                                                </code>
                                            </pre>
                                        </Card>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Code className="w-16 h-16 mx-auto mb-4 text-slate-600" />
                                        <h3 className="text-xl font-semibold text-slate-400 mb-2">No Code Yet</h3>
                                        <p className="text-slate-500">Generated code will appear here</p>
                                    </div>
                                </div>
                            )}
                        </ScrollArea>
                    )}
                </div>
            </div>
        </div>
    );
}
