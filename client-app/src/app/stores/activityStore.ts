import { observable, action, computed, runInAction, reaction, toJS } from "mobx";
import { IActivity } from "../models/activity";
import agent from "../api/agent";
import { history } from "../..";
import { toast } from "react-toastify";
import { RootStore } from "./rootStore";
import { setActivityProps } from "../common/util/util";
import { createAttendee } from "../common/util/util";
import { HubConnection, HubConnectionBuilder, LogLevel } from "@microsoft/signalr";

const LIMIT = 3;

export default class ActivityStore {
	rootStore: RootStore;

	constructor(rootStore: RootStore) {
		this.rootStore = rootStore;

		reaction(
			() => this.predicate.keys(),
			() => {
				this.page = 0;
				this.activityRegistry.clear();
				this.loadActivities();
			}
		);
	}

	@observable activityRegistry = new Map();
	@observable loadingInitial = false;
	@observable activity: IActivity | null = null;
	@observable submitting = false;
	@observable target = "";
	@observable loading = false;
	@observable.ref hubConnection: HubConnection | null = null;
	@observable activityCount = 0;
	@observable page = 0;
	@observable predicate = new Map();

	@computed get axiosParams() {
		const params = new URLSearchParams();
		params.append("limit", LIMIT.toString());
		params.append("offset", `${this.page ? this.page * LIMIT : 0}`);
		this.predicate.forEach((value, key) => {
			if (key === "startDate") params.append(key, value.toISOString());
			else params.append(key, value);
		});
		return params;
	}

	@action setPredicate = (predicate: string, value: string | Date) => {
		this.predicate.clear();
		if (predicate !== "all") this.predicate.set(predicate, value);
	};

	@computed get totalPages() {
		return Math.ceil(this.activityCount / LIMIT);
	}

	@action setPage = (page: number) => {
		this.page = page;
	};

	@action createHubConnection = (activityId: string) => {
		this.hubConnection = new HubConnectionBuilder()
			.withUrl(process.env.REACT_APP_API_CHAT_URL!, {
				accessTokenFactory: () => this.rootStore.commonStore.token!
			})
			.configureLogging(LogLevel.Error)
			.build();

		this.hubConnection
			.start()
			.then(() => {
				if (this.hubConnection!.state === "Connected") this.hubConnection!.invoke("AddToGroup", activityId);
			})
			.catch(err => console.log("Error establishing hub connection: ", err));

		this.hubConnection.on("ReceiveComment", comment => {
			runInAction(() => this.activity!.comments.push(comment));
		});
	};

	@action stopHubConnection = () => {
		this.hubConnection!.invoke("RemoveFromGroup", this.activity!.id)
			.then(() => {
				runInAction(() => this.hubConnection!.stop());
			})
			.catch(err => console.log(err));
	};

	@action addComment = async (values: any) => {
		if (!values.body) return;
		values.activityId = this.activity!.id;
		try {
			await this.hubConnection!.invoke("SendComment", values);
		} catch (err) {
			toast.error("Problem adding reply");
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
			const activitiesEnvelope = await agent.Activities.list(this.axiosParams);
			const { activities, activityCount } = activitiesEnvelope;
			runInAction("loading activities", () => {
				activities.forEach(activity => {
					setActivityProps(activity, this.rootStore.userStore.user!);
					this.activityRegistry.set(activity.id, activity);
				});
				this.activityCount = activityCount;
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
			return toJS(activity);
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
			activity.comments = [];
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

	@action deleteActivity = async () => {
		this.loading = true;
		try {
			await agent.Activities.delete(this.activity!.id);
			runInAction("deleting activity", () => this.activityRegistry.delete(this.activity!.id));
			history.push("/activities");
		} catch (err) {
			toast.error("Problem deleting activity");
			console.log(err);
		} finally {
			runInAction("deleting activity", () => (this.loading = false));
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
