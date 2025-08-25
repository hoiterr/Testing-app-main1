import { IncomingMessage, ServerResponse } from 'http';

declare module 'next' {
  export interface NextApiRequest extends IncomingMessage {
    body: any;
    query: {
      [key: string]: string | string[] | undefined;
    };
    cookies: {
      [key: string]: string;
    };
  }

  export interface NextApiResponse<T = any> extends ServerResponse {
    status: (statusCode: number) => NextApiResponse<T>;
    json: (body: T) => void;
    send: (body: any) => void;
    redirect: (statusOrUrl: string | number, url?: string) => void;
    setHeader: (name: string, value: string | string[]) => void;
  }

  export type NextApiHandler<T = any> = (
    req: NextApiRequest,
    res: NextApiResponse<T>
  ) => void | Promise<void>;
}
