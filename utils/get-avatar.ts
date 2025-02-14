export default function getAvatar(email: string) {
	return `https://api.dicebear.com/9.x/fun-emoji/svg?&seed=${email}`;
}
