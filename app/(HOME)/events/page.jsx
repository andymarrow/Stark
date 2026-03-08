import { getEventsHubData } from "@/app/actions/getEventsHubData";
import { redirect } from "next/navigation";
import EventsHubClient from "./_components/EventsHubClient";
import { ShieldAlert } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata = {
  title: "Events Hub | Stark",
  description: "Global Event Registry and Personal Terminal.",
};

export default async function EventsHubPage() {
  const { success, data, error } = await getEventsHubData();

  if (!success && error === "Unauthorized") {
    redirect("/login?returnTo=/events");
  }

  if (!success) {
    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center">
            <ShieldAlert size={48} className="text-red-500 mb-4" />
            <h1 className="text-xl font-bold uppercase font-mono">System_Error: {error}</h1>
            <Link href="/" className="mt-4">
                <Button variant="outline" className="rounded-none font-mono text-xs uppercase">Return to Base</Button>
            </Link>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EventsHubClient 
        initialHosted={data.hosted} 
        initialSubmissions={data.submissions} 
        initialRadar={data.radar}
      />
    </div>
  );
}