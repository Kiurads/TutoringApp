"use client";

import { redirect } from "next/navigation";
import { useState } from "react";

export default function Register() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		firstName: "",
		lastName: "",
		phoneNumber: "",
		role: "student",
		bio: "",
	});

	const handleSubmit = async (e: React.FormEvent) => {
		e.preventDefault();
		const res = await fetch("/api/auth/register-teacher", {
			method: "POST",
			headers: {
				"Content-Type": "application/json",
			},
			body: JSON.stringify(formData),
		});
		const data = await res.json();
		if (res.ok) {
			redirect("/login");
		} else {
			alert(data.message);
		}
	};

	return (
		<form onSubmit={handleSubmit}>
			<input
				type="email"
				name="email"
				value={formData.email}
				onChange={(e) =>
					setFormData({ ...formData, email: e.target.value })
				}
				placeholder="Email"
				required
			/>
			<input
				type="password"
				name="password"
				value={formData.password}
				onChange={(e) =>
					setFormData({ ...formData, password: e.target.value })
				}
				placeholder="Password"
				required
			/>
			<input
				type="text"
				name="firstName"
				value={formData.firstName}
				onChange={(e) =>
					setFormData({ ...formData, firstName: e.target.value })
				}
				placeholder="First Name"
				required
			/>
			<input
				type="text"
				name="lastName"
				value={formData.lastName}
				onChange={(e) =>
					setFormData({ ...formData, lastName: e.target.value })
				}
				placeholder="Last Name"
				required
			/>
			<input
				type="text"
				name="phoneNumber"
				value={formData.phoneNumber}
				onChange={(e) =>
					setFormData({ ...formData, phoneNumber: e.target.value })
				}
				placeholder="Phone Number"
			/>
			<textarea
				name="bio"
				value={formData.bio}
				onChange={(e) =>
					setFormData({ ...formData, bio: e.target.value })
				}
				placeholder="Bio"
			/>
			<button type="submit">Register</button>
		</form>
	);
}
