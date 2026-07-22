"use client";

import { useState, useTransition } from "react";
import { changePassword } from "@/app/lib/auth/change-password";

export default function ChangePasswordForm() {
	const [isPending, startTransition] = useTransition();
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState(false);

	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSuccess(false);

		if (newPassword.length < 8) {
			setError("New password must be at least 8 characters.");
			return;
		}
		if (newPassword !== confirmPassword) {
			setError("New passwords do not match.");
			return;
		}

		startTransition(async () => {
			const result = await changePassword({
				currentPassword,
				newPassword,
				confirmPassword,
			});
			if (result.error) {
				setError(result.error);
			} else {
				setSuccess(true);
				setCurrentPassword("");
				setNewPassword("");
				setConfirmPassword("");
			}
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-4">
			<div className="flex flex-col gap-1">
				<label className="text-sm font-medium">Current password</label>
				<input
					type="password"
					className="input input-bordered w-full"
					value={currentPassword}
					onChange={(e) => setCurrentPassword(e.target.value)}
					autoComplete="current-password"
					required
				/>
			</div>

			<div className="flex flex-col gap-1">
				<label className="text-sm font-medium">New password</label>
				<input
					type="password"
					className="input input-bordered w-full"
					value={newPassword}
					onChange={(e) => setNewPassword(e.target.value)}
					autoComplete="new-password"
					minLength={8}
					required
				/>
			</div>

			<div className="flex flex-col gap-1">
				<label className="text-sm font-medium">Confirm new password</label>
				<input
					type="password"
					className="input input-bordered w-full"
					value={confirmPassword}
					onChange={(e) => setConfirmPassword(e.target.value)}
					autoComplete="new-password"
					minLength={8}
					required
				/>
			</div>

			{error && (
				<div role="alert" className="alert alert-error text-sm py-2">
					<i className="fa-solid fa-circle-xmark"></i>
					<span>{error}</span>
				</div>
			)}
			{success && (
				<div role="alert" className="alert alert-success text-sm py-2">
					<i className="fa-solid fa-circle-check"></i>
					<span>Password updated successfully.</span>
				</div>
			)}

			<button
				type="submit"
				className="btn btn-primary self-start"
				disabled={isPending}
			>
				{isPending ? (
					<span className="loading loading-spinner loading-sm"></span>
				) : (
					<>
						<i className="fa-solid fa-key"></i> Update password
					</>
				)}
			</button>
		</form>
	);
}
