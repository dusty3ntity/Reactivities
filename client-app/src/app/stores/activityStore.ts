import { observable, action, computed, runInAction } from "mobx";
import { SyntheticEvent } from "react";
import { IActivity } from "../models/activity";
import agent from "../api/agent";
import { history } from "../..";
import { toast } from "react-toastify";
import { RootStore } from "./rootStore";
import { setActivityProps } from "../common/util/util";
import { createAttendee } from "../common/util/util";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

export default class ActivityStore {
	rootStore: RootStore;

	constructor(rootStore: RootStore) {
		this.rootStore = rootStore;
	}

	@observable activityRegistry = new Map();
	@observable loadingInitial = false;
	@observable activity: IActivity | null = null;
	@observable submitting = false;
	@observable target = "";
	@observable loading = false;
	@observable.ref hubConnection: HubConnection | null = null;

	@action createHubConnection = () => {
		this.hubConnection = new HubConnectionBuilder()
			.withUrl("http://localhost:5000/chat", {
				accessTokenFactory: () => this.rootStore.commonStore.token!
			})
			.configureLogging(LogLevel.Information)
			.build();

		this.hubConnection
			.start()
			.then(() => {
				console.log(this.hubConnection!.start);
			})
			.catch(err => console.log("Error establishing connection: ", err));

		this.hubConnection.on("ReceiveComment", comment => {
			this.activity!.comments.push(comment);
		});
	};

	@action stopHubConnection = () => {
		this.hubConnection!.stop();
	};

	@action addComment = async (values: any) => {
		values.activityId = this.activity!.id;
		try {
			await this.hubConnection!.invoke("SendComment", values);
		} catch (err) {
			console.log(err);
		}
	};

	@computed get activitiesByDate() {
		return this.groupActivitiesByDate(Array.from(this.activityRegistry.values()));
	}

	groupActivitiesByDate(activities: IActivity[]) {
		const sortedActivities = activities.sort((a, b) => a.date.getTime() - b.date.getTime());
		return Object.entries(
			sortedActivities.reduce((activities, activity) => {
				const date = activity.date.toISOString().split("T")[0];
				activities[date] = activities[date] ? [...activities[date], activity] : [activity];
				return activities;
			}, {} as { [key: string]: IActivity[] })
		);
	}

	@action loadActivities = async () => {
		this.loadingInitial = true;
		try {
			const activities = await agent.Activities.list();
			runInAction("loading activities", () => {
				activities.forEach(activity => {
					setActivityProps(activity, this.rootStore.userStore.user!);
					this.activityRegistry.set(activity.id, activity);
				});
			});
		} catch (err) {
			console.log(err);
		} finally {
			runInAction("loading activities", () => {
				this.loadingInitial = false;
			});
		}
	};

	@action loadActivity = async (id: string) => {
		let activity = this.getActivity(id);
		if (activity) {
			this.activity = activity;
			return activity;
		} else {
			this.loadingInitial = true;
			try {
				activity = await agent.Activities.details(id);
				runInAction("getting activity", () => {
					setActivityProps(activity, this.rootStore.userStore.user!);
					this.activity = activity;
					this.activityRegistry.set(activity.id, activity);
				});
				return activity;
			} catch (err) {
				console.log(err);
			} finally {
				runInAction("getting activity", () => {
					this.loadingInitial = false;
				});
			}
		}
	};

	getActivity = (id: string) => {
		return this.activityRegistry.get(id);
	};

	@action createActivity = async (activity: IActivity) => {
		this.submitting = true;
		try {
			await agent.Activities.create(activity);
			const attendee = createAttendee(this.rootStore.userStore.user!);
			attendee.isHost = true;
			let attendees = [];
			attendees.push(attendee);
			activity.attendees = attendees;
			activity.isHost = true;
			runInAction("creating activity", () => {
				this.activityRegistry.set(activity.id, activity);
			});
			history.push(`/activities/${activity.id}`);
		} catch (err) {
			toast.error("Problem submitting data");
			console.log(err.response);
		} finally {
			runInAction("creating activity", () => {
				this.submitting = false;
			});
		}
	};

	@action editActivity = async (activity: IActivity) => {
		this.submitting = true;
		try {
			await agent.Activities.update(activity);
			runInAction("editing activity", () => {
				this.activityRegistry.set(activity.id, activity);
				this.activity = activity;
			});
			history.push(`/activities/${activity.id}`);
		} catch (err) {
			toast.error("Problem submitting data");
			console.log(err.response);
		} finally {
			runInAction("editing activity", () => {
				this.submitting = false;
			});
		}
	};

	@action deleteActivity = async (event: SyntheticEvent<HTMLButtonElement>, id: string) => {
		this.submitting = true;
		this.target = event.currentTarget.name;
		try {
			await agent.Activities.delete(id);
			runInAction("deleting activity", () => {
				this.activityRegistry.delete(id);
			});
		} catch (err) {
			console.log(err);
		} finally {
			runInAction("deleting activity", () => {
				this.submitting = false;
				this.target = "";
			});
		}
	};

	@action clearActivity = () => {
		this.activity = null;
	};

	@action attendActivity = async () => {
		const attendee = createAttendee(this.rootStore.userStore.user!);
		this.loading = true;
		try {
			await agent.Activities.attend(this.activity!.id);
			runInAction(() => {
				if (this.activity) {
					this.activity.attendees.push(attendee);
					this.activity.isGoing = true;
					this.activityRegistry.set(this.activity.id, this.activity);
				}
			});
		} catch (err) {
			toast.error("Problem signing up to activity");
		} finally {
			runInAction(() => (this.loading = false));
		}
	};

	@action cancelAttendance = async () => {
		this.loading = true;
		try {
			await agent.Activities.unattend(this.activity!.id);
			runInAction(() => {
				if (this.activity) {
					this.activity.attendees = this.activity.attendees.filter(
						a => a.username !== this.rootStore.userStore.user!.username
					);
					this.activity.isGoing = false;
					this.activityRegistry.set(this.activity.id, this.activity);
				}
			});
		} catch (err) {
			toast.error("Problem cancelling attendance");
		} finally {
			runInAction(() => (this.loading = false));
		}
	};
}
