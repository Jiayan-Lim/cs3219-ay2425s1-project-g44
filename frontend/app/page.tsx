import { Button } from "@/components/ui/button";
import Link from "next/link";
import Image from 'next/image';

export default function Landing() {
    return (
        <div className="flex flex-col min-h-screen w-screen items-center justify-center bg-white font-sans">
            <div className="flex items-start laptop:w-3/5 gap-10 laptop:justify-between pb-20">
                <div className="flex flex-col pl-10 pr-20 justify-between gap-12 laptop:gap-16">
                    <span className="font-bold font-brand tracking-tight text-brand-700 text-5xl">PeerPrep</span>
                    <div className="laptop:hidden w-[250px] bg-brand-50 p-10 rounded-full">
                        <Image src="/images/landing.svg" alt="PeerPrep" width={500} height={500} />
                    </div>
                    <div className="flex flex-col w-[350px] gap-1 items-start font-serif font-light text-3xl text-primary tracking-tight">
                        <p>Prep for your next interview with your Peers</p>
                    </div>
                    <div className="flex gap-4 pt-10 items-center text-sm text-muted-foreground">
                        <Button asChild variant="outline" size="lg" className="rounded-full px-6 border-brand-300 hover:border-brand-100 text-brand-600">
                            <Link href="/auth/login" className="">Login</Link>
                        </Button>
                        or
                        <Button asChild size="lg" className="rounded-full px-6 bg-brand-600 hover:bg-brand-600/90">
                            <Link href="/auth/sign-up" className="text-white">Sign Up</Link>
                        </Button>
                    </div>
                </div>
                <div className="hidden laptop:block laptop:w-[440px] bg-brand-50 p-10 rounded-full">
                    <Image src="/images/landing.svg" alt="PeerPrep" width={500} height={500} />
                </div>
            </div>
        </div>
    )
}