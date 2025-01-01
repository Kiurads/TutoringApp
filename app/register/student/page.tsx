"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function Register() {
	const router = useRouter();
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		phoneNumber: "",
		firstName: "",
		lastName: "",
	});
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);

	const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const { name, value } = e.target;
		setFormData((prev) => ({ ...prev, [name]: value }));
	};

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		setError(null);
		setSuccess(null);

		try {
			const response = await fetch("/api/auth/register/student", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(formData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				setError(errorData.error || "Registration failed.");
				return;
			}

			router.push("/login");
		} catch (err) {
			console.log(err);
			setError("An unexpected error occurred.");
		}
	};

	return (
		<div>
			<h1>Register</h1>
			{error && <p style={{ color: "red" }}>{error}</p>}
			{success && <p style={{ color: "green" }}>{success}</p>}
			<form onSubmit={handleSubmit}>
				<input
					type="text"
					name="firstName"
					placeholder="First Name"
					value={formData.firstName}
					onChange={handleChange}
					required
				/>
				<input
					type="text"
					name="lastName"
					placeholder="Last Name"
					value={formData.lastName}
					onChange={handleChange}
					required
				/>
				<input
					type="email"
					name="email"
					placeholder="Email"
					value={formData.email}
					onChange={handleChange}
					required
				/>
				<input
					type="password"
					name="password"
					placeholder="Password"
					value={formData.password}
					onChange={handleChange}
					required
				/>
				<input
					type="text"
					name="phoneNumber"
					placeholder="Phone Number"
					value={formData.phoneNumber}
					onChange={handleChange}
				/>
				<button type="submit">Register</button>
			</form>
		</div>
	);
}
