import { HasuraNotificationApi } from "./hasura-notification-api";
import { EnvironmentInfoHelper } from "./utils/enviroment";
import {
  EnvironmentInfo,
  SetWebPusNotificationPayload,
  Tags,
  UpdatNotificationTagsParams,
  User,
  UserEmail,
  UserSubscription,
} from "./utils/types";
import { addTags, deleteTags, urlBase64ToUint8Array } from "./utils/utils";

export class HasuraNotificationClient {
  private url: string;
  private api: HasuraNotificationApi;
  private appId: string | null;
  private userSubscriptions: UserSubscription[] = [];
  private userEmailNotification: UserEmail | null;
  private activeSubscription: UserSubscription | null;
  private currentSubscription: PushSubscription | null;
  private environment: EnvironmentInfo;
  private publicVapidKey: string;

  constructor({
    url,
    appId = null,
    publicVapidKey,
  }: {
    url: string;
    appId?: string | null;
    publicVapidKey: string;
  }) {
    if (!publicVapidKey) {
      throw new Error("You must provide publicVapidKey!");
    }
    this.url = url;
    this.appId = appId;
    this.api = new HasuraNotificationApi({ url: this.url, appId: this.appId });
    this.currentSubscription = null;

    this.userEmailNotification = null;
    this.userSubscriptions = [];
    this.environment = EnvironmentInfoHelper.getEnvironmentInfo();
    this.publicVapidKey = publicVapidKey;
    this.getSubscription().then((subs: PushSubscription | null) => {
      this.currentSubscription = subs;
    });

    this.getUserNotifications();
  }

