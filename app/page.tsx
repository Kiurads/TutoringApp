import Link from "next/link";
import prisma from "@/prisma";

/* ─────────────────────────────────────────────────────────────────────────────
   HOME PAGE
   ───────────────────────────────────────────────────────────────────────────── */

export default async function Home() {
	// Fetch real reviews that have a text body, most recent first
	const rawReviews = await prisma.teacherRating.findMany({
		where: { review: { not: null } },
		orderBy: { createdAt: "desc" },
		take: 12,
		include: {
			student: { select: { firstName: true, lastName: true } },
			teacher: { select: { firstName: true, lastName: true } },
		},
	});

	const reviews = rawReviews.map((r) => ({
		text:        r.review as string,
		teacherName: `${r.teacher.firstName} ${r.teacher.lastName}`,
		rating:      r.rating.toNumber(),
	}));

	return (
		<main className="min-h-screen flex flex-col">
			<HeroSection />
			<HowItWorks />
			<ForStudents />
			<SubjectsSection />
			<ForTeachers />
			<GamificationSection />
			{reviews.length > 0 && <TestimonialsSection reviews={reviews} />}
			<FinalCTA />
		</main>
	);
}

/* ── Hero ───────────────────────────────────────────────────────────────────── */

function HeroSection() {
	return (
		<section className="relative overflow-hidden bg-base-100">
			{/* Background blobs */}
			<div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-3xl" />

			<div className="relative mx-auto max-w-screen-xl px-6 py-28 lg:py-36 flex flex-col items-center text-center gap-8">
				{/* Pill badge */}
				<span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
					<i className="fa-solid fa-bolt text-xs" />
					Personalized tutoring, on your schedule
				</span>

				{/* Headline */}
				<h1 className="max-w-4xl text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
					Learn faster with{" "}
					<span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent bg-300% animate-gradient">
						expert tutors
					</span>{" "}
					built for you
				</h1>

				{/* Subtext */}
				<p className="max-w-2xl text-lg text-base-content/60 leading-relaxed">
					The Learning Nexus connects students with passionate teachers across dozens of subjects.
					Book a session, track your progress, and unlock rewards as you grow.
				</p>

				{/* CTAs */}
				<div className="flex flex-wrap justify-center gap-4 mt-2">
					<Link href="/register/student" className="btn btn-primary btn-lg gap-2 shadow-lg">
						<i className="fa-solid fa-graduation-cap" />
						Start Learning — it&apos;s free
					</Link>
					<Link href="/register/teacher" className="btn btn-outline btn-lg gap-2">
						<i className="fa-solid fa-chalkboard-user" />
						Become a Tutor
					</Link>
				</div>

				{/* Floating trust chips */}
				<div className="flex flex-wrap justify-center gap-3 mt-4">
					{[
						{ icon: "fa-shield-halved", text: "Secure payments" },
						{ icon: "fa-star",          text: "Verified tutors" },
						{ icon: "fa-clock",         text: "Flexible scheduling" },
						{ icon: "fa-lock",          text: "No hidden fees" },
					].map(({ icon, text }) => (
						<span key={text} className="flex items-center gap-1.5 text-sm text-base-content/50">
							<i className={`fa-solid ${icon} text-primary text-xs`} />
							{text}
						</span>
					))}
				</div>
			</div>
		</section>
	);
}

/* ── How it works ───────────────────────────────────────────────────────────── */

