export default function Loading() {
	return (
		<div className="flex-1 flex items-center justify-center" aria-busy="true" aria-label="Loading page content">
			<span className="loading loading-spinner loading-lg text-primary"></span>
		</div>
	);
}
