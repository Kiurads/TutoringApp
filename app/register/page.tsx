export default function SignIn() {
	return (
		<form>
			<label>
				Email
				<input name="email" type="email" />
			</label>
			<label>
				Password
				<input name="password" type="password" />
			</label>
			<button>Sign In</button>
		</form>
	);
}
