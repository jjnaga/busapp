import { getHelloWorldText, getBubsText } from '@logic/hello';
import { Request, Response } from 'express';

const getHelloWorld = (req: Request, res: Response) => {
  const text = getHelloWorldText();
  const text2 = getBubsText();

  res.send(text + '\n' + text2);
};

export { getHelloWorld };
