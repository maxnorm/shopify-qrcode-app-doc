import {json} from "@remix-run/node";
import invariant from "tiny-invariant";
import { useLoaderData } from "@remix-run/react";

import db from "../db.server";
import { getQRCodeImage } from "app/models/QRCode.server";

export const loader = async ({params} : {params: any}) => {
  const error = "Could not find QR code destination";

  invariant(params.id, error);

  const id = Number(params.id);
  const qrCode = await db.qRCode.findFirst({where: {id}})

  invariant(qrCode, error);

  return json({
    title: qrCode.title,
    image: await getQRCodeImage(id)
  });
};

export default function QRCode() {
  const {image, title} = useLoaderData<{image: string, title: string}>()

  return (
    <>
      <h1>{title}</h1>
      <img src={image} alt={`QR code for ${title}`}/>
    </>
  )
}


