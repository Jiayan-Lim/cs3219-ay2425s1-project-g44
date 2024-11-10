"use client"
 
import { Badge, BadgeProps } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card";
import { ColumnDef } from "@tanstack/react-table"
import { AlignLeft, ArrowUpDown, MoreHorizontal  } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import Link from "next/link"

export type QuestionHistory = {
    id: number;
    title: string;
    complexity: string;
    categories: string[];
    description: string;
    attemptDate: Date;
    attemptCount: number;
    attemptTime: number;
  };

export const columns : ColumnDef<QuestionHistory>[]= [
    {
      accessorKey: "id",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            ID
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
    },
    {
      accessorKey: "title",
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Title
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      cell: ({ row }) => {
        return (
            <HoverCard>
                <HoverCardTrigger>
                    <div className="flex space-x-2">
                        <span className="font-medium cursor-help">
                        {row.getValue("title")}
                        </span>
                    </div>
                </HoverCardTrigger>
                <HoverCardContent className="rounded-xl">
                    <div className="flex flex-col">
                        <div className="flex items-center font-semibold mb-2">
                            <AlignLeft className="h-4 w-4 mr-2" />
                            <span>Description</span>
                        </div>
                        <div>
                            <p>{row.original.description}</p>
                        </div>
                    </div>
                </HoverCardContent>
            </HoverCard>
        )
    },
    },
    {
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Categories
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      accessorKey: "categories",
      cell: ({ row }) => (
        <div className="w-[140px]">
            {row.original.categories.map((category, index) => (
                <Badge key={index} variant="category" className="mr-1 my-0.5">
                    {category}
                </Badge>
            ))}
        </div>
      ),
      filterFn: (row, id, selectedCategories) => {
        const rowCategories = row.getValue(id);
        console.log(selectedCategories);
        console.log(rowCategories);
        return selectedCategories.every((category: string) => (rowCategories as string[]).includes(category));
    },
    },
    {
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Complexity
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      accessorKey: "complexity",
      cell: ({ row }) => (
        <div className="w-[40px]">
            <Badge variant={row.original.complexity.toLowerCase() as BadgeProps["variant"]}>
                {row.original.complexity}
            </Badge>
        </div>
      ),
      filterFn: (row, id, value) => {
          return value.includes(row.getValue(id))
      },
    },
    {
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Number of Attempts
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      accessorKey: "attemptCount",
      cell: ({ row }) => <div className="flex items-center justify-center h-full">{row.getValue("attemptCount")}</div>,
    },
    {
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Total Time Spent (mins)
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      accessorKey: "attemptTime",
      cell: ({ row }) => <div className="flex items-center justify-center h-full">{ Math.ceil(row.original.attemptTime/60)}</div>,
    //   Cell: ({ value }) => Math.floor(value / 60), // Convert time spent in seconds to minutes
    },
    {
      header: ({ column }) => {
        return (
          <Button
            variant="ghost"
            onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
          >
            Last Attempted
            <ArrowUpDown className="ml-2 h-4 w-4" />
          </Button>
        )
      },
      accessorKey: "attemptDate",
      cell: ({ row }) => {
        const attemptDate = row.original.attemptDate;
        return new Date(attemptDate).toLocaleString("en-GB", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false,
        });
      },
    },
    {
      id: "actions",
      cell: ({ row }) => {
        return (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                    variant="ghost"
                    className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
                >
                    <MoreHorizontal className="h-4 w-4" />
                    <span className="sr-only">Open menu</span>
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>
                <Link href={`/profile/question-history/code?questionId=${row.getValue("id")}`} passHref>
                  View Code
                </Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )
      },
      enableResizing: false,
  }
  ];