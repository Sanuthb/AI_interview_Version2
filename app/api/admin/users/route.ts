import { NextRequest, NextResponse } from "next/server";
import { createAdminUser, listAdminUsers } from "@/lib/services/admin-users";

export async function GET() {
  try {
    const users = await listAdminUsers();
    return NextResponse.json({ success: true, data: users });
  } catch (error: any) {
    console.error("Error listing admin users:", error);
    return NextResponse.json(
      { error: error.message || "Failed to list users" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { name, usn, email, batch, dept } = body as {
      name?: string;
      usn?: string;
      email?: string;
      batch?: string;
      dept?: string;
    };

    if (!name || !usn || !email) {
      return NextResponse.json(
        { error: "name, usn and email are required" },
        { status: 400 }
      );
    }

    const { user, auth } = await createAdminUser({
      name: name.trim(),
      usn: usn.trim(),
      email: email.trim(),
      batch: batch?.trim() || undefined,
      dept: dept?.trim() || undefined,
    });

    return NextResponse.json({
      success: true,
      data: {
        user,
        auth,
      },
    });
  } catch (error: any) {
    console.error("Error creating admin user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}


