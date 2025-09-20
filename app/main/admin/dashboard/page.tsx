export default function AdminDashboard() {
	return (
		<div>
			<h1 className="text-2xl font-bold mb-6">Dashboard Overview</h1>

			{/* Stat Cards */}
			<div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mb-8">
				<div className="stat shadow rounded-box bg-base-200">
					<div className="stat-title">Students</div>
					<div className="stat-value">123</div>
				</div>
				<div className="stat shadow rounded-box bg-base-200">
					<div className="stat-title">Teachers</div>
					<div className="stat-value">45</div>
				</div>
				<div className="stat shadow rounded-box bg-base-200">
					<div className="stat-title">Classes</div>
					<div className="stat-value">210</div>
				</div>
				<div className="stat shadow rounded-box bg-base-200">
					<div className="stat-title">Revenue</div>
					<div className="stat-value">€12,340</div>
				</div>
			</div>

			{/* Recent Classes Table */}
			<div className="card bg-base-200 shadow">
				<div className="card-body">
					<h2 className="card-title">Recent Classes</h2>
					<div className="overflow-x-auto">
						<table className="table">
							<thead>
								<tr>
									<th>Student</th>
									<th>Teacher</th>
									<th>Subject</th>
									<th>Status</th>
									<th>Date</th>
								</tr>
							</thead>
							<tbody>
								<tr>
									<td>Ana</td>
									<td>Mr. Silva</td>
									<td>Math</td>
									<td>
										<span className="badge badge-success">
											Completed
										</span>
									</td>
									<td>2025-09-01</td>
								</tr>
								<tr>
									<td>João</td>
									<td>Ms. Costa</td>
									<td>English</td>
									<td>
										<span className="badge badge-warning">
											Scheduled
										</span>
									</td>
									<td>2025-09-05</td>
								</tr>
							</tbody>
						</table>
					</div>
				</div>
			</div>
		</div>
	);
}
