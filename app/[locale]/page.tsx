import type { Metadata } from "next";
import Link from "next/link";
import { getTranslations } from "next-intl/server";
import prisma from "@/prisma";

/* ─────────────────────────────────────────────────────────────────────────────
   HOME PAGE
   ───────────────────────────────────────────────────────────────────────────── */

// No explicit `title` here — the root layout's `default` title (identical
// to this copy) applies automatically. A title *would* additionally run
// through the layout's `template` ("%s — Ponte"), double-appending the
// brand name, so the home page specifically must stay title-less rather
// than repeat itself.
export const metadata: Metadata = {
	description:
		"Ponte connects students with passionate teachers across dozens of subjects. Book a session, track your progress, and unlock rewards as you grow.",
};

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

	const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
	const structuredData = {
		"@context": "https://schema.org",
		"@type": "EducationalOrganization",
		name: "Ponte",
		url: baseUrl,
		description: "Book one-on-one tutoring sessions with expert teachers.",
	};

	return (
		<main className="min-h-screen flex flex-col">
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
			/>
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

async function HeroSection() {
	const t = await getTranslations("HomePage.hero");
	const trustChips = [
		{ icon: "fa-shield-halved", text: t("trust.securePayments") },
		{ icon: "fa-star",          text: t("trust.verifiedTutors") },
		{ icon: "fa-clock",         text: t("trust.flexibleScheduling") },
		{ icon: "fa-lock",          text: t("trust.noHiddenFees") },
	];

	return (
		<section className="relative overflow-hidden bg-base-100">
			{/* Background blobs */}
			<div className="pointer-events-none absolute -top-32 -left-32 w-[500px] h-[500px] rounded-full bg-primary/10 blur-3xl" />
			<div className="pointer-events-none absolute -bottom-32 -right-32 w-[500px] h-[500px] rounded-full bg-secondary/10 blur-3xl" />

			<div className="relative mx-auto max-w-screen-xl px-6 py-28 lg:py-36 flex flex-col items-center text-center gap-8">
				{/* Pill badge */}
				<span className="inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary">
					<i className="fa-solid fa-bolt text-xs" />
					{t("badge")}
				</span>

				{/* Headline */}
				<h1 className="max-w-4xl text-5xl font-extrabold leading-tight sm:text-6xl lg:text-7xl">
					{t.rich("headline", {
						highlight: (chunks) => (
							<span className="bg-gradient-to-r from-primary via-accent to-secondary bg-clip-text text-transparent bg-300% animate-gradient">
								{chunks}
							</span>
						),
					})}
				</h1>

				{/* Subtext */}
				<p className="max-w-2xl text-lg text-base-content/60 leading-relaxed">
					{t("subtext")}
				</p>

				{/* CTAs */}
				<div className="flex flex-wrap justify-center gap-4 mt-2">
					<Link href="/register/student" className="btn btn-primary btn-lg gap-2 shadow-lg">
						<i className="fa-solid fa-graduation-cap" />
						{t("ctaStudent")}
					</Link>
					<Link href="/register/teacher" className="btn btn-outline btn-lg gap-2">
						<i className="fa-solid fa-chalkboard-user" />
						{t("ctaTeacher")}
					</Link>
				</div>

				{/* Floating trust chips */}
				<div className="flex flex-wrap justify-center gap-3 mt-4">
					{trustChips.map(({ icon, text }) => (
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

async function HowItWorks() {
	const t = await getTranslations("HomePage.howItWorks");
	const steps = [
		{ n: "1", icon: "fa-user-pen",           title: t("steps.1.title"), desc: t("steps.1.desc") },
		{ n: "2", icon: "fa-magnifying-glass",   title: t("steps.2.title"), desc: t("steps.2.desc") },
		{ n: "3", icon: "fa-calendar-check",     title: t("steps.3.title"), desc: t("steps.3.desc") },
	];

	return (
		<section className="bg-base-100">
			<div className="mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<SectionLabel text={t("label")} />
				<h2 className="mt-3 text-center text-4xl font-bold">
					{t.rich("title", { highlight: (chunks) => <span className="text-primary">{chunks}</span> })}
				</h2>
				<p className="mt-4 text-center text-base-content/55 max-w-xl mx-auto">
					{t("subtitle")}
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

async function ForStudents() {
	const t = await getTranslations("HomePage.forStudents");
	const features = [
		{ icon: "fa-sliders",          title: t("features.smartMatching.title"),   desc: t("features.smartMatching.desc") },
		{ icon: "fa-calendar-days",    title: t("features.flexibleBooking.title"), desc: t("features.flexibleBooking.desc") },
		{ icon: "fa-credit-card",      title: t("features.securePayments.title"),  desc: t("features.securePayments.desc") },
		{ icon: "fa-chart-line",       title: t("features.trackProgress.title"),   desc: t("features.trackProgress.desc") },
		{ icon: "fa-gem",              title: t("features.earnRewards.title"),     desc: t("features.earnRewards.desc") },
		{ icon: "fa-comment-dots",     title: t("features.leaveReviews.title"),    desc: t("features.leaveReviews.desc") },
	];

	return (
		<section className="bg-base-200">
			<div className="mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<div className="grid gap-16 lg:grid-cols-2 lg:items-center">

					{/* Left copy */}
					<div className="flex flex-col gap-6">
						<SectionLabel text={t("label")} color="primary" />
						<h2 className="text-4xl font-bold leading-tight">
							{t.rich("title", { highlight: (chunks) => <span className="text-primary">{chunks}</span> })}
						</h2>
						<p className="text-base-content/60 leading-relaxed">
							{t("body")}
						</p>
						<Link href="/register/student" className="btn btn-primary self-start gap-2">
							<i className="fa-solid fa-user-plus" />
							{t("cta")}
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

async function SubjectsSection() {
	const t = await getTranslations("HomePage.subjects");
	const subjects = [
		{ icon: "fa-square-root-variable", label: t("mathematics"), color: "text-blue-500",   bg: "bg-blue-500/10"   },
		{ icon: "fa-atom",                 label: t("physics"),     color: "text-purple-500", bg: "bg-purple-500/10" },
		{ icon: "fa-flask",                label: t("chemistry"),   color: "text-green-500",  bg: "bg-green-500/10"  },
		{ icon: "fa-dna",                  label: t("biology"),     color: "text-emerald-500",bg: "bg-emerald-500/10"},
		{ icon: "fa-laptop-code",          label: t("programming"), color: "text-cyan-500",   bg: "bg-cyan-500/10"   },
		{ icon: "fa-language",             label: t("languages"),   color: "text-orange-500", bg: "bg-orange-500/10" },
		{ icon: "fa-landmark",             label: t("history"),     color: "text-amber-500",  bg: "bg-amber-500/10"  },
		{ icon: "fa-music",                label: t("music"),       color: "text-pink-500",   bg: "bg-pink-500/10"   },
		{ icon: "fa-palette",              label: t("artDesign"),   color: "text-rose-500",   bg: "bg-rose-500/10"   },
		{ icon: "fa-chart-bar",            label: t("economics"),   color: "text-indigo-500", bg: "bg-indigo-500/10" },
		{ icon: "fa-book",                 label: t("literature"),  color: "text-yellow-600", bg: "bg-yellow-500/10" },
		{ icon: "fa-plus",                 label: t("manyMore"),    color: "text-base-content/40", bg: "bg-base-300" },
	];

	return (
		<section className="bg-base-100">
			<div className="mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<SectionLabel text={t("label")} />
				<h2 className="mt-3 text-center text-4xl font-bold">
					{t.rich("title", { highlight: (chunks) => <span className="text-primary">{chunks}</span> })}
				</h2>
				<p className="mt-4 text-center text-base-content/55 max-w-xl mx-auto">
					{t("subtitle")}
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

async function ForTeachers() {
	const t = await getTranslations("HomePage.forTeachers");
	const perks = [
		{ icon: "fa-money-bill-trend-up", title: t("perks.setRates.title"),          desc: t("perks.setRates.desc") },
		{ icon: "fa-clock",               title: t("perks.ownSchedule.title"),       desc: t("perks.ownSchedule.desc") },
		{ icon: "fa-shield-halved",       title: t("perks.guaranteedPayment.title"), desc: t("perks.guaranteedPayment.desc") },
		{ icon: "fa-ranking-star",        title: t("perks.buildReputation.title"),   desc: t("perks.buildReputation.desc") },
		{ icon: "fa-users",               title: t("perks.growStudentBase.title"),   desc: t("perks.growStudentBase.desc") },
		{ icon: "fa-chart-pie",           title: t("perks.earningsDashboard.title"), desc: t("perks.earningsDashboard.desc") },
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
						<SectionLabel text={t("label")} color="secondary" />
						<h2 className="text-4xl font-bold leading-tight">
							{t.rich("title", { highlight: (chunks) => <span className="text-secondary">{chunks}</span> })}
						</h2>
						<p className="text-base-content/60 leading-relaxed">
							{t("body")}
						</p>
						<Link href="/register/teacher" className="btn btn-secondary self-start gap-2">
							<i className="fa-solid fa-chalkboard-user" />
							{t("cta")}
						</Link>
					</div>
				</div>
			</div>
		</section>
	);
}

/* ── Gamification ───────────────────────────────────────────────────────────── */

async function GamificationSection() {
	const t = await getTranslations("HomePage.gamification");
	const items = [
		{ icon: "fa-gem",    color: "text-cyan-400",   bg: "bg-cyan-400/10",   title: t("items.gems.title"),   desc: t("items.gems.desc") },
		{ icon: "fa-trophy", color: "text-amber-400",  bg: "bg-amber-400/10",  title: t("items.tiers.title"),  desc: t("items.tiers.desc") },
		{ icon: "fa-medal",  color: "text-rose-400",   bg: "bg-rose-400/10",   title: t("items.badges.title"), desc: t("items.badges.desc") },
		{ icon: "fa-store",  color: "text-purple-400", bg: "bg-purple-400/10", title: t("items.store.title"),  desc: t("items.store.desc") },
	];

	return (
		<section className="bg-base-100 relative overflow-hidden">
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5" />

			<div className="relative mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<SectionLabel text={t("label")} />
				<h2 className="mt-3 text-center text-4xl font-bold">
					{t.rich("title", { highlight: (chunks) => <span className="text-primary">{chunks}</span> })}
				</h2>
				<p className="mt-4 text-center text-base-content/55 max-w-xl mx-auto">
					{t("subtitle")}
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

async function TestimonialsSection({ reviews }: { reviews: ReviewItem[] }) {
	const t = await getTranslations("HomePage.testimonials");

	return (
		<section className="bg-base-200">
			<div className="mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<SectionLabel text={t("label")} />
				<h2 className="mt-3 text-center text-4xl font-bold">
					{t.rich("title", { highlight: (chunks) => <span className="text-accent">{chunks}</span> })}
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
										<p className="text-sm font-semibold text-base-content/40">{t("anonymousStudent")}</p>
										<p className="text-xs text-base-content/50">{t("reviewFor", { name: r.teacherName })}</p>
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

async function FinalCTA() {
	const t = await getTranslations("HomePage.finalCta");

	return (
		<section className="bg-base-100">
			<div className="mx-auto max-w-screen-xl px-6 py-20 lg:py-28">
				<SectionLabel text={t("label")} />
				<h2 className="mt-3 text-center text-4xl font-bold">
					{t.rich("title", { highlight: (chunks) => <span className="text-primary">{chunks}</span> })}
				</h2>
				<p className="mt-4 text-center text-base-content/55 max-w-xl mx-auto">
					{t("subtitle")}
				</p>

				<div className="mt-12 grid gap-6 sm:grid-cols-2 max-w-3xl mx-auto">
					{/* Student card */}
					<div className="card bg-primary text-primary-content shadow-lg hover:shadow-xl transition-shadow">
						<div className="card-body gap-5">
							<span className="flex items-center justify-center w-12 h-12 rounded-2xl bg-primary-content/15">
								<i className="fa-solid fa-graduation-cap text-primary-content text-xl" />
							</span>
							<div>
								<h3 className="text-xl font-bold">{t("studentCard.title")}</h3>
								<p className="mt-1 text-primary-content/70 text-sm leading-relaxed">
									{t("studentCard.body")}
								</p>
							</div>
							<Link href="/register/student" className="btn bg-primary-content text-primary hover:bg-primary-content/90 border-none gap-2 self-start mt-auto">
								<i className="fa-solid fa-user-plus" />
								{t("studentCard.cta")}
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
								<h3 className="text-xl font-bold">{t("teacherCard.title")}</h3>
								<p className="mt-1 text-base-content/55 text-sm leading-relaxed">
									{t("teacherCard.body")}
								</p>
							</div>
							<Link href="/register/teacher" className="btn btn-secondary gap-2 self-start mt-auto">
								<i className="fa-solid fa-chalkboard-user" />
								{t("teacherCard.cta")}
							</Link>
						</div>
					</div>
				</div>

				<p className="mt-8 text-center text-base-content/40 text-sm">
					{t("alreadyHaveAccount")}{" "}
					<Link href="/login" className="underline hover:text-base-content/70 transition-colors">
						{t("signIn")}
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
