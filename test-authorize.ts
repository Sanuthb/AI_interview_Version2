import * as dotenv from "dotenv";
import path from "path";
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

async function testAuthorize() {
    console.log("Supabase URL in process.env:", process.env.NEXT_PUBLIC_SUPABASE_URL);

    // Dynamic import to ensure process.env is populated
    const { authOptions } = await import("./lib/auth");

    const credentials = {
        email: "tanmayrana2001@gmail.com",
        password: "1NH24MC142@123",
    };

    console.log("Testing authorize with:", credentials);

    try {
        // @ts-ignore
        const user = await authOptions.providers[0].authorize(credentials, {});
        console.log("Authorize result:", user);
    } catch (error) {
        console.error("Authorize threw error:", error);
    }
}

testAuthorize();
