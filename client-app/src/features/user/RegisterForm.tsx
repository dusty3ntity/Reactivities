import React, { useContext } from "react";
import { Form as FinalForm, Field } from "react-final-form";
import { TextInput } from "../../app/common/form/TextInput";
import { Form, Button, Header } from "semantic-ui-react";
import { RootStoreContext } from "../../app/stores/rootStore";
import { IUserFormValues } from "../../app/models/user";
import { FORM_ERROR } from "final-form";
import { combineValidators, isRequired } from "revalidate";
import { ErrorMessage } from "../../app/common/form/ErrorMessage";

const validate = combineValidators({
	username: isRequired("username"),
	displayName: isRequired("displayname"),
	email: isRequired("email"),
	password: isRequired("password")
});

const RegisterForm = () => {
	const rootStore = useContext(RootStoreContext);
	const { register } = rootStore.userStore;

	return (
		<FinalForm
			onSubmit={(values: IUserFormValues) =>
				register(values).catch(err => ({
					[FORM_ERROR]: err
				}))
			}
			validate={validate}
			render={({ handleSubmit, submitting, submitError, invalid, pristine, dirtySinceLastSubmit }) => (
				<Form onSubmit={handleSubmit} error>
					<Header as="h2" content="Sign up to Reactivities" color="teal" textAlign="center" />
					<Field name="username" component={TextInput} placeholder="Username" />
					<Field name="displayName" component={TextInput} placeholder="Display name" />
					<Field name="email" component={TextInput} placeholder="Email" />
					<Field name="password" component={TextInput} type="password" placeholder="Password" />
					{submitError && !dirtySinceLastSubmit && (
						<ErrorMessage error={submitError} />
					)}
					<Button
						fluid
						disabled={(invalid && !dirtySinceLastSubmit) || pristine}
						color="teal"
						content="Register"
						loading={submitting}
					/>
				</Form>
			)}
		/>
	);
};

export default RegisterForm;
