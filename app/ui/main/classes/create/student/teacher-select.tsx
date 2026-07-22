import { TeacherDetails } from "@/app/lib/types/teachers.types";
import { FC } from "react";

interface TeacherSelectProps {
	teachers: TeacherDetails[];
	selectedSubject: string;
	selectedTeacherId?: string;
	onSelectTeacher?: (id: string, name: string, pricePerHour: string) => void;
}

const TeacherSelect: FC<TeacherSelectProps> = ({
	teachers,
	selectedSubject,
	selectedTeacherId,
	onSelectTeacher,
}) => {
	if (!selectedSubject) return null;

	return (
		<div className="flex flex-col gap-1.5">
			<label className="text-sm font-medium">Teacher</label>
			<input type="hidden" name="teacher" value={selectedTeacherId ?? ""} />
			{teachers.length === 0 ? (
				<div className="text-sm text-base-content/50 italic text-center py-4">
					No teachers available for this subject.
				</div>
			) : (
				<div className="flex flex-col gap-2">
					{teachers.map((teacher) => {
						const isSelected = selectedTeacherId === teacher.id;
						return (
							<button
								key={teacher.id}
								type="button"
								className={`w-full text-left p-3 rounded-xl border-2 transition-all ${
									isSelected
										? "border-primary bg-primary/10"
										: "border-base-300 bg-base-100 hover:border-primary/40"
								}`}
								onClick={() =>
									onSelectTeacher?.(teacher.id, teacher.name, teacher.pricePerHour)
								}
							>
								<div className="flex items-center justify-between gap-2">
									<div className="flex items-center gap-3">
										<div className="relative shrink-0">
											<div className="w-9 h-9 rounded-full bg-neutral text-neutral-content text-sm font-bold flex items-center justify-center">
												{teacher.name.charAt(0).toUpperCase()}
											</div>
											{teacher.isOnline && (
												<span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-success rounded-full border-2 border-base-100">
													<span className="sr-only">Online</span>
												</span>
											)}
										</div>
										<span className="font-medium text-sm">{teacher.name}</span>
									</div>
									<div className="flex items-center gap-3 text-xs shrink-0">
										{teacher.rating !== "No Reviews" ? (
											<span className="flex items-center gap-1 text-base-content/60">
												<i className="fa-solid fa-star text-warning" />
												{teacher.rating}
											</span>
										) : (
											<span className="text-base-content/40 italic">New</span>
										)}
										<span className="font-semibold text-base-content">
											{teacher.pricePerHour}€/h
										</span>
									</div>
								</div>
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
};

export default TeacherSelect;
