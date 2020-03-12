import React, { useContext } from "react";
import { Form as FinalForm, Field } from "react-final-form";
import { TextInput } from "../../app/common/form/TextInput";
import { Form, Button, Header, Divider } from "semantic-ui-react";
import { RootStoreContext } from "../../app/stores/rootStore";
import { IUserFormValues } from "../../app/models/user";
import { FORM_ERROR } from "final-form";
import { combineValidators, isRequired } from "revalidate";
import { ErrorMessage } from "../../app/common/form/ErrorMessage";
import SocialLogin from "./SocialLogin";
import { observer } from "mobx-react-lite";

const validate = combineValidators({
	email: isRequired("email"),
	password: isRequired("password")
});

const LoginForm = () => {
	const rootStore = useContext(RootStoreContext);
	const { login, fbLogin, loading } = rootStore.userStore;

	return (
		<FinalForm
			onSubmit={(values: IUserFormValues) =>
				login(values).catch(err => ({
					[FORM_ERROR]: err
				}))
			}
			validate={validate}
			render={({ handleSubmit, submitting, submitError, invalid, pristine, dirtySinceLastSubmit }) => (
				<Form onSubmit={handleSubmit} error>
					<Header as="h2" content="Login to Reactivities" color="teal" textAlign="center" />
					<Field name="email" component={TextInput} placeholder="Email" />
					<Field name="password" component={TextInput} type="password" placeholder="Password" />
					{submitError && !dirtySinceLastSubmit && (
						<ErrorMessage error={submitError} text="Invalid email or password" />
					)}
					<Button
						fluid
						disabled={(invalid && !dirtySinceLastSubmit) || pristine}
						color="teal"
						content="Log in"
						loading={submitting}
					/>
					<Divider horizontal>Or</Divider>
					<SocialLogin fbCallback={fbLogin} loading={loading} />
				</Form>
			)}
		/>
	);
};

export default observer(LoginForm);