  private async getSubscription(): Promise<null | PushSubscription> {
    if (!("serviceWorker" in navigator)) return null;

    const registration = await navigator.serviceWorker.ready;

    // Subscribe to push notifications
    const subscription: PushSubscription =
      await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(this.publicVapidKey),
      });

    return subscription;
  }

  public async getUserNotifications(): Promise<void> {
    try {
      const { users_email, webpushes } = await this.api.getUserNotifications();
      this.userEmailNotification = users_email;
      this.userSubscriptions = webpushes;
      if (this.currentSubscription) {
        this.activeSubscription = this.userSubscriptions.find(
          (us: UserSubscription) =>
            us.subscription.endpoint === this.currentSubscription.endpoint
        );
      } else {
        this.activeSubscription = null;
      }
    } catch (error) {
      this.userSubscriptions = [];
      this.activeSubscription = null;
    }
  }

  public getCurrentSubscription(): PushSubscription | null {
    return this.currentSubscription;
  }

  public isReadyForWebPush(): boolean {
    return this.currentSubscription ? true : false;
  }

  public getEnvironment(): EnvironmentInfo {
    return this.environment;
  }

  public getUserEmailNotification(): UserEmail | null {
    return this.userEmailNotification;
  }

  public getUserSubscription(): UserSubscription | null {
    return this.activeSubscription;
  }

  public getEmailTags(): Tags {
    return this.userEmailNotification ? this.userEmailNotification.tags : {};
  }

  public getWebPusTags(): Tags {
    return this.activeSubscription ? this.activeSubscription.tags : {};
  }

  public async setWebPushNotification(
    tags: Tags = {}
  ): Promise<UserSubscription> {
    if (!this.currentSubscription) return null;
    if (this.activeSubscription) return this.activeSubscription;
    const param: SetWebPusNotificationPayload = {
      enviromentInfo: this.environment,
      subscription: this.currentSubscription,
      tags,
    };
    try {
      const res = await this.api.setWebPushNotification(param);
      if (!res.error) {
        this.activeSubscription = res.subscription;
        this.userSubscriptions.push(res.subscription);
        return res.subscription;
      } else {
        console.error(res.error);
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  public async setEmailNotification(tags: Tags = {}): Promise<UserEmail> {
    if (this.userEmailNotification) return this.userEmailNotification;
    try {
      const res = await this.api.setEmailNotification(tags);
      if (!res.error) {
        this.userEmailNotification = res.subscription;
        return res.subscription;
      } else {
        console.error(res.error);
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  public async deleteWebPushNotification() {
    if (!this.activeSubscription) return null;
    let id = this.activeSubscription.id;
    try {
      const res = await this.api.deleteWebPushNotification(id);
      if (!res.error) {
        id = res.deletedId;
        this.userSubscriptions = this.userSubscriptions.filter(
          (us) => us.id !== id
        );
        this.activeSubscription = null;
      } else {
        console.error(res.error);
      }
    } catch (error) {
      console.error(error);
    }
  }

  public async deleteEmailNotification() {
    if (!this.userEmailNotification) return null;
    let id = this.userEmailNotification.id;
    try {
      const res = await this.api.deleteEmailNotification(id);
      if (!res.error) {
        this.userEmailNotification = null;
      } else {
        console.error(res.error);
      }
    } catch (error) {
      console.error(error);
    }
  }

  /* This overwrite all tags for current user */
  public async setTagsWebPushNotification(
    tags: Tags = {}
  ): Promise<UserSubscription | null> {
    if (!this.activeSubscription) return null;
    const { id } = this.activeSubscription;
    const params: UpdatNotificationTagsParams = {
      id,
      tags,
    };
    try {
      const res = await this.api.updateTagsWebPushNotification(params);
      if (!res.error) {
        this.userSubscriptions = this.userSubscriptions.filter(
          (us) => us.id !== res.subscription.id
        );
        this.userSubscriptions.push(res.subscription);
        this.activeSubscription = res.subscription;
        return res.subscription;
      } else {
        console.error(res.error);
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /* This add tags for current user */
  public async addTagsWebPushNotification(
    tagsToAdd: Tags = {}
  ): Promise<UserSubscription | null> {
    if (!this.activeSubscription) return null;
    const id = this.activeSubscription.id;
    const tags = addTags(this.activeSubscription.tags, tagsToAdd);
    const params: UpdatNotificationTagsParams = {
      id,
      tags,
    };
    try {
      const res = await this.api.updateTagsWebPushNotification(params);
      if (!res.error) {
        this.userSubscriptions = this.userSubscriptions.filter(
          (us) => us.id !== res.subscription.id
        );
        this.userSubscriptions.push(res.subscription);
        this.activeSubscription = res.subscription;
        return res.subscription;
      } else {
        console.error(res.error);
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /* This delete tags for current user */
  public async deleteTagsWebPushNotification(
    tagsToDelete: Tags = {}
  ): Promise<UserSubscription | null> {
    if (!this.activeSubscription) return null;
    const id = this.activeSubscription.id;
    const tags = deleteTags(this.activeSubscription.tags, tagsToDelete);
    const params: UpdatNotificationTagsParams = {
      id,
      tags,
    };
    try {
      const res = await this.api.updateTagsWebPushNotification(params);
      if (!res.error) {
        this.userSubscriptions = this.userSubscriptions.filter(
          (us) => us.id !== res.subscription.id
        );
        this.userSubscriptions.push(res.subscription);
        this.activeSubscription = res.subscription;
        return res.subscription;
      } else {
        console.error(res.error);
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /* This overwrite all tags for current user */
  public async setTagsEmailNotification(
    tags: Tags = {}
  ): Promise<UserEmail | null> {
    if (!this.userEmailNotification) return null;
    const { id } = this.userEmailNotification;
    const params: UpdatNotificationTagsParams = {
      id,
      tags,
    };
    try {
      const res = await this.api.updateTagsEmailNotification(params);
      if (!res.error) {
        this.userEmailNotification = res.subscription;
        return res.subscription;
      } else {
        console.error(res.error);
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /* This add tags for current user */
  public async addTagsEmailNotification(
    tagsToAdd: Tags = {}
  ): Promise<UserEmail | null> {
    if (!this.userEmailNotification) return null;
    const id = this.userEmailNotification.id;
    const tags = addTags(this.userEmailNotification.tags, tagsToAdd);
    const params: UpdatNotificationTagsParams = {
      id,
      tags,
    };
    try {
      const res = await this.api.updateTagsEmailNotification(params);
      if (!res.error) {
        this.userEmailNotification = res.subscription;
        return res.subscription;
      } else {
        console.error(res.error);
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  /* This add tags for current user */
  public async deleteTagsEmailNotification(
    tagsToDelete: Tags = {}
  ): Promise<UserEmail | null> {
    if (!this.userEmailNotification) return null;
    const id = this.userEmailNotification.id;
    const tags = deleteTags(this.userEmailNotification.tags, tagsToDelete);
    const params: UpdatNotificationTagsParams = {
      id,
      tags,
    };
    try {
      const res = await this.api.updateTagsEmailNotification(params);
      if (!res.error) {
        this.userEmailNotification = res.subscription;
        return res.subscription;
      } else {
        console.error(res.error);
        return null;
      }
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  public setAccessToken(accessToken: string | undefined): void {
    this.api.setAccessToken(accessToken);
  }

  public setCurrentUser(user: User | null): void {
    this.api.setCurrentUser(user);
  }
}
