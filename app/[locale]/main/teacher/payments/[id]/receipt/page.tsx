import { auth } from "@/auth";
import { redirect, notFound } from "next/navigation";
import { fetchPaymentReceipt } from "@/app/lib/actions/paymets.actions";
import Receipt from "@/app/ui/main/payments/receipt";
import PrintButton from "@/app/ui/main/payments/print-button";
import Link from "next/link";

export default async function TeacherReceiptPage(props: {
	params: Promise<{ id: string }>;
}) {
	const { id } = await props.params;
	const session = await auth();
	if (!session?.user?.email) redirect("/login");

	const receipt = await fetchPaymentReceipt(id, session.user.email);
	if (!receipt) notFound();

	return (
		<div className="flex flex-col gap-4">
			<div className="flex items-center justify-between print:hidden">
				<Link href="/main/teacher/earnings" className="btn btn-ghost btn-sm">
					<i className="fa-solid fa-arrow-left" /> Back
				</Link>
				<PrintButton />
			</div>
			<Receipt receipt={receipt} />
		</div>
	);
}
