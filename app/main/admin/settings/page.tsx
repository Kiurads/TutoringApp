export default function SettingsPage() {
	return (
		<div className="max-w-lg">
			<h1 className="text-2xl font-bold mb-6">Settings</h1>

			<form className="space-y-4 bg-base-200 p-6 rounded-lg shadow">
				<div className="form-control">
					<label className="label font-semibold">Contact Email</label>
					<input
						type="email"
						defaultValue="admin@school.com"
						className="input input-bordered"
					/>
				</div>

				<div className="form-control">
					<label className="label font-semibold">Support Phone</label>
					<input
						type="text"
						defaultValue="+351 900 000 000"
						className="input input-bordered"
					/>
				</div>

				<button type="submit" className="btn btn-primary w-full">
					Save Settings
				</button>
			</form>
		</div>
	);
}
