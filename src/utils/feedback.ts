type Msg = {
  success: (content: string) => void;
  info: (content: string) => void;
  warning: (content: string) => void;
  error: (content: string) => void;
};

let instance: Msg | null = null;

export function bindMessage(m: Msg) {
  instance = m;
}

export const toast: Msg = {
  success: (c) => instance?.success(c),
  info: (c) => instance?.info(c),
  warning: (c) => instance?.warning(c),
  error: (c) => instance?.error(c),
};
