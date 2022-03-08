import { Request, Response } from "express";
export default function handler(req: Request, res: Response) {
  // Get the tokenId from the query params
  const tokenId = req.query.tokenId;
  const image_url =
    "https://raw.githubusercontent.com/LearnWeb3DAO/NFT-Collection/main/my-app/public/cryptodevs/";

  res.status(200).json({
    name: "Wakulima #" + tokenId,
    description: "The farmers mart at NASATS Labs",
    image: image_url + tokenId + ".svg",
  });
}
