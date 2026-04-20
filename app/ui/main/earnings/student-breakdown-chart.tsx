"use client";

import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import { Doughnut } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(ArcElement, Tooltip, Legend);

interface Payment {
	amount: number;
	studentName: string;
}

const COLORS = [
	"rgba(99, 102, 241, 0.9)",
	"rgba(139, 92, 246, 0.9)",
	"rgba(6, 182, 212, 0.9)",
	"rgba(16, 185, 129, 0.9)",
	"rgba(245, 158, 11, 0.9)",
	"rgba(239, 68, 68, 0.9)",
];

export default function StudentBreakdownChart({ payments }: { payments: Payment[] }) {
	const breakdown = useMemo(() => {
		const map: Record<string, number> = {};
		for (const p of payments) {
			map[p.studentName] = (map[p.studentName] ?? 0) + p.amount;
		}
		const entries = Object.entries(map).sort((a, b) => b[1] - a[1]);
		return { labels: entries.map(([n]) => n), values: entries.map(([, v]) => v) };
	}, [payments]);

	const data = {
		labels: breakdown.labels,
		datasets: [
			{
				data: breakdown.values,
				backgroundColor: COLORS.slice(0, breakdown.labels.length),
				hoverOffset: 8,
				borderWidth: 2,
				borderColor: "rgba(255,255,255,0.1)",
			},
		],
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		animation: {
			duration: 900,
			easing: "easeInOutQuart" as const,
			animateRotate: true,
			animateScale: true,
		},
		cutout: "65%",
		plugins: {
			legend: {
				position: "bottom" as const,
				labels: {
					color: "rgba(148, 163, 184, 0.9)",
					padding: 16,
					font: { size: 12 },
					usePointStyle: true,
					pointStyleWidth: 8,
				},
			},
			tooltip: {
				callbacks: {
					label: (ctx: { label: string; parsed: number }) =>
						` ${ctx.label}: ${ctx.parsed.toFixed(2)}€`,
				},
			},
		},
	};

	if (breakdown.labels.length === 0) {
		return null;
	}

	return (
		<div className="rounded-lg border border-base-300 bg-base-100">
			<div className="px-4 py-3 border-b border-base-300">
				<h2 className="text-lg font-semibold">Earnings by Student</h2>
				<p className="text-xs text-base-content/50 mt-0.5">All time breakdown</p>
			</div>
			<div className="p-4">
				<div className="h-48 sm:h-64">
					<Doughnut data={data} options={options} />
				</div>
			</div>
		</div>
	);
}
