export interface Bindings {
  DB: D1Database;
  ASSETS: R2Bucket;
  ALLOWED_ORIGINS: string;
}

export type Variables = { requestId: string };
export type AppEnv = { Bindings: Bindings; Variables: Variables };
