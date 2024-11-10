"use client";

import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { MultiSelect } from "@/components/ui/multi-select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { ArrowUpRight, Check, ChevronsRight, Flag, MessageSquareText, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { getUserId, getUsername } from "@/app/utils/cookie-manager";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import Link from "next/link";

type Question = {
    id: number;
    title: string;
    complexity: string | undefined;
    categories: (string | undefined)[];
    description: string;
    selected: boolean;
};

const complexityList: Array<{
    value: string;
    label: string;
    badgeVariant: BadgeProps["variant"];
}> = [
        { value: "easy", label: "Easy", badgeVariant: "easy" },
        { value: "medium", label: "Medium", badgeVariant: "medium" },
        { value: "hard", label: "Hard", badgeVariant: "hard" },
    ];

const categoryList: Array<{
    value: string;
    label: string;
    badgeVariant: BadgeProps["variant"];
}> = [
        { value: "algorithms", label: "Algorithms", badgeVariant: "category" },
        { value: "arrays", label: "Arrays", badgeVariant: "category" },
        {
            value: "bitmanipulation",
            label: "Bit Manipulation",
            badgeVariant: "category",
        },
        { value: "brainteaser", label: "Brainteaser", badgeVariant: "category" },
        { value: "databases", label: "Databases", badgeVariant: "category" },
        { value: "datastructures", label: "Data Structures", badgeVariant: "category" },
        { value: "recursion", label: "Recursion", badgeVariant: "category" },
        { value: "strings", label: "Strings", badgeVariant: "category" },
    ];

