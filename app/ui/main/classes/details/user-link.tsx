import Link from "next/link";
import React from "react";

interface UserLinkProps {
	id: string;
	name: string;
}

const UserLink: React.FC<UserLinkProps> = ({ id, name }) => {
	return (
		<Link
			href={`/main/users/${id}`}
			className="text-primary hover:text-primary-focus transition-colors"
		>
			{name}
		</Link>
	);
};

export default UserLink;
