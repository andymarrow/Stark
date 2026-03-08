export const dynamic = 'force-dynamic';

import { getEventDashboard } from "@/app/actions/getEventDashboard";
import { redirect } from "next/navigation";
import EventDashboardClient from "./_components/EventDashboardClient";

export default async function EventDashboardPage({ params }) {
  const { id } = await params;

  // Server-side Fetch for Security & Speed
  const { success, data, error } = await getEventDashboard(id);

  if (!success) {
    // If error is access denied, redirect to profile
    // In a real app, show a nice 403 page
    return (
        <div className="min-h-screen flex items-center justify-center bg-background text-red-500 font-mono text-xs">
            ERROR: {error}
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <EventDashboardClient 
        initialEvent={data.event} 
        initialFolders={data.folders} 
        initialSubmissions={data.submissions} 
      />
    </div>
  );
}