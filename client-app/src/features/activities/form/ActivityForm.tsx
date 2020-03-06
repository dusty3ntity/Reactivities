import React, { useState, useContext, useEffect } from "react";
import { Segment, Form, Button, Grid } from "semantic-ui-react";
import { ActivityFormValues } from "../../../app/models/activity";
import { v4 as uuid } from "uuid";
import ActivityStore from "../../../app/stores/activityStore";
import { observer } from "mobx-react-lite";
import { RouteComponentProps } from "react-router-dom";
import { Form as FinalForm, Field } from "react-final-form";
import { TextInput } from "../../../app/common/form/TextInput";
import { TextAreaInput } from "../../../app/common/form/TextAreaInput";
import { SelectInput } from "../../../app/common/form/SelectInput";
import { category } from "../../../app/common/options/CategoryOptions";
import { DateInput } from "../../../app/common/form/DateInput";
import { combineDateAndTime } from "../../../app/common/util/util";

interface DetailParams {
	id: string;
}

const ActivityForm: React.FC<RouteComponentProps<DetailParams>> = ({ match, history }) => {
	const activityStore = useContext(ActivityStore);
	const { createActivity, editActivity, submitting, loadActivity } = activityStore;

	const handleFinalFormSubmit = (values: any) => {
		const dateAndTime = combineDateAndTime(values.date, values.time);
		const { date, time, ...activity } = values;
		activity.date = dateAndTime;

		if (!activity.id) {
			let newActivity = {
				...activity,
				id: uuid()
			};
			createActivity(newActivity);
		} else {
			editActivity(activity);
		}
	};

	const [activity, setActivity] = useState(new ActivityFormValues());
	const [loading, setLoading] = useState(false);

	useEffect(() => {
		if (match.params.id) {
			setLoading(true);
			loadActivity(match.params.id)
				.then(activity => setActivity(new ActivityFormValues(activity)))
				.finally(() => setLoading(false));
		}
	}, [loadActivity, match.params.id]);

	return (
		<Grid>
			<Grid.Column width={10}>
				<Segment clearing>
					<FinalForm
						initialValues={activity}
						onSubmit={handleFinalFormSubmit}
						render={({ handleSubmit }) => (
							<Form onSubmit={handleSubmit} loading={loading}>
								<Field name="title" placeholder="Title" value={activity.title} component={TextInput} />
								<Field
									rows={3}
									name="description"
									placeholder="Description"
									value={activity.description}
									component={TextAreaInput}
								/>
								<Field
									name="category"
									placeholder="Category"
									options={category}
									value={activity.category}
									component={SelectInput}
								/>
								<Form.Group widths="equal">
									<Field
										name="date"
										placeholder="Date"
										value={activity.date}
										date={true}
										component={DateInput}
									/>
									<Field
										name="time"
										placeholder="Time"
										value={activity.time}
										time={true}
										component={DateInput}
									/>
								</Form.Group>
								<Field name="city" placeholder="City" value={activity.city} component={TextInput} />
								<Field name="venue" placeholder="Venue" value={activity.venue} component={TextInput} />
								<Button
									disabled={loading}
									loading={submitting}
									floated="right"
									positive
									type="submit"
									content="Submit"
								/>
								<Button
									disabled={loading}
									onClick={() => history.push(`/activities` + (activity.id ? "/" + activity.id : "/"))}
									floated="right"
									type="button"
									content="Cancel"
								/>
							</Form>
						)}
					/>
				</Segment>
			</Grid.Column>
		</Grid>
	);
};

export default observer(ActivityForm);
