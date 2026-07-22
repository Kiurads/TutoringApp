"use client";

import { useState, useTransition } from "react";
import { updateProfile, type UpdateProfileData } from "@/app/lib/actions/users.actions";

const LEARNING_STYLES = [
	{ value: "visual", label: "Visual — diagrams, charts, examples" },
	{ value: "discussion", label: "Discussion — talking through problems" },
	{ value: "hands-on", label: "Hands-on — practice and application" },
	{ value: "reading", label: "Reading — notes and written explanations" },
];

interface Props {
	role: "student" | "teacher";
	initialData: {
		firstName: string;
		lastName: string;
		bio: string | null;
		learningStyle: string | null;
		learningGoal: string | null;
		teachingStyle: string | null;
		pricePerHour: number | null;
	};
}

export default function ProfileForm({ role, initialData }: Props) {
	const [isPending, startTransition] = useTransition();
	const [success, setSuccess] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const [firstName, setFirstName] = useState(initialData.firstName);
	const [lastName, setLastName] = useState(initialData.lastName);
	const [bio, setBio] = useState(initialData.bio ?? "");
	const [learningStyle, setLearningStyle] = useState(initialData.learningStyle ?? "");
	const [learningGoal, setLearningGoal] = useState(initialData.learningGoal ?? "");
	const [teachingStyle, setTeachingStyle] = useState(initialData.teachingStyle ?? "");
	const [pricePerHour, setPricePerHour] = useState(
		initialData.pricePerHour?.toString() ?? "",
	);

	function handleSubmit(e: React.FormEvent) {
		e.preventDefault();
		setError(null);
		setSuccess(false);

		if (!firstName.trim() || !lastName.trim()) {
			setError("First and last name are required.");
			return;
		}

		const payload: UpdateProfileData = {
			firstName,
			lastName,
			bio,
			...(role === "student" && { learningStyle, learningGoal }),
			...(role === "teacher" && {
				teachingStyle,
				pricePerHour: pricePerHour ? parseFloat(pricePerHour) : undefined,
			}),
		};

		startTransition(async () => {
			const result = await updateProfile(payload);
			if (result.error) {
				setError(result.error);
			} else {
				setSuccess(true);
			}
		});
	}

	return (
		<form onSubmit={handleSubmit} className="flex flex-col gap-5">
			{/* Name row */}
			<div className="flex flex-col sm:flex-row gap-4">
				<div className="flex flex-col gap-1 flex-1">
					<label htmlFor="profile-first-name" className="text-sm font-medium">First name</label>
					<input
						id="profile-first-name"
						className="input input-bordered w-full"
						value={firstName}
						onChange={(e) => setFirstName(e.target.value)}
						required
					/>
				</div>
				<div className="flex flex-col gap-1 flex-1">
					<label htmlFor="profile-last-name" className="text-sm font-medium">Last name</label>
					<input
						id="profile-last-name"
						className="input input-bordered w-full"
						value={lastName}
						onChange={(e) => setLastName(e.target.value)}
						required
					/>
				</div>
			</div>

			{/* Bio */}
			<div className="flex flex-col gap-1">
				<label htmlFor="profile-bio" className="text-sm font-medium">Bio</label>
				<textarea
					id="profile-bio"
					className="textarea textarea-bordered w-full h-24 resize-none"
					placeholder="Tell others a bit about yourself…"
					value={bio}
					onChange={(e) => setBio(e.target.value)}
					maxLength={500}
				/>
				<span className="text-xs text-base-content/40 self-end">
					{bio.length}/500
				</span>
			</div>

			{/* Student-specific fields */}
			{role === "student" && (
				<>
					<div className="flex flex-col gap-1">
						<label htmlFor="profile-learning-style" className="text-sm font-medium">Learning style</label>
						<select
							id="profile-learning-style"
							className="select select-bordered w-full"
							value={learningStyle}
							onChange={(e) => setLearningStyle(e.target.value)}
						>
							<option value="">— Select a style —</option>
							{LEARNING_STYLES.map((s) => (
								<option key={s.value} value={s.value}>
									{s.label}
								</option>
							))}
						</select>
					</div>
					<div className="flex flex-col gap-1">
						<label htmlFor="profile-learning-goal" className="text-sm font-medium">Current learning goal</label>
						<input
							id="profile-learning-goal"
							className="input input-bordered w-full"
							placeholder="e.g. Prepare for SAT Math, improve essay writing…"
							value={learningGoal}
							onChange={(e) => setLearningGoal(e.target.value)}
							maxLength={200}
						/>
					</div>
				</>
			)}

			{/* Teacher-specific fields */}
			{role === "teacher" && (
				<>
					<div className="flex flex-col gap-1">
						<label htmlFor="profile-teaching-style" className="text-sm font-medium">Teaching style</label>
						<input
							id="profile-teaching-style"
							className="input input-bordered w-full"
							placeholder="e.g. Structured, Socratic, hands-on with examples…"
							value={teachingStyle}
							onChange={(e) => setTeachingStyle(e.target.value)}
							maxLength={200}
						/>
					</div>
					<div className="flex flex-col gap-1">
						<label htmlFor="profile-price-per-hour" className="text-sm font-medium">Price per hour (€)</label>
						<input
							id="profile-price-per-hour"
							type="number"
							min={0}
							step={0.01}
							className="input input-bordered w-full"
							placeholder="0.00"
							value={pricePerHour}
							onChange={(e) => setPricePerHour(e.target.value)}
						/>
					</div>
				</>
			)}

			{/* Feedback */}
			{error && (
				<div role="alert" className="alert alert-error text-sm py-2">
					<i className="fa-solid fa-circle-xmark"></i>
					<span>{error}</span>
				</div>
			)}
			{success && (
				<div role="alert" className="alert alert-success text-sm py-2">
					<i className="fa-solid fa-circle-check"></i>
					<span>Profile updated successfully.</span>
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
						<i className="fa-solid fa-floppy-disk"></i> Save changes
					</>
				)}
			</button>
		</form>
	);
}
