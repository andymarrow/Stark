import { getPublicEventDetails } from "@/app/actions/getPublicEventDetails";
import { notFound } from "next/navigation";
import EventShowcaseClient from "./_components/EventShowcaseClient";

export async function generateMetadata({ params }) {
  const { id } = await params;
  // Simple fetch for metadata (or use a lighter query)
  const { data } = await getPublicEventDetails(id);
  if (!data?.event) return { title: "Event Not Found | Stark" };
  
  return {
    title: `${data.event.title} | Stark Events`,
    description: data.event.description?.substring(0, 160),
  };
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;
  const { success, data, error } = await getPublicEventDetails(id);

  if (!success || !data) {
    return notFound(); 
  }

  return (
    <EventShowcaseClient 
        event={data.event}
        folders={data.folders}
        submissions={data.submissions}
    />
  );
}