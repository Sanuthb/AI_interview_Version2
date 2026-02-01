import { NextRequest, NextResponse } from "next/server";
import { deleteAdminUser, updateAdminUser } from "@/lib/services/admin-users";

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ usn: string }> }
) {
  try {
    const { usn } = await params;
    await deleteAdminUser(usn);
    return NextResponse.json({ success: true, message: "User deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to delete user" },
      { status: 500 }
    );
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ usn: string }> }
) {
  try {
    const { usn } = await params;
    const updates = await req.json();
    await updateAdminUser(usn, updates);
    return NextResponse.json({ success: true, message: "User updated successfully" });
  } catch (error: any) {
    console.error("Error updating user:", error);
    return NextResponse.json(
      { error: error.message || "Failed to update user" },
      { status: 500 }
    );
  }
}
