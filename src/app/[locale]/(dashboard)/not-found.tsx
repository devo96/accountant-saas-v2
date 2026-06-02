import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center max-w-md">
        <h2 className="text-6xl font-bold text-primary-600 mb-4">404</h2>
        <p className="text-gray-500 mb-6">The page you are looking for does not exist.</p>
        <Link href="/dashboard">
          <Button><ArrowLeft className="h-4 w-4 ms-1" /> Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
