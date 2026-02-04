// LIFF (LINE Front-end Framework) Type Definitions

export interface LiffProfile {
  userId: string;
  displayName: string;
  pictureUrl?: string;
  statusMessage?: string;
}

export interface LiffDecodedProfile {
  amr: string[];
  aud: string;
  email?: string;
  exp: number;
  iat: number;
  iss: string;
  name: string;
  picture?: string;
  sub: string;
}

export interface LiffContext {
  type: 'utou' | 'room' | 'group' | 'none' | 'square_chat' | 'external';
  viewType: 'compact' | 'tall' | 'full';
  userId?: string;
  utouId?: string;
  roomId?: string;
  groupId?: string;
  permanentLinkPattern?: string;
  availability?: {
    shareTargetPicker?: {
      permission: boolean;
      minVer: string;
    };
  };
}

export interface LiffObject {
  init: (config: { liffId: string }) => Promise<void>;
  ready: Promise<void>;
  isInClient: () => boolean;
  isLoggedIn: () => boolean;
  login: (config?: { redirectUri?: string }) => void;
  logout: () => void;
  getProfile: () => Promise<LiffProfile>;
  getDecodedIDToken: () => LiffDecodedProfile | null;
  getAccessToken: () => string | null;
  getContext: () => LiffContext | null;
  openWindow: (params: { url: string; external?: boolean }) => void;
  closeWindow: () => void;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  shareTargetPicker: (messages: any[]) => Promise<any>;
  scanCode: () => Promise<{ value: string | null }>;
  permanentLink: {
    createUrl: () => string;
  };
}

declare global {
  interface Window {
    liff?: LiffObject;
  }
}

export { };
