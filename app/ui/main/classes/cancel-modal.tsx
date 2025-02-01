export default function CancelModal() {
	return (
		<dialog id="cancel-modal" className="modal">
			<div className="modal-box">
				<h3 className="font-bold text-lg">
					Do you wish to cancel this class!
				</h3>
				<p className="py-4">
					Press ESC key or click the button below to close
				</p>
				<div className="modal-action">
					<form method="dialog">
						{/* if there is a button in form, it will close the modal */}
						<button className="btn-error">Confirm</button>
						<button className="btn-neutral">Close</button>
					</form>
				</div>
			</div>
		</dialog>
	);
}
