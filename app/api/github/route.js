import { fetchRepositoryData } from "@/lib/githubLoader";
import { NextResponse } from "next/server";

export async function GET(request) {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get("url");

    if (!url) {
        return NextResponse.json({ error: "No URL provided" }, { status: 400 });
    }

    const result = await fetchRepositoryData(url);
    return NextResponse.json(result);
}