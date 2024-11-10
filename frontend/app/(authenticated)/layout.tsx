"use client"

import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { User, FileText, LogOut } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { deleteAllCookies, getCookie, getUsername, isUserAdmin } from "../utils/cookie-manager";
import { isTokenExpired } from "../utils/token-utils";
import { useNavigationConfirm } from "../hooks/useNavConfirm";

function AdminNav(pathname: string) {
    const [isClient, setIsClient] = useState(false);

    useEffect(() => {
        setIsClient(true);
    }, []);

    if (!isClient) return null;

    if (isUserAdmin()) {
        return (
            <Link
                href="/question-repo"
                className={`text-lg font-semibold uppercase transition duration-100
                ${pathname === '/question-repo'
                        ? 'text-gray-700 drop-shadow-md'
                        : 'text-gray-700/50 hover:text-gray-700'
                    }`}
                prefetch={false}
            >
                Repository
            </Link>
        )
    }

    return (<></>);
}

export default function AuthenticatedLayout({
    children,
}: Readonly<{
    children: React.ReactNode;
}>) {
    const pathname = usePathname();

    const router = useRouter();

    const isSessionPage = pathname.startsWith('/session');
    const handleNavigation = useNavigationConfirm(isSessionPage);

    useEffect(() => {
        const authenticateUser = async () => {
            const token = getCookie('token');
            if (!token || await isTokenExpired(token)) {
                deleteAllCookies();
                router.push('/auth/login');
                return;
            }

             // if non-admin user tries to access repo, redirect user to question page
            if (pathname.includes('/question-repo') && !isUserAdmin()) {
                router.replace('/questions');
                return;
            }
        };

        authenticateUser();
    }, [pathname, router]);

    function logout() {
        deleteAllCookies();
        router.push('/');
    }

    return (
        <div className="min-h-screen bg-white relative">
            <header className="flex items-center justify-between px-8 py-4 fixed top-0 left-0 right-0 z-10 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center gap-2">
                    <Link
                        href="/"
                        className="text-2xl font-bold font-brand tracking-tight text-brand-700"
                        prefetch={false}
                        onClick={(e) => {
                            e.preventDefault();
                            handleNavigation("/");
                        }}
                    >
                        PeerPrep
                    </Link>
                    {process.env.NODE_ENV == "development" && (
                        <Badge variant="dev" className="ml-2 font-brand">
                            DEV
                        </Badge>
                    )}
                </div>
                <div className="flex items-center gap-4">
                    <nav className="flex items-center gap-10 font-brand">
                        <Link
                            href="/questions"
                            className={`text-lg font-semibold uppercase transition duration-100
                            ${pathname === '/questions'
                                    ? 'text-gray-700 drop-shadow-md'
                                    : 'text-gray-700/50 hover:text-gray-700'
                                }`} 
                            onClick={(e) => {
                                e.preventDefault();
                                handleNavigation("/questions");
                            }}
                            prefetch={false}
                        >
                            Questions
                        </Link>
                        {AdminNav(pathname)}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="rounded-full text-gray-400 transition duration-100 hover:text-gray-400 hover:bg-white hover:border-2"
                                >
                                    <User className="" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="font-sans">
                                {!pathname.includes('/profile') && (<><DropdownMenuLabel>{getUsername()}</DropdownMenuLabel>
                                <DropdownMenuSeparator /></>)}
                                <DropdownMenuItem asChild>
                                    <Link href="/profile" className="cursor-pointer" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleNavigation("/profile");
                                        }}
                                    >
                                        <User className="mr-2 h-4 w-4" />Profile
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild>
                                    <Link href="/profile/question-history" className="cursor-pointer" 
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleNavigation("/profile/question-history");
                                        }}
                                    >
                                        <FileText className="mr-2 h-4 w-4" />Attempt History
                                    </Link>
                                </DropdownMenuItem>
                                <DropdownMenuItem asChild onClick={(e) => {
                                    logout();
                                }}>
                                    <Link href="/" className="cursor-pointer"
                                        onClick={(e) => {
                                            e.preventDefault();
                                            handleNavigation("/");
                                        }}
                                    >
                                        <LogOut className="mr-2 h-4 w-4" />Log out
                                    </Link>
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </nav>
                </div>
            </header>
            {children}
        </div>
    );
}
