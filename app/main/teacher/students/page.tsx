import { fetchStudentsByTeacher } from "@/app/lib/actions/students.actions";
import { auth } from "@/auth";
import getAvatar from "@/utils/get-avatar";
import { log } from "console";
import Image from "next/image";

export default async function TeacherStudentsPage() {
	const session = await auth();

	if (!session || !session.user || !session.user.email) {
		return <div>Loading...</div>;
	}

	const students = await fetchStudentsByTeacher();

	log(students);

	return (
		<div className="w-full px-4 sm:px-8 lg:px-12 py-4">
			<div className="mb-6">
				<h1 className="text-3xl font-bold">My Students</h1>
				<p className="text-base-content/70">
					Students who have taken or scheduled classes with you
				</p>
			</div>

			{students.length === 0 ? (
				<div className="text-center py-12">
					<div className="text-6xl mb-4">
						<i className="fa-solid fa-user-graduate text-base-content/20"></i>
					</div>
					<p className="text-xl text-base-content/70">
						No students yet
					</p>
					<p className="text-base-content/50">
						Students will appear here once they book classes with
						you
					</p>
				</div>
			) : (
				<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
					{students.map((student) => (
						<div
							key={student.id}
							className="card bg-base-200 shadow-lg hover:shadow-xl transition-all"
						>
							<div className="card-body">
								<div className="flex items-center gap-4">
									{student.email ? (
										<div className="avatar">
											<div className="w-16 rounded-full">
												<Image
													src={getAvatar(
														student.email,
													)}
													alt={`${student.firstName} ${student.lastName}`}
													width={64}
													height={64}
												/>
											</div>
										</div>
									) : (
										<div className="avatar placeholder">
											<div className="bg-neutral text-neutral-content rounded-full w-16">
												<span className="text-xl">
													{student.firstName.charAt(
														0,
													)}
													{student.lastName.charAt(0)}
												</span>
											</div>
										</div>
									)}
									<div className="flex-1">
										<h3 className="card-title text-lg">
											{student.firstName}{" "}
											{student.lastName}
										</h3>
										<p className="text-sm text-base-content/70">
											{student.email}
										</p>
										{student.phoneNumber && (
											<p className="text-sm text-base-content/70">
												<i className="fa-solid fa-phone mr-2"></i>
												{student.phoneNumber}
											</p>
										)}
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			)}
		</div>
	);
}
