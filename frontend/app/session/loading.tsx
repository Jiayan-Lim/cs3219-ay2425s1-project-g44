import { LoaderCircle } from "lucide-react";

export default function SessionLoading() {
    return (
        <div className="flex justify-center items-center min-h-screen">
            <LoaderCircle className="animate-spin size-10 text-brand-600" />
        </div>
    )
}