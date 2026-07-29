// Generic page-content skeleton shown by loading.tsx while a server-fetched
// page's data is still loading. Sits inside the sidebar layout's existing
// `p-6` content wrapper, so it needs no padding/margin of its own.
export default function PageSkeleton() {
	return (
		<div className="flex flex-col gap-6" aria-busy="true" aria-label="Loading page content">
			<div className="skeleton h-8 w-48"></div>
			<div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
				<div className="skeleton h-24 w-full"></div>
				<div className="skeleton h-24 w-full"></div>
				<div className="skeleton h-24 w-full"></div>
			</div>
			<div className="skeleton h-64 w-full"></div>
		</div>
	);
}