export default function Questions() {
    const router = useRouter();
    const [selectedComplexities, setSelectedComplexities] = useState<string[]>(
        complexityList.map((diff) => diff.value)
    );
    const [selectedCategories, setSelectedCategories] = useState<string[]>(
        categoryList.map((category) => category.value)
    );
    const [filtersHeight, setFiltersHeight] = useState(0);
    const [questionList, setQuestionList] = useState<Question[]>([]); // Complete list of questions
    const [selectedViewQuestion, setSelectedViewQuestion] =
        useState<Question | null>(null);
    const [isSelectAll, setIsSelectAll] = useState(false);
    const [reset, setReset] = useState(false);

    const [isMatching, setIsMatching] = useState(false);
    const [isHovering, setIsHovering] = useState(false);
    const [matchTime, setMatchTime] = useState(0);
    const [redirectTime, setRedirectTime] = useState(5);
    const matchTimerRef = useRef<NodeJS.Timeout | null>(null);
    const [isMatchFoundDialogOpen, setMatchFoundDialogOpen] = useState(false);
    const [isMatchFailDialogOpen, setMatchFailDialogOpen] = useState(false);
    const [matchResult, setMatchResult] = useState({ currentUsername: '', peerId: '', peerUsername: '', sessionId: '', agreedQuestion: 0 });
    const timeout = useRef(false);
    const selectedQuestionList = React.useRef<number[]>([])
    const userInfo = useRef({ id: "", username: "" });

    // Fetch questions from backend API
    useEffect(() => {
        async function fetchQuestions() {
            try {
                const response = await fetch(`${process.env.NEXT_PUBLIC_QUESTION_API_BASE_URL}/all`, {
                    cache: "no-store",
                });
                const data = await response.json();

                // Map backend data to match the frontend Question type
                const mappedQuestions: Question[] = data.map((q: { id: number, title: string, complexity: string, category: string[], description: string, link: string, selected: boolean }) => ({
                    id: q.id,
                    title: q.title,
                    complexity: complexityList.find(
                        (complexity) => complexity.value === q.complexity.toLowerCase()
                    )?.value,
                    categories: q.category.sort((a: string, b: string) => a.localeCompare(b)),
                    description: q.description,
                    link: q.link,
                    selected: false, // Set selected to false initially
                }));

                setQuestionList(mappedQuestions); // Set the fetched data to state
            } catch (error) {
                console.error("Error fetching questions:", error);
            }
        }

        fetchQuestions();
    }, []);

    useEffect(() => {
        const filtersElement = document.getElementById("filters");
        if (filtersElement) {
            const filtersRect = filtersElement.getBoundingClientRect();
            const totalHeight = filtersRect.bottom;
            setFiltersHeight(totalHeight + 16);
        }
    }, []);

    // Handle filtered questions based on user-selected complexities and categories
    const filteredQuestions = questionList.filter((question) => {
        const selectedcategoryLabels = selectedCategories.map(
            (categoryValue) =>
                categoryList.find((category) => category.value === categoryValue)?.label
        );

        const matchesComplexity =
            selectedComplexities.length === 0 ||
            (question.complexity &&
                selectedComplexities.includes(question.complexity));

        const matchesCategories =
            selectedCategories.length === 0 ||
            selectedcategoryLabels.some((category) => question.categories.includes(category));

        return matchesComplexity && matchesCategories;
    });

    // Function to reset filters
    const resetFilters = () => {
        setSelectedComplexities(complexityList.map((diff) => diff.value));
        setSelectedCategories(categoryList.map((category) => category.value));
        setReset(true);
    };

    // Function to handle "Select All" button click
    const handleSelectAll = () => {
        const newIsSelectAll = !isSelectAll;
        setIsSelectAll(newIsSelectAll);

        const arr: number[] = newIsSelectAll
            ? filteredQuestions.map((f_qns) => f_qns.id)
            : [];

        // Toggle selection of all questions
        const updatedQuestions = questionList.map((question) =>
            filteredQuestions.map((f_qns) => f_qns.id).includes(question.id)
                ? {
                    ...question,
                    selected: newIsSelectAll, // Select or unselect all questions
                }
                : question
        );
        selectedQuestionList.current = arr;
        setQuestionList(updatedQuestions);
    };

    // Function to handle individual question selection
    const handleSelectQuestion = (id: number) => {

        const updatedQuestions = questionList.map((question) =>
            question.id === id
                ? { ...question, selected: !question.selected }
                : question
        );
        // Update the selected questions list (collect the IDs of selected questions)
        const selectedQuestions = updatedQuestions
            .filter((question) => question.selected) // Only keep selected questions
            .map((question) => question.id); // Extract their IDs
        setQuestionList(updatedQuestions);
        selectedQuestionList.current = selectedQuestions;
    };

    useEffect(() => {
        const allSelected =
            questionList.length > 0 && questionList.every((q) => q.selected);
        const noneSelected =
            questionList.length > 0 && questionList.every((q) => !q.selected);

        if (allSelected) {
            setIsSelectAll(true);
        } else if (noneSelected) {
            setIsSelectAll(false);
        }
    }, [questionList]);

    useEffect(() => {
        if (filteredQuestions.length === 0) {
            setSelectedViewQuestion(null);
        }
    }, [filteredQuestions]);


    useEffect(() => {
        console.log("Selected complexities:", selectedComplexities);
    }, [selectedComplexities]); // This effect runs every time selectedcomplexities change 

    const handleMatch1 = useCallback(() => {
        setIsMatching(prev => !prev);
        setIsHovering(false);
    }, []);

    const ws = useRef<WebSocket | null>(null); // WebSocket reference
    const handleMatch = useCallback(() => {
        setIsMatching(prev => !prev);
        setIsHovering(false);

        if (ws.current === null || ws.current.readyState === WebSocket.CLOSED || ws.current.readyState === WebSocket.CLOSING) {
            console.log("Connecting to web socket for matching service ...")
            // Initialize WebSocket connection if not already matching
            ws.current = new WebSocket(process.env.NEXT_PUBLIC_MATCHING_API_URL || 'ws://localhost:3002/matching');
        }

        ws.current.onopen = () => {
            console.log("WebSocket connection opened. Now sending msg to WebSocket.");

            const message = {
                event: "enqueue",
                userId: getUserId(),
                userName: getUsername(),
                questions: selectedQuestionList.current,
            };

            ws.current?.send(JSON.stringify(message));
            console.log("Sent matching request to web socket:", message);
        };

        ws.current.onmessage = (event) => {
            if (event.data == "Welcome to websocket server") {
                console.log("receive welcome msg from websocket server")
                return;
            }
            // // Handle successful match
            // if (message.startsWith("User") && message.includes("matched with User")) {
            //     // Extract userId and peerUserId from the message (if needed for display purposes)
            //     const matchDetails = message.match(/User (\w+) matched with User (\w+) \(username: ([\w\s]+)\)/);
            //     console.log("match detail", matchDetails);
            //     const userId = matchDetails[1];
            //     const peerUserId = matchDetails[2];
            //     const peerUserName = 

            //     // Set match result in state (adjust as needed)
            //     setMatchResult({ id: peerUserId, username: "" });
            //     setMatchFoundDialogOpen(true); // Open match found dialog
            // } else if (message.startsWith("No matches for")) { // Handle timeout/no match found message
            //     console.log("No matches found for the user.");
            //     setMatchFailDialogOpen(true); // Open match failed dialog
            // } else { // Handle unexpected messages
            //     console.warn("Unexpected message received:", message);
            //     setMatchFailDialogOpen(true);
            // }
            const message = JSON.parse(event.data);
            console.log("message receive from websocket", message);

            // Handle different message statuses
            switch (message.event) {
                case 'match-success':
                    console.log(`User ${message.userId} matched with User ${message.peerUserId} (username: ${message.peerUserName}).`);
                    setMatchResult({ currentUsername: getUsername()!, peerId: message.peerUserId, peerUsername: message.peerUserName, sessionId: message.roomName, agreedQuestion: message.agreedQuestion });
                    setMatchFoundDialogOpen(true);
                    break;

                case 'dequeued-success':
                    console.log(`User ${message.userId} dequeued from matchmaking.`);
                    break;

                case 'match-timeout':
                    console.log(`No matches for user ${message.userId}.`);
                    setMatchFailDialogOpen(true);
                    break;

                default:
                    console.warn("Unexpected message received:", message);
                    // setMatchFailDialogOpen(true);
                    break;
            }
        }

        ws.current.onclose = () => {
            console.log("WebSocket connection closed");
            setIsMatching(false);
        };

        ws.current.onerror = (error) => {
            console.error("WebSocket error:", error);
            setIsMatching(false);
            setMatchFailDialogOpen(true);
        };
    }, []);

    const handleCancel = useCallback(() => {
        setIsMatching(false);
        
        if (ws.current && ws.current.readyState === WebSocket.OPEN) {
            const message = {
                event: "dequeue",
                userId: getUserId(),
            };
    
            ws.current.send(JSON.stringify(message));
            console.log("Sent dequeue request:", message);

            ws.current.close();
            ws.current = null;
        }
    }, []);

    useEffect(() => {
        return () => {
            if (isMatching) {
                handleCancel();
            }
        };
    }, [handleCancel, isMatching]);

    useEffect(() => {
        timeout.current = false;
        if (isMatching) {
            setMatchTime(0);
            matchTimerRef.current = setInterval(() => {
                setMatchTime((prevTime) => {
                    if (prevTime >= 32) { // we use 32 so there is buffer
                        timeout.current = true;
                        clearInterval(matchTimerRef.current as NodeJS.Timeout);
                        console.log("open fail dialog")
                        setMatchFailDialogOpen(true);
                        // setMatchFoundDialogOpen(true); // use this to open match found dialog
                        return 32;
                    }
                    return prevTime + 1;
                });
            }, 1000);
        } else {
            if (matchTimerRef.current) {
                clearInterval(matchTimerRef.current);
            }
            setMatchTime(0);
        }
    }, [isMatching]);

    useEffect(() => {
        if (isMatchFoundDialogOpen) {
            router.prefetch('/session/[id]');
            setRedirectTime(2);
            const redirectTimer = setInterval(() => {
                setRedirectTime((prevTime) => {
                    if (prevTime <= 1) {
                        clearInterval(redirectTimer);
                        router.push(`/session/${matchResult.sessionId}?matchResult=${encodeURIComponent(JSON.stringify(matchResult))}`);  // Redirect to question page
                        // setMatchFoundDialogOpen(false);
                        setIsMatching(false);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);

            return () => clearInterval(redirectTimer);
        }
    }, [isMatchFoundDialogOpen, router, matchResult]);

    useEffect(() => {
        if (isMatchFailDialogOpen) {
            setRedirectTime(5);
            const redirectTimer = setInterval(() => {
                setRedirectTime((prevTime) => {
                    if (prevTime <= 1) {
                        clearInterval(redirectTimer);
                        setMatchFailDialogOpen(false);
                        setIsMatching(false);
                        return 0;
                    }
                    return prevTime - 1;
                });
            }, 1000);

            return () => clearInterval(redirectTimer);
        }
    }, [isMatchFailDialogOpen, router]);

    const handleMouseEnter = useCallback(() => {
        setIsHovering(true);
    }, []);

    const handleMouseLeave = useCallback(() => {
        setIsHovering(false);
    }, []);

    return (
        <main className="flex min-h-screen flex-row px-4 mx-8 mt-0 pt-0 gap-4 font-sans text-black">
            <div className="flex-1 overflow-auto laptop:w-[620px] laptop:min-w-[620px] laptop:max-w-[100vw] laptop:mx-auto">
                <div className="relative h-screen">
                    <div
                        id="filters"
                        className="absolute top-0 left-0 right-0 flex flex-col laptop:flex-row gap-2 laptop:ml-8 laptop:mr-10 mt-16 laptop:mt-24 p-2 rounded-3xl bg-opacity-90 backdrop-blur laptop:drop-shadow-xl bg-white z-10"
                    >
                        <div className="flex grow flex-col gap-2 min-w-[400px] 2xl:flex-row">
                            <MultiSelect
                                options={complexityList}
                                onValueChange={setSelectedComplexities}
                                defaultValue={selectedComplexities}
                                placeholder="Select complexities"
                                variant="inverted"
                                animation={2}
                                maxCount={3}
                                selectIcon={Flag}
                                className={"font-sans"}
                                reset={reset}
                                onResetComplete={setReset}
                            />
                            <MultiSelect
                                options={categoryList}
                                onValueChange={setSelectedCategories}
                                defaultValue={selectedCategories}
                                placeholder="Select categories"
                                variant="inverted"
                                animation={2}
                                maxCount={2}
                                selectIcon={MessageSquareText}
                                className={"font-sans"}
                                reset={reset}
                                onResetComplete={setReset}
                            />
                        </div>
                        <div className="flex flex-row justify-between gap-2">
                            <Button
                                variant="outline"
                                className="uppercase rounded-3xl w-full"
                                onClick={handleSelectAll}
                                disabled={filteredQuestions.length === 0 || isMatching}
                            >
                                {isSelectAll ? "Remove all" : "Add all"}
                            </Button>
                            <Button
                                variant="match"
                                className={cn(
                                    "group w-full font-brand uppercase rounded-3xl laptop:hidden",
                                    isMatching && !isHovering && "bg-brand-600 hover:bg-brand-600 text-white",
                                    isMatching && isHovering && "text-destructive-foreground hover:bg-destructive/90"
                                )}
                                onClick={() => {
                                    if (isMatching) {
                                        handleCancel();
                                    } else {
                                        // Perform the initial match action
                                        handleMatch();
                                    }
                                }}
                                onMouseEnter={handleMouseEnter}
                                onMouseLeave={handleMouseLeave}
                                disabled={selectedQuestionList.current.length === 0}
                            >
                                {isMatching
                                    ? (isHovering ? 'Cancel' : 'Matching')
                                    : 'Match'}
                                {isMatching ? (
                                    isHovering ? (
                                        <X className="ml-2" />
                                    ) : (
                                        <span className="ml-3 text-white/60 lowercase font-mono">{Math.min(matchTime, 30)}s</span>
                                    )
                                ) : (
                                    <ChevronsRight className="ml-2 group-hover:translate-x-2 transition" />
                                )}
                            </Button>
                        </div>
                    </div>

                    <ScrollArea
                        className="h-screen"
                        barOffset={filtersHeight}
                        type="hover"
                    >
                        <div className="flex flex-col gap-2 overflow-auto pl-4 pr-4 pb-4" style={{ paddingTop: `${filtersHeight}px` }}>
                            {filteredQuestions.length == 0 ? (
                                <div className="flex flex-col pt-80 gap-6 items-center justify-center text-center">
                                    <p className="text-base">No questions found</p>
                                    <Button onClick={resetFilters}>Reset filters</Button>
                                </div>
                            ) : (
                                filteredQuestions.map((question) => (
                                    <div id="qns" key={question.id} className="relative mr-2">
                                        <Card
                                            className="rounded-lg flex items-start border-none shadow-none p-4 w-full hover:drop-shadow-question-card transition ease-in-out"
                                            onClick={() => setSelectedViewQuestion(question)}
                                        >
                                            <div className="flex-1">
                                                <h3 className="text-xl font-serif font-semibold tracking-tight">
                                                    {question.id}. {question.title}
                                                </h3>
                                                <div className="flex items-center gap-2 mt-3">
                                                    <Badge
                                                        variant={
                                                            `${question.complexity}` as BadgeProps["variant"]
                                                        }
                                                    >
                                                        {question.complexity}
                                                    </Badge>
                                                    {question.categories.map((category, index) => (
                                                        <Badge key={index} variant="category">
                                                            {category}
                                                        </Badge>
                                                    ))}
                                                </div>
                                            </div>
                                            <Button
                                                variant={question.selected ? "default" : "outline"}
                                                className="ml-4"
                                                size="sm"
                                                onClick={() => handleSelectQuestion(question.id)}
                                                disabled={isMatching}
                                            >
                                                {question.selected ? (
                                                    <div className="flex justify-center items-center"><Check className="h-4 w-4 mr-2" />Added</div>
                                                ) : (
                                                    <div className="flex justify-center items-center"><Plus className="h-4 w-4 mr-2" />Add</div>
                                                )}
                                            </Button>
                                        </Card>
                                    </div>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                </div>
            </div>
            <div className="hidden mt-24 mb-8 h-full laptop:max-w-[25vw] laptop:w-[25vw] laptop:flex laptop:flex-col laptop:gap-8 pt-16 px-4">

                <Button
                    variant="match"
                    className={cn(
                        "group w-full font-brand uppercase",
                        isMatching && !isHovering && "bg-brand-600 hover:bg-brand-600 text-white",
                        isMatching && isHovering && "text-destructive-foreground hover:bg-destructive/90"
                    )}
                    onClick={() => {
                        if (isMatching) {
                            handleCancel();
                        } else {
                            // Perform the initial match action
                            handleMatch();
                        }
                    }}
                    onMouseEnter={handleMouseEnter}
                    onMouseLeave={handleMouseLeave}
                    disabled={selectedQuestionList.current.length === 0}
                >
                    {isMatching
                        ? (isHovering ? 'Cancel' : 'Matching')
                        : 'Match'}
                    {isMatching ? (
                        isHovering ? (
                            <X className="ml-2" />
                        ) : (
                            <span className="ml-3 text-white/60 lowercase font-mono">{Math.min(matchTime, 30)}s</span>
                        )
                    ) : (
                        <ChevronsRight className="ml-2 group-hover:translate-x-2 transition" />
                    )}
                </Button>

                <div className="flex flex-col h-full gap-2">
                    <div className="font-medium pb-1.5 pl-2.5">Questions added for matching</div>
                    {questionList.filter((question) => question.selected).length == 0 ? (
                        <div className="flex p-1 h-[248px] w-full bg-gray-50 rounded-lg text-xs text-muted-foreground items-center justify-center">No questions added for matching</div>
                    ) : (
                        <div className="w-full p-1 min-h-60 h-full bg-gray-50 rounded-lg">
                            <ScrollArea type="auto" barOffset={1} className="h-60">
                                <div className="flex flex-wrap gap-0.5 mr-4 overflow-auto">
                                    {questionList
                                        .filter((question) => question.selected)
                                        .map((question) => (
                                            <HoverCard key={question.id} openDelay={300}>
                                                <HoverCardTrigger>
                                                    <Badge variant={question.complexity as BadgeProps["variant"]} className="w-fit">
                                                        {question.title}
                                                    </Badge>
                                                </HoverCardTrigger>
                                                <HoverCardContent className="rounded-xl p-2 w-fit">
                                                    <div className="flex items-center gap-2">
                                                        <MessageSquareText className="h-4 w-4 text-icon" />
                                                        {question.categories.map((category) => (
                                                            <Badge
                                                                key={category}
                                                                variant="category"
                                                                className="uppercase text-category-text bg-category-bg"
                                                            >
                                                                {category}
                                                            </Badge>
                                                        ))}
                                                    </div>
                                                </HoverCardContent>
                                            </HoverCard>
                                        ))}

                                </div>
                            </ScrollArea>
                        </div>
                    )}
                </div>

                {/* <div className="flex flex-col h-max gap-2 px-2.5">
                    <Accordion type="single" collapsible>
                        <AccordionItem value="item-1">
                            <AccordionTrigger>Past attempts</AccordionTrigger>
                            <AccordionContent>
                                <div className="flex flex-col w-full items-start">
                                    <div>Your past 5 attempts here</div>
                                    <Link href="/profile/question-history" className="mt-2 self-end font-medium text-blue-600/90 hover:text-blue-800/90">
                                        <div className="flex items-center">
                                            View more
                                            <ArrowUpRight className="ml-1 size-4" />
                                        </div>
                                    </Link>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </div> */}
            </div>

            <Dialog open={isMatchFoundDialogOpen}>
                <DialogContent
                    className="laptop:max-w-[40vw] bg-white text-black font-sans rounded-2xl [&>button]:hidden"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader className="items-start">
                        <DialogTitle className="font-serif font-normal tracking-tight text-3xl">
                            Match found
                        </DialogTitle>
                        <DialogDescription className="hidden"></DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col w-full gap-1 py-4 justify-start">
                        <p>You have been matched with <span className="font-semibold">{matchResult.peerUsername}</span></p>
                        <p>Redirecting you to your <span className="text-md font-bold font-brand tracking-tight text-brand-700">Prep</span> session...</p>
                    </div>
                </DialogContent>
            </Dialog>

            <Dialog open={isMatchFailDialogOpen}>
                <DialogContent
                    className="laptop:max-w-[40vw] bg-white text-black font-sans rounded-2xl [&>button]:hidden"
                    onPointerDownOutside={(e) => e.preventDefault()}
                    onInteractOutside={(e) => e.preventDefault()}
                    onEscapeKeyDown={(e) => e.preventDefault()}
                >
                    <DialogHeader className="items-start">
                        <DialogTitle className="font-serif font-normal tracking-tight text-3xl">
                            Match not found
                        </DialogTitle>
                        <DialogDescription className="hidden"></DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col w-full gap-1 py-4 justify-start">
                        <p>Please try again.</p>
                        <p>Redirecting you back to the question page in {redirectTime} {redirectTime === 1 ? "second" : "seconds"}...</p>
                    </div>
                </DialogContent>
            </Dialog>
        </main>
    );
}