import { NextResponse } from "next/server";

export const catchErrors = (controller) => {
	return async (request, context) => {
		try {
			return await controller(request, context);
		} catch (error) {
			console.error("Error:", error.message);

			const status = error.status || 500;
			const message = error.expose
				? error.message
				: "Internal Server Error";

			return NextResponse.json({ error: message }, { status });
		}
	};
};
