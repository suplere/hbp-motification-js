export type VAPIDKeys = {
  public_key: string;
  private_key: string;
};

export type User = {
  id: string;
  createdAt: string;
  display_name: string;
  avatar_url: string;
  email?: string;
  defaultRole: string;
  roles: {
    [key: string]: string;
  };
};

export type GenerateVAPIDKeysResponse = {
  data: VAPIDKeys | null;
  error: Error | null;
};

export interface Tags {
  [key: string]: string | number | boolean;
}

export type Subscription = {
  endpoint: string;
  expirationTime?: number;
  keys: {
    auth: string;
    p256dh: string;
  };
};

export enum Browser {
  Safari = "safari",
  Firefox = "firefox",
  Chrome = "chrome",
  Opera = "opera",
  Edge = "edge",
  Other = "other",
}

export type EnvironmentInfo = {
  browserType: Browser;
  browserVersion: number;
  isHttps: boolean;
  isBrowserAndSupportsServiceWorkers: boolean;
  requiresUserInteraction: boolean;
  osName: string;
  osVersion: string | number;
  canTalkToServiceWorker: boolean;
};

export interface UserSubscription {
  id: string;
  subscription: Subscription;
  enviromentInfo?: EnvironmentInfo;
  tags?: Tags;
  segments?: string[];
}

export type UserEmail = {
  id: string;
  email: string;
  tags?: Tags;
  segments?: string[];
};

export type UserNotifications = {
  users_email: UserEmail | null;
  webpushes: UserSubscription[];
};

export type SetWebPusNotificationPayload = {
  subscription: PushSubscription;
  enviromentInfo: EnvironmentInfo;
  tags: Tags;
};

export type UserSubscriptionResponse = {
  subscription: UserSubscription | null;
  error: Error | null;
};

export type SetEmailNotificationPayload = {
  email: string;
  tags: Tags;
};

export type UserEmailNotificationResponse = {
  subscription: UserEmail | null;
  error: Error | null;
};

export type DeleteNotificationResponse = {
  deletedId: string | null;
  error: Error | null;
};

export type UpdatNotificationTagsParams = {
  id: string;
  tags: Tags;
};