function HowItWorks() {
	const steps = [
		{
			n: "1",
			icon: "fa-user-pen",
			title: "Create your profile",
			desc: "Sign up in seconds, set your learning goals, and tell us which subjects you need help with.",
		},
		{
			n: "2",
			icon: "fa-magnifying-glass",
			title: "Find your tutor",
			desc: "Browse verified tutors by subject, availability, and price. See their ratings and pick the right fit.",
		},
		{
			n: "3",
			icon: "fa-calendar-check",
			title: "Book & Learn",
			desc: "Pick a time that works for you, pay securely, and show up ready to learn. It's that simple.",
		},
	];

	return (
		<section className="bg-base-100">
			<div className="mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<SectionLabel text="Simple process" />
				<h2 className="mt-3 text-center text-4xl font-bold">
					Up and running in <span className="text-primary">3 steps</span>
				</h2>
				<p className="mt-4 text-center text-base-content/55 max-w-xl mx-auto">
					No lengthy onboarding. No confusion. Just find a tutor and start learning.
				</p>

				<div className="mt-14 grid gap-8 sm:grid-cols-3 relative">
					{/* Connector line — desktop only */}
					<div className="hidden sm:block absolute top-10 left-[calc(16.6%+2rem)] right-[calc(16.6%+2rem)] h-0.5 bg-gradient-to-r from-primary/30 via-accent/30 to-secondary/30" />

					{steps.map(({ n, icon, title, desc }) => (
						<div key={n} className="flex flex-col items-center text-center gap-4 relative">
							<div className="relative z-10 flex items-center justify-center w-20 h-20 rounded-2xl bg-primary/10 border border-primary/20 shadow-sm">
								<i className={`fa-solid ${icon} text-primary text-2xl`} />
								<span className="absolute -top-2 -right-2 flex items-center justify-center w-6 h-6 rounded-full bg-primary text-primary-content text-xs font-bold">{n}</span>
							</div>
							<h3 className="text-lg font-bold">{title}</h3>
							<p className="text-sm text-base-content/55 leading-relaxed">{desc}</p>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ── For Students ───────────────────────────────────────────────────────────── */

function ForStudents() {
	const features = [
		{ icon: "fa-sliders",          title: "Smart matching",          desc: "Tell us your style and goals — we surface the tutors most likely to click with you." },
		{ icon: "fa-calendar-days",    title: "Flexible booking",         desc: "Request on-demand sessions or plan ahead. Reschedule with ease if life gets in the way." },
		{ icon: "fa-credit-card",      title: "Secure payments",          desc: "Card payments are held safely until your session is confirmed, with fair cancellation refunds." },
		{ icon: "fa-chart-line",       title: "Track your progress",      desc: "See every session, subject, and rating in one dashboard. Watch yourself improve over time." },
		{ icon: "fa-gem",              title: "Earn rewards",             desc: "Collect gems for every class and review. Spend them on boosts and exclusive profile frames." },
		{ icon: "fa-comment-dots",     title: "Leave honest reviews",     desc: "Rate your tutor after each session and help the community find the best teachers." },
	];

	return (
		<section className="bg-base-200">
			<div className="mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<div className="grid gap-16 lg:grid-cols-2 lg:items-center">

					{/* Left copy */}
					<div className="flex flex-col gap-6">
						<SectionLabel text="For students" color="primary" />
						<h2 className="text-4xl font-bold leading-tight">
							Everything you need to <span className="text-primary">master any subject</span>
						</h2>
						<p className="text-base-content/60 leading-relaxed">
							Whether you&apos;re cramming for an exam, filling in gaps, or exploring something new —
							The Learning Nexus gives you the tools and the right people to get there.
						</p>
						<Link href="/register/student" className="btn btn-primary self-start gap-2">
							<i className="fa-solid fa-user-plus" />
							Join as a student
						</Link>
					</div>

					{/* Right grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
						{features.map(({ icon, title, desc }) => (
							<div key={title} className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow">
								<div className="card-body py-4 px-5 gap-2">
									<div className="flex items-center gap-3">
										<span className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
											<i className={`fa-solid ${icon} text-primary text-sm`} />
										</span>
										<h3 className="font-semibold text-sm">{title}</h3>
									</div>
									<p className="text-xs text-base-content/55 leading-relaxed">{desc}</p>
								</div>
							</div>
						))}
					</div>
				</div>
			</div>
		</section>
	);
}

/* ── Subjects ───────────────────────────────────────────────────────────────── */

function SubjectsSection() {
	const subjects = [
		{ icon: "fa-square-root-variable", label: "Mathematics",  color: "text-blue-500",   bg: "bg-blue-500/10"   },
		{ icon: "fa-atom",                 label: "Physics",       color: "text-purple-500", bg: "bg-purple-500/10" },
		{ icon: "fa-flask",                label: "Chemistry",     color: "text-green-500",  bg: "bg-green-500/10"  },
		{ icon: "fa-dna",                  label: "Biology",       color: "text-emerald-500",bg: "bg-emerald-500/10"},
		{ icon: "fa-laptop-code",          label: "Programming",   color: "text-cyan-500",   bg: "bg-cyan-500/10"   },
		{ icon: "fa-language",             label: "Languages",     color: "text-orange-500", bg: "bg-orange-500/10" },
		{ icon: "fa-landmark",             label: "History",       color: "text-amber-500",  bg: "bg-amber-500/10"  },
		{ icon: "fa-music",                label: "Music",         color: "text-pink-500",   bg: "bg-pink-500/10"   },
		{ icon: "fa-palette",              label: "Art & Design",  color: "text-rose-500",   bg: "bg-rose-500/10"   },
		{ icon: "fa-chart-bar",            label: "Economics",     color: "text-indigo-500", bg: "bg-indigo-500/10" },
		{ icon: "fa-book",                 label: "Literature",    color: "text-yellow-600", bg: "bg-yellow-500/10" },
		{ icon: "fa-plus",                 label: "& many more",   color: "text-base-content/40", bg: "bg-base-300" },
	];

	return (
		<section className="bg-base-100">
			<div className="mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<SectionLabel text="Browse subjects" />
				<h2 className="mt-3 text-center text-4xl font-bold">
					Tutors for <span className="text-primary">every subject</span>
				</h2>
				<p className="mt-4 text-center text-base-content/55 max-w-xl mx-auto">
					From school essentials to university-level courses, our tutors cover it all.
				</p>

				<div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
					{subjects.map(({ icon, label, color, bg }) => (
						<div
							key={label}
							className="flex flex-col items-center gap-3 p-4 rounded-2xl border border-base-300 bg-base-100 hover:shadow-md hover:-translate-y-0.5 transition-all cursor-default"
						>
							<span className={`flex items-center justify-center w-11 h-11 rounded-xl ${bg}`}>
								<i className={`fa-solid ${icon} ${color} text-lg`} />
							</span>
							<span className="text-xs font-semibold text-center leading-tight">{label}</span>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ── For Teachers ───────────────────────────────────────────────────────────── */

function ForTeachers() {
	const perks = [
		{ icon: "fa-money-bill-trend-up", title: "Set your own rates",    desc: "Charge what your expertise is worth. No platform caps on your earnings." },
		{ icon: "fa-clock",               title: "Own your schedule",      desc: "Publish weekly availability and only receive requests that fit your calendar." },
		{ icon: "fa-shield-halved",       title: "Guaranteed payment",     desc: "Payments are pre-authorised at booking. You get paid when you show up." },
		{ icon: "fa-ranking-star",        title: "Build your reputation",  desc: "Earn Sparks and climb the Mentor Milestones ranking as you teach." },
		{ icon: "fa-users",               title: "Grow your student base", desc: "Get discovered through our subject search and priority matching system." },
		{ icon: "fa-chart-pie",           title: "Earnings dashboard",     desc: "Track your revenue, completed classes, and student retention over time." },
	];

	return (
		<section className="bg-base-200">
			<div className="mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<div className="grid gap-16 lg:grid-cols-2 lg:items-center">

					{/* Left grid */}
					<div className="grid grid-cols-1 sm:grid-cols-2 gap-4 order-2 lg:order-1">
						{perks.map(({ icon, title, desc }) => (
							<div key={title} className="card bg-base-100 shadow-sm border border-base-300 hover:shadow-md transition-shadow">
								<div className="card-body py-4 px-5 gap-2">
									<div className="flex items-center gap-3">
										<span className="flex items-center justify-center w-9 h-9 rounded-xl bg-secondary/10">
											<i className={`fa-solid ${icon} text-secondary text-sm`} />
										</span>
										<h3 className="font-semibold text-sm">{title}</h3>
									</div>
									<p className="text-xs text-base-content/55 leading-relaxed">{desc}</p>
								</div>
							</div>
						))}
					</div>

					{/* Right copy */}
					<div className="flex flex-col gap-6 order-1 lg:order-2">
						<SectionLabel text="For teachers" color="secondary" />
						<h2 className="text-4xl font-bold leading-tight">
							Turn your knowledge into a <span className="text-secondary">sustainable income</span>
						</h2>
						<p className="text-base-content/60 leading-relaxed">
							Join a growing network of passionate educators. Set your price, choose your hours,
							and focus on what you love — teaching. We handle the rest.
						</p>
						<Link href="/register/teacher" className="btn btn-secondary self-start gap-2">
							<i className="fa-solid fa-chalkboard-user" />
							Start teaching today
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ── Gamification ───────────────────────────────────────────────────────────── */

function GamificationSection() {
	const items = [
		{
			icon: "fa-gem",
			color: "text-cyan-400",
			bg: "bg-cyan-400/10",
			title: "Insight Gems",
			desc: "Earn gems for every class you complete, payment you make, or review you leave. The more you engage, the more you earn.",
		},
		{
			icon: "fa-trophy",
			color: "text-amber-400",
			bg: "bg-amber-400/10",
			title: "Tier Progression",
			desc: "Climb from Newcomer to Legend as you accumulate gems. Each tier unlocks new perks and shows off your dedication.",
		},
		{
			icon: "fa-medal",
			color: "text-rose-400",
			bg: "bg-rose-400/10",
			title: "Achievement Badges",
			desc: "Unlock special badges for milestones — first class, perfect attendance, 10-session streaks, and more.",
		},
		{
			icon: "fa-store",
			color: "text-purple-400",
			bg: "bg-purple-400/10",
			title: "Gem Store",
			desc: "Spend gems on Profile Frames that set you apart, Study Boosts for class discounts, or Priority Match for faster pairing.",
		},
	];

	return (
		<section className="bg-base-100 relative overflow-hidden">
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

			<div className="relative mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<SectionLabel text="Rewards & Gamification" />
				<h2 className="mt-3 text-center text-4xl font-bold">
					Learning that <span className="text-primary">rewards you</span>
				</h2>
				<p className="mt-4 text-center text-base-content/55 max-w-xl mx-auto">
					The Learning Nexus is the only tutoring platform with a built-in rewards system that makes
					every session feel like progress — inside and outside the classroom.
				</p>

				<div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
					{items.map(({ icon, color, bg, title, desc }) => (
						<div key={title} className="card bg-base-200 border border-base-300 shadow-sm hover:shadow-lg transition-all hover:-translate-y-1">
							<div className="card-body gap-4">
								<span className={`flex items-center justify-center w-12 h-12 rounded-2xl ${bg}`}>
									<i className={`fa-solid ${icon} ${color} text-xl`} />
								</span>
								<h3 className="font-bold">{title}</h3>
								<p className="text-sm text-base-content/55 leading-relaxed">{desc}</p>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ── Testimonials ───────────────────────────────────────────────────────────── */

type ReviewItem = {
	text: string;
	teacherName: string;
	rating: number;
};

function TestimonialsSection({ reviews }: { reviews: ReviewItem[] }) {
	return (
		<section className="bg-base-200">
			<div className="mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<SectionLabel text="Student reviews" />
				<h2 className="mt-3 text-center text-4xl font-bold">
					Trusted by students <span className="text-accent">&amp; teachers</span>
				</h2>

				<div className="mt-12 columns-1 gap-5 sm:columns-2 lg:columns-3">
					{reviews.map((r, i) => (
						<div key={i} className="card bg-base-100 border border-base-300 shadow-sm mb-5 break-inside-avoid hover:shadow-md transition-shadow">
							<div className="card-body gap-3">
								{/* Stars */}
								<div className="flex gap-0.5">
									{Array.from({ length: r.rating }).map((_, j) => (
										<i key={j} className="fa-solid fa-star text-amber-400 text-sm" />
									))}
								</div>
								<p className="text-sm text-base-content/80 leading-relaxed">&ldquo;{r.text}&rdquo;</p>
								<div className="flex items-center gap-3 mt-1">
									<div className="flex items-center justify-center w-8 h-8 rounded-full bg-base-300 text-base-content/40">
										<i className="fa-solid fa-user-secret text-sm" />
									</div>
									<div>
										<p className="text-sm font-semibold text-base-content/40">Anonymous student</p>
										<p className="text-xs text-base-content/50">Review for {r.teacherName}</p>
									</div>
								</div>
							</div>
						</div>
					))}
				</div>
			</div>
		</section>
	);
}

/* ── Final CTA ──────────────────────────────────────────────────────────────── */

function FinalCTA() {
	return (
		<section className="bg-base-100">
			<div className="mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<SectionLabel text="Get started" />
				<h2 className="mt-3 text-center text-4xl font-bold">
					Your next session is <span className="text-primary">one click away</span>
				</h2>
				<p className="mt-4 text-center text-base-content/55 max-w-xl mx-auto">
					Whether you&apos;re here to learn or to teach, joining takes under a minute.
				</p>

				<div className="mt-12 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
					{/* Student card */}
					<div className="card bg-primary text-primary-content shadow-lg hover:shadow-xl transition-shadow">
						<div className="card-body gap-5">
							<span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-content/15">
								<i className="fa-solid fa-graduation-cap text-primary-content text-xl" />
							</span>
							<div>
								<h3 className="text-xl font-bold">I want to learn</h3>
								<p className="mt-1 text-primary-content/70 text-sm leading-relaxed">
									Find the right tutor for your subject, book a session, and start making progress today.
								</p>
							</div>
							<Link href="/register/student" className="btn bg-primary-content text-primary hover:bg-primary-content/90 border-none gap-2 self-start mt-auto">
								<i className="fa-solid fa-user-plus" />
								Sign up as a student
							</Link>
						</div>
					</div>

					{/* Teacher card */}
					<div className="card bg-base-200 border border-base-300 shadow-sm hover:shadow-md transition-shadow">
						<div className="card-body gap-5">
							<span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-secondary/10">
								<i className="fa-solid fa-chalkboard-user text-secondary text-xl" />
							</span>
							<div>
								<h3 className="text-xl font-bold">I want to teach</h3>
								<p className="mt-1 text-base-content/55 text-sm leading-relaxed">
									Set your rates, publish your availability, and grow a steady student base on your own terms.
								</p>
							</div>
							<Link href="/register/teacher" className="btn btn-secondary gap-2 self-start mt-auto">
								<i className="fa-solid fa-chalkboard-user" />
								Sign up as a tutor
							</Link>
						</div>
					</div>
				</div>

				<p className="mt-8 text-center text-base-content/40 text-sm">
					Already have an account?{" "}
					<Link href="/login" className="underline hover:text-base-content/70 transition-colors">
						Sign in
					</Link>
				</p>
			</div>
		</section>
	);
}

/* ── Helper ─────────────────────────────────────────────────────────────────── */

function SectionLabel({ text, color = "primary" }: { text: string; color?: string }) {
	return (
		<p className={`text-center text-sm font-bold uppercase tracking-widest text-${color}`}>
			{text}
		</p>
	);
}
