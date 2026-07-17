"use client";

import { Pie } from "react-chartjs-2";
import {
	Chart as ChartJS,
	ArcElement,
	CategoryScale,
	Title,
	Tooltip,
	Legend,
} from "chart.js";
import { useEffect, useState } from "react";

// Register the necessary chart components
ChartJS.register(ArcElement, CategoryScale, Title, Tooltip, Legend);

interface Class {
	subjectName: string;
}

export default function ClassSubjectChart(props: { classes: Class[] }) {
	const classes = props.classes;

	console.log(classes);

	const [chartData, setChartData] = useState<{
		labels: string[];
		datasets: { data: number[]; backgroundColor: string[] }[];
	} | null>(null);

	useEffect(() => {
		const subjectCount: { [key: string]: number } = {};

		// Count how many classes there are for each subject
		classes.forEach((cls) => {
			subjectCount[cls.subjectName] =
				(subjectCount[cls.subjectName] || 0) + 1;
		});

		// Prepare the data for the pie chart
		const data = {
			labels: Object.keys(subjectCount),
			datasets: [
				{
					data: Object.values(subjectCount),
					backgroundColor: [
						"#FF6384", // Red
						"#36A2EB", // Blue
						"#FFCE56", // Yellow
						"#4BC0C0", // Teal
						"#9966FF", // Purple
						"#FF9F40", // Orange
					],
				},
			],
		};

		setChartData(data);
	}, [classes]);

	return (
		<div className="bg-base-100 p-4 rounded-lg shadow-md">
			<h2 className="text-lg font-semibold mb-2">Classes per Subject</h2>
			{chartData ? (
				<Pie data={chartData} />
			) : (
				<div className="text-center text-base-content/50">
					No scheduled classes available
				</div>
			)}
		</div>
	);
}
