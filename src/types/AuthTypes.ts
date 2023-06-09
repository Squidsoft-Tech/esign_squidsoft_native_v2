import { UserTypes } from "./UserTypes";

export interface RegisterTypes {
  name: string;
  email: string;
  password: string;
  terms_accepted: boolean;
}

export interface LoginTypes {
  email: string;
  password: string;
  showPassword: boolean;
}

export interface LoginData {
  token: string;
  user: UserTypes;
}
