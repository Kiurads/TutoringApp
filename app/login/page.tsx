"use client";

import { useState } from "react";

export default function Login() {
	const [email, setEmail] = useState("");
	const [password, setPassword] = useState("");

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const res = await fetch("/api/auth/login", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify({ email, password }),
		});
		const data = await res.json();
		if (res.ok) {
			alert("Login successful");
		} else {
			alert(data.message || "Something went wrong");
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<input
				type="email"
				value={email}
				onChange={(e) => setEmail(e.target.value)}
				placeholder="Email"
				required
			/>
			<input
				type="password"
				value={password}
				onChange={(e) => setPassword(e.target.value)}
				placeholder="Password"
				required
			/>
			<button type="submit">Login</button>
		</form>
	);
}
