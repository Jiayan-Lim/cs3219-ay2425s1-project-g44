"use client";

import React, { useEffect, useRef, useState } from "react";
import { QuestionHistory, columns} from "./columns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { DataTable } from "../../question-repo/data-table";
import { useRouter } from "next/navigation";

type receiveQuestion = {
  attemptDate: string,
  attemptCount: number,
  attemptTime: number,
  question: {
      id: number;
      title: string;
      complexity: string;
      category: string[];
      description: string;
      link: string;
  }
}

export default function UserQuestionHistory() {
  const router = useRouter();
  const [history, setHistory] = useState<QuestionHistory[]>([]);
  const [loading, setLoading] = useState(true);
  const userId = useRef(null);

  // authenticate user else redirect them to login page
  useEffect(() => {
    const authenticateUser = async () => {
      try {
        const token = localStorage.getItem("token");

        if (!token) {
          router.push("/auth/login"); // Redirect to login if no token
          return;
        }

        // Call the API to verify the token
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_USER_API_AUTH_URL}/verify-token`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!response.ok) {
          localStorage.removeItem("token"); // remove invalid token from browser
          router.push("/auth/login"); // Redirect to login if not authenticated
          return;
        }

        const data = (await response.json()).data;
        userId.current = data.id;
      } catch (error) {
        console.error("Error during authentication:", error);
        router.push("/auth/login"); // Redirect to login in case of any error
      }
    };

    authenticateUser();
  }, []);

  // Fetch questions history from backend API
  useEffect(() => {
    async function fetchHistory() {
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_USER_API_HISTORY_URL}/${userId}`
        );
        const data = await response.json();

        // const data: receiveQuestion[] = [
        // {
        //   "attemptDate": "2024-10-12T12:34:56Z",
        //   "attemptCount": 2,
        //   "attemptTime": 600, // In seconds (e.g., 10 minutes)
        //   "question": {
        //     "id": 1,
        //     "title": "Two Sum",
        //     "complexity": "Easy",
        //     "category": ["Arrays", "Algorithms"],
        //     "description": "Find two numbers that add up to the target.",
        //     "link": "http://leetcode/"
        //   }
        // },
        // {
        //   "attemptDate": "2024-10-10T15:10:45Z",
        //   "attemptCount": 1,
        //   "attemptTime": 180, // In seconds (e.g., 3 minutes)
        //   "question": {
        //     "id": 2,
        //     "title": "Longest Substring Without Repeating Characters",
        //     "complexity": "Medium",
        //     "category": ["Strings", "Algorithms"],
        //     "description": "Find the longest substring without repeating characters.",
        //     "link": "http://leetcode/"
        //   }
        // }];      

        // Map backend data to match the frontend Question type
        const mappedQuestions: QuestionHistory[] = data.map((q: receiveQuestion) => ({
            id: q.question.id,
            title: q.question.title,
            complexity:  q.question.complexity,
            categories: q.question.category.sort((a: string, b: string) =>
              a.localeCompare(b)
            ),
            description: q.question.description,
            attemptDate: new Date(q.attemptDate),
            attemptCount: q.attemptCount,
            attemptTime: q.attemptTime,
          })
        );

        setHistory(mappedQuestions);
      } catch (err) {
        console.log("Error fetching questions from server:", err)
      } finally {
        setLoading(false);
      }
    }

    fetchHistory();
  }, []);

  // Success state: Render the list of attempted questions
  return (
    <main className="flex flex-col min-h-screen px-20 pt-24 pb-10">
        <div className="mb-10"><span className="font-serif font-light text-4xl text-primary tracking-tight">My Question History</span></div>
        <DataTable columns={columns} data={history} isVisible={false} loading={loading}/>
    </main>
  );
};