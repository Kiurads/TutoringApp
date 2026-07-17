"use client";

import {
	Chart as ChartJS,
	CategoryScale,
	LinearScale,
	BarElement,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";
import { useMemo } from "react";

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Payment {
	amount: number;
	date: Date | string;
}

function getLast12Months(): { label: string; key: string }[] {
	const months = [];
	const now = new Date();
	for (let i = 11; i >= 0; i--) {
		const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
		months.push({
			label: d.toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
			key: `${d.getFullYear()}-${d.getMonth()}`,
		});
	}
	return months;
}

export default function MonthlyEarningsChart({ payments }: { payments: Payment[] }) {
	const months = getLast12Months();

	const totals = useMemo(() => {
		const map: Record<string, number> = {};
		for (const p of payments) {
			const d = new Date(p.date);
			const key = `${d.getFullYear()}-${d.getMonth()}`;
			map[key] = (map[key] ?? 0) + p.amount;
		}
		return months.map((m) => map[m.key] ?? 0);
	}, [payments, months]);

	const hasData = totals.some((v) => v > 0);

	const data = {
		labels: months.map((m) => m.label),
		datasets: [
			{
				label: "Earnings (€)",
				data: totals,
				backgroundColor: "rgba(99, 102, 241, 0.7)",
				hoverBackgroundColor: "rgba(99, 102, 241, 1)",
				borderRadius: 6,
				borderSkipped: false,
			},
		],
	};

	const options = {
		responsive: true,
		maintainAspectRatio: false,
		animation: {
			duration: 800,
			easing: "easeInOutQuart" as const,
		},
		plugins: {
			legend: { display: false },
			tooltip: {
				callbacks: {
					label: (ctx: { parsed: { y: number } }) =>
						` ${ctx.parsed.y.toFixed(2)}€`,
				},
			},
		},
		scales: {
			x: {
				grid: { display: false },
				ticks: { color: "rgba(148, 163, 184, 0.8)", font: { size: 11 } },
				border: { display: false },
			},
			y: {
				grid: { color: "rgba(148, 163, 184, 0.15)" },
				ticks: {
					color: "rgba(148, 163, 184, 0.8)",
					font: { size: 11 },
					callback: (v: string | number) => `${v}€`,
				},
				border: { display: false },
				beginAtZero: true,
			},
		},
	};

	return (
		<div className="rounded-lg border border-base-300 bg-base-100">
			<div className="px-4 py-3 border-b border-base-300">
				<h2 className="text-lg font-semibold">Monthly Earnings</h2>
				<p className="text-xs text-base-content/50 mt-0.5">Last 12 months</p>
			</div>
			<div className="p-4">
				{!hasData ? (
					<p className="text-center py-10 text-base-content/50">
						No earnings data yet.
					</p>
				) : (
					<div className="h-40 sm:h-56">
						<Bar data={data} options={options} />
					</div>
				)}
			</div>
		</div>
	);
}
