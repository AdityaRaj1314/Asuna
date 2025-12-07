"use client";

import { useState, useEffect, useRef } from "react";
import { Send, Code, Eye, Download, Sparkles, Check, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { parseCodeBlocks, createHTMLPreview, CodeBlock, cleanText } from "@/lib/codeParser";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { vscDarkPlus } from "react-syntax-highlighter/dist/esm/styles/prism";
import JSZip from "jszip";
import { motion, AnimatePresence } from "framer-motion";
import clsx from "clsx";

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
    const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
    const iframeRef = useRef<HTMLIFrameElement>(null);
    const scrollAreaRef = useRef<HTMLDivElement>(null);

    // Auto-scroll to bottom of chat
    useEffect(() => {
        if (scrollAreaRef.current) {
            const scrollContainer = scrollAreaRef.current;
            scrollContainer.scrollTop = scrollContainer.scrollHeight;
        }
    }, [messages, isLoading]);

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
            // Filter messages to send to API
            const messagesToSend = newMessages.filter((msg, index) => {
                if (msg.role === "user") return true;
                if (msg.role === "assistant" && index > 0) return true;
                return false;
            });

            const response = await fetch("/api/chat", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: messagesToSend.map(m => ({
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

            console.log("Raw Assistant Message:", assistantMessage);
            const blocks = parseCodeBlocks(assistantMessage);
            console.log("Parsed Blocks:", blocks);

            if (blocks.length > 0) {
                setCodeBlocks(blocks);
                setActiveTab("preview"); // Force switch to preview
            } else {
                console.warn("No code blocks found in response");
            }

            const displayedMessage = cleanText(assistantMessage);

            setMessages((prev) => [
                ...prev,
                { role: "assistant", content: displayedMessage || "I've generated the code for you! Check the Preview tab." },
            ]);

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

    const downloadCode = async () => {
        if (codeBlocks.length === 0) return;

        const zip = new JSZip();
        codeBlocks.forEach(block => {
            zip.file(block.filename, block.content);
        });

        const content = await zip.generateAsync({ type: "blob" });
        const url = URL.createObjectURL(content);
        const a = document.createElement('a');
        a.href = url;
        a.download = "project.zip";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

    return (
        <div className="flex h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 overflow-hidden">
            {/* Left Panel - Chat */}
            <div className="w-[450px] border-r border-slate-700 flex flex-col bg-slate-900/50 backdrop-blur shrink-0">
                {/* Header */}
                <div className="p-4 border-b border-slate-700 bg-slate-900/80">
                    <div className="flex items-center gap-2 mb-1">
                        <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg shadow-lg shadow-purple-500/20">
                            <Sparkles className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h1 className="text-xl font-bold text-white leading-none">Asuna</h1>
                            <p className="text-xs text-purple-300 font-medium">AI Web Architect</p>
                        </div>
                    </div>
                </div>

                {/* Messages */}
                <div ref={scrollAreaRef} className="flex-1 p-4 overflow-y-auto scroll-smooth custom-scrollbar">
                    <div className="space-y-6 pb-4">
                        <AnimatePresence initial={false}>
                            {messages.map((msg, index) => (
                                <motion.div
                                    key={index}
                                    initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                    animate={{ opacity: 1, scale: 1, y: 0 }}
                                    transition={{ duration: 0.3 }}
                                    className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                                >
                                    <div
                                        className={`max-w-[90%] rounded-2xl px-5 py-4 ${msg.role === "user"
                                            ? "bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-br-none shadow-lg shadow-purple-900/20"
                                            : "bg-slate-800/80 backdrop-blur-sm text-slate-100 border border-slate-700/50 rounded-bl-none shadow-sm"
                                            }`}
                                    >
                                        <div className="text-sm prose prose-invert max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900/50 prose-pre:border prose-pre:border-slate-700/50">
                                            {msg.role === "user" ? (
                                                <div className="whitespace-pre-wrap">{msg.content}</div>
                                            ) : (
                                                <ReactMarkdown
                                                    components={{
                                                        code({ node, inline, className, children, ...props }: any) {
                                                            const match = /language-(\w+)/.exec(className || "");
                                                            return !inline && match ? (
                                                                <div className="rounded-lg overflow-hidden my-2 border border-slate-700/50">
                                                                    <div className="flex items-center justify-between px-3 py-1.5 bg-slate-900/80 border-b border-slate-700/50">
                                                                        <span className="text-xs font-mono text-slate-400">{match[1]}</span>
                                                                    </div>
                                                                    <SyntaxHighlighter
                                                                        style={vscDarkPlus}
                                                                        language={match[1]}
                                                                        PreTag="div"
                                                                        {...props}
                                                                        customStyle={{
                                                                            margin: 0,
                                                                            borderRadius: 0,
                                                                            fontSize: '0.8rem',
                                                                            backgroundColor: 'transparent'
                                                                        }}
                                                                    >
                                                                        {String(children).replace(/\n$/, "")}
                                                                    </SyntaxHighlighter>
                                                                </div>
                                                            ) : (
                                                                <code className={clsx("bg-slate-700/50 px-1.5 py-0.5 rounded text-purple-200 font-mono text-xs", className)} {...props}>
                                                                    {children}
                                                                </code>
                                                            );
                                                        }
                                                    }}
                                                >
                                                    {msg.content}
                                                </ReactMarkdown>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            ))}
                        </AnimatePresence>
                        {isLoading && (
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="flex justify-start"
                            >
                                <div className="bg-slate-800/80 border border-slate-700/50 rounded-2xl rounded-bl-none px-4 py-3 shadow-sm">
                                    <div className="flex items-center space-x-2">
                                        <div className="flex space-x-1">
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: 0 }}
                                                className="w-2 h-2 bg-purple-500 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: 0.2 }}
                                                className="w-2 h-2 bg-pink-500 rounded-full"
                                            />
                                            <motion.div
                                                animate={{ scale: [1, 1.2, 1] }}
                                                transition={{ repeat: Infinity, duration: 1, delay: 0.4 }}
                                                className="w-2 h-2 bg-purple-500 rounded-full"
                                            />
                                        </div>
                                        <span className="text-slate-400 text-xs font-medium">Generating magic...</span>
                                    </div>
                                </div>
                            </motion.div>
                        )}
                    </div>
                </div>

                {/* Input */}
                <div className="p-4 border-t border-slate-700 bg-slate-900/80 backdrop-blur">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            sendMessage();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            placeholder="Describe your dream website..."
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            disabled={isLoading}
                            className="flex-1 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500 focus-visible:ring-purple-500"
                        />
                        <Button
                            type="submit"
                            size="icon"
                            disabled={isLoading || !input.trim()}
                            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/20 transition-all active:scale-95"
                        >
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </div>

            {/* Right Panel - Preview/Code */}
            <div className="flex-1 flex flex-col bg-slate-950 border-l border-slate-800">
                {/* Tabs Header */}
                <div className="border-b border-slate-800 bg-slate-900/50 backdrop-blur">
                    <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="w-full">
                        <div className="flex items-center justify-between px-4 py-2">
                            <TabsList className="bg-slate-800/50 border border-slate-700/50">
                                <TabsTrigger value="preview" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                                    <Eye className="w-4 h-4 mr-2" />
                                    Preview
                                </TabsTrigger>
                                <TabsTrigger value="code" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white data-[state=active]:shadow-md">
                                    <Code className="w-4 h-4 mr-2" />
                                    Code
                                </TabsTrigger>
                            </TabsList>
                            {codeBlocks.length > 0 && (
                                <Button
                                    onClick={downloadCode}
                                    size="sm"
                                    variant="outline"
                                    className="border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
                                >
                                    <Download className="w-4 h-4 mr-2" />
                                    Download Zip
                                </Button>
                            )}
                        </div>
                    </Tabs>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-hidden relative">
                    {activeTab === "preview" && (
                        <div className="w-full h-full bg-white relative">
                            {previewHTML ? (
                                <iframe
                                    ref={iframeRef}
                                    className="w-full h-full border-0"
                                    title="Preview"
                                    sandbox="allow-scripts allow-modals allow-forms allow-popups allow-same-origin allow-top-navigation"
                                />
                            ) : (
                                <div className="absolute inset-0 flex items-center justify-center bg-slate-900/50 backdrop-blur-sm z-10">
                                    <div className="text-center p-8 bg-slate-900 border border-slate-700 rounded-2xl shadow-xl max-w-md mx-4">
                                        <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                                            <Sparkles className="w-8 h-8 text-purple-400" />
                                        </div>
                                        <h3 className="text-xl font-bold text-white mb-2">Ready to Build</h3>
                                        <p className="text-slate-400">
                                            Ask me to create a web app, and watch the preview appear here instantly!
                                        </p>
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {activeTab === "code" && (
                        <ScrollArea className="h-full p-6 bg-[#1e1e1e]">
                            {codeBlocks.length > 0 ? (
                                <div className="space-y-6 max-w-4xl mx-auto">
                                    {codeBlocks.map((block, index) => (
                                        <div key={index} className="rounded-xl overflow-hidden border border-[#333] shadow-xl">
                                            <div className="bg-[#2d2d2d] px-4 py-3 flex items-center justify-between border-b border-[#333]">
                                                <div className="flex items-center gap-2">
                                                    <div className="flex gap-1.5">
                                                        <div className="w-3 h-3 rounded-full bg-red-500/20 border border-red-500/50" />
                                                        <div className="w-3 h-3 rounded-full bg-yellow-500/20 border border-yellow-500/50" />
                                                        <div className="w-3 h-3 rounded-full bg-green-500/20 border border-green-500/50" />
                                                    </div>
                                                    <span className="text-sm font-mono text-slate-400 ml-2">{block.filename}</span>
                                                </div>
                                                <span className="text-xs text-slate-500 uppercase font-medium tracking-wider px-2 py-1 bg-[#252526] rounded">{block.language}</span>
                                            </div>
                                            <SyntaxHighlighter
                                                style={vscDarkPlus}
                                                language={block.language}
                                                showLineNumbers
                                                customStyle={{
                                                    margin: 0,
                                                    padding: '1.5rem',
                                                    fontSize: '0.9rem',
                                                    lineHeight: '1.5',
                                                    backgroundColor: '#1e1e1e'
                                                }}
                                            >
                                                {block.content}
                                            </SyntaxHighlighter>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="flex items-center justify-center h-full text-slate-500">
                                    <div className="text-center">
                                        <Code className="w-12 h-12 mx-auto mb-4 opacity-50" />
                                        <p>No code generated yet</p>
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
