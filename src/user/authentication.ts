import { Injectable } from '../common/container';

interface AuthenticationItem {
  id: number;
  name: string;
}

interface AuthenticationUser {
  id: number;
  username: string;
  nickname: string;
  email: string;
  groups: AuthenticationItem[];
  authorities: AuthenticationItem[];
}

interface Authentication extends Injectable {
  user: AuthenticationUser;
  init?: () => Promise<void>;
  verify: () => boolean;
}

export default Authentication;

export {
  AuthenticationUser,
  AuthenticationItem
};
