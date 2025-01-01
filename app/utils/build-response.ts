import { NextResponse } from "next/server";

export default function buildResponse(message: string, status: number) {
	return NextResponse.json({ message: message }, { status: status });
}
