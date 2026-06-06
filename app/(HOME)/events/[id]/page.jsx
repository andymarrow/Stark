import { getPublicEventDetails } from "@/app/actions/getPublicEventDetails";
import { notFound } from "next/navigation";
import EventShowcaseClient from "./_components/EventShowcaseClient";
import JsonLd from "@/components/JsonLd";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://stark.et";

export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data } = await getPublicEventDetails(id);
  if (!data?.event) return { title: "Event Not Found | Stark" };

  const e = data.event;
  const canonicalUrl = `${BASE_URL}/events/${id}`;
  const title = `${e.title} | Stark Events`;
  const description = (e.description || `${e.title} – a creator event on Stark.`).substring(0, 160);
  const ogImage = e.cover_image
    ? [{ url: e.cover_image, width: 1200, height: 630, alt: e.title }]
    : [{ url: `${BASE_URL}/og-image.png`, width: 1200, height: 630, alt: "Stark Events" }];

  return {
    title,
    description,
    alternates: { canonical: canonicalUrl },
    openGraph: {
      title,
      description,
      url: canonicalUrl,
      siteName: "Stark",
      images: ogImage,
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogImage[0].url],
    },
  };
}

export default async function EventDetailPage({ params }) {
  const { id } = await params;
  const { success, data, error } = await getPublicEventDetails(id);

  if (!success || !data) {
    return notFound();
  }

  const e = data.event;
  const eventUrl = `${BASE_URL}/events/${id}`;
  const hostUrl = e.host?.username ? `${BASE_URL}/profile/${e.host.username}` : undefined;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Event",
        name: e.title,
        description: (e.description || "").substring(0, 500),
        url: eventUrl,
        eventStatus: "https://schema.org/EventScheduled",
        eventAttendanceMode: "https://schema.org/OnlineEventAttendanceMode",
        location: { "@type": "VirtualLocation", url: eventUrl },
        ...(e.cover_image && { image: e.cover_image }),
        ...(e.start_date && { startDate: e.start_date }),
        ...(e.end_date && { endDate: e.end_date }),
        ...(hostUrl && {
          organizer: {
            "@type": "Person",
            name: e.host?.full_name || e.host?.username || "Stark Creator",
            url: hostUrl,
          },
        }),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Stark", item: BASE_URL },
          { "@type": "ListItem", position: 2, name: "Events", item: `${BASE_URL}/events` },
          { "@type": "ListItem", position: 3, name: e.title, item: eventUrl },
        ],
      },
    ],
  };

  return (
    <>
      <JsonLd data={jsonLd} strict />
      <EventShowcaseClient
        event={data.event}
        folders={data.folders}
        submissions={data.submissions}
      />
    </>
  );
}
