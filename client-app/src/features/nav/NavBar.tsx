import React from "react";
import { Menu, Container, Button } from "semantic-ui-react";

interface IProps {
	openCreateForm: () => void;
}

export const NavBar: React.FC<IProps> = ({ openCreateForm }) => {
	return (
		<Menu fixed="top" inverted>
			<Container>
				<Menu.Item>
					<img src="/assets/logo.png" alt="logo" />
					Reactivities
				</Menu.Item>
				<Menu.Item name="Activities" />
				<Menu.Item>
					<Button onClick={openCreateForm} positive content="Create Activity" />
				</Menu.Item>
			</Container>
		</Menu>
	);
};
