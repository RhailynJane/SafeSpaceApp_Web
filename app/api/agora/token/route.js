import { NextResponse } from "next/server";
import { RtcTokenBuilder, RtcRole } from "agora-token";

export async function POST(request) {
  try {
    const { channelName, uid, role = "publisher" } = await request.json();

    if (!channelName) {
      return NextResponse.json(
        { error: "Channel name is required" },
        { status: 400 }
      );
    }

    const appId = process.env.AGORA_APP_ID;
    const appCertificate = process.env.AGORA_APP_CERTIFICATE;

    console.log("Agora Token Generation:", {
      appId: appId ? `${appId.substring(0, 8)}...` : "missing",
      certificate: appCertificate ? `${appCertificate.substring(0, 8)}...` : "missing",
      channelName,
      uid: uid || 0,
    });

    if (!appId || !appCertificate) {
      console.error("Agora credentials missing");
      return NextResponse.json(
        { error: "Agora configuration missing" },
        { status: 500 }
      );
    }

    // Token expires in 24 hours
    const expirationTimeInSeconds = 86400;
    const currentTimestamp = Math.floor(Date.now() / 1000);
    const privilegeExpiredTs = currentTimestamp + expirationTimeInSeconds;

    // Use 0 as uid if not provided (Agora will auto-assign)
    const userAccount = uid || 0;

    // Build the token
    const token = RtcTokenBuilder.buildTokenWithUid(
      appId,
      appCertificate,
      channelName,
      userAccount,
      role === "publisher" ? RtcRole.PUBLISHER : RtcRole.SUBSCRIBER,
      privilegeExpiredTs
    );

    return NextResponse.json({
      token,
      appId,
      channelName,
      uid: userAccount,
      expiresAt: privilegeExpiredTs,
    });
  } catch (error) {
    console.error("Error generating Agora token:", error);
    return NextResponse.json(
      { error: "Failed to generate token" },
      { status: 500 }
    );
  }
}
