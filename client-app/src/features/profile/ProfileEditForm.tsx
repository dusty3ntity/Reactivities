import React from "react";
import { IProfile } from "../../app/models/profile";
import { Form as FinalForm, Field } from "react-final-form";
import { combineValidators, isRequired } from "revalidate";
import { Form, Button } from "semantic-ui-react";
import { TextInput } from "../../app/common/form/TextInput";
import { TextAreaInput } from "../../app/common/form/TextAreaInput";

const validate = combineValidators({
	displayName: isRequired("displayName")
});

interface IProps {
	profile: IProfile;
	updateProfile: (profile: IProfile) => void;
}

export const ProfileEditForm: React.FC<IProps> = ({ profile, updateProfile }) => {
	return (
		<FinalForm
			onSubmit={updateProfile}
			validate={validate}
			initialValues={profile!}
			render={({ handleSubmit, invalid, pristine, submitting }) => (
				<Form onSubmit={handleSubmit} error>
					<Field
						name="displayName"
						component={TextInput}
						placeholder="Display Name"
						value={profile!.displayName}
					/>
					<Field name="bio" component={TextAreaInput} rows={3} placeholder="Bio" value={profile!.bio} />
					<Button
						loading={submitting}
						floated="right"
						disabled={invalid || pristine}
						positive
						content="Update profile"
					/>
				</Form>
			)}
		/>
	);
};
