export default function SettingsPage() {
	return (
		<div className="flex flex-col gap-6 max-w-lg">
			<div>
				<h1 className="text-2xl font-bold">Settings</h1>
				<p className="text-base-content/60 text-sm mt-1">
					Platform configuration and preferences.
				</p>
			</div>

			<div role="alert" className="alert alert-info text-sm">
				<i className="fa-solid fa-circle-info shrink-0"></i>
				<span>
					Platform settings are managed via environment variables. Contact your system
					administrator to update Stripe keys, email credentials, or database configuration.
				</span>
			</div>

			<div className="card bg-base-200 shadow">
				<div className="card-body gap-4">
					<h2 className="font-semibold text-sm text-base-content/60 uppercase tracking-wide">
						Environment
					</h2>
					<div className="flex flex-col gap-3 text-sm">
						<div className="flex justify-between items-center">
							<span className="text-base-content/70">Stripe Integration</span>
							<span className="badge badge-success badge-sm">Active</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-base-content/70">Database</span>
							<span className="badge badge-success badge-sm">Connected</span>
						</div>
						<div className="flex justify-between items-center">
							<span className="text-base-content/70">Authentication</span>
							<span className="badge badge-success badge-sm">Active</span>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
