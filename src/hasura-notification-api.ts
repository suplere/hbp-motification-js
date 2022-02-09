import axios, { AxiosInstance } from "axios";
import {
  DeleteNotificationResponse,
  GenerateVAPIDKeysResponse,
  SetWebPusNotificationPayload,
  Tags,
  UpdatNotificationTagsParams,
  User,
  UserEmailNotificationResponse,
  UserNotifications,
  UserSubscriptionResponse,
} from "./utils/types";

export class HasuraNotificationApi {
  private url: string;
  private httpClient: AxiosInstance;
  private accessToken: string | undefined = undefined;
  private appId: string | null;
  private user: User | null = null;

  constructor({ url, appId }: { url: string; appId: string | null }) {
    this.url = url;
    this.appId = appId;

    this.httpClient = axios.create({
      baseURL: `${this.url}/custom/notification`,
      timeout: 10000,
      headers: {
        ...this.generateApplicationHeaders(),
        ...this.generateAuthHeaders(),
      },
    });
  }

  public async generateVAPIDKeys(): Promise<GenerateVAPIDKeysResponse> {
    try {
      const res = await this.httpClient.get("/generateVAPIDKeys");
      return {
        data: res.data,
        error: null,
      };
    } catch (error) {
      return {
        data: null,
        error: error,
      };
    }
  }

  public async getUserNotifications(): Promise<UserNotifications> {
    if (!this.accessToken) {
      return { users_email: null, webpushes: [] };
    }
    try {
      const res = await this.httpClient.get("/getUserNotifications");
      return {
        users_email: res.data.users_email,
        webpushes: res.data.webpushed,
      };
    } catch (error) {
      return { users_email: null, webpushes: [] };
    }
  }

  public async setWebPushNotification(
    params: SetWebPusNotificationPayload
  ): Promise<UserSubscriptionResponse | null> {
    if (!this.accessToken) {
      return { subscription: null, error: new Error("User not authenticated") };
    }
    try {
      const res = await this.httpClient.post(
        "/setUserWebPushNotifications",
        params
      );
      return { subscription: res.data, error: null };
    } catch (error) {
      return { subscription: null, error };
    }
  }

  public async setEmailNotification(
    tags: Tags
  ): Promise<UserEmailNotificationResponse> {
    if (!this.accessToken || !this.user) {
      return { subscription: null, error: new Error("User not authenticated") };
    }
    const { email } = this.user;
    try {
      const res = await this.httpClient.post("/setUserEmailNotifications", {
        email,
        tags,
      });
      return { subscription: res.data, error: null };
    } catch (error) {
      return { subscription: null, error };
    }
  }

  public async deleteWebPushNotification(
    id: string
  ): Promise<DeleteNotificationResponse> {
    if (!this.accessToken) {
      return { deletedId: null, error: new Error("User not authenticated") };
    }
    try {
      const res = await this.httpClient.post(
        "/deleteUserWebPushNotifications",
        { id }
      );
      return { deletedId: res.data.id, error: null };
    } catch (error) {
      return { deletedId: null, error };
    }
  }

  public async deleteEmailNotification(
    id: string
  ): Promise<DeleteNotificationResponse> {
    if (!this.accessToken) {
      return { deletedId: null, error: new Error("User not authenticated") };
    }
    try {
      const res = await this.httpClient.post("/deleteUserEmailNotifications", {
        id,
      });
      return { deletedId: res.data.id, error: null };
    } catch (error) {
      return { deletedId: null, error };
    }
  }

  public async updateTagsWebPushNotification(
    params: UpdatNotificationTagsParams
  ): Promise<UserSubscriptionResponse> {
    if (!this.accessToken) {
      return { subscription: null, error: new Error("User not authenticated") };
    }
    try {
      const res = await this.httpClient.post(
        "/setTagsUserWebPushNotifications",
        params
      );
      return { subscription: res.data, error: null };
    } catch (error) {
      return { subscription: null, error };
    }
  }

  public async updateTagsEmailNotification(
    params: UpdatNotificationTagsParams
  ): Promise<UserEmailNotificationResponse> {
    if (!this.accessToken) {
      return { subscription: null, error: new Error("User not authenticated") };
    }
    try {
      const res = await this.httpClient.post(
        "/setTagsUserEmailNotifications",
        params
      );
      return { subscription: res.data, error: null };
    } catch (error) {
      return { subscription: null, error };
    }
  }

  public setAccessToken(accessToken: string | undefined) {
    this.accessToken = accessToken;
  }

  public setCurrentUser(user: User | null): void {
    this.user = user;
  }

  private generateAuthHeaders() {
    if (!this.accessToken) {
      return null;
    }

    return {
      Authorization: `Bearer ${this.accessToken}`,
    };
  }

  private generateApplicationHeaders() {
    if (!this.appId) {
      return null;
    }

    return {
      applicationid: this.appId,
    };
  }
}
