import { NextResponse } from "next/server";
import puppeteer from "puppeteer";
import { createClient } from "@supabase/supabase-js";
import { createClient as createServerClient } from "@/utils/supabase/server";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(request) {
  let browser = null;
  const uploadedUrls = [];

  // This endpoint launches a headless Chrome and writes to storage, which
  // is by far the most expensive thing the app can be asked to do. It had
  // no auth at all, so anyone who found the path could spend the hosting
  // budget in a loop and fill the bucket. Signed-in callers only — it's
  // only ever used from the project create flow.
  const caller = await createServerClient();
  const { data: { user: caller_user } } = await caller.auth.getUser();
  if (!caller_user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { url } = await request.json();
    // Trust the session for identity, not the request body — the old code
    // took userId from the caller, so one user could file uploads under
    // another user's folder.
    const userId = caller_user.id;

    if (!url) return NextResponse.json({ error: "No URL provided" }, { status: 400 });

    let target;
    try {
      target = new URL(url);
    } catch {
      return NextResponse.json({ error: "Invalid URL" }, { status: 400 });
    }
    // Only ever point the browser at public web pages. Without this the
    // endpoint will happily fetch internal addresses and hand back a
    // picture of whatever is there.
    if (!["http:", "https:"].includes(target.protocol)) {
      return NextResponse.json({ error: "Only http(s) URLs are allowed" }, { status: 400 });
    }
    const host = target.hostname.toLowerCase();
    const isPrivateHost =
      host === "localhost" ||
      host === "0.0.0.0" ||
      host.endsWith(".local") ||
      host.endsWith(".internal") ||
      /^(127\.|10\.|192\.168\.|169\.254\.|::1$)/.test(host) ||
      /^172\.(1[6-9]|2\d|3[01])\./.test(host);
    if (isPrivateHost) {
      return NextResponse.json({ error: "That host isn't allowed" }, { status: 400 });
    }

    console.log(`[Screenshot] Launching Scout Bot for: ${url}`);

    // 1. Launch Browser Once
    browser = await puppeteer.launch({
      headless: "new",
      args: [
        '--no-sandbox', 
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--no-first-run',
        '--no-zygote',
      ]
    });

    const timestamp = Date.now();

    // --- PHASE 1: DESKTOP ---
    try {
        console.log("[Screenshot] Phase 1: Desktop...");
        const pageDesktop = await browser.newPage();
        
        // Set viewport BEFORE navigating to prevent layout shifts
        await pageDesktop.setViewport({ width: 1920, height: 1080 });
        
        // Disable timeout limits for the page operations
        pageDesktop.setDefaultNavigationTimeout(60000); 

        await pageDesktop.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 2000)); // Short wait for render

        const desktopBuffer = await pageDesktop.screenshot({ type: "jpeg", quality: 80 });
        const desktopPath = `projects/${userId}/${timestamp}-desktop.jpg`;
        
        const { error: uploadError } = await supabase.storage
          .from('project-assets')
          .upload(desktopPath, desktopBuffer, { contentType: 'image/jpeg', upsert: true });

        if (!uploadError) {
            const { data } = supabase.storage.from('project-assets').getPublicUrl(desktopPath);
            uploadedUrls.push(data.publicUrl);
        }
        await pageDesktop.close(); // Close tab to free memory

    } catch (err) {
        console.error("[Desktop Fail]", err.message);
        // Continue to mobile even if desktop fails
    }

    // --- PHASE 2: MOBILE (Fresh Tab) ---
    try {
        console.log("[Screenshot] Phase 2: Mobile...");
        const pageMobile = await browser.newPage();
        
        // Set mobile view BEFORE navigating
        await pageMobile.setViewport({ width: 375, height: 812, isMobile: true });
        pageMobile.setDefaultNavigationTimeout(60000);

        await pageMobile.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
        await new Promise(r => setTimeout(r, 2000)); 

        const mobileBuffer = await pageMobile.screenshot({ type: "jpeg", quality: 80 });
        const mobilePath = `projects/${userId}/${timestamp}-mobile.jpg`;

        const { error: uploadError } = await supabase.storage
          .from('project-assets')
          .upload(mobilePath, mobileBuffer, { contentType: 'image/jpeg', upsert: true });

        if (!uploadError) {
            const { data } = supabase.storage.from('project-assets').getPublicUrl(mobilePath);
            uploadedUrls.push(data.publicUrl);
        }
        await pageMobile.close();

    } catch (err) {
        console.error("[Mobile Fail]", err.message);
    }

    // Return whatever we managed to capture
    if (uploadedUrls.length === 0) {
        return NextResponse.json({ error: "Failed to capture any images." }, { status: 500 });
    }

    console.log(`[Screenshot] Success. ${uploadedUrls.length} images saved.`);
    return NextResponse.json({ success: true, images: uploadedUrls });

  } catch (error) {
    console.error("[Critical Error]", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
    
  } finally {
    if (browser) await browser.close();
  }
}