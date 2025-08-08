/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function handler(req: { query: { url: any; }; }, res: { status: (arg0: number) => { (): any; new(): any; json: { (arg0: any): void; new(): any; }; }; }) {
  const { url } = req.query;
  const response = await fetch(url as string);
  const data = await response.json();
  res.status(200).json(data);
}