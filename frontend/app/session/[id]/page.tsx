"use client"

import React, { Suspense, useCallback, useEffect, useRef, useState } from 'react';
import { Clock3, Flag, LoaderCircle, MessageSquareText, MicIcon, MicOffIcon, OctagonXIcon, RotateCwIcon } from 'lucide-react';
import { Badge, BadgeProps } from '@/components/ui/badge';
import dynamic from 'next/dynamic';
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@/components/ui/resizable';
import { Button } from '@/components/ui/button';
import { Toggle } from '@/components/ui/toggle';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import { Dialog, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import SessionLoading from '../loading';
import { getCookie } from '@/app/utils/cookie-manager';
import { HocuspocusProvider, HocuspocusProviderWebsocket } from '@hocuspocus/provider';
import * as Y from 'yjs';
import Markdown from 'react-markdown'

const DynamicCodeEditor = dynamic(() => import('../code-editor/code-editor'), { ssr: false });
const DynamicTextEditor = dynamic(
    () => import('@/app/session/text-editor'),
    {
        ssr: false,
        loading: () => <div className="h-full flex items-center justify-center">
            <LoaderCircle className="animate-spin size-10 text-brand-600" />
        </div>
    }
);

type Question = {
    id: number;
    title: string;
    complexity: string | undefined;
    category: (string | undefined)[];
    description: string;
};

export default function Session() {
    const router = useRouter();
    const [isClient, setIsClient] = useState(false);
    const [isMicEnabled, setIsMicEnabled] = useState(false);
    const [isHistoryApiCalled, setIsHistoryApiCalled] = useState(false); // Flag to track if API call has been made
    const [isEndingSession, setIsEndingSession] = useState(false);
    const [controller, setController] = useState<AbortController | null>(null);
    const [timeElapsed, setTimeElapsed] = useState(0);
    const [isSessionEnded, setIsSessionEnded] = useState(false);
    const [isSessionEndedPeer, setIsSessionEndedPeer] = useState(false);
    const [isSessionEndedDisconnect, setIsSessionEndedDisconnect] = useState(false);
    const [isEndDialogOpen, setIsEndDialogOpen] = useState(false);
    const [language, setLanguage] = useState("javascript");

    const codeDocRef = useRef<Y.Doc>();
    const codeProviderRef = useRef<HocuspocusProvider | null>(null);
    const notesProviderRef = useRef<HocuspocusProvider | null>(null);

    useEffect(() => {
        const timerInterval = setInterval(() => {
            setTimeElapsed((prevTime) => prevTime + 1);
        }, 1000);

        return () => {
            clearInterval(timerInterval);
        };
    }, []);

    const minutes = Math.floor(timeElapsed / 60);
    const seconds = timeElapsed % 60;

    const [question, setQuestion] = useState<Question | null>(null);

    const params = useParams<{ id: string }>()
    const searchParams = useSearchParams()
    const matchResultParam = searchParams.get('matchResult')

    let matchResult = null;
    let questionId = null;
    let peerUsername = null;

    if (matchResultParam) {
        try {
            matchResult = JSON.parse(decodeURIComponent(matchResultParam));
            questionId = matchResult.agreedQuestion;
            peerUsername = matchResult.peerUsername;
        } catch (error) {
            console.error('Failed to parse matchResult:', error);
        }
    } 

    const callUserHistoryAPI = useCallback(async () => {
        if (isHistoryApiCalled) return;

        setIsHistoryApiCalled(true);

        const abortController = new AbortController();
        setController(abortController);
        setIsEndingSession(true);

        const codeText = codeDocRef.current?.getText(`monaco`);
        const code = codeText?.toString();
        console.log("languge: ", language)
        try {
            await fetch(`${process.env.NEXT_PUBLIC_USER_API_HISTORY_URL}/${getCookie('userId')}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${getCookie('token')}`,
                },
                body: JSON.stringify({
                    userId: getCookie('userId'),
                    questionId: questionId,
                    timeSpent: timeElapsed,
                    code: JSON.stringify(code),
                    language: language,
                }),
                signal: abortController.signal,
            });
        } catch (error) {
            console.error('Failed to update question history:', error);
            setIsHistoryApiCalled(false);
        } finally {
            setIsEndingSession(false);
            setController(null);
        }
    }, [isHistoryApiCalled, language, questionId, timeElapsed]);

    useEffect(() => {
        if ((isSessionEnded || isSessionEndedPeer || isSessionEndedDisconnect) && !isHistoryApiCalled) {
            const cleanup = async () => {
                await callUserHistoryAPI();
                setTimeout(() => {
                    router.push('/questions');
                }, 3000);
            };
            cleanup();
        }
    }, [isSessionEnded, isHistoryApiCalled, callUserHistoryAPI, router, isSessionEndedPeer, isSessionEndedDisconnect]);

    useEffect(() => {
        setIsClient(true);

        const fetchQuestionDetails = async (id: string) => {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_QUESTION_API_BASE_URL}/byId/${questionId}`, {
                    cache: "no-store",
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch question details');
                }

                const data = await response.json();
                setQuestion(data);
            } catch (error) {
                console.error(error);
                toast.error('Failed to load question details');
            }
        };

        if (questionId) {
            fetchQuestionDetails(questionId);
        }

        const socket = new HocuspocusProviderWebsocket({
            url: process.env.NEXT_PUBLIC_COLLAB_API_URL || 'ws://localhost:3003'
        });

        codeDocRef.current = new Y.Doc();
        const codeProvider = new HocuspocusProvider({
            websocketProvider: socket,
            name: `code-${params.id}`,
            document: codeDocRef.current,
            token: 'abc',
            onConnect: () => {
                console.log('Connected to code server');
            },
            onClose: ({ event }) => {
                console.error('Connection closed:', event);
                setIsSessionEnded(true);
            },
            onStateless: ({ payload }) => {
                console.log('Received message:', payload);
                if (payload === 'sessionEnded') {
                    console.log("Session explicitly ended");
                    setIsSessionEndedPeer(true);
                } else if (payload === 'sessionEndedNetwork') {
                    console.log("Session ended due to network disconnect by peer");
                    setIsSessionEndedDisconnect(true);
                }
            },
        });
        codeProviderRef.current = codeProvider;

        const notesDoc = new Y.Doc();
        const notesProvider = new HocuspocusProvider({
            websocketProvider: socket,
            name: `text-${params.id}`,
            document: notesDoc,
            token: 'abc',
            onConnect: () => {
                console.log('Connected to notes server');
            },
        });
        notesProviderRef.current = notesProvider;

        if (isSessionEnded) {
            codeProvider.sendStateless("endSession");
        }
    }, [isSessionEnded, params.id, questionId, router]);


    if (!isClient) {
        return SessionLoading();
    }

    const handleMicToggle = () => {
        setIsMicEnabled(!isMicEnabled);
        if (!isMicEnabled) {
            toast('Your mic is now unmuted', {
                className: "justify-center font-sans text-sm",
                duration: 1500,
                icon: <MicIcon className="h-4 w-4 mr-2 text-green-500" />,
            });
        } else {
            toast('Your mic is now muted', {
                className: "justify-center font-sans text-sm",
                duration: 1500,
                icon: <MicOffIcon className="h-4 w-4 mr-2 text-red-500" />,
            });
        }
    };

    function handleCancel() {
        if (controller) {
            controller.abort(); // Cancel the API call
            setIsEndingSession(false);
        }
    }

    const updateLanguage = (newLang: string) => {
        setLanguage(newLang);
    };

    return (
        <Suspense fallback={SessionLoading()}>
            <div className="flex flex-col gap-8 min-h-screen">
                <div className="flex justify-between text-black bg-white drop-shadow mt-8 mx-8 p-4 rounded-xl relative">
                    <div className="flex items-center gap-2 text-sm">
                        <div className="flex justify-center items-center bg-brand-200 text-brand-800 py-2 px-3 font-semibold rounded-lg"><Clock3 className="h-4 w-4 mr-2" /><div className="flex justify-center w-[40px]">{minutes}:{seconds < 10 ? `0${seconds}` : seconds}</div></div>
                        <span>with</span>
                        <span className="font-semibold">{peerUsername}</span>
                    </div>
                    <div className="mr-[52px]">
                        <Toggle
                            onPressedChange={handleMicToggle}
                        >
                            {isMicEnabled ? (
                                <MicIcon className="size-5 text-green-500" />
                            ) : (
                                <MicOffIcon className="size-5 text-red-500" />
                            )}
                        </Toggle>
                    </div>
                    <div className="">
                        <Dialog open={isEndDialogOpen} onOpenChange={setIsEndDialogOpen}>
                            <DialogTrigger><Button><OctagonXIcon className="size-4 mr-2" />End Session</Button></DialogTrigger>
                            <DialogContent
                                className="laptop:max-w-[40vw] bg-white text-black font-sans rounded-2xl"
                            >
                                <DialogHeader className="items-start">
                                    <DialogTitle className="font-serif font-normal tracking-tight text-3xl">
                                        End your session?
                                    </DialogTitle>
                                    <DialogDescription className="hidden"></DialogDescription>
                                </DialogHeader>
                                <div className="flex flex-col w-full gap-1 py-4 justify-start">
                                    <p>This will end the session for both users.</p>
                                </div>
                                <DialogFooter className="flex items-end">
                                    <DialogClose asChild>
                                        <Button
                                            variant="ghost"
                                            className="rounded-lg"
                                        >
                                            Cancel
                                        </Button>
                                    </DialogClose>
                                    <Button
                                        type="submit"
                                        className="rounded-lg bg-brand-700 hover:bg-brand-600"
                                        onClick={() => {
                                            setIsSessionEnded(true)
                                            setIsEndDialogOpen(false)
                                        }}
                                        disabled={isSessionEnded || isSessionEndedPeer || isSessionEndedDisconnect}
                                    >
                                        End session
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>
                <ResizablePanelGroup direction="horizontal" className="flex-grow">
                    <ResizablePanel defaultSize={50} minSize={35} maxSize={65}>
                        <ResizablePanelGroup direction="vertical">
                            <ResizablePanel defaultSize={50} minSize={35} maxSize={65}>
                                <div className="h-[calc(100%-2rem)] overflow-auto text-black bg-white drop-shadow-question-details p-6 mx-8 rounded-xl">
                                    {question ? (
                                        <>
                                            <h3 className="text-2xl font-serif font-medium tracking-tight">
                                                {question.title}
                                            </h3>
                                            <div className="flex items-center gap-10 mt-3">
                                                <div className="flex items-center gap-2">
                                                    <Flag className="h-4 w-4 text-icon" />
                                                    <Badge
                                                        variant={question.complexity!.toLowerCase() as BadgeProps["variant"]}
                                                    >
                                                        {question.complexity}
                                                    </Badge>
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    <MessageSquareText className="h-4 w-4 text-icon" />
                                                    {question.category.map((category) => (
                                                        <Badge
                                                            key={category}
                                                            variant="category"
                                                            className="uppercase text-category-text bg-category-bg"
                                                        >
                                                            {category}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <Markdown className="mt-8 prose prose-zinc prose-code:bg-zinc-200 prose-code:px-1 prose-code:rounded prose-code:prose-pre:bg-inherit text-base text-foreground proportional-nums">
                                                {question.description}
                                            </Markdown>
                                        </>
                                    ) : (
                                        <div className="flex flex-col items-center gap-10">
                                            <h3>Error loading question</h3>
                                            <Button onClick={() => location.reload()}><RotateCwIcon className="size-4 mr-2" />Refresh page</Button>
                                        </div>
                                    )}
                                </div>
                            </ResizablePanel>
                            <ResizableHandle withHandle />
                            <ResizablePanel defaultSize={50} minSize={35} maxSize={65}>
                                <div className="h-[calc(100%-4rem)] bg-white drop-shadow-question-details rounded-xl m-8">
                                    <DynamicTextEditor sessionId={params.id} provider={notesProviderRef.current!} />
                                </div>
                            </ResizablePanel>
                        </ResizablePanelGroup>
                    </ResizablePanel>
                    <ResizableHandle withHandle />
                    <ResizablePanel defaultSize={50} minSize={35} maxSize={65}>
                        <DynamicCodeEditor sessionId={params.id} provider={codeProviderRef.current!} setLanguage={updateLanguage}/>
                    </ResizablePanel>
                    <Toaster position="top-center" closeButton offset={"16px"} visibleToasts={2} gap={8} />
                </ResizablePanelGroup>
            </div>

            <Dialog open={isSessionEnded || isSessionEndedPeer || isSessionEndedDisconnect}>
                <DialogContent
                    className="laptop:max-w-[40vw] bg-white text-black font-sans rounded-2xl [&>button]:hidden"
                >
                    <DialogHeader className="items-start">
                        <DialogTitle className="font-serif font-normal tracking-tight text-3xl">
                            Session ended
                        </DialogTitle>
                        <DialogDescription className="hidden"></DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col w-full gap-1 py-4 justify-start">
                        {isSessionEnded ? (
                            <p>Your session has ended.</p>
                        ) : isSessionEndedPeer ? (
                            <p><span className="font-semibold">{peerUsername}</span> has ended the session.</p>
                        ) : isSessionEndedDisconnect ? (
                            <p><span className="font-semibold">{peerUsername}</span> disconnected.</p>
                        ) : null}
                        <p>Redirecting you to the Questions page...</p>
                    </div>
                </DialogContent>
            </Dialog>
        </Suspense>
    );
}
function callUserHistoryAPI() {
    throw new Error('Function not implemented.');
}

