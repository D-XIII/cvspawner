import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { connectToDatabase } from "@/lib/mongodb";
import ScrapedJob from "@/models/ScrapedJob";

const SCRAPER_URL = process.env.SCRAPER_URL || "http://localhost:8000";

export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectToDatabase();

    // Get all job descriptions from the database
    const jobs = await ScrapedJob.find(
      { description: { $exists: true, $ne: null, $ne: "" } },
      { description: 1 }
    ).lean();

    if (!jobs || jobs.length === 0) {
      return NextResponse.json(
        { error: "No jobs with descriptions found" },
        { status: 400 }
      );
    }

    const descriptions = jobs
      .map((j) => j.description)
      .filter((d): d is string => typeof d === "string" && d.length > 0);

    if (descriptions.length === 0) {
      return NextResponse.json(
        { error: "No valid job descriptions found" },
        { status: 400 }
      );
    }

    // Call scraper to build TF-IDF index
    const response = await fetch(`${SCRAPER_URL}/build-tfidf`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_descriptions: descriptions }),
    });

    if (!response.ok) {
      const error = await response.text();
      return NextResponse.json(
        { error: `Failed to build TF-IDF index: ${error}` },
        { status: 500 }
      );
    }

    const result = await response.json();

    return NextResponse.json({
      success: true,
      jobsProcessed: descriptions.length,
      ...result,
    });
  } catch (error) {
    console.error("Error building TF-IDF index:", error);
    return NextResponse.json(
      { error: "Failed to build TF-IDF index" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    // Get TF-IDF status from scraper
    const response = await fetch(`${SCRAPER_URL}/tfidf-status`);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Failed to get TF-IDF status" },
        { status: 500 }
      );
    }

    const status = await response.json();
    return NextResponse.json(status);
  } catch (error) {
    console.error("Error getting TF-IDF status:", error);
    return NextResponse.json(
      { error: "Failed to get TF-IDF status" },
      { status: 500 }
    );
  }
}
