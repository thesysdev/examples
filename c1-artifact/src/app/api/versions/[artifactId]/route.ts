import { NextRequest, NextResponse } from "next/server";
import { getVersions, getVersion } from "../../../../lib/versionStore";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ artifactId: string }> }
) {
  const { artifactId } = await params;

  // Check if a specific version is requested
  const versionId = req.nextUrl.searchParams.get("versionId");

  if (versionId) {
    const version = getVersion(artifactId, parseInt(versionId, 10));
    if (!version) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }
    return NextResponse.json(version);
  }

  // Return all versions for the artifact
  const versions = getVersions(artifactId);
  return NextResponse.json({ artifactId, versions });
}

